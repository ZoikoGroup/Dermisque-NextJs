"""Request/response schemas. JSON uses camelCase; Python uses snake_case."""

import json
import re
from datetime import date, datetime, timedelta, timezone
from typing import Annotated, Generic, Literal, TypeVar

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel

T = TypeVar("T")

# SQLite drops tzinfo; all stored times are UTC, so re-attach it for correct ISO output.
UTCDatetime = Annotated[datetime, AfterValidator(lambda d: d if d.tzinfo else d.replace(tzinfo=timezone.utc))]


class Schema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class Page(Schema, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


class Ok(Schema):
    ok: bool = True


# ───────────── Auth & users ─────────────
class UserOut(Schema):
    id: str
    name: str
    email: str
    phone: str | None = None
    role: str
    created_at: UTCDatetime


class AuthOut(Schema):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterIn(Schema):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def strong(cls, v: str) -> str:
        if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
            raise ValueError("Password must include a letter and a number")
        return v


class LoginIn(Schema):
    email: EmailStr
    password: str


class ProfileIn(Schema):
    name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=40)


class PasswordIn(Schema):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ForgotPasswordIn(Schema):
    email: EmailStr


class ResetPasswordIn(Schema):
    token: str = Field(min_length=10, max_length=2000)
    password: str = Field(min_length=8, max_length=128)


# ───────────── Addresses ─────────────
class AddressIn(Schema):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=6, max_length=40)
    line1: str = Field(min_length=3, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=2, max_length=120)
    state: str = Field(min_length=2, max_length=120)
    postal_code: str = Field(min_length=3, max_length=20)
    country: str = Field(min_length=2, max_length=80)
    is_default: bool = False


class AddressOut(AddressIn):
    id: str


# ───────────── Catalogue ─────────────
class CategoryOut(Schema):
    id: str
    name: str
    slug: str
    description: str | None = None
    sort_order: int = 0
    product_count: int = 0


class CategoryRef(Schema):
    id: str
    name: str
    slug: str


class Ingredient(Schema):
    name: str
    detail: str = ""


class Faq(Schema):
    q: str
    a: str


class ProductCard(Schema):
    id: str
    slug: str
    name: str
    tagline: str | None = None
    price: int
    compare_at_price: int | None = None
    image: str
    stock: int
    featured: bool = False
    is_active: bool = True
    rating: float = 0
    review_count: int = 0
    concerns: list[str] = []


class ReviewOut(Schema):
    id: str
    rating: int
    title: str | None = None
    body: str
    approved: bool = True
    created_at: UTCDatetime
    user_name: str


class ProductDetail(ProductCard):
    description: str
    gallery: list[str] = []
    ingredients: list[Ingredient] = []
    benefits: list[str] = []
    how_to_use: list[str] = []
    faqs: list[Faq] = []
    size: str | None = None
    categories: list[CategoryRef] = []
    reviews: list[ReviewOut] = []


class ReviewIn(Schema):
    rating: int = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=120)
    body: str = Field(min_length=10, max_length=2000)


# ───────────── Checkout & orders ─────────────
class CouponCheckIn(Schema):
    code: str
    subtotal: int = Field(ge=0)


class CouponApplied(Schema):
    code: str
    type: str
    value: int
    min_order: int
    description: str | None = None


class CartLine(Schema):
    id: str
    quantity: int = Field(ge=1, le=99)


class CardIn(Schema):
    number: str
    expiry: str
    cvc: str
    name: str


class CheckoutIn(Schema):
    items: list[CartLine] = Field(min_length=1)
    address: AddressIn
    save_address: bool = False
    payment_method: Literal["CARD", "COD"]
    card: CardIn | None = None
    # Stripe PaymentIntent the customer has already confirmed (card orders when Stripe is enabled)
    payment_intent_id: str | None = Field(default=None, max_length=64)
    coupon: str | None = None
    notes: str | None = Field(default=None, max_length=500)
    currency: Literal["USD", "GBP"] = "USD"


class PaymentIntentIn(Schema):
    items: list[CartLine] = Field(min_length=1)
    coupon: str | None = None
    currency: Literal["USD", "GBP"] = "USD"
    # the intent from an earlier attempt on this page; updated instead of creating a new one
    payment_intent_id: str | None = Field(default=None, max_length=64)


class PaymentIntentOut(Schema):
    client_secret: str
    payment_intent_id: str
    amount: int  # minor units of `currency`
    currency: str


class OrderItemOut(Schema):
    id: str
    product_id: str | None = None
    name: str
    slug: str | None = None
    image: str
    price: int
    quantity: int


class CustomerRef(Schema):
    id: str
    name: str
    email: str


class OrderOut(Schema):
    id: str
    order_number: str
    status: str
    payment_method: str
    payment_status: str
    subtotal: int
    discount: int
    shipping: int
    tax: int
    total: int
    currency: str = "USD"
    fx_rate: float = 1.0
    coupon_code: str | None = None
    address: dict
    notes: str | None = None
    tracking_number: str | None = None
    created_at: UTCDatetime
    updated_at: UTCDatetime
    items: list[OrderItemOut] = []
    customer: CustomerRef | None = None


# ───────────── Content ─────────────
class SubscribeIn(Schema):
    email: EmailStr


YesNo = Literal["Yes", "No"]


class ConsultationDetails(Schema):
    """Answers from the free consultation form (stored as JSON on the message)."""

    date_of_birth: date
    gender: Literal["Female", "Male", "Non-binary", "Prefer not to say"] | None = None
    address: str | None = Field(default=None, max_length=300)
    preferred_date: date | None = None
    preferred_time: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    previous_consultation: YesNo | None = None
    medications: str | None = Field(default=None, max_length=1000)
    recent_treatments: YesNo | None = None
    consent_online: bool = False
    info_accurate: bool = False


