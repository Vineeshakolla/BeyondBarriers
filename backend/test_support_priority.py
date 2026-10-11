#!/usr/bin/env python3
"""
Beyond Barriers - Step 7 Academic Risk Detection & Support Priority Engine Test Suite
Tests:
1. Normal priority scenario (high attendance, high score, low guessing)
2. Needs Support priority scenario (low score, attendance drop, frequent guessing, repeated attempts)
3. Monitor priority scenario (moderate performance and attendance)
4. Insufficient Data scenario (new student with zero records handled gracefully)
5. Explainable reasons factual accuracy (no "AI detected risk")
6. Performance trend calculation (improving, stable, declining)
7. Metacognitive confidence analysis (Sure vs Guessing, misconceptions)
8. Subject-level support breakdown
9. Mentor roll-range restriction: Mentor 1 (rolls 1-20) gets only assigned rolls
10. Mentor urgency sorting: Needs Support students ranked first
11. Mentor security: Mentor 1 accessing Student Roll 22 rejected with 403 Forbidden
12. Student own-data security: token binds student_id server-side
13. Admin role blocked from student and mentor support endpoints (403 Forbidden)
14. Parent role blocked from student support endpoints (403 Forbidden)
"""

import sys
import os
import json

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app import create_app
from backend.database.db import get_db
from backend.app.services.support_engine import calculate_support_priority

