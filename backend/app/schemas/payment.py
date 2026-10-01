from pydantic import BaseModel, Field
from typing import Optional

class PaymentCreateRequest(BaseModel):
    session_id: str = Field(..., example="SES-2026092801")
    vehicle_number: str = Field(..., example="TS09CD5678")
    amount: float = Field(..., example=50.0)

class PaymentCreateResponse(BaseModel):
    payment_id: str = Field(..., example="PAY202609281234")
    session_id: str
    vehicle_number: str
    amount: float
    currency: str = "INR"
    upi_payload: str
    qr_code_url: str
    phone_number: str = "9391041599"
    upi_id: str = "9391041599@ybl"
    status: str = "PENDING"
    message: str

class PaymentVerifyRequest(BaseModel):
    payment_id: str = Field(..., example="PAY202609281234")
    session_id: str
    payment_method: Optional[str] = "UPI_QR"

class PaymentVerifyResponse(BaseModel):
    success: bool
    payment_id: str
    session_id: str
    vehicle_number: str
    amount: float
    payment_time: str
    status: str
    barrier_arm: str
    message: str
