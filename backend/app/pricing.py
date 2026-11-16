from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import promo
from .config import settings
from .models import Coupon, Order


class CouponError(ValueError):
    pass


def compute_totals(subtotal: int, coupon: Coupon | None = None) -> dict:
    """Single source of truth for order totals (all amounts in cents)."""
    discount = 0
    if coupon and subtotal >= coupon.min_order:
        if coupon.type == "PERCENT":
            discount = round(subtotal * coupon.value / 100)
        else:
            discount = min(coupon.value, subtotal)
    shipping = 0 if subtotal == 0 or subtotal >= settings.free_shipping_threshold else settings.flat_shipping
    tax = round((subtotal - discount) * settings.tax_rate)
    return {
        "subtotal": subtotal,
        "discount": discount,
        "shipping": shipping,
        "tax": tax,
        "total": subtotal - discount + shipping + tax,
    }


def find_valid_coupon(db: Session, code: str, subtotal: int, user_id: str | None) -> Coupon:
    if promo.is_live():
        raise CouponError("Codes can't be combined with Black Friday prices — your sale discount is already applied")
    coupon = db.scalar(select(Coupon).where(Coupon.code == code.strip().upper()))
    if not coupon or not coupon.active:
        raise CouponError("This code isn't valid")
    if coupon.expires_at:
        exp = coupon.expires_at if coupon.expires_at.tzinfo else coupon.expires_at.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            raise CouponError("This code has expired")
    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        raise CouponError("This code has reached its usage limit")
    if subtotal < coupon.min_order:
        raise CouponError(f"Spend ${coupon.min_order / 100:.2f} or more to use this code")
    if coupon.first_order_only and user_id:
        prior = db.scalar(
            select(func.count()).select_from(Order).where(Order.user_id == user_id, Order.status != "CANCELLED")
        )
        if prior:
            raise CouponError("This code is for first orders only")
    return coupon
