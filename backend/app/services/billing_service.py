from datetime import datetime, timedelta
import math
from typing import Dict, Any, Tuple, Optional, Union

# Configurable Canonical Parking Tariff
PARKING_HOURLY_RATE = 10.0  # ₹10 per hour
PARKING_PER_MINUTE_RATE = PARKING_HOURLY_RATE / 60.0  # ₹0.1666667 per minute

TARIFF_CONFIG = {
    "currency": "INR",
    "currency_symbol": "₹",
    "hourly_rate": PARKING_HOURLY_RATE,
    "per_minute_rate": PARKING_PER_MINUTE_RATE,
    "grace_period_minutes": 0,
    "gst_rate_percent": 0.0,
    "tiers": [
        {
            "vehicle_type": "SEDAN",
            "name": "Standard Sedan / Car",
            "base_rate": PARKING_HOURLY_RATE,
            "base_hours": 1,
            "hourly_rate": PARKING_HOURLY_RATE,
            "daily_max": 240.0,
        },
        {
            "vehicle_type": "SUV",
            "name": "Full-size SUV / Van",
            "base_rate": PARKING_HOURLY_RATE,
            "base_hours": 1,
            "hourly_rate": PARKING_HOURLY_RATE,
            "daily_max": 240.0,
        },
        {
            "vehicle_type": "HATCHBACK",
            "name": "Compact Hatchback",
            "base_rate": PARKING_HOURLY_RATE,
            "base_hours": 1,
            "hourly_rate": PARKING_HOURLY_RATE,
            "daily_max": 240.0,
        },
        {
            "vehicle_type": "TWO_WHEELER",
            "name": "Motorcycle / Scooter",
            "base_rate": PARKING_HOURLY_RATE,
            "base_hours": 1,
            "hourly_rate": PARKING_HOURLY_RATE,
            "daily_max": 240.0,
        },
    ],
    "peak_windows": [],
}

