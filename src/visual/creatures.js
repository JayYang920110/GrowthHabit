function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++)
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  return h;
}

function xorshift(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0x100000000; };
}

// A glowing fish that orbits the coral (7-day milestone).
export class Fish {
  constructor({ id, coralX, coralBaseY, coralTopY }) {
    const rand = xorshift(djb2(id + '_fish'));
    this._cx    = coralX;
    this._cy    = coralTopY + (coralBaseY - coralTopY) * 0.45;
    this._rx    = 58 + rand() * 22;
    this._ry    = 22 + rand() * 12;
    this._speed = (0.00075 + rand() * 0.0005) * (rand() < 0.5 ? 1 : -1);
    this._phase = rand() * Math.PI * 2;
  }

  reposition({ coralX, coralBaseY, coralTopY }) {
    this._cx = coralX;
    this._cy = coralTopY + (coralBaseY - coralTopY) * 0.45;
  }

  draw(ctx, t) {
    const angle = this._phase + t * this._speed;
    const x     = this._cx + this._rx * Math.cos(angle);
    const y     = this._cy + this._ry * Math.sin(angle);
    // tangent direction for fish rotation
    const rot   = Math.atan2(
      this._speed * this._ry * Math.cos(angle),
      -this._speed * this._rx * Math.sin(angle),
    );
    const pulse = 0.85 + 0.15 * Math.sin(t * 0.0018 + this._phase);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.shadowColor = '#3DD6E8';
    ctx.shadowBlur  = 11 * pulse;

    // body
    ctx.fillStyle = `rgba(61,214,232,${0.72 * pulse})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // tail — wags with time
    const tailWag = Math.sin(t * 0.012 + this._phase) * 0.35;
    ctx.fillStyle = `rgba(61,214,232,${0.48 * pulse})`;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-13 + Math.cos(tailWag) * 2, -5 + Math.sin(tailWag) * 4);
    ctx.lineTo(-13 + Math.cos(tailWag) * 2,  5 + Math.sin(tailWag) * 4);
    ctx.closePath();
    ctx.fill();

    // eye
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = 'rgba(215,248,255,0.92)';
    ctx.beginPath();
    ctx.arc(4, -1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// A slow-drifting bioluminescent jellyfish (30-day milestone).
export class Jellyfish {
  constructor({ id, canvasW, canvasH }) {
    const rand    = xorshift(djb2(id + '_jelly'));
    this._x       = canvasW  * (0.15 + rand() * 0.70);
    this._y       = canvasH  * (0.18 + rand() * 0.35);
    this._phase   = rand() * Math.PI * 2;
    this._size    = 38 + rand() * 22;
    this._speed   = 0.00022 + rand() * 0.00015;
  }

  draw(ctx, t) {
    const s     = t * this._speed;
    const x     = this._x + Math.sin(s + this._phase) * 55 + Math.cos(s * 0.61 + this._phase) * 25;
    const y     = this._y + Math.cos(s * 1.07 + this._phase) * 35;
    const pulse = 0.62 + 0.38 * Math.sin(t * 0.0009 + this._phase);
    const r     = this._size;

    ctx.save();
    ctx.translate(x, y);

    // bell fill
    ctx.shadowColor = '#A070D0';
    ctx.shadowBlur  = 22 * pulse;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0,   `rgba(190,130,230,${0.30 * pulse})`);
    grad.addColorStop(0.65,`rgba(140, 80,195,${0.16 * pulse})`);
    grad.addColorStop(1,   'rgba(90,40,140,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.58, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // rim
    ctx.strokeStyle = `rgba(200,140,240,${0.26 * pulse})`;
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 8 * pulse;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.58, 0, Math.PI, 0);
    ctx.stroke();

    // tentacles
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const tx   = (i / 6 - 0.5) * r * 1.5;
      const sway = Math.sin(t * 0.0015 + i * 0.9 + this._phase) * 14;
      ctx.strokeStyle = `rgba(190,130,230,${0.20 * pulse})`;
      ctx.shadowBlur  = 6 * pulse;
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.quadraticCurveTo(tx + sway, 18, tx + sway * 0.6, 38);
      ctx.stroke();
    }

    ctx.restore();
  }
}
