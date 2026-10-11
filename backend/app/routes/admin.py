"""
Beyond Barriers - Administrator Scholarship Routes (Step 8)
===========================================================
Dedicated admin management endpoints for scholarships and financial aid postings.

CRITICAL PRIVACY RULE:
- Only users with role 'administrator' may access these endpoints.
- Under NO circumstances do these endpoints or views expose student marks,
  attendance, test performance, confidence, disability info, or academic
  support priority.
"""

import re
import datetime
from flask import Blueprint, request, jsonify
from backend.database.db import get_db
from backend.app.utils.auth import require_auth, require_role, get_current_user
from backend.app.services.scholarship_engine import calculate_deadline_urgency, parse_deadline

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def is_valid_url(url):
    """Validate HTTP/HTTPS URL pattern."""
    if not url or not isinstance(url, str):
        return False
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE
    )
    return bool(url_pattern.match(url.strip()))

def is_valid_date(date_str):
    """Validate YYYY-MM-DD date."""
    return parse_deadline(date_str) is not None


# ============================================================================
# 0. ADMIN DASHBOARD OVERVIEW (SCHOLARSHIPS ONLY - ZERO STUDENT DATA)
# ============================================================================

@admin_bp.route('/dashboard', methods=['GET'])
@require_auth
@require_role('administrator')
def get_admin_dashboard():
    """
    Retrieve scholarship administration dashboard metrics:
    - Active vs inactive scholarship counts
    - Urgent deadlines closing soon
    - Recently posted scholarships
    CRITICAL PRIVACY ENFORCEMENT:
    Under NO circumstances does this endpoint query or expose student marks,
    attendance, learning progress, test attempts, disabilities, or support priority.
    """
    user = get_current_user()
    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        SELECT s.id, s.title, s.provider, s.amount, s.deadline, s.is_active, s.created_at, s.updated_at
        FROM scholarships s
        ORDER BY s.updated_at DESC, s.created_at DESC
    ''')
    rows = [dict(r) for r in cursor.fetchall()]

    active_count = 0
    inactive_count = 0
    closing_soon_list = []
    due_today_count = 0

    for row in rows:
        urgency = calculate_deadline_urgency(row['deadline'])
        row['urgency'] = urgency
        if row['is_active']:
            active_count += 1
            if urgency['urgency_state'] == 'due_today':
                due_today_count += 1
                closing_soon_list.append(row)
            elif urgency['urgency_state'] in ('closing_tomorrow', 'closing_soon'):
                closing_soon_list.append(row)
        else:
            inactive_count += 1

    # Sort closing soon by days remaining ascending
    closing_soon_list.sort(key=lambda x: x['urgency']['days_remaining'] if x['urgency']['days_remaining'] is not None else 999)

    return jsonify({
        'status': 'ok',
        'administrator': {
            'id': user.get('administrator_id') or user.get('id'),
            'name': user.get('profile', {}).get('name', 'Administrator'),
            'title': user.get('profile', {}).get('title', 'Scholarship Director')
        },
        'stats': {
            'total_scholarships': len(rows),
            'active_scholarships': active_count,
            'inactive_scholarships': inactive_count,
            'closing_soon': len(closing_soon_list),
            'due_today': due_today_count
        },
        'urgent_deadlines': closing_soon_list[:5],
        'recently_posted': rows[:5],
        'privacy_scope': {
            'domain': 'scholarship_administration_only',
            'student_academic_access': False,
            'disability_data_access': False
        }
    }), 200


# ============================================================================
# 1. LIST ALL SCHOLARSHIPS (ADMIN VIEW)
# ============================================================================

@admin_bp.route('/scholarships', methods=['GET'])
@require_auth
@require_role('administrator')
def get_admin_scholarships():
    """
    Retrieve all scholarship postings for administration.
    Includes active, inactive, and expired records.
    Never returns any student personal or academic data.
    """
    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        SELECT s.id, s.title, s.provider, s.description, s.amount,
               s.eligible_class, s.eligible_stream, s.min_academic_percentage,
               s.category_requirement, s.max_income_limit, s.disability_required,
               s.deadline, s.application_url, s.is_active, s.created_by,
               s.created_at, s.updated_at,
               u.username as created_by_username
        FROM scholarships s
        LEFT JOIN users u ON s.created_by = u.id
        ORDER BY s.is_active DESC, s.deadline ASC
    ''')
    rows = [dict(r) for r in cursor.fetchall()]

    active_count = 0
    inactive_count = 0
    urgent_count = 0

    formatted_list = []
    for row in rows:
        urgency = calculate_deadline_urgency(row['deadline'])
        row['urgency'] = urgency
        if row['is_active']:
            active_count += 1
            if urgency['urgency_state'] in ('due_today', 'closing_tomorrow', 'closing_soon'):
                urgent_count += 1
        else:
            inactive_count += 1
        formatted_list.append(row)

    return jsonify({
        'status': 'ok',
        'count': len(formatted_list),
        'stats': {
            'total': len(formatted_list),
            'active': active_count,
            'inactive': inactive_count,
            'urgent_deadlines': urgent_count
        },
        'scholarships': formatted_list
    }), 200


