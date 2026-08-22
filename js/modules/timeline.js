/**
 * ============================================================================
 * CHRONOLOGICAL FESTIVAL TIMELINE CONTROLLER
 * ============================================================================
 */

import { memoriesData } from '../data/memoriesData.js';

export class TimelineController {
  constructor(containerId = 'timeline-items-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.render();
  }

  render() {
    this.container.innerHTML = memoriesData.timeline.map((item, idx) => `
      <div class="timeline-item reveal-item reveal-delay-${(idx % 3) + 1}">
        <div class="timeline-marker">${item.step}</div>
        <div class="timeline-content-box">
          <span class="timeline-badge">${item.badge}</span>
          <h3 class="timeline-title">${item.title}</h3>
          <p class="timeline-date" style="font-size: 0.78rem; color: var(--gold-400); margin-bottom: 0.6rem;">
            📅 ${item.date}
          </p>
          <p class="timeline-desc">${item.desc}</p>
          <div class="timeline-photo-wrapper" data-gallery-src="${item.imgSrc}" data-title="${item.title}" data-caption="${item.caption}">
            <img src="${item.imgSrc}" alt="${item.title}" loading="lazy" />
            <div class="timeline-photo-hover-tag">
              <span>🔍 ${item.photoTag}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Attach click triggers to open lightbox
    this.container.querySelectorAll('.timeline-photo-wrapper').forEach(wrapper => {
      wrapper.addEventListener('click', () => {
        const event = new CustomEvent('open-lightbox', {
          detail: {
            src: wrapper.getAttribute('data-gallery-src'),
            title: wrapper.getAttribute('data-title'),
            caption: wrapper.getAttribute('data-caption'),
            category: 'Timeline Memory'
          }
        });
        window.dispatchEvent(event);
      });
    });
  }
}
