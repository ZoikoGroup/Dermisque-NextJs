"""Every Dermisque email. Each function takes plain data and returns a ready-to-send Email.

Pass inline=False to get browser-friendly HTML (absolute image URLs) for previews.
"""

from datetime import datetime

from ..config import settings
from .layout import (
    INK, LINE, MUTE, SANS, SERIF, SOFT, SUN, Ctx, address_block, button, card, e, eyebrow,
    gap, h1, h2, items_table, kv, money, notice, p, page, row, spacer, to_text, tracker,
)
from .sender import Email


def _email(key, to, subject, preheader, body, *, inline=True, audience="customer", reply_to=None, ctx=None):
    ctx = ctx or Ctx(inline)
    html = page(ctx, preheader=preheader, body=body(ctx) if callable(body) else body, audience=audience)
    return Email(to=to, subject=subject, html=html, text=to_text(html), template=key,
                 images=list(ctx.images.values()), reply_to=reply_to)


def _first(name: str | None) -> str:
    return (name or "there").strip().split(" ")[0] or "there"


def _fmt(o: dict):
    return lambda c: money(c, o.get("currency", "USD"), o.get("fx_rate", 1.0))


def _date(v) -> str:
    if isinstance(v, str):
        v = datetime.fromisoformat(v)
    return v.strftime("%d %b %Y") if v else ""


def _order_totals(o: dict) -> str:
    f = _fmt(o)
    rows = [("Subtotal", e(f(o["subtotal"])))]
    if o.get("discount"):
        rows.append(("Discount",
                     f'<span style="color:#15803d">&minus;{e(f(o["discount"]))}</span>'))
    rows.append(("Shipping", "Free" if not o.get("shipping") else e(f(o["shipping"]))))
    if o.get("tax"):
        rows.append(("Tax", e(f(o["tax"]))))
    rows.append(("Total", e(f(o["total"]))))
    return kv(rows, strong_last=True)


def _order_meta(o: dict) -> str:
    pay = "Card" if o["payment_method"] == "CARD" else "Cash on delivery"
    status = {"PAID": "Paid", "UNPAID": "Due on delivery" if o["payment_method"] == "COD" else "Unpaid",
              "REFUNDED": "Refunded"}.get(o["payment_status"], o["payment_status"])
    return f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td class="stack" width="50%" style="vertical-align:top;padding:0 8px 12px 0">{card(
        eyebrow("Shipping to", MUTE) + f'<p style="margin:0;font:400 14px/1.7 {SANS};color:{INK}">{address_block(o["address"])}</p>',
        pad="20px")}</td>
<td class="stack" width="50%" style="vertical-align:top;padding:0 0 12px 8px">{card(
        eyebrow("Order details", MUTE) + kv([("Order", e("#" + o["number"])), ("Placed", e(_date(o["created_at"]))),
                                             ("Payment", e(pay)), ("Status", e(status))]), pad="20px")}</td>
