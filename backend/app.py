from flask import Flask, request, send_from_directory, jsonify, session, redirect
import os
import json
from users import register_user, verify_user, get_profile, update_profile, is_admin, get_all_users, delete_user

app = Flask(__name__)
app.secret_key = 'replace_this_with_a_secure_key'
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
VIDEO_META_FILE = os.path.join(os.path.dirname(__file__), 'video_meta.json')
if not os.path.exists(VIDEO_META_FILE):
    with open(VIDEO_META_FILE, 'w') as f:
        json.dump({}, f)

@app.route('/frontend/')
def serve_frontend_slash():
    return redirect('/frontend')

@app.route('/frontend/<path:filename>')
def serve_frontend_static(filename):
    return send_from_directory('../frontend', filename)

@app.route('/frontend')
def serve_frontend():
    from flask import send_from_directory
    frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
    return send_from_directory(frontend_dir, 'index.html')

@app.route('/admin')
def admin_panel():
    if 'username' not in session or not is_admin(session['username']):
        return '<h2>Admin access required.</h2>', 403
    return '''
    <html>
    <head><title>Admin Panel</title></head>
    <body style="font-family:sans-serif;max-width:600px;margin:40px auto;">
        <h1 style="color:#388e3c;">CannaSpot Admin Panel</h1>
        <p>Welcome, admin <b>{}</b>!</p>
        <ul>
            <li><a href="/admin/users">View All Users (JSON)</a></li>
            <li><a href="/frontend">Back to Site</a></li>
        </ul>
    </body>
    </html>
    '''.format(session['username'])

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required.'}), 400
    success, message = verify_user(username, password)
    if success:
        session['username'] = username
        return jsonify({'message': message, 'username': username}), 200
    else:
        return jsonify({'error': message}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'message': 'Logged out'}), 200

@app.route('/api/me', methods=['GET'])
def get_me():
    username = session.get('username')
    if not username:
        return jsonify({'logged_in': False}), 200
    with open('users.json', 'r') as f:
        users = json.load(f)
    user = users.get(username, {})
    return jsonify({'logged_in': True, 'username': username, 'avatar': user.get('avatar'), 'header': user.get('header'), 'bio': user.get('bio', '')}), 200

