const EASE_OUT  = t => 1 - (1 - t) ** 3;
const REVEAL_MS = 65;
const GROW_MS   = 230;
const POLYP_HZ  = 0.0016;

function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++)
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  return h;
}

function xorshift(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
}

export class Coral {
  constructor({ id, color, completions, x, baseY, delay = 0, instant = false }) {
    this.color    = color;
    this.delay    = delay;
    this._t0      = null;
    this._id      = id;
    this._baseX   = x;
    this._baseY   = baseY;
    this._comps   = completions;
    this._instant = instant;
    this.nodes    = [];
    this._order   = [];
    this._build(id, x, baseY, completions);
  }

  _build(id, x, baseY, completions) {
    const rand = xorshift(djb2(id));
    const SEG  = 28;

    this.nodes.push({ x, y: baseY, parentIdx: null, phase: rand() * Math.PI * 2 });

    let trunk = 0, cx = x, cy = baseY, dir = 1;

    for (let i = 0; i < completions; i++) {
      cx += (rand() - 0.5) * 10;
      cy -= SEG + (rand() - 0.5) * 9;

      const prev = trunk;
      trunk = this.nodes.length;
      this.nodes.push({ x: cx, y: cy, parentIdx: prev, phase: rand() * Math.PI * 2 });

      if (i >= 2 && i % 3 === 2) {
        this.nodes.push({
          x: cx + dir * (22 + rand() * 20),
          y: cy + rand() * 14,
          parentIdx: prev,
          phase: rand() * Math.PI * 2,
        });
        dir *= -1;
      }
    }

    const isParent = new Set(
      this.nodes.filter(n => n.parentIdx !== null).map(n => n.parentIdx)
    );
    this.nodes.forEach((n, i) => {
      n.isPolyp = i > 0 && !isParent.has(i);
    });

    this._order = [...this.nodes.keys()]
      .filter(i => i > 0)
      .sort((a, b) => this.nodes[b].y - this.nodes[a].y);
  }

  // Called when user checks in today — grows one new segment in-place.
  growOne(t) {
    const prevCount = this.nodes.length;
    this._comps++;
    this.nodes  = [];
    this._order = [];
    this._build(this._id, this._baseX, this._baseY, this._comps);

    // Skip animation for all old nodes; only animate the newly added ones.
    const added     = this.nodes.length - prevCount;
    const skipCount = this._order.length - added;
    this._t0  = t - (skipCount * REVEAL_MS + GROW_MS + 5);
    this.delay = 0;
  }

  get topY() {
    if (this.nodes.length <= 1) return this._baseY;
    return Math.min(...this.nodes.map(n => n.y));
  }

  draw(ctx, t) {
    // On first draw: instant corals start with all nodes already grown.
    if (!this._t0) {
      this._t0 = this._instant
        ? t - (this._order.length * REVEAL_MS + GROW_MS + 100)
        : t;
    }

    const elapsed = t - this._t0 - this.delay;
    if (elapsed < 0) return;

    // Seed glow — shown for new habits with 0 completions yet.
    if (this._comps === 0) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.001 + 1.5);
      const alpha = Math.floor(180 * pulse).toString(16).padStart(2, '0');
      ctx.save();
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = 18 * pulse;
      ctx.fillStyle   = this.color + alpha;
      ctx.beginPath();
      ctx.arc(this._baseX, this._baseY, 6 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Segments
    ctx.save();
    ctx.lineCap     = 'round';
    ctx.lineWidth   = 2.5;
    ctx.strokeStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 5;

    for (let ord = 0; ord < this._order.length; ord++) {
      const ni   = this._order[ord];
      const prog = EASE_OUT(Math.min(1, Math.max(0, (elapsed - ord * REVEAL_MS) / GROW_MS)));
      if (prog <= 0) continue;

      const n = this.nodes[ni];
      const p = this.nodes[n.parentIdx];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + (n.x - p.x) * prog, p.y + (n.y - p.y) * prog);
      ctx.stroke();
    }
    ctx.restore();

    // Polyp glows
    for (let ord = 0; ord < this._order.length; ord++) {
      const ni = this._order[ord];
      const n  = this.nodes[ni];
      if (!n.isPolyp) continue;
      if ((elapsed - ord * REVEAL_MS) / GROW_MS < 1) continue;

      const breathRaw    = Math.sin(t * POLYP_HZ + n.phase);
      const breathShaped = breathRaw > 0 ? Math.sqrt(breathRaw) : breathRaw * breathRaw;
      const pulse        = 0.62 + 0.38 * (breathShaped * 0.5 + 0.5);
      ctx.save();
      ctx.shadowColor = '#3DD6E8';
      ctx.shadowBlur  = 15 * pulse;
      ctx.fillStyle   = `rgba(61,214,232,${0.52 * pulse})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 4.5 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur  = 3;
      ctx.fillStyle   = 'rgba(215,248,255,0.92)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.2 + 0.8 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
