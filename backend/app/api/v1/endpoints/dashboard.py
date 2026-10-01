from fastapi import APIRouter
from backend.app.schemas.stats import DashboardStatsResponse
from backend.app.services.parking_service import parking_service

router = APIRouter()

@router.get("/stats", response_model=DashboardStatsResponse, summary="Get Dashboard Analytics & KPI Statistics")
async def get_dashboard_stats():
    """
    Returns real-time KPIs:
    Total slots, Occupied, Available, Occupancy %, Today's Vehicles (32), Today's Revenue (₹1,850), and hourly trends.
    """
    return parking_service.get_dashboard_stats()
