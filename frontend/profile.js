// Handle header image upload
document.getElementById('editHeaderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('headerUpload');
    if (fileInput.files.length === 0) return;
    const formData = new FormData();
    formData.append('header', fileInput.files[0]);
    // Send to backend
    const res = await fetch('/api/profile/header', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });
    if (res.ok) {
        const data = await res.json();
        document.getElementById('headerImg').src = data.headerUrl;
        alert('Header image updated!');
    } else {
        alert('Failed to update header image.');
    }
});
// Get username from URL query string
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

const username = getQueryParam('u');
const profileContent = document.getElementById('profileContent');

function renderProfile(profile, videos) {
    if (!profile) {
        profileContent.innerHTML = '<h2>User not found</h2>';
        return;
    }
    // Header image logic
    let headerImgHtml = '';
    if (profile.header) {
        headerImgHtml = `<img src="/static/headers/${profile.header}" class="header-image" alt="Header Image">`;
    } else {
        headerImgHtml = `<img src="default_header.jpg" class="header-image" alt="Header Image">`;
    }
    profileContent.innerHTML = `
        <div class="profile-header" style="margin-bottom:24px;">
            ${headerImgHtml}
        </div>
        <div style="display:flex;align-items:center;gap:18px;">
            ${profile.avatar ? `<img src="http://localhost:5000/uploads/${profile.avatar}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #e53935;">` : `<div style="width:80px;height:80px;border-radius:50%;background:#eee;display:flex;align-items:center;justify-content:center;font-size:2em;color:#e53935;border:2px solid #e53935;">👤</div>`}
            <div>
                <h2 style="color:#e53935;margin-bottom:4px;">${profile.username}</h2>
                <div style="color:#388e3c;font-size:1.1em;margin-bottom:8px;">${profile.bio || ''}</div>
            </div>
        </div>
        <h3 style="margin-bottom:12px;">Videos by ${profile.username}</h3>
        <div class="video-list" id="userVideos"></div>
    `;
    const userVideos = document.getElementById('userVideos');
    if (videos.length === 0) {
        userVideos.innerHTML = '<div style="color:#888;">No videos yet.</div>';
    } else {
        videos.forEach(video => {
            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <a href="watch.html?v=${video.filename}" style="text-decoration:none;color:inherit;">
                    <video src="http://localhost:5000/videos/${video.filename}" style="width:100%;border-radius:6px;"></video>
                    <div class="video-title">${video.title || video.filename}</div>
                </a>
                <div class="video-meta">Views: <span id="viewCount-${video.filename}"></span></div>
                <div class="video-desc" style="color:#444;margin-bottom:4px;">${video.description || ''}</div>
            `;
            userVideos.appendChild(card);
            // Fetch and show view count
            fetch(`http://localhost:5000/view/${video.filename}`)
                .then(res => res.json())
                .then(data => {
                    const vc = document.getElementById(`viewCount-${video.filename}`);
                    if (vc) vc.textContent = data.views;
                });
        });
    }
}

// Fetch profile info and videos
fetch('http://localhost:5000/list')
    .then(res => res.json())
    .then(data => {
        const videos = (data.videos || []).filter(v => v.uploader === username);
        fetch('http://localhost:5000/profile_info?u=' + encodeURIComponent(username))
            .then(res => res.json())
            .then(profile => {
                renderProfile(profile, videos);
            });
    });
