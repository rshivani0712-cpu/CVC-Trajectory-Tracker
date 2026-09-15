import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

import sys
from sqlalchemy.pool import StaticPool

# Default to a local PostgreSQL instance for development
# For unit tests, we'll automatically override this string with a sqlite in-memory DB
if "unittest" in sys.modules:
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
else:
    SQLALCHEMY_DATABASE_URL = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:password@localhost:5432/cvc_simulator"
    )

# Connect args and poolclass needed if falling back or explicitly using sqlite (for testing)
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
kwargs = {"connect_args": connect_args}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    kwargs["poolclass"] = StaticPool

engine = create_engine(SQLALCHEMY_DATABASE_URL, **kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for FastAPI to yield a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
