from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User

ALGORITHM = "HS256"
COOKIE_NAME = "dq_session"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "iat": now,
        "exp": now + timedelta(days=settings.jwt_expire_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


# ── password reset tokens ──
# Signed with a derived key and a distinct audience, so they can never be used as session tokens.
# They embed a fragment of the current password hash: once the password changes, the link is dead.
_RESET_AUD = "dermisque:password-reset"


def _reset_key() -> str:
    return settings.jwt_secret + ":password-reset"


def create_reset_token(user: User, minutes: int = 60) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": user.id, "aud": _RESET_AUD, "pwh": user.password_hash[-16:], "iat": now,
               "exp": now + timedelta(minutes=minutes)}
    return jwt.encode(payload, _reset_key(), algorithm=ALGORITHM)


def read_reset_token(token: str, db: Session) -> User | None:
    try:
        data = jwt.decode(token, _reset_key(), algorithms=[ALGORITHM], audience=_RESET_AUD)
    except jwt.PyJWTError:
        return None
    user = db.get(User, data.get("sub"))
    if not user or not user.is_active or user.password_hash[-16:] != data.get("pwh"):
        return None
    return user


def _token_from_request(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return request.cookies.get(COOKIE_NAME)


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    token = _token_from_request(request)
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    user = db.get(User, payload.get("sub"))
    if not user or not user.is_active:
        return None
    return user


def get_current_user(user: User | None = Depends(get_optional_user)) -> User:
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user
