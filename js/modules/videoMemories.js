/**
 * ============================================================================
 * VIDEO MEMORIES & MEDIA VECTORS CONTROLLER
 * ============================================================================
 * Includes dedicated settings to change, edit, or add new video/media entries.
 */

import { memoriesData } from '../data/memoriesData.js';

export class VideoMemoriesController {
  constructor(containerId = 'video-grid-container') {
    this.container = document.getElementById(containerId);
    this.settingsBtn = document.getElementById('btn-manage-videos');
    this.modal = document.getElementById('video-settings-modal');
    this.modalClose = document.getElementById('video-settings-close');
    this.addForm = document.getElementById('video-add-form');
    this.listContainer = document.getElementById('video-settings-list');

    this.init();
  }

  init() {
    this.render();

    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => this.openSettings());
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
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = memoriesData.videos.map((vid, idx) => `
      <div class="video-card reveal-item reveal-delay-${(idx % 3) + 1}">
        <div class="video-thumb-wrapper" data-video-id="${vid.id}">
          <img src="${vid.thumb}" alt="${vid.title}" loading="lazy" />
          <div class="video-play-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <span class="video-duration">⏱ ${vid.duration || '02:00'}</span>
        </div>
        <div class="video-info">
          <h4 class="video-title">${vid.title}</h4>
          <p class="video-desc">${vid.desc}</p>
        </div>
      </div>
    `).join('');

    // Attach click to preview in lightbox
    this.container.querySelectorAll('.video-thumb-wrapper').forEach(wrapper => {
      wrapper.addEventListener('click', () => {
        const vidId = wrapper.getAttribute('data-video-id');
        const video = memoriesData.videos.find(v => v.id === vidId);
        if (video) {
          window.dispatchEvent(new CustomEvent('open-lightbox', {
            detail: {
              type: 'video',
              src: video.thumb,
              videoUrl: video.videoUrl || '',
              title: `🎬 ${video.title}`,
              caption: `${video.desc} (Duration: ${video.duration})`,
              category: 'Motion & Melodies'
            }
          }));
        }
      });
    });
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
          <div style="font-size: 0.75rem; color: var(--text-dim);">Source: ${vid.videoUrl ? 'Custom Video Attached' : 'Using Poster Preview'}</div>
        </div>
        <button class="btn-delete-video" data-index="${idx}" title="Delete Video Entry">
          🗑️ Delete
        </button>
      </div>
    `).join('');

    this.listContainer.querySelectorAll('.btn-delete-video').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index'), 10);
        memoriesData.videos.splice(index, 1);
        this.renderSettingsList();
        this.render();
      });
    });
  }

  handleAddVideo() {
    const titleInput = document.getElementById('video-add-title');
    const descInput = document.getElementById('video-add-desc');
    const durationInput = document.getElementById('video-add-duration');
    const urlInput = document.getElementById('video-add-url');
    const fileInput = document.getElementById('video-add-file');

    const title = titleInput ? titleInput.value.trim() : 'New Video';
    const desc = descInput ? descInput.value.trim() : '';
    const duration = durationInput ? durationInput.value.trim() : '02:30';
    let videoUrl = urlInput ? urlInput.value.trim() : '';

    const newVideo = {
      id: 'vid-' + Date.now(),
      title: title || 'New Celebration Video',
      desc: desc || 'Our Vinayaka Chaturthi video memory.',
      thumb: 'assets/images/video_thumb_visarjan_immersion.jpg',
      duration: duration || '02:30',
      videoUrl: videoUrl
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      newVideo.videoUrl = URL.createObjectURL(file);
    }

    memoriesData.videos.push(newVideo);
    this.renderSettingsList();
    this.render();

    if (this.addForm) this.addForm.reset();
    alert('🎬 New video entry added successfully!');
  }
}
