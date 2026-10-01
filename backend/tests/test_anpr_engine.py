import pytest
from backend.app.services.anpr_engine import ANPREngine, INDIAN_STATES

class TestANPREngine:
    """Test suite for Indian HSRP ANPR recognition, OCR noise correction, and validation."""

    def test_valid_indian_license_plates(self):
        valid_plates = [
            "AP39AB1234",
            "TS09CD5678",
            "KA01EF4321",
            "DL03GH9876",
            "MH12IJ5432",
            "KL07MN8765",
            "TN10JK9876",
            "UP32AA1111",
            "HR26DQ5555",
            "GJ01AB9999",
        ]
        for plate in valid_plates:
            cleaned, is_valid = ANPREngine.clean_and_normalize_plate(plate)
            assert is_valid, f"Plate {plate} should be recognized as valid HSRP"
            assert cleaned == plate

    def test_ocr_noise_correction(self):
        # State letters OCR confused as digits: '0' -> 'O', '1' -> 'I'
        cleaned, is_valid = ANPREngine.clean_and_normalize_plate("0P39AB1234")
        assert cleaned.startswith("OP")

        # RTO digits confused as letters: 'O' -> '0', 'I' -> '1', 'Z' -> '2'
        cleaned, is_valid = ANPREngine.clean_and_normalize_plate("MHIZAB1234")
        assert cleaned[2:4] == "12"

        # Last 4 digits confused as letters
        cleaned, is_valid = ANPREngine.clean_and_normalize_plate("KA05MBIO2B")
        assert cleaned[-4:] == "1028"
        assert is_valid

    def test_invalid_plates_rejection(self):
        invalid_candidates = [
            "TOO_SHORT",
            "12345678",
            "INVALID_PLATE_STRING",
            "A123BC4567",  # State must be 2 letters
            "",
            "   ",
        ]
        for candidate in invalid_candidates:
            _, is_valid = ANPREngine.clean_and_normalize_plate(candidate)
            assert not is_valid, f"Candidate '{candidate}' should be rejected as invalid"

    def test_generate_plate_image_base64(self):
        b64_img = ANPREngine.generate_plate_image("AP39AB1234")
        assert b64_img.startswith("data:image/jpeg;base64,")
        assert len(b64_img) > 100

    def test_process_frame_pipeline(self):
        result = ANPREngine.process_frame(demo_plate="TS09CD5678", camera_id="CAM_01")
        assert result["plate_number"] == "TS09CD5678"
        assert result["is_valid"] is True
        assert result["state_code"] == "TS"
        assert result["state_name"] == "Telangana"
        assert result["confidence"] >= 0.90
        assert result["plate_crop_base64"].startswith("data:image/jpeg;base64,")
        assert result["camera_id"] == "CAM_01"
