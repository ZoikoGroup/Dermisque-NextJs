import re
from dataclasses import dataclass
import secrets
import time
from calendar import monthrange
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from .. import payments, promo
from ..config import settings
from ..currency import rates
from ..database import get_db
from ..emails import notify
from ..models import Address, Cart, Coupon, Order, OrderItem, Product, User
from ..pricing import CouponError, compute_totals, find_valid_coupon
from ..schemas import (
    CardIn, CartLine, CheckoutIn, CouponApplied, CouponCheckIn, Ok, OrderOut, PaymentIntentIn, PaymentIntentOut,
)
from ..security import get_current_user, get_optional_user
from ..serializers import order_out

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


@router.post("/coupon", response_model=CouponApplied)
def check_coupon(
    body: CouponCheckIn, user: User | None = Depends(get_optional_user), db: Session = Depends(get_db)
):
    try:
        c = find_valid_coupon(db, body.code, body.subtotal, user.id if user else None)
    except CouponError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return CouponApplied.model_validate(c)


DECLINES = {"Your card was declined", "This card has expired"}


def charge_card(card: CardIn) -> str | None:
    """Demo payment processor, used only when Stripe keys are not configured.
    Card 4000 0000 0000 0002 simulates a decline."""
    digits = re.sub(r"\D", "", card.number)
    if not 13 <= len(digits) <= 19:
        return "Card number looks incomplete"
    m = re.fullmatch(r"\s*(\d{2})\s*/\s*(\d{2})\s*", card.expiry)
    if not m:
        return "Expiry must be MM/YY"
    mm, yy = int(m.group(1)), 2000 + int(m.group(2))
    if not 1 <= mm <= 12:
        return "Expiry month is invalid"
    if datetime(yy, mm, monthrange(yy, mm)[1], 23, 59) < datetime.now():
        return "This card has expired"
    if not re.fullmatch(r"\d{3,4}", card.cvc):
        return "CVC is invalid"
    if digits == "4000000000000002":
        return "Your card was declined"
    return None


@dataclass
class PricedLine:
    product_id: str | None
    bundle_key: str | None
    name: str
    slug: str | None
    image: str
    price: int  # unit price charged, USD cents


def _order_number() -> str:
    t = format(int(time.time() * 1000), "X")[-5:]
    return f"DQ-{t}{secrets.token_hex(2).upper()}"


@router.get("/payment-config")
def payment_config():
    """Tells the storefront which card processor to show. The publishable key is public by design."""
    if settings.stripe_enabled:
        return {"provider": "stripe", "publishableKey": settings.stripe_publishable_key}
    return {"provider": "demo", "publishableKey": None}


@dataclass
class PricedCart:
    lines: list[tuple[PricedLine, int]]
    need: dict[str, int]  # product id -> units to take from stock
    by_id: dict[str, Product]
    coupon: Coupon | None
    totals: dict


def _price_cart(db: Session, items: list[CartLine], user_id: str, coupon_code: str | None) -> PricedCart:
    """Merge duplicate lines and re-price everything from the database (incl. live campaign prices)."""
    qty: dict[str, int] = {}
    for line in items:
        qty[line.id] = qty.get(line.id, 0) + line.quantity
    bundle_qty = {k[len(promo.BUNDLE_PREFIX):]: q for k, q in qty.items() if promo.is_bundle_id(k)}
    prod_qty = {k: q for k, q in qty.items() if not promo.is_bundle_id(k)}

    products = {
        p.id: p
        for p in db.scalars(select(Product).where(Product.id.in_(prod_qty), Product.is_active.is_(True))).all()
    }
    bundles = promo.resolve(db, list(bundle_qty)) if bundle_qty else {}
    need: dict[str, int] = {}
    by_id: dict[str, Product] = {}
    priced: list[tuple[PricedLine, int]] = []  # what the customer sees on the receipt
    for pid, q in prod_qty.items():
        p = products.get(pid)
        if not p:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "A product in your bag is no longer available")
        need[p.id] = need.get(p.id, 0) + q
        by_id[p.id] = p
        priced.append((PricedLine(p.id, None, p.name, p.slug, p.image, promo.unit_price(p)), q))
    for key, q in bundle_qty.items():
        rb = bundles.get(key)
        if not rb or not rb.complete:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "A Black Friday set in your bag is no longer available")
        if not promo.is_live():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{rb.bundle.name} is only available during Black Friday")
        for p in rb.products:
            need[p.id] = need.get(p.id, 0) + q
            by_id[p.id] = p
        priced.append((PricedLine(None, rb.bundle.key, rb.name, None, rb.bundle.image, rb.price), q))
    for pid, q in need.items():
        p = by_id[pid]
        if p.stock < q:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Only {p.stock} left of {p.name}")
    subtotal = sum(line.price * q for line, q in priced)

    coupon: Coupon | None = None
    if coupon_code:
        try:
            coupon = find_valid_coupon(db, coupon_code, subtotal, user_id)
        except CouponError as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return PricedCart(priced, need, by_id, coupon, compute_totals(subtotal, coupon))


