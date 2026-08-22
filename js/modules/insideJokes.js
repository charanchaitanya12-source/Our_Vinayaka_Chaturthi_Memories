/**
 * ============================================================================
 * INSIDE JOKES & BANTER CONTROLLER ("THINGS ONLY WE UNDERSTAND")
 * ============================================================================
 */

import { memoriesData } from '../data/memoriesData.js';

export class InsideJokesController {
  constructor(containerId = 'jokes-grid-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.render();
  }

  render() {
    this.container.innerHTML = memoriesData.insideJokes.map((joke, idx) => `
      <div class="joke-card polaroid-card reveal-item reveal-delay-${(idx % 3) + 1}" style="transform: rotate(${joke.rotation});">
        <span class="joke-stamp">${joke.stamp}</span>
        <div class="joke-icon-badge">${joke.icon}</div>
        <h4 class="joke-title">${joke.title}</h4>
        <p class="joke-handwritten">${joke.handwritten}</p>
        <div class="joke-footer-tag">
          <span>${joke.tag}</span>
          <span>😂 Priceless Memory</span>
        </div>
      </div>
    `).join('');
  }
}
