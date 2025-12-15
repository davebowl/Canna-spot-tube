    // Session state
    async function checkSession() {
        const res = await fetch('/api/me', { credentials: 'include' });
        const data = await res.json();
        if (data.logged_in) {
            document.getElementById('profileBtn').style.display = 'inline-block';
            // Show upload form, hide auth forms
            document.getElementById('uploadForm').style.display = 'block';
            document.getElementById('authForms').style.display = 'none';
        } else {
            document.getElementById('profileBtn').style.display = 'none';
            document.getElementById('uploadForm').style.display = 'none';
            document.getElementById('authForms').style.display = 'block';
        }
    }
    checkSession();

    // Login
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        if (res.ok) {
            alert('Login successful!');
            checkSession();
        } else {
            alert('Login failed.');
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        checkSession();
    });
    const showSignupBtn = document.getElementById('showSignup');
    const showLoginBtn = document.getElementById('showLogin');

    // Tab logic for auth forms
    showSignupBtn.addEventListener('click', function() {
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
        showSignupBtn.classList.add('active');
        showLoginBtn.classList.remove('active');
    });
    showLoginBtn.addEventListener('click', function() {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        showLoginBtn.classList.add('active');
        showSignupBtn.classList.remove('active');
    });
document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const videoInput = document.getElementById('videoInput');
    const messageDiv = document.getElementById('message');
    const videoList = document.getElementById('videoList');
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const authForms = document.getElementById('authForms');
    const profileSection = document.getElementById('profileSection');
    const profileInfo = document.getElementById('profileInfo');
    const profileForm = document.getElementById('profileForm');
    const profileBio = document.getElementById('profileBio');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminPanel = document.getElementById('adminPanel');
    const adminUsers = document.getElementById('adminUsers');

    let loggedIn = false;

    function fetchVideos() {
        fetch('http://localhost:5000/list', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                videoList.innerHTML = '';
                videoList.className = 'video-list';
                data.videos.forEach(video => {
                    const card = document.createElement('div');
                    card.className = 'video-card';
                    card.innerHTML = `
                        <a href="watch.html?v=${video.filename}" style="text-decoration:none;color:inherit;">
                            <video src="http://localhost:5000/videos/${video.filename}" poster="#" style="width:100%;border-radius:6px;"></video>
                            <div class="video-title">${video.title || video.filename}</div>
                        </a>
                        <div class="video-meta" style="display:flex;align-items:center;gap:8px;">
                            ${video.uploader_avatar ? `<img src="http://localhost:5000/uploads/${video.uploader_avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid #e53935;">` : `<span style="width:28px;height:28px;border-radius:50%;background:#eee;display:inline-flex;align-items:center;justify-content:center;font-size:1.1em;color:#e53935;border:1.5px solid #e53935;">👤</span>`}
                            By <a href="profile.html?u=${video.uploader}" style="color:#e53935;text-decoration:none;font-weight:600;">${video.uploader}</a> • ${video.upload_type === 'live' ? 'Live Show' : 'Video Post'}
                        </div>
                        <div class="video-desc" style="color:#444;margin-bottom:4px;">${video.description || ''}</div>
                        <div class="video-meta" id="viewCount-${video.filename}" style="color:#222;"></div>
                        ${video.comment_on ? '<div class="video-meta" style="color:#27ae60;">Comments enabled</div>' : '<div class="video-meta" style="color:#e53935;">Comments off</div>'}
                        ${video.chat_on ? '<div class="video-meta" style="color:#219150;">Chat enabled</div>' : ''}
                    `;
                    videoList.appendChild(card);
                    // Fetch and show view count
                    fetch(`http://localhost:5000/view/${video.filename}`)
                        .then(res => res.json())
                        .then(data => {
                            const vc = document.getElementById(`viewCount-${video.filename}`);
                            if (vc) vc.textContent = `Views: ${data.views}`;
                        });
                });
            });
    }

    function showAuth() {
        authForms.style.display = '';
        profileSection.style.display = 'none';
        uploadForm.style.display = 'none';
    }
    function showProfile(profile) {
        authForms.style.display = 'none';
        profileSection.style.display = '';
        uploadForm.style.display = '';
        profileInfo.innerHTML = `<strong>Username:</strong> ${profile.username}<br><strong>Bio:</strong> ${profile.bio}`;
        profileBio.value = profile.bio;
        // Check if user is admin and show admin panel
        fetch('http://localhost:5000/profile', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data && data.username) {
                    fetch('http://localhost:5000/admin/users', { credentials: 'include' })
                        .then(res => {
                            if (res.status === 200) {
                                adminPanel.style.display = '';
                                return res.json();
                            } else {
                                adminPanel.style.display = 'none';
                                return null;
                            }
                        })
                        .then(usersData => {
                            if (usersData && usersData.users) {
                                adminUsers.innerHTML = '<h3>All Users</h3>' + usersData.users.map(u =>
                                    `<div style="margin-bottom:8px;">
                                        <span><strong>${u.username}</strong> ${u.is_admin ? '(admin)' : ''} - ${u.bio}</span>
                                        ${u.username !== data.username ? `<button class="deleteUserBtn" data-username="${u.username}">Delete</button>` : ''}
                                    </div>`
                                ).join('');
                                // Add delete user event listeners
                                document.querySelectorAll('.deleteUserBtn').forEach(btn => {
                                    btn.onclick = function() {
                                        const delUser = btn.getAttribute('data-username');
                                        if (confirm('Delete user ' + delUser + '?')) {
                                            fetch('http://localhost:5000/admin/delete_user', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                credentials: 'include',
                                                body: JSON.stringify({ username: delUser })
                                            })
                                            .then(res => res.json())
                                            .then(result => {
                                                messageDiv.textContent = result.message || result.error;
                                                showProfile(profile);
                                            });
                                        }
                                    };
                                });
                            }
                        });
                    } else {
                        adminPanel.style.display = 'none';
                    }
            });
    }

    function checkAuth() {
        fetch('http://localhost:5000/profile', { credentials: 'include' })
            .then(res => {
                if (res.status === 200) {
                    loggedIn = true;
                    return res.json();
                } else {
                    loggedIn = false;
                    showAuth();
                    return null;
                }
            })
            .then(profile => {
                if (profile) {
                    showProfile(profile);
                }
            });
    }

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;
        const bio = document.getElementById('signupBio').value;
        fetch('http://localhost:5000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password, bio })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                messageDiv.textContent = data.error;
            } else {
                messageDiv.textContent = data.message;
                // Auto-login after signup
                fetch('http://localhost:5000/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username, password })
                })
                .then(() => checkAuth());
            }
        });
    });

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                messageDiv.textContent = data.error;
            } else {
                messageDiv.textContent = data.message;
                checkAuth();
            }
        });
    });

    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const bio = profileBio.value;
        const formData = new FormData();
        formData.append('bio', bio);
        const avatarFile = document.getElementById('avatarInput').files[0];
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }
        fetch('http://localhost:5000/profile', {
            method: 'POST',
            credentials: 'include',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                messageDiv.textContent = data.error;
            } else {
                messageDiv.textContent = data.message;
                checkAuth();
            }
        });
    });

    logoutBtn.addEventListener('click', function() {
        fetch('http://localhost:5000/logout', { method: 'POST', credentials: 'include' })
            .then(() => {
                loggedIn = false;
                showAuth();
            });
    });

    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const file = videoInput.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', document.getElementById('videoTitle').value);
        formData.append('description', document.getElementById('videoDesc').value);
        formData.append('comment_on', document.getElementById('commentOn').checked ? 'true' : 'false');
        formData.append('chat_on', document.getElementById('chatOn').checked ? 'true' : 'false');
        const uploadType = document.getElementById('liveType').checked ? 'live' : 'post';
        formData.append('upload_type', uploadType);
        fetch('http://localhost:5000/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                messageDiv.textContent = data.error;
            } else {
                messageDiv.textContent = data.message;
                fetchVideos();
            }
        })
        .catch(() => {
            messageDiv.textContent = 'Upload failed.';
        });
    });

    fetchVideos();
    checkAuth();
});
