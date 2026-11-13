"""Brand email layout + building blocks.

Email HTML is table-based with inline styles so it renders in Gmail, Apple Mail and Outlook.
Images are embedded inline (cid:) when the file is available locally, so emails look right
even when the store runs on localhost; otherwise absolute URLs on SITE_URL are used.
"""

import hashlib
import io
import re
from functools import lru_cache
from html import escape, unescape
from pathlib import Path
from urllib.parse import urlparse

from ..config import settings
from .sender import InlineImage

# Brand tokens (mirrors the storefront theme)
INK = "#0b0b0f"
SOFT = "#3d3d46"
MUTE = "#7a7a85"
LINE = "#ebe7e0"
CREAM = "#fbf9f5"
SAND = "#f4efe7"
SUN = "#ff7a00"
AMBER = "#ffb300"
AQUA = "#19d3f3"
GRADIENT = f"linear-gradient(90deg,{SUN},{AMBER} 50%,{AQUA})"
SERIF = "'Bodoni Moda',Didot,'Bodoni 72',Georgia,'Times New Roman',serif"
SANS = "'Jost','Helvetica Neue',Helvetica,Arial,sans-serif"

COMPANY = "Zoiko Healthcare Inc."
ADDRESS = "1401 21st Street, Suite R, Sacramento, CA 95811, USA"
SUPPORT = "support@dermisque.com"
SOCIALS = [
    ("Instagram", "https://www.instagram.com/dermisque_official/"),
    ("Facebook", "https://www.facebook.com/Dermisque/"),
    ("Pinterest", "https://www.pinterest.co.uk/dermisque/"),
    ("YouTube", "https://www.youtube.com/@Dermisque"),
]


def e(v) -> str:
    return escape("" if v is None else str(v))


def url(path: str) -> str:
    return path if path.startswith("http") else settings.site_url.rstrip("/") + "/" + path.lstrip("/")


def money(cents: int, currency: str = "USD", rate: float = 1.0) -> str:
    v = round(cents * (rate or 1)) / 100
    sym = {"USD": "$", "GBP": "£"}.get(currency, "")
    return f"{sym}{v:,.2f}" if sym else f"{v:,.2f} {currency}"


# ───────────── images ─────────────
def _local_file(src: str) -> Path | None:
    """Map an image URL/path to a local file (storefront /public or API /uploads)."""
    path = urlparse(src).path if src.startswith("http") else src
    if "/uploads/" in path:
        f = settings.upload_dir / path.split("/uploads/", 1)[1]
    else:
        f = settings.frontend_public_dir / path.lstrip("/")
    try:
        return f if f.is_file() else None
    except OSError:
        return None


@lru_cache(maxsize=128)
def _thumbnail(path: str, width: int, keep_png: bool) -> tuple[bytes, str] | None:
    try:
        from PIL import Image
    except ImportError:
        return None
    try:
        with Image.open(path) as im:
            im.thumbnail((width, width * 4))
            buf = io.BytesIO()
            if keep_png:
                im.save(buf, "PNG", optimize=True)
                return buf.getvalue(), "png"
            if im.mode in ("RGBA", "LA", "P"):
                bg = Image.new("RGB", im.size, (244, 239, 231))
                im = im.convert("RGBA")
                bg.paste(im, mask=im.split()[-1])
                im = bg
            im.convert("RGB").save(buf, "JPEG", quality=84, optimize=True, progressive=True)
            return buf.getvalue(), "jpeg"
    except OSError:
        return None


class Ctx:
    """Render context: collects inline images when sending, uses URLs for browser previews."""

    def __init__(self, inline: bool = True):
        self.inline = inline
        self.images: dict[str, InlineImage] = {}

    def img(self, src: str, width: int, png: bool = False) -> str:
        if self.inline and src:
            f = _local_file(src)
            thumb = _thumbnail(str(f), width * 2, png) if f else None  # 2x for retina screens
            if thumb:
                data, subtype = thumb
                cid = hashlib.sha1(data).hexdigest()[:16] + "@dermisque"
                self.images.setdefault(cid, InlineImage(cid, data, subtype))
                return f"cid:{cid}"
        return url(src) if src else ""


# ───────────── blocks ─────────────
def spacer(h: int = 24) -> str:
    return f'<tr><td style="height:{h}px;line-height:{h}px;font-size:0">&nbsp;</td></tr>'


