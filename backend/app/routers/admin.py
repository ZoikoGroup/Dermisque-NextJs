import re
import secrets
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import Field
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..config import settings
from ..database import get_db
from ..emails import notify
from ..models import Category, Coupon, Message, Order, OrderItem, Product, Review, Subscriber, User
from ..schemas import (
    AdminReviewOut,
    CategoryOut,
    CouponIn,
    CouponOut,
    CustomerOut,
    MessageOut,
    Ok,
    OrderOut,
    OrderUpdateIn,
    Page,
    ProductCard,
    ProductDetail,
    ProductIn,
    Schema,
    StatsOut,
    StatusIn,
)
from ..security import require_admin
from ..serializers import order_out, product_card, product_detail, review_out
from .account import restock

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])

_product_load = (selectinload(Product.categories), selectinload(Product.reviews).selectinload(Review.user))


def _slugify(s: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", s.lower().strip()))


# ───────────── Dashboard ─────────────
@router.get("/stats", response_model=StatsOut)
def stats(days: int = Query(30, ge=7, le=365), db: Session = Depends(get_db)):
    valid = Order.status != "CANCELLED"
    revenue = db.scalar(select(func.coalesce(func.sum(Order.total), 0)).where(valid)) or 0
    orders = db.scalar(select(func.count()).select_from(Order).where(valid)) or 0
    customers = db.scalar(select(func.count()).select_from(User).where(User.role == "USER")) or 0
    products = db.scalar(select(func.count()).select_from(Product).where(Product.is_active.is_(True))) or 0
    pending = db.scalar(
        select(func.count()).select_from(Order).where(Order.status.in_(["PENDING", "PROCESSING"]))
    ) or 0
    new_messages = db.scalar(select(func.count()).select_from(Message).where(Message.status == "NEW")) or 0

    since = datetime.now(timezone.utc) - timedelta(days=days - 1)
    since = since.replace(hour=0, minute=0, second=0, microsecond=0)
    recent = db.scalars(select(Order).where(valid, Order.created_at >= since)).all()
    by_day: dict[str, dict] = defaultdict(lambda: {"revenue": 0, "orders": 0})
    for o in recent:
        d = o.created_at.date().isoformat()
        by_day[d]["revenue"] += o.total
        by_day[d]["orders"] += 1
    series = []
    for i in range(days):
        d = (since + timedelta(days=i)).date().isoformat()
        series.append({"date": d, **by_day.get(d, {"revenue": 0, "orders": 0})})

    breakdown = Counter(db.scalars(select(Order.status)).all())

    top = db.execute(
        select(OrderItem.name, func.sum(OrderItem.quantity), func.sum(OrderItem.quantity * OrderItem.price))
        .join(Order)
        .where(valid)
        .group_by(OrderItem.name)
        .order_by(func.sum(OrderItem.quantity * OrderItem.price).desc())
        .limit(5)
    ).all()

    low = db.scalars(
        select(Product).where(Product.is_active.is_(True), Product.stock <= 15).options(*_product_load).limit(6)
    ).all()

    latest = db.scalars(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.user))
        .order_by(Order.created_at.desc())
        .limit(6)
    ).all()

    return StatsOut(
        revenue=revenue,
        orders=orders,
        customers=customers,
        products=products,
        avg_order_value=revenue // orders if orders else 0,
        pending_orders=pending,
        low_stock=[product_card(p, storefront=False) for p in low],
        new_messages=new_messages,
        revenue_by_day=series,
        status_breakdown=dict(breakdown),
        top_products=[{"name": n, "units": int(u), "revenue": int(r)} for n, u, r in top],
        recent_orders=[order_out(o, with_customer=True) for o in latest],
    )


# ───────────── Products ─────────────
@router.get("/products", response_model=list[ProductCard])
def admin_products(q: str | None = None, db: Session = Depends(get_db)):
    stmt = select(Product).options(*_product_load).order_by(Product.created_at.desc())
    if q:
        stmt = stmt.where(Product.name.ilike(f"%{q}%"))
    return [product_card(p, storefront=False) for p in db.scalars(stmt).all()]


@router.get("/products/{product_id}", response_model=ProductDetail)
def admin_product(product_id: str, db: Session = Depends(get_db)):
    p = db.scalar(select(Product).where(Product.id == product_id).options(*_product_load))
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return product_detail(p, include_unapproved=True, storefront=False)


