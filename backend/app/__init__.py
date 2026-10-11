import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.database.db import close_db, init_db
from backend.app.routes.health import health_bp
from backend.app.routes.auth import auth_bp
from backend.app.routes.student import student_bp
from backend.app.routes.learning import learning_bp
from backend.app.routes.mentor import mentor_bp
from backend.app.routes.parent import parent_bp
from backend.app.routes.admin import admin_bp

def create_app(config_class=Config):
    """
    Application factory for Beyond Barriers Flask backend.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure CORS for local development with the Vite React frontend
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    app.config.get('CORS_ORIGIN', 'http://localhost:5173'),
                    "http://127.0.0.1:5173",
                    "http://localhost:5173"
                ]
            }
        },
        supports_credentials=True
    )

    # Register DB teardown
    app.teardown_appcontext(close_db)

    # Initialize SQLite database file & connection
    with app.app_context():
        init_db(app)

    # Register route blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(learning_bp)
    app.register_blueprint(mentor_bp)
    app.register_blueprint(parent_bp)
    app.register_blueprint(admin_bp)

    # Welcome root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'Beyond Barriers Flask Backend is Running',
            'health_check': '/api/health',
            'status': 'online'
        }), 200

    # JSON 404 handler
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found', 'status': 404}), 404

    # JSON 500 handler
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error', 'status': 500}), 500

    return app
