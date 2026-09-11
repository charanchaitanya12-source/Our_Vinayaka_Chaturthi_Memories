export class CapturedMomentsPage {
  constructor() {
    this.grid = document.getElementById('live-camera-grid');
    this.photos = [];
    this.init();
  }

  init() {
    this.loadPhotos();
    this.renderGrid();
    
    // Listen for storage changes in case another tab takes a photo
    window.addEventListener('storage', (e) => {
      if (e.key === 'vinayaka_live_camera_photos') {
        this.loadPhotos();
        this.renderGrid();
      }
    });
  }

  loadPhotos() {
    try {
      const stored = localStorage.getItem('vinayaka_live_camera_photos');
      if (stored) {
        this.photos = JSON.parse(stored);
      }
    } catch (e) {
      this.photos = [];
    }
  }

  savePhotos() {
    try {
      localStorage.setItem('vinayaka_live_camera_photos', JSON.stringify(this.photos));
    } catch (e) {
      console.error('Failed to save photos', e);
    }
  }

  deletePhoto(id) {
    this.photos = this.photos.filter(p => p.id !== id);
    this.savePhotos();
    this.renderGrid();
  }

  renderGrid() {
    if (!this.grid) return;
    
    if (this.photos.length === 0) {
      this.grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; font-size: 1.2rem;">No photos captured yet. Go back and take some!</p>';
      return;
    }

    this.grid.innerHTML = this.photos.map(photo => `
      <div class="camera-photo-card" id="photo-${photo.id}">
        <div class="camera-photo-img-wrapper">
          <img src="${photo.dataUrl}" alt="Captured Moment" />
          <button class="delete-photo-btn" data-id="${photo.id}" title="Delete photo">✕</button>
        </div>
        <div class="camera-photo-caption">2026 memory</div>
      </div>
    `).join('');

    // Add delete listeners
    this.grid.querySelectorAll('.delete-photo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Delete this photo?')) {
          this.deletePhoto(id);
        }
      });
    });
  }
}

// Initialize immediately on load since this is a dedicated page
document.addEventListener('DOMContentLoaded', () => {
  new CapturedMomentsPage();
});
