from flask import Blueprint, jsonify
from backend.database.db import get_db

health_bp = Blueprint('health', __name__, url_prefix='/api')

@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify backend operational readiness and DB connectivity.
    Expected response contains: {"status": "ok"}
    """
    db_status = 'disconnected'
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT value FROM system_meta WHERE key = ?', ('schema_version',))
        version_row = cursor.fetchone()
        cursor.execute('SELECT COUNT(*) as cnt FROM students')
        student_cnt = cursor.fetchone()['cnt']
        db_status = 'connected'
        return jsonify({
            'status': 'ok',
            'app': 'Beyond Barriers',
            'tagline': 'Personalized and Inclusive Education Support System',
            'database': db_status,
            'schema_version': version_row['value'] if version_row else 'unknown',
            'seeded_students': student_cnt
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'ok',
            'app': 'Beyond Barriers',
            'database': f'error: {str(e)}'
        }), 200

@health_bp.route('/health/db', methods=['GET'])
def db_health_check():
    """
    Dedicated database health check endpoint (Requirement 47).
    Verifies connection, required tables, and foreign keys.
    """
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('PRAGMA foreign_keys;')
        fk_row = cursor.fetchone()
        fk_enabled = bool(fk_row[0]) if fk_row else False

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row['name'] for row in cursor.fetchall()]

        required_tables = ['users', 'students', 'mentors', 'parents', 'administrators', 'subjects', 'modules', 'tests']
        all_exist = all(tbl in tables for tbl in required_tables)

        return jsonify({
            'database': 'ok' if all_exist else 'incomplete',
            'foreign_keys': fk_enabled,
            'tables_count': len(tables)
        }), 200
    except Exception as e:
        return jsonify({
            'database': 'error',
            'foreign_keys': False,
            'message': str(e)
        }), 500

