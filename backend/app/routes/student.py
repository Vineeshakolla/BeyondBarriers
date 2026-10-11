"""
Beyond Barriers - Student Profile & Onboarding API Routes
Core Principle: 'ONE STUDENT PROFILE -> PERSONALIZED SUPPORT ACROSS PLATFORM'
Handles:
- GET /api/student/profile: Retrieve authenticated student's unified profile + subjects
- PUT /api/student/profile: Validate and update student's profile, set is_profile_completed = 1
- GET /api/student/subjects: Dynamic subject determination by class and stream
- GET /api/student/options: Form choices and metadata for onboarding and profile editing
"""

import json
from flask import Blueprint, request, jsonify, g
from backend.database.db import get_db
from backend.app.utils.auth import require_auth, require_role, get_current_user
from backend.app.services.support_engine import calculate_support_priority
from backend.app.services.scholarship_engine import (
    calculate_deadline_urgency, evaluate_scholarship_eligibility,
    sort_scholarships, generate_voice_summary, get_student_academic_percentage
)
from backend.app.services.resource_engine import (
    evaluate_resource_suitability, recommend_resources,
    generate_resource_voice_summary, generate_career_voice_summary
)

student_bp = Blueprint('student', __name__, url_prefix='/api/student')

# Predefined valid option constants
VALID_CLASSES = ['Class 10', 'Class 12']
VALID_STREAMS = {
    'Class 10': ['General'],
    'Class 12': ['Science', 'Commerce', 'Arts']
}
VALID_ACCESSIBILITY = ['none', 'visual', 'hearing', 'speech', 'motor']
VALID_INTERNET = ['full', 'intermittent', 'none']
VALID_DEVICES = ['personal_laptop', 'shared_smartphone', 'none']
VALID_INCOME = ['<1.5L', '<3L', '<8L', '>8L']
VALID_FORMATS = ['visual', 'text', 'audio']
VALID_LANGUAGES = ['en', 'hi', 'te', 'ta']

CAREER_INTERESTS = [
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Web Development',
    'Cybersecurity',
    'Digital Marketing',
    'Content Creation',
    'Other / Explore'
]

# Aliases for friendly income mapping
INCOME_ALIASES = {
    'low': '<1.5L',
    '<1.5l': '<1.5L',
    'lower-middle': '<3L',
    'lower middle': '<3L',
    '<3l': '<3L',
    'middle': '<8L',
    '<8l': '<8L',
    'other': '>8L',
    'prefer not to say': '>8L',
    '>8l': '>8L'
}

# Aliases for internet mapping
INTERNET_ALIASES = {
    'full': 'full',
    'reliable': 'full',
    'full / reliable': 'full',
    'intermittent': 'intermittent',
    'offline': 'none',
    'none': 'none',
    'offline / very limited': 'none'
}

# Aliases for device mapping
DEVICE_ALIASES = {
    'personal': 'personal_laptop',
    'personal device': 'personal_laptop',
    'personal_laptop': 'personal_laptop',
    'shared': 'shared_smartphone',
    'shared device': 'shared_smartphone',
    'shared_smartphone': 'shared_smartphone',
    'none': 'none',
    'no reliable device': 'none'
}


def get_subjects_for_class_and_stream(db, student_class, student_stream):
    """Query subjects table dynamically based on class and stream."""
    cursor = db.cursor()
    cursor.execute('''
        SELECT id, name, code, class, stream, description
        FROM subjects
        WHERE class = ? AND (stream = ? OR stream IS NULL OR stream = 'General')
        ORDER BY id ASC
    ''', (student_class, student_stream))
    return [dict(row) for row in cursor.fetchall()]


