from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from backend.app.core.database import Base

class ParkingSlotCoordinates(Base):
    __tablename__ = "parking_slot_coordinates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    slot_id = Column(String(10), ForeignKey("parking_slots.id", ondelete="CASCADE"), nullable=False, unique=True)
    camera_id = Column(String(20), ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True, default="CAM_02")
    
    # 2D Polygonal ROI on camera frame stored as JSON: [[x1, y1], [x2, y2], ...]
    polygon_roi = Column(Text, nullable=False)
    
    # 3D World coordinates
    world_x = Column(Float, nullable=False)
    world_y = Column(Float, nullable=False, default=0.02)
    world_z = Column(Float, nullable=False)
