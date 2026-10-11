import secrets
import datetime
from functools import wraps
from flask import request, jsonify, g
from backend.database.db import get_db

import os
import sqlite3

TOKEN_EXPIRY_DAYS = 7

def _get_db_path():
    try:
        from flask import current_app
        return current_app.config['DATABASE_PATH']
    except Exception:
        return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'database', 'beyond_barriers.db')

def create_session(user_id):
    """Generate a secure session token and persist in the database."""
    token = secrets.token_hex(32)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=TOKEN_EXPIRY_DAYS)
    expires_at_str = expires_at.strftime('%Y-%m-%d %H:%M:%S')
    
    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        INSERT INTO sessions (token, user_id, expires_at)
        VALUES (?, ?, ?)
    ''', (token, user_id, expires_at_str))
    if db.isolation_level is not None:
        db.commit()
    cursor.close()
    return token

def delete_session(token):
    """Invalidate a session token in the database."""
    if not token:
        return
    db = get_db()
    cursor = db.cursor()
    cursor.execute('DELETE FROM sessions WHERE token = ?', (token,))
    if db.isolation_level is not None:
        db.commit()
    cursor.close()

def extract_token_from_request():
    """Extract bearer token from Authorization header or X-Session-Token."""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:].strip()
    return request.headers.get('X-Session-Token', '').strip()

def get_current_user():
    """
    Look up current authenticated user based on session token.
    Determines user identity server-side from database, never trusting client parameters.
    """
    if hasattr(g, 'current_user') and g.current_user is not None:
        return g.current_user

    token = extract_token_from_request()
    if not token:
        g.current_user = None
        return None

    db = get_db()
    cursor = db.cursor()
    
    # Check session validity and expiration
    cursor.execute('''
        SELECT s.token, s.user_id, s.expires_at, 
               u.id as user_id, u.username, u.role, u.is_active,
               u.student_id, u.mentor_id, u.parent_id, u.administrator_id
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND u.is_active = 1
    ''', (token,))
    session_row = cursor.fetchone()

    if not session_row:
        g.current_user = None
        return None

    # Verify expiration
    expires_at_val = session_row['expires_at']
    try:
        if isinstance(expires_at_val, datetime.datetime):
            expires_at = expires_at_val
        elif isinstance(expires_at_val, str):
            expires_at = datetime.datetime.strptime(expires_at_val, '%Y-%m-%d %H:%M:%S')
        else:
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=1)

        if expires_at < datetime.datetime.utcnow():
            delete_session(token)
            g.current_user = None
            return None
    except Exception:
        pass

    user = {
        'id': session_row['user_id'],
        'username': session_row['username'],
        'role': session_row['role'],
        'student_id': session_row['student_id'],
        'mentor_id': session_row['mentor_id'],
        'parent_id': session_row['parent_id'],
        'administrator_id': session_row['administrator_id'],
        'token': token
    }

    # Fetch role-specific details
    if user['role'] == 'student' and user['student_id']:
        cursor.execute('''
            SELECT id, name, roll_number, roll_code, class, stream, disability_type, 
                   internet_access, device_access, income_category, career_interest,
                   preferred_response_format, preferred_language, is_profile_completed
            FROM students WHERE id = ?
        ''', (user['student_id'],))
        st = cursor.fetchone()
        if st:
            user['profile'] = dict(st)
    elif user['role'] == 'mentor' and user['mentor_id']:
        cursor.execute('''
            SELECT id, name, email, department, assigned_roll_start, assigned_roll_end
            FROM mentors WHERE id = ?
        ''', (user['mentor_id'],))
        mt = cursor.fetchone()
        if mt:
            user['profile'] = dict(mt)
    elif user['role'] == 'parent' and user['parent_id']:
        cursor.execute('''
            SELECT p.id, p.name, p.email, p.linked_student_id, p.relationship,
                   s.name as child_name, s.roll_code as child_roll_code, s.roll_number as child_roll_number
            FROM parents p
            JOIN students s ON p.linked_student_id = s.id
            WHERE p.id = ?
        ''', (user['parent_id'],))
        pt = cursor.fetchone()
        if pt:
            user['profile'] = dict(pt)
    elif user['role'] == 'administrator' and user['administrator_id']:
        cursor.execute('''
            SELECT id, name, email, title
            FROM administrators WHERE id = ?
        ''', (user['administrator_id'],))
        adm = cursor.fetchone()
        if adm:
            user['profile'] = dict(adm)

    g.current_user = user
    return user

# ============================================================================
# AUTHORIZATION DECORATORS
# ============================================================================

def require_auth(f):
    """Ensure the user is authenticated via a valid session token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required. Please log in.', 'status': 401}), 401
        return f(*args, **kwargs)
    return decorated

def require_role(*allowed_roles):
    """
    Ensure the authenticated user belongs to one of the allowed roles.
    Never trusts client-provided roles; enforces role from backend database.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({'error': 'Authentication required. Please log in.', 'status': 401}), 401
            
            if user['role'] not in allowed_roles:
                return jsonify({
                    'error': f'Access forbidden. Role required: {", ".join(allowed_roles)}. Your role: {user["role"]}',
                    'status': 403
                }), 403
            
            return f(*args, **kwargs)
        return decorated
    return decorator

# ============================================================================
# SCOPE-BASED ACCESS CONTROL HELPERS
# ============================================================================

def verify_student_scope(target_student_id):
    """
    Enforce student data boundary.
    A student may only access their own student record.
    Returns (allowed: bool, error_response: tuple | None)
    """
    user = get_current_user()
    if not user:
        return False, (jsonify({'error': 'Authentication required', 'status': 401}), 401)
    
    if user['role'] == 'student':
        if user.get('student_id') != target_student_id:
            return False, (jsonify({
                'error': 'Access denied: Students can only access their own data.',
                'status': 403
            }), 403)
        return True, None

    # If mentor, check roll range
    if user['role'] == 'mentor':
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT roll_number FROM students WHERE id = ?', (target_student_id,))
        st = cursor.fetchone()
        if not st:
            return False, (jsonify({'error': 'Student not found', 'status': 404}), 404)
        return verify_mentor_roll_scope(st['roll_number'])

    # If parent, check linked child
    if user['role'] == 'parent':
        if user.get('profile', {}).get('linked_student_id') != target_student_id:
            return False, (jsonify({
                'error': 'Access denied: Parents can only access their linked child data.',
                'status': 403
            }), 403)
        return True, None

    # Administrators CANNOT access student academic/medical data
    if user['role'] == 'administrator':
        return False, (jsonify({
            'error': 'Access denied: Administrator role is restricted from accessing student records.',
            'status': 403
        }), 403)

    return False, (jsonify({'error': 'Unauthorized', 'status': 403}), 403)

def verify_mentor_roll_scope(target_roll_number):
    """
    Enforce mentor cohort roll-number range boundary.
    Mentors can only access students where:
    assigned_roll_start <= target_roll_number <= assigned_roll_end
    """
    user = get_current_user()
    if not user or user['role'] != 'mentor':
        return False, (jsonify({'error': 'Mentor access required', 'status': 403}), 403)

    mentor_profile = user.get('profile', {})
    start = mentor_profile.get('assigned_roll_start')
    end = mentor_profile.get('assigned_roll_end')

    if start is None or end is None:
        return False, (jsonify({'error': 'Mentor roll range not configured', 'status': 403}), 403)

    if not (start <= target_roll_number <= end):
        return False, (jsonify({
            'error': f'Access denied: Student roll {target_roll_number} is outside your assigned cohort (Roll {start}–{end}).',
            'status': 403
        }), 403)

    return True, None

def verify_parent_child_scope(target_student_id):
    """
    Enforce parent single-child boundary.
    Parents can ONLY access their one linked child.
    """
    user = get_current_user()
    if not user or user['role'] != 'parent':
        return False, (jsonify({'error': 'Parent access required', 'status': 403}), 403)

    parent_profile = user.get('profile', {})
    linked_id = parent_profile.get('linked_student_id')

    if linked_id != target_student_id:
        return False, (jsonify({
            'error': f'Access denied: You are only authorized to view your linked child (ID: {linked_id}).',
            'status': 403
        }), 403)

    return True, None

def verify_admin_privacy():
    """
    Enforce administrator privacy shield.
    Administrators are strictly prohibited from accessing student marks, attendance, or disability data.
    """
    user = get_current_user()
    if user and user['role'] == 'administrator':
        return False, (jsonify({
            'error': 'Access denied: Administrator role is restricted from accessing student academic, attendance, or disability data.',
            'status': 403
        }), 403)
    return True, None
