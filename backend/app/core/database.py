import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from backend.app.core.config import settings

logger = logging.getLogger("parking_db")

# Default database URL
db_url = settings.DATABASE_URL

# For local development or environments where local PostgreSQL daemon is not started,
# support seamless SQLite async fallback (using /tmp on serverless environments like Vercel)
sqlite_path = os.getenv("SQLITE_PATH", "/tmp/smart_parking.db" if (os.getenv("VERCEL") or not os.path.exists("./backend")) else "./smart_parking.db")
fallback_sqlite_url = f"sqlite+aiosqlite:///{sqlite_path}"

def get_engine():
    try:
        # Check if environment requests SQLite or fallback
        if os.getenv("USE_SQLITE", "false").lower() == "true":
            return create_async_engine(fallback_sqlite_url, echo=False)
        return create_async_engine(db_url, echo=False)
    except Exception as e:
        logger.warning(f"Could not initialize primary database engine: {e}. Falling back to SQLite.")
        return create_async_engine(fallback_sqlite_url, echo=False)

engine = get_engine()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
