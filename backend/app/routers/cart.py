"""Server copy of a signed-in shopper's bag (for abandoned-cart reminders and cross-device carts)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cart, Product, User
from ..schemas import Ok, Schema
from ..security import get_current_user

router = APIRouter(prefix="/api/account/cart", tags=["cart"])


class CartLineIn(Schema):
    id: str = Field(max_length=32)
    quantity: int = Field(ge=1, le=99)


class CartIn(Schema):
    items: list[CartLineIn] = Field(max_length=50)


class CartLineOut(Schema):
    id: str
    slug: str
    name: str
    price: int
    image: str
    stock: int
    quantity: int


@router.get("", response_model=list[CartLineOut])
def get_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.get(Cart, user.id)
    if not cart or not cart.items:
        return []
    qty = {i["id"]: i["quantity"] for i in cart.items}
    products = db.scalars(select(Product).where(Product.id.in_(qty), Product.is_active.is_(True))).all()
    return [
        CartLineOut(id=p.id, slug=p.slug, name=p.name, price=p.price, image=p.image, stock=p.stock,
                    quantity=min(qty[p.id], p.stock))
        for p in products
        if p.stock > 0
    ]


@router.put("", response_model=Ok)
def save_cart(body: CartIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = [{"id": i.id, "quantity": i.quantity} for i in body.items]
    cart = db.get(Cart, user.id)
    if not items:
        if cart:
            db.delete(cart)
            db.commit()
        return Ok()
    if cart and cart.items == items:
        return Ok()  # unchanged — don't restart the reminder clock
    if not cart:
        cart = Cart(user_id=user.id)
        db.add(cart)
    cart.items = items
    cart.updated_at = datetime.now(timezone.utc)
    cart.reminders_sent = 0  # a changed bag starts a fresh reminder sequence
    db.commit()
    return Ok()
