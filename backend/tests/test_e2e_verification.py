import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=== 1. TEST PARKING SLOTS (20 Canonical Bays) ===")
    r = requests.get(f"{BASE_URL}/parking/slots")
    assert r.status_code == 200, f"Failed slots: {r.text}"
    slots = r.json()
    assert len(slots) == 20, f"Expected 20 slots, got {len(slots)}"
    slot_ids = [s["id"] for s in slots]
    expected_ids = [f"P{i:02d}" for i in range(1, 21)]
    assert slot_ids == expected_ids, f"Slot mismatch: {slot_ids}"
    print("PASS: 20 slots P01-P20 verified.")

    print("\n=== 2. TEST TARIFF RBAC (ADMIN vs OPERATOR) ===")
    # As operator/user -> 403
    r = requests.put(f"{BASE_URL}/parking/tariff", json={"hourly_rate": 15.0}, headers={"X-User-Role": "OPERATOR"})
    assert r.status_code == 403, f"Expected 403 for operator, got {r.status_code}"
    print("PASS: Operator correctly forbidden (403).")
    
    # As admin -> 200
    r = requests.put(f"{BASE_URL}/parking/tariff", json={"hourly_rate": 10.0}, headers={"X-User-Role": "ADMIN"})
    assert r.status_code == 200, f"Expected 200 for admin, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["hourly_rate"] == 10.0, f"Expected 10.0, got {data}"
    print("PASS: Admin successfully updated tariff to Rs. 10.00/hr.")

    print("\n=== 3. TEST DYNAMIC FEE CALCULATION ===")
    # 3 hours = 180 min -> Rs 30
    payload = {
        "entry_time": "2026-09-30T07:00:00",
        "exit_time": "2026-09-30T10:00:00"
    }
    r = requests.post(f"{BASE_URL}/parking/calculate-fee", json=payload)
    assert r.status_code == 200, f"Failed fee calc: {r.text}"
    fee_data = r.json()
    assert fee_data["duration_minutes"] == 180, f"Expected 180 mins, got {fee_data}"
    assert fee_data["parking_fee"] == 30.0, f"Expected Rs. 30, got {fee_data}"
    print(f"PASS: 3 hours stayed -> Rs. {fee_data['parking_fee']} (Rate: Rs. {fee_data['hourly_rate']}/hr).")

    print("\n=== 4. TEST ACTIVE VEHICLES ENDPOINT ===")
    r = requests.get(f"{BASE_URL}/vehicles/active")
    assert r.status_code == 200, f"Failed active vehicles: {r.text}"
    active = r.json()
    print(f"PASS: Retrieved {len(active)} currently active vehicles.")
    if len(active) > 0:
        first = active[0]
        print(f"Sample Active Vehicle: {first['vehicle_number']} in bay {first['slot_id']} - Duration: {first['duration_display']}, Fee: Rs. {first['fee']}")

    print("\n=== 5. TEST COMPLETE VEHICLE LIFECYCLE (ENTRY -> OCCUPANCY -> EXIT -> PAYMENT) ===")
    test_plate = f"AP39E{int(time.time()) % 10000:04d}"
    
    # Entry
    entry_payload = {
        "vehicle_number": test_plate,
        "entry_camera": "CAM_01"
    }
    r = requests.post(f"{BASE_URL}/vehicles/entry", json=entry_payload)
    assert r.status_code == 200, f"Failed entry: {r.text}"
    entry_res = r.json()
    assigned_slot = entry_res["assigned_slot"]
    session_id = entry_res["session_id"]
    print(f"PASS: Entry registered. Vehicle {test_plate} assigned to slot {assigned_slot}, session: {session_id}")

    # Check slot status
    r = requests.get(f"{BASE_URL}/parking/slots")
    slots_map = {s["id"]: s for s in r.json()}
    assert slots_map[assigned_slot]["status"] == "OCCUPIED", f"Expected slot {assigned_slot} to be OCCUPIED"
    assert slots_map[assigned_slot]["current_vehicle"]["plate_number"] == test_plate, f"Expected slot vehicle to match"
    print(f"PASS: Slot {assigned_slot} successfully marked OCCUPIED by {test_plate}.")

    # Check active vehicles includes test_plate
    r = requests.get(f"{BASE_URL}/vehicles/active")
    active_plates = [v["vehicle_number"] for v in r.json()]
    assert test_plate in active_plates, f"Expected {test_plate} in active vehicles"
    print(f"PASS: Active vehicles list contains {test_plate}.")

    # Exit attempt
    exit_payload = {
        "vehicle_number": test_plate,
        "exit_camera": "CAM_03"
    }
    r = requests.post(f"{BASE_URL}/vehicles/exit", json=exit_payload)
    assert r.status_code == 200, f"Failed exit: {r.text}"
    exit_res = r.json()
    print(f"PASS: Exit attempted. Fee calculated: Rs. {exit_res['fee']} for duration {exit_res['duration']}.")

    # Payment
    pay_create_payload = {
        "session_id": session_id,
        "vehicle_number": test_plate,
        "amount": exit_res["fee"]
    }
    r = requests.post(f"{BASE_URL}/payment/create", json=pay_create_payload)
    assert r.status_code == 200, f"Failed payment create: {r.text}"
    payment_id = r.json()["payment_id"]

    pay_verify_payload = {
        "payment_id": payment_id,
        "session_id": session_id
    }
    r = requests.post(f"{BASE_URL}/payment/verify", json=pay_verify_payload)
    assert r.status_code == 200, f"Failed payment verify: {r.text}"
    pay_res = r.json()
    assert pay_res.get("status") == "SUCCESS" or pay_res.get("success") == True, f"Expected SUCCESS/success, got {pay_res}"
    print(f"PASS: Payment {payment_id} verified. Barrier arm: {pay_res.get('barrier_arm', 'OPEN')}.")

    # Verify slot is freed
    r = requests.get(f"{BASE_URL}/parking/slots")
    slots_map = {s["id"]: s for s in r.json()}
    assert slots_map[assigned_slot]["status"] == "AVAILABLE", f"Expected slot {assigned_slot} to be AVAILABLE now"
    print(f"PASS: Slot {assigned_slot} is now AVAILABLE.")

    # Verify vehicle removed from active
    r = requests.get(f"{BASE_URL}/vehicles/active")
    active_plates = [v["vehicle_number"] for v in r.json()]
    assert test_plate not in active_plates, f"Expected {test_plate} to be removed from active"
    print(f"PASS: Vehicle {test_plate} removed from active vehicles.")

    # Verify vehicle appears in history
    r = requests.get(f"{BASE_URL}/vehicles/history")
    history_plates = [h["vehicle_number"] for h in r.json()]
    assert test_plate in history_plates, f"Expected {test_plate} in history"
    print(f"PASS: Vehicle {test_plate} recorded in completed Parking History.")

    print("\n=== ALL ACCEPTANCE TEST CRITERIA PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
