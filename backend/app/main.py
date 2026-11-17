import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from .config import settings
from .database import Base, engine
from .emails.notify import process_abandoned_carts
from .routers import account, admin, auth, blog, cart, catalog, chat, checkout, content, emails, promotions


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    _add_missing_columns()
    task = asyncio.create_task(_cart_reminder_loop())
    yield
    task.cancel()


log = logging.getLogger("dermisque")


async def _cart_reminder_loop():
    """Checks for abandoned carts every few minutes and sends due reminder emails."""
    await asyncio.sleep(20)  # let the app finish starting
    while True:
        try:
            n = await asyncio.to_thread(process_abandoned_carts)
            if n:
                log.info("Sent %s abandoned-cart reminder(s)", n)
        except Exception:  # noqa: BLE001 — keep the loop alive
            log.exception("Abandoned-cart job failed")
        await asyncio.sleep(settings.cart_reminder_check_minutes * 60)


def _add_missing_columns():
    """Tiny forward-only migration for columns added after a database was created."""
    cols = {c["name"] for c in inspect(engine).get_columns("orders")}
    with engine.begin() as conn:
        if "currency" not in cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD'"))
        if "fx_rate" not in cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN fx_rate FLOAT NOT NULL DEFAULT 1"))
        if "details" not in {c["name"] for c in inspect(engine).get_columns("messages")}:
            conn.execute(text("ALTER TABLE messages ADD COLUMN details JSON"))


app = FastAPI(
    title="Dermisque API",
    version="1.0.0",
    description="E-commerce backend for Dermisque — Sum of Beauty.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    """Flatten Pydantic errors into one friendly message the UI can show."""
    errors = exc.errors()
    first = errors[0] if errors else {}
    field = ".".join(str(p) for p in first.get("loc", [])[1:])
    msg = str(first.get("msg", "Invalid request")).removeprefix("Value error, ")
    # model-level checks already read as a sentence; field errors get the field name in front
    return JSONResponse(status_code=422, content={"detail": f"{field}: {msg}" if field else msg, "errors": errors and [
        {"loc": e.get("loc"), "msg": e.get("msg")} for e in errors
    ]})


for r in (
    auth.router,
    catalog.router,
    account.router,
    checkout.router,
    content.router,
    admin.router,
    blog.router,
    blog.admin_router,
    cart.router,
    chat.router,
    emails.router,
    promotions.router,
):
    app.include_router(r)

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
