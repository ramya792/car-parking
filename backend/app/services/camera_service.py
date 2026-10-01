from typing import List, Dict, Any, Optional
from datetime import datetime

class CameraService:
    def __init__(self):
        self.cameras: Dict[str, Dict[str, Any]] = {
            "CAM_01": {
                "id": "CAM_01",
                "name": "CAM West - Entrance Gate",
                "direction": "WEST",
                "type": "ENTRY",
                "status": "LIVE",
                "stream_url": "mock://cctv/cam-west-entrance",
                "detected_vehicle": {
                    "plate_number": "AP39AB1234",
                    "confidence": 0.947,
                    "bbox": [120, 80, 480, 360],
                    "status_text": "VEHICLE DETECTED",
                    "timestamp": datetime.now().strftime("%d-%m-%Y %I:%M:%S %p"),
                },
                "vehicles_detected_count": 1,
            },
            "CAM_02": {
                "id": "CAM_02",
                "name": "CAM Top - Overhead Lot",
                "direction": "TOP",
                "type": "PARKING",
                "status": "LIVE",
                "stream_url": "mock://cctv/cam-top-overview",
                "vehicles_detected_count": 14,
                "occupied_slots_count": 14,
                "available_slots_count": 6,
            },
            "CAM_03": {
                "id": "CAM_03",
                "name": "CAM East - Exit Gate",
                "direction": "EAST",
                "type": "EXIT",
                "status": "LIVE",
                "stream_url": "mock://cctv/cam-east-exit",
                "detected_vehicle": {
                    "plate_number": "TS09CD5678",
                    "confidence": 0.962,
                    "bbox": [110, 90, 470, 350],
                    "status_text": "VEHICLE DETECTED",
                    "timestamp": datetime.now().strftime("%d-%m-%Y %I:%M:%S %p"),
                },
                "vehicles_detected_count": 1,
            },
            "CAM_04": {
                "id": "CAM_04",
                "name": "CAM North - North Wing (P01-P10)",
                "direction": "NORTH",
                "type": "PARKING",
                "status": "LIVE",
                "stream_url": "mock://cctv/cam-north-wing",
                "detected_vehicle": {
                    "plate_number": "DL03GH9876",
                    "confidence": 0.952,
                    "bbox": [130, 85, 470, 355],
                    "status_text": "SLOT P05 OCCUPIED",
                    "timestamp": datetime.now().strftime("%d-%m-%Y %I:%M:%S %p"),
                },
                "vehicles_detected_count": 8,
                "occupied_slots_count": 8,
                "available_slots_count": 2,
            },
            "CAM_05": {
                "id": "CAM_05",
                "name": "CAM South - South Wing (P11-P20)",
                "direction": "SOUTH",
                "type": "PARKING",
                "status": "LIVE",
                "stream_url": "mock://cctv/cam-south-wing",
                "detected_vehicle": {
                    "plate_number": "AP07UV6789",
                    "confidence": 0.938,
                    "bbox": [140, 95, 460, 340],
                    "status_text": "SLOT P14 OCCUPIED",
                    "timestamp": datetime.now().strftime("%d-%m-%Y %I:%M:%S %p"),
                },
                "vehicles_detected_count": 6,
                "occupied_slots_count": 6,
                "available_slots_count": 4,
            },
        }

        # Aliases mapping
        self.aliases: Dict[str, str] = {
            "TOP": "CAM_02",
            "CAM_TOP": "CAM_02",
            "WEST": "CAM_01",
            "CAM_WEST": "CAM_01",
            "EAST": "CAM_03",
            "CAM_EAST": "CAM_03",
            "NORTH": "CAM_04",
            "CAM_NORTH": "CAM_04",
            "SOUTH": "CAM_05",
            "CAM_SOUTH": "CAM_05",
        }

    def get_all_cameras(self) -> List[Dict[str, Any]]:
        return list(self.cameras.values())

    def get_camera(self, camera_id: str) -> Optional[Dict[str, Any]]:
        if camera_id in self.cameras:
            return self.cameras[camera_id]
        clean_id = camera_id.upper().strip()
        if clean_id in self.aliases:
            return self.cameras[self.aliases[clean_id]]
        return None

    def update_camera_detection(self, camera_id: str, plate: str, confidence: float, status_text: str = "VEHICLE DETECTED"):
        target_id = self.aliases.get(camera_id.upper(), camera_id)
        if target_id in self.cameras:
            self.cameras[target_id]["detected_vehicle"] = {
                "plate_number": plate,
                "confidence": confidence,
                "bbox": [120, 80, 480, 360],
                "status_text": status_text,
                "timestamp": datetime.now().strftime("%d-%m-%Y %I:%M:%S %p"),
            }

camera_service = CameraService()