@router.post("/payment-intent", response_model=PaymentIntentOut)
def create_payment_intent(
    body: PaymentIntentIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Prices the bag on the server and opens (or re-prices) a Stripe PaymentIntent for it."""
    if not settings.stripe_enabled:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Card payments are not set up")
    cart = _price_cart(db, body.items, user.id, body.coupon)
    amount = payments.to_minor(cart.totals["total"], rates()[body.currency])
    try:
        pi = payments.open_intent(amount, body.currency, user, body.payment_intent_id)
    except payments.PaymentError as e:
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, str(e))
    return PaymentIntentOut(client_secret=pi.client_secret, payment_intent_id=pi.id, amount=amount,
                            currency=body.currency)


@router.post("/payment-failed", response_model=Ok)
def payment_failed(body: PaymentIntentIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """The storefront reports a declined card; Stripe confirms it, then the customer and the store are emailed."""
    if settings.stripe_enabled and body.payment_intent_id:
        reason = payments.new_decline(body.payment_intent_id, user)
        if reason:
            lines = _price_cart(db, body.items, user.id, None).lines
            notify.checkout_failed(user, reason, lines, body.currency, rates()[body.currency], payment=True)
    return Ok()


@router.post("/orders", response_model=OrderOut, status_code=201)
def place_order(body: CheckoutIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = _price_cart(db, body.items, user.id, body.coupon)
    lines, need, by_id, coupon, totals = cart.lines, cart.need, cart.by_id, cart.coupon, cart.totals
    paid_ref: str | None = None

    if body.payment_method == "CARD" and settings.stripe_enabled:
        if not body.payment_intent_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Card payment is missing, please try again")
        if db.scalar(select(Order.id).where(Order.payment_ref == body.payment_intent_id)):
            raise HTTPException(status.HTTP_409_CONFLICT, "This payment has already been used for an order")
        expected = payments.to_minor(totals["total"], rates()[body.currency])
        try:
            payments.verify_paid(body.payment_intent_id, user, expected, body.currency)
        except payments.PaymentError as e:
            raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, str(e))
        paid_ref = body.payment_intent_id
    elif body.payment_method == "CARD":
        if not body.card:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Card details are required")
        err = charge_card(body.card)
        if err:
            if err in DECLINES:  # a real decline (not a typo) — tell the customer and the store
                notify.checkout_failed(user, err, lines, body.currency, rates()[body.currency], payment=True)
            raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, err)

    stock_before = {pid: by_id[pid].stock for pid in need}
    try:
        order = _create_order(body, user, db, lines, need, by_id, coupon, totals, paid_ref)
    except Exception:
        if paid_ref:  # the customer was charged but no order exists: give the money back
            db.rollback()
            payments.refund(paid_ref)
        raise
    notify.order_placed(order)
    notify.low_stock(db, list(stock_before), stock_before)
    return order_out(order)


def _create_order(body: CheckoutIn, user: User, db: Session, lines, need, by_id, coupon, totals, paid_ref) -> Order:
    # Atomic stock decrement guards against overselling under concurrency.
    for pid, q in need.items():
        p = by_id[pid]
        res = db.execute(
            update(Product).where(Product.id == p.id, Product.stock >= q).values(stock=Product.stock - q)
        )
        if res.rowcount == 0:
            db.rollback()
            reason = f"{p.name} just sold out"
            notify.checkout_failed(user, reason, lines, body.currency, rates()[body.currency], payment=False)
            raise HTTPException(status.HTTP_409_CONFLICT, reason)

    address = body.address.model_dump(by_alias=True, exclude={"is_default", "isDefault"})
    order = Order(
        order_number=_order_number(),
        user_id=user.id,
        status="PROCESSING" if body.payment_method == "CARD" else "PENDING",
        payment_method=body.payment_method,
        payment_status="PAID" if body.payment_method == "CARD" else "UNPAID",
        payment_ref=paid_ref,
        coupon_code=coupon.code if coupon else None,
        currency=body.currency,
        fx_rate=rates()[body.currency],
        address=address,
        notes=body.notes,
        items=[
            OrderItem(product_id=line.product_id, name=line.name, slug=line.slug, image=line.image,
                      price=line.price, quantity=q)
            for line, q in lines
        ],
        **totals,
    )
    db.add(order)
    if coupon:
        coupon.used_count += 1
    if body.save_address:
        has_any = db.scalar(select(Address.id).where(Address.user_id == user.id).limit(1))
        db.add(
            Address(
                user_id=user.id,
                **body.address.model_dump(exclude={"is_default"}),
                is_default=not has_any,
            )
        )
    db.execute(Cart.__table__.delete().where(Cart.user_id == user.id))  # bag is now an order
    db.commit()
    db.refresh(order)
    return order