@student_bp.route('/options', methods=['GET'])
def get_profile_options():
    """
    Return all valid profile choices, categories, and descriptions
    used by the onboarding wizard and profile editing forms.
    """
    return jsonify({
        'status': 'ok',
        'classes': [
            {'value': 'Class 10', 'label': 'Class 10 (Secondary)'},
            {'value': 'Class 12', 'label': 'Class 12 (Higher Secondary)'}
        ],
        'streams': {
            'Class 10': [
                {'value': 'General', 'label': 'General Curriculum (NCERT/CBSE)'}
            ],
            'Class 12': [
                {'value': 'Science', 'label': 'Science (Physics, Chemistry, Math, CS)'},
                {'value': 'Commerce', 'label': 'Commerce (Accountancy, Business Studies, Economics)'},
                {'value': 'Arts', 'label': 'Arts / Humanities (History, Political Science, Economics)'}
            ]
        },
        'accessibility': [
            {'value': 'none', 'label': 'None', 'description': 'Standard multi-modal user interface'},
            {'value': 'visual', 'label': 'Visual', 'description': 'Supports audio-first mode and high-contrast visuals'},
            {'value': 'hearing', 'label': 'Hearing', 'description': 'Emphasizes clear visual text, transcripts, and captions'},
            {'value': 'speech', 'label': 'Speech', 'description': 'Uses text/touch response methods instead of voice'}
        ],
        'internet_access': [
            {'value': 'full', 'label': 'Full / Reliable', 'description': 'Broadband or high-speed mobile data without caps'},
            {'value': 'intermittent', 'label': 'Intermittent', 'description': 'Periodic connectivity drops or daily data limits'},
            {'value': 'none', 'label': 'Offline / Very limited', 'description': 'Infrequent connection; benefits from lightweight/offline materials'}
        ],
        'device_access': [
            {'value': 'personal_laptop', 'label': 'Personal device', 'description': 'Dedicated laptop, desktop, or personal tablet'},
            {'value': 'shared_smartphone', 'label': 'Shared device', 'description': 'Shared family mobile phone'},
            {'value': 'none', 'label': 'No reliable device', 'description': 'School lab or community library access only'}
        ],
        'income_category': [
            {'value': '<1.5L', 'label': 'Low', 'description': 'Annual household income < ₹1.5 Lakhs'},
            {'value': '<3L', 'label': 'Lower-middle', 'description': 'Annual household income ₹1.5 - ₹3 Lakhs'},
            {'value': '<8L', 'label': 'Middle', 'description': 'Annual household income ₹3 - ₹8 Lakhs'},
            {'value': '>8L', 'label': 'Other / Prefer not to say', 'description': 'Annual household income > ₹8 Lakhs or undisclosed'}
        ],
        'career_interests': [
            {'value': c, 'label': c} for c in CAREER_INTERESTS
        ],
        'preferred_response_format': [
            {'value': 'visual', 'label': 'Visual', 'description': 'Diagrams, infographics, and structured tables'},
            {'value': 'text', 'label': 'Text', 'description': 'Concise written explanations and step-by-step guides'},
            {'value': 'audio', 'label': 'Audio', 'description': 'Spoken narration and verbal summaries'}
        ],
        'preferred_language': [
            {'value': 'en', 'label': 'English', 'native': 'English'},
            {'value': 'hi', 'label': 'Hindi', 'native': 'हिंदी'},
            {'value': 'te', 'label': 'Telugu', 'native': 'తెలుగు'},
            {'value': 'ta', 'label': 'Tamil', 'native': 'தமிழ்'}
        ]
    }), 200


@student_bp.route('/subjects', methods=['GET'])
@require_auth
def get_subjects():
    """
    Dynamic subject lookup based on class and stream query parameters.
    Ensures frontend does not hardcode curriculum subjects.
    """
    student_class = request.args.get('class', '').strip()
    student_stream = request.args.get('stream', '').strip()

    if not student_class:
        return jsonify({
            'error': "Query parameter 'class' is required (e.g. 'Class 10' or 'Class 12')",
            'status': 400
        }), 400

    if student_class not in VALID_CLASSES:
        return jsonify({
            'error': f"Invalid class '{student_class}'. Must be one of: {', '.join(VALID_CLASSES)}",
            'status': 400
        }), 400

    # Default stream if not provided
    if not student_stream:
        student_stream = 'General' if student_class == 'Class 10' else 'Science'

    valid_streams_for_class = VALID_STREAMS.get(student_class, [])
    if student_stream not in valid_streams_for_class:
        return jsonify({
            'error': f"Invalid stream '{student_stream}' for {student_class}. Must be one of: {', '.join(valid_streams_for_class)}",
            'status': 400
        }), 400

    db = get_db()
    subjects = get_subjects_for_class_and_stream(db, student_class, student_stream)

    return jsonify({
        'status': 'ok',
        'class': student_class,
        'stream': student_stream,
        'count': len(subjects),
        'subjects': subjects
    }), 200