def gap(h: int = 18) -> str:
    """Vertical space inside a cell."""
    return f'<div style="height:{h}px;line-height:{h}px;font-size:0">&nbsp;</div>'


def row(inner: str, pad: str = "0 40px") -> str:
    return f'<tr><td class="px" style="padding:{pad}">{inner}</td></tr>'


def eyebrow(text: str, color: str = SUN) -> str:
    return (
        f'<p style="margin:0 0 12px;font:600 11px/1.4 {SANS};letter-spacing:3px;'
        f'text-transform:uppercase;color:{color}">{e(text)}</p>'
    )


def h1(text: str, accent: str | None = None) -> str:
    """Display heading; `accent` is appended in italic brand orange."""
    acc = f' <em style="font-style:italic;color:{SUN}">{e(accent)}</em>' if accent else ""
    return f'<h1 class="h1" style="margin:0;font:400 34px/1.15 {SERIF};color:{INK}">{e(text)}{acc}</h1>'


def h2(text: str) -> str:
    return f'<h2 style="margin:0 0 14px;font:400 22px/1.25 {SERIF};color:{INK}">{e(text)}</h2>'


def p(html: str, size: int = 15, color: str = SOFT, margin: str = "14px 0 0") -> str:
    """Paragraph. `html` must already be escaped (use e())."""
    return f'<p style="margin:{margin};font:400 {size}px/1.65 {SANS};color:{color}">{html}</p>'


def button(label: str, href: str, brand: bool = False) -> str:
    bg = SUN if brand else INK
    grad = f"background-image:{GRADIENT};" if brand else ""
    fg = INK if brand else "#ffffff"
    return f"""<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px"><tr>
<td style="border-radius:999px;background:{bg};{grad}">
<a href="{e(url(href))}" target="_blank" style="display:inline-block;padding:15px 34px;font:600 14px/1 {SANS};
letter-spacing:.4px;color:{fg};text-decoration:none;border-radius:999px">{e(label)} &rarr;</a>
</td></tr></table>"""


def card(inner: str, bg: str = SAND, border: str | None = None, pad: str = "22px 24px") -> str:
    b = f"border:1px solid {border};" if border else ""
    return (
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        f'style="background:{bg};{b}border-radius:18px"><tr><td style="padding:{pad}">{inner}</td></tr></table>'
    )


def kv(rows: list[tuple[str, str]], strong_last: bool = False) -> str:
    """Two-column label/value list. Values must already be escaped."""
    out = []
    for i, (k, v) in enumerate(rows):
        last = strong_last and i == len(rows) - 1
        top = f"border-top:1px dashed {LINE};padding-top:14px;" if last else ""
        ksty = f"font:{'600 15px' if last else '400 14px'}/1.5 {SANS};color:{INK if last else SOFT}"
        vsty = f"font:{'400 24px' if last else '500 14px'}/1.3 {SERIF if last else SANS};color:{INK}"
        out.append(
            f'<tr><td style="{top}padding-bottom:8px;{ksty}">{e(k)}</td>'
            f'<td align="right" style="{top}padding-bottom:8px;{vsty}">{v}</td></tr>'
        )
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">{"".join(out)}</table>'


def items_table(ctx: Ctx, items: list[dict], fmt) -> str:
    """items: [{name, image, quantity, price, slug?}] — price in USD cents; fmt formats cents."""
    rows = []
    for i, it in enumerate(items):
        border = f"border-top:1px solid {LINE};" if i else ""
        src = ctx.img(it.get("image") or "", 72)
        img = (
            f'<img src="{e(src)}" width="72" height="72" alt="" style="display:block;width:72px;height:72px;'
            f'object-fit:cover;border-radius:14px;background:{SAND}">'
            if src
            else ""
        )
        name = e(it["name"])
        if it.get("slug"):
            name = f'<a href="{e(url("/product/" + it["slug"]))}" style="color:{INK};text-decoration:none">{name}</a>'
        rows.append(
            f'<tr><td width="88" style="{border}padding:14px 16px 14px 0;vertical-align:middle">{img}</td>'
            f'<td style="{border}padding:14px 0;vertical-align:middle">'
            f'<p style="margin:0;font:500 15px/1.4 {SANS};color:{INK}">{name}</p>'
            f'<p style="margin:4px 0 0;font:400 13px/1.4 {SANS};color:{MUTE}">Qty {it["quantity"]} &middot; {e(fmt(it["price"]))} each</p></td>'
            f'<td align="right" style="{border}padding:14px 0;vertical-align:middle;font:600 15px/1.4 {SANS};color:{INK};white-space:nowrap">'
            f'{e(fmt(it["price"] * it["quantity"]))}</td></tr>'
        )
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">{"".join(rows)}</table>'


