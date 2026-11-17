"""High-level email triggers used by the routers. Emails are rendered from plain snapshots
while the DB session is open, then delivered in the background (see sender.py)."""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from .. import promo
from ..config import settings
from ..database import SessionLocal
from ..models import Cart, Order, Product, Review, User
from . import templates as t
from .sender import send, send_many

log = logging.getLogger("dermisque.mail")


def _safe(fn):
    """Email problems must never break checkout, forms or admin actions."""

    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception:  # noqa: BLE001
            log.exception("Could not queue email %s", fn.__name__)

    wrapper.__name__ = fn.__name__
    return wrapper


# ───────────── snapshots ─────────────
def order_snapshot(o: Order) -> dict:
    return {
        "number": o.order_number,
        "status": o.status,
        "payment_method": o.payment_method,
        "payment_status": o.payment_status,
        "subtotal": o.subtotal, "discount": o.discount, "shipping": o.shipping, "tax": o.tax, "total": o.total,
        "currency": o.currency or "USD",
        "fx_rate": o.fx_rate or 1.0,
        "address": o.address or {},
        "notes": o.notes,
        "tracking": o.tracking_number,
        "created_at": o.created_at,
        "customer_name": o.user.name if o.user else (o.address or {}).get("fullName", ""),
        "customer_email": o.user.email if o.user else "",
        "items": [{"name": i.name, "slug": i.slug, "image": i.image, "price": i.price, "quantity": i.quantity}
                  for i in o.items],
    }


def lines_snapshot(lines: list[tuple[Product, int]]) -> list[dict]:
    return [{"name": p.name, "slug": p.slug, "image": p.image,
             "price": promo.unit_price(p) if isinstance(p, Product) else p.price, "quantity": q} for p, q in lines]


# ───────────── triggers ─────────────
@_safe
def welcome(user: User):
    send(t.welcome(user.name, user.email))


@_safe
def newsletter(email: str):
    send(t.newsletter_welcome(email))


@_safe
def message(m: dict):
    send_many([t.message_received(m), t.admin_new_message(m)])


@_safe
def order_placed(o: Order):
    snap = order_snapshot(o)
    send_many([t.order_confirmation(snap), t.admin_new_order(snap)])


@_safe
def checkout_failed(user: User, reason: str, lines: list[tuple[Product, int]], currency: str, fx_rate: float,
                    payment: bool):
    d = {"name": user.name, "email": user.email, "reason": reason, "items": lines_snapshot(lines),
         "subtotal": sum(p.price * q for p, q in lines), "currency": currency, "fx_rate": fx_rate}
    send_many([t.payment_failed(d) if payment else t.order_failed(d), t.admin_payment_failed(d)])


@_safe
def order_status_changed(o: Order, old_status: str, old_payment: str, by: str = "admin"):
    snap = order_snapshot(o)
    mails = []
    if o.status != old_status:
        if o.status in ("PROCESSING", "SHIPPED", "DELIVERED"):
            mails.append(t.order_status(snap))
        elif o.status == "CANCELLED":
            mails.append(t.order_cancelled(snap, by=by))
            if by == "customer":
                mails.append(t.admin_order_cancelled(snap))
    elif o.payment_status == "REFUNDED" and old_payment != "REFUNDED":
        mails.append(t.order_refunded(snap))
    send_many(mails)


@_safe
def low_stock(db: Session, product_ids: list[str], before: dict[str, int]):
    """Alert once when a product crosses the low-stock threshold."""
    limit = settings.low_stock_threshold
    crossed = [
        p for p in db.scalars(select(Product).where(Product.id.in_(product_ids)))
        if p.stock <= limit < before.get(p.id, 0)
    ]
    if crossed:
        send(t.admin_low_stock([{"name": p.name, "stock": p.stock, "image": p.image, "slug": p.slug} for p in crossed]))


@_safe
def password_reset(user: User, link: str):
    send(t.password_reset(user.name, user.email, link))


@_safe
def password_changed(user: User):
    send(t.password_changed(user.name, user.email))


