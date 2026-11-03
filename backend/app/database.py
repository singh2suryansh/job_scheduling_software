"""
Database configuration and session management for the Job Scheduling System.

Supports MySQL via PyMySQL with automatic fallback to local SQLite
for development when MySQL credentials are not provided or connection fails.
"""

import os
import logging
from typing import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.exc import OperationalError

# Load environment variables
load_dotenv()

logger = logging.getLogger("job_scheduling.database")

class Base(DeclarativeBase):
    """Base class for SQLAlchemy declarative models."""
    pass


def get_database_url() -> tuple[str, bool]:
    """
    Constructs the database connection URL from environment variables.
    Returns:
        tuple[str, bool]: (database_url, is_sqlite_fallback)
    """
    custom_url = os.getenv("DATABASE_URL")
    if custom_url:
        return custom_url, custom_url.startswith("sqlite")

    mysql_user = os.getenv("MYSQL_USER")
    mysql_password = os.getenv("MYSQL_PASSWORD")
    mysql_host = os.getenv("MYSQL_HOST")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    mysql_db = os.getenv("MYSQL_DB")

    # If any required MySQL param is present, try connecting to MySQL
    if mysql_user and mysql_host and mysql_db:
        # If password is empty or None
        pw_str = f":{mysql_password}" if mysql_password else ""
        mysql_url = f"mysql+pymysql://{mysql_user}{pw_str}@{mysql_host}:{mysql_port}/{mysql_db}?charset=utf8mb4"
        return mysql_url, False

    # Fallback to local SQLite database
    sqlite_path = os.getenv("SQLITE_PATH", "job_scheduling.db")
    return f"sqlite:///{sqlite_path}", True


def create_db_engine():
    """
    Attempts to create an engine with the configured database URL.
    Falls back to SQLite if MySQL connection verification fails.
    """
    db_url, is_sqlite = get_database_url()

    if is_sqlite:
        logger.info("Using SQLite database: %s", db_url)
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            echo=False
        )

    # For MySQL or custom URL, test connectivity
    try:
        logger.info("Connecting to MySQL database at %s...", db_url.split("@")[-1])
        engine = create_engine(
            db_url,
            pool_recycle=3600,
            pool_pre_ping=True,
            echo=False
        )
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to MySQL database.")
        return engine
    except Exception as exc:
        logger.warning(
            "Failed to connect to MySQL database (%s). Falling back to local SQLite database: job_scheduling.db",
            exc
        )
        return create_engine(
            "sqlite:///job_scheduling.db",
            connect_args={"check_same_thread": False},
            echo=False
        )


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    """
    FastAPI dependency that provides a transactional database session.
    Closes the session after the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_health() -> dict:
    """
    Checks database connectivity and dialect for the /health endpoint.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "connected",
            "dialect": engine.dialect.name,
            "database": str(engine.url.database)
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e)
        }

