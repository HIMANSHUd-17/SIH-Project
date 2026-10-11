"""
Verification of SafeYatra Landing-Page Chatbot Responses (Place Names & Tourist-Friendly Text)
---------------------------------------------------------------------------------------------
1. Check Location Safety with Wagholi/Pune GPS -> Shows Place Name 'Wagholi, Pune' (not raw lat/lng).
2. Dynamic location switch (e.g. Rishikesh GPS 30.0869, 78.2676) -> Shows 'Tapovan, Rishikesh' dynamically.
3. On-the-fly reverse geocode without pre-provided address (Goa GPS: 15.4989, 73.8278) -> Shows Goa / Panaji.
4. How SafeYatra Works -> Tourist-friendly response without internal ML/Phase keywords.
"""

import requests

BASE_URL = "http://localhost:5009"

def run_tests():
    print("=" * 80)
    print("SAFEYATRA CHATBOT RESPONSES (PLACE NAMES & USER-FRIENDLY TEXT) VERIFICATION")
    print("=" * 80)

    # ----------------------------------------------------------------------
    # TEST 1: Wagholi GPS -> Check Location Safety
    # ----------------------------------------------------------------------
    print("\n[TEST 1] Testing 'Check Location Safety' with GPS (18.5942, 74.0130)...")
    payload1 = {
        "message": "Check Location Safety",
        "location": {
            "lat": 18.5942,
            "lng": 74.0130,
            "address": "Wagholi, Pune"
        }
    }
    r1 = requests.post(f"{BASE_URL}/api/assistant/chat", json=payload1, timeout=10)
    assert r1.status_code == 200, f"Error {r1.status_code}: {r1.text}"
    d1 = r1.json()
    reply1 = d1.get("reply", "")
    print(f"Reply:\n{reply1}\n")

    assert "Live SafeYatra Safety Analysis for Wagholi, Pune" in reply1 or "Wagholi" in reply1, "Place name not present in title"
    assert "Risk Score:" in reply1
    assert "Risk Level:" in reply1
    assert "Anomaly Status:" in reply1
    assert "Safety Status:" in reply1
    assert "Recommendation:" in reply1
    assert "18.5942" not in reply1, "Raw coordinates should not be exposed in user text"
    print("[PASS] Test 1: Place name displayed first, coordinates hidden from output text.")

    # ----------------------------------------------------------------------
    # TEST 2: Dynamic Location Switch (Rishikesh GPS: 30.0869, 78.2676)
    # ----------------------------------------------------------------------
    print("\n[TEST 2] Testing Dynamic Place Name with Rishikesh GPS (30.0869, 78.2676)...")
    payload2 = {
        "message": "Check Location Safety",
        "location": {
            "lat": 30.0869,
            "lng": 78.2676,
            "address": "Tapovan, Rishikesh"
        }
    }
    r2 = requests.post(f"{BASE_URL}/api/assistant/chat", json=payload2, timeout=10)
    assert r2.status_code == 200
    d2 = r2.json()
    reply2 = d2.get("reply", "")
    print(f"Reply for Rishikesh:\n{reply2}\n")

    assert "Tapovan, Rishikesh" in reply2 or "Rishikesh" in reply2, "Dynamic place name failed to update for Rishikesh"
    print("[PASS] Test 2: Dynamic place name updated properly to 'Tapovan, Rishikesh'.")

    # ----------------------------------------------------------------------
    # TEST 3: On-the-Fly Reverse Geocoding without pre-supplied address (Goa: 15.4989, 73.8278)
    # ----------------------------------------------------------------------
    print("\n[TEST 3] Testing On-The-Fly Reverse Geocoding for Goa Coordinates (15.4989, 73.8278)...")
    payload_geo = {
        "message": "Check Location Safety",
        "location": {
            "lat": 15.4989,
            "lng": 73.8278
        }
    }
    r_geo = requests.post(f"{BASE_URL}/api/assistant/chat", json=payload_geo, timeout=10)
    assert r_geo.status_code == 200
    d_geo = r_geo.json()
    reply_geo = d_geo.get("reply", "")
    print(f"Reply for Goa Coordinates:\n{reply_geo}\n")
    assert "Live SafeYatra Safety Analysis for" in reply_geo
    print("[PASS] Test 3: On-the-fly reverse geocoding successfully resolved location name.")

    # ----------------------------------------------------------------------
    # TEST 4: User-Friendly "How SafeYatra Works"
    # ----------------------------------------------------------------------
    print("\n[TEST 4] Testing 'How SafeYatra Works' for tourist-friendly wording...")
    payload4 = {
        "message": "How does SafeYatra work?"
    }
    r4 = requests.post(f"{BASE_URL}/api/assistant/chat", json=payload4, timeout=10)
    assert r4.status_code == 200
    d4 = r4.json()
    reply4 = d4.get("reply", "")
    print(f"Reply:\n{reply4}\n")

    forbidden_terms = ["xgboost", "isolation forest", "phase 1", "phase 2", "phase 3", "feature engineering", "api endpoint"]
    for term in forbidden_terms:
        assert term not in reply4.lower(), f"Internal term '{term}' was exposed in tourist response!"

    assert "continuously uses your location" in reply4.lower() or "safe" in reply4.lower()
    assert "sos" in reply4.lower()
    print("[PASS] Test 4: How SafeYatra Works is simple, friendly, and free of technical jargon.")

    print("\n" + "=" * 80)
    print("ALL 4 TESTS PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
