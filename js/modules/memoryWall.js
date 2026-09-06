/**
 * ============================================================================
 * MEMORY WALL & LEAVE A MEMORY - BILINGUAL STREET GUESTBOOK
 * ============================================================================
 * Features:
 * - Optional Name (defaults to "గల్లీ మిత్రుడు / Well Wisher")
 * - Message with character counter & spam prevention
 * - Optional Photo Upload with client-side Canvas compression (safe for localStorage)
 * - Interactive Keepsake Card UI with festive stickers & like counters
 * - Filters: All, With Photos, Most Loved
 * - Delete with confirmation & JSON Export / Import
 */

import { memoriesData } from '../data/memoriesData.js';
import { CloudSyncService } from '../services/cloudSyncService.js';

export class MemoryWallController {
  constructor() {
    this.postsContainer = document.getElementById('wall-posts-container');
    this.form = document.getElementById('memory-wall-form');
    this.exportBtn = document.getElementById('btn-export-memories');
    this.importBtn = document.getElementById('btn-import-memories');
    this.importFileInput = document.getElementById('import-file-input');
    this.stickerOptions = document.querySelectorAll('.sticker-opt');
    this.charCounter = document.getElementById('memory-char-count');
    this.photoFileInput = document.getElementById('memory-photo-file');
    this.photoPreviewContainer = document.getElementById('memory-photo-preview-container');
    this.photoPreviewImg = document.getElementById('memory-photo-preview-img');
    this.photoRemoveBtn = document.getElementById('btn-remove-memory-photo');
    this.filterButtons = document.querySelectorAll('.wall-filter-pill');

    this.selectedSticker = '🙏';
    this.attachedPhotoDataUrl = null;
    this.currentFilter = 'all';
    this.isSubmitting = false;
    this.lastSubmitTime = 0;
    this.storageKey = 'vinayaka_chat_memories_wall_v3';
    this.posts = [];

    this.init();
  }

  async init() {
    await this.loadPosts();
    this.initStickerPicker();
    this.initPhotoUpload();
    this.initCharacterCounter();
    this.initFilterChips();
    this.initForm();
    this.initExportImport();
    this.render();

    // Listen for live real-time cloud updates across all devices
    CloudSyncService.subscribeMemories((cloudPosts) => {
      const demoIds = new Set(['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5']);
      if (Array.isArray(cloudPosts)) {
        this.posts = cloudPosts.filter(p => p && !demoIds.has(p.id) && !p.isDemo);
        this.render();
      }
    });
  }

