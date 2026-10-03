from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from backend.app.schemas.session import (
    VehicleEntryRequest,
    VehicleEntryResponse,
    VehicleExitRequest,
    VehicleExitResponse,
)
from backend.app.schemas.ai import (
    PlateRecognitionRequest,
    PlateRecognitionResponse,
)
from backend.app.services.parking_service import parking_service
from backend.app.services.billing_service import billing_service
from backend.app.services.anpr_engine import anpr_engine
from typing import List, Dict, Any, Optional

router = APIRouter()

@router.post("/detect-plate", response_model=PlateRecognitionResponse, summary="Detect and Recognize Vehicle Plate")
async def detect_vehicle_plate(payload: PlateRecognitionRequest):
    return anpr_engine.process_frame(demo_plate=payload.demo_plate, camera_id=payload.camera_id)

@router.post("/entry", response_model=VehicleEntryResponse, summary="Register Vehicle Entry & Assign Slot")
async def register_vehicle_entry(payload: VehicleEntryRequest):
    """
    Simulates or registers a vehicle arrival at Entry CCTV.
    Runs license plate recognition, finds an available slot among the 20 slots,
    assigns the slot, opens the entry barrier arm, and broadcasts real-time event.
    """
    plate = (payload.vehicle_number or "").strip().upper()
    if not plate:
        raise HTTPException(status_code=400, detail="Vehicle plate number is required for entry registration.")

    result = await parking_service.register_entry(
        vehicle_number=plate,
        vehicle_type=payload.vehicle_type or "SEDAN",
        color=payload.color or "#2563eb",
        preferred_slot=payload.preferred_slot,
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.post("/exit", response_model=VehicleExitResponse, summary="Process Vehicle Exit & Calculate Fee")
async def register_vehicle_exit(payload: VehicleExitRequest):
    """
    Simulates or registers a vehicle arriving at Exit CCTV.
    Locates active parking session, computes parking duration and fee at ₹10/hr,
    and checks if payment has cleared.
    """
    plate = (payload.vehicle_number or "").strip().upper()
    if not plate:
        raise HTTPException(status_code=400, detail="Vehicle plate number is required for exit registration.")

    result = await parking_service.register_exit(plate)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

@router.get("/active", summary="Get Currently Parked / Active Vehicles")
async def get_active_vehicles(
    search: Optional[str] = Query(default=None, description="Search vehicle plate number, slot, type or color"),
):
    """
    Returns real active parking sessions for vehicles currently parked in the 20 bays.
    """
    try:
        now_dt = datetime.now()
        results = []
        
        # Iterate over all active sessions with status PARKED
        for s in list(parking_service.sessions.values()):
            if s.get("status") == "PARKED":
                slot_id = s.get("slot_id") or s.get("parking_slot")
                slot = parking_service.get_slot(slot_id) if slot_id else None
                veh = slot.get("current_vehicle") if slot else None

                # A session is active only while its bay and vehicle are active.
                if not slot or slot.get("status") != "OCCUPIED":
                    continue
                slot_plate = (veh or {}).get("plate_number") or (veh or {}).get("plateNumber")
                if slot_plate and slot_plate.upper() != s.get("vehicle_number", "").upper():
                    continue
                
                try:
                    dur_mins, dur_disp, cur_fee = billing_service.calculate_duration_and_fee(s.get("entry_time", ""), now_dt)
                except Exception:
                    dur_mins, dur_disp, cur_fee = 1, "0h 01m", 10.0

                v_type = veh.get("vehicle_type", "SEDAN") if veh else "SEDAN"
                v_color = veh.get("color", "#2563eb") if veh else "#2563eb"
                
                results.append({
                    "id": s.get("id", f"SES-{slot_id}"),
                    "session_id": s.get("id", f"SES-{slot_id}"),
                    "vehicle_number": s.get("vehicle_number", slot_plate or "UNKNOWN"),
                    "slot_id": slot_id,
                    "row": slot.get("row", "TOP") if slot else "TOP",
                    "vehicle_type": v_type,
                    "color": v_color,
                    "entry_time": s.get("entry_time", "Just Now"),
                    "duration_minutes": dur_mins,
                    "duration_display": dur_disp,
                    "duration": dur_disp,
                    "hourly_rate": billing_service.hourly_rate,
                    "fee": cur_fee,
                    "parking_fee": cur_fee,
                    "status": "PARKED",
                    "confidence": veh.get("confidence", 0.96) if veh else 0.96,
                })

        # Also ensure any slots marked OCCUPIED directly are reflected
        recorded_slots = {r["slot_id"] for r in results}
        for slot in parking_service.get_all_slots():
            if slot.get("status") == "OCCUPIED" and slot.get("current_vehicle") and slot["id"] not in recorded_slots:
                cv = slot["current_vehicle"]
                results.append({
                    "id": cv.get("session_id", f"SES-{slot['id']}"),
                    "session_id": cv.get("session_id", f"SES-{slot['id']}"),
                    "vehicle_number": cv.get("plate_number") or cv.get("plateNumber", "UNKNOWN"),
                    "slot_id": slot["id"],
                    "row": slot.get("row", "TOP"),
                    "vehicle_type": cv.get("vehicle_type", "SEDAN"),
                    "color": cv.get("color", "#2563eb"),
                    "entry_time": cv.get("entry_time", "Just Now"),
                    "duration_minutes": 1,
                    "duration_display": cv.get("duration", "0h 01m"),
                    "duration": cv.get("duration", "0h 01m"),
                    "hourly_rate": 10.0,
                    "fee": 10.0,
                    "parking_fee": 10.0,
                    "status": "PARKED",
                    "confidence": cv.get("confidence", 0.96),
                })

        if search:
            s_upper = search.strip().upper()
            results = [
                r for r in results
                if s_upper in r["vehicle_number"].upper()
                or s_upper in r["slot_id"].upper()
                or s_upper in r["vehicle_type"].upper()
                or s_upper in r["color"].upper()
            ]

        return results
    except Exception:
        # Fallback to occupied slots to guarantee 100% endpoint stability
        fallback_results = []
        for slot in parking_service.get_all_slots():
            if slot.get("status") == "OCCUPIED" and slot.get("current_vehicle"):
                cv = slot["current_vehicle"]
                fallback_results.append({
                    "id": cv.get("session_id", f"SES-{slot['id']}"),
                    "session_id": cv.get("session_id", f"SES-{slot['id']}"),
                    "vehicle_number": cv.get("plate_number") or cv.get("plateNumber", "UNKNOWN"),
                    "slot_id": slot["id"],
                    "row": slot.get("row", "TOP"),
                    "vehicle_type": cv.get("vehicle_type", "SEDAN"),
                    "color": cv.get("color", "#2563eb"),
                    "entry_time": cv.get("entry_time", "Just Now"),
                    "duration_minutes": 1,
                    "duration_display": "0h 01m",
                    "duration": "0h 01m",
                    "hourly_rate": 10.0,
                    "fee": 10.0,
                    "parking_fee": 10.0,
                    "status": "PARKED",
                    "confidence": 0.96,
                })
        return fallback_results

@router.get("/history", summary="Get Historical Vehicle Parking Sessions")
async def get_vehicle_history(
    search: Optional[str] = Query(default=None, description="Search vehicle plate number or slot"),
    status: Optional[str] = Query(default=None, description="Filter by status (PARKED, EXITED)"),
):
    """
    Returns historical and active parking sessions with filtering and search.
    """
    sessions = []
    for session in parking_service.sessions.values():
        if session.get("status") == "PARKED":
            slot_id = session.get("slot_id") or session.get("parking_slot")
            slot = parking_service.get_slot(slot_id) if slot_id else None
            vehicle = slot.get("current_vehicle") if slot else None
            slot_plate = (vehicle or {}).get("plate_number") or (vehicle or {}).get("plateNumber")
            if (
                not slot
                or slot.get("status") != "OCCUPIED"
                or (slot_plate and slot_plate.upper() != session["vehicle_number"].upper())
            ):
                continue
        sessions.append(session)
    if search:
        s_upper = search.upper()
        sessions = [
            s for s in sessions
            if s_upper in s["vehicle_number"].upper() or s_upper in s.get("slot_id", "").upper()
        ]
    if status:
        sessions = [s for s in sessions if s.get("status") == status.upper()]
    return sessions

@router.post("/reset", summary="Reset All Vehicles & Bays to 0")
async def reset_all_vehicles():
    """
    Clears all active parked vehicles and frees all 20 bays.
    """
    from backend.app.services.ws_manager import ws_manager
    status = parking_service.reset_all_to_empty()
    await ws_manager.broadcast({
        "event": "FACILITY_RESET",
        "message": "All vehicles cleared. 20 bays available.",
        "status": status,
    })
    return {
        "success": True,
        "message": "All 20 bays reset to vacant. Active vehicles = 0.",
        "status": status,
    }