@student_bp.route('/profile', methods=['GET'])
@require_auth
@require_role('student')
def get_profile():
    """
    Retrieve authenticated student's unified profile.
    Extracts student_id strictly from server-side session token (g.current_user).
    Includes dynamically resolved curriculum subjects.
    """
    user = get_current_user()
    student_id = user.get('student_id')

    if not student_id:
        return jsonify({
            'error': 'Authenticated user is not linked to a student record',
            'status': 403
        }), 403

    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        SELECT id, name, roll_number, roll_code, class, stream, disability_type, 
               internet_access, device_access, income_category, career_interest, 
               preferred_response_format, preferred_language, is_profile_completed,
               created_at, updated_at
        FROM students
        WHERE id = ?
    ''', (student_id,))
    student_row = cursor.fetchone()

    if not student_row:
        return jsonify({
            'error': 'Student record not found',
            'status': 404
        }), 404

    profile = dict(student_row)
    # Boolean casting for clean frontend consumption
    profile['is_profile_completed'] = bool(profile['is_profile_completed'])

    # Determine subjects dynamically based on current profile class + stream
    subjects = get_subjects_for_class_and_stream(db, profile['class'], profile['stream'])

    return jsonify({
        'status': 'ok',
        'profile': profile,
        'subjects': subjects
    }), 200


@student_bp.route('/profile', methods=['PUT'])
@require_auth
@require_role('student')
def update_profile():
    """
    Update authenticated student's profile.
    Strictly enforces authorization:
    - Target student ID is derived ONLY from the session (g.current_user['student_id']).
    - Client cannot modify another student's record by supplying a student_id parameter.
    - Validates all fields against domain constraints.
    - Sets is_profile_completed = 1 on successful update.
    """
    user = get_current_user()
    student_id = user.get('student_id')

    if not student_id:
        return jsonify({
            'error': 'Authenticated user is not linked to a student record',
            'status': 403
        }), 403

    data = request.get_json() or {}
    errors = {}

    # 1. Personal Information Validation
    name = str(data.get('name', '')).strip()
    if not name:
        errors['name'] = 'Student name is required.'
    elif len(name) > 100:
        errors['name'] = 'Name must be 100 characters or fewer.'

    # 2. Academic Information Validation
    student_class = str(data.get('class', '')).strip()
    if not student_class:
        errors['class'] = 'Class is required.'
    elif student_class not in VALID_CLASSES:
        errors['class'] = f"Class must be one of: {', '.join(VALID_CLASSES)}."

    student_stream = str(data.get('stream', '')).strip()
    if not student_stream:
        errors['stream'] = 'Stream is required.'
    elif student_class in VALID_STREAMS:
        allowed_streams = VALID_STREAMS[student_class]
        if student_stream not in allowed_streams:
            errors['stream'] = f"Invalid stream '{student_stream}' for {student_class}. Allowed: {', '.join(allowed_streams)}."

    # 3. Accessibility Needs Validation
    raw_disability = data.get('disability_type', 'none')
    if isinstance(raw_disability, list):
        disability_list = [str(d).strip().lower() for d in raw_disability if str(d).strip()]
        if not disability_list or 'none' in disability_list:
            disability_type = 'none'
        else:
            invalid_disabilities = [d for d in disability_list if d not in VALID_ACCESSIBILITY]
            if invalid_disabilities:
                errors['disability_type'] = f"Invalid accessibility options: {', '.join(invalid_disabilities)}."
            disability_type = ','.join(disability_list)
    else:
        disability_type = str(raw_disability).strip().lower()
        if not disability_type:
            disability_type = 'none'
        elif disability_type not in VALID_ACCESSIBILITY and ',' not in disability_type:
            errors['disability_type'] = f"Accessibility must be one of: {', '.join(VALID_ACCESSIBILITY)}."

    # 4. Resource Access Validation
    raw_internet = str(data.get('internet_access', '')).strip().lower()
    internet_access = INTERNET_ALIASES.get(raw_internet, raw_internet)
    if not internet_access:
        errors['internet_access'] = 'Internet access level is required.'
    elif internet_access not in VALID_INTERNET:
        errors['internet_access'] = f"Internet access must be one of: {', '.join(VALID_INTERNET)}."

    raw_device = str(data.get('device_access', '')).strip().lower()
    device_access = DEVICE_ALIASES.get(raw_device, raw_device)
    if not device_access:
        errors['device_access'] = 'Device access level is required.'
    elif device_access not in VALID_DEVICES:
        errors['device_access'] = f"Device access must be one of: {', '.join(VALID_DEVICES)}."

    # 5. Financial Context Validation
    raw_income = str(data.get('income_category', '')).strip().lower()
    income_category = INCOME_ALIASES.get(raw_income, data.get('income_category', ''))
    if not income_category:
        errors['income_category'] = 'Income category is required.'
    elif income_category not in VALID_INCOME:
        errors['income_category'] = f"Income category must be one of: {', '.join(VALID_INCOME)}."

    # 6. Career Interest Validation
    career_interest = str(data.get('career_interest', '')).strip()
    if not career_interest:
        errors['career_interest'] = 'Career interest is required.'
    elif len(career_interest) > 100:
        errors['career_interest'] = 'Career interest must be 100 characters or fewer.'

    # 7. Preferences Validation
    preferred_response_format = str(data.get('preferred_response_format', '')).strip().lower()
    if not preferred_response_format:
        errors['preferred_response_format'] = 'Preferred response format is required.'
    elif preferred_response_format not in VALID_FORMATS:
        errors['preferred_response_format'] = f"Preferred response format must be one of: {', '.join(VALID_FORMATS)}."

    preferred_language = str(data.get('preferred_language', '')).strip().lower()
    if not preferred_language:
        errors['preferred_language'] = 'Preferred language is required.'
    elif preferred_language not in VALID_LANGUAGES:
        errors['preferred_language'] = f"Preferred language must be one of: {', '.join(VALID_LANGUAGES)}."

    # Reject if any validation error occurred
    if errors:
        return jsonify({
            'error': 'Validation failed on submitted profile data',
            'status': 400,
            'errors': errors
        }), 400

    # Persist update to SQLite database
    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        UPDATE students
        SET name = ?,
            class = ?,
            stream = ?,
            disability_type = ?,
            internet_access = ?,
            device_access = ?,
            income_category = ?,
            career_interest = ?,
            preferred_response_format = ?,
            preferred_language = ?,
            is_profile_completed = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        name, student_class, student_stream, disability_type,
        internet_access, device_access, income_category, career_interest,
        preferred_response_format, preferred_language, student_id
    ))
    db.commit()

    # Re-fetch updated profile
    cursor.execute('''
        SELECT id, name, roll_number, roll_code, class, stream, disability_type, 
               internet_access, device_access, income_category, career_interest, 
               preferred_response_format, preferred_language, is_profile_completed,
               created_at, updated_at
        FROM students
        WHERE id = ?
    ''', (student_id,))
    updated_row = cursor.fetchone()
    updated_profile = dict(updated_row)
    updated_profile['is_profile_completed'] = bool(updated_profile['is_profile_completed'])

    # Determine dynamic subjects corresponding to updated curriculum
    subjects = get_subjects_for_class_and_stream(db, updated_profile['class'], updated_profile['stream'])

    return jsonify({
        'status': 'ok',
        'message': 'Student profile updated and onboarding completed successfully',
        'profile': updated_profile,
        'subjects': subjects
    }), 200


# ============================================================================
# STEP 6: ATTENDANCE, SCHOLARSHIPS, CAREER & ACCESSIBILITY ENDPOINTS
# ============================================================================

@student_bp.route('/attendance', methods=['GET'])
@require_auth
@require_role('student')
def get_student_attendance():
    """
    Retrieve authentic attendance trends and recent marks for authenticated student.
    Used for automated page reading and the dedicated Attendance view.
    """
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    # Query attendance records joined with subject names
    cursor.execute('''
        SELECT a.id, a.subject_id, s.name as subject_name, s.code as subject_code,
               a.total_classes, a.attended_classes, a.attendance_percentage,
               a.trend, a.consecutive_missed, a.updated_at
        FROM attendance a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.student_id = ?
        ORDER BY s.name ASC
    ''', (student_id,))
    attendance_records = [dict(r) for r in cursor.fetchall()]

    # Aggregate overall attendance
    total_classes = sum(r['total_classes'] for r in attendance_records)
    attended_classes = sum(r['attended_classes'] for r in attendance_records)
    overall_percentage = round((attended_classes / total_classes * 100), 1) if total_classes > 0 else 0.0

    # Determine dominant trend
    trends = [r['trend'] for r in attendance_records]
    if 'declining' in trends:
        dominant_trend = 'declining'
    elif 'improving' in trends:
        dominant_trend = 'improving'
    else:
        dominant_trend = 'stable'

    # Query recent marks/academic assessments
    cursor.execute('''
        SELECT m.id, m.subject_id, s.name as subject_name,
               m.assessment_name, m.marks_obtained, m.total_marks,
               m.percentage, m.grade, m.recorded_at
        FROM marks m
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.student_id = ?
        ORDER BY m.recorded_at DESC
    ''', (student_id,))
    marks_records = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        'status': 'ok',
        'student_id': student_id,
        'overall_percentage': overall_percentage,
        'total_classes': total_classes,
        'attended_classes': attended_classes,
        'dominant_trend': dominant_trend,
        'attendance': attendance_records,
        'marks': marks_records
    }), 200


@student_bp.route('/scholarships', methods=['GET'])
@require_auth
@require_role('student')
def get_student_scholarships():
    """
    Step 8: Retrieve scholarships deterministically matched against student's unified profile.
    Calculates exact deadline urgency, days remaining, transparent match explanations,
    and voice-ready summary for automated page reading.
    """
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    # Query student profile
    cursor.execute('''
        SELECT id, name, class, stream, disability_type, income_category
        FROM students
        WHERE id = ?
    ''', (student_id,))
    st = cursor.fetchone()
    if not st:
        return jsonify({'error': 'Student not found', 'status': 404}), 404

    st_dict = dict(st)
    academic_pct = get_student_academic_percentage(db, student_id)
    st_dict['academic_percentage'] = academic_pct
    st_dict['category'] = 'General' # Default social category

    # Query all active scholarships
    cursor.execute('''
        SELECT id, title, provider, description, amount, eligible_class, eligible_stream,
               min_academic_percentage, category_requirement, max_income_limit,
               disability_required, deadline, application_url, is_active, created_at, updated_at
        FROM scholarships
        WHERE is_active = 1
        ORDER BY deadline ASC
    ''')
    all_rows = [dict(r) for r in cursor.fetchall()]

    evaluated_all = []
    matched_scholarships = []

    for s in all_rows:
        urgency = calculate_deadline_urgency(s['deadline'])
        s['urgency'] = urgency

        eval_result = evaluate_scholarship_eligibility(st_dict, s)
        s['is_eligible'] = eval_result['is_eligible']
        s['match_explanation'] = eval_result['match_explanation']
        s['criteria_breakdown'] = eval_result['criteria_breakdown']
        s['match_reasons'] = eval_result['reasons_satisfied'] if eval_result['is_eligible'] else []

        evaluated_all.append(s)
        if eval_result['is_eligible'] and not urgency['is_expired']:
            matched_scholarships.append(s)

    # Sort opportunities: Matched first -> Upcoming active deadlines -> Expired last
    sorted_all = sort_scholarships(evaluated_all)
    sorted_matched = sort_scholarships(matched_scholarships)

    voice_summary = generate_voice_summary(sorted_matched)

    return jsonify({
        'status': 'ok',
        'student_id': student_id,
        'student_name': st_dict['name'],
        'academic_percentage': academic_pct,
        'count': len(sorted_matched),
        'matched_count': len(sorted_matched),
        'total_active_count': len(sorted_all),
        'voice_summary': voice_summary,
        'scholarships': sorted_matched,
        'all_opportunities': sorted_all
    }), 200


@student_bp.route('/scholarships/matches', methods=['GET'])
@require_auth
@require_role('student')
def get_student_scholarship_matches():
    """Retrieve filtered view of student matched scholarships only."""
    return get_student_scholarships()


@student_bp.route('/scholarships/<int:scholarship_id>', methods=['GET'])
@require_auth
@require_role('student')
def get_student_scholarship_detail(scholarship_id):
    """
    Retrieve single scholarship detail with student-specific match explanation.
    """
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        SELECT id, name, class, stream, disability_type, income_category
        FROM students
        WHERE id = ?
    ''', (student_id,))
    st = cursor.fetchone()
    if not st:
        return jsonify({'error': 'Student not found', 'status': 404}), 404

    st_dict = dict(st)
    academic_pct = get_student_academic_percentage(db, student_id)
    st_dict['academic_percentage'] = academic_pct
    st_dict['category'] = 'General'

    cursor.execute('''
        SELECT id, title, provider, description, amount, eligible_class, eligible_stream,
               min_academic_percentage, category_requirement, max_income_limit,
               disability_required, deadline, application_url, is_active, created_at, updated_at
        FROM scholarships
        WHERE id = ? AND is_active = 1
    ''', (scholarship_id,))
    row = cursor.fetchone()
    if not row:
        return jsonify({'error': 'Scholarship not found or inactive', 'status': 404}), 404

    s = dict(row)
    urgency = calculate_deadline_urgency(s['deadline'])
    s['urgency'] = urgency

    eval_result = evaluate_scholarship_eligibility(st_dict, s)
    s['is_eligible'] = eval_result['is_eligible']
    s['match_explanation'] = eval_result['match_explanation']
    s['criteria_breakdown'] = eval_result['criteria_breakdown']
    s['match_reasons'] = eval_result['reasons_satisfied'] if eval_result['is_eligible'] else []

    return jsonify({
        'status': 'ok',
        'student_id': student_id,
        'scholarship': s
    }), 200


