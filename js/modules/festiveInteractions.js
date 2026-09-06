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
import { CloudSyncService } from '../services/cloudSyncService.js';

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
    this.initPersonalizedCertificate();
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

    // Fetch live count from Cloud Database
    CloudSyncService.fetchDiyas().then(count => {
      if (typeof count === 'number') {
        litCount = count;
        updateDisplays();
      }
    });

    // Subscribe to live diya increments across all devices
    CloudSyncService.subscribeDiyas((count) => {
      if (typeof count === 'number') {
        litCount = count;
        updateDisplays();
      }
    });

    document.querySelectorAll('.btn-light-diya').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const diyaCard = btn.closest('.diya-interactive-widget');
        const flame = diyaCard ? diyaCard.querySelector('.diya-flame-glow') : null;
        
        litCount = await CloudSyncService.incrementDiyas();
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
    const modal = document.getElementById('capsule-modal');
    const closeBtn = document.getElementById('capsule-modal-close');

    if (!modal) return;

    const openCapsule = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      modal.classList.add('is-active');
      document.body.classList.add('capsule-modal-open');
      if (this.particles) this.particles.burstFlowers(35);
    };

    const closeCapsule = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      modal.classList.remove('is-active');
      document.body.classList.remove('capsule-modal-open');
    };

    // Attach to all capsule triggers (navbar, hero, finale, video section)
    document.querySelectorAll('.btn-capsule-trigger, #btn-open-capsule, #btn-nav-capsule, #btn-mobile-capsule, #btn-hero-capsule').forEach(btn => {
      btn.addEventListener('click', openCapsule);
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeCapsule);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCapsule(e);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) {
        closeCapsule(e);
      }
    });

    const printBtn = document.getElementById('btn-print-capsule');
    const printBottomBtn = document.getElementById('btn-print-capsule-bottom');

    const triggerFullPrint = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      document.body.classList.remove('print-cert-only');
      document.body.classList.remove('print-personalized-cert');
      window.print();
    };

    if (printBtn) {
      printBtn.addEventListener('click', triggerFullPrint);
    }

    if (printBottomBtn) {
      printBottomBtn.addEventListener('click', triggerFullPrint);
    }

    window.addEventListener('afterprint', () => {
      document.body.classList.remove('print-cert-only');
      document.body.classList.remove('print-personalized-cert');
    });
  }

  /* --------------------------------------------------------------------------
     5. PERSONALIZED PARTICIPATION CERTIFICATE GENERATOR & MODAL
     -------------------------------------------------------------------------- */
  initPersonalizedCertificate() {
    const certModal = document.getElementById('personalized-cert-modal');
    const certOnlyBtn = document.getElementById('btn-print-cert-only');
    const nameStep = document.getElementById('cert-name-step');
    const previewStep = document.getElementById('cert-preview-step');
    const nameInput = document.getElementById('cert-name-input');
    const nameError = document.getElementById('cert-name-error');
    const generateBtn = document.getElementById('btn-generate-cert');
    const cancelBtn = document.getElementById('btn-cancel-cert');
    const closeBtn = document.getElementById('cert-modal-close');
    const recipientNameEl = document.getElementById('cert-recipient-name');
    const printCertBtn = document.getElementById('btn-print-single-cert');
    const printCertBottomBtn = document.getElementById('btn-print-single-cert-bottom');
    const editNameBtn = document.getElementById('btn-edit-cert-name');
    const closePreviewBtn = document.getElementById('btn-close-cert-preview');
    const closeBottomBtn = document.getElementById('btn-close-cert-bottom');

    if (!certModal || !certOnlyBtn) return;

    const openNameModal = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (nameStep) nameStep.style.display = 'block';
      if (previewStep) previewStep.style.display = 'none';
      if (nameError) nameError.style.display = 'none';
      certModal.classList.add('is-active');
      document.body.classList.add('cert-modal-open');
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 60);
      }
    };

    const closeCertModal = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      certModal.classList.remove('is-active');
      document.body.classList.remove('cert-modal-open');
      document.body.classList.remove('print-personalized-cert');
      if (nameError) nameError.style.display = 'none';
    };

    const generateCertificate = () => {
      const rawName = nameInput ? nameInput.value : '';
      const cleanName = rawName ? rawName.trim().replace(/\s+/g, ' ') : '';

      if (!cleanName || cleanName.length === 0) {
        if (nameError) {
          nameError.textContent = '⚠️ Please enter your name to generate the certificate.';
          nameError.style.display = 'block';
        }
        if (nameInput) nameInput.focus();
        return;
      }

      if (nameError) nameError.style.display = 'none';
      if (recipientNameEl) {
        recipientNameEl.textContent = cleanName;
      }

      if (nameStep) nameStep.style.display = 'none';
      if (previewStep) previewStep.style.display = 'flex';

      if (this.particles) {
        this.particles.burstFlowers(30);
      }
    };

    const printCertificate = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      document.body.classList.remove('print-cert-only');
      document.body.classList.add('print-personalized-cert');
      window.print();
    };

    // Attach to "Print Certificate Only" button in Time Capsule topbar
    certOnlyBtn.addEventListener('click', openNameModal);

    if (generateBtn) {
      generateBtn.addEventListener('click', generateCertificate);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeCertModal);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeCertModal);
    }

    if (closePreviewBtn) {
      closePreviewBtn.addEventListener('click', closeCertModal);
    }

    if (closeBottomBtn) {
      closeBottomBtn.addEventListener('click', closeCertModal);
    }

    if (editNameBtn) {
      editNameBtn.addEventListener('click', () => {
        if (previewStep) previewStep.style.display = 'none';
        if (nameStep) nameStep.style.display = 'block';
        if (nameError) nameError.style.display = 'none';
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      });
    }

    if (nameInput) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          generateCertificate();
        } else {
          if (nameError && nameError.style.display !== 'none') {
            nameError.style.display = 'none';
          }
        }
      });
    }

    if (printCertBtn) {
      printCertBtn.addEventListener('click', printCertificate);
    }

    if (printCertBottomBtn) {
      printCertBottomBtn.addEventListener('click', printCertificate);
    }

    certModal.addEventListener('click', (e) => {
      if (e.target === certModal) {
        closeCertModal(e);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && certModal.classList.contains('is-active')) {
        closeCertModal(e);
      }
    });

    window.addEventListener('afterprint', () => {
      document.body.classList.remove('print-personalized-cert');
    });
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
