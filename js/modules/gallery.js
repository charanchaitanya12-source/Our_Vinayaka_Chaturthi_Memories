/**
 * ============================================================================
 * MASONRY GALLERY & FULLSCREEN LIGHTBOX CONTROLLER (With Video & Photo Support)
 * ============================================================================
 */

import { memoriesData } from '../data/memoriesData.js';

export class GalleryController {
  constructor() {
    this.galleryGrid = document.getElementById('masonry-gallery-grid');
    this.filterContainer = document.getElementById('gallery-filter-buttons');
    this.lightboxModal = document.getElementById('lightbox-modal');
    this.lightboxImg = document.getElementById('lightbox-img');
    this.lightboxVideo = document.getElementById('lightbox-video');
    this.lightboxIframe = document.getElementById('lightbox-iframe');
    this.lightboxMediaContainer = document.getElementById('lightbox-media-container');
    this.lightboxTitle = document.getElementById('lightbox-title');
    this.lightboxCategory = document.getElementById('lightbox-category');
    this.lightboxDesc = document.getElementById('lightbox-desc');
    this.lightboxClose = document.getElementById('lightbox-close');
    this.lightboxPrev = document.getElementById('lightbox-prev');
    this.lightboxNext = document.getElementById('lightbox-next');

    this.currentItems = [...memoriesData.gallery];
    this.currentIndex = 0;
    this.activeFilter = 'all';

    this.init();
  }

  init() {
    this.renderFilters();
    this.renderGallery();
    this.initLightbox();

    // Listen to external triggers (e.g. from timeline or friends)
    window.addEventListener('open-lightbox', (e) => {
      this.openDirect(e.detail);
    });
  }