@student_bp.route('/career', methods=['GET'])
@require_auth
@require_role('student')
def get_student_career():
    """
    Retrieve 4-stage career roadmap matching the student's career interest or requested role.
    Includes related roles, key skills, recommended projects, curated learning resources, and voice summary.
    """
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        SELECT id, name, class, stream, career_interest, preferred_response_format, preferred_language
        FROM students WHERE id = ?
    ''', (student_id,))
    st = cursor.fetchone()
    if not st:
        return jsonify({'error': 'Student not found', 'status': 404}), 404
    st_dict = dict(st)

    requested_role_id = request.args.get('role_id', type=int)
    career_interest = st_dict['career_interest'] or 'Artificial Intelligence'

    if requested_role_id:
        cursor.execute('''
            SELECT cr.id, cr.career_field_id, cr.title, cr.description, cr.average_salary_range,
                   cr.related_roles, cr.suggested_learning_areas,
                   cf.name as field_name, cf.icon as field_icon
            FROM career_roles cr
            JOIN career_fields cf ON cr.career_field_id = cf.id
            WHERE cr.id = ?
        ''', (requested_role_id,))
        role_row = cursor.fetchone()
    else:
        # Match career role
        cursor.execute('''
            SELECT cr.id, cr.career_field_id, cr.title, cr.description, cr.average_salary_range,
                   cr.related_roles, cr.suggested_learning_areas,
                   cf.name as field_name, cf.icon as field_icon
            FROM career_roles cr
            JOIN career_fields cf ON cr.career_field_id = cf.id
            WHERE cr.title LIKE ? OR cf.name LIKE ?
            LIMIT 1
        ''', (f"%{career_interest}%", f"%{career_interest}%"))
        role_row = cursor.fetchone()

        # Fallback to first role if interest not directly matched
        if not role_row:
            cursor.execute('''
                SELECT cr.id, cr.career_field_id, cr.title, cr.description, cr.average_salary_range,
                       cr.related_roles, cr.suggested_learning_areas,
                       cf.name as field_name, cf.icon as field_icon
                FROM career_roles cr
                JOIN career_fields cf ON cr.career_field_id = cf.id
                LIMIT 1
            ''')
            role_row = cursor.fetchone()

    role = dict(role_row) if role_row else {}
    if role and role.get('related_roles'):
        role['related_roles_list'] = [r.strip() for r in role['related_roles'].split(',') if r.strip()]
    else:
        role['related_roles_list'] = []

    # Query 4-stage roadmap steps for this role
    steps = []
    if role:
        cursor.execute('''
            SELECT id, career_role_id, stage, stage_order, title, description, key_skills, recommended_projects, learning_resources
            FROM career_roadmap_steps
            WHERE career_role_id = ?
            ORDER BY stage_order ASC
        ''', (role['id'],))
        for r in cursor.fetchall():
            step_dict = dict(r)
            try:
                step_dict['learning_resources_list'] = json.loads(step_dict.get('learning_resources') or '[]')
            except Exception:
                step_dict['learning_resources_list'] = []
            steps.append(step_dict)

    # Query all career fields for switching/browsing
    cursor.execute('SELECT id, name, description, icon FROM career_fields ORDER BY id ASC')
    all_fields = [dict(f) for f in cursor.fetchall()]
    for f in all_fields:
        cursor.execute('SELECT id, title, description, average_salary_range FROM career_roles WHERE career_field_id = ?', (f['id'],))
        f['roles'] = [dict(cr) for cr in cursor.fetchall()]

    voice_summary = generate_career_voice_summary(st_dict, role, steps)

    return jsonify({
        'status': 'ok',
        'student_id': student_id,
        'career_interest': career_interest,
        'role': role,
        'steps': steps,
        'all_fields': all_fields,
        'voice_summary': voice_summary
    }), 200


@student_bp.route('/career/fields', methods=['GET'])
@require_auth
@require_role('student')
def get_career_fields():
    """Retrieve all available career fields with associated roles."""
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT id, name, description, icon FROM career_fields ORDER BY id ASC')
    fields = [dict(f) for f in cursor.fetchall()]
    for f in fields:
        cursor.execute('''
            SELECT id, title, description, average_salary_range, related_roles, suggested_learning_areas
            FROM career_roles WHERE career_field_id = ?
        ''', (f['id'],))
        f['roles'] = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        'status': 'ok',
        'fields': fields
    }), 200


@student_bp.route('/career/roles/<int:role_id>', methods=['GET'])
@require_auth
@require_role('student')
def get_career_role_detail(role_id):
    """Retrieve details for a specific career role including its 4-stage roadmap."""
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        SELECT id, name, class, career_interest, preferred_response_format, preferred_language
        FROM students WHERE id = ?
    ''', (student_id,))
    st = cursor.fetchone()
    st_dict = dict(st) if st else {}

    cursor.execute('''
        SELECT cr.id, cr.career_field_id, cr.title, cr.description, cr.average_salary_range,
               cr.related_roles, cr.suggested_learning_areas,
               cf.name as field_name, cf.icon as field_icon
        FROM career_roles cr
        JOIN career_fields cf ON cr.career_field_id = cf.id
        WHERE cr.id = ?
    ''', (role_id,))
    role_row = cursor.fetchone()
    if not role_row:
        return jsonify({'error': 'Career role not found', 'status': 404}), 404

    role = dict(role_row)
    if role.get('related_roles'):
        role['related_roles_list'] = [r.strip() for r in role['related_roles'].split(',') if r.strip()]
    else:
        role['related_roles_list'] = []

    cursor.execute('''
        SELECT id, career_role_id, stage, stage_order, title, description, key_skills, recommended_projects, learning_resources
        FROM career_roadmap_steps
        WHERE career_role_id = ?
        ORDER BY stage_order ASC
    ''', (role_id,))
    steps = []
    for r in cursor.fetchall():
        step_dict = dict(r)
        try:
            step_dict['learning_resources_list'] = json.loads(step_dict.get('learning_resources') or '[]')
        except Exception:
            step_dict['learning_resources_list'] = []
        steps.append(step_dict)

    voice_summary = generate_career_voice_summary(st_dict, role, steps)

    return jsonify({
        'status': 'ok',
        'role': role,
        'steps': steps,
        'voice_summary': voice_summary
    }), 200


