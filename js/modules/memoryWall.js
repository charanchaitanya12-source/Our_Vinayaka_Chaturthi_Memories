/**
 * ============================================================================
 * MEMORY WALL & LEAVE A MEMORY - SHARED REAL-TIME GUESTBOOK
 * ============================================================================
 * Features:
 * - Real online cloud persistence across all devices & visitors
 * - Real-time push updates without requiring page refresh
 * - Responsive Canvas photo compression (JPEG/WebP, max 720px, ~35KB)
 * - Anti-spam cooldown and like reaction tracking
 * - True loading state ("Opening the Memory Wall... 🪔") & genuine empty state
 * - Secure admin moderation (delete button only visible to admins)
 * - Beautiful bilingual toasts & celebratory flower showers
 * - Interactive Keepsake Card UI with festive stickers & like counters
 * - Filters: All Notes, With Photos, Most Loved
 */

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
    this.isLoading = true;
    this.lastSubmitTime = 0;
    this.posts = [];

    // Admin detection via URL param or session storage
    const urlParams = new URLSearchParams(window.location.search);
    this.isAdmin = urlParams.get('admin') === 'chaturthi2026' || sessionStorage.getItem('vinayaka_admin') === 'true';

    this.init();
  }

  async init() {
    this.createToastContainer();
    this.initStickerPicker();
    this.initPhotoUpload();
    this.initCharacterCounter();
    this.initFilterChips();
    this.initForm();
    this.initExportImport();

    // Render initial loading state immediately
    this.render();

    // Load posts from shared cloud database
    await this.loadPosts();

    // Listen for live real-time cloud updates across all connected devices
    CloudSyncService.subscribeMemories((cloudPosts) => {
      const demoIds = new Set(['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5']);
      if (Array.isArray(cloudPosts)) {
        this.posts = cloudPosts.filter(p => p && !demoIds.has(p.id) && !p.isDemo);
        this.isLoading = false;
        this.render();
      }
    });
  }

  createToastContainer() {
    if (!document.getElementById('memory-wall-toast')) {
      const toast = document.createElement('div');
      toast.id = 'memory-wall-toast';
      toast.className = 'memory-wall-toast';
      toast.innerHTML = `
        <div class="toast-icon" id="toast-icon">✨</div>
        <div class="toast-content">
          <div class="toast-title" id="toast-title">Success</div>
          <div class="toast-message" id="toast-message">Message</div>
        </div>
        <button type="button" class="toast-close" id="toast-close" aria-label="Close Notification">&times;</button>
      `;
      document.body.appendChild(toast);

      toast.querySelector('#toast-close').addEventListener('click', () => {
        toast.classList.remove('active');
      });
    }
  }

  showToast(title, message, type = 'success', duration = 5000) {
    const toast = document.getElementById('memory-wall-toast');
    if (!toast) return;

    const iconEl = toast.querySelector('#toast-icon');
    const titleEl = toast.querySelector('#toast-title');
    const msgEl = toast.querySelector('#toast-message');

    if (type === 'error') {
      toast.classList.add('toast-error');
      iconEl.textContent = '⚠️';
    } else {
      toast.classList.remove('toast-error');
      iconEl.textContent = '❤️';
    }

    titleEl.textContent = title;
    msgEl.textContent = message;

    toast.classList.add('active');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, duration);
  }

  async loadPosts() {
    this.isLoading = true;
    this.render();

    try {
      const demoIds = new Set(['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5']);
      const cloudPosts = await CloudSyncService.fetchMemories();

      if (cloudPosts && Array.isArray(cloudPosts)) {
        this.posts = cloudPosts.filter(p => p && !demoIds.has(p.id) && !p.isDemo);
      } else {
        this.posts = [];
      }
    } catch (err) {
      console.warn('Error loading memories:', err);
      this.posts = [];
    } finally {
      this.isLoading = false;
      this.render();
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

  formatDate(timestamp, defaultDateStr = '') {
    if (!timestamp) return defaultDateStr || 'Just Now • ఇప్పుడే';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return defaultDateStr || 'Just Now';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return defaultDateStr || 'Just Now';
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

      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        this.showToast('Invalid File Format', 'Please choose a JPG, PNG, or WebP photo.', 'error');
        this.photoFileInput.value = '';
        return;
      }

      // 10MB raw safety check
      if (file.size > 10 * 1024 * 1024) {
        this.showToast('File Too Large', 'Please choose a photo smaller than 10MB.', 'error');
        this.photoFileInput.value = '';
        return;
      }

      // Read & compress via HTML5 Canvas (max 720px, ~35KB)
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 720;
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

          // Compress to lightweight high-quality JPEG
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

    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const now = Date.now();
      // Anti-spam cooldown: 3s
      if (now - this.lastSubmitTime < 3000) {
        this.showToast('Please Wait', 'దయచేసి కాసేపు ఆగండి / Please wait a moment before posting again.', 'error', 3000);
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
        this.showToast(
          'Please write a memory ❤️',
          'దయచేసి మీ జ్ఞాపకాన్ని లేదా సందేశాన్ని రాయండి (కనీసం 3 అక్షరాలు) / Please enter a message with at least 3 characters.',
          'error',
          4000
        );
        if (messageInput) messageInput.focus();
        return;
      }

      const authorName = rawName || 'గల్లీ మిత్రుడు (Well Wisher)';
      const authorRole = rawRole || 'Street Family';

      this.isSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Saving to Cloud... 🪔</span>`;
      }

      const newPost = {
        id: 'mem_' + now + '_' + Math.random().toString(36).substr(2, 6),
        name: this.sanitize(authorName),
        author: this.sanitize(authorName),
        relation: this.sanitize(authorRole),
        role: this.sanitize(authorRole),
        memoryType: this.sanitize(rawCategory),
        category: this.sanitize(rawCategory),
        message: this.sanitize(rawMessage),
        sticker: this.selectedSticker || '🙏',
        photo: this.attachedPhotoDataUrl || null,
        photo_url: this.attachedPhotoDataUrl || null,
        createdAt: now,
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        likes: 0
      };

      try {
        // Save to online database
        await CloudSyncService.addMemory(newPost);
        this.lastSubmitTime = now;

        // Reset Form on success
        this.form.reset();
        this.selectedSticker = '🙏';
        this.attachedPhotoDataUrl = null;
        if (this.photoPreviewContainer) this.photoPreviewContainer.style.display = 'none';
        if (this.photoPreviewImg) this.photoPreviewImg.src = '';
        if (this.charCounter) this.charCounter.textContent = '0/500';

        this.stickerOptions.forEach(s => s.classList.remove('selected'));
        if (this.stickerOptions[0]) this.stickerOptions[0].classList.add('selected');

        // Show celebratory success message
        this.showToast(
          'Memory Added! ❤️',
          'Your memory has become a part of our Vinayaka Chaturthi Time Capsule forever. (మీ జ్ఞాపకం శాశ్వతంగా భద్రపరచబడింది 🪔)',
          'success',
          6000
        );

        // Trigger celebratory flower shower
        const flowerBtn = document.getElementById('btn-shower-flowers');
        if (flowerBtn) flowerBtn.click();

        // Refresh UI & smooth scroll to new memory
        this.render();
        setTimeout(() => {
          const newCard = document.getElementById(`card-${newPost.id}`);
          if (newCard) {
            newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newCard.classList.add('highlight-new-post');
            setTimeout(() => newCard.classList.remove('highlight-new-post'), 2500);
          }
        }, 150);

      } catch (err) {
        console.error('Failed to post memory:', err);
        this.showToast(
          'Something went wrong',
          'Something went wrong while saving your memory. Please try again. Your written message has been kept safe.',
          'error',
          5000
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Post to Memory Wall</span><span>•</span><span>జ్ఞాపకాన్ని చేర్చండి 🪔</span>`;
        }
        this.isSubmitting = false;
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
        reader.onload = async (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
              this.posts = imported;
              await CloudSyncService.saveMemories(this.posts);
              this.render();
              this.showToast(
                'Memories Imported!',
                `విజయవంతంగా ${imported.length} జ్ఞాపకాలు లోడ్ అయ్యాయి! / Successfully imported ${imported.length} memories!`,
                'success'
              );
            }
          } catch (err) {
            this.showToast('Invalid File', 'చెల్లని ఫైల్ ఫార్మాట్ / Invalid JSON file format.', 'error');
          }
        };
        reader.readAsText(file);
      });
    }
  }

  async deletePost(postId) {
    if (confirm('ఈ జ్ఞాపకాన్ని మెమొరీ వాల్ నుండి తొలగించాలా?\nAre you sure you want to delete this memory from the wall?')) {
      await CloudSyncService.deleteMemory(postId, 'chaturthi2026');
      this.posts = this.posts.filter(p => p.id !== postId);
      this.render();
      this.showToast('Memory Deleted', 'The memory was removed from the wall.', 'success', 3000);
    }
  }

  render() {
    if (!this.postsContainer) return;

    // 1. Loading State: "Opening the Memory Wall... 🪔"
    if (this.isLoading) {
      this.postsContainer.innerHTML = `
        <div class="wall-loading-state">
          <div class="wall-spinner-lamp">🪔</div>
          <h4 style="color: var(--gold-300); font-family: var(--font-display); font-size: 1.25rem; margin-bottom: 0.35rem;">
            Opening the Memory Wall... 🪔
          </h4>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            జ్ఞాపకాలను లోడ్ చేస్తున్నాము… Gathering heartfelt celebration memories...
          </p>
        </div>
      `;
      return;
    }

    // 2. Filter & Sort (Newest first by default)
    let filtered = [...this.posts];

    if (this.currentFilter === 'photos') {
      filtered = filtered.filter(p => Boolean(p.photo || p.photo_url));
    } else if (this.currentFilter === 'loved') {
      filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      // Default: createdAt DESC
      filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    // 3. Genuine Empty State
    if (filtered.length === 0) {
      this.postsContainer.innerHTML = `
        <div class="wall-empty-state">
          <div style="font-size: 2.6rem; margin-bottom: 0.5rem;">🪔</div>
          <h4 style="color: var(--gold-300); font-family: var(--font-display); font-size: 1.25rem; margin-bottom: 0.4rem;">
            జ్ఞాపకాలు ఏవీ లేవు / No memories here yet
          </h4>
          <p style="color: var(--text-muted); font-size: 0.92rem; max-width: 460px; margin: 0 auto; line-height: 1.5;">
            ${this.currentFilter === 'photos'
              ? 'ఫోటోలతో కూడిన జ్ఞాపకాలు ఇంకా రాలేదు. మీరే మొదటి ఫోటోను పోస్ట్ చేయండి! / No memories with photos yet. Be the first to share one!'
              : 'Be the first to leave a memory and make this Time Capsule even more special. మీరే మొదటి జ్ఞాపకాన్ని పంచుకోండి!'}
          </p>
        </div>
      `;
      return;
    }

    // 4. Render Memory Cards
    this.postsContainer.innerHTML = filtered.map(post => {
      const author = post.name || post.author || 'గల్లీ మిత్రుడు';
      const role = post.relation || post.role || 'Street Family';
      const category = post.memoryType || post.category || 'Memory';
      const photoSrc = post.photo || post.photo_url;
      const dateDisplay = this.formatDate(post.createdAt, post.date);
      const isLiked = localStorage.getItem('vinayaka_liked_' + post.id) === 'true';

      return `
        <div class="wall-post-card" id="card-${post.id}">
          <div class="wall-card-pin">📌</div>

          <div class="wall-post-header">
            <div class="wall-author-info">
              <div class="wall-author-avatar">${post.sticker || '🙏'}</div>
              <div>
                <div class="wall-author-name">${author}</div>
                <div class="wall-post-tag">
                  <span>${role}</span>
                  <span style="opacity: 0.6;">•</span>
                  <span class="wall-post-category-badge">${category}</span>
                </div>
              </div>
            </div>
            <div class="wall-header-actions">
              <span class="wall-post-date">${dateDisplay}</span>
              ${this.isAdmin ? `
                <button class="btn-delete-wall-post" data-post-id="${post.id}" title="Admin: Delete memory" aria-label="Delete memory">
                  🗑️
                </button>
              ` : ''}
            </div>
          </div>

          <div class="wall-post-message-body">
            <p class="wall-post-message">${post.message}</p>
          </div>

          ${photoSrc ? `
            <div class="wall-post-photo-wrapper">
              <img src="${photoSrc}" alt="Festival photo by ${author}" class="wall-post-photo-img" loading="lazy" />
            </div>
          ` : ''}

          <div class="wall-post-footer">
            <span class="wall-post-community-tag">🪔 మన పండుగ జ్ఞాపకం</span>
            <button class="btn-like-post ${isLiked ? 'liked-active' : ''}" data-post-id="${post.id}" title="Love this memory" aria-label="Love this memory">
              <span class="heart-icon">❤️</span>
              <span class="like-count">${post.likes || 0}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach Admin Delete listeners if admin
    if (this.isAdmin) {
      this.postsContainer.querySelectorAll('.btn-delete-wall-post').forEach(btn => {
        btn.addEventListener('click', () => {
          const postId = btn.getAttribute('data-post-id');
          this.deletePost(postId);
        });
      });
    }

    // Like button listeners with rapid-duplicate prevention
    this.postsContainer.querySelectorAll('.btn-like-post').forEach(btn => {
      btn.addEventListener('click', async () => {
        const postId = btn.getAttribute('data-post-id');
        const storageLikedKey = 'vinayaka_liked_' + postId;

        if (localStorage.getItem(storageLikedKey) === 'true') {
          // Already liked from this browser
          btn.classList.add('liked-pop');
          setTimeout(() => btn.classList.remove('liked-pop'), 400);
          this.showToast('Already Loved ❤️', 'మీరు ఇప్పటికే ఈ జ్ఞాపకాన్ని ఇష్టపడ్డారు! / You already loved this memory!', 'success', 2500);
          return;
        }

        // Record like
        localStorage.setItem(storageLikedKey, 'true');
        btn.classList.add('liked-active', 'liked-pop');
        setTimeout(() => btn.classList.remove('liked-pop'), 400);

        const newLikes = await CloudSyncService.likeMemory(postId);
        const countSpan = btn.querySelector('.like-count');
        if (countSpan) countSpan.textContent = newLikes;
      });
    });

    // Click-to-enlarge photo preview lightbox
    this.postsContainer.querySelectorAll('.wall-post-photo-img').forEach(img => {
      img.addEventListener('click', () => {
        const zoomOverlay = document.createElement('div');
        zoomOverlay.className = 'photo-zoom-overlay';
        zoomOverlay.innerHTML = `
          <div class="photo-zoom-dialog">
            <img src="${img.src}" alt="Enlarged Festival Memory Photo" style="max-width: 90vw; max-height: 85vh; border-radius: var(--radius-lg); border: 2px solid var(--gold-400); box-shadow: 0 16px 40px rgba(0,0,0,0.8);" />
            <button class="photo-zoom-close" aria-label="Close photo preview">&times;</button>
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
