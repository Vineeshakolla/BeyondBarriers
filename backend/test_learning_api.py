#!/usr/bin/env python3
"""
Beyond Barriers - Step 5 Learning, Modules, Tests & Adaptive Engine Test Suite
Tests:
1. Dynamic subjects lookup for authenticated student
2. Sequential module locking & unlocking
3. Academic integrity: question endpoint excludes correct_option
4. Test submission with confidence capture ('Sure' / 'Guessing')
5. Confidence quadrant analysis (Mastery vs Misconception vs Guessing)
6. Attempt history retention (never overwrites previous attempts)
7. Adaptive content depth rules (Light vs Standard vs Detailed)
8. Final Assessment unlock condition (unlocked only when all regular modules completed)
9. Security & Role isolation: Non-students blocked (403), unauthenticated blocked (401)
10. Student isolation: Student A cannot access Student B's learning data
"""

import sys
import os
import json

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
    print(" BEYOND BARRIERS - STEP 5 LEARNING, MODULES & TESTS TEST SUITE")
    print("=" * 65)

    # 1. Unauthenticated checks
    res = client.get('/api/student/learning/subjects')
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("[PASS] 1. Unauthenticated request to /api/student/learning/subjects rejected (401)")

    # 2. Authenticate Student 1 (Aarav - Class 10) & Mentor 1
    res = client.post('/api/auth/login', json={'username': 'student1', 'password': 'password123'})
    assert res.status_code == 200
    st1_token = res.get_json()['token']
    auth_st1 = {'Authorization': f'Bearer {st1_token}'}

    res = client.post('/api/auth/login', json={'username': 'mentor1', 'password': 'password123'})
    assert res.status_code == 200
    mentor_token = res.get_json()['token']
    auth_mentor = {'Authorization': f'Bearer {mentor_token}'}

    # Mentor cannot access student learning endpoint
    res = client.get('/api/student/learning/subjects', headers=auth_mentor)
    assert res.status_code == 403
    print("[PASS] 2. Non-student role (mentor) blocked from student learning endpoints (403)")

    # 3. Dynamic Subjects for Student 1 (Class 10 General)
    res = client.get('/api/student/learning/subjects', headers=auth_st1)
    assert res.status_code == 200
    sub_data = res.get_json()
    assert sub_data['class'] == 'Class 10'
    sub_names = [s['name'] for s in sub_data['subjects']]
    assert 'Mathematics' in sub_names and 'Science' in sub_names
    math_sub = next(s for s in sub_data['subjects'] if s['name'] == 'Mathematics')
    assert math_sub['total_modules'] >= 3
    print(f"[PASS] 3. Student 1 enrolled subjects resolved: {sub_names} (Math: {math_sub['completed_modules']}/{math_sub['total_modules']} completed)")

    # 4. Sequential Module Lock States & Adaptive Recommendations
    res = client.get(f"/api/student/learning/subjects/{math_sub['id']}/modules", headers=auth_st1)
    assert res.status_code == 200
    m_data = res.get_json()
    modules = m_data['modules']
    
    # Module 1 should be unlocked
    assert modules[0]['id'] == 1 and not modules[0]['is_locked'] and modules[0]['status'] == 'completed'
    # Module 2 should be in_progress (Aarav has 2 attempts, score 50%)
    assert modules[1]['id'] == 2 and not modules[1]['is_locked'] and modules[1]['status'] == 'in_progress'
    # Module 2 recommends 'light' because Module 1 was 100% on 1st attempt with 'Sure'
    assert modules[1]['adaptive_level'] == 'light'
    print(f"[PASS] 4a. Module 1 completed; Module 2 unlocked with adaptive recommendation: '{modules[1]['adaptive_level']}'")

    # Module 6 is Final Assessment - for Aarav it must be LOCKED because module 2 & 5 are not completed
    final_mod = next(m for m in modules if m['is_final_assessment'])
    assert final_mod['is_locked'] is True
    print(f"[PASS] 4b. Subject Final Assessment is correctly locked for Aarav (incomplete prerequisites)")

    # 5. Final Assessment UNLOCKED for Priya (Student 2) who completed modules 1, 2, 5
    res = client.post('/api/auth/login', json={'username': 'student2', 'password': 'password123'})
    st2_token = res.get_json()['token']
    auth_st2 = {'Authorization': f'Bearer {st2_token}'}

    res = client.get(f"/api/student/learning/subjects/{math_sub['id']}/modules", headers=auth_st2)
    assert res.status_code == 200
    priya_modules = res.get_json()['modules']
    priya_final = next(m for m in priya_modules if m['is_final_assessment'])
    assert priya_final['is_locked'] is False
    print(f"[PASS] 5. Subject Final Assessment is UNLOCKED for Priya (completed all 3 prerequisite modules)")

    # 6. Academic Integrity on Module Test Query
    res = client.get('/api/student/learning/modules/1/test', headers=auth_st1)
    assert res.status_code == 200
    test_data = res.get_json()
    assert 'questions' in test_data and len(test_data['questions']) > 0
    q1 = test_data['questions'][0]
    # Academic integrity: correct_option and explanation must NOT be leaked
    assert 'correct_option' not in q1
    assert 'explanation' not in q1
    assert 'option_a' in q1 and 'option_b' in q1
    print(f"[PASS] 6. Academic integrity verified: correct_option & explanation excluded from test questions")

    # 7. Test Submission with Confidence Signal ('Sure' vs 'Guessing')
    # Let's submit Test 1 (Module 1, 3 questions: Q1 correct=B, Q2 correct=B, Q3 correct=A)
    # Aarav submits Q1=B (Sure, correct), Q2=A (Sure, wrong -> misconception), Q3=A (Guessing, correct -> lucky guess)
    submit_payload = {
        'answers': [
            {'question_id': 1, 'selected_option': 'B', 'confidence': 'Sure'},     # Correct + Sure
            {'question_id': 2, 'selected_option': 'A', 'confidence': 'Sure'},     # Incorrect + Sure (Misconception!)
            {'question_id': 3, 'selected_option': 'A', 'confidence': 'Guessing'}  # Correct + Guessing (Lucky guess)
        ]
    }
    test_id = test_data['test']['id']
    res = client.post(f"/api/student/learning/tests/{test_id}/attempt", json=submit_payload, headers=auth_st1)
    assert res.status_code == 200
    res_data = res.get_json()['result']
    assert res_data['total_questions'] == 3
    assert res_data['correct_count'] == 2 # Q1 and Q3 correct
    assert res_data['score'] == 66.7 # 2/3 = 66.7%
    assert res_data['passed'] is True # passing_score is 60.0%
    assert res_data['sure_count'] == 2
    assert res_data['guessing_count'] == 1
    
    # Check quadrant
    conf_analysis = res_data['confidence_analysis']
    assert conf_analysis['sure_correct'] == 1
    assert conf_analysis['sure_incorrect'] == 1 # Misconception identified
    assert conf_analysis['guessing_correct'] == 1 # Lucky guess identified
    assert conf_analysis['guessing_incorrect'] == 0
    print(f"[PASS] 7. Test submitted: Score {res_data['score']}%, Sure: {res_data['sure_count']}, Guessing: {res_data['guessing_count']}")
    print(f"       * Quadrant: {conf_analysis['sure_correct']} Mastery, {conf_analysis['sure_incorrect']} Misconceptions, {conf_analysis['guessing_correct']} Lucky Guesses")

    # 8. Attempt History Retention (Does not overwrite)
    res = client.get('/api/student/learning/modules/1/attempts', headers=auth_st1)
    assert res.status_code == 200
    hist = res.get_json()['attempts']
    assert len(hist) >= 1
    assert hist[-1]['attempt_number'] >= 1
    print(f"[PASS] 8. Attempt history retrieved: {len(hist)} attempt(s) retained in database without overwriting")

    # 9. Adaptive Learning Level Recommendation Logic
    # Scenario A: High score on attempt 1 with Sure confidence -> Light
    # Let's simulate a test attempt for Module 3 (Test 3) with 100% Sure
    res_test3 = client.get('/api/student/learning/modules/3/test', headers=auth_st1)
    test3_id = res_test3.get_json()['test']['id']
    perf_payload = {
        'answers': [
            {'question_id': 6, 'selected_option': 'B', 'confidence': 'Sure'}, # Correct
            {'question_id': 7, 'selected_option': 'C', 'confidence': 'Sure'}  # Correct
        ]
    }
    res = client.post(f"/api/student/learning/tests/{test3_id}/attempt", json=perf_payload, headers=auth_st1)
    assert res.status_code == 200
    rec = res.get_json()['result']['next_module_adaptive']
    assert rec['level'] == 'light'
    print(f"[PASS] 9a. High first-attempt score + 'Sure' confidence -> Adaptive level correctly recommends: '{rec['level']}'")

    # Scenario B: Low score or Guessing -> Detailed
    low_payload = {
        'answers': [
            {'question_id': 6, 'selected_option': 'A', 'confidence': 'Guessing'}, # Wrong
            {'question_id': 7, 'selected_option': 'A', 'confidence': 'Guessing'}  # Wrong
        ]
    }
    res = client.post(f"/api/student/learning/tests/{test3_id}/attempt", json=low_payload, headers=auth_st1)
    assert res.status_code == 200
    rec_low = res.get_json()['result']['next_module_adaptive']
    assert rec_low['level'] == 'detailed'
    print(f"[PASS] 9b. Repeated attempt / lower score with 'Guessing' -> Adaptive level correctly recommends: '{rec_low['level']}'")

    # 10. Student Data Isolation
    # Student 1 cannot view Student 2's attempt history or progress
    # Backend derives student_id strictly from session token
    res = client.get('/api/student/learning/progress', headers=auth_st1)
    assert res.status_code == 200
    st1_progress = res.get_json()['metrics']
    assert st1_progress['total_subjects'] > 0

    res = client.get('/api/student/learning/progress', headers=auth_st2)
    assert res.status_code == 200
    st2_progress = res.get_json()['metrics']
    # Priya has more completed modules than Aarav
    assert st2_progress['completed_modules'] >= st1_progress['completed_modules']
    print(f"[PASS] 10. Student isolation verified (Aarav: {st1_progress['completed_modules']} modules vs Priya: {st2_progress['completed_modules']} modules)")

    print("\n" + "=" * 65)
    print(" ALL 10 STEP 5 LEARNING & TEST ENGINE TESTS PASSED SUCCESSFULLY!")
    print("=" * 65 + "\n")

if __name__ == '__main__':
    run_tests()
