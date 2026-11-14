import os
from datetime import datetime, timezone
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass


url = os.getenv("DATABASE_URL", "sqlite:///./data/brahmagpt.db")
if url.startswith("sqlite:///"):
    from pathlib import Path

    Path(url.removeprefix("sqlite:///")).parent.mkdir(parents=True, exist_ok=True)
engine = create_engine(
    url, connect_args={"check_same_thread": False} if url.startswith("sqlite") else {}, pool_pre_ping=True
)
if url.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def sqlite_fk(conn, _):
        conn.execute("PRAGMA foreign_keys=ON")


SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def db_session():
    with SessionLocal() as db:
        yield db