# ============================================================================
# 2. CREATE SCHOLARSHIP (ADMIN ACTION)
# ============================================================================

@admin_bp.route('/scholarships', methods=['POST'])
@require_auth
@require_role('administrator')
def create_scholarship():
    """
    Create a new scholarship posting.
    Validates required fields, date formats, and URLs.
    """
    user = get_current_user()
    data = request.get_json() or {}

    title = str(data.get('title', '')).strip()
    provider = str(data.get('provider', '')).strip()
    description = str(data.get('description', '')).strip()
    deadline = str(data.get('deadline', '')).strip()
    application_url = str(data.get('application_url', '')).strip()
    amount = str(data.get('amount', '₹50,000 / year')).strip() or '₹50,000 / year'
    eligible_class = str(data.get('eligible_class', 'Class 10')).strip() or 'Class 10'
    eligible_stream = str(data.get('eligible_stream', 'All')).strip() or 'All'
    category_requirement = str(data.get('category_requirement', 'All')).strip() or 'All'
    disability_required = 1 if data.get('disability_required') in (True, 1, '1', 'true') else 0
    is_active = 1 if data.get('is_active', 1) in (True, 1, '1', 'true') else 0

    # Validation
    errors = []
    if not title:
        errors.append('Scholarship title is required')
    if not provider:
        errors.append('Provider/organization name is required')
    if not description:
        errors.append('Description is required')
    if not deadline:
        errors.append('Application deadline is required')
    elif not is_valid_date(deadline):
        errors.append('Invalid deadline date. Must be valid YYYY-MM-DD format.')
    if not application_url:
        errors.append('Application URL is required')
    elif not is_valid_url(application_url):
        errors.append('Invalid application URL. Must start with http:// or https://')

    try:
        min_academic_percentage = float(data.get('min_academic_percentage', 0.0))
        if min_academic_percentage < 0.0 or min_academic_percentage > 100.0:
            errors.append('Academic percentage requirement must be between 0% and 100%')
    except (ValueError, TypeError):
        errors.append('Academic percentage requirement must be a valid number')
        min_academic_percentage = 0.0

    try:
        max_income_limit = float(data.get('max_income_limit', 0.0))
        if max_income_limit < 0.0:
            errors.append('Income limit cannot be negative')
    except (ValueError, TypeError):
        errors.append('Income limit must be a valid number')
        max_income_limit = 0.0

    if errors:
        return jsonify({
            'error': 'Validation failed',
            'details': errors,
            'status': 400
        }), 400

    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        INSERT INTO scholarships (
            title, provider, description, amount, eligible_class, eligible_stream,
            min_academic_percentage, category_requirement, max_income_limit,
            disability_required, deadline, application_url, is_active, created_by,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ''', (
        title, provider, description, amount, eligible_class, eligible_stream,
        min_academic_percentage, category_requirement, max_income_limit,
        disability_required, deadline, application_url, is_active, user['id']
    ))
    db.commit()
    new_id = cursor.lastrowid

    cursor.execute('SELECT * FROM scholarships WHERE id = ?', (new_id,))
    created_row = dict(cursor.fetchone())
    created_row['urgency'] = calculate_deadline_urgency(created_row['deadline'])

    return jsonify({
        'status': 'ok',
        'message': 'Scholarship created successfully',
        'scholarship': created_row
    }), 201


# ============================================================================
# 3. GET SINGLE SCHOLARSHIP (ADMIN VIEW)
# ============================================================================

@admin_bp.route('/scholarships/<int:scholarship_id>', methods=['GET'])
@require_auth
@require_role('administrator')
def get_admin_scholarship_detail(scholarship_id):
    """Retrieve detailed scholarship information for admin review or edit."""
    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        SELECT s.*, u.username as created_by_username
        FROM scholarships s
        LEFT JOIN users u ON s.created_by = u.id
        WHERE s.id = ?
    ''', (scholarship_id,))
    row = cursor.fetchone()
    if not row:
        return jsonify({'error': 'Scholarship not found', 'status': 404}), 404

    res_data = dict(row)
    res_data['urgency'] = calculate_deadline_urgency(res_data['deadline'])
    return jsonify({
        'status': 'ok',
        'scholarship': res_data
    }), 200


# ============================================================================
# 4. UPDATE SCHOLARSHIP (ADMIN ACTION)
# ============================================================================

