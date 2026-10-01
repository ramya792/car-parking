import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

class TestErrorHandlingAndEdgeCases:
    """Test suite for system resiliency, validation errors, 404s, and edge cases."""

    def test_nonexistent_slot_returns_404(self):
        resp = client.get("/api/parking/slots/INVALID_SLOT_XYZ")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_nonexistent_camera_returns_404(self):
        resp = client.get("/api/cameras/CAM_99")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_invalid_fee_calculation_data_type_422(self):
        # Invalid data type for duration_minutes should raise 422 Unprocessable Entity
        resp = client.post("/api/parking/calculate-fee", json={"duration_minutes": "not_an_int"})
        assert resp.status_code == 422

    def test_invalid_vehicle_exit_missing_plate_422(self):
        # vehicle_number is required on VehicleExitRequest
        resp = client.post("/api/vehicles/exit", json={})
        assert resp.status_code == 422

    def test_verify_nonexistent_payment_session_400(self):
        resp = client.post(
            "/api/payment/verify",
            json={"payment_id": "PAY-INVALID-999", "session_id": "SES-DOES-NOT-EXIST"},
        )
        assert resp.status_code == 400
        data = resp.json()
        assert "not found" in data["detail"].lower()

    def test_plate_detection_with_garbled_string(self):
        resp = client.post(
            "/api/vehicles/detect-plate",
            json={"demo_plate": "###!@#GARBAGE$%", "camera_id": "CAM_01"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_valid"] is False

    def test_duration_rounding_short_stay(self):
        # Zero duration stay produces ₹0.00 cleanly
        payload = {
            "entry_time": "29-09-2026 12:00 PM",
            "exit_time": "29-09-2026 12:00 PM",
            "vehicle_type": "SEDAN",
        }
        resp = client.post("/api/parking/calculate-fee", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["duration_minutes"] == 0
        assert data["total_fee"] == 0.0
