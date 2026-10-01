from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime, timezone
from backend.app.core.database import Base

class AIDetection(Base):
    __tablename__ = "ai_detections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    camera_id = Column(String(20), ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True)
    detected_plate = Column(String(50), nullable=True, index=True)
    confidence = Column(Float, nullable=False, default=0.0)
    vehicle_class = Column(String(50), default="car", nullable=False) # car, truck, bus
    
    # Bounding Box (x, y, width, height)
    bbox_x = Column(Integer, nullable=True)
    bbox_y = Column(Integer, nullable=True)
    bbox_w = Column(Integer, nullable=True)
    bbox_h = Column(Integer, nullable=True)
    
    image_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