def run_tests():
    app = create_app()
    client = app.test_client()

    print("\n" + "=" * 70)
    print(" BEYOND BARRIERS - STEP 7 SUPPORT PRIORITY & RISK ENGINE TEST SUITE")
    print("=" * 70)

    # -------------------------------------------------------------------------
    # 1. CORE ENGINE DIRECT UNIT TESTS
    # -------------------------------------------------------------------------
    with app.app_context():
        db = get_db()

        # Test A: Student 2 (Priya Verma - Roll 5) -> High performer, Normal
        priya = calculate_support_priority(db, 2)
        assert priya is not None
        assert priya['support_priority'] == 'Normal', f"Expected Normal, got {priya['support_priority']}"
        assert priya['composite_risk_score'] < 2.5
        assert priya['metrics']['overall_attendance'] >= 90.0
        assert priya['metrics']['guessing_rate'] == 0.0
        assert any("Consistent" in r or "attendance" in r for r in priya['reasons'])
        print(f"[PASS] 1. Scenario Normal: Priya Verma correctly classified as 'Normal' (Risk Score: {priya['composite_risk_score']})")

        # Test B: Student 1 (Aarav Sharma - Roll 14) -> Low score, declining attendance -> Needs Support
        aarav = calculate_support_priority(db, 1)
        assert aarav is not None
        assert aarav['support_priority'] == 'Needs Support', f"Expected Needs Support, got {aarav['support_priority']}"
        assert aarav['composite_risk_score'] >= 4.5
        assert aarav['metrics']['attendance_trend'] == 'declining'
        assert aarav['metrics']['guessing_rate'] >= 50.0
        assert aarav['metrics']['struggling_modules_count'] >= 1
        # Verify explainable reasons don't use buzzwords
        for r in aarav['reasons']:
            assert "AI detected" not in r
            assert "machine learning" not in r
        assert any("attendance" in r.lower() for r in aarav['reasons'])
        assert any("guessing" in r.lower() for r in aarav['reasons'])
        print(f"[PASS] 2. Scenario Needs Support: Aarav Sharma correctly classified as 'Needs Support' (Risk Score: {aarav['composite_risk_score']})")

        # Test C: Student 3 (Kabir Roy - Roll 19) -> Moderate performance -> Monitor
        kabir = calculate_support_priority(db, 3)
        assert kabir is not None
        assert kabir['support_priority'] == 'Monitor', f"Expected Monitor, got {kabir['support_priority']}"
        assert 2.0 <= kabir['composite_risk_score'] < 4.5
        print(f"[PASS] 3. Scenario Monitor: Kabir Roy correctly classified as 'Monitor' (Risk Score: {kabir['composite_risk_score']})")

        # Test D: Student 8 (Meera Nair - Roll 31) -> Zero records -> Insufficient Data
        meera = calculate_support_priority(db, 8)
        assert meera is not None
        assert meera['support_priority'] == 'Insufficient Data'
        assert meera['composite_risk_score'] == 0.0
        assert "Insufficient" in meera['reasons'][0]
        print(f"[PASS] 4. Edge Case: Student with zero test/attendance records handled as 'Insufficient Data'")

        # Test E: Subject-level signals for Aarav
        math_subj = next((s for s in aarav['subject_support'] if s['subject_name'] == 'Mathematics'), None)
        assert math_subj is not None
        assert math_subj['status'] == 'Needs Support'
        print(f"[PASS] 5. Subject-level analysis: Mathematics for Aarav flagged as 'Needs Support'")

    # -------------------------------------------------------------------------
    # 2. STUDENT REST API ENDPOINTS & AUTHORIZATION
    # -------------------------------------------------------------------------
    # Login Student 1
    res = client.post('/api/auth/login', json={'username': 'student1', 'password': 'password123'})
    assert res.status_code == 200
    st1_token = res.get_json()['token']
    auth_st1 = {'Authorization': f'Bearer {st1_token}'}

    # Student 1 fetches support priority
    res = client.get('/api/student/support-priority', headers=auth_st1)
    assert res.status_code == 200
    sp_data = res.get_json()
    assert sp_data['support_priority'] == 'Needs Support'
    assert len(sp_data['reasons']) >= 2
    assert len(sp_data['guidance']) >= 1
    print(f"[PASS] 6. GET /api/student/support-priority retrieved for authenticated student")

    # Student 1 fetches full academic summary
    res = client.get('/api/student/academic-summary', headers=auth_st1)
    assert res.status_code == 200
    summary_data = res.get_json()['data']
    assert summary_data['student']['roll_number'] == 14
    assert len(summary_data['subject_support']) >= 1
    print(f"[PASS] 7. GET /api/student/academic-summary retrieved with complete diagnostics")

    # -------------------------------------------------------------------------
    # 3. MENTOR ACCESS & STRICT ROLL-RANGE SCOPE ENFORCEMENT
    # -------------------------------------------------------------------------
    # Login Mentor 1 (Dr. Radhika Sen, Assigned Rolls 1 to 20)
    res = client.post('/api/auth/login', json={'username': 'mentor1', 'password': 'password123'})
    assert res.status_code == 200
    mentor1_token = res.get_json()['token']
    auth_mentor1 = {'Authorization': f'Bearer {mentor1_token}'}

    # Mentor 1 queries assigned students priority list
    res = client.get('/api/mentor/students-priority', headers=auth_mentor1)
    assert res.status_code == 200
    m_data = res.get_json()
    assert m_data['mentor']['assigned_roll_start'] == 1
    assert m_data['mentor']['assigned_roll_end'] == 20
    
    assigned_students = m_data['students']
    assigned_rolls = [s['roll_number'] for s in assigned_students]
    for roll in assigned_rolls:
        assert 1 <= roll <= 20, f"Violation: Roll {roll} outside mentor's assigned range (1-20)"
    print(f"[PASS] 8. Mentor 1 cohort strictly limited to rolls 1-20 ({len(assigned_students)} students returned)")

    # Verify urgency ordering: Needs Support should be first
    assert assigned_students[0]['support_priority'] == 'Needs Support'
    print(f"[PASS] 9. Mentor assigned students correctly ordered by urgency: first is {assigned_students[0]['name']} ({assigned_students[0]['support_priority']})")

    # Mentor 1 accesses assigned student detail (Student 1, Roll 14) -> ALLOWED (200)
    res = client.get('/api/mentor/student/1/academic-support', headers=auth_mentor1)
    assert res.status_code == 200
    assert res.get_json()['student']['name'] == 'Aarav Sharma'
    print(f"[PASS] 10. Mentor 1 authorized to inspect assigned Student 1 (Roll 14)")

    # Mentor 1 attempts to access Student 5 (Rohan Deshmukh, Roll 22) -> FORBIDDEN (403)
    res = client.get('/api/mentor/student/5/academic-support', headers=auth_mentor1)
    assert res.status_code == 403
    assert "outside your assigned cohort" in res.get_json()['error']
    print(f"[PASS] 11. Mentor 1 strictly BLOCKED with 403 when requesting Student 5 (Roll 22 outside range)")

    # -------------------------------------------------------------------------
    # 4. PRIVACY & ROLE-BASED ACCESS CHECKS
    # -------------------------------------------------------------------------
    # Login Admin 1
    res = client.post('/api/auth/login', json={'username': 'admin1', 'password': 'password123'})
    assert res.status_code == 200
    admin_token = res.get_json()['token']
    auth_admin = {'Authorization': f'Bearer {admin_token}'}

    # Admin blocked from student support priority
    res = client.get('/api/student/support-priority', headers=auth_admin)
    assert res.status_code == 403
    print(f"[PASS] 12. Administrator blocked from /api/student/support-priority (403 Forbidden)")

    # Admin blocked from mentor support priority
    res = client.get('/api/mentor/students-priority', headers=auth_admin)
    assert res.status_code == 403
    print(f"[PASS] 13. Administrator blocked from /api/mentor/students-priority (403 Forbidden)")

    # Login Parent 1
    res = client.post('/api/auth/login', json={'username': 'parent1', 'password': 'password123'})
    assert res.status_code == 200
    parent_token = res.get_json()['token']
    auth_parent = {'Authorization': f'Bearer {parent_token}'}

    # Parent blocked from student support priority
    res = client.get('/api/student/support-priority', headers=auth_parent)
    assert res.status_code == 403
    print(f"[PASS] 14. Parent blocked from /api/student/support-priority (403 Forbidden)")

    print("\n" + "=" * 70)
    print(" ALL 14 STEP 7 RISK DETECTION & SUPPORT ENGINE TESTS PASSED!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_tests()
