from pydantic import BaseModel, Field
from typing import List, Dict, Any

class HourlyRevenue(BaseModel):
    time: str = Field(..., example="6AM")
    amount: float = Field(..., example=120.0)

class HourlyOccupancy(BaseModel):
    time: str
    occupancy_percent: float
    vehicles: int

class VehicleClassStat(BaseModel):
    name: str
    count: int
    percent: float
    color: str

class DashboardStatsResponse(BaseModel):
    total_slots: int = 20
    occupied_slots: int = 14
    available_slots: int = 6
    reserved_slots: int = 0
    occupancy_percentage: float = 70.0
    todays_vehicles: int = 32
    todays_revenue: float = 1850.0
    revenue_growth_percent: float = 12.0
    average_duration: str = "2h 45m"
    peak_hours: str = "02:00 PM - 05:00 PM"
    turnover_rate: float = 1.6
    efficiency_score: float = 94.2
    hourly_revenue_trend: List[HourlyRevenue]
    hourly_occupancy_trend: List[HourlyOccupancy] = []
    vehicle_distribution: List[VehicleClassStat] = []

