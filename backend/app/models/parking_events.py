from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from datetime import datetime, timezone
from backend.app.core.database import Base

class ParkingEvent(Base):
    __tablename__ = "parking_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(50), ForeignKey("parking_sessions.id", ondelete="SET NULL"), nullable=True)
    slot_id = Column(String(10), ForeignKey("parking_slots.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(50), nullable=False, index=True) # VEHICLE_ENTRY, BARRIER_OPEN, SLOT_OCCUPIED, PAYMENT_SUCCESS, VEHICLE_EXIT
    description = Column(String(255), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
