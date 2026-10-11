#!/usr/bin/env python3
"""
Test suite for Step 6 Backend API Endpoints:
- Attendance & Marks
- Matched Scholarships
- Career Guidance Roadmaps
- Accessibility Preferences
"""
import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app import create_app

from backend.database.db import init_db

def run_tests():
    app = create_app()
    init_db(app, reset=True)
    client = app.test_client()

    print("\n" + "=" * 65)
    print(" BEYOND BARRIERS - STEP 6 ACCESSIBILITY & DATA ENDPOINTS TESTS")
    print("=" * 65)

    # 1. Unauthenticated checks
    res = client.get('/api/student/attendance')
    assert res.status_code == 401
    print("[PASS] 1. Unauthenticated request to /api/student/attendance rejected (401)")

    # 2. Authenticate Student 1 (Aarav) and Mentor 1
    res = client.post('/api/auth/login', json={'username': 'student1', 'password': 'password123'})
    assert res.status_code == 200
    st1_token = res.get_json()['token']
    auth_st1 = {'Authorization': f'Bearer {st1_token}'}

    res = client.post('/api/auth/login', json={'username': 'mentor1', 'password': 'password123'})
    assert res.status_code == 200
    mentor_token = res.get_json()['token']
    auth_mentor = {'Authorization': f'Bearer {mentor_token}'}

    # Mentor blocked
    res = client.get('/api/student/attendance', headers=auth_mentor)
    assert res.status_code == 403
    print("[PASS] 2. Non-student role blocked from student endpoints (403)")

    # 3. GET /api/student/attendance for Student 1
    res = client.get('/api/student/attendance', headers=auth_st1)
    assert res.status_code == 200
    att_data = res.get_json()
    assert att_data['status'] == 'ok'
    assert len(att_data['attendance']) >= 2 # Math and Science
    assert len(att_data['marks']) >= 1
    assert att_data['overall_percentage'] > 0
    print(f"[PASS] 3. Attendance retrieved: overall {att_data['overall_percentage']}% ({len(att_data['attendance'])} subjects, {len(att_data['marks'])} marks records)")

    # 4. GET /api/student/scholarships for Student 1
    res = client.get('/api/student/scholarships', headers=auth_st1)
    assert res.status_code == 200
    sch_data = res.get_json()
    assert sch_data['status'] == 'ok'
    assert sch_data['count'] > 0
    print(f"[PASS] 4. Scholarships retrieved: {sch_data['count']} matched scholarships found for Class 10")

    # 5. GET /api/student/career for Student 1 (Interest: Artificial Intelligence)
    res = client.get('/api/student/career', headers=auth_st1)
    assert res.status_code == 200
    career_data = res.get_json()
    assert career_data['status'] == 'ok'
    assert len(career_data['steps']) >= 2
    assert career_data['role']['title'] != ''
    print(f"[PASS] 5. Career roadmap retrieved: {career_data['role']['title']} ({len(career_data['steps'])} roadmap steps)")

    # 6. GET & PUT /api/student/accessibility
    res = client.get('/api/student/accessibility', headers=auth_st1)
    assert res.status_code == 200
    acc_orig = res.get_json()['accessibility']

    res = client.put('/api/student/accessibility', json={
        'preferred_response_format': 'audio',
        'preferred_language': 'en'
    }, headers=auth_st1)
    assert res.status_code == 200
    acc_updated = res.get_json()['accessibility']
    assert acc_updated['preferred_response_format'] == 'audio'

    # Restore
    client.put('/api/student/accessibility', json={
        'preferred_response_format': acc_orig['preferred_response_format'],
        'preferred_language': acc_orig['preferred_language']
    }, headers=auth_st1)
    print("[PASS] 6. Accessibility preferences GET and PUT validated successfully")

    print("\n" + "=" * 65)
    print(" ALL STEP 6 BACKEND DATA ENDPOINTS PASSED SUCCESSFULLY!")
    print("=" * 65 + "\n")

if __name__ == '__main__':
    run_tests()
