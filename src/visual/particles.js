// One-time spore burst emitted when the 30-day jellyfish milestone unlocks.
export class SporeParticles {
  constructor({ x, y, color }) {
    this._x     = x;
    this._y     = y;
    this._color = color;
    this._t0    = null;
    this._elapsed = 0;
    this._LIFE  = 2800;

    // Pre-compute 30 spore trajectories (deterministic, no Math.random at draw time).
    this._spores = Array.from({ length: 30 }, (_, i) => ({
      angle: (i / 30) * Math.PI * 2 + (i % 3) * 0.38,
      speed: 0.028 + (i % 7) * 0.006,
      drift: (i % 5 - 2) * 0.007,
      size:  2 + (i % 4),
    }));
  }

  get done() {
    return this._t0 !== null && this._elapsed >= this._LIFE;
  }

  draw(ctx, t) {
    if (this._t0 === null) this._t0 = t;
    this._elapsed = t - this._t0;
    if (this._elapsed >= this._LIFE) return;

    const prog  = this._elapsed / this._LIFE;
    const alpha = (1 - prog) * 0.88;
    const hex   = Math.floor(alpha * 255).toString(16).padStart(2, '0');

    for (const s of this._spores) {
      const dist = s.speed * this._elapsed;
      const px   = this._x + Math.cos(s.angle) * dist + s.drift * this._elapsed;
      const py   = this._y - 0.032 * this._elapsed + Math.sin(s.angle) * dist * 0.35;

      ctx.save();
      ctx.shadowColor = this._color;
      ctx.shadowBlur  = 10 * alpha;
      ctx.fillStyle   = this._color + hex;
      ctx.beginPath();
      ctx.arc(px, py, s.size * (1 - prog * 0.45), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