class BillingService:
    """
    Dynamic Parking Tariff & Fee Engine.
    Source of truth for duration & fee calculation at ₹10/hour (per-minute precision).
    """

    def __init__(self, hourly_rate: float = PARKING_HOURLY_RATE):
        self.hourly_rate = hourly_rate
        self.per_minute_rate = hourly_rate / 60.0
        self.config = TARIFF_CONFIG

    def parse_datetime(self, dt_val: Union[str, datetime, None], fallback_date: Optional[datetime] = None) -> datetime:
        """
        Parses full datetime objects and handles string timestamps in diverse formats:
        - ISO, '%d-%m-%Y %I:%M %p', '%d-%m-%Y %H:%M:%S', '%Y-%m-%d %H:%M:%S', '%I:%M %p', '%H:%M'
        """
        if isinstance(dt_val, datetime):
            return dt_val
        if not dt_val or not isinstance(dt_val, str):
            return fallback_date or datetime.now()

        val_str = dt_val.strip()
        ref = fallback_date or datetime.now()

        formats = [
            "%d-%m-%Y %I:%M %p",
            "%d-%m-%Y %I:%M:%S %p",
            "%d-%m-%Y %H:%M:%S",
            "%d-%m-%Y %H:%M",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %I:%M %p",
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%I:%M %p",
            "%I:%M:%S %p",
            "%H:%M:%S",
            "%H:%M",
        ]

        for fmt in formats:
            try:
                parsed = datetime.strptime(val_str, fmt)
                # If only time was provided (no year/month/day), bind to reference date
                if fmt in ("%I:%M %p", "%I:%M:%S %p", "%H:%M:%S", "%H:%M"):
                    parsed = parsed.replace(
                        year=ref.year,
                        month=ref.month,
                        day=ref.day,
                    )
                return parsed
            except Exception:
                continue

        return ref

    def calculate_duration_minutes(
        self,
        entry_time: Union[str, datetime],
        exit_time: Optional[Union[str, datetime]] = None,
    ) -> int:
        """
        Computes accurate difference in minutes between entry and exit timestamps.
        Properly handles same-day, overnight, and multi-day parking.
        """
        dt_exit = self.parse_datetime(exit_time)
        dt_entry = self.parse_datetime(entry_time, fallback_date=dt_exit)

        # Handle overnight case if pure time string was passed and exit < entry
        if dt_exit < dt_entry:
            # If difference was negative (e.g. entry 10:00 PM, exit 02:00 AM on same nominal date)
            # add 1 day to exit
            dt_exit = dt_exit + timedelta(days=1)

        diff_seconds = (dt_exit - dt_entry).total_seconds()
        duration_minutes = max(0, int(diff_seconds / 60))
        return duration_minutes

    def format_duration(self, duration_minutes: int) -> str:
        """
        Formats duration minutes into 'Xh Ym' (e.g., '4h 30m', '2h 00m', '32h 58m').
        """
        hours = duration_minutes // 60
        mins = duration_minutes % 60
        if hours > 0:
            return f"{hours}h {mins:02d}m"
        return f"{mins}m"

    def calculate_fee_from_minutes(self, duration_minutes: int, hourly_rate: Optional[float] = None) -> float:
        """
        Calculates parking fee at exact per-minute precision:
        fee = durationMinutes * (hourlyRate / 60)
        Rounded to 2 decimal places.
        """
        rate = hourly_rate if hourly_rate is not None else self.hourly_rate
        fee = duration_minutes * (rate / 60.0)
        return round(fee, 2)

    def calculate_detailed_fee(
        self,
        entry_time_str: Union[str, datetime],
        exit_time: Optional[Union[str, datetime]] = None,
        vehicle_type: str = "SEDAN",
        hourly_rate: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Dynamic tariff calculation returning itemized details.
        """
        rate = hourly_rate if hourly_rate is not None else self.hourly_rate
        dt_exit = self.parse_datetime(exit_time)
        dt_entry = self.parse_datetime(entry_time_str, fallback_date=dt_exit)

        if dt_exit < dt_entry:
            dt_exit = dt_exit + timedelta(days=1)

        diff_seconds = (dt_exit - dt_entry).total_seconds()
        duration_minutes = max(0, int(diff_seconds / 60))
        duration_display = self.format_duration(duration_minutes)

        total_fee = self.calculate_fee_from_minutes(duration_minutes, rate)
        billable_hours = math.ceil(duration_minutes / 60) if duration_minutes > 0 else 0

        return {
            "vehicle_type": vehicle_type or "SEDAN",
            "vehicle_tier_name": "Standard Tariff",
            "entry_time": dt_entry.strftime("%d-%m-%Y %I:%M %p"),
            "exit_time": dt_exit.strftime("%d-%m-%Y %I:%M %p"),
            "duration_minutes": duration_minutes,
            "duration_display": duration_display,
            "duration": duration_display,
            "billable_hours": billable_hours,
            "hourly_rate": rate,
            "per_minute_rate": round(rate / 60.0, 4),
            "base_fee": total_fee,
            "hourly_fee": total_fee,
            "additional_hours": max(0, billable_hours - 1),
            "is_peak_hours": False,
            "peak_window_name": None,
            "peak_surcharge": 0.0,
            "subtotal": total_fee,
            "cgst": 0.0,
            "sgst": 0.0,
            "tax_gst": 0.0,
            "total_fee": total_fee,
            "parking_fee": total_fee,
            "grace_period_applied": False,
            "daily_cap_reached": False,
            "rate_summary": f"₹{rate:.2f}/hour (₹{rate/60.0:.4f}/min)",
        }

    def calculate_duration_and_fee(
        self,
        entry_time_str: Union[str, datetime],
        exit_time: Optional[Union[str, datetime]] = None,
        vehicle_type: str = "SEDAN",
    ) -> Tuple[int, str, float]:
        """
        Backwards-compatible interface returning (minutes, display, total_fee).
        """
        res = self.calculate_detailed_fee(entry_time_str, exit_time, vehicle_type)
        return res["duration_minutes"], res["duration_display"], res["total_fee"]

    def get_tariff_schedule(self) -> Dict[str, Any]:
        """
        Returns full rate card and tariff settings.
        """
        return {
            "currency": self.config["currency"],
            "currency_symbol": self.config["currency_symbol"],
            "hourly_rate": self.hourly_rate,
            "grace_period_minutes": 0,
            "gst_rate_percent": 0.0,
            "is_currently_peak": False,
            "current_peak_window": None,
            "current_peak_multiplier": 1.0,
            "tiers": self.config["tiers"],
            "peak_windows": [],
        }

billing_service = BillingService()
