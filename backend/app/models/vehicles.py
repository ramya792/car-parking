from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from backend.app.core.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plate_number = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_type = Column(String(50), default="SEDAN", nullable=False) # SEDAN, SUV, HATCHBACK
    color = Column(String(50), default="#2563eb", nullable=False)
    owner_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