def _apply_product(db: Session, p: Product, body: ProductIn):
    slug = _slugify(body.slug or body.name)
    clash = db.scalar(select(Product.id).where(Product.slug == slug, Product.id != (p.id or "")))
    if clash:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Slug '{slug}' is already used by another product")
    data = body.model_dump(exclude={"category_ids", "slug"})
    for k, v in data.items():
        setattr(p, k, v)
    p.slug = slug
    if not p.gallery:
        p.gallery = [p.image]
    p.categories = list(db.scalars(select(Category).where(Category.id.in_(body.category_ids))).all())


@router.post("/products", response_model=ProductDetail, status_code=201)
def create_product(body: ProductIn, db: Session = Depends(get_db)):
    p = Product()
    _apply_product(db, p, body)
    db.add(p)
    db.commit()
    return admin_product(p.id, db)


@router.put("/products/{product_id}", response_model=ProductDetail)
def update_product(product_id: str, body: ProductIn, db: Session = Depends(get_db)):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    _apply_product(db, p, body)
    db.commit()
    return admin_product(p.id, db)


@router.delete("/products/{product_id}", response_model=Ok)
def delete_product(product_id: str, db: Session = Depends(get_db)):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    db.delete(p)  # order history keeps its own name/price/image snapshot
    db.commit()
    return Ok()


ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif"}


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    ext = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if not ext:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Upload a JPG, PNG, WEBP or AVIF image")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image must be 5 MB or smaller")
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    name = f"{secrets.token_hex(8)}{ext}"
    (Path(settings.upload_dir) / name).write_bytes(data)
    return {"url": f"{settings.public_url.rstrip('/')}/uploads/{name}"}


# ───────────── Categories ─────────────
class CategoryIn(Schema):
    name: str = Field(min_length=2, max_length=80)
    slug: str | None = None
    description: str | None = None
    sort_order: int = 0


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(body: CategoryIn, db: Session = Depends(get_db)):
    slug = _slugify(body.slug or body.name)
    if db.scalar(select(Category).where(Category.slug == slug)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Category slug already exists")
    c = Category(name=body.name, slug=slug, description=body.description, sort_order=body.sort_order)
    db.add(c)
    db.commit()
    return CategoryOut.model_validate(c)


@router.delete("/categories/{category_id}", response_model=Ok)
def delete_category(category_id: str, db: Session = Depends(get_db)):
    c = db.get(Category, category_id)
    if c:
        db.delete(c)
        db.commit()
    return Ok()


# ───────────── Orders ─────────────
@router.get("/orders", response_model=Page[OrderOut])
def admin_orders(
    status_filter: str | None = Query(None, alias="status"),
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_db),
):
    stmt = select(Order).join(User)
    if status_filter:
        stmt = stmt.where(Order.status == status_filter)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Order.order_number.ilike(like), User.email.ilike(like), User.name.ilike(like)))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.options(selectinload(Order.items), selectinload(Order.user))
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return Page(items=[order_out(o, True) for o in rows], total=total, page=page, page_size=page_size)


def _get_order(db: Session, order_number: str) -> Order:
    o = db.scalar(
        select(Order)
        .where(Order.order_number == order_number)
        .options(selectinload(Order.items), selectinload(Order.user))
    )
    if not o:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return o


@router.get("/orders/{order_number}", response_model=OrderOut)
def admin_order(order_number: str, db: Session = Depends(get_db)):
    return order_out(_get_order(db, order_number), True)


@router.patch("/orders/{order_number}", response_model=OrderOut)
def update_order(order_number: str, body: OrderUpdateIn, db: Session = Depends(get_db)):
    o = _get_order(db, order_number)
    old_status, old_payment = o.status, o.payment_status
    if body.status and body.status != o.status:
        if o.status == "CANCELLED":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cancelled orders can't be reopened")
        if body.status == "CANCELLED":
            restock(db, o)
            if o.payment_status == "PAID":
                o.payment_status = "REFUNDED"
        if body.status == "DELIVERED" and o.payment_method == "COD":
            o.payment_status = "PAID"
        o.status = body.status
    if body.payment_status:
        o.payment_status = body.payment_status
    if body.tracking_number is not None:
        o.tracking_number = body.tracking_number or None
    db.commit()
    notify.order_status_changed(o, old_status, old_payment, by="admin")
    return order_out(o, True)


