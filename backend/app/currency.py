"""Supported currencies. All prices are stored in USD cents; others are converted at a fixed rate."""

from .config import settings


def rates() -> dict[str, float]:
    return {"USD": 1.0, "GBP": settings.gbp_rate}