  async loadPosts() {
    const demoIds = new Set(['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5']);

    // 1. Fetch from Cloud Database first (multi-device source of truth)
    const cloudPosts = await CloudSyncService.fetchMemories();
    if (cloudPosts && Array.isArray(cloudPosts) && cloudPosts.length > 0) {
      this.posts = cloudPosts.filter(p => p && !demoIds.has(p.id) && !p.isDemo);
      this.render();
      return;
    }

    // 2. Fallback to localStorage
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.posts = parsed.filter(p => p && !demoIds.has(p.id) && !p.isDemo);
        } else {
          this.posts = [];
        }
      } catch (e) {
        this.posts = [];
      }
    } else {
      this.posts = [];
    }
    this.savePosts();
  }

  savePosts() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.posts));
      CloudSyncService.saveMemories(this.posts);
    } catch (e) {
      console.warn('Could not save memories:', e);
    }
  }

  sanitize(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

  initCharacterCounter() {
    const messageInput = document.getElementById('memory-message-text');
    if (messageInput && this.charCounter) {
      messageInput.addEventListener('input', () => {
        const len = messageInput.value.length;
        this.charCounter.textContent = `${len}/500`;
        if (len > 480) {
          this.charCounter.style.color = '#ff6b6b';
        } else {
          this.charCounter.style.color = 'var(--text-dim)';
        }
      });
    }
  }

  initPhotoUpload() {
    if (!this.photoFileInput) return;

    this.photoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, WebP).');
        this.photoFileInput.value = '';
        return;
      }

      // Read & compress via HTML5 Canvas
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 380;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to lightweight JPEG ~20-30KB
          this.attachedPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.75);

          if (this.photoPreviewImg && this.photoPreviewContainer) {
            this.photoPreviewImg.src = this.attachedPhotoDataUrl;
            this.photoPreviewContainer.style.display = 'flex';
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    if (this.photoRemoveBtn) {
      this.photoRemoveBtn.addEventListener('click', () => {
        this.attachedPhotoDataUrl = null;
        if (this.photoFileInput) this.photoFileInput.value = '';
        if (this.photoPreviewContainer) this.photoPreviewContainer.style.display = 'none';
        if (this.photoPreviewImg) this.photoPreviewImg.src = '';
      });
    }
  }

  initFilterChips() {
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-filter') || 'all';
        this.render();
      });
    });
  }

  initForm() {
    if (!this.form) return;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();

      const now = Date.now();
      // Cooldown spam protection: 3 seconds between submits
      if (now - this.lastSubmitTime < 3000) {
        alert('దయచేసి కాసేపు ఆగండి / Please wait a moment before posting again.');
        return;
      }

      const nameInput = document.getElementById('memory-author-name');
      const roleInput = document.getElementById('memory-author-role');
      const categoryInput = document.getElementById('memory-category');
      const messageInput = document.getElementById('memory-message-text');
      const submitBtn = this.form.querySelector('button[type="submit"]');

      const rawName = nameInput ? nameInput.value.trim() : '';
      const rawRole = roleInput ? roleInput.value.trim() : '';
      const rawCategory = categoryInput ? categoryInput.value : 'Favorite Moment';
      const rawMessage = messageInput ? messageInput.value.trim() : '';

      // Validation
      if (!rawMessage || rawMessage.length < 3) {
        alert('దయచేసి మీ జ్ఞాపకాన్ని లేదా సందేశాన్ని రాయండి (కనీసం 3 అక్షరాలు).\nPlease enter a message with at least 3 characters.');
        if (messageInput) messageInput.focus();
        return;
      }

      // Optional name defaults gracefully to friendly Telugu identity
      const authorName = rawName || 'గల్లీ మిత్రుడు (Well Wisher)';
      const authorRole = rawRole || 'Street Family';

      this.isSubmitting = true;
      if (submitBtn) submitBtn.disabled = true;

      const newPost = {
        id: 'msg-' + now,
        author: this.sanitize(authorName),
        role: this.sanitize(authorRole),
        category: this.sanitize(rawCategory),
        message: this.sanitize(rawMessage),
        sticker: this.selectedSticker || '🙏',
        photo: this.attachedPhotoDataUrl || null,
        likes: 1,
        date: 'Just Now • ఇప్పుడే'
      };

      this.posts.unshift(newPost);
      this.savePosts();
      this.lastSubmitTime = now;

      // Reset Form
      this.form.reset();
      this.selectedSticker = '🙏';
      this.attachedPhotoDataUrl = null;
      if (this.photoPreviewContainer) this.photoPreviewContainer.style.display = 'none';
      if (this.photoPreviewImg) this.photoPreviewImg.src = '';
      if (this.charCounter) this.charCounter.textContent = '0/500';

      this.stickerOptions.forEach(s => s.classList.remove('selected'));
      if (this.stickerOptions[0]) this.stickerOptions[0].classList.add('selected');

      if (submitBtn) submitBtn.disabled = false;
      this.isSubmitting = false;

      this.render();

      // Trigger flower shower celebration if available
      const flowerBtn = document.getElementById('btn-shower-flowers');
      if (flowerBtn) flowerBtn.click();

      // Scroll smoothly to the newly posted memory
      const newCard = document.getElementById(`card-${newPost.id}`);
      if (newCard) {
        newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        newCard.classList.add('highlight-new-post');
        setTimeout(() => newCard.classList.remove('highlight-new-post'), 2500);
      }
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
              alert(`విజయవంతంగా ${imported.length} జ్ఞాపకాలు లోడ్ అయ్యాయి! / Successfully imported ${imported.length} memories!`);
            }
          } catch (err) {
            alert('చెల్లని ఫైల్ ఫార్మాట్ / Invalid JSON file format.');
          }
        };
        reader.readAsText(file);
      });
    }
  }

  deletePost(postId) {
    if (confirm('ఈ జ్ఞాపకాన్ని మెమొరీ వాల్ నుండి తొలగించాలా?\nAre you sure you want to delete this memory from the wall?')) {
      this.posts = this.posts.filter(p => p.id !== postId);
      this.savePosts();
      this.render();
    }
  }

  render() {
    if (!this.postsContainer) return;

    let filtered = [...this.posts];

    if (this.currentFilter === 'photos') {
      filtered = filtered.filter(p => Boolean(p.photo));
    } else if (this.currentFilter === 'loved') {
      filtered = [...filtered].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    if (filtered.length === 0) {
      this.postsContainer.innerHTML = `
        <div class="wall-empty-state">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🪔</div>
          <h4 style="color: var(--gold-300); margin-bottom: 0.4rem;">జ్ఞాపకాలు ఏవీ లేవు / No memories here yet</h4>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            ${this.currentFilter === 'photos' ? 'ఫోటోలతో కూడిన జ్ఞాపకాలు ఇంకా రాలేదు. మీరే మొదటి ఫోటోను పోస్ట్ చేయండి!' : 'మీరే మొదటి జ్ఞాపకాన్ని పంచుకోండి! Share the very first memory!'}
          </p>
        </div>
      `;
      return;
    }

    this.postsContainer.innerHTML = filtered.map(post => `
      <div class="wall-post-card" id="card-${post.id}">
        <!-- Pin / Keepsake visual badge -->
        <div class="wall-card-pin">📌</div>

        <div class="wall-post-header">
          <div class="wall-author-info">
            <div class="wall-author-avatar">${post.sticker || '🙏'}</div>
            <div>
              <div class="wall-author-name">${post.author}</div>
              <div class="wall-post-tag">
                <span>${post.role || 'Street Family'}</span>
                <span style="opacity: 0.6;">•</span>
                <span class="wall-post-category-badge">${post.category || 'Memory'}</span>
              </div>
            </div>
          </div>
          <div class="wall-header-actions">
            <span class="wall-post-date">${post.date}</span>
            <button class="btn-delete-wall-post" data-post-id="${post.id}" title="Delete this memory" aria-label="Delete memory">
              🗑️
            </button>
          </div>
        </div>

        <div class="wall-post-message-body">
          <p class="wall-post-message">${post.message}</p>
        </div>

        ${post.photo ? `
          <div class="wall-post-photo-wrapper">
            <img src="${post.photo}" alt="Memory photo by ${post.author}" class="wall-post-photo-img" loading="lazy" />
          </div>
        ` : ''}

        <div class="wall-post-footer">
          <span class="wall-post-community-tag">🪔 మన పండుగ జ్ఞాపకం</span>
          <button class="btn-like-post" data-post-id="${post.id}" title="Like this memory" aria-label="Like memory">
            <span class="heart-icon">❤️</span>
            <span class="like-count">${post.likes || 1}</span>
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

    // Like button listeners with animation
    this.postsContainer.querySelectorAll('.btn-like-post').forEach(btn => {
      btn.addEventListener('click', () => {
        const postId = btn.getAttribute('data-post-id');
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.likes = (post.likes || 0) + 1;
          this.savePosts();
          
          btn.classList.add('liked-pop');
          setTimeout(() => btn.classList.remove('liked-pop'), 400);

          const countSpan = btn.querySelector('.like-count');
          if (countSpan) countSpan.textContent = post.likes;
        }
      });
    });

    // Attached Photo click-to-enlarge listener
    this.postsContainer.querySelectorAll('.wall-post-photo-img').forEach(img => {
      img.addEventListener('click', () => {
        // Enlarge in custom modal or simple preview
        const zoomOverlay = document.createElement('div');
        zoomOverlay.className = 'photo-zoom-overlay';
        zoomOverlay.innerHTML = `
          <div class="photo-zoom-dialog">
            <img src="${img.src}" alt="Enlarged Memory Photo" style="max-width: 90vw; max-height: 85vh; border-radius: var(--radius-lg); border: 2px solid var(--gold-400);" />
            <button class="photo-zoom-close" aria-label="Close photo preview">✕</button>
          </div>
        `;
        document.body.appendChild(zoomOverlay);

        zoomOverlay.addEventListener('click', (e) => {
          if (e.target.classList.contains('photo-zoom-overlay') || e.target.classList.contains('photo-zoom-close')) {
            zoomOverlay.remove();
          }
        });
      });
    });
  }
}
