from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..currency import rates
from ..database import get_db
from ..emails import notify
from ..models import Message, Subscriber
from ..schemas import MessageIn, Ok, SubscribeIn

router = APIRouter(prefix="/api", tags=["content"])


@router.post("/subscribe", response_model=Ok)
def subscribe(body: SubscribeIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if not db.scalar(select(Subscriber).where(Subscriber.email == email)):
        db.add(Subscriber(email=email))
        db.commit()
        notify.newsletter(email)
    return Ok()


@router.post("/messages", response_model=Ok, status_code=201)
def send_message(body: MessageIn, db: Session = Depends(get_db)):
    data = body.model_dump(mode="json")
    db.add(Message(**data))
    db.commit()
    notify.message(data)  # acknowledgement to the customer + alert to the store
    return Ok()


@router.get("/currencies")
def currencies() -> dict[str, float]:
    """Exchange rates from USD (prices are stored in USD)."""
    return rates()
