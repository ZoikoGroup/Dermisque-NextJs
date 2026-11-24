from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    database_url: str = f"sqlite:///{(BASE_DIR / 'dermisque.db').as_posix()}"
    jwt_secret: str = "dev-only-insecure-secret-change-me"
    jwt_expire_days: int = 7
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    # Public base URL of this API, used to build absolute URLs for uploaded images.
    public_url: str = "http://127.0.0.1:8000"
    upload_dir: Path = BASE_DIR / "uploads"

    admin_email: str = "info@dermisque.com"
    admin_password: str = "Admin@12345"

    # Shop rules (amounts in cents, USD)
    free_shipping_threshold: int = 1500
    flat_shipping: int = 499
    tax_rate: float = 0.0  # prices include taxes

    # Display / checkout currencies. Prices are stored in USD; other currencies use a fixed rate.
    gbp_rate: float = 0.79  # 1 USD = 0.79 GBP

    # ── Card payments (Stripe) ──
    # With both keys set, card payments go through Stripe; without them checkout uses the demo processor.
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""

    # ── Black Friday campaign (US Eastern time: EST = UTC-5 in November) ──
    # Sale prices apply automatically between these instants; bundles can only be bought while live.
    black_friday_start: str = "2026-11-20T00:00:00-05:00"
    black_friday_end: str = "2026-11-30T23:59:59-05:00"
    black_friday_single_pct: int = 40
    black_friday_combo_pct: int = 45

    # ── Email ──
    smtp_host: str = ""
    smtp_port: int = 465  # 465 = implicit SSL, 587 = STARTTLS
    smtp_username: str = ""
    smtp_password: str = ""
    mail_from: str = "Info@dermisque.com"
    mail_from_name: str = "Dermisque"
    admin_notify_email: str = "Info@dermisque.com"
    # False = render and log emails without contacting the SMTP server
    mail_enabled: bool = True
    # Public storefront URL used for links (and images) in emails
    site_url: str = "http://localhost:3100"
    # Storefront /public folder, used to embed product images & logo inline when available
    frontend_public_dir: Path = BASE_DIR.parent / "frontend" / "public"
    # Abandoned-cart reminders: hours after the cart was last changed, one email per entry
    cart_reminder_hours: str = "1,24"
    cart_reminder_check_minutes: int = 5
    low_stock_threshold: int = 5

    # ── Shop assistant (chatbot) ──
    # With a key the chatbot answers with Claude; without one it uses the built-in assistant.
    anthropic_api_key: str = ""
    chat_model: str = "claude-opus-5-5"

    @property
    def reminder_hours(self) -> list[float]:
        return [float(h) for h in self.cart_reminder_hours.split(",") if h.strip()]

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.stripe_secret_key and self.stripe_publishable_key)

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_username and self.smtp_password)


settings = Settings()