# ───────────── abandoned carts ─────────────
def _real_review(db: Session, product_ids: list[str]) -> dict | None:
    """A genuine approved 4-5 star review, preferring products in the bag."""
    base = (select(Review).where(Review.approved.is_(True), Review.rating >= 4)
            .order_by(Review.rating.desc(), Review.created_at.desc()))
    r = (db.scalar(base.where(Review.product_id.in_(product_ids)).limit(1)) if product_ids else None) or db.scalar(base.limit(1))
    if not r or len(r.body) < 20:
        return None
    parts = (r.user.name if r.user else "Customer").split()
    name = parts[0] + (f" {parts[-1][0]}." if len(parts) > 1 else "")
    body = r.body if len(r.body) <= 220 else r.body[:217].rsplit(" ", 1)[0] + "…"
    return {"body": body, "rating": r.rating, "name": name, "product": r.product.name if r.product else "Dermisque"}


def process_abandoned_carts() -> int:
    """Send due cart reminders. Safe to run from several workers (claims each send atomically)."""
    hours = settings.reminder_hours
    if not hours:
        return 0
    now = datetime.now(timezone.utc)
    sent = 0
    with SessionLocal() as db:
        carts = db.scalars(select(Cart).where(Cart.reminders_sent < len(hours))).all()
        for cart in carts:
            step = cart.reminders_sent
            updated = cart.updated_at if cart.updated_at.tzinfo else cart.updated_at.replace(tzinfo=timezone.utc)
            if not cart.items or now - updated < timedelta(hours=hours[step]):
                continue
            user = db.get(User, cart.user_id)
            qty = {i["id"]: int(i["quantity"]) for i in cart.items if i.get("id")}
            products = db.scalars(select(Product).where(Product.id.in_(qty), Product.is_active.is_(True))).all()
            lines = [(p, min(qty[p.id], max(p.stock, 1))) for p in products if p.stock > 0]
            # claim this reminder so concurrent workers never double-send
            claimed = db.execute(
                update(Cart).where(Cart.user_id == cart.user_id, Cart.reminders_sent == step)
                .values(reminders_sent=step + 1, last_reminder_at=now)
            ).rowcount
            db.commit()
            if not claimed or not user or not user.is_active or user.role == "ADMIN" or not lines:
                continue
            d = {"name": user.name, "email": user.email, "items": lines_snapshot(lines), "step": step,
                 "subtotal": sum(promo.unit_price(p) * q for p, q in lines), "currency": "USD", "fx_rate": 1.0,
                 "review": _real_review(db, [p.id for p, _ in lines])}
            try:
                send(t.cart_reminder(d))
                sent += 1
            except Exception:  # noqa: BLE001
                log.exception("Cart reminder for %s failed", user.email)
    return sent


# ───────────── previews (admin) ─────────────
def _sample_order(status="PROCESSING", payment="CARD", pay_status="PAID") -> dict:
    with SessionLocal() as db:
        products = db.scalars(select(Product).where(Product.is_active.is_(True)).limit(2)).all()
    items = [{"name": p.name, "slug": p.slug, "image": p.image, "price": p.price, "quantity": q}
             for p, q in zip(products, (2, 1))] or [
        {"name": "3X Vitamin C Face Serum", "slug": None, "image": "/products/vitamin-c.webp", "price": 2500, "quantity": 1}]
    sub = sum(i["price"] * i["quantity"] for i in items)
    return {
        "number": "DQ-SAMPLE01", "status": status, "payment_method": payment, "payment_status": pay_status,
        "subtotal": sub, "discount": round(sub * 0.25), "shipping": 0, "tax": 0, "total": sub - round(sub * 0.25),
        "currency": "USD", "fx_rate": 1.0,
        "address": {"fullName": "Ava Thompson", "line1": "1401 21st Street", "line2": "Suite R", "city": "Sacramento",
                    "state": "CA", "postalCode": "95811", "country": "United States", "phone": "+1 555 0100"},
        "notes": "Please leave the parcel at the front desk.", "tracking": "1Z 999 AA1 0123 4567",
        "created_at": datetime.now(timezone.utc), "customer_name": "Ava Thompson", "customer_email": "ava@example.com",
        "items": items,
    }


