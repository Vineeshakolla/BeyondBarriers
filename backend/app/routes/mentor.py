"""
Beyond Barriers - Mentor Academic Support API Routes
Blueprint: mentor_bp (/api/mentor)

Enforces strict roll-range authorization:
- Mentors can ONLY query students within assigned_roll_start <= roll_number <= assigned_roll_end.
- Requests for students outside this scope are strictly rejected with 403 Forbidden.
"""

from flask import Blueprint, request, jsonify
from backend.database.db import get_db
from backend.app.utils.auth import require_auth, require_role, get_current_user
from backend.app.services.support_engine import calculate_support_priority

mentor_bp = Blueprint('mentor', __name__, url_prefix='/api/mentor')


@mentor_bp.route('/dashboard', methods=['GET'])
@mentor_bp.route('/students', methods=['GET'])
@mentor_bp.route('/students-priority', methods=['GET'])
@require_auth
@require_role('mentor')
def get_assigned_students_priority():
    """
    Retrieve academic support priority for all students assigned to the authenticated mentor.
    Strictly scoped to mentor's assigned_roll_start and assigned_roll_end.
    """
    user = get_current_user()
    mentor_id = user.get('mentor_id')
    if not mentor_id:
        return jsonify({'error': 'Authenticated user is not linked to a mentor record', 'status': 403}), 403

    db = get_db()
    cursor = db.cursor()

    # Fetch mentor details
    cursor.execute('''
        SELECT id, name, email, department, assigned_roll_start, assigned_roll_end
        FROM mentors WHERE id = ?
    ''', (mentor_id,))
    mentor_row = cursor.fetchone()
    if not mentor_row:
        return jsonify({'error': 'Mentor profile not found', 'status': 404}), 404

    mentor = dict(mentor_row)
    roll_start = mentor['assigned_roll_start']
    roll_end = mentor['assigned_roll_end']

    # Query assigned students strictly within assigned roll range
    cursor.execute('''
        SELECT id, name, roll_number, roll_code, class, stream
        FROM students
        WHERE roll_number >= ? AND roll_number <= ?
        ORDER BY roll_number ASC
    ''', (roll_start, roll_end))
    student_rows = cursor.fetchall()

    students_list = []
    counts = {
        'total': len(student_rows),
        'needs_support': 0,
        'monitor': 0,
        'normal': 0,
        'insufficient_data': 0
    }

    # Weight map for sorting by urgency
    urgency_weights = {
        'Needs Support': 0,
        'Monitor': 1,
        'Normal': 2,
        'Insufficient Data': 3
    }

    for st in student_rows:
        analysis = calculate_support_priority(db, st['id'])
        if analysis:
            priority = analysis['support_priority']
            if priority == 'Needs Support':
                counts['needs_support'] += 1
            elif priority == 'Monitor':
                counts['monitor'] += 1
            elif priority == 'Normal':
                counts['normal'] += 1
            else:
                counts['insufficient_data'] += 1

            students_list.append({
                'id': st['id'],
                'name': st['name'],
                'roll_number': st['roll_number'],
                'roll_code': st['roll_code'],
                'class': st['class'],
                'stream': st['stream'],
                'support_priority': priority,
                'status_label': analysis['status_label'],
                'composite_risk_score': analysis['composite_risk_score'],
                'metrics': {
                    'overall_attendance': analysis['metrics']['overall_attendance'],
                    'attendance_trend': analysis['metrics']['attendance_trend'],
                    'average_test_score': analysis['metrics']['average_test_score'],
                    'latest_score': analysis['metrics']['latest_score'],
                    'score_trend': analysis['metrics']['score_trend'],
                    'guessing_rate': analysis['metrics']['guessing_rate'],
                    'struggling_modules_count': analysis['metrics']['struggling_modules_count']
                },
                'reasons': analysis['reasons'],
                'guidance': analysis['guidance'][:2],
                'subject_support_summary': [
                    {'name': ss['subject_name'], 'status': ss['status']}
                    for ss in analysis['subject_support']
                ]
            })

    # Sort students by priority urgency, then composite risk score descending, then roll number
    students_list.sort(key=lambda s: (
        urgency_weights.get(s['support_priority'], 4),
        -s['composite_risk_score'],
        s['roll_number']
    ))

    return jsonify({
        'status': 'ok',
        'mentor': {
            'id': mentor['id'],
            'name': mentor['name'],
            'department': mentor['department'],
            'assigned_roll_start': roll_start,
            'assigned_roll_end': roll_end
        },
        'summary_counts': counts,
        'students': students_list
    }), 200


