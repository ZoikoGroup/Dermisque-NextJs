"""Starter blog posts (educational, based on the product packaging). Edit or delete them in Admin → Blog."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import BlogPost, Product

POSTS = [
    {
        "title": "Vitamin C 101: Why Three Forms Work Better Than One",
        "slug": "vitamin-c-101-three-forms",
        "category": "Ingredients",
        "tags": ["Vitamin C", "Brightening", "Antioxidants"],
        "featured": True,
        "cover_image": "/products/vitamin-c.webp",
        "products": ["vitamin-c-face-serum", "gluta-glow-face-serum"],
        "excerpt": "Vitamin C is skincare's favourite antioxidant — but not all Vitamin C is created equal. Here's why our 3X formula combines three different forms.",
        "content": """Vitamin C is one of the most researched ingredients in skincare. It's an **antioxidant**, it supports the look of **even, radiant skin**, and it pairs beautifully with sunscreen in a morning routine.

The challenge? Pure Vitamin C (L-ascorbic acid) is notoriously unstable. That's why the **Dermisque 3X Vitamin C Face Serum** combines three complementary forms instead of relying on just one.

## The three forms

1. **Silanol-infused Ascorbic Acid** — a Vitamin C form designed for better penetration into the skin.
2. **Superox-C AF** — Kakadu plum extract, one of nature's richest sources of Vitamin C, for hydration and fewer visible fine lines.
3. **3-O-Ethyl Ascorbic Acid** — a stable derivative that helps even out skin tone.

Together with **Epidermosil** (silanetriol + hyaluronic acid), licorice extract and Vitamin E, the formula helps restore the skin barrier and leave skin clearer, brighter and smoother.

## How to use it

- Apply in the **morning** to clean, dry skin.
- Use a pea-sized amount and *pat* it in — don't rub.
- Always follow with **sunscreen**. Vitamin C and SPF are a power couple.

> Tip: Vitamin C can naturally darken slightly over time when exposed to air. Keep the cap closed and store below 25°C, away from direct sunlight.

## Who is it for?

All skin types — especially if you're dealing with **dullness, dark spots or uneven tone**. If your skin is sensitive, patch-test on your inner arm 24 hours before first use.
""",
    },
    {
        "title": "Your AM & PM Serum Routine, Simplified",
        "slug": "am-pm-serum-routine",
        "category": "Routines",
        "tags": ["Routine", "Beginners", "Hydration"],
        "featured": False,
        "cover_image": "/products/skin-hydrating.png",
        "products": ["skin-hydrating-face-serum", "vitamin-c-face-serum", "anti-aging-face-serum"],
        "excerpt": "Morning or night? Which serum goes first? A simple, no-stress guide to layering your Dermisque serums.",
        "content": """Serums are concentrated treatments — the step where the real work happens. But with so many options, it's easy to wonder what goes when. Here's a simple framework.

## Morning: protect

1. **Cleanse** gently.
2. **Vitamin C** — antioxidant defence for the day ahead.
3. **Hydrating serum** — the 3X Skin Hydrating serum uses technology-infused hyaluronic acid with silanol, niacinamide and centella.
4. **Moisturiser**.
5. **Sunscreen** — non-negotiable.

## Evening: repair

1. **Cleanse** thoroughly.
2. **Treatment serum** — for example **3X Anti Aging** with retinol, witch hazel and vitamin E. Start 2–3 nights a week and build up.
3. **Under-eye serum** if dark circles are a concern.
4. **Moisturiser**.

## Golden rules

- **Thinnest to thickest.** Water-light serums first, richer textures last.
- **Don't double up on strong actives.** Avoid using exfoliating acids and retinol on the same night.
- **Be consistent.** Most people notice a visible difference after 3–4 weeks.

Not sure which serums suit you? Book a **free consultation** and our team will build a routine around your skin.
""",
    },
    {
        "title": "Dark Spots vs. Pigmentation: What's the Difference?",
        "slug": "dark-spots-vs-pigmentation",
        "category": "Skin Concerns",
        "tags": ["Dark Spots", "Pigmentation", "Niacinamide"],
        "featured": False,
        "cover_image": "/products/dark-spot.webp",
        "products": ["dark-spot-corrector-face-serum", "skin-brightening-face-serum"],
        "excerpt": "They're often used interchangeably, but dark spots and wider pigmentation respond best to slightly different approaches.",
        "content": """"Dark spots" and "pigmentation" both describe areas of skin that look darker than their surroundings — but they're not quite the same thing.

## Dark spots

Usually **small, defined patches**: post-blemish marks, sun spots or freckles. They benefit from targeted actives that help fade discolouration.

The **3X Dark Spot Corrector** combines:

- **Alpha Arbutin** — helps fade the look of dark spots
- **Niacinamide** — evens tone and strengthens the barrier
- **Kojic Acid** — brightens and targets discolouration

## Pigmentation

Often **broader and more diffuse** — an overall uneven tone. A balancing formula used across the whole face works well here.

The **3X Skin Brightening** serum pairs **Niacinamide 10%**, **Tranexamic Acid** and **Zinc PCA** to even skin tone, regulate sebum and reduce oxidative stress.

## The step everyone skips

Whatever you use, **daily sunscreen** is essential. UV exposure is one of the main drivers of uneven tone, and without SPF even the best serum is fighting an uphill battle.

> Persistent or rapidly changing patches should always be checked by a dermatologist.
""",
    },
    {
        "title": "Thinning Hair? Meet Redensyl, Procapil & Follicusan",
        "slug": "hair-growth-actives-explained",
        "category": "Hair Care",
        "tags": ["Hair Loss", "Scalp Care"],
        "featured": False,
        "cover_image": "/products/hair-growth.webp",
        "products": ["hair-growth-serum"],
        "excerpt": "A look at the three hair actives inside our 3X Hair Growth Serum, and how to get the most from a daily scalp routine.",
        "content": """Healthy hair starts at the scalp. The **Dermisque 3X Hair Growth Serum** brings together three well-known hair actives in one lightweight formula.

## The trio

- **Follicusan** — supports the hair follicle's natural growth cycle.
- **Redensyl** — targets hair follicle stem cells for denser-looking hair.
- **Procapil** — strengthens roots and helps reduce hair fall.

## How to apply

1. Start with a clean, dry scalp.
2. Part your hair section by section and use the dropper to apply about **1 ml** across thinning areas.
3. Massage gently for **2–3 minutes**. Don't rinse.
4. Repeat **daily** — consistency matters more than quantity.

## Be patient

Hair grows in cycles, so give any routine at least **3 months** before judging results. Pair it with a balanced diet, good sleep and gentle styling.

> If hair loss is sudden or patchy, speak with a doctor or dermatologist to rule out underlying causes.
""",
    },
]


def seed_blog(db: Session):
    if db.scalar(select(BlogPost.id).limit(1)):
        return
    print("Seeding blog posts...")
    slugs = {p.slug: p.id for p in db.scalars(select(Product)).all()}
    now = datetime.now(timezone.utc)
    for i, post in enumerate(POSTS):
        data = {k: v for k, v in post.items() if k != "products"}
        db.add(
            BlogPost(
                **data,
                product_ids=[slugs[s] for s in post["products"] if s in slugs],
                status="PUBLISHED",
                author_name="Dermisque Team",
                published_at=now - timedelta(days=3 + i * 6),
            )
        )
