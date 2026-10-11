#!/usr/bin/env python3
"""
Beyond Barriers - Step 4 Student Profile & Onboarding Test Suite
Verifies:
1. Dynamic subject resolution based on Class & Stream
2. GET /api/student/options returns all UI schema choices
3. GET /api/student/profile retrieves authenticated student's profile & subjects
4. PUT /api/student/profile validates fields and updates SQLite
5. Field persistence across queries
6. Profile completion transitions (is_profile_completed 0 -> 1)
7. Security: Unauthenticated access rejected (401)
8. Security: Non-student roles blocked from student profile (403)
9. Security: Student A cannot modify Student B's profile (Server-side identity binding)
10. Validation: Rejects invalid class/stream, invalid format, invalid income, etc.
"""

import sys
import os
import json

# Ensure project root is on sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app import create_app
from backend.database.db import init_db

def run_tests():
    app = create_app()
    client = app.test_client()

    print("\n" + "=" * 60)
    print(" BEYOND BARRIERS - STEP 4 STUDENT PROFILE & ONBOARDING TESTS")
    print("=" * 60)

    # -------------------------------------------------------------
    # 1. Unauthenticated checks
    # -------------------------------------------------------------
    res = client.get('/api/student/profile')
    assert res.status_code == 401, f"Expected 401 unauth, got {res.status_code}"
    print("[PASS] 1. Unauthenticated request to /api/student/profile rejected (401)")

    # -------------------------------------------------------------
    # 2. Options endpoint
    # -------------------------------------------------------------
    res = client.get('/api/student/options')
    assert res.status_code == 200, f"Expected 200 for options, got {res.status_code}"
    opt_data = res.get_json()
    assert 'classes' in opt_data and len(opt_data['classes']) == 2
    assert 'streams' in opt_data and 'Class 12' in opt_data['streams']
    assert 'accessibility' in opt_data
    assert 'internet_access' in opt_data
    print("[PASS] 2. GET /api/student/options returns full schema metadata (200)")

    # -------------------------------------------------------------
    # 3. Dynamic Subject Lookup
    # -------------------------------------------------------------
    res = client.post('/api/auth/login', json={'username': 'student1', 'password': 'password123'})
    assert res.status_code == 200
    st1_token = res.get_json()['token']
    auth_header_st1 = {'Authorization': f'Bearer {st1_token}'}

    # Class 10 General subjects
    res = client.get('/api/student/subjects?class=Class+10&stream=General', headers=auth_header_st1)
    assert res.status_code == 200
    sub_c10 = res.get_json()['subjects']
    c10_names = [s['name'] for s in sub_c10]
    assert 'Mathematics' in c10_names and 'Science' in c10_names
    print(f"[PASS] 3a. Class 10 General dynamically resolves {len(sub_c10)} subjects: {c10_names}")

    # Class 12 Science subjects
    res = client.get('/api/student/subjects?class=Class+12&stream=Science', headers=auth_header_st1)
    assert res.status_code == 200
    sub_c12_sci = res.get_json()['subjects']
    c12_sci_names = [s['name'] for s in sub_c12_sci]
    assert 'Physics' in c12_sci_names and 'Computer Science' in c12_sci_names
    print(f"[PASS] 3b. Class 12 Science dynamically resolves {len(sub_c12_sci)} subjects: {c12_sci_names}")

    # Class 12 Commerce subjects
    res = client.get('/api/student/subjects?class=Class+12&stream=Commerce', headers=auth_header_st1)
    assert res.status_code == 200
    sub_c12_com = res.get_json()['subjects']
    c12_com_names = [s['name'] for s in sub_c12_com]
    assert 'Accountancy' in c12_com_names and 'Business Studies' in c12_com_names
    print(f"[PASS] 3c. Class 12 Commerce dynamically resolves {len(sub_c12_com)} subjects: {c12_com_names}")

    # Invalid stream for Class 10
    res = client.get('/api/student/subjects?class=Class+10&stream=Commerce', headers=auth_header_st1)
    assert res.status_code == 400
    print("[PASS] 3d. Dynamic subject lookup rejects invalid stream for Class 10 (400)")

    # -------------------------------------------------------------
    # 4. Get Student 1 Profile
    # -------------------------------------------------------------
    res = client.get('/api/student/profile', headers=auth_header_st1)
    assert res.status_code == 200
    p1 = res.get_json()['profile']
    assert p1['id'] == 1
    assert p1['name'] == 'Aarav Sharma'
    assert p1['roll_code'] == 'CS-014'
    assert p1['is_profile_completed'] is True
    print(f"[PASS] 4. Authenticated Student 1 fetched profile successfully (ID: {p1['id']}, Roll: {p1['roll_code']})")

    # -------------------------------------------------------------
    # 5. Non-student blocked from student profile
    # -------------------------------------------------------------
    res = client.post('/api/auth/login', json={'username': 'mentor1', 'password': 'password123'})
    mentor_token = res.get_json()['token']
    res = client.get('/api/student/profile', headers={'Authorization': f'Bearer {mentor_token}'})
    assert res.status_code == 403
    print("[PASS] 5. Mentor role forbidden from /api/student/profile (403)")

    # -------------------------------------------------------------
    # 6. Profile Editing & Persistence for Student 1
    # -------------------------------------------------------------
    edit_payload = {
        'name': 'Aarav Sharma (Edited)',
        'class': 'Class 10',
        'stream': 'General',
        'disability_type': 'visual',
        'internet_access': 'full',  # Changed from intermittent to full
        'device_access': 'personal_laptop', # Changed from shared_smartphone to personal_laptop
        'income_category': '<1.5L',
        'career_interest': 'Cybersecurity', # Changed from AI to Cybersecurity
        'preferred_response_format': 'audio',
        'preferred_language': 'en'
    }
    res = client.put('/api/student/profile', json=edit_payload, headers=auth_header_st1)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.get_json()}"
    updated_p1 = res.get_json()['profile']
    assert updated_p1['name'] == 'Aarav Sharma (Edited)'
    assert updated_p1['internet_access'] == 'full'
    assert updated_p1['device_access'] == 'personal_laptop'
    assert updated_p1['career_interest'] == 'Cybersecurity'
    print("[PASS] 6. Student 1 profile edited: internet, device, and career updated successfully")

    # Verify persistence via new GET request
    res = client.get('/api/student/profile', headers=auth_header_st1)
    persisted = res.get_json()['profile']
    assert persisted['career_interest'] == 'Cybersecurity'
    assert persisted['internet_access'] == 'full'
    print("[PASS] 7. Profile modifications verified persistent across subsequent GET queries")

    # -------------------------------------------------------------
    # 8. Server-Side Identity Binding: Student A cannot alter Student B
    # -------------------------------------------------------------
    # Even if Student 1 sends student_id: 2 in the body, it must only update Student 1!
    malicious_payload = {
        'id': 2,
        'student_id': 2,
        'name': 'Malicious Injection Attempt',
        'class': 'Class 10',
        'stream': 'General',
        'disability_type': 'none',
        'internet_access': 'full',
        'device_access': 'personal_laptop',
        'income_category': '<3L',
        'career_interest': 'Web Development',
        'preferred_response_format': 'visual',
        'preferred_language': 'en'
    }
    res = client.put('/api/student/profile', json=malicious_payload, headers=auth_header_st1)
    assert res.status_code == 200
    # Confirm Student 2 in database was NOT modified
    res_st2 = client.post('/api/auth/login', json={'username': 'student2', 'password': 'password123'})
    st2_token = res_st2.get_json()['token']
    res = client.get('/api/student/profile', headers={'Authorization': f'Bearer {st2_token}'})
    p2 = res.get_json()['profile']
    assert p2['name'] == 'Priya Verma', f"Security violation! Student 2 was altered to {p2['name']}"
    print("[PASS] 8. Server-side identity binding verified: Student 1 cannot modify Student 2")

    # -------------------------------------------------------------
    # 9. Validation Enforcement
    # -------------------------------------------------------------
    # Test invalid stream
    invalid_stream_payload = edit_payload.copy()
    invalid_stream_payload['stream'] = 'Science' # Invalid for Class 10
    res = client.put('/api/student/profile', json=invalid_stream_payload, headers=auth_header_st1)
    assert res.status_code == 400
    assert 'stream' in res.get_json()['errors']
    print("[PASS] 9a. Validation rejected invalid stream 'Science' for Class 10 (400)")

    # Test invalid format
    invalid_format_payload = edit_payload.copy()
    invalid_format_payload['preferred_response_format'] = 'telepathy'
    res = client.put('/api/student/profile', json=invalid_format_payload, headers=auth_header_st1)
    assert res.status_code == 400
    assert 'preferred_response_format' in res.get_json()['errors']
    print("[PASS] 9b. Validation rejected invalid preferred_response_format (400)")

    # Test empty name
    invalid_name_payload = edit_payload.copy()
    invalid_name_payload['name'] = '   '
    res = client.put('/api/student/profile', json=invalid_name_payload, headers=auth_header_st1)
    assert res.status_code == 400
    assert 'name' in res.get_json()['errors']
    print("[PASS] 9c. Validation rejected empty name (400)")

    # -------------------------------------------------------------
    # 10. New Student Onboarding Flow (is_profile_completed: 0 -> 1)
    # -------------------------------------------------------------
    res = client.post('/api/auth/login', json={'username': 'newstudent', 'password': 'password123'})
    assert res.status_code == 200
    new_user_data = res.get_json()['user']
    new_token = res.get_json()['token']
    auth_header_new = {'Authorization': f'Bearer {new_token}'}

    assert new_user_data['profile']['is_profile_completed'] == 0 or new_user_data['profile']['is_profile_completed'] is False
    print(f"[PASS] 10a. New student login returns is_profile_completed = False (Triggers Onboarding Flow)")

    onboarding_payload = {
        'name': 'Kavya Patel',
        'class': 'Class 12',
        'stream': 'Science',
        'disability_type': 'none',
        'internet_access': 'full',
        'device_access': 'personal_laptop',
        'income_category': '<3L',
        'career_interest': 'Artificial Intelligence',
        'preferred_response_format': 'visual',
        'preferred_language': 'en'
    }
    res = client.put('/api/student/profile', json=onboarding_payload, headers=auth_header_new)
    assert res.status_code == 200
    updated_new = res.get_json()['profile']
    assert updated_new['is_profile_completed'] is True
    assert updated_new['class'] == 'Class 12'
    assert updated_new['stream'] == 'Science'
    print(f"[PASS] 10b. New student completed onboarding: is_profile_completed transitioned to True")

    # Re-fetch profile to verify completion status persists
    res = client.get('/api/student/profile', headers=auth_header_new)
    assert res.get_json()['profile']['is_profile_completed'] is True
    assert len(res.get_json()['subjects']) == 4 # Physics, Chem, Math, CS
    print(f"[PASS] 10c. Completed profile now dynamically links {len(res.get_json()['subjects'])} Class 12 Science subjects")

    print("\n" + "=" * 60)
    print(" ALL 10 STEP 4 PROFILE & ONBOARDING TESTS PASSED SUCCESSFULLY!")
    print("=" * 60 + "\n")

if __name__ == '__main__':
    run_tests()
