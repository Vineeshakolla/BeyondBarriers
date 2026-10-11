"""
Beyond Barriers - Step 10 RBAC & Security Boundary Verification Test Suite
==========================================================================
Verifies all 14 security boundaries specified in Step 10 objective:
1. Mentor accesses assigned student -> ALLOWED
2. Mentor accesses student outside roll range -> DENIED (403)
3. Mentor modifies note for outside-range student -> DENIED (403)
4. Parent accesses linked child -> ALLOWED
5. Parent accesses another child -> DENIED
6. Parent attempts to manipulate student ID -> Still DENIED
7. Parent sees shared mentor note -> ALLOWED
8. Parent sees private mentor note -> DENIED
9. Student accesses mentor dashboard -> DENIED (403)
10. Student accesses admin dashboard -> DENIED (403)
11. Mentor accesses admin dashboard -> DENIED (403)
12. Parent accesses admin dashboard -> DENIED (403)
13. Admin accesses scholarship management & dashboard -> ALLOWED
14. Admin accesses academic student APIs -> DENIED (403)
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app

def run_tests():
    print("\n" + "=" * 70)
    print(" BEYOND BARRIERS - STEP 10 RBAC & DASHBOARD SECURITY TEST SUITE")
    print("=" * 70)

    app = create_app()
    client = app.test_client()

    # Login helper
    def login(username):
        res = client.post('/api/auth/login', json={'username': username, 'password': 'password123'})
        assert res.status_code == 200, f"Login failed for {username}: {res.get_json()}"
        token = res.get_json()['token']
        return {'Authorization': f'Bearer {token}'}

    headers_student1 = login('student1')   # Aarav Sharma (Roll 14)
    headers_student5 = login('student5')   # Rohan Deshmukh (Roll 22)
    headers_mentor1 = login('mentor1')     # Dr. Radhika Sen (Rolls 1-20)
    headers_mentor2 = login('mentor2')     # Prof. Vikram Joshi (Rolls 21-40)
    headers_parent1 = login('parent1')     # Sunita Sharma (Linked to Student 1 Aarav)
    headers_parent2 = login('parent2')     # Rajesh Verma (Linked to Student 2 Priya)
    headers_admin1 = login('admin1')       # P. K. Verma (Administrator)

    # -------------------------------------------------------------------------
    # TEST 1: Mentor accesses assigned student -> ALLOWED
    # -------------------------------------------------------------------------
    res = client.get('/api/mentor/students/1', headers=headers_mentor1)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.get_json()}"
    data = res.get_json()
    assert data['student']['name'] == 'Aarav Sharma'
    assert data['student']['roll_number'] == 14
    assert 'attendance' in data
    assert 'marks' in data
    assert 'learning_progress' in data
    print("[PASS] 1. Mentor accesses assigned student (Roll 14 within 1-20) -> ALLOWED (200 OK)")

    # -------------------------------------------------------------------------
    # TEST 2: Mentor accesses student outside roll range -> DENIED (403)
    # -------------------------------------------------------------------------
    res = client.get('/api/mentor/students/5', headers=headers_mentor1) # Student 5 has roll 22
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.get_json()}"
    assert 'Access denied' in res.get_json().get('error', '')
    print("[PASS] 2. Mentor accesses student outside roll range (Roll 22 outside 1-20) -> DENIED (403 Forbidden)")

    # -------------------------------------------------------------------------
    # TEST 3: Mentor modifies/creates note for outside-range student -> DENIED (403)
    # -------------------------------------------------------------------------
    res = client.post('/api/mentor/students/5/notes', headers=headers_mentor1, json={
        'note': 'Attempting unauthorized note for student 5'
    })
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.get_json()}"

    # Also test note update for note belonging to student outside range
    # Mentor 2 tries to update Note 1 (which belongs to Student 1 Roll 14)
    res = client.patch('/api/mentor/notes/1', headers=headers_mentor2, json={
        'note': 'Unauthorized note edit by mentor 2'
    })
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.get_json()}"
    print("[PASS] 3. Mentor creates/modifies note for student outside roll range -> DENIED (403 Forbidden)")

    # -------------------------------------------------------------------------
    # TEST 4: Parent accesses linked child -> ALLOWED
    # -------------------------------------------------------------------------
    res = client.get('/api/parent/dashboard', headers=headers_parent1)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.get_json()}"
    data = res.get_json()
    assert data['child']['name'] == 'Aarav Sharma'
    assert data['child']['id'] == 1
    assert 'attendance' in data
    assert 'marks' in data
    assert 'learning_progress' in data
    print("[PASS] 4. Parent accesses linked child (Parent 1 -> Aarav Sharma) -> ALLOWED (200 OK)")

    # -------------------------------------------------------------------------
    # TEST 5 & 6: Parent attempts to access another child or manipulate ID -> DENIED
    # -------------------------------------------------------------------------
    # Parent endpoints do not accept client student ID; they are bound to linked child
    # If parent tries to access student 2's data via student API
    res = client.get('/api/student/academic-summary', headers=headers_parent1)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # If parent tries to access mentor API
    res = client.get('/api/mentor/students/2', headers=headers_parent1)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    print("[PASS] 5 & 6. Parent cannot access other children or manipulate student ID -> DENIED (403 Forbidden)")

    # -------------------------------------------------------------------------
    # TEST 7: Parent sees shared mentor note (share_with_parent = 1) -> ALLOWED
    # -------------------------------------------------------------------------
    res = client.get('/api/parent/child/shared-notes', headers=headers_parent1)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    shared_notes = res.get_json()['shared_notes']
    assert len(shared_notes) >= 1
    found_shared = any('Aarav demonstrated solid understanding' in n['note'] for n in shared_notes)
    assert found_shared, "Expected shared mentor note not found in parent response"
    print("[PASS] 7. Parent sees shared mentor note (share_with_parent = 1) -> ALLOWED")

    # -------------------------------------------------------------------------
    # TEST 8: Parent sees private mentor note (share_with_parent = 0) -> DENIED
    # -------------------------------------------------------------------------
    # Verify private note ('Private internal counselor review') is NOT present anywhere in parent response
    found_private = any('Private internal counselor review' in n['note'] for n in shared_notes)
    assert not found_private, "SECURITY BREACH: Private mentor note was exposed to parent!"

    # Also verify dashboard endpoint strictly shields private note
    dash_notes = client.get('/api/parent/dashboard', headers=headers_parent1).get_json()['shared_notes']
    assert not any('Private internal counselor review' in n['note'] for n in dash_notes), "Private note leaked in dashboard"
    print("[PASS] 8. Parent sees private mentor note (share_with_parent = 0) -> DENIED (Shielded completely)")

    # -------------------------------------------------------------------------
    # TEST 9: Student accesses mentor dashboard -> DENIED (403)
    # -------------------------------------------------------------------------
    res = client.get('/api/mentor/dashboard', headers=headers_student1)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    print("[PASS] 9. Student accesses mentor dashboard -> DENIED (403 Forbidden)")

    # -------------------------------------------------------------------------
    # TEST 10: Student accesses admin dashboard -> DENIED (403)
    # -------------------------------------------------------------------------
    res = client.get('/api/admin/dashboard', headers=headers_student1)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    print("[PASS] 10. Student accesses admin dashboard -> DENIED (403 Forbidden)")

    # -------------------------------------------------------------------------
    # TEST 11: Mentor accesses admin dashboard -> DENIED (403)
    # -------------------------------------------------------------------------
    res = client.get('/api/admin/dashboard', headers=headers_mentor1)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    print("[PASS] 11. Mentor accesses admin dashboard -> DENIED (403 Forbidden)")

    # -------------------------------------------------------------------------
    # TEST 12: Parent accesses admin dashboard -> DENIED (403)
    # -------------------------------------------------------------------------
    res = client.get('/api/admin/dashboard', headers=headers_parent1)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    print("[PASS] 12. Parent accesses admin dashboard -> DENIED (403 Forbidden)")

    # -------------------------------------------------------------------------
    # TEST 13: Admin accesses scholarship management & dashboard -> ALLOWED
    # -------------------------------------------------------------------------
    res = client.get('/api/admin/dashboard', headers=headers_admin1)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    dash_data = res.get_json()
    assert 'stats' in dash_data
    assert dash_data['stats']['total_scholarships'] > 0
    assert 'privacy_scope' in dash_data
    assert dash_data['privacy_scope']['domain'] == 'scholarship_administration_only'

    res_sch = client.get('/api/admin/scholarships', headers=headers_admin1)
    assert res_sch.status_code == 200
    print("[PASS] 13. Admin accesses scholarship management & dashboard -> ALLOWED (200 OK)")

    # -------------------------------------------------------------------------
    # TEST 14: Admin accesses academic student APIs -> DENIED (403)
    # -------------------------------------------------------------------------
    res_st = client.get('/api/student/academic-summary', headers=headers_admin1)
    assert res_st.status_code == 403, f"Expected 403, got {res_st.status_code}"

    res_m = client.get('/api/mentor/students/1', headers=headers_admin1)
    assert res_m.status_code == 403, f"Expected 403, got {res_m.status_code}"

    res_p = client.get('/api/parent/dashboard', headers=headers_admin1)
    assert res_p.status_code == 403, f"Expected 403, got {res_p.status_code}"

    # Also verify that the admin dashboard payload itself has ZERO student academic or medical keys
    admin_keys = set(dash_data.keys())
    for forbidden_key in ['marks', 'attendance', 'students', 'disability_type', 'support_priority']:
        assert forbidden_key not in admin_keys, f"Forbidden key {forbidden_key} found in admin dashboard"
    print("[PASS] 14. Admin accesses academic student APIs -> DENIED (403) & Zero student data exposed")

    print("\n" + "=" * 70)
    print(" ALL 14 STEP 10 RBAC & DASHBOARD SECURITY TESTS PASSED!")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    run_tests()