@admin_bp.route('/scholarships/<int:scholarship_id>', methods=['PUT'])
@require_auth
@require_role('administrator')
def update_scholarship(scholarship_id):
    """Update scholarship posting fields with validation."""
    db = get_db()
    cursor = db.cursor()

    cursor.execute('SELECT id FROM scholarships WHERE id = ?', (scholarship_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Scholarship not found', 'status': 404}), 404

    data = request.get_json() or {}

    title = str(data.get('title', '')).strip()
    provider = str(data.get('provider', '')).strip()
    description = str(data.get('description', '')).strip()
    deadline = str(data.get('deadline', '')).strip()
    application_url = str(data.get('application_url', '')).strip()
    amount = str(data.get('amount', '₹50,000 / year')).strip() or '₹50,000 / year'
    eligible_class = str(data.get('eligible_class', 'Class 10')).strip() or 'Class 10'
    eligible_stream = str(data.get('eligible_stream', 'All')).strip() or 'All'
    category_requirement = str(data.get('category_requirement', 'All')).strip() or 'All'
    disability_required = 1 if data.get('disability_required') in (True, 1, '1', 'true') else 0
    is_active = 1 if data.get('is_active', 1) in (True, 1, '1', 'true') else 0

    errors = []
    if not title:
        errors.append('Scholarship title is required')
    if not provider:
        errors.append('Provider name is required')
    if not description:
        errors.append('Description is required')
    if not deadline:
        errors.append('Deadline is required')
    elif not is_valid_date(deadline):
        errors.append('Invalid deadline date format (YYYY-MM-DD)')
    if not application_url:
        errors.append('Application URL is required')
    elif not is_valid_url(application_url):
        errors.append('Invalid application URL format')

    try:
        min_academic_percentage = float(data.get('min_academic_percentage', 0.0))
        if min_academic_percentage < 0.0 or min_academic_percentage > 100.0:
            errors.append('Academic percentage must be between 0% and 100%')
    except (ValueError, TypeError):
        errors.append('Academic percentage must be a number')
        min_academic_percentage = 0.0

    try:
        max_income_limit = float(data.get('max_income_limit', 0.0))
    except (ValueError, TypeError):
        errors.append('Income limit must be a number')
        max_income_limit = 0.0

    if errors:
        return jsonify({'error': 'Validation failed', 'details': errors, 'status': 400}), 400

    cursor.execute('''
        UPDATE scholarships
        SET title = ?, provider = ?, description = ?, amount = ?,
            eligible_class = ?, eligible_stream = ?, min_academic_percentage = ?,
            category_requirement = ?, max_income_limit = ?, disability_required = ?,
            deadline = ?, application_url = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        title, provider, description, amount, eligible_class, eligible_stream,
        min_academic_percentage, category_requirement, max_income_limit,
        disability_required, deadline, application_url, is_active, scholarship_id
    ))
    db.commit()

    cursor.execute('SELECT * FROM scholarships WHERE id = ?', (scholarship_id,))
    updated_row = dict(cursor.fetchone())
    updated_row['urgency'] = calculate_deadline_urgency(updated_row['deadline'])

    return jsonify({
        'status': 'ok',
        'message': 'Scholarship updated successfully',
        'scholarship': updated_row
    }), 200


# ============================================================================
# 5. TOGGLE SCHOLARSHIP STATUS (ACTIVATE / DEACTIVATE)
# ============================================================================

@admin_bp.route('/scholarships/<int:scholarship_id>/status', methods=['PATCH'])
@require_auth
@require_role('administrator')
def toggle_scholarship_status(scholarship_id):
    """Quickly activate or deactivate a scholarship posting."""
    db = get_db()
    cursor = db.cursor()

    cursor.execute('SELECT id, is_active, title FROM scholarships WHERE id = ?', (scholarship_id,))
    row = cursor.fetchone()
    if not row:
        return jsonify({'error': 'Scholarship not found', 'status': 404}), 404

    data = request.get_json() or {}
    if 'is_active' in data:
        new_status = 1 if data['is_active'] in (True, 1, '1', 'true') else 0
    else:
        new_status = 0 if row['is_active'] else 1

    cursor.execute('''
        UPDATE scholarships
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (new_status, scholarship_id))
    db.commit()

    return jsonify({
        'status': 'ok',
        'message': f"Scholarship '{row['title']}' {'activated' if new_status else 'deactivated'} successfully",
        'scholarship_id': scholarship_id,
        'is_active': new_status
    }), 200


# ============================================================================
# 6. DELETE SCHOLARSHIP (ADMIN ACTION)
# ============================================================================

@admin_bp.route('/scholarships/<int:scholarship_id>', methods=['DELETE'])
@require_auth
@require_role('administrator')
def delete_scholarship(scholarship_id):
    """Remove a scholarship posting from the system."""
    db = get_db()
    cursor = db.cursor()

    cursor.execute('SELECT id, title FROM scholarships WHERE id = ?', (scholarship_id,))
    row = cursor.fetchone()
    if not row:
        return jsonify({'error': 'Scholarship not found', 'status': 404}), 404

    cursor.execute('DELETE FROM scholarships WHERE id = ?', (scholarship_id,))
    db.commit()

    return jsonify({
        'status': 'ok',
        'message': f"Scholarship '{row['title']}' removed successfully"
    }), 200
