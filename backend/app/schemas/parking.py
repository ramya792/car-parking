from pydantic import BaseModel, Field
from typing import Optional, List, Tuple
from enum import Enum

class SlotStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    RESERVED = "RESERVED"

class VehicleType(str, Enum):
    CAR = "CAR"
    SEDAN = "SEDAN"
    SUV = "SUV"
    HATCHBACK = "HATCHBACK"

class VehicleInfoSchema(BaseModel):
    plate_number: str = Field(..., example="AP39AB1234")
    vehicle_type: VehicleType = Field(default=VehicleType.SEDAN)
    color: str = Field(default="#2563eb", example="#f8fafc")
    entry_time: str = Field(..., example="08:42 PM")
    duration: Optional[str] = Field(default="0h 01m")
    session_id: str = Field(..., example="SES-001")
    confidence: float = Field(default=0.96, example=0.967)
    image_url: Optional[str] = None

class ParkingSlotSchema(BaseModel):
    id: str = Field(..., example="P01")
    row: str = Field(..., example="TOP")
    slot_number: int = Field(..., example=1)
    status: SlotStatus = Field(default=SlotStatus.AVAILABLE)
    position: Tuple[float, float, float]
    rotation: Tuple[float, float, float]
    current_vehicle: Optional[VehicleInfoSchema] = None

class ParkingStatusResponse(BaseModel):
    total_slots: int = 20
    occupied_slots: int
    available_slots: int
    reserved_slots: int
    occupancy_percentage: float

class SlotStatusUpdateRequest(BaseModel):
    status: SlotStatus
    vehicle: Optional[VehicleInfoSchema] = None
