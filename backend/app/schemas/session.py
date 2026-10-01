from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class SessionStatus(str, Enum):
    PARKED = "PARKED"
    EXITED = "EXITED"
    RESERVED = "RESERVED"

class ParkingSessionSchema(BaseModel):
    id: str = Field(..., example="SES-8419")
    session_id: Optional[str] = Field(default=None, example="SES-8419")
    vehicle_number: str = Field(..., example="AP39AB1234")
    slot_id: str = Field(..., example="P07")
    parking_slot: Optional[str] = Field(default=None, example="P07")
    entry_time: str = Field(..., example="28-09-2026 04:12 PM")
    exit_time: Optional[str] = Field(default=None, example="28-09-2026 08:42 PM")
    duration_minutes: int = Field(default=270, example=270)
    duration_display: str = Field(default="4h 30m", example="4h 30m")
    duration: Optional[str] = Field(default="4h 30m", example="4h 30m")
    hourly_rate: float = Field(default=10.0, example=10.0)
    fee: float = Field(default=45.0, example=45.0)
    parking_fee: Optional[float] = Field(default=45.0, example=45.0)
    payment_status: PaymentStatus = Field(default=PaymentStatus.SUCCESS)
    payment_method: Optional[str] = Field(default="UPI QR", example="UPI QR")
    status: SessionStatus = Field(default=SessionStatus.EXITED)

class VehicleEntryRequest(BaseModel):
    vehicle_number: Optional[str] = Field(default=None, example="AP39AB1234")
    vehicle_type: Optional[str] = Field(default="SEDAN", example="SEDAN")
    color: Optional[str] = Field(default="#2563eb", example="#2563eb")
    preferred_slot: Optional[str] = Field(default=None, example="P04")
    image_url: Optional[str] = None

class VehicleEntryResponse(BaseModel):
    success: bool
    session_id: str
    vehicle_number: str
    assigned_slot: str
    entry_time: str
    barrier_status: str
    message: str

class VehicleExitRequest(BaseModel):
    vehicle_number: str = Field(..., example="TS09CD5678")
    slot_id: Optional[str] = None

class VehicleExitResponse(BaseModel):
    success: bool
    session_id: str
    vehicle_number: str
    slot_id: str
    entry_time: str
    exit_time: str
    duration: str
    fee: float
    parking_fee: Optional[float] = None
    payment_status: PaymentStatus
    exit_approved: bool
    message: str

class TariffTierSchema(BaseModel):
    vehicle_type: str
    name: str
    base_rate: float
    base_hours: int
    hourly_rate: float
    daily_max: float

class PeakWindowSchema(BaseModel):
    name: str
    start: str
    end: str
    multiplier: float

class TariffScheduleResponse(BaseModel):
    currency: str = "INR"
    currency_symbol: str = "₹"
    hourly_rate: float = 10.0
    grace_period_minutes: int = 0
    gst_rate_percent: float = 0.0
    is_currently_peak: bool = False
    current_peak_window: Optional[str] = None
    current_peak_multiplier: float = 1.0
    tiers: List[TariffTierSchema] = []
    peak_windows: List[PeakWindowSchema] = []

class FeeCalculationRequest(BaseModel):
    entry_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    vehicle_type: Optional[str] = "SEDAN"
    exit_time: Optional[str] = None

class FeeCalculationResponse(BaseModel):
    vehicle_type: str
    vehicle_tier_name: str
    entry_time: str
    exit_time: str
    duration_minutes: int
    duration_display: str
    duration: Optional[str] = None
    billable_hours: int
    hourly_rate: float = 10.0
    per_minute_rate: float = 0.1667
    base_fee: float
    hourly_fee: float
    additional_hours: int = 0
    is_peak_hours: bool = False
    peak_window_name: Optional[str] = None
    peak_surcharge: float = 0.0
    subtotal: float
    cgst: float = 0.0
    sgst: float = 0.0
    tax_gst: float = 0.0
    total_fee: float
    parking_fee: Optional[float] = None
    grace_period_applied: bool = False
    daily_cap_reached: bool = False
    rate_summary: str
