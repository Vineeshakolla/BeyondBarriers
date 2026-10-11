"""
Beyond Barriers - Step 9 Test Suite
Comprehensive testing for Part A (Resources System) & Part B (Career Guidance System).
Covers:
- Offline, intermittent, and full connectivity adaptation
- Format matching and accessibility adaptation (visual disability audio boost)
- Query filtering (format, connectivity, downloadable, search)
- Resource detail endpoints and suitability explanations
- Static 4-stage career roadmaps for all 4 fields (AI, Cybersecurity, Web Dev, Data Science)
- Related roles, key skills, recommended projects, learning resource links
- Role switching & career fields browsing
- Voice summary generation for both Resources and Career Guidance
- Role-based access control and security
"""

import os
import sys
import json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from backend.app import create_app
from backend.database.db import get_db
from backend.app.services.resource_engine import (
    evaluate_resource_suitability, recommend_resources,
    generate_resource_voice_summary, generate_career_voice_summary
)

def run_tests():
    print("\n=======================================================")
    print(" BEYOND BARRIERS - STEP 9 RESOURCES & CAREER TESTS")
    print("=======================================================\n")

    app = create_app()
    client = app.test_client()

    # -------------------------------------------------------------
    # 1. AUTHENTICATION & LOGIN HELPERS
    # -------------------------------------------------------------
    print("--- 1. Authenticating Test Personas ---")
    
    # Student 1 (Aarav: Class 10, offline internet, no device, visual format, AI interest)
    r_s1 = client.post('/api/auth/login', json={'username': 'student1', 'password': 'password123'})
    assert r_s1.status_code == 200
    token_s1 = r_s1.get_json()['token']
    auth_s1 = {'Authorization': f'Bearer {token_s1}'}

    # Student 2 (Priya: Class 10, full internet, laptop, visual format, Web Development interest)
    r_s2 = client.post('/api/auth/login', json={'username': 'student2', 'password': 'password123'})
    assert r_s2.status_code == 200
    token_s2 = r_s2.get_json()['token']
    auth_s2 = {'Authorization': f'Bearer {token_s2}'}

    # Student 5 (Rohan: Class 10, offline / none internet, no device, text format, Web Dev interest)
    r_s5 = client.post('/api/auth/login', json={'username': 'student5', 'password': 'password123'})
    assert r_s5.status_code == 200
    token_s5 = r_s5.get_json()['token']
    auth_s5 = {'Authorization': f'Bearer {token_s5}'}

    # Student 8 (Meera: Class 10, visual disability, audio format preference, AI interest)
    r_s8 = client.post('/api/auth/login', json={'username': 'student8', 'password': 'password123'})
    assert r_s8.status_code == 200
    token_s8 = r_s8.get_json()['token']
    auth_s8 = {'Authorization': f'Bearer {token_s8}'}

    # Mentor 1 (Dr. Radhika Sen)
    r_m1 = client.post('/api/auth/login', json={'username': 'mentor1', 'password': 'password123'})
    assert r_m1.status_code == 200
    token_m1 = r_m1.get_json()['token']
    auth_m1 = {'Authorization': f'Bearer {token_m1}'}

    print("[PASS] 1. Authentication successful for Student 1, Student 2, Student 5, Student 8, and Mentor 1")

    # -------------------------------------------------------------
    # 2. PART A: RESOURCES SYSTEM (CONNECTIVITY & ACCESSIBILITY)
    # -------------------------------------------------------------
    print("\n--- 2. Testing Part A: Resources System ---")

    # A1. Student 5 (Strict Offline Profile - internet_access: 'none')
    res_s5 = client.get('/api/student/resources', headers=auth_s5)
    assert res_s5.status_code == 200
    d_s5 = res_s5.get_json()
    assert d_s5['status'] == 'ok'
    assert d_s5['count'] > 0
    assert d_s5['offline_available_count'] > 0
    assert 'voice_summary' in d_s5

    # Check top resource is downloadable and offline-friendly
    top_s5 = d_s5['resources'][0]
    assert top_s5['is_downloadable'] == 1
    assert top_s5['access_requirement'] == 'offline_friendly'
    assert top_s5['connectivity_status'] == 'optimal'
    assert 'offline' in top_s5['explanation'].lower() or 'zero' in top_s5['explanation'].lower()
    print(f"[PASS] 2. Student 5 (Strict Offline) gets downloadable offline resources ranked #1: '{top_s5['title']}' (Score: {top_s5['suitability_score']})")

    # Check that high-speed resources are marked 'not_recommended' for offline student
    high_speed_res_s5 = [r for r in d_s5['resources'] if r['access_requirement'] == 'high_speed']
    assert len(high_speed_res_s5) > 0
    for h in high_speed_res_s5:
        assert h['connectivity_status'] == 'not_recommended'
        assert h['suitability_score'] < top_s5['suitability_score']
    print("[PASS] 3. High-speed streaming resources marked 'not_recommended' with lower rank for offline student")

    # A1.1 Student 1 (Intermittent Connectivity Profile)
    res_s1 = client.get('/api/student/resources', headers=auth_s1)
    assert res_s1.status_code == 200
    d_s1 = res_s1.get_json()
    top_s1 = d_s1['resources'][0]
    assert top_s1['is_downloadable'] == 1
    print(f"[PASS] 3.1. Student 1 (Intermittent) receives low-bandwidth / downloadable top pick: '{top_s1['title']}' (Score: {top_s1['suitability_score']})")

    # A2. Student 2 (Full Internet Profile)
    res_s2 = client.get('/api/student/resources', headers=auth_s2)
    assert res_s2.status_code == 200
    d_s2 = res_s2.get_json()
    top_s2 = d_s2['resources'][0]
    assert top_s2['suitability_score'] >= 80
    assert top_s2['connectivity_status'] == 'optimal'
    print(f"[PASS] 4. Student 2 (Full Internet) top resource: '{top_s2['title']}' (Score: {top_s2['suitability_score']})")

    # A3. Student 8 (Visual Disability & Audio Preference)
    res_s8 = client.get('/api/student/resources', headers=auth_s8)
    assert res_s8.status_code == 200
    d_s8 = res_s8.get_json()
    # Audio resources should receive high scores and accessibility explanation
    audio_resources = [r for r in d_s8['resources'] if r['format'] == 'audio']
    assert len(audio_resources) > 0
    for a in audio_resources:
        assert a['format_match'] is True
        assert 'screen-reader' in a['explanation'].lower() or 'auditory' in a['explanation'].lower()
    print(f"[PASS] 5. Student 8 (Visual Disability) receives audio accessibility boost for {len(audio_resources)} audio resources")

    # A4. Query Parameter Filters
    # Filter by format
    res_audio = client.get('/api/student/resources?format=audio', headers=auth_s1).get_json()
    for r in res_audio['resources']:
        assert r['format'] == 'audio'
    print(f"[PASS] 6. Query filter ?format=audio returned {res_audio['count']} items, all verified audio format")

    # Filter by connectivity
    res_offline = client.get('/api/student/resources?connectivity=offline_friendly', headers=auth_s1).get_json()
    for r in res_offline['resources']:
        assert r['access_requirement'] == 'offline_friendly'
    print(f"[PASS] 7. Query filter ?connectivity=offline_friendly returned {res_offline['count']} items, all offline-friendly")

    # Filter downloadable only
    res_down = client.get('/api/student/resources?downloadable=1', headers=auth_s1).get_json()
    for r in res_down['resources']:
        assert r['is_downloadable'] == 1
    print(f"[PASS] 8. Query filter ?downloadable=1 returned {res_down['count']} downloadable items")

    # Search query
    res_search = client.get('/api/student/resources?search=Python', headers=auth_s1).get_json()
    assert res_search['count'] >= 1
    for r in res_search['resources']:
        assert 'python' in r['title'].lower() or 'python' in r['description'].lower()
    print(f"[PASS] 9. Query filter ?search=Python returned {res_search['count']} matching items")

    # A5. Single Resource Detail Endpoint
    res_det = client.get('/api/student/resources/1', headers=auth_s1).get_json()
    assert res_det['status'] == 'ok'
    assert res_det['resource']['id'] == 1
    assert 'suitability_score' in res_det['resource']
    assert 'explanation' in res_det['resource']
    assert 'size_note' in res_det['resource']
    print(f"[PASS] 10. Single resource detail API (/api/student/resources/1) returns personalized evaluation")

    # A6. Non-existent resource returns 404
    res_404 = client.get('/api/student/resources/9999', headers=auth_s1)
    assert res_404.status_code == 404
    print("[PASS] 11. Requesting non-existent resource ID returns 404")

    # A7. Recommended resources endpoint
    res_rec = client.get('/api/student/resources/recommended', headers=auth_s1).get_json()
    assert res_rec['status'] == 'ok'
    assert len(res_rec['resources']) <= 5
    for r in res_rec['resources']:
        assert r['suitability_score'] >= 50
    print(f"[PASS] 12. Recommended endpoint (/api/student/resources/recommended) returned top {res_rec['count']} curated resources")

    # -------------------------------------------------------------
    # 3. PART B: CAREER GUIDANCE & STATIC ROADMAPS
    # -------------------------------------------------------------
    print("\n--- 3. Testing Part B: Career Guidance System ---")

    # B1. Student 1 Career Guidance (Interest: Artificial Intelligence)
    car_s1 = client.get('/api/student/career', headers=auth_s1).get_json()
    assert car_s1['status'] == 'ok'
    assert car_s1['role']['id'] == 1
    assert 'AI' in car_s1['role']['title']
    assert len(car_s1['role']['related_roles_list']) >= 3
    assert len(car_s1['steps']) == 4
    # Verify the 4 sequential stages
    expected_stages = ['Foundation', 'Core Skills', 'Advanced Skills', 'Career Preparation']
    for i, step in enumerate(car_s1['steps']):
        assert step['stage'] == expected_stages[i]
        assert step['stage_order'] == i + 1
        assert len(step['key_skills']) > 0
        assert len(step['recommended_projects']) > 0
        assert len(step['learning_resources_list']) >= 1
    assert 'voice_summary' in car_s1
    print(f"[PASS] 13. Student 1 career guidance matched AI & ML Engineer with all 4 stages verified")

    # B2. Student 2 Career Guidance (Interest: Web Development)
    car_s2 = client.get('/api/student/career', headers=auth_s2).get_json()
    assert car_s2['status'] == 'ok'
    assert car_s2['role']['id'] == 3
    assert 'Web Developer' in car_s2['role']['title']
    assert len(car_s2['steps']) == 4
    for step in car_s2['steps']:
        assert len(step['learning_resources_list']) >= 1
        for link in step['learning_resources_list']:
            assert 'url' in link
            assert 'title' in link
    print(f"[PASS] 14. Student 2 career guidance matched Full-Stack Web Developer with verified learning links")

    # B3. Explore specific role via query parameter (?role_id=2 -> Cybersecurity)
    car_role2 = client.get('/api/student/career?role_id=2', headers=auth_s1).get_json()
    assert car_role2['status'] == 'ok'
    assert car_role2['role']['id'] == 2
    assert 'Cybersecurity' in car_role2['role']['title']
    assert len(car_role2['steps']) == 4
    print(f"[PASS] 15. Role exploration via ?role_id=2 correctly retrieved Cybersecurity Analyst roadmap")

    # B4. Explore specific role via query parameter (?role_id=4 -> Data Analyst)
    car_role4 = client.get('/api/student/career?role_id=4', headers=auth_s1).get_json()
    assert car_role4['status'] == 'ok'
    assert car_role4['role']['id'] == 4
    assert 'Data Analyst' in car_role4['role']['title']
    assert len(car_role4['steps']) == 4
    print(f"[PASS] 16. Role exploration via ?role_id=4 correctly retrieved Data Analyst roadmap")

    # B5. Career Fields Endpoint
    fields_resp = client.get('/api/student/career/fields', headers=auth_s1).get_json()
    assert fields_resp['status'] == 'ok'
    assert len(fields_resp['fields']) == 4
    for f in fields_resp['fields']:
        assert len(f['roles']) >= 1
    print(f"[PASS] 17. Career fields endpoint returned all 4 fields with associated career roles")

    # B6. Career Role Detail Endpoint
    role_det = client.get('/api/student/career/roles/2', headers=auth_s1).get_json()
    assert role_det['status'] == 'ok'
    assert role_det['role']['title'] == 'Cybersecurity Analyst'
    assert len(role_det['steps']) == 4
    assert 'voice_summary' in role_det
    print("[PASS] 18. Career role detail API (/api/student/career/roles/2) verified")

    # B7. Non-existent career role returns 404
    car_404 = client.get('/api/student/career/roles/9999', headers=auth_s1)
    assert car_404.status_code == 404
    print("[PASS] 19. Non-existent career role returns 404")

    # -------------------------------------------------------------
    # 4. VOICE SUMMARIES & ACCESSIBILITY READINESS
    # -------------------------------------------------------------
    print("\n--- 4. Testing Voice Agent Summary Generation ---")

    # Resource voice summary
    voice_res_s5 = d_s5['voice_summary']
    assert len(voice_res_s5) > 20
    assert 'offline' in voice_res_s5.lower()
    print(f"[PASS] 20. Resource voice summary generated for offline student: '{voice_res_s5[:75]}...'")

    voice_res_s1 = d_s1['voice_summary']
    assert len(voice_res_s1) > 20
    assert 'downloaded' in voice_res_s1.lower() or 'low-bandwidth' in voice_res_s1.lower()
    print(f"[PASS] 20.1. Resource voice summary generated for intermittent student: '{voice_res_s1[:75]}...'")

    # Career voice summary
    voice_car_s1 = car_s1['voice_summary']
    assert len(voice_car_s1) > 20
    assert 'AI & Machine Learning Engineer' in voice_car_s1
    assert 'Stage 1' in voice_car_s1
    assert 'Stage 4' in voice_car_s1
    print(f"[PASS] 21. Career voice summary generated: '{voice_car_s1[:75]}...'")

    # -------------------------------------------------------------
    # 5. SECURITY & RBAC ENFORCEMENT
    # -------------------------------------------------------------
    print("\n--- 5. Testing Security & RBAC Enforcement ---")

    # Anonymous user cannot access resources
    r_anon_res = client.get('/api/student/resources')
    assert r_anon_res.status_code == 401
    print("[PASS] 22. Anonymous user rejected from /api/student/resources with 401")

    # Anonymous user cannot access career guidance
    r_anon_car = client.get('/api/student/career')
    assert r_anon_car.status_code == 401
    print("[PASS] 23. Anonymous user rejected from /api/student/career with 401")

    # Mentor role cannot access student-scoped resources directly
    r_mentor_res = client.get('/api/student/resources', headers=auth_m1)
    assert r_mentor_res.status_code == 403
    print("[PASS] 24. Mentor role rejected from /api/student/resources with 403 (Scope & role enforcement)")

    # Mentor role cannot access student-scoped career directly
    r_mentor_car = client.get('/api/student/career', headers=auth_m1)
    assert r_mentor_car.status_code == 403
    print("[PASS] 25. Mentor role rejected from /api/student/career with 403 (Scope & role enforcement)")

    print("\n=======================================================")
    print(" ALL 25 STEP 9 TESTS PASSED CLEANLY! (25/25)")
    print("=======================================================\n")

if __name__ == '__main__':
    run_tests()
