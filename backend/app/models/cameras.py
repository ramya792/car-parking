from sqlalchemy import Column, String, DateTime
from datetime import datetime, timezone
from backend.app.core.database import Base

class CameraModel(Base):
    __tablename__ = "cameras"

    id = Column(String(20), primary_key=True, index=True) # CAM_01, CAM_02, CAM_03
    name = Column(String(100), nullable=False)
    camera_type = Column(String(20), nullable=False) # ENTRY, PARKING, EXIT
    status = Column(String(20), default="LIVE", nullable=False) # LIVE, OFFLINE
    stream_url = Column(String(255), nullable=True)
    location_description = Column(String(255), nullable=True)
    last_ping = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
