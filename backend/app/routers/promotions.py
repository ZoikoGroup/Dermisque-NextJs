"""Public campaign data for the Black Friday landing page and home-page popup."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import promo
from ..config import settings
from ..database import get_db
from ..models import Product
from ..schemas import Schema

router = APIRouter(prefix="/api/promotions", tags=["promotions"])


class DealProduct(Schema):
    id: str
    slug: str
    name: str
    image: str
    regular_price: int
    price: int  # sale price (what Black Friday costs)
    stock: int


class DealBundle(Schema):
    id: str  # cart line id: "bundle:<key>"
    key: str
    kind: str
    name: str
    subtitle: str
    image: str
    badge: str | None
    items: list[DealProduct]
    regular_price: int
    price: int
    stock: int


class BlackFridayOut(Schema):
    live: bool
    starts_at: datetime
    ends_at: datetime
    single_pct: int
    combo_pct: int
    products: list[DealProduct]
    bundles: list[DealBundle]


def _deal(p: Product) -> DealProduct:
    sale = round(p.price * (100 - settings.black_friday_single_pct) / 100)
    return DealProduct(id=p.id, slug=p.slug, name=p.name, image=p.image, regular_price=p.price, price=sale,
                       stock=p.stock)


@router.get("/black-friday", response_model=BlackFridayOut)
def black_friday(db: Session = Depends(get_db)):
    start, end = promo.window()
    products = db.scalars(
        select(Product).where(Product.is_active.is_(True)).order_by(Product.featured.desc(), Product.created_at)
    ).all()
    bundles = [
        DealBundle(
            id=rb.id, key=rb.bundle.key, kind=rb.bundle.kind, name=rb.bundle.name, subtitle=rb.bundle.subtitle,
            image=rb.bundle.image, badge=rb.bundle.badge, items=[_deal(p) for p in rb.products],
            regular_price=rb.regular, price=rb.price, stock=rb.stock,
        )
        for rb in promo.resolve(db).values()
        if rb.complete  # a set is only offered when every serum in it is in the catalogue
    ]
    return BlackFridayOut(
        live=promo.is_live(), starts_at=start, ends_at=end,
        single_pct=settings.black_friday_single_pct, combo_pct=settings.black_friday_combo_pct,
        products=[_deal(p) for p in products], bundles=bundles,
    )
