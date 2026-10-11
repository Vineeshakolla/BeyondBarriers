"""
Beyond Barriers - Step 8 Live Demo & Verification Script
========================================================
Validates the complete live HTTP API and Hackathon Demo flows:
1. Student demo flow:
   - Login as student2 (Priya)
   - Retrieve matched scholarships
   - Verify deterministic matching & match explanations
   - Verify deadline urgency badges (Never color alone)
   - Verify voice summary text for automatic page reading
2. Admin demo flow:
   - Login as admin1
   - Fetch active and total scholarship postings
   - Post a brand new scholarship posting
   - Verify newly posted scholarship is saved
   - Toggle status (Active / Inactive)
   - Verify student can dynamically see newly created active scholarship
3. Security & Privacy Wall verification:
   - Student blocked from Admin APIs (403)
   - Mentor blocked from Admin APIs (403)
   - Parent blocked from Admin APIs (403)
   - Zero student academic, marks, attendance, or disability data exposed to Admin
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import requests

BASE_URL = "http://127.0.0.1:5000/api"

def log_step(num, title):
    print(f"\n[DEMO STEP {num}] {title}")
    print("-" * 65)

def run_demo():
    print("===============================================================")
    print(" BEYOND BARRIERS - STEP 8 LIVE DEMO & VALIDATION FLOW")
    print("===============================================================")

    # -------------------------------------------------------------
    # 1. STUDENT DEMO: LOGIN AS PRIYA VERMA (STUDENT 2)
    # -------------------------------------------------------------
    log_step(1, "Login as Student (student2 / Priya Verma)")
    res = requests.post(f"{BASE_URL}/auth/login", json={"username": "student2", "password": "password123"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token_s2 = res.json()["token"]
    auth_s2 = {"Authorization": f"Bearer {token_s2}"}
    print(f"✓ Authenticated as: {res.json()['user']['username']} (Role: {res.json()['user']['role']})")

    # -------------------------------------------------------------
    # 2. STUDENT DEMO: OPEN SCHOLARSHIPS & VIEW MATCHES
    # -------------------------------------------------------------
    log_step(2, "Retrieve Student Scholarships & Deterministic Matches")
    res = requests.get(f"{BASE_URL}/student/scholarships", headers=auth_s2)
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    print(f"✓ Matched count: {data['matched_count']} / Total active: {data['total_active_count']}")
    print(f"✓ Student Academic Benchmark: {data['academic_percentage']}%")

    # Inspect top matched scholarships
    for idx, s in enumerate(data['scholarships'][:3], 1):
        u = s['urgency']
        print(f"\n  Matched Opportunity #{idx}:")
        print(f"  • Title: {s['title']}")
        print(f"  • Provider: {s['provider']}")
        print(f"  • Benefit: {s['amount']}")
        print(f"  • Urgency State: {u['badge_text']} (Icon: {u['icon_name']})")
        print(f"  • Explanation: \"{s['match_explanation']}\"")
        assert s['is_eligible'] is True
        assert u['icon_name'] in ['AlertTriangle', 'Clock', 'Calendar', 'AlertOctagon']

    # -------------------------------------------------------------
    # 3. STUDENT DEMO: VERIFY DEADLINE URGENCY LABELS
    # -------------------------------------------------------------
    log_step(3, "Verify Deadline Urgency Semantic States (Never Color Alone)")
    states_found = set()
    for s in data['all_opportunities']:
        u = s['urgency']
        states_found.add(u['urgency_state'])
        print(f"  • [{u['urgency_state'].upper()}] '{s['title'][:32]}...' -> {u['badge_text']}")

    assert 'due_today' in states_found or 'closing_tomorrow' in states_found
    assert 'closing_soon' in states_found
    assert 'open' in states_found
    print("✓ Urgency semantic states verified with icons + text labels")

    # -------------------------------------------------------------
    # 4. STUDENT DEMO: VOICE AGENT AUTOMATED PAGE READING
    # -------------------------------------------------------------
    log_step(4, "Voice Navigation to Scholarships & Auto-Reading Summary")
    voice_summary = data['voice_summary']
    print(f"Spoken Voice Summary:\n\"{voice_summary}\"")
    assert "Opening Scholarships" in voice_summary
    assert "matched scholarship" in voice_summary
    assert "deadline is" in voice_summary
    print("✓ Real-data voice summary verified for automated vocalization")

    # -------------------------------------------------------------
    # 5. SECURITY & PRIVACY BARRIER: UNAUTHORIZED ACCESS BLOCKED
    # -------------------------------------------------------------
    log_step(5, "Test RBAC: Student Attempts to Access Admin Scholarships API")
    res = requests.get(f"{BASE_URL}/admin/scholarships", headers=auth_s2)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    print(f"✓ Student access rejected with 403 Forbidden: {res.json()['error']}")

    log_step(6, "Test RBAC: Mentor Attempts to Access Admin Scholarships API")
    res_m = requests.post(f"{BASE_URL}/auth/login", json={"username": "mentor1", "password": "password123"})
    token_m = res_m.json()["token"]
    res = requests.get(f"{BASE_URL}/admin/scholarships", headers={"Authorization": f"Bearer {token_m}"})
    assert res.status_code == 403
    print(f"✓ Mentor access rejected with 403 Forbidden: {res.json()['error']}")

    log_step(7, "Test RBAC: Parent Attempts to Access Admin Scholarships API")
    res_p = requests.post(f"{BASE_URL}/auth/login", json={"username": "parent1", "password": "password123"})
    token_p = res_p.json()["token"]
    res = requests.get(f"{BASE_URL}/admin/scholarships", headers={"Authorization": f"Bearer {token_p}"})
    assert res.status_code == 403
    print(f"✓ Parent access rejected with 403 Forbidden: {res.json()['error']}")

    # -------------------------------------------------------------
    # 6. ADMIN DEMO: LOGIN AS ADMINISTRATOR
    # -------------------------------------------------------------
    log_step(8, "Login as Administrator (admin1 / P. K. Verma)")
    res = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin1", "password": "password123"})
    assert res.status_code == 200
    token_adm = res.json()["token"]
    auth_adm = {"Authorization": f"Bearer {token_adm}"}
    print(f"✓ Authenticated as: {res.json()['user']['username']} (Role: {res.json()['user']['role']})")

    # -------------------------------------------------------------
    # 7. ADMIN DEMO: RETRIEVE SCHOLARSHIP MANAGEMENT DASHBOARD
    # -------------------------------------------------------------
    log_step(9, "Administrator Queries Scholarship Management Postings")
    res = requests.get(f"{BASE_URL}/admin/scholarships", headers=auth_adm)
    assert res.status_code == 200
    admin_data = res.json()
    print(f"✓ Total Postings: {admin_data['stats']['total']}")
    print(f"✓ Active Postings: {admin_data['stats']['active']}")
    print(f"✓ Inactive Postings: {admin_data['stats']['inactive']}")
    print(f"✓ Urgent Deadlines (≤ 7 days): {admin_data['stats']['urgent_deadlines']}")

    # Verify zero student data
    for sch in admin_data['scholarships']:
        for sensitive_key in ['student_id', 'student_name', 'marks', 'attendance', 'disability_type', 'support_priority']:
            assert sensitive_key not in sch, f"Privacy violation: {sensitive_key} in admin output"
    print("✓ Strict privacy wall verified: ZERO student academic/disability data in Admin response")

    # -------------------------------------------------------------
    # 8. ADMIN DEMO: POST NEW SCHOLARSHIP
    # -------------------------------------------------------------
    log_step(10, "Administrator Posts New Scholarship Opportunity")
    new_posting = {
        "title": "Hackathon Inclusive Tech & STEM Fellowship",
        "provider": "Digital India Innovation Council",
        "description": "Comprehensive tuition waiver and cloud lab access for Class 10 scholars demonstrating enthusiasm in software & science.",
        "amount": "₹75,000 / year + Cloud Access",
        "eligible_class": "Class 10",
        "eligible_stream": "All",
        "min_academic_percentage": 55.0,
        "max_income_limit": 500000.0,
        "category_requirement": "All",
        "deadline": "2026-11-28",
        "application_url": "https://digitalindia.gov.in/stem-fellowship",
        "is_active": 1
    }
    res = requests.post(f"{BASE_URL}/admin/scholarships", json=new_posting, headers=auth_adm)
    assert res.status_code == 201, f"Failed: {res.text}"
    created_sch = res.json()["scholarship"]
    sch_id = created_sch["id"]
    print(f"✓ Published successfully! ID: {sch_id} - '{created_sch['title']}'")
    print(f"  • Deadline: {created_sch['deadline']} ({created_sch['urgency']['badge_text']})")

    # -------------------------------------------------------------
    # 9. STUDENT DEMO: VERIFY DYNAMIC MATCH FOR NEW SCHOLARSHIP
    # -------------------------------------------------------------
    log_step(11, "Switch to Student: Verify Dynamic Match for Newly Created Scholarship")
    res = requests.get(f"{BASE_URL}/student/scholarships", headers=auth_s2)
    s2_titles = [s['title'] for s in res.json()['scholarships']]
    assert "Hackathon Inclusive Tech & STEM Fellowship" in s2_titles
    print(f"✓ Newly posted scholarship is dynamically matched in student's dashboard!")

    # -------------------------------------------------------------
    # 10. ADMIN DEMO: TOGGLE STATUS TO INACTIVE
    # -------------------------------------------------------------
    log_step(12, "Administrator Deactivates Scholarship Posting")
    res = requests.patch(f"{BASE_URL}/admin/scholarships/{sch_id}/status", json={"is_active": 0}, headers=auth_adm)
    assert res.status_code == 200
    assert res.json()["is_active"] == 0
    print(f"✓ Scholarship {sch_id} successfully deactivated")

    # Confirm it disappeared from student matched list
    res = requests.get(f"{BASE_URL}/student/scholarships", headers=auth_s2)
    s2_titles_after = [s['title'] for s in res.json()['scholarships']]
    assert "Hackathon Inclusive Tech & STEM Fellowship" not in s2_titles_after
    print(f"✓ Inactive scholarship immediately excluded from active student opportunities")

    # Re-activate
    requests.patch(f"{BASE_URL}/admin/scholarships/{sch_id}/status", json={"is_active": 1}, headers=auth_adm)

    print("\n===============================================================")
    print(" ALL 12 LIVE STEP 8 DEMO STEPS VERIFIED WITH 100% SUCCESS!")
    print("===============================================================\n")

if __name__ == '__main__':
    run_demo()
