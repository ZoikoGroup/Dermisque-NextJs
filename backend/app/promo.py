"""Black Friday campaign — 40% off every serum, 45% off combos and gift sets.

Prices stay stored at their regular level; the sale price is applied on the fly while the
campaign window is open (catalogue, cart, checkout, chat and emails all read it from here).
Combos and gift sets are cart lines with the id ``bundle:<key>`` and are only sold while live.
"""

from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .models import Product

BUNDLE_PREFIX = "bundle:"


@dataclass(frozen=True)
class Bundle:
    key: str
    name: str
    subtitle: str
    kind: str  # "combo" | "gift"
    slugs: tuple[str, ...]
    image: str
    badge: str | None = None


BUNDLES: tuple[Bundle, ...] = (
    Bundle("glow-duo", "Glow Duo", "Vitamin C + Brightening", "combo",
           ("vitamin-c-face-serum", "skin-brightening-face-serum"), "/black-friday/combos/glow-duo.png"),
    Bundle("lip-glow-duo", "Lip & Glow Duo", "Lip + Gluta Glow", "combo",
           ("lip-serum", "gluta-glow-face-serum"), "/black-friday/combos/lip-glow-duo.png"),
    Bundle("even-tone-trio", "Even Tone Trio", "Brightening + Dark Spot + Vitamin C", "combo",
           ("skin-brightening-face-serum", "dark-spot-corrector-face-serum", "vitamin-c-face-serum"),
           "/black-friday/combos/even-tone-trio.png"),
    Bundle("fresh-skin-trio", "Fresh Skin Trio", "Hydrating + Aloe Glow + Exfoliating", "combo",
           ("skin-hydrating-face-serum", "aloe-glow-face-serum", "skin-exfoliating-face-serum"),
           "/black-friday/combos/fresh-skin-trio.png"),
    Bundle("hair-care-duo", "Hair Care Duo", "Hair Growth + Anti Gray", "combo",
           ("hair-growth-serum", "anti-gray-hair-serum"), "/black-friday/combos/hair-care-duo.png"),
    Bundle("complete-face-ritual", "Complete Face Ritual", "5 face serums in one set", "combo",
           ("vitamin-c-face-serum", "skin-brightening-face-serum", "skin-hydrating-face-serum",
            "dark-spot-corrector-face-serum", "skin-exfoliating-face-serum"),
           "/black-friday/combos/complete-face-ritual.png", badge="Best value"),
    Bundle("radiance-set", "The Radiance Set", "Vitamin C · Brightening · Hydrating", "gift",
           ("vitamin-c-face-serum", "skin-brightening-face-serum", "skin-hydrating-face-serum"),
           "/black-friday/gifts/radiance-set.png"),
    Bundle("glow-set", "The Glow Set", "Lip Serum · Aloe Glow · Anti-Aging", "gift",
           ("lip-serum", "aloe-glow-face-serum", "anti-aging-face-serum"), "/black-friday/gifts/glow-set.png"),
)
BUNDLES_BY_KEY = {b.key: b for b in BUNDLES}


def _parse(value: str) -> datetime:
    d = datetime.fromisoformat(value)
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def window() -> tuple[datetime, datetime]:
    return _parse(settings.black_friday_start), _parse(settings.black_friday_end)


def is_live(now: datetime | None = None) -> bool:
    start, end = window()
    return start <= (now or datetime.now(timezone.utc)) <= end


def _off(cents: int, pct: int) -> int:
    return round(cents * (100 - pct) / 100)


def unit_price(p: Product) -> int:
    """What a single product sells for right now."""
    return _off(p.price, settings.black_friday_single_pct) if is_live() else p.price


def compare_price(p: Product) -> int | None:
    """Struck-through 'was' price shown next to unit_price()."""
    return p.price if is_live() else p.compare_at_price


def bundle_id(key: str) -> str:
    return BUNDLE_PREFIX + key


def is_bundle_id(line_id: str) -> bool:
    return line_id.startswith(BUNDLE_PREFIX)


@dataclass
class ResolvedBundle:
    bundle: Bundle
    products: list[Product]  # in bundle order; empty when a component is missing/inactive

    @property
    def complete(self) -> bool:
        return len(self.products) == len(self.bundle.slugs)

    @property
    def regular(self) -> int:
        return sum(p.price for p in self.products)

    @property
    def price(self) -> int:
        return _off(self.regular, settings.black_friday_combo_pct)

    @property
    def stock(self) -> int:
        return min((p.stock for p in self.products), default=0) if self.complete else 0

    @property
    def id(self) -> str:
        return bundle_id(self.bundle.key)

    @property
    def name(self) -> str:
        return f"{self.bundle.name} (Black Friday set)"


def resolve(db: Session, keys: list[str] | None = None) -> dict[str, ResolvedBundle]:
    wanted = [BUNDLES_BY_KEY[k] for k in (keys if keys is not None else BUNDLES_BY_KEY) if k in BUNDLES_BY_KEY]
    slugs = {s for b in wanted for s in b.slugs}
    found = {
        p.slug: p
        for p in db.scalars(select(Product).where(Product.slug.in_(slugs), Product.is_active.is_(True))).all()
    }
    out = {}
    for b in wanted:
        parts = [found[s] for s in b.slugs if s in found]
        out[b.key] = ResolvedBundle(b, parts if len(parts) == len(b.slugs) else [])
    return out
