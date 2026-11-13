"""POST /api/chat — the website's shop assistant."""

import re
import time
from collections import defaultdict, deque
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..chat import ai, local
from ..chat.knowledge import load
from ..database import get_db
from ..emails.layout import money
from ..models import Order, User
from ..schemas import Schema
from ..security import get_optional_user

router = APIRouter(prefix="/api/chat", tags=["chat"])

MAX_TURNS = 12
WINDOW, LIMIT = 600, 40  # 40 messages per 10 minutes per shopper
_hits: dict[str, deque] = defaultdict(deque)


class ChatTurn(Schema):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatIn(Schema):
    messages: list[ChatTurn] = Field(min_length=1, max_length=40)


class ChatProduct(Schema):
    id: str
    slug: str
    name: str
    price: int
    compare_at_price: int | None = None
    image: str
    stock: int
    rating: float | None = None
    tagline: str = ""


class ChatOut(Schema):
    reply: str
    products: list[ChatProduct] = []
    suggestions: list[str] = []
    mode: Literal["ai", "assistant"]


def _rate_limit(key: str):
    now = time.monotonic()
    q = _hits[key]
    while q and now - q[0] > WINDOW:
        q.popleft()
    if len(q) >= LIMIT:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                            "You're sending messages very quickly — please wait a moment and try again.")
    q.append(now)


def _user_context(db: Session, user: User | None) -> tuple[str, dict | None]:
    if not user:
        return "SHOPPER: not signed in (no order data available).", None
    orders = db.scalars(
        select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc()).limit(5)
    ).all()
    rows = [{
        "number": o.order_number,
        "date": o.created_at.strftime("%d %b %Y"),
        "status": o.status,
        "payment": o.payment_status,
        "total": money(o.total, o.currency or "USD", o.fx_rate or 1),
        "tracking": o.tracking_number,
        "items": ", ".join(f"{i.quantity}× {i.name}" for i in o.items),
    } for o in orders]
    text = f"SHOPPER: signed in as {user.name.split(' ')[0]}.\n" + (
        "Their most recent orders (link to /account/orders/<number>):\n" + "\n".join(
            f"- #{r['number']} placed {r['date']}: status {r['status']}, payment {r['payment']}, total {r['total']}"
            f"{', tracking ' + r['tracking'] if r['tracking'] else ''}; items: {r['items']}" for r in rows)
        if rows else "They have not placed any orders yet.")
    return text, {"name": user.name, "orders": rows}


@router.post("", response_model=ChatOut)
def chat(body: ChatIn, request: Request, user: User | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    client = request.headers.get("x-shopper-ip") or (request.client.host if request.client else "anon")
    _rate_limit(user.id if user else client)

    turns = body.messages[-MAX_TURNS:]
    while turns and turns[0].role != "user":  # the API expects the conversation to start with the shopper
        turns = turns[1:]
    if not turns or turns[-1].role != "user":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The last message must come from the shopper")
    question = turns[-1].content[:1000]

    kb = load()
    context, user_data = _user_context(db, user)

    text, mode = None, "assistant"
    if ai.available():
        history = [{"role": t.role, "content": t.content[:2000]} for t in turns[:-1]]
        history.append({"role": "user", "content": question})
        text = ai.reply(kb, history, context)
        mode = "ai" if text else "assistant"

    if text:
        slugs = list(dict.fromkeys(re.findall(r"/product/([a-z0-9-]+)", text)))
        by_slug = {p.slug: p for p in kb.products}
        products = [by_slug[s] for s in slugs if s in by_slug][:3]
        suggestions: list[str] = []
    else:
        text, products, suggestions = local.answer(kb, question, user_data)

    return ChatOut(reply=text, products=[ChatProduct(**p.card()) for p in products],
                   suggestions=suggestions[:3], mode=mode)