def tracker(step: int, cancelled: bool = False) -> str:
    """Order progress: 0 placed, 1 processing, 2 shipped, 3 delivered."""
    labels = ["Placed", "Processing", "Shipped", "Delivered"]
    cells = []
    for i, label in enumerate(labels):
        done = not cancelled and i <= step
        dot_bg = (SUN if i == step else INK) if done else "#ffffff"
        dot_fg = "#ffffff" if done else MUTE
        border = "" if done else f"border:1px solid {LINE};"
        mark = "&#10003;" if done and i < step else str(i + 1)
        bar_l = (INK if not cancelled and i <= step else LINE) if i > 0 else "transparent"
        bar_r = (INK if not cancelled and i < step else LINE) if i < 3 else "transparent"
        cells.append(f"""<td width="25%" align="center" style="vertical-align:top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="50%" style="padding-top:15px"><div style="height:2px;background:{bar_l}"></div></td>
<td><div style="width:32px;height:32px;line-height:32px;border-radius:50%;background:{dot_bg};{border}
color:{dot_fg};font:600 13px/32px {SANS};text-align:center">{mark}</div></td>
<td width="50%" style="padding-top:15px"><div style="height:2px;background:{bar_r}"></div></td></tr></table>
<p style="margin:8px 0 0;font:500 12px/1.3 {SANS};color:{INK if done else MUTE}">{label}</p></td>""")
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>{"".join(cells)}</tr></table>'


def coupon(code: str, headline: str, note: str = "") -> str:
    return f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
style="border:2px dashed {SUN};border-radius:20px;background:#fff7ee"><tr><td align="center" style="padding:26px 20px">
<p style="margin:0;font:600 11px/1.4 {SANS};letter-spacing:3px;text-transform:uppercase;color:{SUN}">{e(headline)}</p>
<p style="margin:10px 0 0;font:400 34px/1 {SERIF};letter-spacing:6px;color:{INK}">{e(code)}</p>
{f'<p style="margin:10px 0 0;font:400 13px/1.5 {SANS};color:{SOFT}">{e(note)}</p>' if note else ''}
</td></tr></table>"""


def notice(html: str, tone: str = "warn") -> str:
    bg, fg, bar = {
        "warn": ("#fff4e5", "#7a4a00", AMBER),
        "error": ("#fdecec", "#8a1c1c", "#e5484d"),
        "ok": ("#e9f8ef", "#14532d", "#22c55e"),
        "info": ("#e8f9fd", "#0b4a5a", AQUA),
    }[tone]
    return (
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{bg};'
        f'border-left:4px solid {bar};border-radius:12px"><tr><td style="padding:16px 18px;'
        f'font:400 14px/1.6 {SANS};color:{fg}">{html}</td></tr></table>'
    )


def address_block(a: dict) -> str:
    lines = [a.get("fullName"), a.get("line1"), a.get("line2"),
             " ".join(x for x in [a.get("city"), a.get("state"), a.get("postalCode")] if x),
             a.get("country"), a.get("phone")]
    return "<br>".join(e(x) for x in lines if x)


def perks() -> str:
    items = [("Free shipping", "on orders over $15"), ("Cruelty-free", "ISO & GMP certified"), ("Easy replacement", "within 7 days")]
    cells = "".join(
        f'<td class="stack" width="33%" align="center" style="padding:6px">'
        f'<div style="width:36px;height:36px;margin:0 auto;border-radius:50%;background:#ffffff;'
        f'font:400 18px/36px {SERIF};color:{SUN};text-align:center">&Sigma;</div>'
        f'<p style="margin:8px 0 0;font:600 12px/1.3 {SANS};color:{INK}">{t}</p>'
        f'<p style="margin:2px 0 0;font:400 11px/1.3 {SANS};color:{MUTE}">{s}</p></td>'
        for t, s in items
    )
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>{cells}</tr></table>'


# ───────────── page ─────────────
def page(ctx: Ctx, *, preheader: str, body: str, audience: str = "customer", footer_note: str = "") -> str:
    logo = ctx.img("/logo.png", 190, png=True)
    footer_logo = ctx.img("/logo-light.png", 150, png=True)
    social = " &nbsp;&middot;&nbsp; ".join(
        f'<a href="{u}" style="color:#ffffff;text-decoration:none">{n}</a>' for n, u in SOCIALS
    )
    nav = " &nbsp;&nbsp; ".join(
        f'<a href="{e(url(h))}" style="color:{INK};text-decoration:none;font:500 13px/1 {SANS}">{n}</a>'
        for n, h in [("Shop", "/shop"), ("Journal", "/blog"), ("My account", "/account"), ("Help", "/contact")]
    )
    is_admin = audience == "admin"
    header_extra = (
        f'<p style="margin:12px 0 0;font:600 10px/1 {SANS};letter-spacing:3px;color:{MUTE}">STORE NOTIFICATION</p>'
        if is_admin else f'<p style="margin:18px 0 0">{nav}</p>'
    )
    perks_row = "" if is_admin else f'{spacer(8)}{row(card(perks(), CREAM, pad="18px 10px"))}'
    note = footer_note or (
        "You're receiving this email because of activity on your Dermisque account."
        if not is_admin else "Automated notification from your Dermisque store."
    )
    return f"""<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>Dermisque</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400&family=Jost:wght@400;500;600&display=swap');
