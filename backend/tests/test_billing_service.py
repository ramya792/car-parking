import pytest
from datetime import datetime, timedelta
from backend.app.services.billing_service import BillingService, PARKING_HOURLY_RATE

class TestDynamicParkingFeeCalculation:
    """
    Test suite for dynamic parking fee calculation based on actual time:
    Rate: ₹10/hour (per-minute precision: 10/60 = 0.1666667/min)
    fee = round(durationMinutes * (10 / 60), 2)
    """

    @pytest.fixture
    def billing(self):
        return BillingService(hourly_rate=10.0)

    def test_case_1_three_hours(self, billing):
        """
        TEST 1:
        Entry: 10:00 AM
        Exit: 01:00 PM
        Duration: 3 hours (180 mins)
        Fee: ₹30.00
        """
        entry_time = "10:00 AM"
        exit_time = "01:00 PM"
        res = billing.calculate_detailed_fee(entry_time, exit_time=exit_time)
        assert res["duration_minutes"] == 180
        assert res["duration_display"] == "3h 00m"
        assert res["total_fee"] == 30.00
        assert res["parking_fee"] == 30.00

    def test_case_2_two_hours_thirty_minutes(self, billing):
        """
        TEST 2:
        Entry: 10:00 AM
        Exit: 12:30 PM
        Duration: 2 hours 30 minutes (150 mins)
        Fee: ₹25.00
        """
        entry_time = "10:00 AM"
        exit_time = "12:30 PM"
        res = billing.calculate_detailed_fee(entry_time, exit_time=exit_time)
        assert res["duration_minutes"] == 150
        assert res["duration_display"] == "2h 30m"
        assert res["total_fee"] == 25.00

    def test_case_3_four_hours_thirty_minutes(self, billing):
        """
        TEST 3:
        Entry: 04:12 PM
        Exit: 08:42 PM
        Duration: 4 hours 30 minutes (270 mins)
        Fee: ₹45.00
        """
        entry_time = "04:12 PM"
        exit_time = "08:42 PM"
        res = billing.calculate_detailed_fee(entry_time, exit_time=exit_time)
        assert res["duration_minutes"] == 270
        assert res["duration_display"] == "4h 30m"
        assert res["total_fee"] == 45.00

    def test_case_4_six_hours_twenty_five_minutes(self, billing):
        """
        TEST 4:
        Entry: 02:10 PM
        Exit: 08:35 PM
        Duration: 6 hours 25 minutes (385 mins)
        Fee: 385 * 10 / 60 = 64.1666667 -> ₹64.17
        """
        entry_time = "02:10 PM"
        exit_time = "08:35 PM"
        res = billing.calculate_detailed_fee(entry_time, exit_time=exit_time)
        assert res["duration_minutes"] == 385
        assert res["duration_display"] == "6h 25m"
        assert res["total_fee"] == 64.17

    def test_case_5_overnight_parking(self, billing):
        """
        TEST 5:
        Entry: 28-09-2026 10:00 PM
        Exit: 29-09-2026 02:00 AM
        Duration: 4 hours (240 mins)
        Fee: ₹40.00
        """
        entry_time = "28-09-2026 10:00 PM"
        exit_time = "29-09-2026 02:00 AM"
        res = billing.calculate_detailed_fee(entry_time, exit_time=exit_time)
        assert res["duration_minutes"] == 240
        assert res["duration_display"] == "4h 00m"
        assert res["total_fee"] == 40.00

    def test_multi_day_parking(self, billing):
        """
        Multi-day test:
        Entry: 26-09-2026 09:00 AM
        Exit: 28-09-2026 07:55 PM
        Duration: 58 hours 55 minutes = 3535 mins
        Fee: 3535 * 10 / 60 = 589.1666... -> ₹589.17
        """
        entry_time = "26-09-2026 09:00 AM"
        exit_time = "28-09-2026 07:55 PM"
        res = billing.calculate_detailed_fee(entry_time, exit_time=exit_time)
        assert res["duration_minutes"] == 3535
        assert res["duration_display"] == "58h 55m"
        assert res["total_fee"] == 589.17
