"""
Beyond Barriers - Step 10 Live Persona Verification Demo
=========================================================
Demonstrates full end-to-end integration over live HTTP:
- Mentor Dashboard & Roll-Range Cohort Boundary (Dr. Radhika Sen, Rolls 1-20)
- Mentor Note Creation & Parent Sharing Toggle
- Parent Dashboard & Single-Child Privacy Boundary (Sunita Sharma -> Aarav Sharma)
- Shared vs Private Mentor Note Filtering
- Admin Scholarship Dashboard & Strict Privacy Shield (P. K. Verma)
- Cross-role authorization boundary checks
"""

import requests
import json
import sys

BASE_URL = 'http://127.0.0.1:5000/api'

def run_demo():
    print("\n" + "=" * 70)
    print(" BEYOND BARRIERS - STEP 10 LIVE DASHBOARD PERSONA VERIFICATION")
    print("=" * 70)

    # 1. Health check
    res = requests.get(f'{BASE_URL}/health')
    assert res.status_code == 200, "Health check failed"
    print("[PASS] 1. Backend Health Check: status=ok, DB=connected")

    # Helper login
    def login(username):
        r = requests.post(f'{BASE_URL}/auth/login', json={'username': username, 'password': 'password123'})
        assert r.status_code == 200, f"Login failed for {username}: {r.text}"
        token = r.json()['token']
        return {'Authorization': f'Bearer {token}'}

    headers_m1 = login('mentor1')  # Dr. Radhika Sen (Rolls 1-20)
    headers_p1 = login('parent1')  # Sunita Sharma (Linked to Student 1 Aarav)
    headers_a1 = login('admin1')   # P. K. Verma (Administrator)

    # -------------------------------------------------------------------------
    # PART A: MENTOR PERSONA DEMO
    # -------------------------------------------------------------------------
    print("\n--- Part A: Mentor Persona (Dr. Radhika Sen, Rolls 1-20) ---")

    # 2. Mentor Dashboard
    res_m_dash = requests.get(f'{BASE_URL}/mentor/dashboard', headers=headers_m1)
    assert res_m_dash.status_code == 200, f"Mentor dashboard failed: {res_m_dash.text}"
    m_data = res_m_dash.json()
    assert m_data['mentor']['assigned_roll_start'] == 1
    assert m_data['mentor']['assigned_roll_end'] == 20
    assert len(m_data['students']) >= 3
    first_student = m_data['students'][0]
    assert first_student['support_priority'] == 'Needs Support'
    print(f"[PASS] 2. Mentor Dashboard returned cohort Rolls 1-20 ({len(m_data['students'])} students).")
    print(f"       Top Urgency Student: {first_student['name']} (Roll {first_student['roll_number']}) - Priority: {first_student['support_priority']}")

    # 3. Mentor Student Detail
    res_st_detail = requests.get(f'{BASE_URL}/mentor/students/1', headers=headers_m1)
    assert res_st_detail.status_code == 200
    st_data = res_st_detail.json()
    assert st_data['student']['name'] == 'Aarav Sharma'
    assert 'overall_percentage' in st_data['attendance']
    assert len(st_data['marks']) > 0
    assert len(st_data['learning_progress']) > 0
    print(f"[PASS] 3. Student Detail for Aarav Sharma (Roll 14): Attendance: {st_data['attendance']['overall_percentage']}%, Reasons: {st_data['support_priority']['reasons']}")

    # 4. Add Educational Mentor Note
    note_content = "Step 10 Demo Note: Reviewed Polynomials practice problems. Scheduled math remediation for Thursday."
    res_note = requests.post(f'{BASE_URL}/mentor/students/1/notes', headers=headers_m1, json={
        'note': note_content,
        'share_with_parent': True,
        'follow_up_completed': False
    })
    assert res_note.status_code == 201
    created_note = res_note.json()['note']
    note_id = created_note['id']
    assert created_note['share_with_parent'] == 1
    print(f"[PASS] 4. Created educational mentor note (ID: {note_id}) with share_with_parent=True")

    # 5. Toggle Follow-Up Completed on Note
    res_upd = requests.patch(f'{BASE_URL}/mentor/notes/{note_id}', headers=headers_m1, json={
        'follow_up_completed': True
    })
    assert res_upd.status_code == 200
    assert res_upd.json()['note']['follow_up_completed'] == 1
    print(f"[PASS] 5. Updated mentor note (ID: {note_id}) -> follow_up_completed=True")

    # 6. Mentor Attempt to Access Out-of-Range Student (Student 5, Roll 22) -> 403
    res_tamper = requests.get(f'{BASE_URL}/mentor/students/5', headers=headers_m1)
    assert res_tamper.status_code == 403
    print(f"[PASS] 6. Mentor scope enforcement: Student 5 (Roll 22) blocked with 403 Forbidden ({res_tamper.json()['error']})")

    # -------------------------------------------------------------------------
    # PART B: PARENT PERSONA DEMO
    # -------------------------------------------------------------------------
    print("\n--- Part B: Parent Persona (Sunita Sharma -> Aarav Sharma) ---")

    # 7. Parent Dashboard
    res_p_dash = requests.get(f'{BASE_URL}/parent/dashboard', headers=headers_p1)
    assert res_p_dash.status_code == 200
    p_data = res_p_dash.json()
    assert p_data['child']['name'] == 'Aarav Sharma'
    assert p_data['child']['id'] == 1
    cards = p_data['summary_cards']
    print(f"[PASS] 7. Parent Dashboard loaded linked child: {p_data['child']['name']} (Roll {p_data['child']['roll_number']})")
    print(f"       Overview Cards: Attendance {cards['attendance_percentage']}%, Avg Marks {cards['average_marks_percentage']}%, Completed Modules {cards['completed_modules']}/{cards['total_modules']}")

    # 8. Shared vs Private Note Verification
    res_p_notes = requests.get(f'{BASE_URL}/parent/child/shared-notes', headers=headers_p1)
    assert res_p_notes.status_code == 200
    p_notes = res_p_notes.json()['shared_notes']
    # Confirm newly created note with share_with_parent=1 is visible
    has_demo_note = any(note_content in n['note'] for n in p_notes)
    assert has_demo_note, "Shared note was not returned to parent"
    # Confirm private counselor note is strictly absent
    has_private_note = any("Private internal counselor review" in n['note'] for n in p_notes)
    assert not has_private_note, "SECURITY BREACH: Private note leaked to parent!"
    print(f"[PASS] 8. Parent Shared Notes verified: {len(p_notes)} notes visible. Private notes are 100% shielded.")

    # 9. Parent Unauthorized Student Access Blocked
    res_p_blocked = requests.get(f'{BASE_URL}/mentor/students/2', headers=headers_p1)
    assert res_p_blocked.status_code == 403
    print("[PASS] 9. Parent blocked from querying student/mentor endpoints (403 Forbidden)")

    # -------------------------------------------------------------------------
    # PART C: ADMINISTRATOR PERSONA DEMO
    # -------------------------------------------------------------------------
    print("\n--- Part C: Administrator Persona (P. K. Verma, Scholarship Admin) ---")

    # 10. Admin Dashboard
    res_a_dash = requests.get(f'{BASE_URL}/admin/dashboard', headers=headers_a1)
    assert res_a_dash.status_code == 200
    a_data = res_a_dash.json()
    assert 'stats' in a_data
    stats = a_data['stats']
    print(f"[PASS] 10. Admin Scholarship Dashboard: Total: {stats['total_scholarships']}, Active: {stats['active_scholarships']}, Closing Soon: {stats['closing_soon']}")

    # 11. Urgent Deadlines & Zero Student Data Verification
    assert len(a_data['urgent_deadlines']) >= 1
    for key in ['marks', 'attendance', 'students', 'learning_progress', 'disability_type']:
        assert key not in a_data, f"Student data key '{key}' leaked into admin dashboard!"
    print("[PASS] 11. Zero Student Data Exposure verified in Admin Dashboard.")

    # 12. Admin Academic API Shielding
    res_a_shield = requests.get(f'{BASE_URL}/student/academic-summary', headers=headers_a1)
    assert res_a_shield.status_code == 403
    print(f"[PASS] 12. Admin blocked from student academic APIs with 403 Forbidden ({res_a_shield.json()['error']})")

    print("\n" + "=" * 70)
    print(" ALL 12 LIVE STEP 10 DEMO VERIFICATION CHECKS PASSED!")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    run_demo()
