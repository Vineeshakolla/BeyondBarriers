"""
End-to-End Live Verification Script for Step 5:
Personalized Learning, Modules, Tests, Confidence Analysis & Adaptive Engine.
Tests against Vite proxy (http://localhost:5173/api) and Flask backend (http://localhost:5000/api).
"""
import sys
import json
import requests

VITE_URL = "http://localhost:5173/api"

def log(msg, success=True):
    symbol = "[PASS]" if success else "[FAIL]"
    print(f"{symbol} {msg}")

def test_api():
    print("=== STARTING STEP 5 LIVE E2E VERIFICATION ===")
    
    # 0. Check Vite Proxy & Backend Connectivity
    try:
        r = requests.get(f"{VITE_URL}/health", timeout=5)
        assert r.status_code == 200, f"Vite proxy returned {r.status_code}"
        log("Vite dev proxy connectivity to Flask backend verified")
    except Exception as e:
        log(f"Vite proxy check failed: {e}", success=False)
        sys.exit(1)

    # 1. Login as Student 1 (Aarav Sharma - Class 10, General)
    s1 = requests.Session()
    login_res = s1.post(f"{VITE_URL}/auth/login", json={"username": "student1", "password": "password123"})
    assert login_res.status_code == 200, f"Student 1 login failed: {login_res.text}"
    data1 = login_res.json()
    token1 = data1["token"]
    s1.headers["Authorization"] = f"Bearer {token1}"
    user_data = data1["user"]
    assert user_data["role"].lower() == "student"
    st_id = user_data["profile"]["id"]
    log(f"Logged in as {user_data['username']} (Student ID: {st_id})")

    # 2. Dynamic Subject Filtering based on Class & Stream
    subjects_res = s1.get(f"{VITE_URL}/student/learning/subjects")
    assert subjects_res.status_code == 200, f"Get subjects failed: {subjects_res.text}"
    subjects_data = subjects_res.json()
    subj_names = [s["name"] for s in subjects_data["subjects"]]
    assert "Mathematics" in subj_names, "Mathematics missing for Class 10"
    assert "Science" in subj_names, "Science missing for Class 10"
    assert "Computer Science" not in subj_names, "Class 12 CS should NOT be in Class 10 enrolled subjects"
    log(f"Dynamic Subject Filtering verified: Class 10 subjects -> {subj_names}")

    # Find Mathematics subject ID
    math_subj = next(s for s in subjects_data["subjects"] if s["name"] == "Mathematics")
    math_id = math_subj["id"]

    # 3. Sequential Module Locks & Progress
    modules_res = s1.get(f"{VITE_URL}/student/learning/subjects/{math_id}/modules")
    assert modules_res.status_code == 200
    m_data = modules_res.json()
    modules = m_data["modules"]
    
    mod1 = next(m for m in modules if m["module_number"] == 1)
    mod2 = next(m for m in modules if m["module_number"] == 2)
    final_mod = next(m for m in modules if m["is_final_assessment"])
    
    assert mod1["status"] == "completed", f"Mod 1 should be completed, got {mod1['status']}"
    assert mod1["is_locked"] == False, "Mod 1 should not be locked"
    assert mod2["is_locked"] == False, "Mod 2 should be unlocked as Mod 1 is completed"
    assert final_mod["is_locked"] == True, "Final Assessment should be LOCKED because not all regular modules are completed"
    log(f"Module locks & statuses verified (Mod 1: {mod1['status']}, Mod 2: {mod2['status']}, Final Assessment: is_locked={final_mod['is_locked']})")

    # 4. Academic Integrity on Test Fetch
    test_res = s1.get(f"{VITE_URL}/student/learning/modules/{mod1['id']}/test")
    assert test_res.status_code == 200
    t_payload = test_res.json()
    t_data = t_payload["test"]
    questions = t_payload["questions"]
    assert len(questions) > 0, "Questions list should not be empty"
    for q in questions:
        assert "correct_option" not in q, f"SECURITY VIOLATION: correct_option leaked in test fetch! ({q})"
        assert "explanation" not in q, f"SECURITY VIOLATION: explanation leaked in test fetch! ({q})"
    log(f"Academic Integrity verified: {len(questions)} questions retrieved without leaking answers or explanations")

    # 5. Test Submission with Confidence & Quadrant Analysis
    test_id = t_data["id"]
    submission_a = {
        "answers": [
            {"question_id": 1, "selected_option": "B", "confidence": "Sure"},
            {"question_id": 2, "selected_option": "A", "confidence": "Sure"},
            {"question_id": 3, "selected_option": "A", "confidence": "Guessing"}
        ]
    }

    attempt_a_res = s1.post(f"{VITE_URL}/student/learning/tests/{test_id}/attempt", json=submission_a)
    assert attempt_a_res.status_code == 200, f"Attempt submission failed: {attempt_a_res.text}"
    att_a = attempt_a_res.json()["result"]
    assert att_a["score"] == 66.7, f"Expected 66.7%, got {att_a['score']}"
    assert att_a["passed"] == True
    assert att_a["confidence_analysis"]["sure_correct"] == 1
    assert att_a["confidence_analysis"]["sure_incorrect"] == 1  # Misconception!
    assert att_a["confidence_analysis"]["guessing_correct"] == 1 # Lucky guess!
    # Verify answers now contain explanations and correct options in result
    assert "correct_option" in att_a["answers"][0]
    assert "explanation" in att_a["answers"][0]
    log(f"Test submission & quadrant verified: Score={att_a['score']}%, Sure={att_a['sure_count']}, Guessing={att_a['guessing_count']}")
    log(f"Quadrant Analysis: {att_a['confidence_analysis']['sure_correct']} Mastery, {att_a['confidence_analysis']['sure_incorrect']} Misconception, {att_a['confidence_analysis']['guessing_correct']} Lucky Guess")

    # 6. Attempt History Retention (Multiple attempts preserved without overwriting)
    # Aarav already has 2 seed attempts on Module 2
    attempts_history_res = s1.get(f"{VITE_URL}/student/learning/modules/{mod2['id']}/attempts")
    assert attempts_history_res.status_code == 200
    hist = attempts_history_res.json()["attempts"]
    assert len(hist) >= 2, f"Expected at least 2 attempts stored for Module 2, got {len(hist)}"
    log(f"Attempt history retention verified: Module 2 has {len(hist)} distinct attempts preserved without overwriting")

    # 7. Adaptive Level Verification for Module 3 (Science - Chemical Reactions)
    # Scenario A: High score on attempt 1 with Sure confidence -> Light
    res_test3 = s1.get(f"{VITE_URL}/student/learning/modules/3/test")
    test3_id = res_test3.json()["test"]["id"]
    perf_payload = {
        "answers": [
            {"question_id": 6, "selected_option": "B", "confidence": "Sure"},
            {"question_id": 7, "selected_option": "C", "confidence": "Sure"}
        ]
    }
    att_light_res = s1.post(f"{VITE_URL}/student/learning/tests/{test3_id}/attempt", json=perf_payload)
    assert att_light_res.status_code == 200
    rec_light = att_light_res.json()["result"]["next_module_adaptive"]
    assert rec_light["level"] == "light", f"Expected 'light', got {rec_light['level']}"
    log(f"Adaptive Rule 1 verified: Score=100% + 'Sure' on attempt 1 -> Next Module: '{rec_light['level']}'")

    # Scenario B: Repeated attempt / low score with Guessing -> Detailed
    low_payload = {
        "answers": [
            {"question_id": 6, "selected_option": "A", "confidence": "Guessing"},
            {"question_id": 7, "selected_option": "A", "confidence": "Guessing"}
        ]
    }
    att_detailed_res = s1.post(f"{VITE_URL}/student/learning/tests/{test3_id}/attempt", json=low_payload)
    assert att_detailed_res.status_code == 200
    rec_det = att_detailed_res.json()["result"]["next_module_adaptive"]
    assert rec_det["level"] == "detailed", f"Expected 'detailed', got {rec_det['level']}"
    log(f"Adaptive Rule 2 verified: Repeated attempt / low score + 'Guessing' -> Next Module: '{rec_det['level']}'")

    # 8. Final Assessment Unlock Verification for Student 2 (Priya Patel)
    s2 = requests.Session()
    l2 = s2.post(f"{VITE_URL}/auth/login", json={"username": "student2", "password": "password123"}).json()
    s2.headers["Authorization"] = f"Bearer {l2['token']}"
    s2_modules_res = s2.get(f"{VITE_URL}/student/learning/subjects/{math_id}/modules")
    assert s2_modules_res.status_code == 200
    s2_modules = s2_modules_res.json()["modules"]
    s2_final = next(m for m in s2_modules if m["is_final_assessment"])
    assert s2_final["is_locked"] == False, f"Priya completed all regular modules, Final Assessment should be UNLOCKED! Got is_locked={s2_final['is_locked']}"
    log(f"Final Assessment unlock condition verified: Priya completed all prerequisite modules -> Final Assessment UNLOCKED (is_locked={s2_final['is_locked']})")

    # 9. Class 12 Dynamic Stream Filtering: Update newstudent's profile to Class 12 Science
    s_new = requests.Session()
    l_new = s_new.post(f"{VITE_URL}/auth/login", json={"username": "newstudent", "password": "password123"}).json()
    s_new.headers["Authorization"] = f"Bearer {l_new['token']}"
    
    # Update profile to Class 12 Science
    put_profile_res = s_new.put(f"{VITE_URL}/student/profile", json={
        "name": "Kavya Patel",
        "roll_number": 38,
        "roll_code": "CS-038",
        "class": "Class 12",
        "stream": "Science",
        "disability_type": "none",
        "internet_access": "intermittent",
        "device_access": "shared_smartphone",
        "income_category": "<3L",
        "career_interest": "Computer Science",
        "preferred_response_format": "text",
        "preferred_language": "en"
    })
    assert put_profile_res.status_code == 200, f"Profile update failed: {put_profile_res.text}"

    # Query learning subjects for this student -> verify Class 12 Science subjects
    c12_subj_res = s_new.get(f"{VITE_URL}/student/learning/subjects")
    assert c12_subj_res.status_code == 200
    c12_subj_names = [s["name"] for s in c12_subj_res.json()["subjects"]]
    assert "Physics" in c12_subj_names, "Physics missing for Class 12 Science"
    assert "Computer Science" in c12_subj_names, "Computer Science missing for Class 12 Science"
    log(f"Class 12 Science dynamic stream filtering verified: enrolled subjects -> {c12_subj_names}")

    # 10. Role-Based Security Isolation: Mentor / Parent / Unauthenticated blocked from student learning
    mentor_s = requests.Session()
    resp = mentor_s.post(f"{VITE_URL}/auth/login", json={"username": "mentor1", "password": "password123"})
    print("Mentor login status:", resp.status_code, "text:", repr(resp.text))
    l_mentor = resp.json()
    mentor_s.headers["Authorization"] = f"Bearer {l_mentor['token']}"
    m_resp = mentor_s.get(f"{VITE_URL}/student/learning/subjects")
    assert m_resp.status_code == 403, f"Mentor should receive 403 Forbidden, got {m_resp.status_code}"
    
    anon_resp = requests.get(f"{VITE_URL}/student/learning/subjects")
    assert anon_resp.status_code == 401, f"Anon should receive 401 Unauthorized, got {anon_resp.status_code}"
    log("Security isolation verified: 403 Forbidden for non-students, 401 for unauthenticated")

    print("\n=== ALL STEP 5 LIVE E2E VERIFICATIONS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_api()
