"""
Automated Test Suite for Student Lesson Doubt Clarification Chatbot (Gemini API)
Verifies:
1. Authentication & RBAC enforcement (Only Student role permitted, Mentor/Parent/Admin rejected).
2. Input Validation (Empty questions, character limits).
3. Backend Gemini Service Integration & Fallback Handling.
4. Lesson Context Safety & Database Retrieval.
"""

import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app import create_app


def run_gemini_doubt_tests():
    app = create_app()
    client = app.test_client()

    print("\n=======================================================")
    print(" BEYOND BARRIERS - GEMINI DOUBT CHATBOT TEST SUITE")
    print("=======================================================")

    # Test 1: Unauthenticated request -> 401
    res = client.post('/api/student/learning/modules/1/doubt', json={'question': 'What is this lesson?'})
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("[PASS] 1. Unauthenticated request to doubt endpoint rejected with 401")

    # Helper function to get token
    def get_token(username, password='password123'):
        r = client.post('/api/auth/login', json={'username': username, 'password': password})
        assert r.status_code == 200, f"Login failed for {username}: {r.get_data(as_text=True)}"
        return r.get_json()['token']

    # Test 2: Mentor blocked -> 403
    mentor_token = get_token('mentor1')
    res = client.post('/api/student/learning/modules/1/doubt', 
                      json={'question': 'Can I ask a doubt?'},
                      headers={'Authorization': f'Bearer {mentor_token}'})
    assert res.status_code == 403, f"Expected 403 for mentor, got {res.status_code}"
    print("[PASS] 2. Mentor blocked from Student Doubt Chatbot with 403")

    # Test 3: Parent blocked -> 403
    parent_token = get_token('parent1')
    res = client.post('/api/student/learning/modules/1/doubt', 
                      json={'question': 'Can I ask a doubt?'},
                      headers={'Authorization': f'Bearer {parent_token}'})
    assert res.status_code == 403, f"Expected 403 for parent, got {res.status_code}"
    print("[PASS] 3. Parent blocked from Student Doubt Chatbot with 403")

    # Test 4: Admin blocked -> 403
    admin_token = get_token('admin1')
    res = client.post('/api/student/learning/modules/1/doubt', 
                      json={'question': 'Can I ask a doubt?'},
                      headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 403, f"Expected 403 for admin, got {res.status_code}"
    print("[PASS] 4. Admin blocked from Student Doubt Chatbot with 403")

    # Test 5: Student Empty Question Validation -> 400
    student_token = get_token('student1')
    student_headers = {'Authorization': f'Bearer {student_token}'}

    res = client.post('/api/student/learning/modules/1/doubt', 
                      json={'question': '   '},
                      headers=student_headers)
    assert res.status_code == 400, f"Expected 400 for empty question, got {res.status_code}"
    data = res.get_json()
    assert data['success'] is False
    assert 'valid question' in data['error'].lower()
    print("[PASS] 5. Empty question validation rejected with 400")

    # Test 6: Student Long Question Validation -> 400
    long_q = "Why " * 600
    res = client.post('/api/student/learning/modules/1/doubt', 
                      json={'question': long_q},
                      headers=student_headers)
    assert res.status_code == 400, f"Expected 400 for long question, got {res.status_code}"
    data = res.get_json()
    assert data['success'] is False
    assert 'too long' in data['error'].lower()
    print("[PASS] 6. Excessively long question (>2000 chars) rejected with 400")

    # Test 7: Student Valid Doubt Request -> 200 OK
    res = client.post('/api/student/learning/modules/1/doubt', 
                      json={
                          'question': 'Why is this formula used in this lesson?',
                          'history': [
                              {'sender': 'student', 'text': 'What is the topic?'},
                              {'sender': 'assistant', 'text': 'This lesson is about real numbers.'}
                          ]
                      },
                      headers=student_headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.get_json()
    assert data['success'] is True
    assert len(data['answer']) > 10
    assert data['module_id'] == 1
    print(f"[PASS] 7. Student1 doubt request answered successfully: '{data['answer'][:80]}...'")

    # Test 8: Direct Gemini Service Formatting & Execution Test
    from backend.app.services.gemini_service import format_lesson_prompt, ask_gemini_doubt
    
    context = {
        'subject_name': 'Mathematics',
        'module_number': 1,
        'title': 'Real Numbers & Operations',
        'summary_content': 'Fundamental properties of rational and irrational numbers.',
        'detailed_content': 'Detailed breakdown of prime factorization and Euclids division lemma.',
        'difficulty_level': 'standard'
    }
    prompt = format_lesson_prompt(context, 'Explain Euclids lemma simply.')
    assert 'Real Numbers' in prompt
    assert 'Euclids lemma' in prompt
    print("[PASS] 8. Lesson prompt structured with subject, title, summary, and question")

    res_service = ask_gemini_doubt(context, 'What is a prime number?')
    assert res_service['success'] is True
    assert len(res_service['answer']) > 15
    print(f"[PASS] 9. Gemini Service returned clean educational response (Fallback active: {res_service.get('is_fallback', False)})")

    print("\n=======================================================")
    print(" ALL 9 GEMINI CHATBOT TEST CASES PASSED SUCCESSFULLY")
    print("=======================================================\n")


if __name__ == '__main__':
    run_gemini_doubt_tests()
