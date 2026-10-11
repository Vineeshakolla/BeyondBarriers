"""
Beyond Barriers - Step 9 Live End-to-End Verification Demo
Verifies Part A (Adaptive Resources System) & Part B (Static Career Guidance System)
against the running Flask live server on http://127.0.0.1:5000.
"""

import sys
import json
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = 'http://127.0.0.1:5000'

def make_req(path, method='GET', data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, {'raw': content}

def login(username, password='password123'):
    status, res = make_req('/api/auth/login', 'POST', {'username': username, 'password': password})
    if status == 200:
        return res.get('token')
    raise RuntimeError(f"Failed to login {username}: {res}")

def run_live_demo():
    print("\n=======================================================")
    print(" BEYOND BARRIERS - STEP 9 LIVE VERIFICATION DEMO")
    print("=======================================================\n")

    # 1. Health Check
    status, health = make_req('/api/health')
    assert status == 200, f"Health check failed: {health}"
    print(f"[PASS] 1. Backend Health Check: status={health.get('status')}, DB={health.get('database')}")

    # 2. Login Personas
    token_s1 = login('student1') # Aarav (intermittent)
    token_s5 = login('student5') # Rohan (strict offline)
    token_s2 = login('student2') # Priya (full internet, Web Dev)
    token_s8 = login('student8') # Meera (visual disability, audio pref)
    token_m1 = login('mentor1')  # Dr. Radhika Sen
    print("[PASS] 2. Successfully authenticated Student 1, Student 2, Student 5, Student 8, and Mentor 1")

    # 3. Part A: Resources for Strict Offline Student 5
    status, res_s5 = make_req('/api/student/resources', token=token_s5)
    assert status == 200
    assert res_s5['count'] > 0
    top_s5 = res_s5['resources'][0]
    assert top_s5['is_downloadable'] == 1
    assert top_s5['access_requirement'] == 'offline_friendly'
    assert top_s5['connectivity_status'] == 'optimal'
    print(f"[PASS] 3. Strict Offline Student (Rohan) #1 ranked resource: '{top_s5['title']}' (Score: {top_s5['suitability_score']}%, {top_s5['size_note']})")

    # 4. Offline Student Voice Summary
    voice_res_s5 = res_s5['voice_summary']
    assert 'offline' in voice_res_s5.lower()
    print(f"[PASS] 4. Offline Voice Summary verified: '{voice_res_s5[:80]}...'")

    # 5. Intermittent Student 1 Resources
    status, res_s1 = make_req('/api/student/resources', token=token_s1)
    assert status == 200
    top_s1 = res_s1['resources'][0]
    assert top_s1['is_downloadable'] == 1
    print(f"[PASS] 5. Intermittent Student (Aarav) #1 ranked resource: '{top_s1['title']}' (Score: {top_s1['suitability_score']}%)")

    # 6. Visual Disability Student 8 Audio Boost
    status, res_s8 = make_req('/api/student/resources', token=token_s8)
    assert status == 200
    audio_res = [r for r in res_s8['resources'] if r['format'] == 'audio']
    assert len(audio_res) > 0
    assert audio_res[0]['suitability_score'] >= 90
    print(f"[PASS] 6. Visual Disability Student (Meera) audio resources boosted: '{audio_res[0]['title']}' (Score: {audio_res[0]['suitability_score']}%)")

    # 7. Query Parameter Filters (format, connectivity, search)
    status, res_filt = make_req('/api/student/resources?format=visual&connectivity=offline_friendly', token=token_s1)
    assert status == 200
    for r in res_filt['resources']:
        assert r['format'] == 'visual'
        assert r['access_requirement'] == 'offline_friendly'
    print(f"[PASS] 7. Combined filter (?format=visual&connectivity=offline_friendly) returned {res_filt['count']} verified items")

    # 8. Single Resource Detail Endpoint
    status, res_detail = make_req('/api/student/resources/1', token=token_s5)
    assert status == 200
    assert res_detail['resource']['id'] == 1
    assert 'suitability_score' in res_detail['resource']
    assert 'explanation' in res_detail['resource']
    print(f"[PASS] 8. Single resource detail API evaluated for student: '{res_detail['resource']['title']}' (Score: {res_detail['resource']['suitability_score']}%)")

    # 9. Part B: Career Guidance for Student 1 (AI & ML)
    status, car_s1 = make_req('/api/student/career', token=token_s1)
    assert status == 200
    role_s1 = car_s1['role']
    steps_s1 = car_s1['steps']
    assert 'AI' in role_s1['title']
    assert len(steps_s1) == 4
    for s in steps_s1:
        assert len(s['learning_resources_list']) >= 1
    print(f"[PASS] 9. Career Guidance for Student 1: Role '{role_s1['title']}' with all 4 stages verified")

    # 10. Part B: Career Guidance for Student 2 (Web Development)
    status, car_s2 = make_req('/api/student/career', token=token_s2)
    assert status == 200
    role_s2 = car_s2['role']
    steps_s2 = car_s2['steps']
    assert 'Web Developer' in role_s2['title']
    assert len(steps_s2) == 4
    first_link = steps_s2[0]['learning_resources_list'][0]
    print(f"[PASS] 10. Career Guidance for Student 2: Role '{role_s2['title']}', Stage 1 Curated Link: '{first_link['title']}' ({first_link['url']})")

    # 11. Role Switching via Query Parameter (?role_id=2 -> Cybersecurity)
    status, car_role2 = make_req('/api/student/career?role_id=2', token=token_s1)
    assert status == 200
    assert 'Cybersecurity' in car_role2['role']['title']
    assert len(car_role2['steps']) == 4
    print(f"[PASS] 11. Role exploration via ?role_id=2 returned '{car_role2['role']['title']}' with 4-stage roadmap")

    # 12. Career Fields Endpoint
    status, fields = make_req('/api/student/career/fields', token=token_s1)
    assert status == 200
    assert len(fields['fields']) == 4
    print(f"[PASS] 12. Career fields API returned {len(fields['fields'])} distinct technical career domains")

    # 13. Voice Agent Career Summary
    voice_car = car_s1['voice_summary']
    assert len(voice_car) > 20
    assert 'Stage 1' in voice_car
    print(f"[PASS] 13. Voice Agent Career Summary verified: '{voice_car[:80]}...'")

    # 14. RBAC Privacy & Security Enforcement
    status, mentor_res = make_req('/api/student/resources', token=token_m1)
    assert status == 403
    status, anon_res = make_req('/api/student/resources')
    assert status == 401
    print("[PASS] 14. RBAC Security enforced: Anonymous blocked (401), Mentor blocked from student endpoints (403)")

    print("\n=======================================================")
    print(" ALL 14 LIVE STEP 9 DEMO VERIFICATION CHECKS PASSED!")
    print("=======================================================\n")

if __name__ == '__main__':
    run_live_demo()
