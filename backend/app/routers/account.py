from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..emails import notify
from ..models import Address, Order, Product, User
from ..schemas import AddressIn, AddressOut, Ok, OrderOut
from ..security import get_current_user
from ..serializers import order_out

router = APIRouter(prefix="/api/account", tags=["account"])


# ───────────── Addresses ─────────────
@router.get("/addresses", response_model=list[AddressOut])
def list_addresses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(Address).where(Address.user_id == user.id).order_by(Address.is_default.desc())
    ).all()


def _clear_default(db: Session, user_id: str):
    db.execute(update(Address).where(Address.user_id == user_id).values(is_default=False))


@router.post("/addresses", response_model=AddressOut, status_code=201)
def create_address(body: AddressIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    has_any = db.scalar(select(Address.id).where(Address.user_id == user.id).limit(1))
    make_default = body.is_default or not has_any
    if make_default:
        _clear_default(db, user.id)
    a = Address(user_id=user.id, **body.model_dump(exclude={"is_default"}), is_default=make_default)
    db.add(a)
    db.commit()
    return a


def _own_address(db: Session, user: User, address_id: str) -> Address:
    a = db.get(Address, address_id)
    if not a or a.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Address not found")
    return a


@router.put("/addresses/{address_id}", response_model=AddressOut)
def update_address(
    address_id: str, body: AddressIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    a = _own_address(db, user, address_id)
    if body.is_default:
        _clear_default(db, user.id)
    for k, v in body.model_dump().items():
        setattr(a, k, v)
    db.commit()
    return a


@router.delete("/addresses/{address_id}", response_model=Ok)
def delete_address(address_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = _own_address(db, user, address_id)
    was_default = a.is_default
    db.delete(a)
    db.flush()
    if was_default:
        nxt = db.scalar(select(Address).where(Address.user_id == user.id).limit(1))
        if nxt:
            nxt.is_default = True
    db.commit()
    return Ok()


# ───────────── Orders ─────────────
@router.get("/orders", response_model=list[OrderOut])
def my_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Order)
        .where(Order.user_id == user.id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    ).all()
    return [order_out(o) for o in rows]


def _own_order(db: Session, user: User, order_number: str) -> Order:
    o = db.scalar(
        select(Order).where(Order.order_number == order_number).options(selectinload(Order.items))
    )
    if not o or o.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return o


@router.get("/orders/{order_number}", response_model=OrderOut)
def my_order(order_number: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return order_out(_own_order(db, user, order_number))


@router.post("/orders/{order_number}/cancel", response_model=OrderOut)
def cancel_order(order_number: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    o = _own_order(db, user, order_number)
    if o.status not in ("PENDING", "PROCESSING"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This order can no longer be cancelled")
    old_status, old_payment = o.status, o.payment_status
    restock(db, o)
    o.status = "CANCELLED"
    if o.payment_status == "PAID":
        o.payment_status = "REFUNDED"
    db.commit()
    notify.order_status_changed(o, old_status, old_payment, by="customer")
    return order_out(o)


def restock(db: Session, order: Order):
    for item in order.items:
        if item.product_id:
            p = db.get(Product, item.product_id)
            if p:
                p.stock += item.quantity
