import sys
import urllib.request
import json

sys.stdout.reconfigure(encoding='utf-8')

test_cases = [
    ("10:00 AM", "01:00 PM", 180, 30.00),
    ("10:00 AM", "12:30 PM", 150, 25.00),
    ("04:12 PM", "08:42 PM", 270, 45.00),
    ("02:10 PM", "08:35 PM", 385, 64.17),
    ("28-09-2026 10:00 PM", "29-09-2026 02:00 AM", 240, 40.00),
]

all_passed = True
print("=== VERIFYING DYNAMIC PARKING TARIFF (₹10/HOUR) ===")
for entry, exit_t, exp_mins, exp_fee in test_cases:
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/parking/calculate-fee",
        data=json.dumps({"entry_time": entry, "exit_time": exit_t}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res = json.loads(urllib.request.urlopen(req).read().decode("utf-8"))
    mins = res["duration_minutes"]
    disp = res["duration_display"]
    fee = res["total_fee"]
    matched = (mins == exp_mins and fee == exp_fee)
    if not matched:
        all_passed = False
    print(f"[{'PASS' if matched else 'FAIL'}] Entry: {entry:<20} | Exit: {exit_t:<20} | Duration: {disp:<8} ({mins}m) | Fee: ₹{fee:.2f} (Exp: ₹{exp_fee:.2f})")

print(f"\nALL 5 TEST CASES PASSED: {all_passed}")
