"""
Exemple de serveur CDN simple en Python pour upload de fichiers

Installation:
    pip install flask flask-cors python-dotenv

Usage:
    python scripts/cdn-server-python-example.py

Variables d'environnement (.env):
    CDN_SECRET=your-secret-token-here
    CDN_PORT=3001
    UPLOAD_DIR=./uploads
    CDN_BASE_URL=http://localhost:3001
"""

import os
import sys
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
PORT = int(os.getenv('CDN_PORT', 3001))
CDN_SECRET = os.getenv('CDN_SECRET', 'your-secret-token')
UPLOAD_DIR = os.getenv('UPLOAD_DIR', './uploads')
CDN_BASE_URL = os.getenv('CDN_BASE_URL', f'http://localhost:{PORT}')

# Créer le dossier d'upload s'il n'existe pas
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Limite de taille de fichier (100MB)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    'stl', '3mf', 'obj', 'glb', 'gltf', 'fbx',  # 3D files
    'png', 'jpg', 'jpeg', 'gif', 'webp',  # Images
}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def authenticate():
    """Vérifier l'authentification Bearer token"""
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return jsonify({
            'success': False,
            'error': 'Missing or invalid authorization header'
        }), 401
    
    token = auth_header[7:]  # Remove "Bearer "
    
    if token != CDN_SECRET:
        return jsonify({
            'success': False,
            'error': 'Invalid token'
        }), 401
    
    return None


@app.route('/upload/', methods=['POST'])
def upload_file():
    """Endpoint d'upload de fichier"""
    # Vérifier l'authentification
    auth_error = authenticate()
    if auth_error:
        return auth_error
    
    if 'uploadfile' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file provided'
        }), 400
    
    file = request.files['uploadfile']
    
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected'
        }), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_DIR, filename)
        file.save(filepath)
        
        file_url = f"{CDN_BASE_URL}/{filename}"
        
        print(f"✅ File uploaded: {filename} ({os.path.getsize(filepath)} bytes)")
        
        return jsonify({
            'success': True,
            'url': file_url,
            'message': 'File uploaded successfully'
        })
    
    return jsonify({
        'success': False,
        'error': 'File type not allowed'
    }), 400


@app.route('/<filename>')
def serve_file(filename):
    """Servir les fichiers uploadés"""
    return send_from_directory(UPLOAD_DIR, filename)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': str(os.path.getmtime(UPLOAD_DIR)) if os.path.exists(UPLOAD_DIR) else None
    })


@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    return jsonify({
        'success': False,
        'error': 'File too large'
    }), 413


if __name__ == '__main__':
    print(f"🚀 CDN Server running on http://localhost:{PORT}")
    print(f"📁 Upload directory: {os.path.abspath(UPLOAD_DIR)}")
    print(f"🔐 Secret token: {CDN_SECRET[:10]}...")
    print(f"\n📝 Endpoints:")
    print(f"   POST {CDN_BASE_URL}/upload/ - Upload file")
    print(f"   GET  {CDN_BASE_URL}/health - Health check")
    print(f"   GET  {CDN_BASE_URL}/<filename> - Access uploaded file")
    
    app.run(host='0.0.0.0', port=PORT, debug=True)

