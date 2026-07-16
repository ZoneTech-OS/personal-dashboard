import json
import os
import socket  # Required to find a free port automatically
import sys
import webbrowser
from threading import Timer
from flask import Flask, jsonify, request, send_from_directory

# 1. Helper function: Tell Flask where HTML/CSS/JS files are unpacked by PyInstaller
def get_resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        # PyInstaller temporary extraction folder
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

# Point Flask's static and template directories to our dynamic path
STATIC_FOLDER = get_resource_path(".")
app = Flask(__name__, static_folder=STATIC_FOLDER, template_folder=STATIC_FOLDER)

DATA_FILE = "data.json"

# Initialize data.json with empty structures if it doesn't exist yet
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"tasks": [], "notes": ""}, f, indent=4)

# 2. Helper function: Ask the OS to assign a guaranteed-free port
def get_free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))  # Binding to port 0 forces Linux to pick a free port
    port = s.getsockname()[1]
    s.close()
    return port

# Retrieve our guaranteed free port
FREE_PORT = get_free_port()

# 3. Web browser auto-opener
def open_browser():
    webbrowser.open_new(f"http://127.0.0.1:{FREE_PORT}/")


# --- FLASK ROUTES ---

@app.route("/")
def index():
    # Serves your main frontend HTML page
    return send_from_directory(STATIC_FOLDER, "index.html")

@app.route("/<path:path>")
def static_files(path):
    # Serves your CSS and JS files
    return send_from_directory(STATIC_FOLDER, path)

@app.route("/api/data", methods=["GET"])
def get_data():
    # Read the JSON file and send it to the frontend
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return jsonify(data)

@app.route("/api/data", methods=["POST"])
def save_data():
    # Receive new data from the frontend and save it to your JSON file
    new_data = request.json
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=4, ensure_ascii=False)
    return jsonify({"status": "success", "message": "Data saved successfully!"})


# --- START APP ---

if __name__ == "__main__":
    # Start a 1.5-second timer to let the server boot up before launching browser
    Timer(1.5, open_browser).start()
    
    # Run Flask on our guaranteed free port
    app.run(host="127.0.0.1", port=FREE_PORT, debug=False)