# Dermisque — Sum of Beauty

Full e-commerce platform for Dermisque premium serums.

| Part | Stack | Folder |
|---|---|---|
| Storefront, user dashboard, admin panel | Next.js 16 (App Router), Tailwind CSS 4, Motion, Zustand | `frontend/` |
| REST API, auth, orders, admin | Python · FastAPI · SQLAlchemy 2 · JWT · bcrypt | `backend/` |
| Database | PostgreSQL 17 (Docker) | `docker-compose.yml` |

## Run it locally (Windows)

**0. Database — PostgreSQL in Docker (port 5440)**

Requires Docker Desktop running.

```powershell
copy .env.example .env          # set POSTGRES_PASSWORD
docker compose up -d            # starts container "dermisque-db" on 127.0.0.1:5440
```

**1. Backend (port 8000)**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env          # set JWT_SECRET and DATABASE_URL (see below)
python -m app.seed              # creates tables, 12 products, coupons, demo accounts, 4 blog posts
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://127.0.0.1:8000/docs

**2. Frontend (port 3100 — 3000 works too if it's free)**

```powershell
cd frontend
npm install
copy .env.example .env          # JWT_SECRET must equal the backend's
npm run dev -- --port 3100
```

Open http://localhost:3100

### Logins (seeded)

| Role | Email | Password |
|---|---|---|
| Admin | admin@dermisque.com | Admin@12345 |
| Customer | demo@dermisque.com | Demo@12345 |

Change the admin password (`ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` before seeding) before going live.

### Coupons
- `NEW30` — 30% off, first order only
- `DERMISQUE` — 25% off

### Payments
Checkout runs in **demo payment mode** (no real charge). Any future expiry works;
card `4000 0000 0000 0002` simulates a decline. Replace `charge_card()` in
`backend/app/routers/checkout.py` with Stripe/PayPal to take real payments.
Cash on delivery is also supported.

## Currency (USD / GBP)

A floating switcher on the right edge of the store lets shoppers pick **USD** or **GBP**. The choice is
saved in the `dq_currency` cookie and every storefront price (cards, product page, cart, filters,
checkout) is shown in that currency.

- Prices are stored in USD; GBP uses a fixed rate set by `GBP_RATE` in `backend/.env` (default `0.79`),
  served at `GET /api/currencies`.
- Each order records the `currency` and `fx_rate` it was placed in, so the customer's order history
  shows what they paid. The admin panel keeps reporting in USD and notes what the customer paid.

## Shop assistant (chatbot)

A chat button sits at the bottom-right of every store page (hidden on checkout). Shoppers can ask which serum suits
their skin, how to use a product, what's in it, prices and stock, shipping, payment, discount codes, policies —
and, when signed in, the status and tracking of their own orders. Recommended products appear as cards with
**Add to bag**.

- **Built-in mode (default):** answers from the live catalogue, coupons and store policies — no API key needed.
- **AI mode:** add `ANTHROPIC_API_KEY=...` to `backend/.env` and restart the API; replies then come from Claude
  (`CHAT_MODEL`, default `claude-opus-5-5`) grounded in the same store knowledge. If the AI call fails, the
  built-in assistant answers instead.
- Store knowledge (products, prices, stock, coupons) refreshes every 5 minutes; store policies are in
  `backend/app/chat/knowledge.py`.
- Limited to 40 messages per 10 minutes per shopper.

## Emails

Branded HTML emails are sent over SMTP (GoDaddy `smtpout.secureserver.net:465`, SSL) from
`Info@dermisque.com`. Settings live in `backend/.env` (`SMTP_*`, `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL`,
`SITE_URL`); set `MAIL_ENABLED=false` to log emails without sending them.

| Trigger | Customer gets | Store (admin) gets |
|---|---|---|
| Contact / consultation form | "We've received your message" | New message alert (reply-to = customer) |
| Register | Welcome + NEW30 | — |
| Newsletter sign-up | Newsletter welcome | — |
| Order placed | Order confirmation | New order alert |
| Card declined | Payment failed (retry link) | Failed checkout alert |
| Item sold out during checkout | Order unsuccessful | Failed checkout alert |
| Admin sets Processing / Shipped / Delivered | Status update (tracking no., review ask) | — |
| Order cancelled | Cancellation (+ refund note) | Alert when the customer cancelled |
| Payment marked Refunded | Refund issued | — |
| Bag left (signed-in shoppers) | Reminder after 1h, second after 24h with a coupon | — |
| Forgot password / password changed | Reset link (60 min) / security notice | — |
| Stock drops to `LOW_STOCK_THRESHOLD` (5) | — | Low stock alert |

- **Admin → Emails** previews every template (desktop/mobile), sends test emails and shows the delivery log.
- Emails are sent in the background, so checkout never waits on the mail server; every send is recorded in `email_log`.
- Signed-in shoppers' bags are saved on the server (`carts` table), which powers the reminders and lets a
  bag follow them across devices. Timing: `CART_REMINDER_HOURS="1,24"`.
- Product images and the logo are embedded in the email, so they display even while the store runs on localhost.
  Set `SITE_URL` to the live domain before launch so the links in emails point to it.

## Database

PostgreSQL 17 runs in Docker (`docker-compose.yml`, container `dermisque-db`, port **5440** on localhost).

- `backend/.env` → `DATABASE_URL="postgresql+psycopg://dermisque:<POSTGRES_PASSWORD>@127.0.0.1:5440/dermisque"`
  (`POSTGRES_PASSWORD` is in the root `.env`). Leave `DATABASE_URL` unset to fall back to a local SQLite file.
- Tables are created automatically on API start-up and by `python -m app.seed`.
- One-time copy of old SQLite data into Postgres: `python -m app.migrate_sqlite path/to/dermisque.db`.
- Open a SQL shell: `docker exec -it dermisque-db psql -U dermisque dermisque`.

## Blog

- **Admin → Blog** (`/admin/blog`): write posts in Markdown with a formatting toolbar, inline image
  upload and live split preview; cover image, category, tags, author, featured flag, linked
  products ("Shop the post"), SEO title/description with search preview, draft / publish /
  schedule (future publish date).
- **User side**: `/blog` (featured hero, category chips, search, tags, pagination) and
  `/blog/<slug>` (reading-progress bar, reading time, view counter, share buttons, products
  mentioned, related articles). The latest posts also appear on the home page.

## Features

**Storefront** — animated intro loader, hero with mouse-parallax, shop by concern (9 concerns),
search/filter/sort, product pages with zoom gallery, ingredients/how-to/FAQ tabs, reviews,
related products, slide-out cart with free-shipping progress, wishlist, coupon codes,
checkout (saved addresses, card or COD), order confirmation, contact & free consultation forms,
FAQs and policy pages. Fully responsive.

**User dashboard** — overview, order history, order tracking timeline, cancel order,
address book, profile & password.

**Admin panel** — revenue dashboard (7/30/90-day chart, status breakdown, top products,
low stock), orders (filter, search, status/payment/tracking updates with auto restock on cancel),
product CRUD with image upload, customers, coupons, review moderation, messages inbox,
newsletter subscribers.

## Project layout

```
backend/app/
  main.py            FastAPI app, CORS, /uploads static files
  models.py          SQLAlchemy models
  schemas.py         Pydantic request/response models (camelCase JSON)
  routers/           auth, catalog, account, checkout, content, admin, blog
  pricing.py         totals & coupon rules (source of truth)
  seed.py            seed data (product data in data/catalog.json, posts in blog_seed.py)
  migrate_sqlite.py  one-time SQLite → PostgreSQL data copy
frontend/src/
  app/(store)/       storefront + /account dashboard
  app/(auth)/        login / register
  app/admin/         admin panel
  app/actions/       server actions that call the Python API
  lib/api.ts         server-side API client (attaches the session token)
  proxy.ts           route protection for /account, /checkout, /admin
```

## Production notes
- Set a strong shared `JWT_SECRET` in both `.env` files; set `PUBLIC_URL` and `CORS_ORIGINS` for your domains.
- For a hosted Postgres (Neon, Supabase, RDS…) just point `DATABASE_URL` at it.
- Uploaded product images are stored in `backend/uploads/` — use persistent storage (or S3) when deploying.
- Reset local data: `docker compose down -v` (deletes the Postgres volume), `docker compose up -d`, then `python -m app.seed`.
- Back up: `docker exec dermisque-db pg_dump -U dermisque dermisque > backup.sql`.
