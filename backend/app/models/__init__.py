from backend.app.models.users import User
from backend.app.models.vehicles import Vehicle
from backend.app.models.parking_slots import ParkingSlotModel
from backend.app.models.parking_sessions import ParkingSessionModel
from backend.app.models.parking_events import ParkingEvent
from backend.app.models.payments import PaymentModel
from backend.app.models.cameras import CameraModel
from backend.app.models.parking_slot_coordinates import ParkingSlotCoordinates
from backend.app.models.ai_detections import AIDetection

__all__ = [
    "User",
    "Vehicle",
    "ParkingSlotModel",
    "ParkingSessionModel",
    "ParkingEvent",
    "PaymentModel",
    "CameraModel",
    "ParkingSlotCoordinates",
    "AIDetection",
]
