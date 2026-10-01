from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime, timezone
from backend.app.core.database import Base

class ParkingSlotModel(Base):
    __tablename__ = "parking_slots"

    id = Column(String(10), primary_key=True, index=True) # P01 to P20
    row = Column(String(10), nullable=False) # TOP, BOTTOM
    slot_number = Column(Integer, nullable=False, unique=True) # 1 to 20
    status = Column(String(20), default="AVAILABLE", nullable=False) # AVAILABLE, OCCUPIED, RESERVED
    
    current_vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    
    # 3D Coordinates
    position_x = Column(Float, nullable=False, default=0.0)
    position_y = Column(Float, nullable=False, default=0.02)
    position_z = Column(Float, nullable=False, default=0.0)
    rotation_y = Column(Float, nullable=False, default=0.0)
    
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
