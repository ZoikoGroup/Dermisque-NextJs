from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..emails import notify
from ..models import User
from ..schemas import (
    AuthOut, ForgotPasswordIn, LoginIn, Ok, PasswordIn, ProfileIn, RegisterIn, ResetPasswordIn, UserOut,
)
from ..security import (
    COOKIE_NAME,
    create_access_token,
    create_reset_token,
    get_current_user,
    hash_password,
    read_reset_token,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _issue(user: User, response: Response) -> AuthOut:
    token = create_access_token(user)
    # Cookie is set for direct browser use; the Next.js app stores the token itself.
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        samesite="lax",
        secure=settings.public_url.startswith("https"),
        max_age=settings.jwt_expire_days * 86400,
    )
    return AuthOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=AuthOut, status_code=201)
def register(body: RegisterIn, response: Response, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    user = User(name=body.name.strip(), email=email, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    notify.welcome(user)
    return _issue(user, response)


@router.post("/login", response_model=AuthOut)
def login(body: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not user.is_active or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return _issue(user, response)


@router.post("/logout", response_model=Ok)
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)
    return Ok()


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=AuthOut)
def update_me(
    body: ProfileIn, response: Response, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    user.name = body.name.strip()
    user.phone = body.phone
    db.commit()
    return _issue(user, response)  # re-issue so the token carries the new name


@router.post("/change-password", response_model=Ok)
def change_password(body: PasswordIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    if not any(c.isalpha() for c in body.new_password) or not any(c.isdigit() for c in body.new_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Password must include a letter and a number")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    notify.password_changed(user)
    return Ok()


def _strong(password: str):
    if not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Password must include a letter and a number")


@router.post("/forgot-password", response_model=Ok)
def forgot_password(body: ForgotPasswordIn, db: Session = Depends(get_db)):
    """Always returns OK so the endpoint can't be used to discover which emails have accounts."""
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if user and user.is_active:
        link = f"{settings.site_url.rstrip('/')}/reset-password?token={create_reset_token(user)}"
        notify.password_reset(user, link)
    return Ok()


@router.post("/reset-password", response_model=Ok)
def reset_password(body: ResetPasswordIn, db: Session = Depends(get_db)):
    user = read_reset_token(body.token, db)
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This reset link is invalid or has expired. Please request a new one.")
    _strong(body.password)
    user.password_hash = hash_password(body.password)
    db.commit()
    notify.password_changed(user)
    return Ok()
