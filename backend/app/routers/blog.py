import math
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import BlogPost, Product, User
from ..schemas import BlogCard, BlogCategoryOut, BlogDetail, BlogPostIn, BlogPostOut, Ok, Page
from ..security import require_admin
from ..serializers import product_card

router = APIRouter(prefix="/api/blog", tags=["blog"])
admin_router = APIRouter(prefix="/api/admin/blog", tags=["admin"], dependencies=[Depends(require_admin)])


def _slugify(s: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", s.lower().strip()))[:180]


def _reading_time(md: str) -> int:
    words = len(re.findall(r"\w+", md or ""))
    return max(1, math.ceil(words / 220))


def _card(p: BlogPost) -> BlogCard:
    return BlogCard.model_validate(p).model_copy(update={"reading_time": _reading_time(p.content)})


def _full(p: BlogPost) -> BlogPostOut:
    return BlogPostOut.model_validate(p).model_copy(update={"reading_time": _reading_time(p.content)})


def _live():
    """Published posts whose publish date has arrived (supports scheduling)."""
    now = datetime.now(timezone.utc)
    return (BlogPost.status == "PUBLISHED", BlogPost.published_at.is_not(None), BlogPost.published_at <= now)


# ───────────── Public ─────────────
@router.get("", response_model=Page[BlogCard])
def list_posts(
    category: str | None = None,
    tag: str | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(9, ge=1, le=50, alias="pageSize"),
    db: Session = Depends(get_db),
):
    stmt = select(BlogPost).where(*_live())
    if category:
        stmt = stmt.where(func.lower(BlogPost.category) == category.lower())
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(BlogPost.title.ilike(like), BlogPost.excerpt.ilike(like), BlogPost.content.ilike(like))
        )
    rows = db.scalars(stmt.order_by(BlogPost.featured.desc(), BlogPost.published_at.desc())).all()
    if tag:  # JSON column: filter in Python for portability across databases
        rows = [r for r in rows if tag.lower() in [t.lower() for t in (r.tags or [])]]
    total = len(rows)
    start = (page - 1) * page_size
    return Page(
        items=[_card(r) for r in rows[start : start + page_size]], total=total, page=page, page_size=page_size
    )


@router.get("/categories", response_model=list[BlogCategoryOut])
def categories(db: Session = Depends(get_db)):
    rows = db.execute(
        select(BlogPost.category, func.count())
        .where(*_live())
        .group_by(BlogPost.category)
        .order_by(BlogPost.category)
    ).all()
    return [BlogCategoryOut(name=n, count=c) for n, c in rows]


@router.get("/{slug}", response_model=BlogDetail)
def get_post(slug: str, db: Session = Depends(get_db)):
    p = db.scalar(select(BlogPost).where(BlogPost.slug == slug, *_live()))
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    db.execute(update(BlogPost).where(BlogPost.id == p.id).values(views=BlogPost.views + 1))
    db.commit()
    db.refresh(p)

    related = db.scalars(
        select(BlogPost)
        .where(*_live(), BlogPost.id != p.id)
        .order_by((BlogPost.category == p.category).desc(), BlogPost.published_at.desc())
        .limit(3)
    ).all()
    products = []
    if p.product_ids:
        found = db.scalars(
            select(Product)
            .where(Product.id.in_(p.product_ids), Product.is_active.is_(True))
            .options(selectinload(Product.categories), selectinload(Product.reviews))
        ).all()
        order = {pid: i for i, pid in enumerate(p.product_ids)}
        products = [product_card(x) for x in sorted(found, key=lambda x: order.get(x.id, 0))]
    return BlogDetail(**_full(p).model_dump(), related=[_card(r) for r in related], products=products)


# ───────────── Admin ─────────────
@admin_router.get("", response_model=list[BlogCard])
def admin_list(q: str | None = None, db: Session = Depends(get_db)):
    stmt = select(BlogPost).order_by(BlogPost.updated_at.desc())
    if q:
        stmt = stmt.where(BlogPost.title.ilike(f"%{q}%"))
    return [_card(p) for p in db.scalars(stmt).all()]


@admin_router.get("/{post_id}", response_model=BlogPostOut)
def admin_get(post_id: str, db: Session = Depends(get_db)):
    p = db.get(BlogPost, post_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    return _full(p)


def _apply(db: Session, p: BlogPost, body: BlogPostIn, admin: User):
    slug = _slugify(body.slug or body.title)
    if not slug:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Title must contain letters or numbers")
    if db.scalar(select(BlogPost.id).where(BlogPost.slug == slug, BlogPost.id != (p.id or ""))):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Slug '{slug}' is already used by another post")
    data = body.model_dump(exclude={"slug", "author_name", "published_at", "tags"})
    for k, v in data.items():
        setattr(p, k, v)
    p.tags = sorted({t.strip() for t in body.tags if t.strip()}, key=str.lower)
    p.slug = slug
    p.author_name = (body.author_name or "").strip() or p.author_name or admin.name
    if not p.author_id:
        p.author_id = admin.id
    if body.published_at:
        p.published_at = body.published_at  # explicit date (can schedule in the future)
    elif body.status == "PUBLISHED" and not p.published_at:
        p.published_at = datetime.now(timezone.utc)


@admin_router.post("", response_model=BlogPostOut, status_code=201)
def admin_create(body: BlogPostIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    p = BlogPost()
    _apply(db, p, body, admin)
    db.add(p)
    db.commit()
    return _full(p)


@admin_router.put("/{post_id}", response_model=BlogPostOut)
def admin_update(
    post_id: str, body: BlogPostIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    p = db.get(BlogPost, post_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    _apply(db, p, body, admin)
    db.commit()
    return _full(p)


@admin_router.delete("/{post_id}", response_model=Ok)
def admin_delete(post_id: str, db: Session = Depends(get_db)):
    p = db.get(BlogPost, post_id)
    if p:
        db.delete(p)
        db.commit()
    return Ok()
