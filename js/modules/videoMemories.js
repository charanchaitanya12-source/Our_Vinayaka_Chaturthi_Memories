/**
 * ============================================================================
 * OUR MEMORIES - VIDEO CONTROLLER & PERSISTENT STORAGE
 * ============================================================================
 * Handles rendering of festival video memories, interactive play in lightbox,
 * inline video replacement with IndexedDB persistence across page refreshes,
 * and direct video card deletion.
 */

import { memoriesData } from '../data/memoriesData.js';

// Default backup clone of the initial videos
const DEFAULT_SAMPLE_VIDEOS = JSON.parse(JSON.stringify(memoriesData.videos));

/**
 * IndexedDB storage engine for persisting large video files and metadata
 */
class VideoStorageEngine {
  constructor() {
    this.dbName = 'BappaMemoriesVideoDB';
    this.storeName = 'customVideos';
    this.version = 2;
    this.dbPromise = this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => {
        console.warn('IndexedDB open error:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  async saveVideo(id, blob, duration, thumb, customFileName, title, desc) {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.put({
          id: id,
          blob: blob,
          duration: duration || '00:30',
          thumb: thumb || '',
          customFileName: customFileName || 'custom_video.mp4',
          title: title || 'Festival Memory',
          desc: desc || '',
          updatedAt: Date.now()
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('Failed to save video to IndexedDB:', err);
      return false;
    }
  }

  async getAllVideos() {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('Failed to load videos from IndexedDB:', err);
      return [];
    }
  }

  async deleteVideo(id) {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('Failed to delete video from IndexedDB:', err);
      return false;
    }
  }

  async clearAll() {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('Failed to clear video IndexedDB:', err);
      return false;
    }
  }
}

export class VideoMemoriesController {
  constructor(containerId = 'video-grid-container') {
    this.container = document.getElementById(containerId);
    this.settingsBtn = document.getElementById('btn-manage-videos');
    this.resetBtn = document.getElementById('btn-reset-videos-default');
    this.modal = document.getElementById('video-settings-modal');
    this.modalClose = document.getElementById('video-settings-close');
    this.addForm = document.getElementById('video-add-form');
    this.listContainer = document.getElementById('video-settings-list');

    this.videoStore = new VideoStorageEngine();

    this.init();
  }

