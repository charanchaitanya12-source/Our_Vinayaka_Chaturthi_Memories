/**
 * ============================================================================
 * MARIGOLD PETALS & GLOWING EMBER PARTICLE ENGINE (HTML5 Canvas)
 * ============================================================================
 * Generates organic floating marigold flower petals and golden stardust embers.
 */

export class ParticleEngine {
  constructor(canvasId = 'particle-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.petals = [];
    this.width = 0;
    this.height = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.isMouseMoving = false;
    this.animationFrameId = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Gentle mouse influence
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.isMouseMoving = true;
    });

    // Populate particles
    this.createPetals(28);
    this.createEmbers(45);

    this.start();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  createPetals(count) {
    const petalColors = [
      { fill: '#fca311', shade: '#e85d04' }, // Orange Marigold
      { fill: '#ffb703', shade: '#fb8500' }, // Yellow Marigold
      { fill: '#d90429', shade: '#9d0208' }, // Crimson Rose accent
      { fill: '#f48c06', shade: '#dc2f02' }  // Deep Saffron
    ];

    for (let i = 0; i < count; i++) {
      const color = petalColors[Math.floor(Math.random() * petalColors.length)];
      this.petals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 7 + Math.random() * 8,
        speedY: 0.6 + Math.random() * 1.1,
        speedX: Math.sin(Math.random() * 6) * 0.8,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 1.5,
        swing: Math.random() * 2,
        swingSpeed: 0.02 + Math.random() * 0.02,
        swingOffset: Math.random() * Math.PI * 2,
        color: color.fill,
        shade: color.shade,
        opacity: 0.6 + Math.random() * 0.35
      });
    }
  }

  createEmbers(count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 0.8 + Math.random() * 2,
        speedY: -(0.3 + Math.random() * 0.7), // Float upwards
        speedX: (Math.random() - 0.5) * 0.5,
        opacity: 0.2 + Math.random() * 0.6,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseOffset: Math.random() * Math.PI * 2,
        color: Math.random() > 0.3 ? '#ffd56b' : '#ff8c38'
      });
    }
  }

  drawPetal(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate((p.rotation * Math.PI) / 180);
    this.ctx.globalAlpha = p.opacity;

    // Organic teardrop petal path
    this.ctx.beginPath();
    this.ctx.moveTo(0, -p.size);
    this.ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.5, p.size * 0.8, p.size * 0.6, 0, p.size);
    this.ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.6, -p.size * 0.8, -p.size * 0.5, 0, -p.size);
    this.ctx.closePath();

    // Gradient fill
    const grad = this.ctx.createLinearGradient(0, -p.size, 0, p.size);
    grad.addColorStop(0, p.color);
    grad.addColorStop(1, p.shade);
    this.ctx.fillStyle = grad;
    this.ctx.fill();

    this.ctx.restore();
  }

  drawEmber(e) {
    this.ctx.save();
    const currentOpacity = e.opacity * (0.6 + 0.4 * Math.sin(Date.now() * e.pulseSpeed * 0.05 + e.pulseOffset));
    this.ctx.globalAlpha = Math.max(0.1, currentOpacity);

    // Glowing circle
    this.ctx.beginPath();
    this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = e.color;
    this.ctx.shadowColor = e.color;
    this.ctx.shadowBlur = 8;
    this.ctx.fill();

    this.ctx.restore();
  }

  update() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Update Petals (falling gracefully)
    this.petals.forEach(p => {
      p.y += p.speedY;
      p.x += Math.sin(Date.now() * p.swingSpeed * 0.01 + p.swingOffset) * p.swing;
      p.rotation += p.rotSpeed;

      // Mouse deflection
      if (this.isMouseMoving) {
        const dx = p.x - this.mouseX;
        const dy = p.y - this.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.x += (dx / dist) * 1.5;
          p.y += (dy / dist) * 1.5;
        }
      }

      // Recycle when off bottom
      if (p.y > this.height + 20) {
        p.y = -20;
        p.x = Math.random() * this.width;
      }
      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;

      this.drawPetal(p);
    });

    // 2. Update Embers (floating upwards like diya sparks)
    this.particles.forEach(e => {
      e.y += e.speedY;
      e.x += e.speedX;

      if (e.y < -10) {
        e.y = this.height + 10;
        e.x = Math.random() * this.width;
      }

      this.drawEmber(e);
    });

    this.animationFrameId = requestAnimationFrame(() => this.update());
  }

  start() {
    if (!this.animationFrameId) {
      this.update();
    }
  }

  burstFlowers(count = 50) {
    const petalColors = [
      { fill: '#fca311', shade: '#e85d04' },
      { fill: '#ffb703', shade: '#fb8500' },
      { fill: '#d90429', shade: '#9d0208' },
      { fill: '#f48c06', shade: '#dc2f02' },
      { fill: '#ff4d6d', shade: '#c9184a' }
    ];

    for (let i = 0; i < count; i++) {
      const color = petalColors[Math.floor(Math.random() * petalColors.length)];
      this.petals.push({
        x: Math.random() * this.width,
        y: -10 - Math.random() * (this.height * 0.5),
        size: 9 + Math.random() * 9,
        speedY: 1.8 + Math.random() * 2.2,
        speedX: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 3,
        swing: 2 + Math.random() * 3,
        swingSpeed: 0.03 + Math.random() * 0.03,
        swingOffset: Math.random() * Math.PI * 2,
        color: color.fill,
        shade: color.shade,
        opacity: 0.85 + Math.random() * 0.15,
        isBurst: true
      });
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
