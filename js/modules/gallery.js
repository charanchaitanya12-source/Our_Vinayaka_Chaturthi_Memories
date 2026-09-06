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
      { id: 'all', label: 'All Moments ✨' },
      { id: 'group', label: 'The Gang 👥' },
      { id: 'candid', label: 'Candid & Unfiltered 📸' },
      { id: 'decor', label: 'Mandap & Lights 🛕' },
      { id: 'food', label: 'Modak & Prasad 🥟' },
      { id: 'bloopers', label: 'Bloopers & Laughs 😂' },
      { id: 'visarjan', label: 'Visarjan & Video 🎬' }
    ];

    this.filterContainer.innerHTML = categories.map(cat => `
      <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
        ${cat.label}
      </button>
    `).join('');

    this.filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterCategory(btn.getAttribute('data-category'));
      });
    });
  }

  filterCategory(category) {
    this.activeFilter = category;
    if (category === 'all') {
      this.currentItems = [...memoriesData.gallery];
    } else {
      this.currentItems = memoriesData.gallery.filter(item => item.category === category);
    }
    this.renderGallery();
  }

  renderGallery() {
    if (!this.galleryGrid) return;

    this.galleryGrid.innerHTML = this.currentItems.map((item, idx) => `
      <div class="masonry-item reveal-scale ${item.type === 'video' ? 'is-video-item' : ''}" data-index="${idx}">
        <img class="masonry-img" src="${item.src}" alt="${item.title}" loading="lazy" />
        ${item.type === 'video' ? `
          <div class="gallery-video-indicator">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>Play Video</span>
          </div>
        ` : ''}
        <div class="masonry-overlay">
          <span class="masonry-category">${item.category.toUpperCase()} • ${item.date}</span>
          <h4 class="masonry-title">${item.type === 'video' ? '🎬 ' : ''}${item.title}</h4>
          <p class="masonry-caption">${item.caption}</p>
        </div>
      </div>
    `).join('');

    // Attach click triggers to open lightbox
    this.galleryGrid.querySelectorAll('.masonry-item').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.getAttribute('data-index'), 10);
        this.openAtIndex(index);
      });
    });

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

  displayItemInLightbox(item) {
    if (!this.lightboxModal) return;

    if (this.lightboxTitle) this.lightboxTitle.textContent = (item.type === 'video' ? '🎬 ' : '') + item.title;
    if (this.lightboxCategory) this.lightboxCategory.textContent = `${item.category.toUpperCase()} • ${item.date || 'Memory'}`;
    if (this.lightboxDesc) this.lightboxDesc.textContent = item.caption;

    if (item.type === 'video') {
      if (this.lightboxImg) this.lightboxImg.style.display = 'none';
      const iframe = document.getElementById('lightbox-iframe');
      const ytMatch = item.videoUrl && item.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);

      if (ytMatch && iframe) {
        if (this.lightboxVideo) {
          this.lightboxVideo.pause();
          this.lightboxVideo.removeAttribute('src');
          this.lightboxVideo.style.display = 'none';
        }
        iframe.style.display = 'block';
        iframe.src = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
      } else {
        if (iframe) {
          iframe.src = '';
          iframe.style.display = 'none';
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
            this.lightboxVideo.src = "";
          }
        }
      }
    } else {
      const iframe = document.getElementById('lightbox-iframe');
      if (iframe) {
        iframe.src = '';
        iframe.style.display = 'none';
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
    const iframe = document.getElementById('lightbox-iframe');
    if (iframe) {
      iframe.src = '';
      iframe.style.display = 'none';
    }
    this.lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }
}
