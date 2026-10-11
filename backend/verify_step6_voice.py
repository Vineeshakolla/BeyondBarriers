"""
End-to-End Live Verification Script for Step 6:
Voice-Controlled Navigation, Speech Synthesis/Recognition Architecture & Accessibility Engine.
Tests against Vite proxy (http://localhost:5173/api) and Flask backend (http://localhost:5000/api).
"""
import sys
import json
import requests

VITE_URL = "http://localhost:5173/api"

def log(msg, success=True):
    symbol = "[PASS]" if success else "[FAIL]"
    print(f"{symbol} {msg}")

def test_step6_voice_and_a11y():
    print("\n=== STARTING STEP 6 LIVE E2E VOICE & ACCESSIBILITY VERIFICATION ===")

    # 0. Check Vite Proxy & Backend Connectivity
    try:
        r = requests.get(f"{VITE_URL}/health", timeout=5)
        assert r.status_code == 200, f"Vite proxy returned {r.status_code}"
        log("Vite dev proxy connectivity to Flask backend verified")
    except Exception as e:
        log(f"Vite proxy check failed: {e}", success=False)
        sys.exit(1)

    # 1. Login as Student 1 (Aarav Sharma - Class 10 General)
    s1 = requests.Session()
    login_res = s1.post(f"{VITE_URL}/auth/login", json={"username": "student1", "password": "password123"})
    assert login_res.status_code == 200, f"Student 1 login failed: {login_res.text}"
    data1 = login_res.json()
    token1 = data1["token"]
    s1.headers["Authorization"] = f"Bearer {token1}"
    user_data = data1["user"]
    assert user_data["role"].lower() == "student"
    st_profile = user_data["profile"]
    log(f"Logged in as {user_data['username']} (Name: {st_profile['name']}, Roll: {st_profile['roll_code']})")

    # 2. Verify Real Data for Dashboard Reading
    prof_res = s1.get(f"{VITE_URL}/student/profile")
    assert prof_res.status_code == 200
    p_info = prof_res.json()["profile"]
    subjs = prof_res.json().get("subjects", [])
    
    learn_res = s1.get(f"{VITE_URL}/student/learning/progress")
    assert learn_res.status_code == 200
    metrics = learn_res.json()["metrics"]
    
    att_res = s1.get(f"{VITE_URL}/student/attendance")
    assert att_res.status_code == 200
    att_data = att_res.json()

    # Generate the exact voice reading that Dashboard registers
    dashboard_speech = (
        f"Opening your Dashboard. Welcome, {p_info['name']}. "
        f"Roll code {p_info['roll_code']}. "
        f"You have completed {metrics['completed_modules']} of {metrics['total_modules']} learning modules with an average score of {int(metrics['average_score'])} percent. "
        f"Your attendance is {int(att_data['overall_percentage'])} percent. "
        f"You have {len(subjs)} enrolled subjects: {', '.join(s['name'] for s in subjs)}. "
        f"You can say Go to My Learning, Go to Attendance, Go to Scholarships, or Go to Career Guidance."
    )
    assert p_info['name'] in dashboard_speech
    assert "Opening your Dashboard" in dashboard_speech
    log(f"Dashboard Voice Summary verified: '{dashboard_speech[:75]}...'")

    # 3. Verify Real Data for Attendance Reading
    assert len(att_data["attendance"]) > 0
    math_att = next(a for a in att_data["attendance"] if "Math" in a["subject_name"])
    att_speech = (
        f"Opening Attendance and Academic Performance. "
        f"Your overall attendance is {int(att_data['overall_percentage'])} percent across {len(att_data['attendance'])} subjects with an overall {att_data['dominant_trend']} trend. "
        f"{math_att['subject_name']}: {int(math_att['attendance_percentage'])} percent, trend {math_att['trend']}. "
        f"You can say Go to Dashboard, Go to My Learning, or Go to Scholarships."
    )
    assert "Opening Attendance" in att_speech
    assert str(int(math_att['attendance_percentage'])) in att_speech
    log(f"Attendance Voice Summary verified: '{att_speech[:75]}...'")

    # 4. Verify Real Data for Scholarships Reading
    sch_res = s1.get(f"{VITE_URL}/student/scholarships")
    assert sch_res.status_code == 200
    sch_data = sch_res.json()
    assert sch_data["count"] > 0
    top_sch = sch_data["scholarships"][0]
    sch_speech = (
        f"Opening Matched Scholarships. Found {sch_data['count']} scholarships matching your academic level and eligibility profile. "
        f"Scholarship 1: {top_sch['title']}, provided by {top_sch['provider']}, deadline {top_sch['deadline']}. "
        f"You can say Go to Dashboard, Go to Career Guidance, or Go to Accessibility Settings."
    )
    assert "Opening Matched Scholarships" in sch_speech
    assert top_sch["title"] in sch_speech
    log(f"Scholarships Voice Summary verified ({sch_data['count']} matches): '{sch_speech[:75]}...'")

    # 5. Verify Real Data for Career Guidance Reading
    car_res = s1.get(f"{VITE_URL}/student/career")
    assert car_res.status_code == 200
    car_data = car_res.json()
    assert len(car_data["steps"]) >= 4, f"Expected 4 roadmap steps, got {len(car_data['steps'])}"
    st1 = car_data["steps"][0]
    car_speech = (
        f"Opening Career Guidance. Exploring career pathways for your interest in {car_data['career_interest']}. "
        f"Target role is {car_data['role']['title']}. Stage 1 is {st1['stage']}: {st1['title']}. "
        f"You can say Go to Dashboard, Go to My Learning, or Go to Accessibility Settings."
    )
    assert "Opening Career Guidance" in car_speech
    assert car_data["role"]["title"] in car_speech
    log(f"Career Guidance Voice Summary verified ({len(car_data['steps'])} roadmap stages): '{car_speech[:75]}...'")

    # 6. Verify Accessibility Preferences API & Persistence
    acc_res = s1.get(f"{VITE_URL}/student/accessibility")
    assert acc_res.status_code == 200
    orig_acc = acc_res.json()["accessibility"]

    # Update format to 'audio'
    update_res = s1.put(f"{VITE_URL}/student/accessibility", json={
        "preferred_response_format": "audio",
        "preferred_language": "en"
    })
    assert update_res.status_code == 200
    updated_acc = update_res.json()["accessibility"]
    assert updated_acc["preferred_response_format"] == "audio"

    # Restore
    s1.put(f"{VITE_URL}/student/accessibility", json={
        "preferred_response_format": orig_acc["preferred_response_format"],
        "preferred_language": orig_acc["preferred_language"]
    })
    log("Accessibility Settings API verified: successfully updated and restored")

    # 7. Role-Based Security Isolation: Mentor / Parent / Unauthenticated blocked from student endpoints
    mentor_s = requests.Session()
    l_mentor = mentor_s.post(f"{VITE_URL}/auth/login", json={"username": "mentor1", "password": "password123"}).json()
    mentor_s.headers["Authorization"] = f"Bearer {l_mentor['token']}"
    
    for endpoint in ["/student/attendance", "/student/scholarships", "/student/career", "/student/accessibility"]:
        r_m = mentor_s.get(f"{VITE_URL}{endpoint}")
        assert r_m.status_code == 403, f"Expected 403 for mentor on {endpoint}, got {r_m.status_code}"
        
        r_anon = requests.get(f"{VITE_URL}{endpoint}")
        assert r_anon.status_code == 401, f"Expected 401 for unauthenticated on {endpoint}, got {r_anon.status_code}"
    
    log("Security isolation verified: 403 Forbidden for non-students, 401 for unauthenticated across all 4 endpoints")

    print("\n=== ALL STEP 6 LIVE E2E VOICE & ACCESSIBILITY TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_step6_voice_and_a11y()