@student_bp.route('/accessibility', methods=['GET'])
@require_auth
@require_role('student')
def get_student_accessibility():
    """Retrieve accessibility preferences for the authenticated student."""
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        SELECT id, name, disability_type, preferred_response_format, preferred_language
        FROM students WHERE id = ?
    ''', (student_id,))
    st = cursor.fetchone()
    if not st:
        return jsonify({'error': 'Student not found', 'status': 404}), 404

    return jsonify({
        'status': 'ok',
        'accessibility': dict(st)
    }), 200


@student_bp.route('/accessibility', methods=['PUT'])
@require_auth
@require_role('student')
def update_student_accessibility():
    """Update accessibility format and language preferences."""
    user = get_current_user()
    student_id = user['student_id']
    data = request.get_json() or {}

    preferred_response_format = data.get('preferred_response_format')
    preferred_language = data.get('preferred_language')

    db = get_db()
    cursor = db.cursor()

    if preferred_response_format and preferred_response_format in VALID_FORMATS:
        cursor.execute('UPDATE students SET preferred_response_format = ? WHERE id = ?',
                       (preferred_response_format, student_id))
    if preferred_language and preferred_language in VALID_LANGUAGES:
        cursor.execute('UPDATE students SET preferred_language = ? WHERE id = ?',
                       (preferred_language, student_id))

    db.commit()

    cursor.execute('''
        SELECT id, name, disability_type, preferred_response_format, preferred_language
        FROM students WHERE id = ?
    ''', (student_id,))
    st = dict(cursor.fetchone())

    return jsonify({
        'status': 'ok',
        'message': 'Accessibility preferences updated successfully',
        'accessibility': st
    }), 200


@student_bp.route('/resources', methods=['GET'])
@require_auth
@require_role('student')
def get_student_resources():
    """
    Retrieve accessible learning resources tailored to the student's class,
    connectivity, device, format, and language preferences.
    """
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        SELECT id, name, class, stream, disability_type, internet_access,
               device_access, preferred_response_format, preferred_language
        FROM students WHERE id = ?
    ''', (student_id,))
    st = cursor.fetchone()
    if not st:
        return jsonify({'error': 'Student not found', 'status': 404}), 404

    st_dict = dict(st)
    st_class = st_dict['class']

    # Query params
    filter_format = request.args.get('format')
    filter_connectivity = request.args.get('connectivity')
    search_query = request.args.get('search')
    downloadable_only = request.args.get('downloadable')

    clean_num = st_class.replace('Class ', '').strip()
    cursor.execute('''
        SELECT r.id, r.title, r.resource_type, r.format, r.subject_id, s.name as subject_name,
               r.class, r.content_url, r.access_requirement, r.is_downloadable, r.language,
               r.estimated_size_mb, r.description, r.has_captions, r.has_transcript
        FROM resources r
        LEFT JOIN subjects s ON r.subject_id = s.id
        WHERE r.class = ? OR r.class = ? OR r.class = 'All'
        ORDER BY r.id ASC
    ''', (st_class, clean_num))
    records = [dict(row) for row in cursor.fetchall()]

    # Filter downloadable if requested
    if downloadable_only and str(downloadable_only).lower() in ('1', 'true'):
        records = [r for r in records if r.get('is_downloadable')]

    # Evaluate and rank using resource engine
    recommended = recommend_resources(
        st_dict,
        records,
        filter_format=filter_format,
        filter_connectivity=filter_connectivity,
        search_query=search_query
    )

    offline_count = sum(1 for r in recommended if r.get('is_downloadable'))
    voice_summary = generate_resource_voice_summary(st_dict, recommended)

    return jsonify({
        'status': 'ok',
        'student_id': student_id,
        'student_profile': {
            'class': st_dict['class'],
            'internet_access': st_dict['internet_access'],
            'device_access': st_dict['device_access'],
            'preferred_response_format': st_dict['preferred_response_format'],
            'preferred_language': st_dict['preferred_language'],
            'disability_type': st_dict['disability_type']
        },
        'count': len(recommended),
        'offline_available_count': offline_count,
        'voice_summary': voice_summary,
        'resources': recommended
    }), 200


