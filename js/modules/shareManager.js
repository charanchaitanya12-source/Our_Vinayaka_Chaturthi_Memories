/**
 * ============================================================================
 * SHARE MANAGER - NATIVE WEB SHARE API WITH ELEGANT COPY-LINK FALLBACK
 * ============================================================================
 * - Uses native Web Share API on mobile devices (WhatsApp, Messages, etc.)
 * - Falls back to Clipboard API on desktop/unsupported browsers
 * - Shows subtle "Link copied ❤️" toast notification (zero annoying popups)
 */

export class ShareManagerController {
  constructor() {
    this.toast = document.getElementById('share-toast');
    this.shareButtons = document.querySelectorAll('.btn-share-trigger, #btn-hero-share, #btn-header-share, #btn-finale-share');
    this.toastTimer = null;

    this.shareData = {
      title: 'Our Vinayaka Chaturthi Memories • మన జ్ఞాపకాలు',
      text: 'మన పండుగలోని అందమైన క్షణాలు, మనుషులు, జ్ఞాపకాలు… Explore our Vinayaka Chaturthi street memories!',
      url: window.location.href.split('#')[0] // clean base URL
    };

    this.init();
  }

  init() {
    // Create toast dynamically if not in DOM
    if (!this.toast) {
      this.toast = document.createElement('div');
      this.toast.id = 'share-toast';
      this.toast.className = 'share-toast-notification';
      this.toast.setAttribute('role', 'status');
      this.toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.toast);
    }

    // Attach click handlers to all share triggers
    this.shareButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleShare();
      });
    });
  }

  async handleShare() {
    // 1. Try Native Web Share API (Mobile Browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: this.shareData.title,
          text: this.shareData.text,
          url: this.shareData.url
        });
        // User successfully shared
        this.showToast('Shared with love ❤️ • ధన్యవాదాలు!');
        return;
      } catch (err) {
        // If user cancelled the share dialog, do nothing
        if (err.name === 'AbortError') {
          return;
        }
        console.warn('Web Share API encountered an issue, falling back to copy link:', err);
      }
    }

    // 2. Fallback: Copy Link to Clipboard
    await this.copyLinkToClipboard();
  }

  async copyLinkToClipboard() {
    const urlToCopy = this.shareData.url;
    let copied = false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(urlToCopy);
        copied = true;
      } catch (e) {
        console.warn('Clipboard writeText failed, using fallback textarea:', e);
      }
    }

    if (!copied) {
      // Legacy fallback using temporary input
      try {
        const tempInput = document.createElement('input');
        tempInput.value = urlToCopy;
        tempInput.style.position = 'fixed';
        tempInput.style.opacity = '0';
        document.body.appendChild(tempInput);
        tempInput.focus();
        tempInput.select();
        copied = document.execCommand('copy');
        document.body.removeChild(tempInput);
      } catch (err) {
        console.error('Copy fallback failed:', err);
      }
    }

    if (copied) {
      this.showToast('Link copied ❤️', 'లింక్ కాపీ అయింది. ఎవరికైనా షేర్ చేయండి!');
    } else {
      this.showToast('Link ready', urlToCopy);
    }
  }

  showToast(title = 'Link copied ❤️', subtitle = 'లింక్ కాపీ అయింది. ఎవరికైనా షేర్ చేయండి!') {
    if (!this.toast) return;

    const titleEl = this.toast.querySelector('#share-toast-title');
    const subtitleEl = this.toast.querySelector('#share-toast-subtitle');

    if (titleEl) {
      titleEl.textContent = title;
    }
    if (subtitleEl) {
      subtitleEl.textContent = subtitle;
    }

    // Ensure toast is unhidden and active
    this.toast.removeAttribute('hidden');
    // Force browser reflow so transition runs
    void this.toast.offsetWidth;
    this.toast.classList.add('is-active');

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toast.classList.remove('is-active');
      setTimeout(() => {
        if (!this.toast.classList.contains('is-active')) {
          this.toast.setAttribute('hidden', '');
        }
      }, 350);
    }, 2800);
  }
}

export default ShareManagerController;