  renderFilters() {
    if (!this.filterContainer) return;

    const categories = [
      { id: 'all', label: 'All Memories' },
      { id: 'group', label: 'The Gang' },
      { id: 'candid', label: 'Candid Smiles' },
      { id: 'visarjan', label: 'Visarjan & Farewells' },
      { id: 'food', label: 'Annadanam & Prasad' },
      { id: 'decor', label: 'Mandap & Lights' }
    ];

    this.filterContainer.innerHTML = categories.map(cat => `
      <button class="gallery-filter-btn ${cat.id === this.activeFilter ? 'active' : ''}" data-filter="${cat.id}">
        ${cat.label}
      </button>
    `).join('');

    this.filterContainer.querySelectorAll('.gallery-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilter = btn.getAttribute('data-filter');
        this.filterContainer.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderGallery();
      });
    });
  }

  renderGallery() {
    if (!this.galleryGrid) return;

    const filtered = this.activeFilter === 'all' 
      ? memoriesData.gallery 
      : memoriesData.gallery.filter(item => item.category === this.activeFilter);

    this.currentItems = filtered;

    this.galleryGrid.innerHTML = filtered.map((item, index) => {
      const isVideo = item.type === 'video';
      return `
        <div class="gallery-item aspect-${item.aspectRatio || 'landscape'} reveal-item" data-index="${index}">
          <img src="${item.src}" alt="${item.title}" loading="lazy" />
          <div class="gallery-overlay">
            <span class="gallery-item-tag">${item.category.toUpperCase()}</span>
            <h4 class="gallery-item-title">${item.title}</h4>
            <p class="gallery-item-caption">${item.caption}</p>
          </div>
          ${isVideo ? `
            <div class="video-play-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach click triggers to open lightbox
    this.galleryGrid.querySelectorAll('.gallery-item').forEach(itemElem => {
      itemElem.addEventListener('click', () => {
        const index = parseInt(itemElem.getAttribute('data-index'), 10);
        this.openAtIndex(index);
      });
    });

    // Refresh reveal animations
    window.dispatchEvent(new Event('refresh-reveals'));
  }

  initLightbox() {
    if (!this.lightboxModal) return;

    if (this.lightboxClose) {
      this.lightboxClose.addEventListener('click', () => this.closeLightbox());
    }

    if (this.lightboxPrev) {
      this.lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        this.prevImage();
      });
    }

    if (this.lightboxNext) {
      this.lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        this.nextImage();
      });
    }

    // Close on backdrop click
    this.lightboxModal.addEventListener('click', (e) => {
      if (e.target === this.lightboxModal) {
        this.closeLightbox();
      }
    });

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      if (!this.lightboxModal.classList.contains('active')) return;
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowLeft') this.prevImage();
      if (e.key === 'ArrowRight') this.nextImage();
    });
  }

  openAtIndex(index) {
    if (index < 0 || index >= this.currentItems.length) return;
    this.currentIndex = index;
    const item = this.currentItems[index];

    this.displayItemInLightbox(item);
  }

  /**
   * Helper to detect and convert YouTube, Vimeo, or cloud video links into embed URLs
   */
  getEmbedVideoUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();

    // YouTube: youtu.be, youtube.com/watch?v=, youtube.com/embed/, youtube.com/shorts/
    const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
    }

    // Vimeo
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    // Google Drive share/view links
    const gDriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (gDriveMatch && gDriveMatch[1]) {
      return `https://drive.google.com/file/d/${gDriveMatch[1]}/preview`;
    }

    return null;
  }

  displayItemInLightbox(item) {
    if (!this.lightboxModal) return;

    if (this.lightboxTitle) this.lightboxTitle.textContent = (item.type === 'video' ? '🎬 ' : '') + item.title;
    if (this.lightboxCategory) this.lightboxCategory.textContent = `${(item.category || 'Memory').toUpperCase()} • ${item.date || 'Memory'}`;
    if (this.lightboxDesc) this.lightboxDesc.textContent = item.caption || '';

    // Ensure iframe element reference is up to date
    if (!this.lightboxIframe) {
      this.lightboxIframe = document.getElementById('lightbox-iframe');
    }

    if (item.type === 'video') {
      if (this.lightboxImg) this.lightboxImg.style.display = 'none';

      const embedUrl = this.getEmbedVideoUrl(item.videoUrl);

      if (embedUrl) {
        // 1. YouTube / Vimeo / Cloud Video Embed
        if (this.lightboxVideo) {
          this.lightboxVideo.pause();
          this.lightboxVideo.removeAttribute('src');
          this.lightboxVideo.style.display = 'none';
        }
        if (this.lightboxIframe) {
          this.lightboxIframe.style.display = 'block';
          this.lightboxIframe.src = embedUrl;
        }
      } else {
        // 2. Standard HTML5 Video (MP4, WebM, Blob Object URL)
        if (this.lightboxIframe) {
          this.lightboxIframe.src = '';
          this.lightboxIframe.style.display = 'none';
        }
        if (this.lightboxVideo) {
          this.lightboxVideo.style.display = 'block';
          this.lightboxVideo.poster = item.src || '';
          if (item.videoUrl) {
            this.lightboxVideo.src = item.videoUrl;
            this.lightboxVideo.load();
            const playPromise = this.lightboxVideo.play();
            if (playPromise !== undefined) {
              playPromise.catch((err) => {
                console.log('Autoplay prevented by browser; player controls ready for user interaction.', err);
              });
            }
          } else {
            this.lightboxVideo.src = '';
          }
        }
      }
    } else {
      // Photo / Image display
      if (this.lightboxIframe) {
        this.lightboxIframe.src = '';
        this.lightboxIframe.style.display = 'none';
      }
      if (this.lightboxVideo) {
        this.lightboxVideo.pause();
        this.lightboxVideo.removeAttribute('src');
        this.lightboxVideo.style.display = 'none';
      }
      if (this.lightboxImg) {
        this.lightboxImg.style.display = 'block';
        this.lightboxImg.src = item.src;
      }
    }

    this.lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  openDirect(detail) {
    this.displayItemInLightbox({
      type: detail.type || 'image',
      src: detail.src,
      videoUrl: detail.videoUrl || '',
      title: detail.title,
      category: detail.category || 'Special Memory',
      caption: detail.caption,
      date: 'Memory'
    });
  }

  prevImage() {
    this.currentIndex = (this.currentIndex - 1 + this.currentItems.length) % this.currentItems.length;
    this.openAtIndex(this.currentIndex);
  }

  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.currentItems.length;
    this.openAtIndex(this.currentIndex);
  }

  closeLightbox() {
    if (!this.lightboxModal) return;

    if (this.lightboxVideo) {
      this.lightboxVideo.pause();
      this.lightboxVideo.removeAttribute('src');
      this.lightboxVideo.load();
    }

    if (this.lightboxIframe) {
      this.lightboxIframe.src = '';
      this.lightboxIframe.style.display = 'none';
    }

    this.lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }
}