class MessageBase(Schema):
    type: Literal["CONTACT", "CONSULTATION"]
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    subject: str | None = Field(default=None, max_length=200)
    skin_type: str | None = Field(default=None, max_length=60)
    concern: str | None = Field(default=None, max_length=120)
    message: str = Field(default="", max_length=5000)
    details: ConsultationDetails | None = None


class MessageIn(MessageBase):
    @model_validator(mode="after")
    def _check(self):
        self.message = (self.message or "").strip()
        if self.type == "CONTACT":
            if len(self.message) < 10:
                raise ValueError("Please write a message of at least 10 characters")
            return self
        d = self.details
        if d is None:
            raise ValueError("Please complete the consultation form")
        if not (self.phone or "").strip():
            raise ValueError("Please enter your contact number")
        today = date.today()
        if not date(1900, 1, 1) <= d.date_of_birth < today:
            raise ValueError("Please enter a valid date of birth")
        if d.preferred_date and d.preferred_date < today - timedelta(days=1):
            raise ValueError("Your preferred appointment date can't be in the past")
        if not (d.consent_online and d.info_accurate):
            raise ValueError("Please tick both confirmation boxes to continue")
        return self


class MessageOut(MessageBase):
    id: str
    status: str
    created_at: UTCDatetime


# ───────────── Admin ─────────────
class ProductIn(Schema):
    name: str = Field(min_length=2, max_length=200)
    slug: str | None = None
    tagline: str | None = None
    description: str = Field(min_length=10)
    price: int = Field(ge=0)
    compare_at_price: int | None = Field(default=None, ge=0)
    image: str
    gallery: list[str] = []
    ingredients: list[Ingredient] = []
    benefits: list[str] = []
    how_to_use: list[str] = []
    faqs: list[Faq] = []
    size: str | None = None
    stock: int = Field(default=0, ge=0)
    featured: bool = False
    is_active: bool = True
    category_ids: list[str] = []


class OrderUpdateIn(Schema):
    status: Literal["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] | None = None
    payment_status: Literal["UNPAID", "PAID", "REFUNDED"] | None = None
    tracking_number: str | None = None


class CouponIn(Schema):
    code: str = Field(min_length=3, max_length=40)
    description: str | None = None
    type: Literal["PERCENT", "FIXED"] = "PERCENT"
    value: int = Field(ge=1)
    min_order: int = Field(default=0, ge=0)
    usage_limit: int | None = Field(default=None, ge=1)
    first_order_only: bool = False
    active: bool = True
    expires_at: UTCDatetime | None = None


class CouponOut(CouponIn):
    id: str
    used_count: int
    created_at: UTCDatetime


class CustomerOut(UserOut):
    order_count: int = 0
    total_spent: int = 0


class AdminReviewOut(ReviewOut):
    product_name: str
    product_slug: str


class StatusIn(Schema):
    status: str


class StatsOut(Schema):
    revenue: int
    orders: int
    customers: int
    products: int
    avg_order_value: int
    pending_orders: int
    low_stock: list[ProductCard]
    new_messages: int
    revenue_by_day: list[dict]
    status_breakdown: dict[str, int]
    top_products: list[dict]
    recent_orders: list[OrderOut]


# ───────────── Blog ─────────────
class BlogCard(Schema):
    id: str
    title: str
    slug: str
    excerpt: str
    cover_image: str
    category: str
    tags: list[str] = []
    author_name: str
    featured: bool = False
    status: str
    views: int = 0
    reading_time: int = 1
    published_at: UTCDatetime | None = None
    updated_at: UTCDatetime


class BlogPostOut(BlogCard):
    content: str
    meta_title: str | None = None
    meta_description: str | None = None
    schema_markup: str | None = None
    product_ids: list[str] = []


class BlogDetail(BlogPostOut):
    related: list[BlogCard] = []
    products: list[ProductCard] = []


class BlogCategoryOut(Schema):
    name: str
    count: int


class BlogPostIn(Schema):
    title: str = Field(min_length=3, max_length=200)
    slug: str | None = None
    excerpt: str = Field(default="", max_length=500)
    content: str = Field(min_length=20)
    cover_image: str = ""
    category: str = Field(default="Skincare", min_length=2, max_length=80)
    tags: list[str] = []
    author_name: str | None = Field(default=None, max_length=120)
    status: Literal["DRAFT", "PUBLISHED"] = "DRAFT"
    featured: bool = False
    meta_title: str | None = Field(default=None, max_length=200)
    meta_description: str | None = Field(default=None, max_length=300)
    schema_markup: str | None = Field(default=None, max_length=50_000)
    product_ids: list[str] = []
    published_at: UTCDatetime | None = None

    @field_validator("schema_markup")
    @classmethod
    def _valid_schema(cls, v: str | None) -> str | None:
        """Accepts schema.org JSON-LD, with or without the <script> tag around it; stores clean JSON."""
        v = re.sub(r"</?script[^>]*>", "", v or "", flags=re.I).strip()
        if not v:
            return None
        try:
            data = json.loads(v)
        except json.JSONDecodeError as e:
            raise ValueError(f"Schema markup is not valid JSON (line {e.lineno}, column {e.colno}: {e.msg})") from None
        if not isinstance(data, (dict, list)) or not data:
            raise ValueError("Schema markup must be a JSON object, like { \"@context\": \"https://schema.org\", ... }")
        return json.dumps(data, ensure_ascii=False, indent=2)
