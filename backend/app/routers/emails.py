"""Admin: email log, template previews and test sends."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from pydantic import EmailStr
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import SessionLocal, get_db
from ..emails.notify import PREVIEWS
from ..emails.sender import send
from ..models import EmailLog
from ..schemas import Schema, UTCDatetime
from ..security import require_admin

router = APIRouter(prefix="/api/admin/emails", tags=["admin"], dependencies=[Depends(require_admin)])


class EmailLogOut(Schema):
    id: str
    to: str
    subject: str
    template: str
    status: str
    error: str | None = None
    created_at: UTCDatetime
    sent_at: UTCDatetime | None = None


class EmailOverview(Schema):
    configured: bool
    enabled: bool
    sender: str
    admin_recipient: str
    reminder_hours: list[float]
    counts: dict[str, int]
    templates: list[dict]
    log: list[EmailLogOut]


class TestIn(Schema):
    template: str
    to: EmailStr


@router.get("", response_model=EmailOverview)
def overview(db: Session = Depends(get_db)):
    counts = dict(db.execute(select(EmailLog.status, func.count()).group_by(EmailLog.status)).all())
    log = db.scalars(select(EmailLog).order_by(EmailLog.created_at.desc()).limit(100)).all()
    return EmailOverview(
        configured=settings.smtp_configured,
        enabled=settings.mail_enabled,
        sender=f"{settings.mail_from_name} <{settings.mail_from}>",
        admin_recipient=settings.admin_notify_email,
        reminder_hours=settings.reminder_hours,
        counts=counts,
        templates=[{"key": k, "name": n, "audience": a} for k, (n, a, _) in PREVIEWS.items()],
        log=[EmailLogOut.model_validate(r) for r in log],
    )


def _factory(key: str):
    if key not in PREVIEWS:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown template")
    return PREVIEWS[key][2]


@router.get("/preview/{key}", response_class=HTMLResponse)
def preview(key: str):
    mail = _factory(key)(False)  # absolute image URLs for the browser
    return HTMLResponse(mail.html, headers={"X-Email-Subject": mail.subject.encode("utf-8").decode("latin-1", "ignore")})


@router.post("/test")
def send_test(body: TestIn):
    mail = _factory(body.template)(True)
    mail.to = body.to
    mail.subject = f"[Test] {mail.subject}"
    log_id = send(mail, wait=True)
    with SessionLocal() as db:
        row = db.get(EmailLog, log_id)
        result = {"status": row.status, "error": row.error, "at": datetime.now().isoformat()}
    if result["status"] == "FAILED":
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"SMTP error — {result['error']}")
    return result