def _check_mentor_student_scope(cursor, mentor_id, student_id):
    """
    Helper to verify that student_id is strictly within the mentor's assigned roll range.
    Returns (allowed: bool, student_record, error_message, status_code)
    """
    cursor.execute('SELECT assigned_roll_start, assigned_roll_end FROM mentors WHERE id = ?', (mentor_id,))
    mentor_row = cursor.fetchone()
    if not mentor_row:
        return False, None, 'Mentor profile not found', 404

    roll_start = mentor_row['assigned_roll_start']
    roll_end = mentor_row['assigned_roll_end']

    cursor.execute('SELECT id, name, roll_number, roll_code, class, stream FROM students WHERE id = ?', (student_id,))
    student_row = cursor.fetchone()
    if not student_row:
        return False, None, 'Student not found', 404

    student_roll = student_row['roll_number']
    if not (roll_start <= student_roll <= roll_end):
        return False, student_row, f'Access denied. Student roll number {student_roll} is outside your assigned cohort (Rolls {roll_start} to {roll_end}).', 403

    return True, student_row, None, 200


@mentor_bp.route('/student/<int:student_id>/academic-support', methods=['GET'])
@mentor_bp.route('/students/<int:student_id>/support', methods=['GET'])
@require_auth
@require_role('mentor')
def get_student_academic_support_detail(student_id):
    """
    Retrieve full academic diagnostic detail for an individual student.
    Strictly verifies that student is within the authenticated mentor's assigned roll range.
    """
    user = get_current_user()
    mentor_id = user.get('mentor_id')
    if not mentor_id:
        return jsonify({'error': 'Authenticated user is not linked to a mentor record', 'status': 403}), 403

    db = get_db()
    cursor = db.cursor()

    allowed, student_row, err_msg, status_code = _check_mentor_student_scope(cursor, mentor_id, student_id)
    if not allowed:
        return jsonify({'error': err_msg, 'status': status_code}), status_code

    analysis = calculate_support_priority(db, student_id)
    if not analysis:
        return jsonify({'error': 'Unable to calculate support signals', 'status': 500}), 500

    return jsonify({
        'status': 'ok',
        'student': analysis['student'],
        'support_priority': analysis['support_priority'],
        'status_label': analysis['status_label'],
        'composite_risk_score': analysis['composite_risk_score'],
        'metrics': analysis['metrics'],
        'reasons': analysis['reasons'],
        'guidance': analysis['guidance'],
        'subject_support': analysis['subject_support'],
        'recent_attempts': analysis['recent_attempts'],
        'recent_marks': analysis['recent_marks']
    }), 200


