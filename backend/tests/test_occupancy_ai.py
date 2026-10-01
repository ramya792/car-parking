import pytest
import numpy as np
import cv2
from backend.app.services.occupancy_engine import OccupancyAIEngine, SLOT_ROIS

class TestOccupancyAIEngine:
    """Test suite for CAM 02 Computer Vision Occupancy & Polygonal ROI Point-in-Polygon Engine."""

    @pytest.fixture
    def engine(self):
        return OccupancyAIEngine()

    def test_20_slots_rois_calibrated(self):
        # Exactly 20 slots P01 to P20
        assert len(SLOT_ROIS) == 20
        for i in range(1, 21):
            slot_id = f"P{i:02d}"
            assert slot_id in SLOT_ROIS
            poly = SLOT_ROIS[slot_id]
            assert len(poly) == 4, f"ROI for {slot_id} must have 4 trapezoidal vertices"
            # Verify positive area
            poly_np = np.array(poly, dtype=np.int32)
            area = cv2.contourArea(poly_np)
            assert area > 1000, f"Slot {slot_id} polygon area must be positive and reasonable"

    def test_point_in_polygon_overlap_detection(self, engine):
        # Pick slot P01
        p01_poly = SLOT_ROIS["P01"]
        poly_np = np.array(p01_poly, dtype=np.int32)
        rect = cv2.boundingRect(poly_np)
        
        # Vehicle bounding box centered directly in P01
        bbox_inside = [rect[0] + 5, rect[1] + 5, rect[2] - 10, rect[3] - 10]
        overlap = engine.calculate_slot_overlap(p01_poly, bbox_inside)
        assert overlap >= 0.5, "Centroid inside slot must produce high overlap confidence"

        # Vehicle bbox completely outside
        bbox_outside = [10, 10, 50, 50]
        overlap_outside = engine.calculate_slot_overlap(p01_poly, bbox_outside)
        assert overlap_outside == 0.0, "Outside vehicle must yield 0 overlap"

    def test_facility_scan_pipeline(self, engine):
        scan_res = engine.scan_facility_occupancy()
        assert scan_res["camera_id"] == "CAM_02"
        assert scan_res["total_slots"] == 20
        assert scan_res["occupied_slots"] + scan_res["available_slots"] == 20
        assert len(scan_res["slot_detections"]) == 20
        assert scan_res["ai_model"] == "YOLOv8x + Polygon IoU Classifier"