@app.route('/api/profile/header', methods=['POST'])
def upload_header():
    # Require authentication
    username = session.get('username')
    if not username:
        return jsonify({'error': 'Unauthorized'}), 401
    if 'header' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['header']
    ext = file.filename.split('.')[-1]
    filename = f"{username}_header.{ext}"
    filepath = os.path.join('static', 'headers', filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    file.save(filepath)
    # Update user profile data
    with open('users.json', 'r') as f:
        users = json.load(f)
    if username in users:
        users[username]['header'] = filename
        with open('users.json', 'w') as f:
            json.dump(users, f)
    header_url = f"/static/headers/{filename}"
    return jsonify({'headerUrl': header_url})

@app.route('/profile_info')
def public_profile_info():
    username = request.args.get('u')
    profile = get_profile(username)
    if profile:
        return jsonify(profile), 200
    else:
        return jsonify({'error': 'Profile not found.'}), 404

VIEWS_FILE = os.path.join(os.path.dirname(__file__), 'views.json')
if not os.path.exists(VIEWS_FILE):
    with open(VIEWS_FILE, 'w') as f:
        json.dump({}, f)

@app.route('/view/<filename>', methods=['POST'])
def add_view(filename):
    with open(VIEWS_FILE, 'r') as f:
        views = json.load(f)
    views[filename] = views.get(filename, 0) + 1
    with open(VIEWS_FILE, 'w') as f:
        json.dump(views, f)
    return jsonify({'message': 'View counted.'}), 200

@app.route('/view/<filename>', methods=['GET'])
def get_view(filename):
    with open(VIEWS_FILE, 'r') as f:
        views = json.load(f)
    return jsonify({'views': views.get(filename, 0)})

LIKES_FILE = os.path.join(os.path.dirname(__file__), 'likes.json')
if not os.path.exists(LIKES_FILE):
    with open(LIKES_FILE, 'w') as f:
        json.dump({}, f)

@app.route('/likes/<filename>', methods=['GET'])
def get_likes(filename):
    with open(LIKES_FILE, 'r') as f:
        likes = json.load(f)
    data = likes.get(filename, {'likes': [], 'dislikes': []})
    return jsonify({'likes': len(data['likes']), 'dislikes': len(data['dislikes'])})

@app.route('/likes/<filename>', methods=['POST'])
def post_like(filename):
    if 'username' not in session:
        return jsonify({'error': 'Authentication required.'}), 401
    data = request.json
    action = data.get('action')
    if action not in ['like', 'dislike']:
        return jsonify({'error': 'Invalid action.'}), 400
    with open(LIKES_FILE, 'r') as f:
        likes = json.load(f)
    if filename not in likes:
        likes[filename] = {'likes': [], 'dislikes': []}
    # Remove user from both lists first
    likes[filename]['likes'] = [u for u in likes[filename]['likes'] if u != session['username']]
    likes[filename]['dislikes'] = [u for u in likes[filename]['dislikes'] if u != session['username']]
    # Add to the selected action
    likes[filename][action + 's'].append(session['username'])
    with open(LIKES_FILE, 'w') as f:
        json.dump(likes, f)
    return jsonify({'message': f'{action.capitalize()}d.'}), 200

COMMENTS_FILE = os.path.join(os.path.dirname(__file__), 'comments.json')
if not os.path.exists(COMMENTS_FILE):
    with open(COMMENTS_FILE, 'w') as f:
        json.dump({}, f)

@app.route('/comments/<filename>', methods=['GET'])
def get_comments(filename):
    with open(COMMENTS_FILE, 'r') as f:
        comments = json.load(f)
    return jsonify({'comments': comments.get(filename, [])})

@app.route('/comments/<filename>', methods=['POST'])
def post_comment(filename):
    if 'username' not in session:
        return jsonify({'error': 'Authentication required.'}), 401
    data = request.json
    text = data.get('text', '').strip()
    if not text:
        return jsonify({'error': 'Comment cannot be empty.'}), 400
    with open(COMMENTS_FILE, 'r') as f:
        comments = json.load(f)
    comment = {
        'user': session['username'],
        'text': text
    }
    comments.setdefault(filename, []).append(comment)
    with open(COMMENTS_FILE, 'w') as f:
        json.dump(comments, f)
    return jsonify({'message': 'Comment posted.'}), 200

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    bio = data.get('bio', '')
    is_admin_flag = data.get('is_admin', False)
    if not username or not password:
        return jsonify({'error': 'Username and password required.'}), 400
    success, message = register_user(username, password, bio, is_admin_flag)
    if success:
        return jsonify({'message': message}), 200
    else:
        return jsonify({'error': message}), 400

@app.route('/admin/users', methods=['GET'])
def admin_get_users():
    if 'username' not in session or not is_admin(session['username']):
        return jsonify({'error': 'Admin access required.'}), 403
    return jsonify({'users': get_all_users()}), 200

@app.route('/admin/delete_user', methods=['POST'])
def admin_delete_user():
    if 'username' not in session or not is_admin(session['username']):
        return jsonify({'error': 'Admin access required.'}), 403
    data = request.json
    username = data.get('username')
    if not username:
        return jsonify({'error': 'Username required.'}), 400
    success, message = delete_user(username)
    if success:
        return jsonify({'message': message}), 200
    else:
        return jsonify({'error': message}), 400

@app.route('/profile', methods=['GET'])
def profile():
    if 'username' not in session:
        return jsonify({'error': 'Authentication required.'}), 401
    profile = get_profile(session['username'])
    if profile:
        return jsonify(profile), 200
    else:
        return jsonify({'error': 'Profile not found.'}), 404

@app.route('/profile', methods=['POST'])
def update_profile_route():
    if 'username' not in session:
        return jsonify({'error': 'Authentication required.'}), 401
    bio = request.form.get('bio', '')
    avatar_file = request.files.get('avatar')
    avatar_filename = None
    if avatar_file and avatar_file.filename:
        avatar_filename = f"{session['username']}_avatar_{avatar_file.filename}"
        avatar_path = os.path.join(os.path.dirname(__file__), 'uploads', avatar_filename)
        avatar_file.save(avatar_path)
    # Update profile with bio and avatar filename
    success, message = update_profile(session['username'], bio, avatar_filename)
    if success:
        return jsonify({'message': message}), 200
    else:
        return jsonify({'error': message}), 400

@app.route('/health')
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'username' not in session:
        return jsonify({'error': 'Authentication required.'}), 401
    if 'video' not in request.files:
        return jsonify({'error': 'No video part'}), 400
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)
    # Get title/description/comment/chat/upload type
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    comment_on = request.form.get('comment_on', 'true') == 'true'
    chat_on = request.form.get('chat_on', 'false') == 'true'
    upload_type = request.form.get('upload_type', 'post')
    # Store video meta
    with open(VIDEO_META_FILE, 'r') as f:
        meta = json.load(f)
    meta[file.filename] = {
        'uploader': session['username'],
        'title': title,
        'description': description,
        'comment_on': comment_on,
        'chat_on': chat_on,
        'upload_type': upload_type
    }
    with open(VIDEO_META_FILE, 'w') as f:
        json.dump(meta, f)
    return jsonify({'message': 'Upload successful', 'filename': file.filename, 'upload_type': upload_type, 'title': title, 'description': description}), 200

@app.route('/videos/<filename>')
def get_video(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/list')
def list_videos():
    files = [f for f in os.listdir(UPLOAD_FOLDER) if os.path.isfile(os.path.join(UPLOAD_FOLDER, f))]
    with open(VIDEO_META_FILE, 'r') as f:
        meta = json.load(f)
    videos = []
    for f in files:
        vmeta = meta.get(f, {})
        videos.append({
            'filename': f,
            'uploader': vmeta.get('uploader', ''),
            'title': vmeta.get('title', f),
            'description': vmeta.get('description', ''),
            'comment_on': vmeta.get('comment_on', True),
            'chat_on': vmeta.get('chat_on', False),
            'upload_type': vmeta.get('upload_type', 'post')
        })
    return jsonify({'videos': videos})

@app.route('/')
def home():
    return '''
    <html>
    <head><title>Welcome to CannaTube</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:40px;">
        <h1>Welcome to CannaTube</h1>
        <p><a href="/frontend">Login or Sign Up</a></p>
    </body>
    </html>
    '''

if __name__ == '__main__':
    app.run(debug=True)
