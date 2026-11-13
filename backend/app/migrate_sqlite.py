"""Copy all data from the old SQLite database into the configured DATABASE_URL (PostgreSQL).

Usage (from backend/):
    python -m app.migrate_sqlite                  # reads ./dermisque.db
    python -m app.migrate_sqlite path/to/old.db

The target tables are created if missing. The target must be empty (safety check).
"""

import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import DateTime, create_engine, func, select

from .config import BASE_DIR, settings
from .database import Base, engine as target
from . import models

_REGISTERED = models.Base.metadata  # importing models registers every table


def main():
    src_path = Path(sys.argv[1]) if len(sys.argv) > 1 else BASE_DIR / "dermisque.db"
    if not src_path.exists():
        sys.exit(f"SQLite file not found: {src_path}")
    if settings.database_url.startswith("sqlite"):
        sys.exit("DATABASE_URL still points at SQLite — set it to your PostgreSQL URL first.")

    source = create_engine(f"sqlite:///{src_path.as_posix()}")
    Base.metadata.create_all(target)

    with target.connect() as t:
        for table in Base.metadata.sorted_tables:
            if t.execute(select(func.count()).select_from(table)).scalar():
                sys.exit(f"Target table '{table.name}' is not empty — aborting to avoid duplicates.")

    with source.connect() as s, target.begin() as t:
        src_tables = set(source.dialect.get_table_names(s))
        for table in Base.metadata.sorted_tables:  # parents before children
            if table.name not in src_tables:
                print(f"  {table.name:<20} (not in source, skipped)")
                continue
            src_cols = {c["name"] for c in source.dialect.get_columns(s, table.name)}
            cols = [c for c in table.columns if c.name in src_cols]
            rows = [dict(r._mapping) for r in s.execute(select(*cols))]
            for r in rows:  # SQLite stores naive UTC datetimes
                for c in cols:
                    v = r.get(c.name)
                    if isinstance(c.type, DateTime) and isinstance(v, datetime) and v.tzinfo is None:
                        r[c.name] = v.replace(tzinfo=timezone.utc)
            if rows:
                t.execute(table.insert(), rows)
            print(f"  {table.name:<20} {len(rows)} rows")
    print("Migration complete.")


if __name__ == "__main__":
    main()