# ───────────── Customers ─────────────
@router.get("/customers", response_model=list[CustomerOut])
def customers(q: str | None = None, db: Session = Depends(get_db)):
    agg = (
        select(
            Order.user_id,
            func.count(Order.id).label("n"),
            func.coalesce(func.sum(Order.total), 0).label("spent"),
        )
        .where(Order.status != "CANCELLED")
        .group_by(Order.user_id)
        .subquery()
    )
    stmt = (
        select(User, agg.c.n, agg.c.spent)
        .outerjoin(agg, agg.c.user_id == User.id)
        .order_by(User.created_at.desc())
    )
    if q:
        stmt = stmt.where(or_(User.name.ilike(f"%{q}%"), User.email.ilike(f"%{q}%")))
    return [
        CustomerOut(
            id=u.id,
            name=u.name,
            email=u.email,
            phone=u.phone,
            role=u.role,
            created_at=u.created_at,
            order_count=n or 0,
            total_spent=spent or 0,
        )
        for u, n, spent in db.execute(stmt).all()
    ]


# ───────────── Coupons ─────────────
@router.get("/coupons", response_model=list[CouponOut])
def coupons(db: Session = Depends(get_db)):
    return db.scalars(select(Coupon).order_by(Coupon.created_at.desc())).all()


@router.post("/coupons", response_model=CouponOut, status_code=201)
def create_coupon(body: CouponIn, db: Session = Depends(get_db)):
    code = body.code.strip().upper()
    if db.scalar(select(Coupon).where(Coupon.code == code)):
        raise HTTPException(status.HTTP_409_CONFLICT, "A coupon with this code already exists")
    if body.type == "PERCENT" and body.value > 100:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Percent discount can't exceed 100")
    c = Coupon(**body.model_dump(exclude={"code"}), code=code)
    db.add(c)
    db.commit()
    return c


@router.put("/coupons/{coupon_id}", response_model=CouponOut)
def update_coupon(coupon_id: str, body: CouponIn, db: Session = Depends(get_db)):
    c = db.get(Coupon, coupon_id)
    if not c:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Coupon not found")
    for k, v in body.model_dump().items():
        setattr(c, k, v.strip().upper() if k == "code" else v)
    db.commit()
    return c


@router.delete("/coupons/{coupon_id}", response_model=Ok)
def delete_coupon(coupon_id: str, db: Session = Depends(get_db)):
    c = db.get(Coupon, coupon_id)
    if c:
        db.delete(c)
        db.commit()
    return Ok()


# ───────────── Messages ─────────────
@router.get("/messages", response_model=list[MessageOut])
def messages(type_filter: str | None = Query(None, alias="type"), db: Session = Depends(get_db)):
    stmt = select(Message).order_by(Message.created_at.desc())
    if type_filter:
        stmt = stmt.where(Message.type == type_filter)
    return db.scalars(stmt).all()


@router.patch("/messages/{message_id}", response_model=MessageOut)
def update_message(message_id: str, body: StatusIn, db: Session = Depends(get_db)):
    m = db.get(Message, message_id)
    if not m:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Message not found")
    if body.status not in ("NEW", "READ", "RESOLVED"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid status")
    m.status = body.status
    db.commit()
    return m


@router.delete("/messages/{message_id}", response_model=Ok)
def delete_message(message_id: str, db: Session = Depends(get_db)):
    m = db.get(Message, message_id)
    if m:
        db.delete(m)
        db.commit()
    return Ok()


# ───────────── Reviews ─────────────
@router.get("/reviews", response_model=list[AdminReviewOut])
def reviews(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Review)
        .options(selectinload(Review.user), selectinload(Review.product))
        .order_by(Review.created_at.desc())
    ).all()
    return [
        AdminReviewOut(**review_out(r).model_dump(), product_name=r.product.name, product_slug=r.product.slug)
        for r in rows
    ]


@router.patch("/reviews/{review_id}", response_model=Ok)
def toggle_review(review_id: str, db: Session = Depends(get_db)):
    r = db.get(Review, review_id)
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")
    r.approved = not r.approved
    db.commit()
    return Ok()


@router.delete("/reviews/{review_id}", response_model=Ok)
def delete_review(review_id: str, db: Session = Depends(get_db)):
    r = db.get(Review, review_id)
    if r:
        db.delete(r)
        db.commit()
    return Ok()


# ───────────── Subscribers ─────────────
@router.get("/subscribers")
def subscribers(db: Session = Depends(get_db)):
    rows = db.scalars(select(Subscriber).order_by(Subscriber.created_at.desc())).all()
    return [{"id": s.id, "email": s.email, "createdAt": s.created_at} for s in rows]
