"""
Database configuration and connection management
SQLAlchemy setup with PostgreSQL
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://chatapp_user:chatapp_password@localhost:5432/chatapp")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging during development
    pool_pre_ping=True,  # Verify connections before using them
    pool_recycle=300,  # Recycle connections after 5 minutes
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for model definitions
Base = declarative_base()

def get_db():
    """
    Dependency function to get database session
    Use this with FastAPI Depends() for automatic session management
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """
    Create all tables in the database
    This will be called during application startup
    """
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """
    Drop all tables in the database
    Use with caution - this will delete all data!
    """
    Base.metadata.drop_all(bind=engine)