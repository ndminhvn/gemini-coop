"""
Shared database configuration and utilities
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL - supports both PostgreSQL and SQLite
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    # Default to PostgreSQL for production, fallback to SQLite for development
    "postgresql://gemini_user:gemini_password@localhost:5432/gemini_coop",
)

# Handle SQLite-specific connection args
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    from services.database.models import User, Chat, ChatParticipant, Message

    Base.metadata.create_all(bind=engine)
