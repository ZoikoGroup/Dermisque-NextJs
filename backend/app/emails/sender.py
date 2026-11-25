"""SMTP delivery. Emails are rendered in the request, then sent on a small background pool so
checkout and forms never wait on the mail server. Every email is recorded in `email_log`."""

import logging
import smtplib
import ssl
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

import certifi

from ..config import settings
from ..database import SessionLocal
from ..models import EmailLog

log = logging.getLogger("dermisque.mail")
_pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="mail")


@dataclass
class InlineImage:
    cid: str  # without angle brackets
    data: bytes
    subtype: str  # "png" | "jpeg"


@dataclass
class Email:
    to: str
    subject: str
    html: str
    text: str
    template: str
    images: list[InlineImage] = field(default_factory=list)
    reply_to: str | None = None


def _build(mail: Email) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = mail.subject
    msg["From"] = formataddr((settings.mail_from_name, settings.mail_from))
    msg["To"] = mail.to
    msg["Message-ID"] = make_msgid(domain=settings.mail_from.split("@")[-1])
    if mail.reply_to:
        msg["Reply-To"] = mail.reply_to
    msg.set_content(mail.text)
    msg.add_alternative(mail.html, subtype="html")
    html_part = msg.get_payload()[1]
    for img in mail.images:  # multipart/related: images referenced as cid:...
        html_part.add_related(img.data, maintype="image", subtype=img.subtype, cid=f"<{img.cid}>")
    return msg


def _smtp_send(msg: EmailMessage) -> None:
    # certifi's CA bundle — the OS store on Windows/macOS Python often lacks the issuing CA.
    ctx = ssl.create_default_context(cafile=certifi.where())
    if settings.smtp_port == 465:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=ctx, timeout=30) as s:
            s.login(settings.smtp_username, settings.smtp_password)
            s.send_message(msg)
    else:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as s:
            s.starttls(context=ctx)
            s.login(settings.smtp_username, settings.smtp_password)
            s.send_message(msg)


RETRY_WAITS = (5, 30)  # seconds before the 2nd and 3rd attempt


def _temporary(e: Exception) -> bool:
    """Worth another try: dropped/refused connections, timeouts and 4xx "try again later" replies.
    Wrong password (535) or a rejected address (5xx) will not fix themselves, so they fail at once."""
    if isinstance(e, smtplib.SMTPResponseException):
        return 400 <= e.smtp_code < 500
    if isinstance(e, smtplib.SMTPRecipientsRefused):
        return all(400 <= code < 500 for code, _ in e.recipients.values())
    return isinstance(e, (smtplib.SMTPServerDisconnected, OSError))  # OSError covers timeouts and refused


def _send_with_retry(mail: Email) -> None:
    msg = _build(mail)
    for attempt, wait in enumerate((*RETRY_WAITS, None), start=1):
        try:
            _smtp_send(msg)
            return
        except Exception as e:
            if wait is None or not _temporary(e):
                raise
            log.warning("Email to %s failed on attempt %s (%s: %s); retrying in %ss",
                        mail.to, attempt, type(e).__name__, e, wait)
            time.sleep(wait)


def _deliver(log_id: str, mail: Email) -> None:
    status, error = "SENT", None
    try:
        if not settings.mail_enabled:
            status, error = "SKIPPED", "MAIL_ENABLED is off"
        elif not settings.smtp_configured:
            status, error = "SKIPPED", "SMTP is not configured"
        else:
            _send_with_retry(mail)
    except Exception as e:  # noqa: BLE001 — record any delivery problem
        status, error = "FAILED", f"{type(e).__name__}: {e}"[:1000]
        log.exception("Email to %s failed (%s)", mail.to, mail.template)
    try:
        with SessionLocal() as db:
            row = db.get(EmailLog, log_id)
            if row:
                row.status, row.error = status, error
                row.sent_at = datetime.now(timezone.utc) if status == "SENT" else None
                db.commit()
    except Exception:  # noqa: BLE001 — runs on the mail thread, where an error would vanish silently
        log.exception("Could not record the result of email %s", log_id)
    log.info("Email %s -> %s [%s] %s", mail.template, mail.to, status, error or "")


def send(mail: Email, wait: bool = False) -> str:
    """Queue an email (returns the log id). `wait=True` sends synchronously — used for test sends."""
    with SessionLocal() as db:
        row = EmailLog(to=mail.to, subject=mail.subject[:255], template=mail.template)
        db.add(row)
        db.commit()
        log_id = row.id
    if wait:
        _deliver(log_id, mail)
    else:
        _pool.submit(_deliver, log_id, mail)
    return log_id


def send_many(mails: list[Email]) -> None:
    for m in mails:
        send(m)
