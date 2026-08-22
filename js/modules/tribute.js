/**
 * ============================================================================
 * TRIBUTE / IN LOVING MEMORY CONTROLLER ("FOREVER PART OF OUR MEMORIES")
 * ============================================================================
 */

import { memoriesData } from '../data/memoriesData.js';

export class TributeController {
  constructor(containerId = 'tribute-photos-container') {
    this.container = document.getElementById(containerId);
    if (!memoriesData.tribute) return;
    this.render();
  }

  render() {
    const data = memoriesData.tribute;
    if (!data || !this.container) return;

    // Render media sequence
    if (data.photos && data.photos.length > 0) {
      this.container.innerHTML = data.photos.map((item, idx) => `
        <div class="tribute-photo-card ${item.isMain ? 'is-main' : ''} ${item.type === 'video' ? 'is-tribute-video' : ''} reveal-item reveal-delay-${(idx % 3) + 1}"
             data-type="${item.type || 'image'}"
             data-src="${item.src}"
             data-video-url="${item.videoUrl || ''}"
             data-title="${item.title}"
             data-caption="${item.caption}">
          <img src="${item.src}" alt="${item.title}" loading="lazy" />
          ${item.type === 'video' ? `
            <div class="gallery-video-indicator">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span>Play Video Memory</span>
            </div>
          ` : ''}
          <div class="tribute-photo-caption-bar">
            <span style="font-weight: 500;">${item.type === 'video' ? '🎬 ' : ''}${item.title}</span>
            <span style="color: var(--gold-400); font-size: 0.75rem;">${item.type === 'video' ? '▶ Play' : '🔍 View'}</span>
          </div>
        </div>
      `).join('');

      // Attach click to open lightbox
      this.container.querySelectorAll('.tribute-photo-card').forEach(card => {
        card.addEventListener('click', () => {
          const type = card.getAttribute('data-type') || 'image';
          const src = card.getAttribute('data-src');
          const videoUrl = card.getAttribute('data-video-url');
          const title = card.getAttribute('data-title');
          const caption = card.getAttribute('data-caption');

          window.dispatchEvent(new CustomEvent('open-lightbox', {
            detail: {
              type: type,
              src: src,
              videoUrl: videoUrl,
              title: `${type === 'video' ? '🎬 ' : '🕊️ '}${title}`,
              caption: caption,
              category: 'In Loving Memory'
            }
          }));
        });
      });
    }
  }
}