body{{margin:0;padding:0;background:{CREAM}}} a{{color:{INK}}} img{{border:0;outline:none}}
@media (max-width:620px){{
  .px{{padding-left:22px!important;padding-right:22px!important}}
  .h1{{font-size:28px!important}}
  .stack{{display:block!important;width:100%!important}}
}}
</style></head>
<body style="margin:0;padding:0;background:{CREAM}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">{e(preheader)}&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{CREAM}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 20px 50px -30px rgba(11,11,15,.35)">
<tr><td style="height:6px;line-height:6px;font-size:0;background:{SUN};background-image:{GRADIENT}">&nbsp;</td></tr>
<tr><td align="center" style="padding:30px 30px 6px">
<a href="{e(url('/'))}"><img src="{e(logo)}" width="190" alt="DΣRMISQUΣ — Sum of Beauty" style="display:block;width:190px;height:auto"></a>
{header_extra}</td></tr>
{spacer(18)}
<tr><td style="padding:0 40px" class="px"><div style="height:1px;background:{LINE}"></div></td></tr>
{spacer(34)}
{body}
{spacer(36)}
{perks_row}
{spacer(30)}
<tr><td style="background:{INK};padding:34px 40px" class="px" align="center">
<img src="{e(footer_logo)}" width="150" alt="Dermisque" style="display:block;width:150px;height:auto;margin:0 auto">
<p style="margin:16px 0 0;font:500 13px/1.6 {SANS};color:#ffffff">{social}</p>
<p style="margin:16px 0 0;font:400 12px/1.7 {SANS};color:rgba(255,255,255,.55)">
Questions? Write to <a href="mailto:{SUPPORT}" style="color:{AMBER};text-decoration:none">{SUPPORT}</a><br>
{COMPANY} &middot; {ADDRESS}</p>
<p style="margin:14px 0 0;font:400 11px/1.6 {SANS};color:rgba(255,255,255,.4)">{e(note)}</p>
</td></tr>
<tr><td style="height:6px;line-height:6px;font-size:0;background:{AQUA};background-image:{GRADIENT}">&nbsp;</td></tr>
</table></td></tr></table></body></html>"""


def to_text(html: str) -> str:
    """Plain-text alternative generated from the HTML body."""
    s = re.sub(r"(?is)<(style|head)[^>]*>.*?</\1>", "", html)
    s = re.sub(r'(?is)<div style="display:none.*?</div>', "", s)
    s = re.sub(r'(?is)<a [^>]*href="([^"]+)"[^>]*>(.*?)</a>',
               lambda m: f"{re.sub('<[^>]+>', '', m.group(2)).strip()} ({unescape(m.group(1))})"
               if not m.group(1).startswith("mailto:") else re.sub("<[^>]+>", "", m.group(2)), s)
    s = re.sub(r"(?i)<br\s*/?>|</(p|tr|h1|h2|li)>", "\n", s)
    s = re.sub(r"(?i)</td>", "  ", s)
    s = unescape(re.sub(r"<[^>]+>", "", s))
    s = re.sub(r"[ \t​‌\xa0]+", " ", s)
    lines = [ln.strip() for ln in s.splitlines()]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()
