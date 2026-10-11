"""
Beyond Barriers - Parent Academic Overview API Routes
Blueprint: parent_bp (/api/parent)

Enforces strict single-child scope authorization:
- Parents can ONLY access academic and learning information for their single linked child.
- Under NO circumstances can a parent query or browse other students.
- Only mentor notes explicitly marked share_with_parent = 1 are visible. Private notes are strictly shielded.
"""

from flask import Blueprint, request, jsonify
from backend.database.db import get_db
from backend.app.utils.auth import require_auth, require_role, get_current_user
from backend.app.services.support_engine import calculate_support_priority

parent_bp = Blueprint('parent', __name__, url_prefix='/api/parent')


def _get_parent_and_child():
    """
    Retrieve authenticated parent profile and linked child record directly from database.
    Returns (parent_dict, child_dict, error_response_tuple)
    """
    user = get_current_user()
    parent_id = user.get('parent_id')
    if not parent_id:
        return None, None, (jsonify({'error': 'Authenticated user is not linked to a parent record', 'status': 403}), 403)

    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        SELECT id, name, email, linked_student_id, relationship
        FROM parents
        WHERE id = ?
    ''', (parent_id,))
    parent_row = cursor.fetchone()
    if not parent_row:
        return None, None, (jsonify({'error': 'Parent profile not found', 'status': 404}), 404)

    parent = dict(parent_row)
    linked_student_id = parent.get('linked_student_id')
    if not linked_student_id:
        return parent, None, (jsonify({
            'error': 'No linked student is available. Please contact the administrator.',
            'status': 404
        }), 404)

    cursor.execute('''
        SELECT id, name, roll_number, roll_code, class, stream
        FROM students
        WHERE id = ?
    ''', (linked_student_id,))
    child_row = cursor.fetchone()
    if not child_row:
        return parent, None, (jsonify({
            'error': 'No linked student is available. Please contact the administrator.',
            'status': 404
        }), 404)

    child = dict(child_row)
    return parent, child, None


@parent_bp.route('/dashboard', methods=['GET'])
@require_auth
@require_role('parent')
def get_parent_dashboard():
    """
    Retrieve comprehensive overview of the parent's single linked child:
    - Attendance summary and trend
    - Academic marks and latest grades
    - Module learning progress
    - Academic support priority and constructive guidance
    - Mentor notes marked share_with_parent = 1 (private notes strictly hidden)
    """
    parent, child, err = _get_parent_and_child()
    if err:
        return err

    db = get_db()
    cursor = db.cursor()
    student_id = child['id']

    # 1. Attendance Summary
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

    # Determine overall attendance trend
    trends = [r['trend'] for r in att_rows]
    overall_trend = 'declining' if 'declining' in trends else ('improving' if 'improving' in trends else 'stable')

    # 2. Marks Summary
    cursor.execute('''
        SELECT m.id, m.assessment_name, m.marks_obtained, m.total_marks, m.percentage, m.grade, m.recorded_at,
               s.name as subject_name, s.code as subject_code
        FROM marks m
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.student_id = ?
        ORDER BY m.recorded_at DESC
    ''', (student_id,))
    marks_rows = [dict(r) for r in cursor.fetchall()]
    avg_marks_pct = round(sum(r['percentage'] for r in marks_rows) / len(marks_rows), 1) if marks_rows else 0.0

    # 3. Learning Progress Summary
    cursor.execute('''
        SELECT sm.status, sm.attempts, sm.best_score, sm.last_score, sm.completed_at,
               m.module_number, m.title as module_title, s.name as subject_name
        FROM student_modules sm
        JOIN modules m ON sm.module_id = m.id
        JOIN subjects s ON m.subject_id = s.id
        WHERE sm.student_id = ?
        ORDER BY s.name ASC, m.module_number ASC
    ''', (student_id,))
    module_rows = [dict(r) for r in cursor.fetchall()]
    completed_modules = sum(1 for m in module_rows if m['status'] == 'completed')
    total_modules = len(module_rows)
    progress_pct = round((completed_modules / total_modules * 100.0), 1) if total_modules > 0 else 0.0

    # 4. Support Priority Analysis
    analysis = calculate_support_priority(db, student_id)

    # 5. Shared Mentor Notes ONLY (share_with_parent = 1)
    # CRITICAL: Private mentor notes (share_with_parent = 0) MUST NOT be returned!
    cursor.execute('''
        SELECT mn.id, mn.note, mn.created_at, mn.updated_at,
               m.name as mentor_name, m.department as mentor_department
        FROM mentor_notes mn
        JOIN mentors m ON mn.mentor_id = m.id
        WHERE mn.student_id = ? AND mn.share_with_parent = 1
        ORDER BY mn.created_at DESC
    ''', (student_id,))
    shared_notes = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        'status': 'ok',
        'parent': {
            'id': parent['id'],
            'name': parent['name'],
            'relationship': parent['relationship']
        },
        'child': child,
        'summary_cards': {
            'attendance_percentage': overall_att_pct,
            'attendance_trend': overall_trend,
            'average_marks_percentage': avg_marks_pct,
            'completed_modules': completed_modules,
            'total_modules': total_modules,
            'learning_progress_percentage': progress_pct,
            'support_priority': analysis['support_priority'] if analysis else 'Normal',
            'status_label': analysis['status_label'] if analysis else 'On Track',
            'shared_notes_count': len(shared_notes)
        },
        'attendance': {
            'overall_percentage': overall_att_pct,
            'trend': overall_trend,
            'records': att_rows
        },
        'marks': marks_rows,
        'learning_progress': {
            'completed_modules': completed_modules,
            'total_modules': total_modules,
            'percentage': progress_pct,
            'modules': module_rows
        },
        'support_priority': {
            'priority': analysis['support_priority'] if analysis else 'Normal',
            'status_label': analysis['status_label'] if analysis else 'On Track',
            'guidance': analysis['guidance'] if analysis else []
        },
        'shared_notes': shared_notes
    }), 200


@parent_bp.route('/child', methods=['GET'])
@require_auth
@require_role('parent')
def get_parent_child():
    """Retrieve child profile and academic snapshot for the authenticated parent."""
    parent, child, err = _get_parent_and_child()
    if err:
        return err

    return jsonify({
        'status': 'ok',
        'parent': parent,
        'child': child
    }), 200


@parent_bp.route('/child/attendance', methods=['GET'])
@require_auth
@require_role('parent')
def get_parent_child_attendance():
    """Retrieve attendance records for parent's linked child."""
    parent, child, err = _get_parent_and_child()
    if err:
        return err

    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        SELECT a.total_classes, a.attended_classes, a.attendance_percentage, a.trend, a.consecutive_missed,
               s.name as subject_name, s.code as subject_code
        FROM attendance a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.student_id = ?
        ORDER BY s.name ASC
    ''', (child['id'],))
    records = [dict(r) for r in cursor.fetchall()]

    total_classes = sum(r['total_classes'] for r in records)
    attended_classes = sum(r['attended_classes'] for r in records)
    overall_pct = round((attended_classes / total_classes * 100.0), 1) if total_classes > 0 else 0.0

    return jsonify({
        'status': 'ok',
        'child_id': child['id'],
        'child_name': child['name'],
        'overall_percentage': overall_pct,
        'attendance': records
    }), 200


