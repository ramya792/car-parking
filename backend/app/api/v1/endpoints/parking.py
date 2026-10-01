from fastapi import APIRouter, HTTPException, Path, Header, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from backend.app.schemas.parking import (
    ParkingSlotSchema,
    ParkingStatusResponse,
    SlotStatusUpdateRequest,
)
from backend.app.schemas.session import (
    ParkingSessionSchema,
    TariffScheduleResponse,
    FeeCalculationRequest,
    FeeCalculationResponse,
)
from backend.app.services.parking_service import parking_service
from backend.app.services.billing_service import billing_service, PARKING_HOURLY_RATE
from datetime import datetime, timedelta

router = APIRouter()

class TariffUpdateRequest(BaseModel):
    hourly_rate: float = Field(..., gt=0, example=10.0)

@router.get("/slots", response_model=List[ParkingSlotSchema], summary="Get All 20 Parking Slots")
async def get_parking_slots():
    """
    Returns the real-time state, 3D coordinates, and vehicle associations for all 20 slots.
    """
    return parking_service.get_all_slots()

@router.get("/slots/{id}", response_model=ParkingSlotSchema, summary="Get Parking Slot by ID")
async def get_parking_slot(id: str = Path(..., description="Slot ID (e.g. P01)")):
    """
    Returns specific parking slot details.
    """
    slot = parking_service.get_slot(id)
    if not slot:
        raise HTTPException(status_code=404, detail=f"Slot {id} not found")
    return slot

@router.get("/status", response_model=ParkingStatusResponse, summary="Get Parking Occupancy Metrics")
async def get_parking_status():
    """
    Returns current counts for total slots, occupied, available, reserved, and occupancy percentage.
    """
    return parking_service.get_parking_status()

@router.get("/tariff", response_model=TariffScheduleResponse, summary="Get Current Parking Tariff & Peak Rules")
async def get_parking_tariff():
    """
    Returns the official rate card: vehicle tiers (Sedan, SUV, Hatchback, 2-Wheeler),
    grace period, peak hour windows, multipliers, and statutory GST rate.
    """
    return billing_service.get_tariff_schedule()

@router.put("/tariff", summary="Update Parking Tariff Rate (Admin Only)")
async def update_parking_tariff(
    payload: TariffUpdateRequest,
    x_user_role: Optional[str] = Header(default="ADMIN", alias="X-User-Role"),
    role: Optional[str] = Query(default=None, description="User role (ADMIN / USER)"),
):
    """
    Updates the canonical parking tariff rate.
    Strictly verifies that the requesting user has the ADMIN role.
    Non-admin requests are rejected with 403 Forbidden.
    """
    user_role = (role or x_user_role or "USER").upper()
    if user_role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only administrators with role 'ADMIN' are authorized to modify tariff settings."
        )

    billing_service.hourly_rate = payload.hourly_rate
    billing_service.per_minute_rate = payload.hourly_rate / 60.0
    for tier in billing_service.config.get("tiers", []):
        tier["base_rate"] = payload.hourly_rate
        tier["hourly_rate"] = payload.hourly_rate

    return {
        "success": True,
        "hourly_rate": payload.hourly_rate,
        "per_minute_rate": round(payload.hourly_rate / 60.0, 4),
        "message": f"Parking tariff successfully updated to ₹{payload.hourly_rate:.2f}/hour.",
    }

@router.post("/calculate-fee", response_model=FeeCalculationResponse, summary="Calculate Itemized Parking Fee")
async def calculate_parking_fee(payload: FeeCalculationRequest):
    """
    Simulates or computes granular parking fee based on vehicle type and entry time/duration.
    Returns itemized receipt with base charge, hourly breakdown, peak surcharge, and 18% GST.
    """
    now = datetime.now()
    exit_dt = now
    if payload.exit_time:
        for fmt in ("%d-%m-%Y %I:%M %p", "%d-%m-%Y %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%I:%M %p"):
            try:
                exit_dt = datetime.strptime(payload.exit_time.strip(), fmt)
                break
            except Exception:
                pass

    if payload.duration_minutes is not None:
        entry_dt = exit_dt - timedelta(minutes=payload.duration_minutes)
        entry_time_str = entry_dt.strftime("%d-%m-%Y %I:%M %p")
    elif payload.entry_time:
        entry_time_str = payload.entry_time
    else:
        # Default 2 hours ago
        entry_dt = exit_dt - timedelta(minutes=120)
        entry_time_str = entry_dt.strftime("%d-%m-%Y %I:%M %p")

    return billing_service.calculate_detailed_fee(
        entry_time_str=entry_time_str,
        exit_time=exit_dt,
        vehicle_type=payload.vehicle_type or "SEDAN",
    )

