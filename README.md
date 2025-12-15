# CannaTube

A clean video upload and sharing website for content creators. Built with Python Flask (backend) and HTML/CSS/JS (frontend). Designed for deployment on LiteSpeed web server.

## Features
- Content creators can upload and share videos
- Modern, clean UI
- Video playback and listing
- 100% web server compatible (LiteSpeed, WSGI)

## Project Structure
- `backend/` - Flask backend (API, uploads, WSGI entry)
- `frontend/` - HTML/CSS/JS frontend

## Setup & Usage

### 1. Backend (Flask)
- Install dependencies:
  ```bash
  pip install flask
  ```
- Run locally for testing:
  ```bash
  python backend/app.py
  ```
- For LiteSpeed deployment:
  - Use `backend/wsgi.py` as the WSGI entry point
  - Configure LiteSpeed to serve the Flask app via WSGI

### 2. Frontend
- Open `frontend/index.html` in your browser
- For production, serve `frontend/` as static files via LiteSpeed
- Update API URLs in `script.js` if deploying to a different domain or port

## Deployment on LiteSpeed
1. Upload the `backend/` and `frontend/` folders to your server
2. Configure LiteSpeed to run the Flask app using WSGI (point to `wsgi.py`)
3. Serve the `frontend/` folder as static files
4. Ensure Python and Flask are installed on the server
5. Set proper permissions for the `uploads/` folder

## Notes
- This site is intended for content creators to upload and share videos
- For production, consider adding authentication and security features

---
Created by GitHub Copilot (GPT-4.1)
