"""Seed catalogue, coupons and demo accounts.

Product actives, sizes and "helps to" claims come from the product packaging
(see app/data/catalog.json). Run:  python -m app.seed
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select

from .config import settings
from .database import Base, SessionLocal, engine
from .models import Address, Category, Coupon, Order, OrderItem, Product, User
from .security import hash_password
from .blog_seed import seed_blog

DATA = json.loads((Path(__file__).parent / "data" / "catalog.json").read_text(encoding="utf-8"))

DEMO_ADDRESS = {
    "full_name": "Demo Customer",
    "phone": "+1 555 0100",
    "line1": "1401 21st Street",
    "line2": "Suite R",
    "city": "Sacramento",
    "state": "CA",
    "postal_code": "95811",
    "country": "United States",
}


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Seeding categories...")
        cats: dict[str, Category] = {}
        for c in DATA["categories"]:
            row = db.scalar(select(Category).where(Category.slug == c["slug"])) or Category(slug=c["slug"])
            row.name, row.description, row.sort_order = c["name"], c["description"], c["sort_order"]
            db.add(row)
            cats[c["slug"]] = row
        db.flush()

        print("Seeding products...")
        for p in DATA["products"]:
            row = db.scalar(select(Product).where(Product.slug == p["slug"]))
            if not row:
                row = Product(slug=p["slug"], stock=p.get("stock", 120))
                db.add(row)
            row.name = p["name"]
            row.tagline = p["tagline"]
            row.description = p["description"]
            row.price = p["price"]
            row.image = p["image"]
            row.gallery = [p["image"]]
            row.size = p["size"]
            row.featured = p["featured"]
            row.ingredients = p["ingredients"]
            row.benefits = p["benefits"]
            row.how_to_use = p["how_to_use"]
            row.faqs = p["faqs"]
            row.categories = [cats[s] for s in p["concerns"] if s in cats]

        print("Seeding coupons...")
        for code, desc, value, first in [
            ("NEW30", "30% off your first purchase", 30, True),
            ("DERMISQUE", "25% off your second purchase", 25, False),
        ]:
            if not db.scalar(select(Coupon).where(Coupon.code == code)):
                db.add(Coupon(code=code, description=desc, type="PERCENT", value=value, first_order_only=first))

        print("Seeding accounts...")
        admin = db.scalar(select(User).where(User.email == settings.admin_email.lower()))
        if not admin:
            db.add(
                User(
                    name="Dermisque Admin",
                    email=settings.admin_email.lower(),
                    role="ADMIN",
                    password_hash=hash_password(settings.admin_password),
                )
            )

        demo = db.scalar(select(User).where(User.email == "demo@dermisque.com"))
        if not demo:
            demo = User(
                name="Demo Customer",
                email="demo@dermisque.com",
                phone="+1 555 0100",
                password_hash=hash_password("Demo@12345"),
                addresses=[Address(**DEMO_ADDRESS, is_default=True)],
            )
            db.add(demo)
        db.flush()

        # Demo orders so the admin dashboard has data to chart. Safe to delete.
        has_orders = db.scalar(select(Order.id).where(Order.user_id == demo.id).limit(1))
        if not has_orders:
            print("Seeding demo orders...")
            products = db.scalars(select(Product).order_by(Product.created_at)).all()
            statuses = ["DELIVERED", "DELIVERED", "SHIPPED", "PROCESSING", "PENDING", "CANCELLED"]
            address = {
                "fullName": DEMO_ADDRESS["full_name"],
                "phone": DEMO_ADDRESS["phone"],
                "line1": DEMO_ADDRESS["line1"],
                "line2": DEMO_ADDRESS["line2"],
                "city": DEMO_ADDRESS["city"],
                "state": DEMO_ADDRESS["state"],
                "postalCode": DEMO_ADDRESS["postal_code"],
                "country": DEMO_ADDRESS["country"],
            }
            for i in range(18):
                picks = [products[i % len(products)], products[(i * 5 + 3) % len(products)]]
                items = [
                    OrderItem(
                        product_id=p.id,
                        name=p.name,
                        slug=p.slug,
                        image=p.image,
                        price=p.price,
                        quantity=(1 + i % 2) if k == 0 else 1,
                    )
                    for k, p in enumerate(picks)
                ]
                subtotal = sum(it.price * it.quantity for it in items)
                status = statuses[i % len(statuses)]
                created = datetime.now(timezone.utc) - timedelta(days=i * 1.6 + 0.3)
                cod = i % 3 == 0
                db.add(
                    Order(
                        order_number=f"DQ-DEMO{i + 1:03d}",
                        user_id=demo.id,
                        status=status,
                        payment_method="COD" if cod else "CARD",
                        payment_status="REFUNDED"
                        if status == "CANCELLED"
                        else ("UNPAID" if cod and status != "DELIVERED" else "PAID"),
                        subtotal=subtotal,
                        total=subtotal,
                        address=address,
                        tracking_number=f"1Z999AA1{i:08d}" if status in ("SHIPPED", "DELIVERED") else None,
                        created_at=created,
                        updated_at=created,
                        items=items,
                    )
                )

        db.flush()
        seed_blog(db)
        db.commit()
        print(f"Done. Admin login: {settings.admin_email} / {settings.admin_password}")
        print("Demo customer: demo@dermisque.com / Demo@12345")
    finally:
        db.close()


if __name__ == "__main__":
    run()