</tr></table>"""


def _order_items(ctx, o):
    return items_table(ctx, o["items"], _fmt(o))


# ════════════════════════ Customer ════════════════════════
def welcome(name: str, to: str, *, inline=True) -> Email:
    def body(ctx):
        return (
            row(eyebrow("Welcome to the Dermisque circle") + h1(f"Hello {_first(name)}, your glow", "starts here.")
                + p("Thank you for joining Dermisque. Every serum we make pairs <b>three powerful actives</b> — a "
                    "triple-action formula for glowing, healthy, younger-looking skin and fuller hair.")
                + button("Explore the collection", "/shop"))
            + spacer(30)
            + row(h2("Not sure where to start?")
                  + p("Tell us about your skin and our experts will build a 3X routine around it — completely free.")
                  + button("Book a free consultation", "/consultation", brand=True))
        )
    return _email("welcome", to, "Welcome to Dermisque — your glow starts here ✨",
                  "Triple-action serums for glowing, healthy skin.", body, inline=inline)


def newsletter_welcome(to: str, *, inline=True) -> Email:
    def body(ctx):
        return (
            row(eyebrow("You're on the list") + h1("Welcome to the", "Dermisque circle.")
                + p("Expect skin science made simple: new launches, ingredient deep-dives, routines that work, and "
                    "subscriber-only offers — never spam.")
                + button("Read the journal", "/blog"))
        )
    return _email("newsletter_welcome", to, "You're in! Welcome to the Dermisque circle",
                  "Skin science, launches and subscriber-only offers.", body, inline=inline)


_CONSULT_FIELDS = [
    ("date_of_birth", "Date of birth"), ("gender", "Gender"), ("address", "Address"),
    ("preferred_date", "Preferred date"), ("preferred_time", "Preferred time"),
    ("previous_consultation", "Consulted us before"), ("medications", "Current medications"),
    ("recent_treatments", "Recent skin treatments / surgery"),
]


def _consult_rows(m: dict) -> list[tuple[str, str]]:
    """Consultation answers as label/value rows (older requests only have skin type and concern)."""
    d = m.get("details")
    if not d:
        return [("Skin type", e(m.get("skin_type") or "—")), ("Main concern", e(m.get("concern") or "—"))]
    rows = []
    for key, label in _CONSULT_FIELDS:
        v = d.get(key)
        if not v:
            continue
        if key in ("date_of_birth", "preferred_date"):
            v = _date(datetime.fromisoformat(str(v)))
        rows.append((label, e(str(v))))
    return rows


def _message_text(m: dict, color: str, size: int) -> str:
    """The free-text part of a message, under a dashed rule (labelled for consultations)."""
    if not m.get("message"):
        return ""
    label = (f'<p style="margin:0 0 6px;font:600 11px/1.4 {SANS};letter-spacing:2px;text-transform:uppercase;'
             f'color:{MUTE}">Reason for consultation</p>') if m.get("type") == "CONSULTATION" else ""
    return (f'<div style="margin:14px 0 0;padding-top:14px;border-top:1px dashed {LINE}">{label}'
            f'<p style="margin:0;font:400 {size}px/1.7 {SANS};color:{color};white-space:pre-line">{e(m["message"])}</p></div>')


def message_received(m: dict, *, inline=True) -> Email:
    consult = m.get("type") == "CONSULTATION"
    summary = [("Name", e(m["name"])), ("Email", e(m["email"]))]
    if m.get("phone"):
        summary.append(("Phone", e(m["phone"])))
    if consult:
        summary += _consult_rows(m)
    elif m.get("subject"):
        summary.append(("Subject", e(m["subject"])))

    def body(ctx):
        return (
            row(eyebrow("Consultation request received" if consult else "Message received")
                + h1(f"Thank you, {_first(m['name'])}.", "We're on it.")
                + p("Our skincare experts have your request and will reply personally within <b>24–48 hours</b>."
                    if consult else
                    "We've received your message and a member of our team will get back to you within <b>1–2 business days</b>."))
            + spacer(26)
            + row(card(eyebrow("What you sent us", MUTE) + kv(summary) + _message_text(m, SOFT, 14)))
            + spacer(10)
            + row(p("While you wait, browse serums by concern — every formula targets one with three complementary actives.")
                  + button("Shop by concern", "/shop"))
        )
    subject = "Your free skin consultation request is in ✨" if consult else "We've received your message"
    return _email("message_received", m["email"], subject, "We'll be in touch very soon.", body, inline=inline)


def order_confirmation(o: dict, *, inline=True) -> Email:
    f = _fmt(o)
    cod = o["payment_method"] == "COD"

    def body(ctx):
        return (
            row(eyebrow(f"Order #{o['number']} confirmed") + h1(f"Thank you, {_first(o['customer_name'])}!", "Your glow is on its way.")
                + p(f"We've received your order and it's being prepared with care. "
                    f"{'Please keep <b>' + e(f(o['total'])) + '</b> ready to pay on delivery.' if cod else 'Your payment was successful.'} "
                    "Delivery usually takes <b>2–7 days</b> — we'll email you as soon as it ships.")
                + button("Track your order", f"/account/orders/{o['number']}"))
            + spacer(30) + row(tracker(0 if cod else 1))
            + spacer(30) + row(h2("Your order") + _order_items(ctx, o))
            + spacer(10) + row(card(_order_totals(o)))
            + spacer(16) + row(_order_meta(o))
            + (spacer(8) + row(notice(f"<b>Your note:</b> {e(o['notes'])}", "info")) if o.get("notes") else "")
        )
    return _email("order_confirmation", o["customer_email"], f"Order confirmed — #{o['number']} ✨",
                  f"Thank you! Your order of {f(o['total'])} is confirmed.", body, inline=inline)


def payment_failed(d: dict, *, inline=True) -> Email:
    """d: name, email, reason, items, subtotal, currency, fx_rate"""
    f = _fmt(d)

    def body(ctx):
        return (
            row(eyebrow("Payment unsuccessful", "#e5484d") + h1("Your payment didn't", "go through.")
                + p(f"Hi {e(_first(d['name']))}, we tried to process your payment but it was declined, so <b>your order was not placed "
                    "and you have not been charged</b>.")
                + gap(18)
                + notice(f"<b>Reason:</b> {e(d['reason'])}", "error"))
            + spacer(20)
            + row(h2("Common fixes") + p(
                "&bull; Check the card number, expiry date and CVC<br>&bull; Make sure the billing details match your bank's records<br>"
                "&bull; Ask your bank to approve the payment, or try another card<br>&bull; Choose <b>cash on delivery</b> instead",
                margin="0"))
            + spacer(26)
            + row(h2("Still in your bag") + items_table(ctx, d["items"], f)
                  + kv([("Subtotal", e(f(d["subtotal"])))])
                  + button("Retry payment", "/checkout", brand=True))
        )
    return _email("payment_failed", d["email"], "Payment unsuccessful — your order wasn't placed",
                  "No charge was made. Your bag is saved — try again in a minute.", body, inline=inline)


def order_failed(d: dict, *, inline=True) -> Email:
    """Order couldn't be completed for a non-payment reason (e.g. an item sold out)."""
    f = _fmt(d)

    def body(ctx):
        return (
            row(eyebrow("Order unsuccessful", "#e5484d") + h1("We couldn't complete", "your order.")
                + p(f"Hi {e(_first(d['name']))}, something stopped your order from going through, and <b>you have not been charged</b>.")
                + gap(18)
                + notice(f"<b>What happened:</b> {e(d['reason'])}", "warn"))
            + spacer(26)
            + row(h2("Your bag") + items_table(ctx, d["items"], f)
                  + p("Update your bag and try again — or reply to this email and we'll help you complete your order.")
                  + button("Review my bag", "/cart"))
        )
    return _email("order_failed", d["email"], "We couldn't complete your order",
                  "You have not been charged. Here's what happened.", body, inline=inline)


