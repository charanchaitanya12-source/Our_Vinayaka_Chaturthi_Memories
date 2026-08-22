/**
 * ============================================================================
 * FESTIVE INTERACTIONS ENGINE
 * ============================================================================
 * 1. Interactive Diya Lighting ("Light a Diya for Bappa & Sai Nikhil")
 * 2. Pushpanjali Flower Petals Shower
 * 3. 3D Card Parallax & Tilt Effect
 * 4. Digital Time Capsule Keepsake Generator & Modal
 */

import { memoriesData } from '../data/memoriesData.js';

export class FestiveInteractions {
  constructor(audioEngine, particleEngine) {
    this.audio = audioEngine;
    this.particles = particleEngine;
    this.diyaKey = 'vinayaka_diyas_lit_v1';
    
    this.init();
  }

  init() {
    this.initDiyaLighting();
    this.initFlowerShower();
    this.initCardTilt();
    this.initTimeCapsule();
  }

  /* --------------------------------------------------------------------------
     1. DIYA LIGHTING CONTROLLER
     -------------------------------------------------------------------------- */
  initDiyaLighting() {
    let litCount = parseInt(localStorage.getItem(this.diyaKey) || '108', 10);
    const countDisplays = document.querySelectorAll('.diya-counter-number');
    const updateDisplays = () => {
      countDisplays.forEach(el => {
        el.textContent = litCount.toLocaleString();
      });
    };
    updateDisplays();

    document.querySelectorAll('.btn-light-diya').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const diyaCard = btn.closest('.diya-interactive-widget');
        const flame = diyaCard ? diyaCard.querySelector('.diya-flame-glow') : null;
        
        litCount++;
        localStorage.setItem(this.diyaKey, litCount.toString());
        updateDisplays();

        if (flame) {
          flame.classList.add('is-lit');
          flame.classList.add('flame-pulse-anim');
        }

        btn.classList.add('is-active');
        btn.innerHTML = `<span>✨</span> <span>Diya Lit with Love</span>`;

        // Audio & visual rewards
        if (this.audio) this.audio.playDiyaChime();
        if (this.particles) this.particles.burstFlowers(40);

        // Show floating message
        this.showToast("🪔 Diya lit with pure devotion & love! 🙏");
      });
    });
  }

  /* --------------------------------------------------------------------------
     2. PUSHPANJALI FLOWER SHOWER
     -------------------------------------------------------------------------- */
  initFlowerShower() {
    const showerBtn = document.getElementById('btn-shower-flowers');
    if (showerBtn) {
      showerBtn.addEventListener('click', () => {
        if (this.particles) {
          this.particles.burstFlowers(60);
        }
        if (this.audio) {
          this.audio.playTempleBell();
        }
        this.showToast("🌸 Pushpanjali showered on Bappa & The Gang! ✨");
      });
    }
  }

  /* --------------------------------------------------------------------------
     3. 3D CARD PARALLAX & TILT
     -------------------------------------------------------------------------- */
  initCardTilt() {
    // Only on desktop devices with hover support
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const tiltElements = document.querySelectorAll('.friend-card, .tribute-photo-card, .timeline-card, .joke-card');
      
      tiltElements.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const rotateX = ((y - centerY) / centerY) * -5;
          const rotateY = ((x - centerX) / centerX) * 5;
          
          card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      });
    }
  }

  /* --------------------------------------------------------------------------
     4. DIGITAL TIME CAPSULE KEEPSAKE MODAL
     -------------------------------------------------------------------------- */
  initTimeCapsule() {
    const capsuleBtn = document.getElementById('btn-open-capsule');
    const modal = document.getElementById('capsule-modal');
    const closeBtn = document.getElementById('capsule-modal-close');
    const printBtn = document.getElementById('btn-print-capsule');

    if (!modal) return;

    if (capsuleBtn) {
      capsuleBtn.addEventListener('click', () => {
        modal.classList.add('is-active');
        document.body.style.overflow = 'hidden';
        if (this.particles) this.particles.burstFlowers(35);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('is-active');
        document.body.style.overflow = '';
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-active');
        document.body.style.overflow = '';
      }
    });

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  /* --------------------------------------------------------------------------
     TOAST NOTIFICATION HELPER
     -------------------------------------------------------------------------- */
  showToast(message) {
    let toast = document.getElementById('festive-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'festive-toast';
      toast.className = 'festive-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
}
