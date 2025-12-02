import os
from app import create_app

# Determine environment from FLASK_ENV or default to development
env = os.getenv('FLASK_ENV', 'development')
app = create_app(env)

if __name__ == '__main__':
    # Use port from environment or default to 5001 for local development
    # (avoiding conflict with macOS AirPlay Receiver on port 5000)
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=(env == 'development'))
