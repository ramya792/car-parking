import hashlib
import hmac
from fastapi import APIRouter, Header, HTTPException, Request
from backend.app.schemas.payment import (
    PaymentCreateRequest,
    PaymentCreateResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
)
from backend.app.services.parking_service import parking_service
from backend.app.core.config import settings
from datetime import datetime
from urllib.parse import quote

router = APIRouter()

PHONEPE_NUMBER = "9391041599"
PHONEPE_UPI_ID = "9391041599@ybl"

@router.post("/create", response_model=PaymentCreateResponse, summary="Create QR Payment Order")
async def create_payment_order(payload: PaymentCreateRequest):
    """
    Generates a dynamic payment order and UPI QR code string for vehicle exit settlement.
    Configured for PhonePe payment number 9391041599.
    """
    payment_id = f"PAY{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    session_id = payload.session_id
    if session_id not in parking_service.sessions:
        matching_session = next(
            (
                session for session in parking_service.sessions.values()
                if session.get("vehicle_number") == payload.vehicle_number
                and session.get("status") not in {"EXITED", "COMPLETED"}
            ),
            None,
        )
        if matching_session:
            session_id = matching_session["session_id"]
    amount = f"{payload.amount:.2f}"
    upi_string = f"upi://pay?pa={PHONEPE_UPI_ID}&pn=SmartParking&mc=5499&tid={payment_id}&tr={session_id}&am={amount}&cu=INR"
    
    # SVG / QR payload link (standard Google Charts QR or mock)
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={quote(upi_string, safe='')}"

    parking_service.payments[payment_id] = {
        "payment_id": payment_id,
        "session_id": session_id,
        "vehicle_number": payload.vehicle_number,
        "amount": payload.amount,
        "phone_number": PHONEPE_NUMBER,
        "upi_id": PHONEPE_UPI_ID,
        "status": "PENDING",
        "created_at": datetime.now().strftime("%d-%m-%Y %I:%M %p"),
    }

    return {
        "payment_id": payment_id,
        "session_id": session_id,
        "vehicle_number": payload.vehicle_number,
        "amount": payload.amount,
        "currency": "INR",
        "upi_payload": upi_string,
        "qr_code_url": qr_url,
        "phone_number": PHONEPE_NUMBER,
        "upi_id": PHONEPE_UPI_ID,
        "status": "PENDING",
        "message": f"PhonePe QR code ready for {PHONEPE_NUMBER}. Please scan to complete payment.",
    }

@router.get("/{payment_id}/status", summary="Get Payment Verification Status")
async def get_payment_status(payment_id: str):
    """Return server-side payment state without accepting client-side proof."""
    payment = parking_service.payments.get(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment order not found")

    return {
        "payment_id": payment_id,
        "session_id": payment.get("session_id"),
        "vehicle_number": payment.get("vehicle_number"),
        "amount": payment.get("amount", 0.0),
        "status": payment.get("status", "PENDING"),
        "provider_transaction_id": payment.get("provider_transaction_id"),
        "payment_time": payment.get("created_at", ""),
        "barrier_arm": "OPEN" if payment.get("status") == "SUCCESS" else "CLOSED",
        "callback_configured": bool(settings.PHONEPE_WEBHOOK_SECRET),
    }

@router.post("/verify", response_model=PaymentVerifyResponse, summary="Verify Payment & Authorize Barrier Release")
async def verify_payment(payload: PaymentVerifyRequest):
    """
    Client-side verification is disabled. Provider callbacks must use /payment/callback.
    """
    raise HTTPException(
        status_code=403,
        detail="Client verification is disabled; waiting for signed PhonePe callback",
    )

@router.post("/demo-confirm", response_model=PaymentVerifyResponse, summary="Confirm Demo Payment")
async def confirm_demo_payment(payload: PaymentVerifyRequest):
    """Approve a local demo order only when DEMO_MODE is explicitly enabled."""
    if not settings.DEMO_MODE:
        raise HTTPException(status_code=404, detail="Demo payment confirmation is disabled")

    payment = parking_service.payments.get(payload.payment_id)
    if not payment or payment.get("session_id") != payload.session_id:
        raise HTTPException(status_code=400, detail="Payment order and parking session do not match")

    payment["provider_transaction_id"] = f"DEMO-{payload.payment_id}"
    return await parking_service.verify_payment(payload.payment_id, payload.session_id)

@router.post("/callback", response_model=PaymentVerifyResponse, summary="Receive verified PhonePe payment callback")
async def phonepe_payment_callback(
    request: Request,
    x_payment_signature: str | None = Header(default=None),
):
    """Accept only a signed provider callback before authorizing the exit."""
    if not settings.PHONEPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Payment callback is not configured")

    raw_body = await request.body()
    expected_signature = hmac.new(
        settings.PHONEPE_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    if not x_payment_signature or not hmac.compare_digest(x_payment_signature, expected_signature):
        raise HTTPException(status_code=401, detail="Invalid payment callback signature")

    try:
        payload = await request.json()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payment callback payload") from exc

    payment_id = payload.get("payment_id") or payload.get("merchant_transaction_id")
    session_id = payload.get("session_id")
    provider_transaction_id = payload.get("transaction_id")
    status = str(payload.get("status", "")).upper()
    amount = payload.get("amount")
    receiver = payload.get("receiver_upi_id") or payload.get("payee_vpa")

    payment = parking_service.payments.get(payment_id)
    if not payment or payment.get("session_id") != session_id:
        raise HTTPException(status_code=400, detail="Payment order and parking session do not match")
    if status != "SUCCESS" or not provider_transaction_id:
        raise HTTPException(status_code=400, detail="Payment is not successfully confirmed")
    if receiver and receiver != PHONEPE_UPI_ID:
        raise HTTPException(status_code=400, detail="Payment receiver does not match parking account")
    if amount is None or round(float(amount), 2) != round(float(payment["amount"]), 2):
        raise HTTPException(status_code=400, detail="Payment amount does not match parking fee")

    existing_transaction = payment.get("provider_transaction_id")
    if existing_transaction and existing_transaction != provider_transaction_id:
        raise HTTPException(status_code=409, detail="Payment order already has a different transaction")
    payment["provider_transaction_id"] = provider_transaction_id
    return await parking_service.verify_payment(payment_id, session_id)

@router.get("/history", summary="Get Payment Transactions History")
async def get_payment_history():
    """
    Returns ledger of all processed parking payments.
    """
    return list(parking_service.payments.values())
