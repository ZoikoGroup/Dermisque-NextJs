from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Category, Product, Review, User, product_categories
from ..schemas import CategoryOut, ProductCard, ProductDetail, ReviewIn, ReviewOut
from ..security import get_current_user
from ..serializers import product_card, product_detail, review_out

router = APIRouter(prefix="/api", tags=["catalog"])

_load = (selectinload(Product.categories), selectinload(Product.reviews).selectinload(Review.user))


@router.get("/categories", response_model=list[CategoryOut])
def categories(db: Session = Depends(get_db)):
    counts = dict(
        db.execute(
            select(product_categories.c.category_id, func.count())
            .join(Product, Product.id == product_categories.c.product_id)
            .where(Product.is_active.is_(True))
            .group_by(product_categories.c.category_id)
        ).all()
    )
    rows = db.scalars(select(Category).order_by(Category.sort_order)).all()
    return [
        CategoryOut(
            id=c.id,
            name=c.name,
            slug=c.slug,
            description=c.description,
            sort_order=c.sort_order,
            product_count=counts.get(c.id, 0),
        )
        for c in rows
    ]


@router.get("/products", response_model=list[ProductCard])
def list_products(
    q: str | None = None,
    concern: str | None = None,
    featured: bool | None = None,
    min_price: int | None = Query(None, alias="min", description="Minimum price in dollars"),
    max_price: int | None = Query(None, alias="max", description="Maximum price in dollars"),
    sort: Literal["featured", "price-asc", "price-desc", "newest", "name", "rating"] = "featured",
    limit: int = Query(100, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(Product).where(Product.is_active.is_(True)).options(*_load)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(Product.name.ilike(like), Product.description.ilike(like), Product.tagline.ilike(like))
        )
    if concern:
        stmt = stmt.where(Product.categories.any(Category.slug == concern))
    if featured is not None:
        stmt = stmt.where(Product.featured.is_(featured))
    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price * 100)
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price * 100)

    order = {
        "price-asc": Product.price.asc(),
        "price-desc": Product.price.desc(),
        "newest": Product.created_at.desc(),
        "name": Product.name.asc(),
    }.get(sort, Product.featured.desc())
    stmt = stmt.order_by(order, Product.created_at.asc()).limit(limit)

    cards = [product_card(p) for p in db.scalars(stmt).all()]
    if sort == "rating":
        cards.sort(key=lambda c: (c.rating, c.review_count), reverse=True)
    return cards


@router.get("/products/{slug}", response_model=ProductDetail)
def get_product(slug: str, db: Session = Depends(get_db)):
    p = db.scalar(select(Product).where(Product.slug == slug, Product.is_active.is_(True)).options(*_load))
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return product_detail(p)


@router.get("/products/{slug}/related", response_model=list[ProductCard])
def related(slug: str, limit: int = 4, db: Session = Depends(get_db)):
    p = db.scalar(select(Product).where(Product.slug == slug).options(selectinload(Product.categories)))
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    ids = [c.id for c in p.categories]
    stmt = select(Product).where(Product.is_active.is_(True), Product.id != p.id).options(*_load)
    if ids:
        stmt = stmt.where(Product.categories.any(Category.id.in_(ids)))
    rows = db.scalars(stmt.limit(limit)).all()
    return [product_card(r) for r in rows]


@router.post("/products/{slug}/reviews", response_model=ReviewOut, status_code=201)
def add_review(
    slug: str, body: ReviewIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    p = db.scalar(select(Product).where(Product.slug == slug))
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    if db.scalar(select(Review).where(Review.product_id == p.id, Review.user_id == user.id)):
        raise HTTPException(status.HTTP_409_CONFLICT, "You've already reviewed this product")
    r = Review(product_id=p.id, user_id=user.id, **body.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return review_out(r)
