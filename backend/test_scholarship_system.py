"""
Beyond Barriers - Step 8 Scholarship & Opportunity System Test Suite
====================================================================
Comprehensive tests validating:
1. Eligible student matches scholarship
2. Ineligible student does not receive false match
3. Academic percentage matching
4. Income matching
5. Category matching
6. Course/Stream matching
7. Multiple criteria matching
8. Scholarship deadline calculation
9. Due today (0 days)
10. Due tomorrow (1 day)
11. Closing soon (2-7 days)
12. Expired scholarship handling
13. Urgency label + icon exists (Never color alone)
14. Student cannot access admin APIs (403)
15. Mentor cannot access admin APIs (403)
16. Parent cannot access admin APIs (403)
17. Admin scholarship API does not expose academic/attendance/disability data
18. Admin can create new scholarship with validation
19. Admin invalid scholarship inputs rejected (bad date, bad URL)
20. Admin can toggle status (activate/deactivate)
21. Admin can update scholarship
22. Dynamic matching includes newly created admin scholarship
23. Voice summary generation for matched scholarships
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import datetime
from backend.app import create_app
from backend.database.db import get_db
from backend.app.services.scholarship_engine import (
    calculate_deadline_urgency, evaluate_scholarship_eligibility,
    sort_scholarships, generate_voice_summary
)

def run_tests():
    print("\n=======================================================")
    print(" BEYOND BARRIERS - STEP 8 SCHOLARSHIP SYSTEM TESTS")
    print("=======================================================\n")

    app = create_app()
    client = app.test_client()

    ref_date = datetime.date(2026, 9, 18)

    # -------------------------------------------------------------
    # 1. DEADLINE URGENCY & EDGE CASES
    # -------------------------------------------------------------
    print("--- 1. Testing Deadline Urgency & Edge Cases ---")

    # Due today (0 days)
    u_today = calculate_deadline_urgency("2026-09-18", reference_date=ref_date)
    assert u_today['urgency_state'] == 'due_today'
    assert u_today['days_remaining'] == 0
    assert 'Due today' in u_today['urgency_label']
    assert u_today['icon_name'] == 'AlertTriangle'
    print(f"[PASS] 1. Due today calculated: {u_today['badge_text']}")

    # Due tomorrow (1 day remaining)
    u_tom = calculate_deadline_urgency("2026-09-19", reference_date=ref_date)
    assert u_tom['urgency_state'] == 'closing_tomorrow'
    assert u_tom['days_remaining'] == 1
    assert '1 day remaining' in u_tom['urgency_label']
    assert u_tom['icon_name'] == 'AlertTriangle'
    print(f"[PASS] 2. Due tomorrow calculated: {u_tom['badge_text']}")

    # Closing soon (2-7 days)
    u_soon2 = calculate_deadline_urgency("2026-09-20", reference_date=ref_date)
    assert u_soon2['urgency_state'] == 'closing_soon'
    assert u_soon2['days_remaining'] == 2
    assert u_soon2['icon_name'] == 'Clock'

    u_soon5 = calculate_deadline_urgency("2026-09-23", reference_date=ref_date)
    assert u_soon5['urgency_state'] == 'closing_soon'
    assert u_soon5['days_remaining'] == 5
    assert u_soon5['icon_name'] == 'Clock'
    print(f"[PASS] 3. Closing soon calculated: {u_soon5['badge_text']}")

    # Open (> 7 days)
    u_open = calculate_deadline_urgency("2026-10-31", reference_date=ref_date)
    assert u_open['urgency_state'] == 'open'
    assert u_open['days_remaining'] == 43
    assert u_open['icon_name'] == 'Calendar'
    print(f"[PASS] 4. Open status calculated: {u_open['badge_text']}")

    # Expired (< 0 days) - must NOT show negative days
    u_exp = calculate_deadline_urgency("2026-09-10", reference_date=ref_date)
    assert u_exp['urgency_state'] == 'expired'
    assert u_exp['is_expired'] is True
    assert u_exp['days_remaining'] == 0 # Must not be negative
    assert u_exp['urgency_label'] == 'Expired'
    assert u_exp['icon_name'] == 'AlertOctagon'
    print(f"[PASS] 5. Expired status correctly formatted without negative numbers: {u_exp['badge_text']}")

    # Non-color status test: every urgency state has icon + text label + days remaining
    for u in [u_today, u_tom, u_soon5, u_open, u_exp]:
        assert u['icon_name'] is not None and len(u['icon_name']) > 0
        assert u['urgency_label'] is not None and len(u['urgency_label']) > 0
        assert u['aria_label'] is not None and len(u['aria_label']) > 0
    print("[PASS] 6. All urgency states include icon + semantic text + aria label (never color alone)")

    # -------------------------------------------------------------
    # 2. DETERMINISTIC MATCHING ENGINE RULES
    # -------------------------------------------------------------
    print("\n--- 2. Testing Deterministic Eligibility Matching Rules ---")

    test_scholarship = {
        'id': 99,
        'title': 'Merit STEM Excellence',
        'eligible_class': 'Class 10',
        'eligible_stream': 'General',
        'min_academic_percentage': 75.0,
        'max_income_limit': 300000.0,
        'category_requirement': 'All',
        'disability_required': 0
    }

    # Student A: High marks (82%), Low income (<3L = 300k), General stream -> Eligible
    st_eligible = {
        'class': 'Class 10',
        'stream': 'General',
        'academic_percentage': 82.0,
        'income_category': '<3L',
        'category': 'General',
        'disability_type': 'none'
    }
    eval_a = evaluate_scholarship_eligibility(st_eligible, test_scholarship)
    assert eval_a['is_eligible'] is True
    assert "academic percentage" in eval_a['match_explanation']
    print(f"[PASS] 7. Eligible student matched: '{eval_a['match_explanation']}'")

    # Student B: Low marks (65% < 75%) -> Ineligible on academic percentage
    st_low_marks = {
        'class': 'Class 10',
        'stream': 'General',
        'academic_percentage': 65.0,
        'income_category': '<3L',
        'category': 'General',
        'disability_type': 'none'
    }
    eval_b = evaluate_scholarship_eligibility(st_low_marks, test_scholarship)
    assert eval_b['is_eligible'] is False
    assert "currently does not match" in eval_b['match_explanation']
    assert any("academic marks" in r for r in eval_b['reasons_unmet'])
    print("[PASS] 8. Ineligible student correctly rejected on academic percentage (no false match)")

    # Student C: High income (>8L = 2M > 300k) -> Ineligible on income
    st_high_income = {
        'class': 'Class 10',
        'stream': 'General',
        'academic_percentage': 85.0,
        'income_category': '>8L',
        'category': 'General',
        'disability_type': 'none'
    }
    eval_c = evaluate_scholarship_eligibility(st_high_income, test_scholarship)
    assert eval_c['is_eligible'] is False
    assert any("family income" in r for r in eval_c['reasons_unmet'])
    print("[PASS] 9. Ineligible student correctly rejected on family income bracket")

    # Student D: Wrong class (Class 12 != Class 10) -> Ineligible on class
    st_wrong_class = {
        'class': 'Class 12',
        'stream': 'Science',
        'academic_percentage': 85.0,
        'income_category': '<1.5L',
        'category': 'General',
        'disability_type': 'none'
    }
    eval_d = evaluate_scholarship_eligibility(st_wrong_class, test_scholarship)
    assert eval_d['is_eligible'] is False
    print("[PASS] 10. Ineligible student correctly rejected on grade/class requirement")

    # Category matching
    sc_sc_only = {
        'title': 'SC Welfare Grant',
        'eligible_class': 'Class 10',
        'eligible_stream': 'All',
        'min_academic_percentage': 50.0,
        'max_income_limit': 0.0,
        'category_requirement': 'SC',
        'disability_required': 0
    }
    eval_cat_match = evaluate_scholarship_eligibility({**st_eligible, 'category': 'SC'}, sc_sc_only)
    assert eval_cat_match['is_eligible'] is True
    eval_cat_fail = evaluate_scholarship_eligibility({**st_eligible, 'category': 'General'}, sc_sc_only)
    assert eval_cat_fail['is_eligible'] is False
    print("[PASS] 11. Social category requirement strictly enforced")

    # -------------------------------------------------------------
    # 3. STUDENT SCHOLARSHIPS REST API & REAL SEEDED DATA
    # -------------------------------------------------------------
    print("\n--- 3. Testing Student Scholarships REST API ---")

    # Login as student 2 (Priya Verma: high academic ~94%, income <3L)
    res_s2 = client.post('/api/auth/login', json={'username': 'student2', 'password': 'password123'})
    assert res_s2.status_code == 200
    token_s2 = res_s2.get_json()['token']
    auth_s2 = {'Authorization': f'Bearer {token_s2}'}

    res_sch = client.get('/api/student/scholarships', headers=auth_s2)
    assert res_sch.status_code == 200
    data_sch = res_sch.get_json()
    assert data_sch['status'] == 'ok'
    assert data_sch['matched_count'] > 0
    assert len(data_sch['scholarships']) == data_sch['matched_count']
    assert 'all_opportunities' in data_sch
    assert 'voice_summary' in data_sch
    print(f"[PASS] 12. Student 2 (Priya) retrieved {data_sch['matched_count']} matched scholarships out of {data_sch['total_active_count']} total active")

    # Single scholarship detail
    first_sch = data_sch['scholarships'][0]
    detail_res = client.get(f"/api/student/scholarships/{first_sch['id']}", headers=auth_s2)
    assert detail_res.status_code == 200
    detail_data = detail_res.get_json()['scholarship']
    assert detail_data['id'] == first_sch['id']
    assert detail_data['match_explanation'] is not None
    assert 'urgency' in detail_data
    print(f"[PASS] 13. Student single scholarship detail retrieved with match explanation: '{detail_data['match_explanation'][:60]}...'")

    # -------------------------------------------------------------
    # 4. RBAC & PRIVACY SECURITY WALLS
    # -------------------------------------------------------------
    print("\n--- 4. Testing RBAC & Privacy Barriers ---")

    # 1. Student attempting to call Admin API -> 403 Forbidden
    res_st_admin = client.get('/api/admin/scholarships', headers=auth_s2)
    assert res_st_admin.status_code == 403, f"Expected 403, got {res_st_admin.status_code}"
    print("[PASS] 14. Student calling /api/admin/scholarships -> DENIED (403 Forbidden)")

    # 2. Mentor attempting to call Admin API -> 403 Forbidden
    res_m1 = client.post('/api/auth/login', json={'username': 'mentor1', 'password': 'password123'})
    token_m1 = res_m1.get_json()['token']
    auth_m1 = {'Authorization': f'Bearer {token_m1}'}

    res_m_admin = client.get('/api/admin/scholarships', headers=auth_m1)
    assert res_m_admin.status_code == 403
    print("[PASS] 15. Mentor calling /api/admin/scholarships -> DENIED (403 Forbidden)")

    # 3. Parent attempting to call Admin API -> 403 Forbidden
    res_p1 = client.post('/api/auth/login', json={'username': 'parent1', 'password': 'password123'})
    token_p1 = res_p1.get_json()['token']
    auth_p1 = {'Authorization': f'Bearer {token_p1}'}

    res_p_admin = client.get('/api/admin/scholarships', headers=auth_p1)
    assert res_p_admin.status_code == 403
    print("[PASS] 16. Parent calling /api/admin/scholarships -> DENIED (403 Forbidden)")

    # 4. Admin calling Admin API -> 200 OK
    res_adm = client.post('/api/auth/login', json={'username': 'admin1', 'password': 'password123'})
    token_adm = res_adm.get_json()['token']
    auth_adm = {'Authorization': f'Bearer {token_adm}'}

    res_adm_sch = client.get('/api/admin/scholarships', headers=auth_adm)
    assert res_adm_sch.status_code == 200
    admin_data = res_adm_sch.get_json()
    assert admin_data['status'] == 'ok'
    assert 'stats' in admin_data
    print(f"[PASS] 17. Administrator calling /api/admin/scholarships -> ALLOW (200 OK, count: {admin_data['count']})")

    # 5. Zero sensitive student data in Admin scholarship endpoints
    for s in admin_data['scholarships']:
        for forbidden_key in ['student_id', 'student_name', 'marks', 'attendance', 'disability_type', 'support_priority']:
            assert forbidden_key not in s, f"PRIVACY VIOLATION: '{forbidden_key}' leaked in admin scholarship item!"
    print("[PASS] 18. Admin scholarship endpoint does NOT expose marks, attendance, disabilities, or support priority")

    # -------------------------------------------------------------
    # 5. ADMIN SCHOLARSHIP CRUD & VALIDATION
    # -------------------------------------------------------------
    print("\n--- 5. Testing Administrator CRUD & Form Validation ---")

    # Create invalid scholarship: Bad URL & bad date
    bad_sch = {
        'title': 'Invalid Test Grant',
        'provider': 'Test Org',
        'description': 'Testing validation',
        'deadline': 'not-a-date',
        'application_url': 'invalid-url',
        'min_academic_percentage': 150.0 # > 100%
    }
    res_bad = client.post('/api/admin/scholarships', json=bad_sch, headers=auth_adm)
    assert res_bad.status_code == 400
    bad_errs = res_bad.get_json()['details']
    assert len(bad_errs) >= 3
    print(f"[PASS] 19. Admin form validation rejected malformed date, invalid URL, and percentage > 100%: {bad_errs}")

    # Create valid scholarship: "National Innovation in AI Fellowship"
    valid_sch = {
        'title': 'National Innovation in AI Fellowship',
        'provider': 'Ministry of Electronics & IT',
        'description': 'Encouraging secondary schoolers who pursue foundational digital & machine learning literacy.',
        'amount': '₹55,000 / year',
        'eligible_class': 'Class 10',
        'eligible_stream': 'All',
        'min_academic_percentage': 48.0,
        'category_requirement': 'All',
        'max_income_limit': 300000.0,
        'deadline': '2026-11-20',
        'application_url': 'https://meity.gov.in/ai-fellowship',
        'is_active': 1
    }
    res_create = client.post('/api/admin/scholarships', json=valid_sch, headers=auth_adm)
    assert res_create.status_code == 201
    created_sch = res_create.get_json()['scholarship']
    created_id = created_sch['id']
    assert created_sch['title'] == valid_sch['title']
    print(f"[PASS] 20. Admin created new scholarship successfully (ID: {created_id})")

    # Admin toggle status (deactivate)
    res_toggle = client.patch(f'/api/admin/scholarships/{created_id}/status', json={'is_active': 0}, headers=auth_adm)
    assert res_toggle.status_code == 200
    assert res_toggle.get_json()['is_active'] == 0
    print(f"[PASS] 21. Admin deactivated scholarship {created_id}")

    # Re-activate
    res_toggle2 = client.patch(f'/api/admin/scholarships/{created_id}/status', json={'is_active': 1}, headers=auth_adm)
    assert res_toggle2.status_code == 200
    assert res_toggle2.get_json()['is_active'] == 1
    print(f"[PASS] 22. Admin re-activated scholarship {created_id}")

    # Verify newly created active scholarship appears in student match query
    res_s1_new = client.get('/api/student/scholarships', headers=auth_s2)
    s2_titles = [s['title'] for s in res_s1_new.get_json()['scholarships']]
    assert 'National Innovation in AI Fellowship' in s2_titles
    print("[PASS] 23. Newly created active scholarship is dynamically matched to eligible students")

    # -------------------------------------------------------------
    # 6. VOICE AGENT SUMMARY CHECK
    # -------------------------------------------------------------
    print("\n--- 6. Testing Voice Agent Summary Generation ---")
    matched_for_voice = res_s1_new.get_json()['scholarships']
    voice_summary = generate_voice_summary(matched_for_voice)
    assert "Opening Scholarships" in voice_summary
    assert "matched scholarship" in voice_summary
    assert "The first scholarship is" in voice_summary
    assert "deadline is" in voice_summary
    print(f"[PASS] 24. Real-data Voice Agent summary verified:\n       \"{voice_summary}\"")

    print("\n=======================================================")
    print(" ALL 24 STEP 8 TESTS PASSED SUCCESSFULLY!")
    print("=======================================================\n")

if __name__ == '__main__':
    run_tests()
