from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime, timezone
from backend.app.core.database import Base

class ParkingSessionModel(Base):
    __tablename__ = "parking_sessions"

    id = Column(String(50), primary_key=True, index=True) # SES-...
    vehicle_number = Column(String(50), index=True, nullable=False)
    slot_id = Column(String(10), ForeignKey("parking_slots.id", ondelete="CASCADE"), nullable=False)
    
    entry_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    exit_time = Column(DateTime, nullable=True)
    
    duration_minutes = Column(Integer, default=0, nullable=False)
    duration_display = Column(String(50), default="0h 01m")
    fee = Column(Float, default=30.0, nullable=False)
    
    payment_status = Column(String(20), default="PENDING", nullable=False) # PENDING, SUCCESS, FAILED
    status = Column(String(20), default="PARKED", nullable=False) # PARKED, EXITED
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
