from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    vehicles,
    parking,
    payments,
    dashboard,
    cameras,
    ai,
)

api_router = APIRouter()

api_router.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles & ANPR"])
api_router.include_router(parking.router, prefix="/parking", tags=["Parking Slots & Sessions"])
api_router.include_router(payments.router, prefix="/payment", tags=["Payments"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"], include_in_schema=False)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard Analytics"])
api_router.include_router(cameras.router, prefix="/cameras", tags=["CCTV Cameras"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI & Computer Vision"])
