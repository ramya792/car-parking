import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.parking_service import parking_service

client = TestClient(app)

class TestParkingLifecycleE2E:
    """
    Comprehensive End-to-End Integration Test:
    Simulates complete vehicle journey through the facility:
    CAM 01 (Arrival & ANPR) -> Barrier Open -> Slot Occupancy -> CAM 02 AI Scan ->
    CAM 03 (Exit) -> Tariff Calculation -> UPI Settlement -> Barrier Open -> Slot Vacated -> Analytics
    """

    def test_complete_vehicle_lifecycle(self):
        test_plate = "KA05MB4321"
        test_vehicle_type = "SEDAN"

        # Step 1: CAM 01 Arrival & ANPR Recognition
        anpr_resp = client.post(
            "/api/ai/plate-recognition",
            json={"demo_plate": test_plate, "camera_id": "CAM_01"},
        )
        assert anpr_resp.status_code == 200
        anpr_data = anpr_resp.json()
        assert anpr_data["plate_number"] == test_plate
        assert anpr_data["is_valid"] is True
        assert anpr_data["state_code"] == "KA"

        # Step 2: Register Entry (Assigned to available slot, e.g. P04)
        entry_resp = client.post(
            "/api/vehicles/entry",
            json={
                "vehicle_number": test_plate,
                "vehicle_type": test_vehicle_type,
                "color": "#10b981",
                "preferred_slot": "P04",
            },
        )
        assert entry_resp.status_code == 200
        entry_data = entry_resp.json()
        assert entry_data["success"] is True
        assigned_slot = entry_data["assigned_slot"]
        session_id = entry_data["session_id"]
        assert assigned_slot == "P04"
        assert entry_data["barrier_status"] == "OPEN"

        # Step 3: Verify slot is now OCCUPIED
        slot_resp = client.get(f"/api/parking/slots/{assigned_slot}")
        assert slot_resp.status_code == 200
        slot_data = slot_resp.json()
        assert slot_data["status"] == "OCCUPIED"
        assert slot_data["current_vehicle"]["plate_number"] == test_plate

        # Step 4: CAM 02 AI Occupancy Scan detects vehicle in assigned slot
        scan_resp = client.post("/api/ai/occupancy-scan")
        assert scan_resp.status_code == 200
        scan_data = scan_resp.json()
        p04_scan = next(s for s in scan_data["slot_detections"] if s["slot_id"] == assigned_slot)
        assert p04_scan["status"] == "OCCUPIED"
        assert p04_scan["vehicle_detected"] is True

        # Simulate 2 hours of parking duration to trigger standard fee calculation
        two_hours_ago = (datetime.now() - timedelta(hours=2)).strftime("%d-%m-%Y %I:%M %p")
        parking_service.sessions[session_id]["entry_time"] = two_hours_ago

        # Step 5: Vehicle Arrives at CAM 03 Exit
        exit_resp = client.post(
            "/api/vehicles/exit",
            json={"vehicle_number": test_plate},
        )
        assert exit_resp.status_code == 200
        exit_data = exit_resp.json()
        assert exit_data["success"] is True
        assert exit_data["session_id"] == session_id
        assert exit_data["fee"] > 0
        assert exit_data["payment_status"] == "PENDING"
        assert exit_data["exit_approved"] is False  # Cannot exit until paid

        fee_amount = exit_data["fee"]

        # Step 6: Create Payment Order
        pay_order_resp = client.post(
            "/api/payment/create",
            json={
                "session_id": session_id,
                "vehicle_number": test_plate,
                "amount": fee_amount,
            },
        )
        assert pay_order_resp.status_code == 200
        pay_order_data = pay_order_resp.json()
        payment_id = pay_order_data["payment_id"]
        assert pay_order_data["amount"] == fee_amount
        assert "upi://" in pay_order_data["upi_payload"]

        # Step 7: Verify Payment Settlement
        verify_resp = client.post(
            "/api/payment/verify",
            json={"payment_id": payment_id, "session_id": session_id},
        )
        assert verify_resp.status_code == 200
        verify_data = verify_resp.json()
        assert verify_data["success"] is True
        assert verify_data["status"] == "SUCCESS"
        assert verify_data["barrier_arm"] == "OPEN"

        # Step 8: Confirm Slot is Vacated and status returned to AVAILABLE
        vacated_slot_resp = client.get(f"/api/parking/slots/{assigned_slot}")
        assert vacated_slot_resp.status_code == 200
        assert vacated_slot_resp.json()["status"] == "AVAILABLE"
        assert vacated_slot_resp.json()["current_vehicle"] is None

        # Step 9: Verify Analytics & Session History updated
        history_resp = client.get(f"/api/vehicles/history?search={test_plate}")
        assert history_resp.status_code == 200
        history_records = history_resp.json()
        assert len(history_records) >= 1
        assert history_records[0]["vehicle_number"] == test_plate
        assert history_records[0]["payment_status"] == "SUCCESS"