@mentor_bp.route('/students/<int:student_id>', methods=['GET'])
@require_auth
@require_role('mentor')
def get_mentor_student_detail(student_id):
    """
    Retrieve comprehensive educational support details for an assigned student:
    - Basic student info
    - Attendance summary and subject records
    - Academic marks records
    - Module learning progress and test performance
    - Support priority and explainable reasons
    - Mentor notes for this student
    Sensitive medical/disability/income data is NOT exposed.
    """
    user = get_current_user()
    mentor_id = user.get('mentor_id')
    if not mentor_id:
        return jsonify({'error': 'Authenticated user is not linked to a mentor record', 'status': 403}), 403

    db = get_db()
    cursor = db.cursor()

    allowed, student_row, err_msg, status_code = _check_mentor_student_scope(cursor, mentor_id, student_id)
    if not allowed:
        return jsonify({'error': err_msg, 'status': status_code}), status_code

    st = dict(student_row)

    # 1. Attendance
    cursor.execute('''
        SELECT a.total_classes, a.attended_classes, a.attendance_percentage, a.trend, a.consecutive_missed,
               s.name as subject_name, s.code as subject_code
        FROM attendance a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.student_id = ?
        ORDER BY s.name ASC
    ''', (student_id,))
    att_rows = [dict(r) for r in cursor.fetchall()]
    total_classes = sum(r['total_classes'] for r in att_rows)
    attended_classes = sum(r['attended_classes'] for r in att_rows)
    overall_att_pct = round((attended_classes / total_classes * 100.0), 1) if total_classes > 0 else 0.0

    # 2. Marks
    cursor.execute('''
        SELECT m.id, m.assessment_name, m.marks_obtained, m.total_marks, m.percentage, m.grade, m.recorded_at,
               s.name as subject_name, s.code as subject_code
        FROM marks m
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.student_id = ?
        ORDER BY m.recorded_at DESC
    ''', (student_id,))
    marks_rows = [dict(r) for r in cursor.fetchall()]

    # 3. Learning Progress (modules)
    cursor.execute('''
        SELECT sm.status, sm.attempts, sm.best_score, sm.last_score, sm.last_confidence, sm.completed_at,
               m.module_number, m.title as module_title, s.name as subject_name
        FROM student_modules sm
        JOIN modules m ON sm.module_id = m.id
        JOIN subjects s ON m.subject_id = s.id
        WHERE sm.student_id = ?
        ORDER BY s.name ASC, m.module_number ASC
    ''', (student_id,))
    module_rows = [dict(r) for r in cursor.fetchall()]

    # 4. Recent Test Attempts
    cursor.execute('''
        SELECT ta.id, ta.score, ta.total_questions, ta.correct_count, ta.sure_count, ta.guessing_count,
               ta.completed_at, t.title as test_title, s.name as subject_name
        FROM test_attempts ta
        JOIN tests t ON ta.test_id = t.id
        JOIN modules m ON t.module_id = m.id
        JOIN subjects s ON m.subject_id = s.id
        WHERE ta.student_id = ?
        ORDER BY ta.completed_at DESC
        LIMIT 10
    ''', (student_id,))
    test_rows = [dict(r) for r in cursor.fetchall()]

    # 5. Support Priority Analysis
    analysis = calculate_support_priority(db, student_id)

    # 6. Mentor Notes
    cursor.execute('''
        SELECT mn.id, mn.mentor_id, mn.student_id, mn.note, mn.share_with_parent,
               mn.follow_up_completed, mn.created_at, mn.updated_at,
               m.name as mentor_name
        FROM mentor_notes mn
        JOIN mentors m ON mn.mentor_id = m.id
        WHERE mn.student_id = ?
        ORDER BY mn.created_at DESC
    ''', (student_id,))
    notes_rows = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        'status': 'ok',
        'student': {
            'id': st['id'],
            'name': st['name'],
            'roll_number': st['roll_number'],
            'roll_code': st['roll_code'],
            'class': st['class'],
            'stream': st['stream']
        },
        'attendance': {
            'overall_percentage': overall_att_pct,
            'total_classes': total_classes,
            'attended_classes': attended_classes,
            'records': att_rows
        },
        'marks': marks_rows,
        'learning_progress': module_rows,
        'test_attempts': test_rows,
        'support_priority': {
            'priority': analysis['support_priority'] if analysis else 'Normal',
            'status_label': analysis['status_label'] if analysis else 'Stable',
            'composite_risk_score': analysis['composite_risk_score'] if analysis else 0.0,
            'metrics': analysis['metrics'] if analysis else {},
            'reasons': analysis['reasons'] if analysis else [],
            'guidance': analysis['guidance'] if analysis else [],
            'subject_support': analysis['subject_support'] if analysis else []
        },
        'mentor_notes': notes_rows
    }), 200


@mentor_bp.route('/students/<int:student_id>/notes', methods=['GET'])
@require_auth
@require_role('mentor')
def get_mentor_student_notes(student_id):
    """
    List all notes for an assigned student.
    Strictly blocked if student is outside mentor's assigned roll range.
    """
    user = get_current_user()
    mentor_id = user.get('mentor_id')
    if not mentor_id:
        return jsonify({'error': 'Authenticated user is not linked to a mentor record', 'status': 403}), 403

    db = get_db()
    cursor = db.cursor()

    allowed, student_row, err_msg, status_code = _check_mentor_student_scope(cursor, mentor_id, student_id)
    if not allowed:
        return jsonify({'error': err_msg, 'status': status_code}), status_code

    cursor.execute('''
        SELECT mn.id, mn.mentor_id, mn.student_id, mn.note, mn.share_with_parent,
               mn.follow_up_completed, mn.created_at, mn.updated_at,
               m.name as mentor_name
        FROM mentor_notes mn
        JOIN mentors m ON mn.mentor_id = m.id
        WHERE mn.student_id = ?
        ORDER BY mn.created_at DESC
    ''', (student_id,))
    notes = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        'status': 'ok',
        'student_id': student_id,
        'notes': notes
    }), 200


