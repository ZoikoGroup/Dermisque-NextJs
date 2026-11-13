"""Built-in shop assistant — answers from the catalogue and store policies without an AI model.

Used when no Anthropic API key is configured, and as the fallback if the AI call fails.
"""

import re

from .knowledge import Knowledge, ProductInfo

# concern keyword → category slug
CONCERNS = {
    "acne": ["acne", "pimple", "pimples", "breakout", "breakouts", "blemish", "blemishes", "zit", "oily", "pores", "blackhead"],
    "dark-spots": ["dark spot", "dark spots", "spots", "marks", "acne marks", "scars", "scar"],
    "pigmentation": ["pigmentation", "melasma", "uneven", "uneven tone", "hyperpigmentation", "patches", "discoloration"],
    "wrinkles": ["wrinkle", "wrinkles", "fine line", "fine lines", "aging", "ageing", "anti aging", "anti-aging", "firm", "sagging", "collagen"],
    "dryness": ["dry", "dryness", "dehydrated", "hydration", "hydrate", "moisture", "flaky", "lip", "lips"],
    "dull-skin": ["dull", "dullness", "glow", "glowing", "radiance", "radiant", "bright", "brighten", "brightening", "tired skin"],
    "sun-damage": ["sun", "tan", "tanning", "sunburn", "sun damage", "sun damaged"],
    "dark-circles": ["dark circle", "dark circles", "under eye", "under-eye", "puffy", "puffiness", "eye bags"],
    "hair-loss": ["hair", "hair fall", "hairfall", "hair loss", "thinning", "bald", "scalp", "regrowth", "hair growth"],
}

STOP = set("""a an the is are am i me my you your we our to for of and or in on with what which how do does can
could should would will it its this that there these those be best good recommend recommendation suggest
please want need help any some about tell show product products serum serums dermisque give get have has
""".split())


def _has(text: str, *words: str) -> bool:
    return any(re.search(rf"\b{re.escape(w)}\b", text) for w in words)


def _money(c: int) -> str:
    return f"${c / 100:,.2f}"


def _link(p: ProductInfo) -> str:
    return f"[{p.name}](/product/{p.slug})"


def _match_products(kb: Knowledge, text: str) -> list[ProductInfo]:
    """Rank products by concern + keyword overlap."""
    concern_hits = [slug for slug, words in CONCERNS.items() if _has(text, *words)]
    tokens = [t for t in re.findall(r"[a-z0-9]+", text) if t not in STOP and len(t) > 2]
    scored = []
    for p in kb.products:
        score = 0.0
        name = p.name.lower()
        score += sum(4 for slug in concern_hits if slug in p.concern_slugs)
        score += sum(3 for t in tokens if t in name)
        score += sum(1 for t in tokens if t in p.haystack)
        if score:
            scored.append((score + (0.5 if p.stock > 0 else -5), p))
    scored.sort(key=lambda x: (-x[0], x[1].price))
    return [p for _, p in scored]


def _named_product(kb: Knowledge, text: str) -> ProductInfo | None:
    """A product the user is clearly asking about by name (e.g. 'vitamin c serum', 'gold serum')."""
    best, best_score = None, 0
    for p in kb.products:
        words = [w for w in re.findall(r"[a-z0-9]+", p.name.lower()) if w not in ("dermisque", "3x", "face", "serum")]
        hits = sum(1 for w in words if _has(text, w))
        if words and hits / len(words) >= 0.6 and hits > best_score:
            best, best_score = p, hits
    return best


def _product_brief(p: ProductInfo) -> str:
    stock = "" if p.stock > 0 else " — currently sold out"
    names = [i.get("name", "") for i in p.ingredients[:3]]
    tagline = p.tagline.rstrip(".")
    # skip the actives line when the tagline already names them
    if names and names[0].lower().split(" ")[0] in tagline.lower():
        return f"**{_link(p)}** — {_money(p.price)}{stock}\n{tagline}."
    return f"**{_link(p)}** — {_money(p.price)}{stock}\n{tagline}. Key actives: {', '.join(names)}."


