import os
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Base application configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'beyond-barriers-dev-secret-key-2026')
    _default_db = os.path.join(BASE_DIR, 'database', 'beyond_barriers.db')
    if 'onedrive' in BASE_DIR.lower():
        _user_home = os.path.expanduser('~')
        _local_db_dir = os.path.join(_user_home, '.beyond_barriers_db')
        os.makedirs(_local_db_dir, exist_ok=True)
        _local_db_path = os.path.join(_local_db_dir, 'beyond_barriers.db')
        if not os.path.exists(_local_db_path) and os.path.exists(_default_db):
            import shutil
            try:
                shutil.copyfile(_default_db, _local_db_path)
            except Exception:
                pass
        DATABASE_PATH = os.environ.get('DATABASE_PATH', _local_db_path)
    else:
        DATABASE_PATH = os.environ.get('DATABASE_PATH', _default_db)
    CORS_ORIGIN = os.environ.get('CORS_ORIGIN', 'http://localhost:5173')
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    DEBUG = os.environ.get('FLASK_DEBUG', '1') == '1'