@student_bp.route('/resources/<int:resource_id>', methods=['GET'])
@require_auth
@require_role('student')
def get_resource_detail(resource_id):
    """Retrieve single resource detail with personalized suitability evaluation."""
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        SELECT id, name, class, stream, disability_type, internet_access,
               device_access, preferred_response_format, preferred_language
        FROM students WHERE id = ?
    ''', (student_id,))
    st = cursor.fetchone()
    if not st:
        return jsonify({'error': 'Student not found', 'status': 404}), 404
    st_dict = dict(st)

    cursor.execute('''
        SELECT r.id, r.title, r.resource_type, r.format, r.subject_id, s.name as subject_name,
               r.class, r.content_url, r.access_requirement, r.is_downloadable, r.language,
               r.estimated_size_mb, r.description, r.has_captions, r.has_transcript
        FROM resources r
        LEFT JOIN subjects s ON r.subject_id = s.id
        WHERE r.id = ?
    ''', (resource_id,))
    row = cursor.fetchone()
    if not row:
        return jsonify({'error': 'Resource not found', 'status': 404}), 404

    res = dict(row)
    eval_result = evaluate_resource_suitability(st_dict, res)
    res.update(eval_result)

    return jsonify({
        'status': 'ok',
        'student_id': student_id,
        'resource': res
    }), 200


@student_bp.route('/resources/recommended', methods=['GET'])
@require_auth
@require_role('student')
def get_recommended_resources_only():
    """Retrieve top recommended resources for authenticated student."""
    user = get_current_user()
    student_id = user['student_id']

    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        SELECT id, name, class, stream, disability_type, internet_access,
               device_access, preferred_response_format, preferred_language
        FROM students WHERE id = ?
    ''', (student_id,))
    st = cursor.fetchone()
    if not st:
        return jsonify({'error': 'Student not found', 'status': 404}), 404
    st_dict = dict(st)

    clean_num = st_dict['class'].replace('Class ', '').strip()
    cursor.execute('''
        SELECT r.id, r.title, r.resource_type, r.format, r.subject_id, s.name as subject_name,
               r.class, r.content_url, r.access_requirement, r.is_downloadable, r.language,
               r.estimated_size_mb, r.description, r.has_captions, r.has_transcript
        FROM resources r
        LEFT JOIN subjects s ON r.subject_id = s.id
        WHERE r.class = ? OR r.class = ? OR r.class = 'All'
        ORDER BY r.id ASC
    ''', (st_dict['class'], clean_num))
    records = [dict(row) for row in cursor.fetchall()]

    recommended = recommend_resources(st_dict, records)
    top_picks = [r for r in recommended if r.get('suitability_score', 0) >= 50][:5]
    voice_summary = generate_resource_voice_summary(st_dict, top_picks)

    return jsonify({
        'status': 'ok',
        'student_id': student_id,
        'count': len(top_picks),
        'voice_summary': voice_summary,
        'resources': top_picks
    }), 200


