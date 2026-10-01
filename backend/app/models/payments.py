from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime, timezone
from backend.app.core.database import Base

class PaymentModel(Base):
    __tablename__ = "payments"

    id = Column(String(50), primary_key=True, index=True) # PAY...
    session_id = Column(String(50), ForeignKey("parking_sessions.id", ondelete="CASCADE"), nullable=False)
    vehicle_number = Column(String(50), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    payment_method = Column(String(50), default="UPI_QR", nullable=False)
    status = Column(String(20), default="PENDING", nullable=False) # PENDING, SUCCESS, FAILED
    transaction_ref = Column(String(100), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
