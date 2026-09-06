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

  async saveVideo(id, blob, duration, thumb, customFileName, title, desc, videoUrl) {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.put({
          id: id,
          blob: blob || null,
          videoUrl: videoUrl || '',
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
    this.addVideoMainBtn = document.getElementById('btn-add-video-main');
    this.settingsBtn = document.getElementById('btn-manage-videos');
    this.resetBtn = document.getElementById('btn-reset-videos-default');

    // Dedicated Add Video Modal Elements
    this.addModal = document.getElementById('add-video-modal');
    this.addModalClose = document.getElementById('add-video-modal-close');
    this.addModalCancel = document.getElementById('btn-cancel-add-video');
    this.addModalForm = document.getElementById('modal-add-video-form');
    this.dropzone = document.getElementById('video-modal-dropzone');
    this.fileInput = document.getElementById('modal-video-file-input');
    this.browseBtn = document.getElementById('btn-browse-modal-video');
    this.changeFileBtn = document.getElementById('btn-change-modal-video');
    this.selectedInfo = document.getElementById('video-file-selected-info');
    this.emptyView = document.getElementById('video-dropzone-empty-view');
    this.selectedFilename = document.getElementById('video-selected-filename');
    this.selectedFilesize = document.getElementById('video-selected-filesize');
    this.previewPlayer = document.getElementById('modal-video-player-preview');
    this.titleInput = document.getElementById('modal-video-title');
    this.durationInput = document.getElementById('modal-video-duration');
    this.descInput = document.getElementById('modal-video-desc');
    this.urlInput = document.getElementById('modal-video-url-input');
    this.submitBtn = document.getElementById('btn-submit-add-video');

    // Inline Add Video Panel Elements (Directly on Our Memories Page)
    this.inlinePanel = document.getElementById('inline-add-video-panel');
    this.inlineCardWrapper = document.getElementById('inline-video-card-wrapper');
    this.inlineToggleBtn = document.getElementById('btn-toggle-add-video-panel');
    this.toggleLabel = document.getElementById('toggle-panel-label');
    this.toggleArrow = document.getElementById('toggle-panel-arrow');
    this.inlineForm = document.getElementById('inline-add-video-form');
    this.inlineDropzone = document.getElementById('inline-video-dropzone');
    this.inlineFileInput = document.getElementById('inline-video-file-input');
    this.inlineBrowseBtn = document.getElementById('btn-inline-browse');
    this.inlineChangeBtn = document.getElementById('btn-inline-change-file');
    this.inlineEmptyView = document.getElementById('inline-dropzone-empty');
    this.inlineSelectedView = document.getElementById('inline-file-selected');
    this.inlineFileName = document.getElementById('inline-file-name');
    this.inlineFileSize = document.getElementById('inline-file-size');
    this.inlinePreviewPlayer = document.getElementById('inline-preview-player');
    this.inlineTitleInput = document.getElementById('inline-video-title');
    this.inlineDurationInput = document.getElementById('inline-video-duration');
    this.inlineCategoryInput = document.getElementById('inline-video-category');
    this.inlineDescInput = document.getElementById('inline-video-desc');
    this.inlineUrlInput = document.getElementById('inline-video-url');
    this.inlineSubmitBtn = document.getElementById('btn-inline-submit-video');

    this.inlinePendingFile = null;
    this.inlinePendingThumb = null;
    this.inlinePendingDuration = null;

    // Existing Management Modal Elements
    this.modal = document.getElementById('video-settings-modal');
    this.modalClose = document.getElementById('video-settings-close');
    this.addForm = document.getElementById('video-add-form');
    this.listContainer = document.getElementById('video-settings-list');

    this.videoStore = new VideoStorageEngine();

    // State for pending upload
    this.currentPendingFile = null;
    this.currentPendingThumb = null;
    this.currentPendingDuration = null;

    this.init();
  }

  async init() {
    // 1. Restore persistent state (deleted videos + replaced video files)
    await this.restorePersistedVideos();

    // 2. Render initial view
    this.render();

    // 3. Add Video Main Button Trigger (Scrolls to and highlights the inline panel)
    if (this.addVideoMainBtn) {
      this.addVideoMainBtn.addEventListener('click', () => this.focusInlineAddPanel());
    }

    // 4. Inline Panel Toggle Collapse/Expand
    if (this.inlineToggleBtn) {
      this.inlineToggleBtn.addEventListener('click', () => this.toggleInlinePanel());
    }

    // 5. Inline File Upload Handlers
    if (this.inlineBrowseBtn && this.inlineFileInput) {
      this.inlineBrowseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.inlineFileInput.click();
      });
    }
    if (this.inlineChangeBtn && this.inlineFileInput) {
      this.inlineChangeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.inlineFileInput.click();
      });
    }
    if (this.inlineDropzone && this.inlineFileInput) {
      this.inlineDropzone.addEventListener('click', (e) => {
        if (e.target.closest('video') || e.target.closest('button')) return;
        this.inlineFileInput.click();
      });

      ['dragenter', 'dragover'].forEach(name => {
        this.inlineDropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.inlineDropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        this.inlineDropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.inlineDropzone.classList.remove('dragover');
        });
      });

      this.inlineDropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
          this.processInlineFile(dt.files[0]);
        }
      });

      this.inlineFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.processInlineFile(e.target.files[0]);
        }
      });
    }

    // 6. Inline Form Submission
    if (this.inlineForm) {
      this.inlineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmitInlineVideo();
      });
    }

    // 7. Modal Close Triggers
    if (this.addModalClose) {
      this.addModalClose.addEventListener('click', () => this.closeAddModal());
    }
    if (this.addModalCancel) {
      this.addModalCancel.addEventListener('click', () => this.closeAddModal());
    }
    if (this.addModal) {
      this.addModal.addEventListener('click', (e) => {
        if (e.target === this.addModal) this.closeAddModal();
      });
    }

    // 8. Modal File selection triggers
    if (this.browseBtn && this.fileInput) {
      this.browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fileInput.click();
      });
    }
    if (this.changeFileBtn && this.fileInput) {
      this.changeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fileInput.click();
      });
    }
    if (this.dropzone && this.fileInput) {
      this.dropzone.addEventListener('click', (e) => {
        if (e.target.closest('video') || e.target.closest('button')) return;
        this.fileInput.click();
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        this.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        this.dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dropzone.classList.remove('dragover');
        });
      });

      this.dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
          this.processSelectedFile(dt.files[0]);
        }
      });

      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.processSelectedFile(e.target.files[0]);
        }
      });
    }

    // 9. Modal Form Submission
    if (this.addModalForm) {
      this.addModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmitAddVideo();
      });
    }

    // 10. Existing management triggers
    const settingsWizardBtn = document.getElementById('btn-open-full-add-modal');
    if (settingsWizardBtn) {
      settingsWizardBtn.addEventListener('click', () => {
        this.closeSettings();
        this.focusInlineAddPanel();
      });
    }

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
        this.handleAddVideoFromSettings();
      });
    }

    // Escape key listener for modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.addModal && this.addModal.classList.contains('active')) {
          this.closeAddModal();
        } else if (this.modal && this.modal.classList.contains('active')) {
          this.closeSettings();
        }
      }
    });

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
          let videoUrl = '';
          if (saved.blob instanceof Blob) {
            videoUrl = URL.createObjectURL(saved.blob);
          } else if (saved.videoUrl) {
            videoUrl = saved.videoUrl;
          }

          if (existing) {
            if (videoUrl) existing.videoUrl = videoUrl;
            existing.thumb = saved.thumb || existing.thumb;
            existing.duration = saved.duration || existing.duration;
            existing.customFileName = saved.customFileName || existing.customFileName || 'Custom Video';
            existing.isCustom = true;
          } else {
            // Newly added video from past session
            memoriesData.videos.push({
              id: saved.id,
              title: saved.title || 'Celebration Video',
              desc: saved.desc || 'Our Vinayaka Chaturthi video memory.',
              thumb: saved.thumb || 'assets/images/video_thumb_visarjan_immersion.jpg',
              duration: saved.duration || '00:30',
              videoUrl: videoUrl,
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
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border: 1px dashed var(--border-medium); border-radius: var(--radius-xl);">
          <div style="font-size: 2.75rem; margin-bottom: 1rem;">🎬</div>
          <h3 style="font-family: var(--font-display); color: var(--gold-300); margin-bottom: 0.5rem; font-size: 1.4rem;">No Videos in Our Memories</h3>
          <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 1.75rem; max-width: 480px; margin-left: auto; margin-right: auto;">
            All video cards were removed. You can restore the original sample videos or add your own festival clips right now.
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button id="btn-empty-add-video" class="btn-primary" style="font-size: 0.9rem; padding: 0.65rem 1.75rem;">
              ➕ Add Your First Video
            </button>
            <button id="btn-empty-reset-videos" class="btn-secondary" style="font-size: 0.9rem; padding: 0.65rem 1.75rem;">
              ↺ Restore Sample Videos
            </button>
          </div>
        </div>
      `;

      const emptyAdd = document.getElementById('btn-empty-add-video');
      if (emptyAdd) {
        emptyAdd.addEventListener('click', () => this.openAddModal());
      }
      const emptyReset = document.getElementById('btn-empty-reset-videos');
      if (emptyReset) {
        emptyReset.addEventListener('click', () => this.handleResetToDefault());
      }
      return;
    }

    const cardsHtml = memoriesData.videos.map((vid, idx) => {
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

    // Interactive "+ Add Video Memory" Card at the end of the grid
    const addCardHtml = `
      <div class="video-card add-video-dashed-card revealed" id="card-add-new-video" role="button" tabindex="0" title="Click to add a new video memory to Our Memories">
        <div class="add-video-dashed-inner">
          <div class="add-video-icon-circle">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              <line x1="12" y1="9" x2="12" y2="15"></line>
              <line x1="9" y1="12" x2="15" y2="12"></line>
            </svg>
          </div>
          <h4 class="add-video-card-title">Add Video Memory</h4>
          <p class="add-video-card-subtitle">Upload your festival clip (MP4, WebM, MOV) or enter a video link</p>
          <button type="button" class="btn-primary" style="font-size: 0.82rem; padding: 0.5rem 1.25rem; pointer-events: none;">
            <span>➕ Add New Video</span>
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = cardsHtml + addCardHtml;

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

    // 4. Interactive "+ Add Video Memory" Card click -> Focus inline Add Video panel
    const addCard = this.container.querySelector('#card-add-new-video');
    if (addCard) {
      addCard.onclick = () => this.focusInlineAddPanel();
      addCard.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.focusInlineAddPanel();
        }
      };
    }
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

  openAddModal() {
    if (!this.addModal) return;
    this.addModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // If no file currently selected, show default empty state
    if (!this.currentPendingFile) {
      if (this.emptyView) this.emptyView.style.display = 'block';
      if (this.selectedInfo) this.selectedInfo.style.display = 'none';
      if (this.previewPlayer) {
        this.previewPlayer.pause();
        this.previewPlayer.removeAttribute('src');
      }
    }

    if (this.titleInput) {
      setTimeout(() => this.titleInput.focus(), 150);
    }
  }

  closeAddModal() {
    if (!this.addModal) return;
    this.addModal.classList.remove('active');
    document.body.style.overflow = '';

    if (this.previewPlayer) {
      this.previewPlayer.pause();
    }
  }

  resetAddModalForm() {
    this.currentPendingFile = null;
    this.currentPendingThumb = null;
    this.currentPendingDuration = null;

    if (this.addModalForm) this.addModalForm.reset();
    if (this.fileInput) this.fileInput.value = '';
    if (this.emptyView) this.emptyView.style.display = 'block';
    if (this.selectedInfo) this.selectedInfo.style.display = 'none';
    if (this.previewPlayer) {
      this.previewPlayer.pause();
      this.previewPlayer.removeAttribute('src');
      this.previewPlayer.style.display = 'none';
    }
    if (this.submitBtn) {
      this.submitBtn.disabled = false;
      this.submitBtn.innerHTML = '<span>Add to Our Memories</span> <span>✨</span>';
    }
  }

  processSelectedFile(file) {
    if (!file) return;

    this.currentPendingFile = file;
    const objectUrl = URL.createObjectURL(file);

    // 1. Update dropzone UI
    if (this.emptyView) this.emptyView.style.display = 'none';
    if (this.selectedInfo) this.selectedInfo.style.display = 'block';
    if (this.selectedFilename) this.selectedFilename.textContent = file.name;
    if (this.selectedFilesize) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      this.selectedFilesize.textContent = `${mb} MB • ${file.type || 'video/mp4'}`;
    }

    // 2. Set live preview player
    if (this.previewPlayer) {
      this.previewPlayer.src = objectUrl;
      this.previewPlayer.style.display = 'block';
      this.previewPlayer.load();
    }

    // 3. Auto-suggest title from file name if user hasn't typed one
    if (this.titleInput && (!this.titleInput.value || this.titleInput.value.trim() === '')) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      const capitalized = cleanName
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      this.titleInput.value = capitalized || 'Festival Celebration Memory';
    }

    // 4. Probe duration and auto-extract preview frame for thumbnail
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.muted = true;
    probe.playsInline = true;
    probe.src = objectUrl;

    probe.onloadedmetadata = () => {
      if (probe.duration && !isNaN(probe.duration) && probe.duration !== Infinity) {
        const mins = Math.floor(probe.duration / 60);
        const secs = Math.floor(probe.duration % 60).toString().padStart(2, '0');
        const durStr = `${mins.toString().padStart(2, '0')}:${secs}`;
        this.currentPendingDuration = durStr;
        if (this.durationInput) {
          this.durationInput.value = durStr;
        }
      }
    };

    probe.onloadeddata = () => {
      probe.currentTime = Math.min(1.0, (probe.duration || 2) / 2);
    };

    probe.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(probe.videoWidth || 640, 720);
        canvas.height = Math.round(canvas.width * ((probe.videoHeight || 360) / (probe.videoWidth || 640)));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(probe, 0, 0, canvas.width, canvas.height);
        this.currentPendingThumb = canvas.toDataURL('image/jpeg', 0.85);
      } catch (err) {
        console.warn('Could not generate frame thumbnail from video:', err);
      }
    };
  }

  async handleSubmitAddVideo() {
    const title = this.titleInput ? this.titleInput.value.trim() : '';
    const duration = this.durationInput && this.durationInput.value.trim() 
      ? this.durationInput.value.trim() 
      : (this.currentPendingDuration || '00:30');
    const desc = this.descInput && this.descInput.value.trim() 
      ? this.descInput.value.trim() 
      : 'Our Vinayaka Chaturthi video memory.';
    const url = this.urlInput ? this.urlInput.value.trim() : '';
    const file = this.currentPendingFile;

    if (!title) {
      alert('Please enter a title for this video memory.');
      if (this.titleInput) this.titleInput.focus();
      return;
    }

    if (!file && !url) {
      alert('Please choose a video file or enter a video link.');
      if (this.fileInput) this.fileInput.click();
      return;
    }

    if (this.submitBtn) {
      this.submitBtn.disabled = true;
      this.submitBtn.innerHTML = '<span>Saving to Memories... ⏳</span>';
    }

    const vidId = 'vid-custom-' + Date.now();
    const fallbackThumb = 'assets/images/video_thumb_visarjan_immersion.jpg';
    const thumb = this.currentPendingThumb || fallbackThumb;

    let videoUrl = '';
    let customFileName = '';

    if (file) {
      videoUrl = URL.createObjectURL(file);
      customFileName = file.name;
      // Save full file blob into IndexedDB
      await this.videoStore.saveVideo(vidId, file, duration, thumb, customFileName, title, desc, '');
    } else {
      videoUrl = url;
      customFileName = url.split('/').pop() || 'Web Video Link';
      // Save link into IndexedDB
      await this.videoStore.saveVideo(vidId, null, duration, thumb, customFileName, title, desc, url);
    }

    const newVideo = {
      id: vidId,
      title: title,
      desc: desc,
      thumb: thumb,
      duration: duration,
      videoUrl: videoUrl,
      customFileName: customFileName,
      isCustom: true
    };

    memoriesData.videos.push(newVideo);

    // Close modal and reset form
    this.closeAddModal();
    this.resetAddModalForm();

    // Re-render UI
    this.render();

    // Show feedback toast
    this.showToast(`🎬 Added "${newVideo.title}" to Our Memories!`);

    // Smoothly scroll to the newly created video card
    setTimeout(() => {
      const newCard = this.container.querySelector(`[data-video-id="${vidId}"]`);
      if (newCard) {
        newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        newCard.classList.add('video-card-newly-added');
        setTimeout(() => newCard.classList.remove('video-card-newly-added'), 4000);
      }
    }, 150);
  }

  async handleAddVideoFromSettings() {
    const titleInput = document.getElementById('video-add-title');
    const descInput = document.getElementById('video-add-desc');
    const durationInput = document.getElementById('video-add-duration');
    const fileInput = document.getElementById('video-add-file');

    const title = titleInput ? titleInput.value.trim() : 'New Celebration Video';
    const desc = descInput ? descInput.value.trim() : 'Our Vinayaka Chaturthi video memory.';
    const duration = durationInput ? durationInput.value.trim() : '00:30';

    const vidId = 'vid-custom-' + Date.now();
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

      // Save to IndexedDB so added video persists across refresh
      await this.videoStore.saveVideo(vidId, file, duration, newVideo.thumb, file.name, newVideo.title, newVideo.desc, '');
    }

    memoriesData.videos.push(newVideo);
    this.renderSettingsList();
    this.render();

    if (this.addForm) this.addForm.reset();
    this.showToast(`🎬 Added "${newVideo.title}" to Our Memories!`);
  }

  /* =========================================================================
     INLINE ADD VIDEO PANEL (ON THE "OUR MEMORIES" PAGE)
     ========================================================================= */
  focusInlineAddPanel() {
    if (this.inlinePanel) {
      if (this.inlineCardWrapper && this.inlineCardWrapper.classList.contains('collapsed')) {
        this.toggleInlinePanel(false);
      }
      this.inlinePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (this.inlineCardWrapper) {
        this.inlineCardWrapper.classList.add('panel-highlight-glow');
        setTimeout(() => {
          if (this.inlineCardWrapper) this.inlineCardWrapper.classList.remove('panel-highlight-glow');
        }, 3600);
      }
      if (this.inlineTitleInput) {
        setTimeout(() => this.inlineTitleInput.focus(), 300);
      }
    } else {
      this.openAddModal();
    }
  }

  toggleInlinePanel(forceState) {
    if (!this.inlineCardWrapper) return;
    const isCurrentlyCollapsed = this.inlineCardWrapper.classList.contains('collapsed');
    const collapse = typeof forceState === 'boolean' ? forceState : !isCurrentlyCollapsed;

    if (collapse) {
      this.inlineCardWrapper.classList.add('collapsed');
      if (this.toggleLabel) this.toggleLabel.textContent = 'Add Video';
      if (this.toggleArrow) this.toggleArrow.textContent = '▼';
    } else {
      this.inlineCardWrapper.classList.remove('collapsed');
      if (this.toggleLabel) this.toggleLabel.textContent = 'Collapse Panel';
      if (this.toggleArrow) this.toggleArrow.textContent = '▲';
    }
  }

  processInlineFile(file) {
    if (!file) return;

    this.inlinePendingFile = file;
    const objectUrl = URL.createObjectURL(file);

    // 1. Update dropzone UI
    if (this.inlineEmptyView) this.inlineEmptyView.style.display = 'none';
    if (this.inlineSelectedView) this.inlineSelectedView.style.display = 'block';
    if (this.inlineFileName) this.inlineFileName.textContent = file.name;
    if (this.inlineFileSize) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      this.inlineFileSize.textContent = `${mb} MB • ${file.type || 'video/mp4'}`;
    }

    // 2. Set live preview player
    if (this.inlinePreviewPlayer) {
      this.inlinePreviewPlayer.src = objectUrl;
      this.inlinePreviewPlayer.style.display = 'block';
      this.inlinePreviewPlayer.load();
    }

    // 3. Auto-suggest title from file name if user hasn't typed one
    if (this.inlineTitleInput && (!this.inlineTitleInput.value || this.inlineTitleInput.value.trim() === '')) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      const capitalized = cleanName
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      this.inlineTitleInput.value = capitalized || 'Festival Celebration Memory';
    }

    // 4. Probe duration and auto-extract preview frame for thumbnail
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.muted = true;
    probe.playsInline = true;
    probe.src = objectUrl;

    probe.onloadedmetadata = () => {
      if (probe.duration && !isNaN(probe.duration) && probe.duration !== Infinity) {
        const mins = Math.floor(probe.duration / 60);
        const secs = Math.floor(probe.duration % 60).toString().padStart(2, '0');
        const durStr = `${mins.toString().padStart(2, '0')}:${secs}`;
        this.inlinePendingDuration = durStr;
        if (this.inlineDurationInput) {
          this.inlineDurationInput.value = durStr;
        }
      }
    };

    probe.onloadeddata = () => {
      probe.currentTime = Math.min(1.0, (probe.duration || 2) / 2);
    };

    probe.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(probe.videoWidth || 640, 720);
        canvas.height = Math.round(canvas.width * ((probe.videoHeight || 360) / (probe.videoWidth || 640)));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(probe, 0, 0, canvas.width, canvas.height);
        this.inlinePendingThumb = canvas.toDataURL('image/jpeg', 0.85);
      } catch (err) {
        console.warn('Could not generate frame thumbnail from video:', err);
      }
    };
  }

  resetInlineForm() {
    this.inlinePendingFile = null;
    this.inlinePendingThumb = null;
    this.inlinePendingDuration = null;

    if (this.inlineForm) this.inlineForm.reset();
    if (this.inlineFileInput) this.inlineFileInput.value = '';
    if (this.inlineEmptyView) this.inlineEmptyView.style.display = 'block';
    if (this.inlineSelectedView) this.inlineSelectedView.style.display = 'none';
    if (this.inlinePreviewPlayer) {
      this.inlinePreviewPlayer.pause();
      this.inlinePreviewPlayer.removeAttribute('src');
    }
    if (this.inlineSubmitBtn) {
      this.inlineSubmitBtn.disabled = false;
      this.inlineSubmitBtn.innerHTML = '<span>✨ Add Video to Our Memories</span>';
    }
  }

  async handleSubmitInlineVideo() {
    const title = this.inlineTitleInput ? this.inlineTitleInput.value.trim() : '';
    const duration = this.inlineDurationInput && this.inlineDurationInput.value.trim() 
      ? this.inlineDurationInput.value.trim() 
      : (this.inlinePendingDuration || '00:30');
    const desc = this.inlineDescInput && this.inlineDescInput.value.trim() 
      ? this.inlineDescInput.value.trim() 
      : 'Our Vinayaka Chaturthi video memory.';
    const url = this.inlineUrlInput ? this.inlineUrlInput.value.trim() : '';
    const file = this.inlinePendingFile;

    if (!title) {
      alert('Please enter a title for this video memory.');
      if (this.inlineTitleInput) this.inlineTitleInput.focus();
      return;
    }

    if (!file && !url) {
      alert('Please choose a video file or enter a video web link.');
      if (this.inlineFileInput) this.inlineFileInput.click();
      return;
    }

    if (this.inlineSubmitBtn) {
      this.inlineSubmitBtn.disabled = true;
      this.inlineSubmitBtn.innerHTML = '<span>Saving to Our Memories... ⏳</span>';
    }

    const vidId = 'vid-custom-' + Date.now();
    const fallbackThumb = 'assets/images/video_thumb_visarjan_immersion.jpg';
    const thumb = this.inlinePendingThumb || fallbackThumb;

    let videoUrl = '';
    let customFileName = '';

    if (file) {
      videoUrl = URL.createObjectURL(file);
      customFileName = file.name;
      // Save full file blob into IndexedDB
      await this.videoStore.saveVideo(vidId, file, duration, thumb, customFileName, title, desc, '');
    } else {
      videoUrl = url;
      customFileName = url.split('/').pop() || 'Web Video Link';
      // Save link into IndexedDB
      await this.videoStore.saveVideo(vidId, null, duration, thumb, customFileName, title, desc, url);
    }

    const newVideo = {
      id: vidId,
      title: title,
      desc: desc,
      thumb: thumb,
      duration: duration,
      videoUrl: videoUrl,
      customFileName: customFileName,
      isCustom: true
    };

    memoriesData.videos.push(newVideo);

    // Reset inline form
    this.resetInlineForm();

    // Re-render video grid
    this.render();

    // Show celebratory feedback toast
    this.showToast(`🎬 Added "${newVideo.title}" directly to Our Memories!`);

    // Smoothly scroll down to the newly created video card
    setTimeout(() => {
      const newCard = this.container.querySelector(`[data-video-id="${vidId}"]`);
      if (newCard) {
        newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        newCard.classList.add('video-card-newly-added');
        setTimeout(() => newCard.classList.remove('video-card-newly-added'), 4000);
      }
    }, 150);
  }
}
