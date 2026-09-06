/**
 * ============================================================================
 * MAIN APPLICATION ORCHESTRATOR
 * ============================================================================
 */

import { memoriesData } from './data/memoriesData.js?v=6.8';
import { AmbientAudioEngine } from './modules/ambientAudio.js?v=6.0';
import { ParticleEngine } from './modules/particleCanvas.js?v=6.0';
import { TimelineController } from './modules/timeline.js?v=6.0';
import { GalleryController } from './modules/gallery.js?v=6.0';
import { InsideJokesController } from './modules/insideJokes.js?v=6.0';
import { FriendsController } from './modules/friendsSpotlight.js?v=6.8';
import { StorytellingController } from './modules/storytelling.js?v=6.0';
import { VideoMemoriesController } from './modules/videoMemories.js?v=6.0';
import { MemoryWallController } from './modules/memoryWall.js?v=6.0';
import { PhotoManagerController } from './modules/photoManager.js?v=6.0';
import { TributeController } from './modules/tribute.js?v=6.0';
import { FestiveInteractions } from './modules/festiveInteractions.js?v=6.9';
import { ShareManagerController } from './modules/shareManager.js?v=6.1';

class App {
  constructor() {
    this.init();
  }

  init() {
    // 1. Populate dynamic text bindings
    this.populateStaticBindings();

    // 2. Initialize sub-controllers
    this.audio = new AmbientAudioEngine();
    this.particles = new ParticleEngine('particle-canvas');
    this.timeline = new TimelineController();
    this.gallery = new GalleryController();
    this.jokes = new InsideJokesController();
    this.friends = new FriendsController();
    this.tribute = new TributeController();
    this.storytelling = new StorytellingController();
    this.videos = new VideoMemoriesController();
    if (document.getElementById('memory-wall-form')) {
      this.memoryWall = new MemoryWallController();
    }
    this.photoManager = new PhotoManagerController();
    this.festiveInteractions = new FestiveInteractions(this.audio, this.particles);
    this.shareManager = new ShareManagerController();

    // 3. Setup Scroll Observers & Interactions
    this.initScrollReveal();
    this.initNavigation();
    this.initReplay();

    // 4. Listen for refresh events
    window.addEventListener('refresh-timeline', () => this.timeline.render());
    window.addEventListener('refresh-gallery', () => this.gallery.renderGallery());
    window.addEventListener('refresh-friends', () => this.friends.render());
    window.addEventListener('refresh-reveals', () => this.initScrollReveal());

    console.log('✨ Our Vinayaka Chaturthi Memories website loaded successfully!');
  }

  populateStaticBindings() {
    // Hero Bindings
    const heroTitle = document.getElementById('hero-main-title');
    const heroQuote = document.getElementById('hero-pretitle-quote');
    const heroDesc = document.getElementById('hero-description-text');
    const heroBg = document.getElementById('hero-bg-image');
    const heroEnterBtn = document.getElementById('btn-enter-memories');

    if (heroTitle) heroTitle.innerHTML = `<span class="gold-shimmer">${memoriesData.hero.mainTitle}</span>`;
    if (heroQuote) heroQuote.textContent = memoriesData.hero.preTitleQuote;
    if (heroDesc) heroDesc.textContent = memoriesData.hero.welcomeDesc || memoriesData.hero.description;
    if (heroBg) heroBg.src = memoriesData.hero.bgImage;

    // The Beginning Bindings
    const prepLead = document.getElementById('prep-narrative-lead');
    const prepBody = document.getElementById('prep-narrative-body');
    const prepMainImg = document.getElementById('prep-main-img');
    const prepMainTag = document.getElementById('prep-main-tag');
    const prepMainTitle = document.getElementById('prep-main-title');
    const prepFeatures = document.getElementById('prep-features-grid');

    if (prepLead) prepLead.textContent = memoriesData.theBeginning.narrativeLead;
    if (prepBody) prepBody.textContent = memoriesData.theBeginning.narrativeBody;
    if (prepMainImg) prepMainImg.src = memoriesData.theBeginning.mainVisual.src;
    if (prepMainTag) prepMainTag.textContent = memoriesData.theBeginning.mainVisual.tag;
    if (prepMainTitle) prepMainTitle.textContent = memoriesData.theBeginning.mainVisual.title;

    if (prepFeatures) {
      prepFeatures.innerHTML = memoriesData.theBeginning.features.map(f => `
        <div class="prep-feature-item">
          <span class="prep-feature-icon">${f.icon}</span>
          <h4 class="prep-feature-title">${f.title}</h4>
          <p class="prep-feature-desc">${f.desc}</p>
        </div>
      `).join('');
    }

    // Finale Bindings
    const finaleLines = document.getElementById('finale-lines-container');
    const finaleBg = document.getElementById('finale-bg-img');

    if (finaleBg) finaleBg.src = memoriesData.finale.bgImage;
    if (finaleLines) {
      finaleLines.innerHTML = memoriesData.finale.lines.map(line => `
        <p class="finale-line">“${line}”</p>
      `).join('');
    }
  }

  initScrollReveal() {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.12
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal-item, .reveal-scale').forEach(el => {
      revealObserver.observe(el);
    });
  }

  initNavigation() {
    const header = document.querySelector('.site-header');
    const enterBtn = document.getElementById('btn-enter-memories');

    // Header scroll background
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // Enter memories click -> Smooth scroll + music play prompt
    if (enterBtn) {
      enterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById('beginning');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          // If music not started yet, gently start ambient music
          if (!this.audio.isPlaying) {
            this.audio.play();
          }
        }
      });
    }
  }

  initReplay() {
    const replayBtn = document.getElementById('btn-replay-memories');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.__VINAYAKA_APP__ = new App();
});