_MSG = {"type": "CONSULTATION", "name": "Ava Thompson", "email": "ava@example.com", "phone": "+1 555 0100",
        "subject": None, "skin_type": "Combination", "concern": "Dark spots & uneven tone",
        "message": "Hi! I have some pigmentation on my cheeks after summer. Which serum would you recommend, "
                   "and can I combine it with retinol?"}


def _sample_fail():
    o = _sample_order()
    return {"name": "Ava Thompson", "email": "ava@example.com", "reason": "Your card was declined",
            "items": o["items"], "subtotal": o["subtotal"], "currency": "USD", "fx_rate": 1.0}


def _sample_cart(step: int):
    with SessionLocal() as db:
        d = _sample_fail() | {"step": step, "review": _real_review(db, [])}
    return d


PREVIEWS: dict[str, tuple[str, str, object]] = {
    # key: (name, audience, factory(inline) -> Email)
    "welcome": ("Welcome / account created", "Customer", lambda i: t.welcome("Ava Thompson", "ava@example.com", inline=i)),
    "newsletter_welcome": ("Newsletter welcome", "Customer", lambda i: t.newsletter_welcome("ava@example.com", inline=i)),
    "message_received": ("Form received (consultation / contact)", "Customer", lambda i: t.message_received(_MSG, inline=i)),
    "order_confirmation": ("Order confirmation", "Customer", lambda i: t.order_confirmation(_sample_order(), inline=i)),
    "payment_failed": ("Payment failed", "Customer", lambda i: t.payment_failed(_sample_fail(), inline=i)),
    "order_failed": ("Order unsuccessful", "Customer",
                     lambda i: t.order_failed(_sample_fail() | {"reason": "3X Vitamin C Face Serum just sold out"}, inline=i)),
    "order_processing": ("Order processing", "Customer", lambda i: t.order_status(_sample_order("PROCESSING"), inline=i)),
    "order_shipped": ("Order shipped", "Customer", lambda i: t.order_status(_sample_order("SHIPPED"), inline=i)),
    "order_delivered": ("Order delivered + review ask", "Customer", lambda i: t.order_status(_sample_order("DELIVERED"), inline=i)),
    "order_cancelled": ("Order cancelled", "Customer",
                        lambda i: t.order_cancelled(_sample_order("CANCELLED", pay_status="REFUNDED"), inline=i)),
    "order_refunded": ("Refund issued", "Customer", lambda i: t.order_refunded(_sample_order(pay_status="REFUNDED"), inline=i)),
    "cart_reminder_1": ("Abandoned cart — 1st reminder", "Customer", lambda i: t.cart_reminder(_sample_cart(0), inline=i)),
    "cart_reminder_2": ("Abandoned cart — 2nd reminder", "Customer", lambda i: t.cart_reminder(_sample_cart(1), inline=i)),
    "password_reset": ("Password reset", "Customer",
                       lambda i: t.password_reset("Ava Thompson", "ava@example.com", f"{settings.site_url}/reset-password?token=sample", inline=i)),
    "password_changed": ("Password changed", "Customer", lambda i: t.password_changed("Ava Thompson", "ava@example.com", inline=i)),
    "admin_new_order": ("New order", "Admin", lambda i: t.admin_new_order(_sample_order(), inline=i)),
    "admin_new_message": ("New form submission", "Admin", lambda i: t.admin_new_message(_MSG, inline=i)),
    "admin_payment_failed": ("Failed checkout", "Admin", lambda i: t.admin_payment_failed(_sample_fail(), inline=i)),
    "admin_order_cancelled": ("Order cancelled by customer", "Admin",
                              lambda i: t.admin_order_cancelled(_sample_order("CANCELLED", pay_status="REFUNDED"), inline=i)),
    "admin_low_stock": ("Low stock alert", "Admin", lambda i: t.admin_low_stock(
        [{"name": "3X Vitamin C Face Serum", "stock": 3, "image": "/products/vitamin-c.webp"},
         {"name": "24KT Gold Face Serum", "stock": 0, "image": "/products/gold-serum.jpg"}], inline=i)),
}