def order_status(o: dict, *, inline=True) -> Email:
    """Processing / shipped / delivered updates."""
    status = o["status"]
    f = _fmt(o)
    copy = {
        "PROCESSING": ("Order update", "We're preparing", "your order.",
                       "Good news — your order has been confirmed and our team is carefully packing your serums.",
                       f"We're preparing your order #{o['number']}", 1),
        "SHIPPED": ("On its way", "Your glow is", "on the way!",
                    "Your order has left our warehouse and is heading to you. Delivery usually takes <b>2–7 days</b>.",
                    f"Your order #{o['number']} has shipped 🚚", 2),
        "DELIVERED": ("Delivered", "It's here —", "enjoy the glow.",
                      "Your order has been delivered. We hope you love your new routine! For best results, use your serums "
                      "consistently for at least <b>4–6 weeks</b>.",
                      f"Delivered! Your order #{o['number']} has arrived", 3),
    }[status]
    tag, title, accent, text, subject, step = copy

    def body(ctx):
        tracking = (
            spacer(22) + row(card(eyebrow("Tracking number", MUTE)
                                  + f'<p style="margin:0;font:600 20px/1.3 {SANS};letter-spacing:2px;color:{INK}">{e(o["tracking"])}</p>',
                                  bg="#fff7ee", border="#ffd9b0"))
            if status == "SHIPPED" and o.get("tracking") else ""
        )
        review = (
            spacer(26) + row(card(h2("How's your skin feeling?")
                                  + p("Your review helps others find their perfect serum — it takes less than a minute.", margin="0")
                                  + button("Write a review", f"/product/{o['items'][0]['slug']}" if o["items"] and o["items"][0].get("slug") else "/shop", brand=True),
                                  bg="#fffaf2"))
            if status == "DELIVERED" else ""
        )
        return (
            row(eyebrow(tag) + h1(f"{title}", accent) + p(f"Hi {e(_first(o['customer_name']))}, {text[0].lower() + text[1:]}")
                + button("View order", f"/account/orders/{o['number']}"))
            + spacer(30) + row(tracker(step))
            + tracking + review
            + spacer(30) + row(h2(f"Order #{o['number']}") + _order_items(ctx, o) + kv([("Total", e(f(o["total"])))], strong_last=True))
        )
    return _email(f"order_{status.lower()}", o["customer_email"], subject,
                  {"PROCESSING": "Your serums are being packed.", "SHIPPED": "Track your parcel inside.",
                   "DELIVERED": "We'd love to hear how you like it."}[status], body, inline=inline)


