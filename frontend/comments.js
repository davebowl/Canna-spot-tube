// Comments logic for watch page
const filename = new URL(window.location.href).searchParams.get('v');
const commentsSection = document.getElementById('commentsSection');

function renderComments(comments) {
    if (!commentsSection) return;
    const list = document.createElement('div');
    list.className = 'comments-list';
    if (comments.length === 0) {
        list.innerHTML = '<div style="color:#888;">No comments yet.</div>';
    } else {
        comments.forEach(c => {
            const item = document.createElement('div');
            item.className = 'comment-item';
            item.innerHTML = `<strong>${c.user}</strong>: ${c.text}`;
            list.appendChild(item);
        });
    }
    commentsSection.appendChild(list);
}

function loadComments() {
    fetch(`http://localhost:5000/comments/${filename}`)
        .then(res => res.json())
        .then(data => {
            commentsSection.innerHTML = '<h3>Comments</h3>';
            renderComments(data.comments || []);
            renderCommentForm();
        });
}

function renderCommentForm() {
    const form = document.createElement('form');
    form.id = 'commentForm';
    form.innerHTML = `
        <input type="text" id="commentInput" placeholder="Add a comment..." style="width:70%;padding:8px;">
        <button type="submit" style="padding:8px 16px;margin-left:8px;">Post</button>
    `;
    form.onsubmit = function(e) {
        e.preventDefault();
        const text = document.getElementById('commentInput').value;
        fetch(`http://localhost:5000/comments/${filename}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ text })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                loadComments();
            }
        });
    };
    commentsSection.appendChild(form);
}

if (commentsSection) {
    loadComments();
}
