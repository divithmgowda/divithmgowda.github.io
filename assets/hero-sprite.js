/* Hero character: he looks at you and blinks, nothing else.
   Real frames from the clip (manifest: idle = eye contact, blink = [half-closed, shut]).
   Blinks every 3-6 s at random, now and then a quick double blink; each blink cross-fades
   open -> half -> shut -> half -> open over ~180 ms. Pauses off-screen; still frame for reduced motion. */
(() => {
  const M = window.HERO_SHEET;
  const canvas = document.getElementById('heroSprite');
  if (!M || !canvas) return;
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FW = M.frameWidth, FH = M.frameHeight, COLS = M.cols || M.frames, idle = M.idle, [half, shut] = M.blink;
  const BLINK_MS = 180, BLINK_GAP = [3000, 6000], DOUBLE = 0.15;
  const rnd = ([a, b]) => a + Math.random() * (b - a);
  canvas.width = FW; canvas.height = FH;
  if (ctx) ctx.imageSmoothingQuality = 'high';

  let sheet = null, raf = 0, visible = true, blinkAt = 0, blinkStart = -1, drawn = -1;
  const sx = (k) => (k % COLS) * FW, sy = (k) => Math.floor(k / COLS) * FH;
  const draw = (a, b, f) => {
    ctx.clearRect(0, 0, FW, FH); ctx.globalAlpha = 1;
    ctx.drawImage(sheet, sx(a), sy(a), FW, FH, 0, 0, FW, FH);
    if (b !== null && f > 0) { ctx.globalAlpha = f; ctx.drawImage(sheet, sx(b), sy(b), FW, FH, 0, 0, FW, FH); ctx.globalAlpha = 1; }
  };
  // lids close a little faster than they open, like a real blink
  const SEQ = [idle, half, shut, shut, half, idle], TIMES = [0, 0.16, 0.32, 0.45, 0.68, 1];
  function step(now) {
    if (blinkStart < 0 && now >= blinkAt) blinkStart = now;
    if (blinkStart >= 0) {
      const t = (now - blinkStart) / BLINK_MS;
      if (t < 1) {
        let j = 0; while (j < TIMES.length - 2 && t >= TIMES[j + 1]) j++;
        const f = (t - TIMES[j]) / (TIMES[j + 1] - TIMES[j]);
        draw(SEQ[j], SEQ[j + 1] === SEQ[j] ? null : SEQ[j + 1], f); drawn = -1; return;
      }
      blinkStart = -1; blinkAt = now + (Math.random() < DOUBLE ? rnd([120, 220]) : rnd(BLINK_GAP));
    }
    if (drawn !== idle) { draw(idle, null, 0); drawn = idle; }
  }
  const loop = (t) => { step(t); raf = requestAnimationFrame(loop); };
  const start = () => { if (raf || still || !sheet || !visible || document.hidden) return; blinkAt = performance.now() + rnd([1200, 3000]); raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  const img = new Image();
  img.onload = () => {
    sheet = img; draw(idle, null, 0); drawn = idle; canvas.classList.add('is-ready');
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  };
  img.src = canvas.dataset.src || M.src;
  window.__heroSprite = { get blinking() { return blinkStart >= 0; }, manifest: M };
})();
