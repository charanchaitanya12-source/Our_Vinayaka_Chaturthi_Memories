/**
 * ============================================================================
 * MEDIA & VIDEO CUSTOMIZER / REPLACEMENT MANAGER
 * ============================================================================
 * Allows the user to easily replace any photo or add/replace videos
 * directly in the browser, preview them in real time, and export updated config!
 */

import { memoriesData } from '../data/memoriesData.js';

export class PhotoManagerController {
  constructor() {
    this.modal = document.getElementById('customizer-modal');
    this.openBtn = document.getElementById('btn-open-customizer');
    this.closeBtn = document.getElementById('customizer-close');
    this.slotContainer = document.getElementById('customizer-slots-container');
    this.exportConfigBtn = document.getElementById('btn-export-config');

    this.init();
  }

  init() {
    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => this.openModal());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    if (this.exportConfigBtn) {
      this.exportConfigBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memoriesData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "customized_memories_data.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        alert('🎉 Config exported! You can replace js/data/memoriesData.js or keep your local memories.');
      });
    }

    this.renderSlots();
  }

  openModal() {
    if (!this.modal) return;
    this.renderSlots();
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  renderSlots() {
    if (!this.slotContainer) return;

    // Collect all replaceable image & video slots
    const slots = [
      {
        id: 'hero-bg',
        label: 'Hero Background / Bappa Aura',
        section: 'Hero Section',
        type: 'image',
        src: memoriesData.hero.bgImage,
        onUpdate: (newSrc) => {
          memoriesData.hero.bgImage = newSrc;
          const el = document.getElementById('hero-bg-image');
          if (el) el.src = newSrc;
        }
      },
      {
        id: 'the-beginning-main',
        label: 'The Beginning Showcase',
        section: 'Preparations & Day 0',
        type: 'image',
        src: memoriesData.theBeginning.mainVisual.src,
        onUpdate: (newSrc) => {
          memoriesData.theBeginning.mainVisual.src = newSrc;
          const el = document.getElementById('prep-main-img');
          if (el) el.src = newSrc;
        }
      },
      ...memoriesData.timeline.map((t, idx) => ({
        id: `timeline-${t.id}`,
        label: `Timeline: ${t.title}`,
        section: `Timeline Step ${t.step}`,
        type: 'image',
        src: t.imgSrc,
        onUpdate: (newSrc) => {
          t.imgSrc = newSrc;
          window.dispatchEvent(new Event('refresh-timeline'));
        }
      })),
      ...memoriesData.gallery.map((g, idx) => ({
        id: `gal-${g.id}`,
        label: `Gallery: ${g.title}`,
        section: `Gallery (${g.category})`,
        type: g.type === 'video' ? 'video' : 'image',
        src: g.src,
        videoUrl: g.videoUrl || '',
        onUpdate: (newSrc) => {
          g.src = newSrc;
          window.dispatchEvent(new Event('refresh-gallery'));
        },
        onVideoUpdate: (newVideoUrl) => {
          g.videoUrl = newVideoUrl;
          g.type = 'video';
          window.dispatchEvent(new Event('refresh-gallery'));
        }
      })),
      ...memoriesData.videos.map((v, idx) => ({
        id: `video-memory-${v.id}`,
        label: `Video: ${v.title}`,
        section: 'Motion & Melodies',
        type: 'video',
        src: v.thumb,
        videoUrl: v.videoUrl || '',
        onUpdate: (newThumb) => {
          v.thumb = newThumb;
          window.dispatchEvent(new Event('refresh-videos'));
        },
        onVideoUpdate: (newVideoUrl) => {
          v.videoUrl = newVideoUrl;
          window.dispatchEvent(new Event('refresh-videos'));
        }
      })),
      {
        id: 'finale-bg',
        label: 'Final Group Memory Photo',
        section: 'The Emotional Finale',
        type: 'image',
        src: memoriesData.finale.bgImage,
        onUpdate: (newSrc) => {
          memoriesData.finale.bgImage = newSrc;
          const el = document.getElementById('finale-bg-img');
          if (el) el.src = newSrc;
        }
      }
    ];

    this.slotContainer.innerHTML = slots.map((slot, idx) => `
      <div class="customizer-slot-card ${slot.type === 'video' ? 'video-slot-card' : ''}" data-slot-index="${idx}">
        <img class="slot-preview-img" src="${slot.src}" alt="${slot.label}" />
        <div class="slot-name">${slot.type === 'video' ? '🎬 ' : ''}${slot.label}</div>
        <div class="slot-category">${slot.section}</div>
        
        <input type="file" accept="image/*" class="slot-file-input" style="display:none;" id="slot-img-input-${idx}" />
        <button class="btn-slot-upload" style="margin-bottom: 0.35rem;" onclick="document.getElementById('slot-img-input-${idx}').click()">
          📷 Replace ${slot.type === 'video' ? 'Thumbnail' : 'Photo'}
        </button>

        ${slot.type === 'video' ? `
          <input type="file" accept="video/*" class="slot-video-file-input" style="display:none;" id="slot-vid-input-${idx}" />
          <button class="btn-slot-upload" style="background: rgba(104, 21, 35, 0.4); border-color: var(--gold-400);" onclick="document.getElementById('slot-vid-input-${idx}').click()">
            🎥 Upload Video File (.mp4)
          </button>
        ` : ''}
      </div>
    `).join('');

    // Attach file input change listeners
    slots.forEach((slot, idx) => {
      const imgInput = document.getElementById(`slot-img-input-${idx}`);
      if (imgInput) {
        imgInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            const newSrc = event.target.result;
            slot.onUpdate(newSrc);
            this.renderSlots();
          };
          reader.readAsDataURL(file);
        });
      }

      const vidInput = document.getElementById(`slot-vid-input-${idx}`);
      if (vidInput && slot.onVideoUpdate) {
        vidInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const videoUrl = URL.createObjectURL(file);
          slot.onVideoUpdate(videoUrl);
          alert(`🎬 Video attached for "${slot.label}"!`);
          this.renderSlots();
        });
      }
    });
  }
}
