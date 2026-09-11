export class LiveCameraController {
  constructor() {
    this.video = document.getElementById('live-camera-video');
    this.canvas = document.getElementById('live-camera-canvas');
    this.openBtn = document.getElementById('btn-open-camera');
    this.captureBtn = document.getElementById('btn-capture-photo');
    this.switchBtn = document.getElementById('btn-switch-camera');
    this.placeholder = document.getElementById('camera-placeholder');
    this.grid = document.getElementById('live-camera-grid');
    
    this.stream = null;
    this.facingMode = 'user';
    this.photos = [];

    this.init();
  }

  init() {
    if (!this.video || !this.openBtn) return;

    this.loadPhotos();
    this.renderGrid();

    this.openBtn.addEventListener('click', () => this.startCamera());
    this.captureBtn.addEventListener('click', () => this.capturePhoto());
    this.switchBtn.addEventListener('click', () => this.switchCamera());
  }

  async startCamera() {
    try {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: { facingMode: this.facingMode }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      this.video.style.display = 'block';
      this.placeholder.style.display = 'none';
      
      this.openBtn.style.display = 'none';
      this.captureBtn.style.display = 'inline-flex';
      
      // Check if multiple cameras are available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      if (videoDevices.length > 1) {
        this.switchBtn.style.display = 'inline-flex';
      }

    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access the camera. Please allow camera permissions in your browser.');
    }
  }

  switchCamera() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    // Update mirror effect based on facingMode
    if (this.facingMode === 'user') {
      this.video.style.transform = 'scaleX(-1)';
    } else {
      this.video.style.transform = 'scaleX(1)';
    }
    this.startCamera();
  }

  capturePhoto() {
    if (!this.stream) return;

    // Set canvas dimensions to match video
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    const ctx = this.canvas.getContext('2d');

    // Handle mirror effect for user-facing camera
    if (this.facingMode === 'user') {
      ctx.translate(this.canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    // Reset transform to draw text normally (not mirrored)
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Add "2026 memories" text watermark
    const fontSize = Math.max(24, Math.floor(this.canvas.width / 25));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    
    // Add shadow for better visibility on varied backgrounds
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw text at the bottom right corner with some padding
    ctx.fillText('2026 memories', this.canvas.width - 20, this.canvas.height - 20);

    // Get image data
    const dataUrl = this.canvas.toDataURL('image/jpeg', 0.8);
    
    const newPhoto = {
      id: Date.now().toString(),
      dataUrl: dataUrl,
      timestamp: new Date().toISOString()
    };

    this.photos.unshift(newPhoto);
    this.savePhotos();
    this.renderGrid();
  }

  deletePhoto(id) {
    this.photos = this.photos.filter(p => p.id !== id);
    this.savePhotos();
    this.renderGrid();
  }

  savePhotos() {
    try {
      // Keep only last 20 photos to avoid quota issues in localStorage
      if (this.photos.length > 20) {
        this.photos = this.photos.slice(0, 20);
      }
      localStorage.setItem('vinayaka_live_camera_photos', JSON.stringify(this.photos));
    } catch (e) {
      console.error('Failed to save photos to localStorage (might be full)', e);
    }
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

  renderGrid() {
    if (!this.grid) return;
    
    if (this.photos.length === 0) {
      this.grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; text-align: center;">No photos captured yet.</p>';
      return;
    }

    this.grid.innerHTML = this.photos.map(photo => `
      <div class="camera-photo-card" id="photo-${photo.id}">
        <img src="${photo.dataUrl}" alt="Captured Moment" />
        <button class="delete-photo-btn" data-id="${photo.id}" title="Delete photo">✕</button>
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
