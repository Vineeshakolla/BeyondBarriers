import os
import sys

# Ensure the project root directory is on the python sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', '1') == '1'
    print("=" * 55)
    print(f">> Beyond Barriers Flask Backend starting on port {port}")
    print(f">> Health check: http://localhost:{port}/api/health")
    print("=" * 55)
    app.run(host='0.0.0.0', port=port, debug=debug, threaded=True, use_reloader=False)
