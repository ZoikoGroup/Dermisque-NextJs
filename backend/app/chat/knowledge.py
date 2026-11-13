"""What the shop assistant knows: the live catalogue plus store policies.

Built from the database (cached for a few minutes) so new products, prices and stock show up
in chat without a restart. The text form is deterministic so Claude's prompt cache stays warm.
"""

import time
from dataclasses import dataclass, field

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from ..config import settings
from ..database import SessionLocal
from ..models import Coupon, Product, Review

STORE_FACTS = """\
BRAND: Dermisque — "Sum of Beauty". Premium 3X skincare & hair care serums: every formula pairs three
complementary actives (triple-action). Made by Zoiko Healthcare Inc. Cruelty-free (never tested on animals),
ISO 9001:2015 and GMP certified. Suitable for all skin types — patch-test first if you have sensitive skin.

SHIPPING: Free shipping on orders over $15; a flat $4.99 applies below that. Delivery usually takes 2–7 days
after dispatch. Customers get emails when the order is confirmed, shipped (with tracking number) and delivered.
TRACKING: Sign in → My Account → Orders shows live status and the tracking number once shipped (/account/orders).
CANCELLING: Orders can be cancelled from the account while Pending or Processing; paid orders are refunded to the
original payment method (5–10 business days to appear).
REPLACEMENT POLICY: If a product arrives damaged, leaking or incorrect, contact us within 7 days of delivery with
the order number and photos — we send a replacement at no cost. Only unopened, sealed products can be replaced
for hygiene reasons. If irritation occurs, stop using the product and contact us. (/policies/replacement)
PAYMENT: Major credit/debit cards (Visa, Mastercard, Amex) and cash on delivery (COD).
CURRENCY: Prices are in US dollars; shoppers can switch the store to British pounds (GBP) with the currency tab on
the right edge of the site.
ACCOUNT: Create an account at /register; forgot password at /forgot-password. Signed-in shoppers' bags are saved
across devices.
FREE SKIN CONSULTATION: Our experts recommend a personalised 3X routine — request one at /consultation
(reply within 24–48 hours).
USING SEVERAL SERUMS: Apply thinnest to thickest; avoid combining exfoliating acids and retinol in the same
routine; always use sunscreen in the daytime with actives.
CONTACT: support@dermisque.com · US toll-free +1-800-699-4917 · US HQ +1-800-484-5574 · UK +44 330 088 8958 ·
contact form at /contact. Headquarters: 1401 21st Street, Suite R, Sacramento, CA 95811, USA. UK office:
Berkeley Suite, 35 Berkeley Square, Mayfair, London W1J 5BF.
USEFUL PAGES: Shop all (/shop), shop by concern (/shop?concern=<slug>), journal/blog (/blog), FAQs (/faqs),
about (/about), wishlist (/wishlist), bag (/cart), checkout (/checkout).
"""


@dataclass
class ProductInfo:
    id: str
    slug: str
    name: str
    tagline: str
    description: str
    price: int
    compare_at: int | None
    image: str
    size: str
    stock: int
    concerns: list[str]
    concern_slugs: list[str]
    ingredients: list[dict]
    benefits: list[str]
    how_to_use: list[str]
    rating: float | None
    reviews: int
    haystack: str = field(default="", repr=False)

    def card(self) -> dict:
        return {"id": self.id, "slug": self.slug, "name": self.name, "price": self.price,
                "compareAtPrice": self.compare_at, "image": self.image, "stock": self.stock,
                "rating": self.rating, "tagline": self.tagline}


@dataclass
class Knowledge:
    products: list[ProductInfo]
    coupons: list[dict]
    text: str


_cache: tuple[float, Knowledge] | None = None
TTL = 300


def _money(c: int) -> str:
    return f"${c / 100:,.2f}"


def load() -> Knowledge:
    global _cache
    if _cache and time.monotonic() - _cache[0] < TTL:
        return _cache[1]
    with SessionLocal() as db:
        products = db.scalars(
            select(Product).where(Product.is_active.is_(True)).options(selectinload(Product.categories))
            .order_by(Product.name)
        ).all()
        ratings = dict(
            (pid, (avg, n)) for pid, avg, n in db.execute(
                select(Review.product_id, func.avg(Review.rating), func.count())
                .where(Review.approved.is_(True)).group_by(Review.product_id)
            ).all()
        )
        coupons = [
            {"code": c.code, "description": c.description or "", "first_order_only": c.first_order_only}
            for c in db.scalars(select(Coupon).where(Coupon.active.is_(True)).order_by(Coupon.code)).all()
        ]
    infos = []
    for p in products:
        avg, n = ratings.get(p.id, (None, 0))
        info = ProductInfo(
            id=p.id, slug=p.slug, name=p.name, tagline=p.tagline or "", description=p.description or "",
            price=p.price, compare_at=p.compare_at_price, image=p.image, size=p.size or "", stock=p.stock,
            concerns=[c.name for c in p.categories], concern_slugs=[c.slug for c in p.categories],
            ingredients=list(p.ingredients or []), benefits=list(p.benefits or []),
            how_to_use=list(p.how_to_use or []), rating=round(float(avg), 1) if avg else None, reviews=n,
        )
        info.haystack = " ".join([
            info.name, info.tagline, info.description, " ".join(info.concerns),
            " ".join(i.get("name", "") + " " + i.get("detail", "") for i in info.ingredients),
            " ".join(info.benefits),
        ]).lower()
        infos.append(info)

    lines = [STORE_FACTS, "ACTIVE DISCOUNT CODES:"]
    lines += [f"- {c['code']}: {c['description']}{' (first order only)' if c['first_order_only'] else ''}" for c in coupons]
    lines.append(f"\nPRODUCT CATALOGUE ({len(infos)} products; link each as /product/<slug>):")
    for i in infos:
        stock = "in stock" if i.stock > settings.low_stock_threshold else (
            f"only {i.stock} left" if i.stock > 0 else "SOLD OUT")
        price = _money(i.price) + (f" (was {_money(i.compare_at)})" if i.compare_at and i.compare_at > i.price else "")
        rating = f"; rated {i.rating}/5 from {i.reviews} review(s)" if i.rating else ""
        lines.append(
            f"\n### {i.name}\nslug: {i.slug} | price: {price} | size: {i.size or '—'} | {stock}{rating}\n"
            f"concerns: {', '.join(i.concerns) or '—'}\ntagline: {i.tagline}\n"
            f"key actives: {'; '.join(f'{x.get('name')} — {x.get('detail', '')}' for x in i.ingredients)}\n"
            f"benefits: {'; '.join(i.benefits)}\nhow to use: {' '.join(i.how_to_use)}\n"
            f"about: {i.description[:600]}"
        )
    kb = Knowledge(products=infos, coupons=coupons, text="\n".join(lines))
    _cache = (time.monotonic(), kb)
    return kb
