from . import promo
from .models import Order, Product, Review
from .schemas import (
    CategoryRef,
    CustomerRef,
    OrderItemOut,
    OrderOut,
    ProductCard,
    ProductDetail,
    ReviewOut,
)


def _ratings(p: Product) -> tuple[float, int]:
    vals = [r.rating for r in p.reviews if r.approved]
    return (sum(vals) / len(vals), len(vals)) if vals else (0.0, 0)


def product_card(p: Product, storefront: bool = True) -> ProductCard:
    """storefront=True applies live campaign pricing; admin screens pass False to edit stored prices."""
    rating, count = _ratings(p)
    return ProductCard(
        id=p.id,
        slug=p.slug,
        name=p.name,
        tagline=p.tagline,
        price=promo.unit_price(p) if storefront else p.price,
        compare_at_price=promo.compare_price(p) if storefront else p.compare_at_price,
        image=p.image,
        stock=p.stock,
        featured=p.featured,
        is_active=p.is_active,
        rating=round(rating, 2),
        review_count=count,
        concerns=[c.name for c in sorted(p.categories, key=lambda c: c.sort_order)],
    )


def review_out(r: Review) -> ReviewOut:
    return ReviewOut(
        id=r.id,
        rating=r.rating,
        title=r.title,
        body=r.body,
        approved=r.approved,
        created_at=r.created_at,
        user_name=r.user.name if r.user else "Customer",
    )


def product_detail(p: Product, include_unapproved: bool = False, storefront: bool = True) -> ProductDetail:
    card = product_card(p, storefront)
    reviews = sorted(
        (r for r in p.reviews if include_unapproved or r.approved),
        key=lambda r: r.created_at,
        reverse=True,
    )
    return ProductDetail(
        **card.model_dump(),
        description=p.description,
        gallery=p.gallery or [p.image],
        ingredients=p.ingredients or [],
        benefits=p.benefits or [],
        how_to_use=p.how_to_use or [],
        faqs=p.faqs or [],
        size=p.size,
        categories=[CategoryRef.model_validate(c) for c in p.categories],
        reviews=[review_out(r) for r in reviews],
    )


def order_out(o: Order, with_customer: bool = False) -> OrderOut:
    return OrderOut(
        id=o.id,
        order_number=o.order_number,
        status=o.status,
        payment_method=o.payment_method,
        payment_status=o.payment_status,
        subtotal=o.subtotal,
        discount=o.discount,
        shipping=o.shipping,
        tax=o.tax,
        total=o.total,
        currency=o.currency or "USD",
        fx_rate=o.fx_rate or 1.0,
        coupon_code=o.coupon_code,
        address=o.address or {},
        notes=o.notes,
        tracking_number=o.tracking_number,
        created_at=o.created_at,
        updated_at=o.updated_at,
        items=[OrderItemOut.model_validate(i) for i in o.items],
        customer=CustomerRef.model_validate(o.user) if with_customer and o.user else None,
    )