def order_cancelled(o: dict, by: str = "customer", *, inline=True) -> Email:
    f = _fmt(o)
    refunded = o["payment_status"] == "REFUNDED"

    def body(ctx):
        why = ("as you requested" if by == "customer" else "by our team")
        refund = (notice(f"A refund of <b>{e(f(o['total']))}</b> has been issued to your original payment method. "
                         "It can take <b>5–10 business days</b> to appear on your statement.", "ok")
                  if refunded else notice("No payment was taken for this order.", "info"))
        return (
            row(eyebrow("Order cancelled", MUTE) + h1("Your order has", "been cancelled.")
                + p(f"Hi {e(_first(o['customer_name']))}, order <b>#{e(o['number'])}</b> was cancelled {why}.")
                + gap(18) + refund)
            + spacer(26)
            + row(h2("Cancelled items") + _order_items(ctx, o))
            + spacer(10)
            + row(p("Changed your mind, or need a hand choosing? We're always happy to help.")
                  + button("Continue shopping", "/shop"))
        )
    return _email("order_cancelled", o["customer_email"], f"Your order #{o['number']} has been cancelled",
                  "Here are the details of your cancellation.", body, inline=inline)


def order_refunded(o: dict, *, inline=True) -> Email:
    f = _fmt(o)

    def body(ctx):
        return (
            row(eyebrow("Refund issued", "#15803d") + h1("Your refund is", "on its way.")
                + p(f"Hi {e(_first(o['customer_name']))}, we've refunded <b>{e(f(o['total']))}</b> for order <b>#{e(o['number'])}</b> "
                    "to your original payment method. Depending on your bank it can take <b>5–10 business days</b> to show.")
                + button("View order", f"/account/orders/{o['number']}"))
            + spacer(28) + row(_order_items(ctx, o) + kv([("Refunded", e(f(o["total"])))], strong_last=True))
        )
    return _email("order_refunded", o["customer_email"], f"Refund issued for order #{o['number']}",
                  f"{f(o['total'])} is on its way back to you.", body, inline=inline)


def cart_reminder(d: dict, *, inline=True) -> Email:
    """d: name, email, items, subtotal, step (0-based), review (optional)"""
    f = _fmt(d)
    first, step = _first(d["name"]), d["step"]

    def body(ctx):
        if step == 0:
            intro = (eyebrow("You left something behind")
                     + h1(f"{first}, your glow", "is waiting.")
                     + p("Your bag is saved and ready when you are. Every serum pairs three powerful actives for "
                         "visible results — complete your order in one click."))
        else:
            intro = (eyebrow("Still thinking it over?")
                     + h1("Your bag is", "still saved.")
                     + p("Great skin is a habit, not a hurry — but we'd hate for you to miss out. "
                         "Your picks are waiting whenever you're ready."))
        # A genuine approved customer review (never invented); left out when none is available.
        rv = d.get("review")
        review = (spacer(26) + row(card(
            f'<p style="margin:0;font:italic 400 19px/1.5 {SERIF};color:{INK}">&ldquo;{e(rv["body"])}&rdquo;</p>'
            f'<p style="margin:12px 0 0;font:500 12px/1.4 {SANS};letter-spacing:2px;text-transform:uppercase;color:{SUN}">'
            f'{"★" * rv["rating"]} &nbsp;{e(rv["name"])} &middot; {e(rv["product"])}</p>', bg="#fffaf2")) if rv else "")
        return (
            row(intro + button("Complete my order", "/checkout", brand=True))
            + spacer(30)
            + row(h2("In your bag") + items_table(ctx, d["items"], f)
                  + kv([("Subtotal", e(f(d["subtotal"])))], strong_last=True))
            + review
            + spacer(8)
            + row(p("Questions about which serum suits your skin? Just reply to this email — a real person will answer.", 13, MUTE))
        )
    subject = (f"{first}, you left something beautiful behind ✨" if step == 0
               else "Your bag is about to expire")
    return _email(f"cart_reminder_{step + 1}", d["email"], subject,
                  "Your bag is saved — complete your order in one click.", body, inline=inline)


