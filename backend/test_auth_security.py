#!/usr/bin/env python3
"""
Beyond Barriers - Security & Authorization Test Suite
Verifies:
1. Password hashing validation (no plaintext)
2. Login with valid & invalid credentials
3. Protected route authentication requirement (401)
4. Role-based authorization enforcement (403)
5. Student personal data isolation (Student A cannot access Student B)
6. Mentor assigned roll-number range boundary (inside vs outside range)
7. Parent 1-child link boundary (linked child vs other child)
8. Administrator privacy wall (blocked from student academic/disability data)
9. Session invalidation upon logout
"""

import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app import create_app

def run_security_tests():
    app = create_app()
    client = app.test_client()

    print("\n=======================================================")
    print(" BEYOND BARRIERS - STEP 3 SECURITY & RBAC TEST SUITE")
    print("=======================================================")

    # Test 1: Unauthenticated request to protected endpoint -> 401
    res = client.get('/api/auth/me')
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("[PASS] 1. Unauthenticated request to /api/auth/me rejected with 401")

    # Test 2: Invalid password login -> 401
    res = client.post('/api/auth/login', json={'username': 'student1', 'password': 'wrongpassword'})
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("[PASS] 2. Invalid password rejected with 401")

    # Test 3: Valid Student login
    res = client.post('/api/auth/login', json={'username': 'student1', 'password': 'password123'})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    student_data = res.get_json()
    student_token = student_data['token']
    assert student_token and len(student_token) == 64
    assert student_data['user']['role'] == 'student'
    assert student_data['user']['profile']['name'] == 'Aarav Sharma'
    assert 'password' not in student_data['user']
    assert 'password_hash' not in student_data['user']
    print(f"[PASS] 3. Student1 authenticated successfully (Token: {student_token[:8]}...)")

    # Test 4: Verify /me returns authenticated identity
    headers_student = {'Authorization': f'Bearer {student_token}'}
    res = client.get('/api/auth/me', headers=headers_student)
    assert res.status_code == 200
    me_data = res.get_json()
    assert me_data['authenticated'] is True
    assert me_data['username'] == 'student1'
    print("[PASS] 4. /api/auth/me accurately identifies user identity from session")

    # Test 5: Role authorization - Student access to student vs mentor route
    res = client.get('/api/auth/test/student', headers=headers_student)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    
    # Student attempting mentor route -> 403
    res = client.get('/api/auth/test/mentor', headers=headers_student)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # Student attempting admin route -> 403
    res = client.get('/api/auth/test/admin', headers=headers_student)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    print("[PASS] 5. Role restrictions enforced: Student blocked from mentor/admin endpoints (403)")

    # Test 6: Student Data Scope - Student 1 (Aarav, ID 1) accessing own data vs Student 2 (Priya, ID 2)
    res = client.get('/api/auth/test/student-data/1', headers=headers_student)
    assert res.status_code == 200, f"Expected 200 for own data, got {res.status_code}"
    print("       * Student 1 accessing Student 1 data -> ALLOW (200)")

    res = client.get('/api/auth/test/student-data/2', headers=headers_student)
    assert res.status_code == 403, f"Expected 403 for other student data, got {res.status_code}"
    print("       * Student 1 accessing Student 2 data -> DENIED (403)")
    print("[PASS] 6. Student data isolation strictly enforced on backend")

    # Test 7: Mentor Scope - Roll Range Enforcement
    res_mentor = client.post('/api/auth/login', json={'username': 'mentor1', 'password': 'password123'})
    assert res_mentor.status_code == 200
    mentor_token = res_mentor.get_json()['token']
    headers_mentor = {'Authorization': f'Bearer {mentor_token}'}

    # Mentor 1 has roll range 1 to 20
    # Roll 14 is Aarav (In range) -> ALLOW
    res = client.get('/api/auth/test/mentor-student/14', headers=headers_mentor)
    assert res.status_code == 200, f"Expected 200 for roll 14, got {res.status_code}"
    print("       * Mentor 1 (Range 1-20) requesting Roll 14 -> ALLOW (200)")

    # Roll 27 is Ananya (Range 21-40) -> DENY
    res = client.get('/api/auth/test/mentor-student/27', headers=headers_mentor)
    assert res.status_code == 403, f"Expected 403 for roll 27, got {res.status_code}"
    print("       * Mentor 1 (Range 1-20) requesting Roll 27 -> DENIED (403)")
    print("[PASS] 7. Mentor cohort roll-range boundary strictly enforced on backend")

    # Test 8: Parent Scope - 1-Child Link Enforcement
    res_parent = client.post('/api/auth/login', json={'username': 'parent1', 'password': 'password123'})
    assert res_parent.status_code == 200
    parent_token = res_parent.get_json()['token']
    headers_parent = {'Authorization': f'Bearer {parent_token}'}

    # Parent 1 is Sunita Sharma linked to Student 1 (Aarav)
    res = client.get('/api/auth/test/parent-child/1', headers=headers_parent)
    assert res.status_code == 200, f"Expected 200 for linked child, got {res.status_code}"
    print("       * Parent 1 requesting linked child (ID 1) -> ALLOW (200)")

    # Parent 1 requesting Student 2 (Priya) -> DENY
    res = client.get('/api/auth/test/parent-child/2', headers=headers_parent)
    assert res.status_code == 403, f"Expected 403 for unlinked child, got {res.status_code}"
    print("       * Parent 1 requesting unlinked child (ID 2) -> DENIED (403)")
    print("[PASS] 8. Parent single-child link strictly enforced on backend")

    # Test 9: Administrator Scope - Privacy Wall Enforcement
    res_admin = client.post('/api/auth/login', json={'username': 'admin1', 'password': 'password123'})
    assert res_admin.status_code == 200
    admin_token = res_admin.get_json()['token']
    headers_admin = {'Authorization': f'Bearer {admin_token}'}

    # Admin accessing admin test route -> ALLOW
    res = client.get('/api/auth/test/admin', headers=headers_admin)
    assert res.status_code == 200, f"Expected 200 for admin, got {res.status_code}"
    print("       * Administrator accessing scholarship admin route -> ALLOW (200)")

    # Admin attempting to access student academic/medical data -> DENIED
    res = client.get('/api/auth/test/admin-private-data', headers=headers_admin)
    assert res.status_code == 403, f"Expected 403 for admin accessing private data, got {res.status_code}"
    print("       * Administrator attempting to access student private data -> DENIED (403)")
    print("[PASS] 9. Administrator privacy wall strictly enforced")

    # Test 10: Logout & Session Invalidation
    res = client.post('/api/auth/logout', headers=headers_student)
    assert res.status_code == 200
    print("[PASS] 10. Logout successfully processed")

    # Attempting to reuse invalidated student token -> 401
    res = client.get('/api/auth/me', headers=headers_student)
    assert res.status_code == 401, f"Expected 401 after logout, got {res.status_code}"
    print("[PASS] 11. Invalidated token permanently rejected with 401")

    print("\n=======================================================")
    print(" ALL 11 SECURITY & RBAC TEST CASES PASSED SUCCESSFULLY")
    print("=======================================================\n")

if __name__ == '__main__':
    run_security_tests()
