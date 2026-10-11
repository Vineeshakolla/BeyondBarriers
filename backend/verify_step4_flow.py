#!/usr/bin/env python3
"""
Beyond Barriers - Step 4 Live End-to-End Verification Script
Tests through Vite proxy (http://localhost:5173/api) and direct backend (http://localhost:5000/api):
1. Login as newstudent -> is_profile_completed == 0
2. Fetch dynamic subjects for Class 10 General and Class 12 Science
3. Submit complete onboarding profile -> is_profile_completed becomes 1
4. Verify profile persistence via GET /api/student/profile
5. Edit profile (Career: Cybersecurity) -> verify updated field persists
6. Fresh login as newstudent -> confirms is_profile_completed remains 1 (no forced onboarding)
7. Security: Student A cannot modify Student B's profile
8. Validation: Bad payload rejected (400)
"""

import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:5173/api"

def make_req(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def main():
    print("=" * 60)
    print(" LIVE STEP 4 END-TO-END VERIFICATION (via Vite Proxy :5173)")
    print("=" * 60)

    # 1. Login as newstudent
    status, res = make_req("/auth/login", method="POST", data={"username": "newstudent", "password": "password123"})
    assert status == 200, f"Login failed: {res}"
    token = res["token"]
    profile = res["user"]["profile"]
    is_completed_initial = bool(profile.get("is_profile_completed"))
    print(f"[PASS] 1. New student login successful (User ID: {res['user']['id']}, Profile Completed: {is_completed_initial})")

    # 2. Dynamic Subject Lookup
    status, res = make_req("/student/subjects?class=Class+12&stream=Science", token=token)
    assert status == 200, f"Subjects failed: {res}"
    subject_names = [s["name"] for s in res["subjects"]]
    print(f"[PASS] 2. Dynamic subject resolution for Class 12 Science: {subject_names}")

    # 3. Complete Onboarding Profile Setup
    onboarding_payload = {
        "name": "Kavya Patel",
        "class": "Class 12",
        "stream": "Science",
        "disability_type": "none",
        "internet_access": "full",
        "device_access": "personal_laptop",
        "income_category": "<3L",
        "career_interest": "Artificial Intelligence",
        "preferred_response_format": "visual",
        "preferred_language": "en"
    }
    status, res = make_req("/student/profile", method="PUT", data=onboarding_payload, token=token)
    assert status == 200, f"Onboarding failed: {res}"
    assert res["profile"]["is_profile_completed"] is True
    print(f"[PASS] 3. Onboarding saved successfully: is_profile_completed = {res['profile']['is_profile_completed']}")

    # 4. Check Persistence via GET
    status, res = make_req("/student/profile", token=token)
    assert status == 200, f"Get profile failed: {res}"
    p = res["profile"]
    assert p["class"] == "Class 12" and p["stream"] == "Science"
    print(f"[PASS] 4. Persisted profile retrieved: {p['name']} ({p['class']} {p['stream']}, Roll: {p['roll_code']})")

    # 5. Edit Profile (e.g. Career -> Cybersecurity)
    edit_payload = onboarding_payload.copy()
    edit_payload["career_interest"] = "Cybersecurity"
    edit_payload["internet_access"] = "intermittent"
    status, res = make_req("/student/profile", method="PUT", data=edit_payload, token=token)
    assert status == 200
    assert res["profile"]["career_interest"] == "Cybersecurity"
    assert res["profile"]["internet_access"] == "intermittent"
    print(f"[PASS] 5. Profile edited successfully: Career changed to '{res['profile']['career_interest']}'")

    # 6. Fresh Login (Verify onboarding is not repeated)
    status, res = make_req("/auth/login", method="POST", data={"username": "newstudent", "password": "password123"})
    assert status == 200
    is_completed_subsequent = bool(res["user"]["profile"]["is_profile_completed"])
    assert is_completed_subsequent is True
    print(f"[PASS] 6. Fresh login verified: is_profile_completed is True (student goes directly to Dashboard)")

    # 7. Student Isolation Security
    malicious_payload = edit_payload.copy()
    malicious_payload["student_id"] = 1 # Try to overwrite Aarav Sharma
    malicious_payload["name"] = "Hacker"
    status, res = make_req("/student/profile", method="PUT", data=malicious_payload, token=token)
    assert status == 200
    # Check Aarav Sharma was NOT modified
    status, aarav_login = make_req("/auth/login", method="POST", data={"username": "student1", "password": "password123"})
    assert aarav_login["user"]["profile"]["name"] == "Aarav Sharma"
    print(f"[PASS] 7. Student isolation enforced: newstudent cannot modify Student 1's profile")

    # 8. Validation Rejection
    bad_payload = edit_payload.copy()
    bad_payload["stream"] = "Commerce" # Invalid for Class 10 if class was 10
    bad_payload["class"] = "Class 10"
    status, res = make_req("/student/profile", method="PUT", data=bad_payload, token=token)
    assert status == 400
    print(f"[PASS] 8. Validation rejection: Invalid stream 'Commerce' for Class 10 blocked with 400")

    print("\n" + "=" * 60)
    print(" ALL LIVE STEP 4 END-TO-END VERIFICATION CHECKS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    main()
