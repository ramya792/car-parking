from pydantic import BaseModel, Field
from typing import List, Optional

class PlateRecognitionRequest(BaseModel):
    image_base64: Optional[str] = None
    camera_id: str = Field(default="CAM_01", example="CAM_01")
    demo_plate: Optional[str] = None

class PlateRecognitionResponse(BaseModel):
    plate_number: str = Field(..., example="AP39AB1234")
    raw_text: Optional[str] = Field(default="AP39AB1234")
    is_valid: bool = True
    confidence: float = Field(..., example=0.967)
    confidence_percent: float = Field(default=96.7, example=96.7)
    state_code: str = Field(default="AP", example="AP")
    state_name: str = Field(default="Andhra Pradesh", example="Andhra Pradesh")
    rto_code: Optional[str] = Field(default="39", example="39")
    vehicle_type: str = Field(default="SEDAN", example="SEDAN")
    detected: bool = True
    bounding_box: List[int] = Field(default=[145, 120, 420, 290])
    plate_crop_base64: Optional[str] = None
    engine: str = Field(default="YOLOv8 + OpenCV + HSRP OCR")
    processing_time_ms: int = Field(default=38, example=38)

class SlotDetectionResult(BaseModel):
    slot_id: str
    row: str
    status: str
    polygon: List[List[int]]
    vehicle_detected: bool
    vehicle_bbox: Optional[List[int]] = None
    confidence: float
    plate_number: Optional[str] = None

class OccupancyScanResponse(BaseModel):
    camera_id: str = "CAM_02"
    camera_name: str = "CAM 02 - Parking Area"
    resolution: List[int] = [1280, 720]
    total_slots: int
    occupied_slots: int
    available_slots: int
    vehicles_detected_count: int
    occupancy_percentage: float
    slot_detections: List[SlotDetectionResult]
    ai_model: str = "YOLOv8x + Polygon IoU Classifier"
    processing_time_ms: int = 24

