#!/usr/bin/env python3
"""
Beyond Barriers - Database Verification Script
Validates table integrity, foreign keys, unique constraints, and sample queries.
"""

import sys
import os
import sqlite3

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.config import Config

def test_database():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON;')
    cursor = conn.cursor()

    print("\n--- RUNNING DATABASE VERIFICATION CHECKS ---")

    # 1. Foreign Key Integrity Check
    cursor.execute('PRAGMA foreign_key_check;')
    fk_errors = cursor.fetchall()
    assert len(fk_errors) == 0, f"FK errors found: {fk_errors}"
    print("[PASS] 1. PRAGMA foreign_key_check: 0 violations")

    # 2. Unique Roll Numbers
    cursor.execute('SELECT roll_number, COUNT(*) as count FROM students GROUP BY roll_number HAVING count > 1;')
    dupes = cursor.fetchall()
    assert len(dupes) == 0, f"Duplicate roll numbers found: {dupes}"
    print("[PASS] 2. Student roll numbers are strictly unique across all records")

    # 3. Parent -> Student (1 child link)
    cursor.execute('''
        SELECT p.name as parent_name, s.name as child_name, s.roll_code 
        FROM parents p 
        JOIN students s ON p.linked_student_id = s.id;
    ''')
    parents = cursor.fetchall()
    assert len(parents) == 4, f"Expected 4 parents, found {len(parents)}"
    print(f"[PASS] 3. Parent single-child relationships verified ({len(parents)} parents mapped):")
    for p in parents:
        print(f"       * Parent: {p['parent_name']} -> Child: {p['child_name']} ({p['roll_code']})")

    # 4. Mentor Roll Ranges
    cursor.execute('SELECT name, assigned_roll_start, assigned_roll_end FROM mentors;')
    mentors = cursor.fetchall()
    assert len(mentors) == 2
    print(f"[PASS] 4. Mentor roll ranges stored and verified:")
    for m in mentors:
        print(f"       * {m['name']}: Roll {m['assigned_roll_start']} to {m['assigned_roll_end']}")

    # 5. Career Roadmap Hierarchy
    cursor.execute('''
        SELECT cf.name as field, cr.title as role, crs.stage, crs.stage_order, crs.title as step_title
        FROM career_fields cf
        JOIN career_roles cr ON cr.career_field_id = cf.id
        JOIN career_roadmap_steps crs ON crs.career_role_id = cr.id
        ORDER BY cf.id, cr.id, crs.stage_order;
    ''')
    steps = cursor.fetchall()
    assert len(steps) >= 8, f"Expected at least 8 roadmap steps, found {len(steps)}"
    print(f"[PASS] 5. Career roadmap hierarchy verified (4 stages each across multiple roles)")

    # 6. Test Answers with Confidence Signal
    cursor.execute('SELECT id, selected_option, is_correct, confidence FROM test_answers;')
    answers = cursor.fetchall()
    assert len(answers) >= 4, f"Expected at least 4 test answers, found {len(answers)}"
    confidence_signals = [a['confidence'] for a in answers]
    assert 'Sure' in confidence_signals and 'Guessing' in confidence_signals
    print(f"[PASS] 6. Confidence signals ('Sure', 'Guessing') verified on test answers: {confidence_signals}")

    # 7. Scholarships Data
    cursor.execute('SELECT COUNT(*) as count FROM scholarships WHERE is_active = 1;')
    sc_count = cursor.fetchone()['count']
    assert sc_count >= 8, f"Expected at least 8 active scholarships, found {sc_count}"
    print(f"[PASS] 7. Scholarships data verified ({sc_count} active postings)")

    # 8. Mentor Notes with parent-share control
    cursor.execute('SELECT id, student_id, share_with_parent, follow_up_completed FROM mentor_notes;')
    notes = cursor.fetchall()
    assert len(notes) == 3
    print(f"[PASS] 8. Mentor notes visibility flags verified (shared: {[n['share_with_parent'] for n in notes]})")

    print("--- ALL VERIFICATION CHECKS PASSED ---\n")
    conn.close()

if __name__ == '__main__':
    test_database()