@parent_bp.route('/child/marks', methods=['GET'])
@require_auth
@require_role('parent')
def get_parent_child_marks():
    """Retrieve academic marks and grades for parent's linked child."""
    parent, child, err = _get_parent_and_child()
    if err:
        return err

    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        SELECT m.id, m.assessment_name, m.marks_obtained, m.total_marks, m.percentage, m.grade, m.recorded_at,
               s.name as subject_name, s.code as subject_code
        FROM marks m
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.student_id = ?
        ORDER BY m.recorded_at DESC
    ''', (child['id'],))
    marks = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        'status': 'ok',
        'child_id': child['id'],
        'child_name': child['name'],
        'marks': marks
    }), 200


@parent_bp.route('/child/progress', methods=['GET'])
@require_auth
@require_role('parent')
def get_parent_child_progress():
    """Retrieve module completion progress for parent's linked child."""
    parent, child, err = _get_parent_and_child()
    if err:
        return err

    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        SELECT sm.status, sm.attempts, sm.best_score, sm.last_score, sm.completed_at,
               m.module_number, m.title as module_title, s.name as subject_name
        FROM student_modules sm
        JOIN modules m ON sm.module_id = m.id
        JOIN subjects s ON m.subject_id = s.id
        WHERE sm.student_id = ?
        ORDER BY s.name ASC, m.module_number ASC
    ''', (child['id'],))
    modules = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        'status': 'ok',
        'child_id': child['id'],
        'child_name': child['name'],
        'learning_progress': modules
    }), 200


@parent_bp.route('/child/support', methods=['GET'])
@require_auth
@require_role('parent')
def get_parent_child_support():
    """Retrieve constructive academic support signals for parent's linked child."""
    parent, child, err = _get_parent_and_child()
    if err:
        return err

    db = get_db()
    analysis = calculate_support_priority(db, child['id'])

    return jsonify({
        'status': 'ok',
        'child_id': child['id'],
        'child_name': child['name'],
        'support_priority': analysis['support_priority'] if analysis else 'Normal',
        'status_label': analysis['status_label'] if analysis else 'On Track',
        'guidance': analysis['guidance'] if analysis else []
    }), 200


@parent_bp.route('/child/shared-notes', methods=['GET'])
@require_auth
@require_role('parent')
def get_parent_child_shared_notes():
    """
    Retrieve mentor notes explicitly shared with parent (share_with_parent = 1).
    Private mentor notes (share_with_parent = 0) are strictly shielded and never returned.
    """
    parent, child, err = _get_parent_and_child()
    if err:
        return err

    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        SELECT mn.id, mn.note, mn.created_at, mn.updated_at,
               m.name as mentor_name, m.department as mentor_department
        FROM mentor_notes mn
        JOIN mentors m ON mn.mentor_id = m.id
        WHERE mn.student_id = ? AND mn.share_with_parent = 1
        ORDER BY mn.created_at DESC
    ''', (child['id'],))
    notes = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        'status': 'ok',
        'child_id': child['id'],
        'child_name': child['name'],
        'shared_notes': notes
    }), 200