@router.get("/session/{id}", response_model=ParkingSessionSchema, summary="Get Parking Session by ID")
async def get_parking_session(id: str = Path(..., description="Parking session ID (e.g. SES-P07)")):
    """
    Fetches parking session details including entry time, duration, and fee.
    """
    session = parking_service.sessions.get(id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.put("/slot/{id}/status", summary="Manually Update Slot Status")
async def update_slot_status(id: str, payload: SlotStatusUpdateRequest):
    """
    Allows manual override or simulation of a slot status.
    When a slot is set OCCUPIED, a session record is auto-created if one doesn't exist.
    When set AVAILABLE, any open session for that slot is marked EXITED.
    """
    slot = parking_service.slots.get(id)
    if not slot:
        raise HTTPException(status_code=404, detail=f"Slot {id} does not exist.")

    slot["status"] = payload.status

    if payload.status == "AVAILABLE":
        slot["current_vehicle"] = None
        # Mark any open session for this slot as EXITED
        for session in parking_service.sessions.values():
            if session.get("slot_id") == id and session.get("status") == "PARKED":
                duration_minutes, _, calculated_fee = billing_service.calculate_duration_and_fee(
                    session.get("entry_time"), datetime.now()
                )
                session["duration_minutes"] = duration_minutes
                session["fee"] = max(10.0, calculated_fee)
                session["status"] = "EXITED"
                session["exit_time"] = datetime.now().strftime("%d-%m-%Y %I:%M %p")

    elif payload.status == "OCCUPIED" and payload.vehicle:
        veh = payload.vehicle.dict()
        slot["current_vehicle"] = veh

        # Check if an open session already exists for this slot
        existing = any(
            s.get("slot_id") == id and s.get("status") == "PARKED"
            for s in parking_service.sessions.values()
        )
        if not existing:
            import time as _time
            session_id = veh.get("session_id") or f"SES-{int(_time.time() * 1000) % 10_000_000}"
            plate = veh.get("plateNumber") or veh.get("plate_number") or f"VH-{id}"
            v_type = veh.get("vehicleType") or veh.get("vehicle_type") or "SEDAN"
            now_str = datetime.now().strftime("%d-%m-%Y %I:%M %p")
            parking_service.sessions[session_id] = {
                "id": session_id,
                "vehicle_number": plate,
                "vehicle_type": v_type,
                "slot_id": id,
                "parking_slot": id,
                "entry_time": now_str,
                "exit_time": None,
                "status": "PARKED",
                "payment_status": "PENDING",
                "fee": 0.0,
                "duration_minutes": 0,
            }

    return slot

@router.post("/reset", summary="Reset All Parking Slots to 0 (Vacant)")
async def reset_parking_facility():
    """
    Clears all active parked vehicles and resets all 20 bays to AVAILABLE.
    Enables clean end-to-end self-testing.
    """
    from backend.app.services.ws_manager import ws_manager
    status = parking_service.reset_all_to_empty()
    await ws_manager.broadcast({
        "event": "FACILITY_RESET",
        "message": "All 20 bays reset to AVAILABLE. 0 active vehicles.",
        "status": status,
    })
    return {
        "success": True,
        "message": "All 20 bays successfully reset to AVAILABLE. Ready for testing.",
        "status": status,
    }


@router.post("/sync-sessions", summary="Backfill Missing Session Records for Occupied Bays")
async def sync_sessions():
    """
    Scans all OCCUPIED slots and creates a session record for any slot
    that doesn't already have an active (PARKED) session.
    Call this after manual slot updates or 3D simulations to keep history in sync.
    """
    import time as _time
    created = []
    for slot_id, slot in parking_service.slots.items():
        if slot["status"] != "OCCUPIED":
            continue
        # Already has an open session for this slot?
        has_session = any(
            s.get("slot_id") == slot_id and s.get("status") == "PARKED"
            for s in parking_service.sessions.values()
        )
        if has_session:
            continue
        # Create a backfill session
        session_id = f"SES-{int(_time.time() * 1000) % 10_000_000}-{slot_id}"
        veh = slot.get("current_vehicle") or {}
        plate = (
            veh.get("plateNumber") or veh.get("plate_number") or
            veh.get("vehicle_number") or f"VH-{slot_id}"
        )
        v_type = veh.get("vehicleType") or veh.get("vehicle_type") or "SEDAN"
        now_str = datetime.now().strftime("%d-%m-%Y %I:%M %p")
        parking_service.sessions[session_id] = {
            "id": session_id,
            "vehicle_number": plate,
            "vehicle_type": v_type,
            "slot_id": slot_id,
            "parking_slot": slot_id,
            "entry_time": now_str,
            "exit_time": None,
            "status": "PARKED",
            "payment_status": "PENDING",
            "fee": 0.0,
            "duration_minutes": 0,
        }
        created.append({"session_id": session_id, "slot_id": slot_id, "plate": plate})

    return {
        "success": True,
        "synced_count": len(created),
        "created_sessions": created,
        "message": f"Backfilled {len(created)} missing session(s) for occupied bays.",
    }
