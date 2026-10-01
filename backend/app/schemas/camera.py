from pydantic import BaseModel, Field
from typing import Optional, List

class DetectedVehicleOverlay(BaseModel):
    plate_number: str = Field(..., example="AP39AB1234")
    confidence: float = Field(..., example=0.947)
    bbox: List[int] = Field(default=[120, 80, 480, 360])
    status_text: str = Field(default="VEHICLE DETECTED")
    timestamp: str = Field(..., example="28-09-2026 08:42:15 PM")

class CameraFeedSchema(BaseModel):
    id: str = Field(..., example="CAM_01")
    name: str = Field(..., example="CAM West - Entrance Gate")
    direction: Optional[str] = Field(default=None, example="WEST")
    type: str = Field(..., example="ENTRY")
    status: str = Field(default="LIVE")
    stream_url: Optional[str] = None
    detected_vehicle: Optional[DetectedVehicleOverlay] = None
    vehicles_detected_count: Optional[int] = None
    occupied_slots_count: Optional[int] = None
    available_slots_count: Optional[int] = None