  async init() {
    // 1. Restore persistent state (deleted videos + replaced video files)
    await this.restorePersistedVideos();

    // 2. Render initial view
    this.render();

    // 3. Attach header and modal triggers
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => this.openSettings());
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.handleResetToDefault());
    }

    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.closeSettings());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeSettings();
      });
    }

    if (this.addForm) {
      this.addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddVideo();
      });
    }

    // Listen for cross-module refreshes
    window.addEventListener('refresh-videos', () => this.render());
  }

  async restorePersistedVideos() {
    try {
      // A. Filter out any videos that were deleted by user
      const deletedJson = localStorage.getItem('bappa_deleted_video_ids');
      if (deletedJson) {
        const deletedIds = JSON.parse(deletedJson);
        if (Array.isArray(deletedIds) && deletedIds.length > 0) {
          memoriesData.videos = memoriesData.videos.filter(v => !deletedIds.includes(v.id));
        }
      }

      // B. Load any replaced video files from IndexedDB
      const savedList = await this.videoStore.getAllVideos();
      if (savedList && savedList.length > 0) {
        savedList.forEach(saved => {
          let existing = memoriesData.videos.find(v => v.id === saved.id);
          const blobUrl = URL.createObjectURL(saved.blob);

          if (existing) {
            existing.videoUrl = blobUrl;
            existing.thumb = saved.thumb || existing.thumb;
            existing.duration = saved.duration || existing.duration;
            existing.customFileName = saved.customFileName || 'Custom Video';
            existing.isCustom = true;
          } else {
            // Newly added video from past session
            memoriesData.videos.push({
              id: saved.id,
              title: saved.title || 'Celebration Video',
              desc: saved.desc || 'Our Vinayaka Chaturthi video memory.',
              thumb: saved.thumb || 'assets/images/video_thumb_visarjan_immersion.jpg',
              duration: saved.duration || '00:30',
              videoUrl: blobUrl,
              customFileName: saved.customFileName || 'Custom Video',
              isCustom: true
            });
          }
        });
      }
    } catch (e) {
      console.warn('Could not restore persisted videos:', e);
    }
  }

  render() {
    if (!this.container) return;

    if (!memoriesData.videos || memoriesData.videos.length === 0) {
      this.container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--bg-card); border: 1px dashed var(--border-medium); border-radius: var(--radius-xl);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🎬</div>
          <h3 style="font-family: var(--font-display); color: var(--gold-300); margin-bottom: 0.5rem;">No Videos in Our Memories</h3>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">All video cards were removed. You can reset back to the default sample videos or add your own.</p>
          <button id="btn-empty-reset-videos" class="btn-primary" style="font-size: 0.85rem; padding: 0.6rem 1.6rem;">
            ↺ Restore Sample Videos
          </button>
        </div>
      `;

      const emptyReset = document.getElementById('btn-empty-reset-videos');
      if (emptyReset) {
        emptyReset.addEventListener('click', () => this.handleResetToDefault());
      }
      return;
    }

    this.container.innerHTML = memoriesData.videos.map((vid, idx) => {
      const fileName = vid.customFileName || (vid.videoUrl ? vid.videoUrl.split('/').pop() : 'sample_video.mp4');
      const isCustom = vid.isCustom || false;

      return `
      <div class="video-card revealed reveal-delay-${(idx % 3) + 1}" data-video-id="${vid.id}" style="opacity: 1 !important; transform: none !important; visibility: visible !important;">
        <div class="video-thumb-wrapper" data-video-id="${vid.id}" title="Click to play in HD">
          <img src="${vid.thumb}" alt="${vid.title}" loading="lazy" />
          <div class="video-play-badge" aria-label="Play Video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <span class="video-duration">⏱ ${vid.duration || '00:30'}</span>
          ${isCustom 
            ? '<span class="video-status-tag custom">✨ Original Video</span>' 
            : '<span class="video-status-tag sample">Sample Video</span>'}
        </div>

        <div class="video-info">
          <div class="video-header-row">
            <h4 class="video-title">${vid.title}</h4>
          </div>
          <p class="video-desc">${vid.desc}</p>

          <!-- Action Buttons: Play, Replace, and Delete -->
          <div class="video-actions-bar">
            <button type="button" class="btn-video-card-play" data-video-id="${vid.id}" title="Play video">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <span>Play Video</span>
            </button>

            <label class="btn-video-card-replace" title="Replace with your original video file">
              <span>🔄 Replace</span>
              <input 
                type="file" 
                accept="video/mp4,video/webm,video/quicktime,video/*" 
                class="card-video-replace-input" 
                data-video-id="${vid.id}" 
                style="display:none;" 
              />
            </label>

            <button type="button" class="btn-video-card-delete" data-video-id="${vid.id}" title="Delete this video memory">
              <span>🗑️ Delete</span>
            </button>
          </div>

          ${isCustom ? `
            <div class="video-loaded-indicator">
              <span class="indicator-icon">✅</span>
              <span class="indicator-text" title="${vid.customFileName}">Saved: <strong>${vid.customFileName}</strong></span>
              <span class="indicator-badge">Persisted</span>
            </div>
          ` : `
            <div class="video-file-hint">
              <span class="hint-icon">🎬</span>
              <span class="hint-text">Sample Clip: <code>${fileName}</code></span>
            </div>
          `}
        </div>
      </div>
    `;
    }).join('');

    // Attach click, change, and delete events
    this.attachEvents();

    // Trigger reveal refresh to ensure visibility
    window.dispatchEvent(new Event('refresh-reveals'));
  }

  attachEvents() {
    if (!this.container) return;

    // 1. Play Button & Thumbnail click -> Open Lightbox
    this.container.querySelectorAll('.video-thumb-wrapper, .btn-video-card-play').forEach(elem => {
      elem.onclick = (e) => {
        e.stopPropagation();
        const vidId = elem.getAttribute('data-video-id');
        this.playVideoById(vidId);
      };
    });

    // 2. Inline "Replace Video" file picker -> Process & Save to IndexedDB
    this.container.querySelectorAll('.card-video-replace-input').forEach(input => {
      input.onchange = (e) => {
        const vidId = input.getAttribute('data-video-id');
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.handleReplaceVideoFile(vidId, file);
        }
      };
    });

    // 3. Direct Delete Button -> Remove Video
    this.container.querySelectorAll('.btn-video-card-delete').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const vidId = btn.getAttribute('data-video-id');
        this.handleDeleteVideo(vidId);
      };
    });
  }

  updateCardDOM(card, video) {
    if (!card) return;

    // Ensure card is fully visible
    card.classList.add('revealed');
    card.style.opacity = '1';
    card.style.transform = 'none';
    card.style.visibility = 'visible';

    // Update status tag on thumbnail
    const thumbWrapper = card.querySelector('.video-thumb-wrapper');
    if (thumbWrapper) {
      let tag = thumbWrapper.querySelector('.video-status-tag');
      if (!tag) {
        tag = document.createElement('span');
        thumbWrapper.appendChild(tag);
      }
      tag.className = 'video-status-tag custom';
      tag.textContent = '✨ Original Video';
    }

    // Update loaded status indicator
    const info = card.querySelector('.video-info');
    if (info) {
      const oldHint = info.querySelector('.video-file-hint');
      const oldIndicator = info.querySelector('.video-loaded-indicator');
      if (oldHint) oldHint.remove();
      if (oldIndicator) oldIndicator.remove();

      const newIndicator = document.createElement('div');
      newIndicator.className = 'video-loaded-indicator';
      newIndicator.innerHTML = `
        <span class="indicator-icon">✅</span>
        <span class="indicator-text" title="${video.customFileName}">Saved: <strong>${video.customFileName}</strong></span>
        <span class="indicator-badge">Persisted</span>
      `;
      info.appendChild(newIndicator);
    }
  }

  playVideoById(vidId) {
    const video = memoriesData.videos.find(v => v.id === vidId);
    if (!video) return;

    window.dispatchEvent(new CustomEvent('open-lightbox', {
      detail: {
        type: 'video',
        src: video.thumb,
        videoUrl: video.videoUrl || '',
        title: `🎬 ${video.title}`,
        caption: `${video.desc} ${video.customFileName ? `• Original: ${video.customFileName}` : ''} (Duration: ${video.duration || 'Video'})`,
        category: 'Our Memories'
      }
    }));
  }

  async handleReplaceVideoFile(vidId, file) {
    const video = memoriesData.videos.find(v => v.id === vidId);
    if (!video) return;

    const objectUrl = URL.createObjectURL(file);
    video.videoUrl = objectUrl;
    video.customFileName = file.name;
    video.isCustom = true;

    // 1. In-place DOM update (instant, prevents black screen & opacity loss)
    const card = this.container ? this.container.querySelector(`[data-video-id="${vidId}"]`) : null;
    if (card) {
      this.updateCardDOM(card, video);
    } else {
      this.render();
    }

    // 2. Immediately save video file to IndexedDB for persistent storage across refreshes
    await this.videoStore.saveVideo(vidId, file, video.duration, video.thumb, file.name, video.title, video.desc);

    // 3. Extract duration from video metadata
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.muted = true;
    probe.playsInline = true;
    probe.src = objectUrl;

    probe.onloadedmetadata = async () => {
      if (probe.duration && !isNaN(probe.duration) && probe.duration !== Infinity) {
        const mins = Math.floor(probe.duration / 60);
        const secs = Math.floor(probe.duration % 60).toString().padStart(2, '0');
        video.duration = `${mins.toString().padStart(2, '0')}:${secs}`;
        if (card) {
          const durationEl = card.querySelector('.video-duration');
          if (durationEl) durationEl.textContent = `⏱ ${video.duration}`;
        }
        // Save duration to IndexedDB
        await this.videoStore.saveVideo(vidId, file, video.duration, video.thumb, file.name, video.title, video.desc);
      }
    };

    // 4. Extract preview frame from video for thumbnail
    probe.onloadeddata = () => {
      probe.currentTime = Math.min(1.0, (probe.duration || 2) / 2);
    };

    probe.onseeked = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(probe.videoWidth || 640, 720);
        canvas.height = Math.round(canvas.width * ((probe.videoHeight || 360) / (probe.videoWidth || 640)));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(probe, 0, 0, canvas.width, canvas.height);
        const thumbData = canvas.toDataURL('image/jpeg', 0.85);
        video.thumb = thumbData;
        if (card) {
          const img = card.querySelector('.video-thumb-wrapper img');
          if (img) img.src = thumbData;
        }
        // Save thumbnail to IndexedDB
        await this.videoStore.saveVideo(vidId, file, video.duration, thumbData, file.name, video.title, video.desc);
      } catch (err) {
        console.warn('Could not generate frame thumbnail:', err);
      }
    };

    this.showToast(`💾 Original video "${file.name}" saved! It will remain even when you refresh.`);
  }

  async handleDeleteVideo(vidId) {
    const video = memoriesData.videos.find(v => v.id === vidId);
    const videoTitle = video ? video.title : 'this video';

    if (!confirm(`Are you sure you want to delete "${videoTitle}" from Our Memories?`)) {
      return;
    }

    // 1. Remove from in-memory array
    const idx = memoriesData.videos.findIndex(v => v.id === vidId);
    if (idx !== -1) {
      memoriesData.videos.splice(idx, 1);
    }

    // 2. Persist deletion in localStorage so it stays deleted across refresh
    let deletedIds = [];
    try {
      const saved = localStorage.getItem('bappa_deleted_video_ids');
      if (saved) deletedIds = JSON.parse(saved);
    } catch (e) {}
    if (!deletedIds.includes(vidId)) {
      deletedIds.push(vidId);
      localStorage.setItem('bappa_deleted_video_ids', JSON.stringify(deletedIds));
    }

    // 3. Remove from IndexedDB if it was custom
    await this.videoStore.deleteVideo(vidId);

    // 4. Update UI
    this.render();
    this.showToast(`🗑️ "${videoTitle}" deleted.`);
  }

  async handleResetToDefault() {
    if (!confirm('Reset all videos in Our Memories back to the original sample videos? Any custom replaced videos will be cleared.')) {
      return;
    }

    // 1. Clear deleted IDs from localStorage
    localStorage.removeItem('bappa_deleted_video_ids');

    // 2. Clear IndexedDB
    await this.videoStore.clearAll();

    // 3. Restore default sample list
    memoriesData.videos = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_VIDEOS));

    // 4. Re-render UI
    this.render();
    this.showToast('↺ Videos reset to original sample clips.');
  }

  showToast(message) {
    let toast = document.getElementById('video-toast-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'video-toast-notice';
      toast.className = 'video-feedback-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>✨</span> <span>${message}</span>`;
    toast.classList.add('show');

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  openSettings() {
    if (!this.modal) return;
    this.renderSettingsList();
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeSettings() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  renderSettingsList() {
    if (!this.listContainer) return;

    this.listContainer.innerHTML = memoriesData.videos.map((vid, idx) => `
      <div class="video-settings-item">
        <img class="video-settings-thumb" src="${vid.thumb}" alt="${vid.title}" />
        <div class="video-settings-details">
          <strong>${vid.title}</strong>
          <span style="font-size: 0.75rem; color: var(--gold-400);">⏱ ${vid.duration}</span>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0;">${vid.desc}</p>
          <div style="font-size: 0.75rem; color: var(--text-dim);">
            ${vid.isCustom ? `✅ Original Video: <strong>${vid.customFileName || 'Custom File'}</strong>` : `Source: ${vid.videoUrl ? vid.videoUrl.split('/').pop() : 'Sample Video'}`}
          </div>
        </div>
        <button class="btn-delete-video" data-id="${vid.id}" title="Delete Video Entry">
          🗑️ Delete
        </button>
      </div>
    `).join('');

    this.listContainer.querySelectorAll('.btn-delete-video').forEach(btn => {
      btn.addEventListener('click', async () => {
        const vidId = btn.getAttribute('data-id');
        await this.handleDeleteVideo(vidId);
        this.renderSettingsList();
      });
    });
  }

  async handleAddVideo() {
    const titleInput = document.getElementById('video-add-title');
    const descInput = document.getElementById('video-add-desc');
    const durationInput = document.getElementById('video-add-duration');
    const fileInput = document.getElementById('video-add-file');

    const title = titleInput ? titleInput.value.trim() : 'New Video';
    const desc = descInput ? descInput.value.trim() : '';
    const duration = durationInput ? durationInput.value.trim() : '00:30';

    const vidId = 'vid-' + Date.now();
    const newVideo = {
      id: vidId,
      title: title || 'New Celebration Video',
      desc: desc || 'Our Vinayaka Chaturthi video memory.',
      thumb: 'assets/images/video_thumb_visarjan_immersion.jpg',
      duration: duration || '00:30',
      videoUrl: '',
      isCustom: false
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      newVideo.videoUrl = URL.createObjectURL(file);
      newVideo.customFileName = file.name;
      newVideo.isCustom = true;

      // Save to IndexedDB so added video persists across refresh too!
      await this.videoStore.saveVideo(vidId, file, duration, newVideo.thumb, file.name, newVideo.title, newVideo.desc);
    }

    memoriesData.videos.push(newVideo);
    this.renderSettingsList();
    this.render();

    if (this.addForm) this.addForm.reset();
    this.showToast(`🎬 Added "${newVideo.title}" to Our Memories!`);
  }
}
