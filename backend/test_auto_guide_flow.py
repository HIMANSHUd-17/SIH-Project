import json
import os
import sys
import requests
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FASTAPI_URL = "http://127.0.0.1:8000"
EXPRESS_URL = "http://127.0.0.1:3000"

def test_synthetic_guides_json():
    print("\n--- Test 1: Synthetic Guide Dataset Validation ---")
    json_path = os.path.join(BASE_DIR, "synthetic_guides.json")
    assert os.path.exists(json_path), f"File {json_path} does not exist!"
    with open(json_path, "r", encoding="utf-8") as f:
        guides = json.load(f)
    assert len(guides) == 100, f"Expected 100 guides, got {len(guides)}"
    
    # Test first guide
    g1 = guides[0]
    assert g1["guideId"] == "G-2001", f"Expected G-2001, got {g1['guideId']}"
    assert g1["fullName"] == "Vishal Kate", f"Expected Vishal Kate, got {g1['fullName']}"
    assert g1["licenseNo"] == "GL-MH-24001", f"Expected GL-MH-24001, got {g1['licenseNo']}"
    print(f"✓ Guide 1 verified: {g1['guideId']} -> {g1['fullName']} ({g1['licenseNo']})")
    
    # Test last guide
    g100 = guides[99]
    assert g100["guideId"] == "G-2100", f"Expected G-2100, got {g100['guideId']}"
    print(f"✓ Guide 100 verified: {g100['guideId']} -> {g100['fullName']}")
    
    # Test all IDs are strictly G-2001..G-2100
    for idx, g in enumerate(guides, start=2001):
        expected_id = f"G-{idx}"
        assert g["guideId"] == expected_id, f"Expected {expected_id}, got {g['guideId']}"
    print("✓ All 100 synthetic guide IDs sequentially validated G-2001..G-2100!")

def test_fastapi_endpoints():
    print("\n--- Test 2: FastAPI Direct Verification ---")
    # We can test the models and allocation logic directly if FastAPI server is tested or imported
    from main import app
    from fastapi.testclient import TestClient
    client = TestClient(app)
    
    # Check synthetic guides data in main
    res = client.get("/api/v1/guides")
    assert res.status_code == 200
    initial_guides = res.json()
    print(f"✓ GET /api/v1/guides returned {len(initial_guides)} existing guides")
    
    # Test Admin Manual Guide creation (G-1XXX range)
    admin_guide_payload = {
        "fullName": "Test Admin Guide",
        "mobileNumber": "9900112233",
        "licenseNo": "GL-ADM-001",
        "yearsExperience": 4,
        "languages": "English, Hindi",
        "password": "adminpassword123"
    }
    res_adm = client.post("/api/v1/guides", json=admin_guide_payload)
    assert res_adm.status_code == 200, f"Failed: {res_adm.text}"
    created_adm = res_adm.json()
    assert created_adm["guide_id"].startswith("G-1"), f"Admin guide must start with G-1XXX! Got {created_adm['guide_id']}"
    print(f"✓ Admin manual guide creation correctly allocated in G-1XXX range: {created_adm['guide_id']}")
    
    # Test Auto-Assign Team Guide endpoint (G-20XX range)
    res_auto = client.post("/api/v1/guides/auto-assign-team", json={})
    assert res_auto.status_code == 200, f"Failed auto-assign: {res_auto.text}"
    auto_guide = res_auto.json()["guide"]
    assert auto_guide["guide_id"] == "G-2001" or auto_guide["guide_id"].startswith("G-2"), f"Expected G-20XX guide, got {auto_guide['guide_id']}"
    print(f"✓ Auto-assign endpoint allocated: {auto_guide['guide_id']} - {auto_guide['full_name']}")
    
    # Test Tourist ID Generation with G-20XX guide
    res_tid = client.post("/api/v1/tourists/generate-id", json={"guide_id": auto_guide["guide_id"]})
    assert res_tid.status_code == 200
    tid_data = res_tid.json()
    assert tid_data["tourist_id"].startswith("T-2001-") or tid_data["tourist_id"].startswith(f"T-{auto_guide['guide_id'].replace('G-', '')}-")
    print(f"✓ Tourist ID generation under {auto_guide['guide_id']} formatted properly: {tid_data['tourist_id']}")
    
    # Test Guide Login with default password guide@123
    login_res = client.post("/api/v1/guides/login", json={"guideId": auto_guide["guide_id"], "password": "guide@123"})
    assert login_res.status_code == 200, f"Login failed for {auto_guide['guide_id']}"
    token = login_res.json()["access_token"]
    print(f"✓ Guide login successful for {auto_guide['guide_id']} with default credentials")
    
    # Test GET /api/v1/guides/me
    me_res = client.get("/api/v1/guides/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["guide_id"] == auto_guide["guide_id"]
    print(f"✓ /api/v1/guides/me returned authorized guide: {me_data['full_name']}")

if __name__ == "__main__":
    try:
        test_synthetic_guides_json()
        test_fastapi_endpoints()
        print("\n==========================================")
        print("ALL TESTS PASSED SUCCESSFULLY! ✓✓✓")
        print("==========================================\n")
    except Exception as e:
        print(f"\n❌ Test Failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
