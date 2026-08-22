/**
 * ============================================================================
 * MEMORY WALL (INTERACTIVE GUESTBOOK) WITH DELETE & LOCALSTORAGE PERSISTENCE
 * ============================================================================
 */

import { memoriesData } from '../data/memoriesData.js';

export class MemoryWallController {
  constructor() {
    this.postsContainer = document.getElementById('wall-posts-container');
    this.form = document.getElementById('memory-wall-form');
    this.exportBtn = document.getElementById('btn-export-memories');
    this.importBtn = document.getElementById('btn-import-memories');
    this.importFileInput = document.getElementById('import-file-input');
    this.stickerOptions = document.querySelectorAll('.sticker-opt');

    this.selectedSticker = '🙏';
    this.storageKey = 'vinayaka_chat_memories_wall_v2';
    this.posts = [];

    this.init();
  }

  init() {
    this.loadPosts();
    this.initStickerPicker();
    this.initForm();
    this.initExportImport();
    this.render();
  }

  loadPosts() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.posts = JSON.parse(saved);
      } catch (e) {
        this.posts = [...memoriesData.memoryWallInitial];
      }
    } else {
      this.posts = [...memoriesData.memoryWallInitial];
      this.savePosts();
    }
  }

  savePosts() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.posts));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  initStickerPicker() {
    this.stickerOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        this.stickerOptions.forEach(s => s.classList.remove('selected'));
        opt.classList.add('selected');
        this.selectedSticker = opt.getAttribute('data-sticker') || '🙏';
      });
    });
  }

  initForm() {
    if (!this.form) return;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('memory-author-name');
      const roleInput = document.getElementById('memory-author-role');
      const categoryInput = document.getElementById('memory-category');
      const messageInput = document.getElementById('memory-message-text');

      const name = nameInput ? nameInput.value.trim() : '';
      const role = roleInput ? roleInput.value.trim() : 'Friend';
      const category = categoryInput ? categoryInput.value : 'Favorite Moment';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!name || !message) {
        alert('Please provide your name and your memory message!');
        return;
      }

      const newPost = {
        id: 'msg-' + Date.now(),
        author: name,
        role: role || 'Friend',
        category: category,
        message: message,
        sticker: this.selectedSticker,
        likes: 1,
        date: 'Just Now'
      };

      this.posts.unshift(newPost);
      this.savePosts();
      this.render();

      // Reset Form
      this.form.reset();
      this.selectedSticker = '🙏';
      this.stickerOptions.forEach(s => s.classList.remove('selected'));
      if (this.stickerOptions[0]) this.stickerOptions[0].classList.add('selected');

      alert('✨ Your memory has been added to our sacred Memory Wall!');
    });
  }

  initExportImport() {
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.posts, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "vinayaka_chat_memory_wall.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });
    }

    if (this.importBtn && this.importFileInput) {
      this.importBtn.addEventListener('click', () => {
        this.importFileInput.click();
      });

      this.importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
              this.posts = imported;
              this.savePosts();
              this.render();
              alert('Successfully imported ' + imported.length + ' memories!');
            }
          } catch (err) {
            alert('Invalid JSON file format.');
          }
        };
        reader.readAsText(file);
      });
    }
  }

  deletePost(postId) {
    if (confirm('Are you sure you want to delete this memory from the wall?')) {
      this.posts = this.posts.filter(p => p.id !== postId);
      this.savePosts();
      this.render();
    }
  }

  render() {
    if (!this.postsContainer) return;

    if (this.posts.length === 0) {
      this.postsContainer.innerHTML = `
        <div style="text-align:center; padding: 2rem; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">
          <p>No messages on the memory wall yet. Be the first to share one!</p>
        </div>
      `;
      return;
    }

    this.postsContainer.innerHTML = this.posts.map(post => `
      <div class="wall-post-card">
        <div class="wall-post-header">
          <div class="wall-author-info">
            <div class="wall-author-avatar">${post.sticker || '🙏'}</div>
            <div>
              <div class="wall-author-name">${post.author}</div>
              <div class="wall-post-tag">${post.role} • ${post.category}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 0.75rem; color: var(--text-dim);">${post.date}</span>
            <button class="btn-delete-wall-post" data-post-id="${post.id}" title="Delete this memory">
              🗑️ Delete
            </button>
          </div>
        </div>
        <p class="wall-post-message">${post.message}</p>
        <div class="wall-post-footer">
          <span>✨ Vinayaka Memory</span>
          <button class="btn-like-post" data-post-id="${post.id}">
            ❤️ <span>${post.likes || 1}</span>
          </button>
        </div>
      </div>
    `).join('');

    // Delete button listeners
    this.postsContainer.querySelectorAll('.btn-delete-wall-post').forEach(btn => {
      btn.addEventListener('click', () => {
        const postId = btn.getAttribute('data-post-id');
        this.deletePost(postId);
      });
    });

    // Like button listeners
    this.postsContainer.querySelectorAll('.btn-like-post').forEach(btn => {
      btn.addEventListener('click', () => {
        const postId = btn.getAttribute('data-post-id');
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.likes = (post.likes || 0) + 1;
          this.savePosts();
          this.render();
        }
      });
    });
  }
}