def password_reset(name: str, to: str, link: str, *, inline=True) -> Email:
    def body(ctx):
        return row(
            eyebrow("Password reset") + h1("Let's get you", "back in.")
            + p(f"Hi {e(_first(name))}, we received a request to reset the password for your Dermisque account. "
                "Click the button below to choose a new one. This link expires in <b>60 minutes</b>.")
            + button("Reset my password", link, brand=True)
            + gap(24)
            + notice("Didn't ask for this? You can safely ignore this email — your password won't change.", "info")
            + p(f'Button not working? Paste this link into your browser:<br><a href="{e(link)}" style="color:{SUN};word-break:break-all">{e(link)}</a>', 12, MUTE)
        )
    return _email("password_reset", to, "Reset your Dermisque password", "This link expires in 60 minutes.", body, inline=inline)


def password_changed(name: str, to: str, *, inline=True) -> Email:
    def body(ctx):
        return row(
            eyebrow("Security alert") + h1("Your password", "was changed.")
            + p(f"Hi {e(_first(name))}, this is a confirmation that the password for your Dermisque account "
                f"was changed on <b>{e(datetime.now().strftime('%d %b %Y at %H:%M'))}</b>.")
            + gap(18)
            + notice("If this wasn't you, reset your password immediately and contact "
                     '<a href="mailto:support@dermisque.com" style="color:#8a1c1c">support@dermisque.com</a>.', "error")
            + button("Go to my account", "/account")
        )
    return _email("password_changed", to, "Your Dermisque password was changed", "A quick security confirmation.",
                  body, inline=inline)


# ════════════════════════ Admin ════════════════════════
def _admin_to() -> str:
    return settings.admin_notify_email


def admin_new_order(o: dict, *, inline=True) -> Email:
    f = _fmt(o)
    currency = o.get("currency", "USD")
    fx_note = "" if currency == "USD" else f" in {e(currency)} ({e(money(o['total']))} USD)"

    def body(ctx):
        return (
            row(eyebrow("New order") + h1(f"#{o['number']}", f"— {f(o['total'])}")
                + p(f"<b>{e(o['customer_name'])}</b> ({e(o['customer_email'])}) just placed an order "
                    f"paid by <b>{'card' if o['payment_method'] == 'CARD' else 'cash on delivery'}</b>"
                    f"{fx_note}.")
                + button("Open in admin", f"/admin/orders/{o['number']}"))
            + spacer(28) + row(_order_items(ctx, o))
            + spacer(10) + row(card(_order_totals(o)))
            + spacer(16) + row(_order_meta(o))
            + (spacer(8) + row(notice(f"<b>Customer note:</b> {e(o['notes'])}", "info")) if o.get("notes") else "")
        )
    return _email("admin_new_order", _admin_to(), f"🛍 New order #{o['number']} — {f(o['total'])}",
                  f"{o['customer_name']} · {len(o['items'])} item(s)", body, inline=inline, audience="admin",
                  reply_to=o["customer_email"])


