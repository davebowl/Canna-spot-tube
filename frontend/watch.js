// Get video filename from URL query string
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

const filename = getQueryParam('v');

function renderWatchPage(video) {
    const container = document.getElementById('watchContent');
    if (!video) {
        container.innerHTML = '<h2>Video not found</h2>';
        return;
    }
    container.innerHTML = `
        <div class="video-watch-card">
            <video controls src="http://localhost:5000/videos/${video.filename}" style="width:100%;border-radius:8px;"></video>
            <h2 class="video-title">${video.title || video.filename}</h2>
            <div class="video-meta" style="display:flex;align-items:center;gap:8px;">
                ${video.uploader_avatar ? `<img src="http://localhost:5000/uploads/${video.uploader_avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid #e53935;">` : `<span style="width:28px;height:28px;border-radius:50%;background:#eee;display:inline-flex;align-items:center;justify-content:center;font-size:1.1em;color:#e53935;border:1.5px solid #e53935;">👤</span>`}
                Uploaded by <a href="profile.html?u=${video.uploader}" style="color:#e53935;text-decoration:none;font-weight:600;">${video.uploader}</a>
            </div>
            <div class="video-meta">Type: ${video.upload_type === 'live' ? 'Live Show' : 'Video Post'}</div>
            <div id="viewCount" class="video-meta" style="margin-bottom:8px;"></div>
            <div class="video-desc" style="margin:12px 0 18px 0;color:#444;">${video.description || ''}</div>
            <div id="likeSection" style="margin-bottom:18px;"></div>
            ${video.comment_on ? '<div id="commentsSection"><h3>Comments</h3><div>Comments coming soon...</div></div>' : '<div style="color:#888;margin-top:12px;">Comments are disabled for this video.</div>'}
            ${video.chat_on ? '<div id="chatSection"><h3>Live Chat</h3><div>Chat coming soon...</div></div>' : ''}
        </div>
    `;
    incrementView();
    renderLikes();
}

function incrementView() {
    fetch(`http://localhost:5000/view/${filename}`, {
        method: 'POST'
    }).then(() => renderViewCount());
}

function renderViewCount() {
    const viewCount = document.getElementById('viewCount');
    if (!viewCount) return;
    fetch(`http://localhost:5000/view/${filename}`)
        .then(res => res.json())
        .then(data => {
            viewCount.textContent = `Views: ${data.views}`;
        });
}


function renderLikes() {
    const likeSection = document.getElementById('likeSection');
    if (!likeSection) return;
    fetch(`http://localhost:5000/likes/${filename}`)
        .then(res => res.json())
        .then(data => {
            likeSection.innerHTML = `
                <button id="likeBtn" style="padding:6px 18px;margin-right:10px;background:#27ae60;color:#fff;border:none;border-radius:4px;cursor:pointer;">👍 Like (${data.likes})</button>
                <button id="dislikeBtn" style="padding:6px 18px;background:#e53935;color:#fff;border:none;border-radius:4px;cursor:pointer;">👎 Dislike (${data.dislikes})</button>
            `;
            document.getElementById('likeBtn').onclick = function() {
                fetch(`http://localhost:5000/likes/${filename}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ action: 'like' })
                })
                .then(() => renderLikes());
            };
            document.getElementById('dislikeBtn').onclick = function() {
                fetch(`http://localhost:5000/likes/${filename}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ action: 'dislike' })
                })
                .then(() => renderLikes());
            };
        });
}


fetch('http://localhost:5000/list')
    .then(res => res.json())
    .then(data => {
        if (!data.videos) return renderWatchPage(null);
        const video = data.videos.find(v => v.filename === filename);
        renderWatchPage(video);
    });
