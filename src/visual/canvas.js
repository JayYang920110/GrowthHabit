export function initCanvas(drawFn) {
  const canvas = document.getElementById('ocean');
  const ctx = canvas.getContext('2d');
  let w, h;

  function resize() {
    w = canvas.width  = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  function loop(t) {
    drawFn(ctx, w, h, t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
