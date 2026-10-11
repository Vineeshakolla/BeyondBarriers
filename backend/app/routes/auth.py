from flask import Blueprint, request, jsonify, g
from werkzeug.security import check_password_hash, generate_password_hash
from backend.database.db import get_db
from backend.app.utils.auth import (
    create_session, delete_session, extract_token_from_request,
    get_current_user, require_auth, require_role,
    verify_student_scope, verify_mentor_roll_scope,
    verify_parent_child_scope, verify_admin_privacy
)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user in the persistent database.
    Accepts: { name, username, password, role }
    Validates input, checks username uniqueness, hashes password,
    creates student & user records, and returns session token.
    """
    data = request.get_json() or {}
    name = str(data.get('name', '')).strip()
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip()
    role = str(data.get('role', 'student')).strip().lower()

    if not name:
        return jsonify({'error': 'Name is required', 'status': 400}), 400
    if not username or len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters', 'status': 400}), 400
    if not password or len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters', 'status': 400}), 400
    if role not in ('student', 'mentor', 'parent', 'administrator'):
        role = 'student'

    db = get_db()
    cursor = db.cursor()

    # Check if username already exists (case-insensitive)
    cursor.execute('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', (username,))
    if cursor.fetchone():
        return jsonify({'error': 'Username already exists', 'status': 400}), 400

    password_hash = generate_password_hash(password)

    student_id = None
    if role == 'student':
        # Generate next available roll number and code
        cursor.execute('SELECT COALESCE(MAX(roll_number), 100) + 1 AS next_roll FROM students')
        next_roll = cursor.fetchone()['next_roll']
        roll_code = f"CS-{next_roll}"

        cursor.execute('''
            INSERT INTO students (
                name, roll_number, roll_code, class, stream, disability_type,
                internet_access, device_access, income_category, career_interest,
                preferred_response_format, preferred_language, is_profile_completed
            ) VALUES (
                ?, ?, ?, 'Class 10', 'General', 'none',
                'full', 'personal_laptop', '<3L', 'Artificial Intelligence',
                'visual', 'en', 0
            )
        ''', (name, next_roll, roll_code))
        student_id = cursor.lastrowid

    cursor.execute('''
        INSERT INTO users (username, password_hash, role, student_id, is_active, is_demo)
        VALUES (?, ?, ?, ?, 1, 0)
    ''', (username, password_hash, role, student_id))
    user_id = cursor.lastrowid

    db.commit()

    token = create_session(user_id)

    # Fetch created student profile
    profile = {}
    if student_id:
        cursor.execute('''
            SELECT id, name, roll_number, roll_code, class, stream, disability_type,
                   internet_access, device_access, income_category, career_interest,
                   preferred_response_format, preferred_language, is_profile_completed
            FROM students WHERE id = ?
        ''', (student_id,))
        st = cursor.fetchone()
        if st:
            profile = dict(st)
            profile['is_profile_completed'] = bool(profile['is_profile_completed'])

    user = {
        'id': user_id,
        'username': username,
        'role': role,
        'profile': profile
    }

    return jsonify({
        'status': 'ok',
        'message': 'Registration successful',
        'token': token,
        'user': user
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user via username and password.
    Enforces password hash verification using Werkzeug.
    Returns session token and safe user profile.
    """
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({
            'error': 'Username and password are required',
            'status': 400
        }), 400

    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        SELECT id, username, password_hash, role, is_active,
               student_id, mentor_id, parent_id, administrator_id
        FROM users
        WHERE LOWER(username) = LOWER(?)
    ''', (username,))
    user_row = cursor.fetchone()
    cursor.close()

    if not user_row or not check_password_hash(user_row['password_hash'], password):
        return jsonify({
            'error': 'Invalid username or password',
            'status': 401
        }), 401

    if not user_row['is_active']:
        return jsonify({
            'error': 'Account is inactive. Contact administration.',
            'status': 403
        }), 403

    user_data = dict(user_row)

    # Build safe user object & fetch role profile
    user = {
        'id': user_data['id'],
        'username': user_data['username'],
        'role': user_data['role'],
        'profile': {}
    }

    cursor_prof = db.cursor()
    if user_data['role'] == 'student' and user_data['student_id']:
        cursor_prof.execute('''
            SELECT id, name, roll_number, roll_code, class, stream, disability_type, 
                   internet_access, device_access, income_category, career_interest,
                   preferred_response_format, preferred_language, is_profile_completed
            FROM students WHERE id = ?
        ''', (user_data['student_id'],))
        st = cursor_prof.fetchone()
        if st:
            user['profile'] = dict(st)
    elif user_data['role'] == 'mentor' and user_data['mentor_id']:
        cursor_prof.execute('''
            SELECT id, name, email, department, assigned_roll_start, assigned_roll_end
            FROM mentors WHERE id = ?
        ''', (user_data['mentor_id'],))
        mt = cursor_prof.fetchone()
        if mt:
            user['profile'] = dict(mt)
    elif user_data['role'] == 'parent' and user_data['parent_id']:
        cursor_prof.execute('''
            SELECT p.id, p.name, p.email, p.linked_student_id, p.relationship,
                   s.name as child_name, s.roll_code as child_roll_code, s.roll_number as child_roll_number
            FROM parents p
            JOIN students s ON p.linked_student_id = s.id
            WHERE p.id = ?
        ''', (user_data['parent_id'],))
        pt = cursor_prof.fetchone()
        if pt:
            user['profile'] = dict(pt)
    elif user_data['role'] == 'administrator' and user_data['administrator_id']:
        cursor_prof.execute('''
            SELECT id, name, email, title
            FROM administrators WHERE id = ?
        ''', (user_data['administrator_id'],))
        adm = cursor_prof.fetchone()
        if adm:
            user['profile'] = dict(adm)

    cursor_prof.close()
    if db.isolation_level is not None:
        db.commit()

    token = create_session(user_data['id'])

    return jsonify({
        'status': 'ok',
        'message': 'Login successful',
        'token': token,
        'user': user
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """Invalidate current session token."""
    token = extract_token_from_request()
    delete_session(token)
    return jsonify({
        'status': 'ok',
        'message': 'Logged out successfully'
    }), 200

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_me():
    """Return currently authenticated identity and safe profile."""
    user = get_current_user()
    return jsonify({
        'authenticated': True,
        'user_id': user['id'],
        'username': user['username'],
        'role': user['role'],
        'profile': user.get('profile', {})
    }), 200

# ============================================================================
# ROLE-BASED TEST ENDPOINTS
# ============================================================================

@auth_bp.route('/test/student', methods=['GET'])
@require_role('student')
def test_student_role():
    user = get_current_user()
    return jsonify({
        'message': 'Student authorized',
        'role': user['role'],
        'student_id': user.get('student_id')
    }), 200

@auth_bp.route('/test/mentor', methods=['GET'])
@require_role('mentor')
def test_mentor_role():
    user = get_current_user()
    return jsonify({
        'message': 'Mentor authorized',
        'role': user['role'],
        'assigned_roll_start': user.get('profile', {}).get('assigned_roll_start'),
        'assigned_roll_end': user.get('profile', {}).get('assigned_roll_end')
    }), 200

@auth_bp.route('/test/parent', methods=['GET'])
@require_role('parent')
def test_parent_role():
    user = get_current_user()
    return jsonify({
        'message': 'Parent authorized',
        'role': user['role'],
        'linked_child_id': user.get('profile', {}).get('linked_student_id')
    }), 200

@auth_bp.route('/test/admin', methods=['GET'])
@require_role('administrator')
def test_admin_role():
    user = get_current_user()
    return jsonify({
        'message': 'Administrator authorized',
        'role': user['role']
    }), 200

# ============================================================================
# SCOPE-BASED TEST ENDPOINTS
# ============================================================================

@auth_bp.route('/test/student-data/<int:student_id>', methods=['GET'])
@require_auth
def test_student_data_scope(student_id):
    """
    Test student scope:
    - Student requesting own ID -> ALLOW (200)
    - Student requesting another ID -> DENY (403)
    """
    allowed, err = verify_student_scope(student_id)
    if not allowed:
        return err

    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT id, name, roll_code, class, stream FROM students WHERE id = ?', (student_id,))
    st = cursor.fetchone()
    if not st:
        return jsonify({'error': 'Student not found', 'status': 404}), 404

    return jsonify({
        'message': f'Access granted to student {student_id} data',
        'student': dict(st)
    }), 200

@auth_bp.route('/test/mentor-student/<int:roll_number>', methods=['GET'])
@require_role('mentor')
def test_mentor_roll_scope(roll_number):
    """
    Test mentor roll range scope:
    - In-range roll -> ALLOW (200)
    - Out-of-range roll -> DENY (403)
    """
    allowed, err = verify_mentor_roll_scope(roll_number)
    if not allowed:
        return err

    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT id, name, roll_number, roll_code, class FROM students WHERE roll_number = ?', (roll_number,))
    st = cursor.fetchone()
    return jsonify({
        'message': f'Access granted to in-range student roll {roll_number}',
        'student': dict(st) if st else None
    }), 200

@auth_bp.route('/test/parent-child/<int:student_id>', methods=['GET'])
@require_role('parent')
def test_parent_child_scope(student_id):
    """
    Test parent 1-child link scope:
    - Linked child -> ALLOW (200)
    - Other student -> DENY (403)
    """
    allowed, err = verify_parent_child_scope(student_id)
    if not allowed:
        return err

    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT id, name, roll_code, class FROM students WHERE id = ?', (student_id,))
    st = cursor.fetchone()
    return jsonify({
        'message': f'Access granted to linked child data (ID: {student_id})',
        'student': dict(st) if st else None
    }), 200

@auth_bp.route('/test/admin-private-data', methods=['GET'])
@require_auth
def test_admin_private_data_scope():
    """
    Test administrator privacy barrier:
    - Administrators are forbidden from accessing student academic/disability data.
    """
    allowed, err = verify_admin_privacy()
    if not allowed:
        return err

    return jsonify({
        'message': 'Access allowed for non-admin role'
    }), 200
