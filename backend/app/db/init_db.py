import os
# Ensure fallback to SQLite for local initialization if Postgres is not running as a daemon
os.environ.setdefault("USE_SQLITE", "true")

import asyncio
import json
import logging
from sqlalchemy import select
from backend.app.core.database import engine, Base, AsyncSessionLocal
import backend.app.models  # Registers all 9 models into Base.metadata
from backend.app.models.users import User
from backend.app.models.vehicles import Vehicle
from backend.app.models.parking_slots import ParkingSlotModel
from backend.app.models.parking_sessions import ParkingSessionModel
from backend.app.models.cameras import CameraModel
from backend.app.models.parking_slot_coordinates import ParkingSlotCoordinates

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")

TOP_ROW_X = [-18, -14, -10, -6, -2, 2, 6, 10, 14, 18]
BOTTOM_ROW_X = [-18, -14, -10, -6, -2, 2, 6, 10, 14, 18]

INITIAL_SLOT_DATA = [
    # Top Row (P01 - P10) - All slots clean & available
    (f"P{i+1:02d}", "TOP", i + 1, "AVAILABLE", None, None, None, TOP_ROW_X[i], -6.2, 3.14159)
    for i in range(10)
] + [
    # Bottom Row (P11 - P20) - All slots clean & available
    (f"P{i+11:02d}", "BOTTOM", i + 11, "AVAILABLE", None, None, None, BOTTOM_ROW_X[i], 6.2, 0.0)
    for i in range(10)
]

INITIAL_CAMERAS = [
    ("CAM_01", "CAM 01 - Entrance", "ENTRY", "LIVE", "cctv://stream/cam01"),
    ("CAM_02", "CAM 02 - Parking Area", "PARKING", "LIVE", "cctv://stream/cam02"),
    ("CAM_03", "CAM 03 - Exit", "EXIT", "LIVE", "cctv://stream/cam03"),
]

async def init_database():
    logger.info("Initializing database schema...")

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("All 9 database tables created successfully.")

    async with AsyncSessionLocal() as session:
        # 1. Seed Cameras
        for cam_id, name, ctype, status, url in INITIAL_CAMERAS:
            existing = await session.get(CameraModel, cam_id)
            if not existing:
                session.add(CameraModel(
                    id=cam_id,
                    name=name,
                    camera_type=ctype,
                    status=status,
                    stream_url=url,
                    location_description=f"Surveillance post at {name}",
                ))

        # 2. Seed Admin User
        admin_res = await session.execute(select(User).where(User.email == "admin@smartparking.io"))
        if not admin_res.scalar_one_or_none():
            session.add(User(
                email="admin@smartparking.io",
                hashed_password="pbkdf2:sha256:adminpasswordhash",
                full_name="System Administrator",
                role="ADMIN",
                is_active=True,
            ))

        # 3. Seed 20 Parking Slots and initial Vehicles
        for slot_id, row, snum, status, plate, vtype, color, x, z, roty in INITIAL_SLOT_DATA:
            existing_slot = await session.get(ParkingSlotModel, slot_id)
            if not existing_slot:
                veh_id = None
                if plate:
                    # Check or create vehicle
                    veh_res = await session.execute(select(Vehicle).where(Vehicle.plate_number == plate))
                    vehicle = veh_res.scalar_one_or_none()
                    if not vehicle:
                        vehicle = Vehicle(
                            plate_number=plate,
                            vehicle_type=vtype or "SEDAN",
                            color=color or "#2563eb",
                        )
                        session.add(vehicle)
                        await session.flush()
                    veh_id = vehicle.id

                    # Create initial session
                    session_id = f"SES-{slot_id}"
                    existing_ses = await session.get(ParkingSessionModel, session_id)
                    if not existing_ses:
                        session.add(ParkingSessionModel(
                            id=session_id,
                            vehicle_number=plate,
                            slot_id=slot_id,
                            duration_minutes=151,
                            duration_display="2h 31m",
                            fee=50.0,
                            payment_status="PENDING",
                            status="PARKED",
                        ))

                slot_model = ParkingSlotModel(
                    id=slot_id,
                    row=row,
                    slot_number=snum,
                    status=status,
                    current_vehicle_id=veh_id,
                    position_x=x,
                    position_y=0.02,
                    position_z=z,
                    rotation_y=roty,
                )
                session.add(slot_model)

                # Seed Parking Slot Coordinates ROI
                existing_coord = await session.get(ParkingSlotCoordinates, snum)
                if not existing_coord:
                    mock_polygon = json.dumps([[50 + (snum - 1) * 40, 100], [90 + (snum - 1) * 40, 100], [90 + (snum - 1) * 40, 220], [50 + (snum - 1) * 40, 220]])
                    session.add(ParkingSlotCoordinates(
                        slot_id=slot_id,
                        camera_id="CAM_02",
                        polygon_roi=mock_polygon,
                        world_x=x,
                        world_y=0.02,
                        world_z=z,
                    ))

        await session.commit()
        logger.info("Database seeding completed with 20 parking slots, vehicles, and cameras!")

if __name__ == "__main__":
    asyncio.run(init_database())
