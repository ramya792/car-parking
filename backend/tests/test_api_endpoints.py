import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

class TestAPIEndpoints:
    """End-to-End API Integration Tests for Smart Parking Management System."""

    def test_root_and_health(self):
        resp_root = client.get("/")
        assert resp_root.status_code == 200
        data = resp_root.json()
        assert data["status"] == "online"
        assert data["total_slots"] == 20

        resp_health = client.get("/health")
        assert resp_health.status_code == 200
        assert resp_health.json()["status"] == "healthy"

    def test_get_parking_slots(self):
        resp = client.get("/api/parking/slots")
        assert resp.status_code == 200
        slots = resp.json()
        assert len(slots) == 20
        first_slot = slots[0]
        assert "id" in first_slot
        assert "status" in first_slot
        assert "row" in first_slot
        assert "position" in first_slot

    def test_get_single_slot(self):
        resp = client.get("/api/parking/slots/P01")
        assert resp.status_code == 200
        slot = resp.json()
        assert slot["id"] == "P01"
        assert slot["row"] == "TOP"

    def test_get_nonexistent_slot_404(self):
        resp = client.get("/api/parking/slots/P99")
        assert resp.status_code == 404

    def test_anpr_plate_detection_api(self):
        payload = {"demo_plate": "AP39AB1234", "camera_id": "CAM_01"}
        resp = client.post("/api/vehicles/detect-plate", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["plate_number"] == "AP39AB1234"
        assert data["is_valid"] is True
        assert data["state_code"] == "AP"

    def test_get_tariff_schedule(self):
        resp = client.get("/api/parking/tariff")
        assert resp.status_code == 200
        data = resp.json()
        assert data["hourly_rate"] == 10.0
        assert "tiers" in data

    def test_calculate_fee_api(self):
        payload = {
            "entry_time": "29-09-2026 01:00 PM",
            "exit_time": "29-09-2026 03:00 PM",
            "vehicle_type": "SEDAN",
        }
        resp = client.post("/api/parking/calculate-fee", json=payload)
        assert resp.status_code == 200
        fee_data = resp.json()
        assert fee_data["duration_minutes"] == 120
        assert fee_data["duration_display"] == "2h 00m"
        assert fee_data["hourly_rate"] == 10.0
        assert fee_data["total_fee"] == 20.0

    def test_cctv_cameras_api(self):
        resp = client.get("/api/cameras")
        assert resp.status_code == 200
        cams = resp.json()
        assert len(cams) >= 3
        cam_ids = [c["id"] for c in cams]
        assert "CAM_01" in cam_ids
        assert "CAM_02" in cam_ids
        assert "CAM_03" in cam_ids

    def test_cctv_single_camera(self):
        resp = client.get("/api/cameras/CAM_01")
        assert resp.status_code == 200
        cam = resp.json()
        assert cam["id"] == "CAM_01"
        assert cam["type"] == "ENTRY"

    def test_ai_occupancy_scan_api(self):
        resp = client.post("/api/ai/occupancy-scan")
        assert resp.status_code == 200
        scan = resp.json()
        assert scan["camera_id"] == "CAM_02"
        assert scan["total_slots"] == 20
        assert len(scan["slot_detections"]) == 20

    def test_dashboard_stats_api(self):
        resp = client.get("/api/dashboard/stats")
        assert resp.status_code == 200
        stats = resp.json()
        assert stats["total_slots"] == 20
        assert stats["occupancy_percentage"] >= 0
        assert stats["todays_revenue"] > 0
        assert "hourly_revenue_trend" in stats
        assert "vehicle_distribution" in stats