def admin_new_message(m: dict, *, inline=True) -> Email:
    consult = m.get("type") == "CONSULTATION"
    rows = [("From", e(m["name"])), ("Email", f'<a href="mailto:{e(m["email"])}">{e(m["email"])}</a>')]
    if m.get("phone"):
        rows.append(("Phone", e(m["phone"])))
    if consult:
        rows += _consult_rows(m)
    if m.get("subject"):
        rows.append(("Subject", e(m["subject"])))

    def body(ctx):
        return (
            row(eyebrow("New consultation request" if consult else "New contact message")
                + h1(m["name"], "wrote in.") + p("Reply directly to this email to answer the customer."))
            + spacer(24)
            + row(card(kv(rows) + _message_text(m, INK, 15)))
            + row(button("Open inbox", "/admin/messages"))
        )
    subject = f"✨ New consultation request from {m['name']}" if consult else f"✉ New message from {m['name']}" + (
        f": {m['subject']}" if m.get("subject") else "")
    return _email("admin_new_message", _admin_to(), subject, m["message"][:90], body, inline=inline,
                  audience="admin", reply_to=m["email"])


def admin_payment_failed(d: dict, *, inline=True) -> Email:
    f = _fmt(d)

    def body(ctx):
        return (
            row(eyebrow("Failed checkout", "#e5484d") + h1("Payment declined", f"— {f(d['subtotal'])}")
                + p(f"<b>{e(d['name'])}</b> ({e(d['email'])}) tried to check out but the order failed.")
                + gap(14)
                + notice(f"<b>Reason:</b> {e(d['reason'])}", "error")
                + p("The customer has been emailed with steps to retry. You may want to reach out personally.", 13, MUTE))
            + spacer(24) + row(items_table(ctx, d["items"], f))
        )
    return _email("admin_payment_failed", _admin_to(), f"⚠ Failed checkout — {d['email']}",
                  d["reason"], body, inline=inline, audience="admin", reply_to=d["email"])


def admin_order_cancelled(o: dict, *, inline=True) -> Email:
    f = _fmt(o)

    def body(ctx):
        return (
            row(eyebrow("Order cancelled", MUTE) + h1(f"#{o['number']}", "was cancelled.")
                + p(f"<b>{e(o['customer_name'])}</b> cancelled their order of <b>{e(f(o['total']))}</b>. "
                    f"Stock has been returned to inventory{' and the payment marked as refunded' if o['payment_status'] == 'REFUNDED' else ''}.")
                + button("Open in admin", f"/admin/orders/{o['number']}"))
            + spacer(26) + row(_order_items(ctx, o))
        )
    return _email("admin_order_cancelled", _admin_to(), f"Order #{o['number']} cancelled by customer",
                  f"{o['customer_name']} · {f(o['total'])}", body, inline=inline, audience="admin")


def admin_low_stock(products: list[dict], *, inline=True) -> Email:
    """products: [{name, stock, image, slug}]"""
    def body(ctx):
        rows = "".join(
            f'<tr><td width="64" style="padding:10px 14px 10px 0;border-top:1px solid {LINE}">'
            f'<img src="{e(ctx.img(pr.get("image") or "", 52))}" width="52" height="52" alt="" style="display:block;border-radius:12px"></td>'
            f'<td style="padding:10px 0;border-top:1px solid {LINE};font:500 14px/1.4 {SANS};color:{INK}">{e(pr["name"])}</td>'
            f'<td align="right" style="padding:10px 0;border-top:1px solid {LINE};font:600 14px/1 {SANS};'
            f'color:{"#b42318" if pr["stock"] == 0 else SUN}">{"Sold out" if pr["stock"] == 0 else str(pr["stock"]) + " left"}</td></tr>'
            for pr in products
        )
        return (
            row(eyebrow("Inventory alert") + h1("Running low", "on stock.")
                + p(f"{'These products are' if len(products) > 1 else 'This product is'} at or below "
                    f"<b>{settings.low_stock_threshold} units</b>. Restock soon to avoid missed sales."))
            + spacer(20)
            + row(f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">{rows}</table>'
                  + button("Manage products", "/admin/products"))
        )
    names = ", ".join(pr["name"] for pr in products[:2]) + ("…" if len(products) > 2 else "")
    return _email("admin_low_stock", _admin_to(), f"📦 Low stock: {names}", "Restock soon to avoid missed sales.",
                  body, inline=inline, audience="admin")

