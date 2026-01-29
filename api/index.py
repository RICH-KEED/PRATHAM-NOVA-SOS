from main import app
from flask import send_from_directory
import os

@app.route('/')
def serve_index():
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), '../index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path and os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), f'../{path}')):
        return send_from_directory(os.path.dirname(os.path.abspath(__file__)), f'../{path}')
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), '../index.html')
