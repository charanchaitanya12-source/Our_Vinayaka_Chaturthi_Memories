/**
 * ============================================================================
 * EMOTIONAL STORYTELLING CONTROLLER ("IF YOU REMEMBER THIS...")
 * ============================================================================
 */

import { memoriesData } from '../data/memoriesData.js';

export class StorytellingController {
  constructor(containerId = 'storytelling-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.render();
  }

  render() {
    this.container.innerHTML = memoriesData.emotionalStories.map((story, idx) => `
      <div class="story-slide reveal-scale">
        <img class="story-slide-bg" src="${story.bgImage}" alt="${story.quote}" loading="lazy" />
        <div class="story-slide-overlay"></div>
        <div class="story-slide-content">
          <span class="story-slide-tag">${story.tag}</span>
          <h3 class="story-slide-quote">${story.quote}</h3>
          <p class="story-slide-subtext">${story.subtext}</p>
        </div>
      </div>
    `).join('');
  }
}