def answer(kb: Knowledge, message: str, user: dict | None) -> tuple[str, list[ProductInfo], list[str]]:
    """Returns (markdown reply, products to show as cards, follow-up suggestions)."""
    t = " " + message.lower().strip() + " "
    parts: list[str] = []
    products: list[ProductInfo] = []
    suggestions: list[str] = []
    name = (user or {}).get("name", "").split(" ")[0]

    if _has(t, "hi", "hello", "hey", "hii", "namaste", "good morning", "good evening") and len(t.split()) <= 4:
        greet = f"Hi {name}! " if name else "Hi there! "
        return (greet + "I'm the Dermisque assistant ✨ I can help you find the right serum, check your order, "
                "or answer questions about shipping, discounts and our policies. What can I help with?",
                [], ["Which serum is best for dark spots?", "Do you have a discount code?", "Where is my order?"])

    # ── orders
    if _has(t, "order", "orders", "track", "tracking", "where is my", "shipped", "delivery status", "parcel", "package"):
        if user and user.get("orders"):
            rows = [f"- **[#{o['number']}](/account/orders/{o['number']})** ({o['date']}) — {o['status'].title()}, {o['total']}"
                    + (f", tracking `{o['tracking']}`" if o.get("tracking") else "") for o in user["orders"][:3]]
            parts.append("Here are your latest orders:\n" + "\n".join(rows)
                         + "\n\nOpen [My orders](/account/orders) for the full timeline.")
        elif user:
            parts.append("You don't have any orders yet. Browse [all serums](/shop) to find your first 3X formula — "
                         "and use **NEW30** for 30% off your first order.")
        else:
            parts.append("To check an order, please [sign in](/login?next=/account/orders) and open **My Account → Orders** — "
                         "you'll see the live status and tracking number once it ships.")

    if _has(t, "cancel", "cancellation"):
        parts.append("You can cancel from [My orders](/account/orders) while an order is **Pending** or **Processing**. "
                     "Paid orders are refunded to the original payment method (5–10 business days).")
    if _has(t, "return", "returns", "refund", "replace", "replacement", "damaged", "broken", "leaking", "wrong item"):
        parts.append("If a product arrives damaged, leaking or incorrect, contact us **within 7 days of delivery** with "
                     "your order number and photos and we'll send a free replacement. Only unopened, sealed products can "
                     "be replaced for hygiene reasons. [Replacement policy](/policies/replacement)")
    if _has(t, "shipping", "ship", "delivery", "deliver", "how long", "days", "free shipping", "courier"):
        parts.append("🚚 **Shipping:** free on orders over **$15** (a flat $4.99 below that). Delivery usually takes "
                     "**2–7 days** after dispatch, and we email you a tracking number when it ships.")
    if _has(t, "coupon", "discount", "code", "offer", "offers", "promo", "sale", "deal", "cheaper"):
        codes = "\n".join(f"- **{c['code']}** — {c['description']}" for c in kb.coupons) or "- **NEW30** — 30% off your first order"
        parts.append(f"🎁 Current codes:\n{codes}\n\nEnter the code in your bag or at checkout.")
    if _has(t, "payment", "pay", "cod", "cash on delivery", "card", "visa", "mastercard", "amex", "paypal"):
        parts.append("💳 We accept major **credit/debit cards** (Visa, Mastercard, Amex) and **cash on delivery**.")
    if _has(t, "contact", "phone", "call", "email", "support", "customer care", "address", "office", "whatsapp"):
        parts.append("📞 **Contact us:** support@dermisque.com · US toll-free +1-800-699-4917 · UK +44 330 088 8958, "
                     "or use the [contact form](/contact).")
    if _has(t, "consult", "consultation", "expert", "dermatologist", "routine", "personalised", "personalized"):
        parts.append("✨ Our experts offer a **free skin consultation** and reply within 24–48 hours — "
                     "[book yours here](/consultation).")
    if _has(t, "cruelty", "vegan", "animal", "tested", "iso", "gmp", "safe", "certified"):
        parts.append("🐰 Dermisque serums are **cruelty-free** (never tested on animals) and made to **ISO 9001:2015 "
                     "and GMP** standards.")
    if _has(t, "sensitive", "pregnant", "pregnancy", "allergy", "allergic", "irritation", "reaction"):
        parts.append("Our serums suit all skin types, but please **patch-test** on your inner arm 24 hours before first use. "
                     "If you're pregnant, have a skin condition or notice irritation, check with your doctor or "
                     "dermatologist first.")
    if _has(t, "currency", "pound", "pounds", "gbp", "usd", "dollar", "dollars"):
        parts.append("Prices are shown in **US dollars** — switch to **British pounds** with the currency tab on the "
                     "right edge of the page.")
    if _has(t, "password", "login", "log in", "sign in", "account", "register", "sign up"):
        parts.append("You can [sign in](/login) or [create an account](/register). Forgot your password? "
                     "[Reset it here](/forgot-password).")

    # ── products
    named = _named_product(kb, t)
    wants_use = _has(t, "how to use", "how do i use", "apply", "use it", "usage", "routine")
    wants_ingredients = _has(t, "ingredient", "ingredients", "contains", "actives", "active", "made of")
    wants_price = _has(t, "price", "cost", "how much", "cheap", "cheapest", "expensive", "budget", "under")
    if named and (wants_use or wants_ingredients or wants_price or not parts):
        p = named
        bits = [_product_brief(p)]
        if wants_ingredients or not (wants_use or wants_price):
            bits.append("**Actives:**\n" + "\n".join(f"- **{i.get('name')}** — {i.get('detail', '')}" for i in p.ingredients))
        if wants_use:
            bits.append("**How to use:**\n" + "\n".join(f"{n}. {s}" for n, s in enumerate(p.how_to_use, 1)))
        if p.benefits and not wants_use:
            bits.append("**Benefits:** " + ", ".join(p.benefits[:4]) + ".")
        parts.append("\n\n".join(bits))
        products = [p]
        suggestions = [f"How do I use {p.name.replace('Dermisque ', '')}?", "Is it good for sensitive skin?", "Do you have a discount code?"]
    else:
        matches = _match_products(kb, t)
        budget = re.search(r"(?:under|below|less than)\s*\$?\s*(\d+)", t)
        if budget:
            limit = int(budget.group(1)) * 100
            matches = [p for p in (matches or sorted(kb.products, key=lambda x: x.price)) if p.price <= limit]
        elif _has(t, "cheapest", "cheap", "budget", "affordable", "lowest price"):
            matches = sorted(matches or kb.products, key=lambda x: x.price)
        elif _has(t, "best seller", "bestseller", "popular", "top rated", "best rated", "most loved"):
            matches = sorted(kb.products, key=lambda x: (-(x.rating or 0), -x.reviews))
        if matches and (not parts or _has(t, "serum", "product", "recommend", "suggest", "best", "for", "help")):
            top = matches[:3]
            products = top
            intro = "Here's what I'd recommend:" if len(top) > 1 else "This one is a great match:"
            parts.append(intro + "\n\n" + "\n\n".join(_product_brief(p) for p in top)
                         + "\n\nWant a personalised routine? Our experts offer a [free consultation](/consultation).")
            suggestions = [f"How do I use {top[0].name.replace('Dermisque ', '')}?", "What are the key ingredients?",
                           "Do you have a discount code?"]

    if not parts:
        return ("I'm not sure I caught that, but I can help with:\n- **Finding a serum** for your concern "
                "(acne, dark spots, dryness, wrinkles, hair fall…)\n- **Orders** — tracking, cancelling, replacements\n"
                "- **Shipping, payment & discount codes**\n\nOr ask our team directly via the [contact page](/contact).",
                [], ["Best serum for glowing skin?", "How long does delivery take?", "Show me hair care"])

    return "\n\n".join(parts), products, suggestions or ["Recommend a serum for me", "How long is delivery?",
                                                          "Talk to a skin expert"]