@student_bp.route('/support-priority', methods=['GET'])
@require_auth
@require_role('student')
def get_student_support_priority():
    """
    Retrieve academic support priority, composite risk score, and explainable reasons.
    Strictly bound to authenticated student's session.
    """
    user = get_current_user()
    student_id = user.get('student_id')
    if not student_id:
        return jsonify({'error': 'Student identity not bound', 'status': 403}), 403

    db = get_db()
    result = calculate_support_priority(db, student_id)
    if not result:
        return jsonify({'error': 'Student record not found', 'status': 404}), 404

    return jsonify({
        'status': 'ok',
        'student_id': student_id,
        'support_priority': result['support_priority'],
        'status_label': result['status_label'],
        'composite_risk_score': result['composite_risk_score'],
        'metrics': result['metrics'],
        'reasons': result['reasons'],
        'guidance': result['guidance']
    }), 200


@student_bp.route('/academic-summary', methods=['GET'])
@require_auth
@require_role('student')
def get_student_academic_summary():
    """
    Retrieve comprehensive academic diagnostic summary, confidence metrics,
    subject-level flags, and attempt history for the authenticated student.
    """
    user = get_current_user()
    student_id = user.get('student_id')
    if not student_id:
        return jsonify({'error': 'Student identity not bound', 'status': 403}), 403

    db = get_db()
    result = calculate_support_priority(db, student_id)
    if not result:
        return jsonify({'error': 'Student record not found', 'status': 404}), 404

    return jsonify({
        'status': 'ok',
        'data': result
    }), 200


@student_bp.route('/recommendations', methods=['GET'])
@require_auth
@require_role('student')
def get_student_personalized_recommendations():
    """
    Retrieve top 3 personalized BKT-driven lesson recommendations for authenticated student.
    Enforces strict own-data security: student can only view their own recommendations.
    """
    user = get_current_user()
    authenticated_student_id = user.get('student_id')
    if not authenticated_student_id:
        return jsonify({'error': 'Student identity not bound', 'status': 403}), 403

    # Security check: prevent query parameter tampering to inspect another student
    requested_student_id = request.args.get('student_id')
    if requested_student_id:
        try:
            req_id = int(requested_student_id)
            if req_id != authenticated_student_id:
                return jsonify({
                    'error': 'Access denied: You are only authorized to access your own recommendations',
                    'status': 403
                }), 403
        except ValueError:
            return jsonify({'error': 'Invalid student_id parameter', 'status': 400}), 400

    from backend.app.services.recommendation_service import get_student_recommendations
    db = get_db()
    recommendations = get_student_recommendations(db, authenticated_student_id, limit=3)

    return jsonify({
        'status': 'ok',
        'student_id': authenticated_student_id,
        'count': len(recommendations),
        'recommendations': recommendations
    }), 200