@mentor_bp.route('/students/<int:student_id>/notes', methods=['POST'])
@require_auth
@require_role('mentor')
def create_mentor_student_note(student_id):
    """
    Record an educational support observation/note for an assigned student.
    Strictly blocked if student is outside mentor's assigned roll range.
    """
    user = get_current_user()
    mentor_id = user.get('mentor_id')
    if not mentor_id:
        return jsonify({'error': 'Authenticated user is not linked to a mentor record', 'status': 403}), 403

    db = get_db()
    cursor = db.cursor()

    allowed, student_row, err_msg, status_code = _check_mentor_student_scope(cursor, mentor_id, student_id)
    if not allowed:
        return jsonify({'error': err_msg, 'status': status_code}), status_code

    data = request.get_json() or {}
    note_text = str(data.get('note', '')).strip()
    if not note_text:
        return jsonify({'error': 'Note content is required.', 'status': 400}), 400

    share_with_parent = 1 if data.get('share_with_parent') in (True, 1, '1', 'true') else 0
    follow_up_completed = 1 if data.get('follow_up_completed') in (True, 1, '1', 'true') else 0

    cursor.execute('''
        INSERT INTO mentor_notes (mentor_id, student_id, note, share_with_parent, follow_up_completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ''', (mentor_id, student_id, note_text, share_with_parent, follow_up_completed))
    db.commit()
    new_note_id = cursor.lastrowid

    cursor.execute('''
        SELECT mn.id, mn.mentor_id, mn.student_id, mn.note, mn.share_with_parent,
               mn.follow_up_completed, mn.created_at, mn.updated_at,
               m.name as mentor_name
        FROM mentor_notes mn
        JOIN mentors m ON mn.mentor_id = m.id
        WHERE mn.id = ?
    ''', (new_note_id,))
    created_note = dict(cursor.fetchone())

    return jsonify({
        'status': 'ok',
        'message': 'Mentor note created successfully.',
        'note': created_note
    }), 201


@mentor_bp.route('/notes/<int:note_id>', methods=['PUT', 'PATCH'])
@require_auth
@require_role('mentor')
def update_mentor_note(note_id):
    """
    Update a mentor note (edit content, toggle parent sharing, or toggle follow-up).
    Strictly verifies that the note belongs to an assigned student within mentor's roll range.
    """
    user = get_current_user()
    mentor_id = user.get('mentor_id')
    if not mentor_id:
        return jsonify({'error': 'Authenticated user is not linked to a mentor record', 'status': 403}), 403

    db = get_db()
    cursor = db.cursor()

    cursor.execute('SELECT id, mentor_id, student_id, note, share_with_parent, follow_up_completed FROM mentor_notes WHERE id = ?', (note_id,))
    note_row = cursor.fetchone()
    if not note_row:
        return jsonify({'error': 'Mentor note not found.', 'status': 404}), 404

    note = dict(note_row)

    # Verify that the student is within this mentor's cohort
    allowed, student_row, err_msg, status_code = _check_mentor_student_scope(cursor, mentor_id, note['student_id'])
    if not allowed:
        return jsonify({'error': f'Access denied. Cannot modify notes for students outside your assigned cohort. {err_msg}', 'status': 403}), 403

    data = request.get_json() or {}
    updated_note = str(data.get('note', note['note'])).strip()
    if not updated_note:
        return jsonify({'error': 'Note content cannot be empty.', 'status': 400}), 400

    share_with_parent = note['share_with_parent']
    if 'share_with_parent' in data:
        share_with_parent = 1 if data['share_with_parent'] in (True, 1, '1', 'true') else 0

    follow_up_completed = note['follow_up_completed']
    if 'follow_up_completed' in data:
        follow_up_completed = 1 if data['follow_up_completed'] in (True, 1, '1', 'true') else 0

    cursor.execute('''
        UPDATE mentor_notes
        SET note = ?, share_with_parent = ?, follow_up_completed = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (updated_note, share_with_parent, follow_up_completed, note_id))
    db.commit()

    cursor.execute('''
        SELECT mn.id, mn.mentor_id, mn.student_id, mn.note, mn.share_with_parent,
               mn.follow_up_completed, mn.created_at, mn.updated_at,
               m.name as mentor_name
        FROM mentor_notes mn
        JOIN mentors m ON mn.mentor_id = m.id
        WHERE mn.id = ?
    ''', (note_id,))
    updated_row = dict(cursor.fetchone())

    return jsonify({
        'status': 'ok',
        'message': 'Mentor note updated successfully.',
        'note': updated_row
    }), 200

