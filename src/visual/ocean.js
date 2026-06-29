// Pre-computed so no Math.random() at draw time
const BIOLUM = Array.from({ length: 35 }, (_, i) => ({
  xFrac:  (i * 0.047 + 0.02) % 1,
  speed:  0.00003 + (i % 5) * 0.000018,
  alpha:  0.12 + (i % 4) * 0.06,
  phase:  i * 0.73,
  size:   0.8 + (i % 3) * 0.6,
}));

export function drawOcean(ctx, w, h, t) {
  _bg(ctx, w, h);
  _rays(ctx, w, h, t);
  _biolum(ctx, w, h, t);
  _seabed(ctx, w, h);
}

function _bg(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0,    '#071832');
  g.addColorStop(0.45, '#050D1A');
  g.addColorStop(1,    '#020810');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function _rays(ctx, w, h, t) {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const cx    = w * (0.08 + i * 0.17) + Math.sin(t * 0.00022 + i * 1.3) * 30;
    const alpha = 0.015 + 0.009 * Math.sin(t * 0.00038 + i * 0.85);
    const g     = ctx.createLinearGradient(cx, 0, cx + 60, h * 0.72);
    g.addColorStop(0, `rgba(61,214,232,${alpha})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - 5,  0);
    ctx.lineTo(cx + 25, 0);
    ctx.lineTo(cx + 80, h * 0.72);
    ctx.lineTo(cx + 18, h * 0.72);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function _biolum(ctx, w, h, t) {
  ctx.save();
  ctx.shadowColor = '#3DD6E8';
  ctx.shadowBlur  = 3;
  for (const p of BIOLUM) {
    // drift upward, wrap bottom→top
    const rawY = (p.xFrac * 4.3 % 0.92 + 0.04) - t * p.speed;
    const y    = (((rawY % 1) + 1) % 1) * h * 0.87;
    const x    = p.xFrac * w;
    const a    = p.alpha * (0.35 + 0.65 * Math.sin(t * 0.0009 + p.phase));
    ctx.fillStyle = `rgba(61,214,232,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function _seabed(ctx, w, h) {
  ctx.save();
  const g = ctx.createLinearGradient(0, h - 58, 0, h);
  g.addColorStop(0, '#0C1E34');
  g.addColorStop(1, '#060F1C');
  ctx.fillStyle    = g;
  ctx.shadowColor  = 'rgba(30,80,140,0.5)';
  ctx.shadowBlur   = 22;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h - 40);
  for (let i = 0; i <= 14; i++) {
    const x = (i / 14) * w;
    const y = h - 40 + Math.sin(i * 1.7) * 10 + Math.cos(i * 3.2) * 7;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
