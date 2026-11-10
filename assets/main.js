/* Divith TM · v4 motion. Everything is readable without JS. With GSAP, every section animation is
   scrubbed to the scroll position (forward on the way down, backwards on the way up, still when you stop);
   only hover micro-interactions and the hero blink run on their own. Reduced motion gets a still page. */
(() => {
  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* programme count comes from the one editable list */
  const progs = $$('#programmes li').length, pc = $('#progCount');
  if (pc && progs) { pc.dataset.to = progs; pc.textContent = progs; }

  /* dot-matrix illustration on the funding card */
  const dots = $('.wc-viz .dots');
  if (dots) { const NS = 'http://www.w3.org/2000/svg'; for (let r = 0; r < 7; r++) for (let c = 0; c < 20; c++) { const e = document.createElementNS(NS, 'circle'); e.setAttribute('cx', 8 + c * 16); e.setAttribute('cy', 10 + r * 20); e.setAttribute('r', 4.4); if ((c * 7 + r * 11) % 9 === 0) e.setAttribute('class', 'hot'); dots.appendChild(e); } }

  /* counters: the HTML holds the final values; with GSAP they are scrubbed to scroll (see below) */
  const fmt = (n, el) => el.dataset.format === 'comma' ? n.toLocaleString('en-GB') : String(n);

  /* nav: hide on the way down, show on the way up, highlight the section */
  const nav = $('#nav'), bar = $('.progress span'); let lastY = scrollY;
  const links = $$('.nav-links a'), secs = links.map(a => $(a.getAttribute('href')));
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (!reduce) { if (y > 400 && y > lastY + 4) nav.classList.add('hide'); else if (y < lastY - 4 || y < 400) nav.classList.remove('hide'); }
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    let on = -1; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) on = i; });
    links.forEach((a, i) => a.classList.toggle('is-on', i === on));
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* experience accordion */
  $$('.role').forEach((r) => {
    const b = $('.role-row', r);
    b.addEventListener('click', () => {
      const open = !r.classList.contains('open');
      r.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
      if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 750);
    });
  });
  const firstRole = $$('.role')[1]; if (firstRole) { firstRole.classList.add('open'); $('.role-row', firstRole).setAttribute('aria-expanded', 'true'); }

  /* chapters (tabs) */
  const tabs = $$('.ch-tab'), panels = $$('.ch'), chBar = $('.ch-bar i');
  let cur = 0;
  let pinned = false;
  const setChapter = (i, animate) => {
    if (pinned) { if (i !== cur) { cur = i; tabs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', k === i); }); } return; }
    if (i === cur && animate !== 'force') return;
    const prev = panels[cur]; cur = i;
    tabs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', k === i); });
    if (chBar) chBar.style.transform = `translateY(${i * 100}%)`;
    if (hasGSAP && !reduce && animate) {
      gsap.to(prev, { autoAlpha: 0, y: -24, duration: 0.35, ease: 'power2.in', overwrite: true, onComplete: () => prev.classList.remove('is-on') });
      const p = panels[i]; p.classList.add('is-on');
      gsap.fromTo(p, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: 0.2, overwrite: true });
      gsap.fromTo($$('.ch-list li, .mock, .programmes', p), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05, delay: 0.25 });
      const bars = $$('.bars i', p); if (bars.length) gsap.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 1, ease: 'expo.out', stagger: 0.06, delay: 0.4 });
    } else { panels.forEach((p, k) => { p.classList.toggle('is-on', k === i); if (hasGSAP) gsap.set(p, { autoAlpha: k === i ? 1 : 0, y: 0 }); }); }
  };
  let chST = null, lenis = null;
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    if (chST) { const y = chST.start + (chST.end - chST.start) * ((i + 0.5) / tabs.length); lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' }); }
    else setChapter(i, true);
  }));
  tabs.forEach((t, i) => t.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); tabs[(i + 1) % tabs.length].focus(); tabs[(i + 1) % tabs.length].click(); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); const j = (i + tabs.length - 1) % tabs.length; tabs[j].focus(); tabs[j].click(); } }));

  if (!hasGSAP || reduce) { html.classList.add('ready'); return; }

  /* ============================ GSAP ============================ */
  gsap.registerPlugin(ScrollTrigger); if (window.SplitText) gsap.registerPlugin(SplitText);
  if (fine && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, anchors: { offset: -20 }, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  }
  const mm = gsap.matchMedia();

  /* hero: no timed entrance; on the way out he sinks a little, the word drifts, the text lifts */
  html.classList.add('ready');
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero-box', { yPercent: 10, scale: 0.96, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero-word', { yPercent: -40, ease: 'none', scrollTrigger: { ...heroST } });
  gsap.to('.hero-left, .hero-right', { y: -80, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '20% top', end: '80% top', scrub: true } });
  gsap.to('.scroll-cue b', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '20% top', scrub: true } });

  /* reveals: each block fades and rises with the scroll, and goes back when you scroll up */
  $$('.rv').forEach((el) => gsap.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 70%', scrub: true } }));

  /* counters: the number follows the scroll */
  const scrubCount = (el, st) => { const to = +el.dataset.to, o = { v: 0 }; if (!to) return; el.textContent = fmt(0, el);
    gsap.to(o, { v: to, ease: 'none', scrollTrigger: { ...st, scrub: true }, onUpdate: () => { el.textContent = fmt(Math.round(o.v), el); } }); };
  $$('.now-stats .count').forEach((el) => scrubCount(el, { trigger: el, start: 'top 95%', end: 'top 55%' }));

  /* split headings: words rise out of a mask as you scroll */
  if (window.SplitText) {
    $$('.split').forEach((h) => {
      const s = new SplitText(h, { type: 'lines,words', linesClass: 'ln', mask: 'lines' });
      gsap.from(s.words, { yPercent: 110, ease: 'none', stagger: 0.06, scrollTrigger: { trigger: h, start: 'top 92%', end: 'top 55%', scrub: true } });
    });
  }

  /* ticker drifts with the scroll instead of looping */
  gsap.fromTo('.ticker-track', { xPercent: 0 }, { xPercent: -25, ease: 'none', scrollTrigger: { trigger: '.ticker', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* NOW chapters: pinned on desktop; the scroll position drives the chapter change itself */
  mm.add('(min-width: 1101px)', () => {
    pinned = true; $('.chapters').classList.add('ch-pinned');
    const n = panels.length;
    gsap.set(panels, { autoAlpha: 0, y: 0 }); gsap.set(panels[0], { autoAlpha: 1 }); panels.forEach((p) => p.classList.add('is-on'));
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    // the first chapter builds while the panel slides up into place, so it is complete when the pin starts
    gsap.fromTo($$('.ch-list li, .mock, .programmes', panels[0]), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: 'none', stagger: 0.03, scrollTrigger: { trigger: '.chapters', start: 'top 70%', end: 'top 5%', scrub: true } });
    tl.to({}, { duration: 0.35 }, 0);
    for (let i = 1; i < n; i++) {
      const at = i - 0.3;
      tl.to(panels[i - 1], { autoAlpha: 0, y: -30, duration: 0.25 }, at)
        .fromTo(panels[i], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3 }, at + 0.15)
        .fromTo($$('.ch-list li, .mock, .programmes', panels[i]), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.03 }, at + 0.2);
      const bars = $$('.bars i', panels[i]); if (bars.length) tl.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.3, stagger: 0.03 }, at + 0.3);
    }
    tl.to({}, { duration: 0.5 }, n - 0.5);                           // hold the last chapter before the pin lets go
    chST = ScrollTrigger.create({
      trigger: '.chapters', start: 'top top', end: () => '+=' + innerHeight * 0.85 * n, pin: '.ch-pin', anticipatePin: 1, animation: tl, scrub: true,
      onUpdate: (st) => { const t = tl.time(); setChapter(Math.max(0, Math.min(n - 1, Math.round(t - 0.05)))); if (chBar) chBar.style.transform = `translateY(${Math.min(n - 1, Math.max(0, t - 0.3)) * 100}%)`; }
    });
    return () => { chST = null; pinned = false; $('.chapters').classList.remove('ch-pinned'); gsap.set(panels, { clearProps: 'all' }); panels.forEach((p, k) => p.classList.toggle('is-on', k === cur)); };
  });
  gsap.from('.ch-pin', { clipPath: 'inset(8% 6% 8% 6% round 40px)', ease: 'none', scrollTrigger: { trigger: '.chapters', start: 'top bottom', end: 'top 20%', scrub: true } });
  if (!pinned) setChapter(0, 'force');

  /* WORK: horizontal track on desktop; everything inside follows the same scroll */
  const workBits = (st) => {
    $$('.wcard').forEach((c) => {
      const s = (o) => ({ trigger: c, ...st, ...o });
      $$('.v-line', c).forEach((l) => { const len = l.getTotalLength(); gsap.fromTo(l, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: s({ scrub: true }) }); });
      const bars = $$('.v-bar, .v-col', c);
      if (bars.length) gsap.from(bars, { scaleX: (i, e) => e.classList.contains('v-bar') ? 0 : 1, scaleY: (i, e) => e.classList.contains('v-col') ? 0 : 1, transformOrigin: '0% 100%', ease: 'none', stagger: 0.1, scrollTrigger: s({ scrub: true }) });
      $$('.count', c).forEach((el) => scrubCount(el, s({})));
    });
  };
  mm.add('(min-width: 641px)', () => {
    const track = $('.htrack');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const t = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.work', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: true, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$('.wcard').forEach((c, i) => gsap.from(c, { rotate: i % 2 ? 2.5 : -2.5, y: 40, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: t, start: 'left right', end: 'center center', scrub: true } }));
    workBits({ containerAnimation: t, start: 'left 85%', end: 'center 55%' });
  });
  mm.add('(max-width: 640px)', () => { workBits({ start: 'top 85%', end: 'top 35%' }); });

  /* skills: pills and bars build with the scroll */
  $$('.bt').forEach((b) => gsap.from($$('.pills li', b), { autoAlpha: 0, y: 14, scale: 0.9, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: b, start: 'top 88%', end: 'top 50%', scrub: true } }));
  gsap.from('.bt-art rect', { scaleY: 0, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: '.bt-a', start: 'top 85%', end: 'top 40%', scrub: true } });

  /* certificates: deal in with the scroll, seals turn with the scroll, tilt with the pointer on hover */
  gsap.from('.cert', { rotateX: -28, rotateY: (i) => (i - 1) * 10, y: 80, autoAlpha: 0, transformOrigin: '50% 100%', ease: 'none', stagger: 0.12, scrollTrigger: { trigger: '.cert-row', start: 'top 95%', end: 'top 45%', scrub: true } });
  gsap.to('.seal svg', { rotate: 240, ease: 'none', scrollTrigger: { trigger: '.certs', start: 'top bottom', end: 'bottom top', scrub: true } });
  if (fine) $$('.cert').forEach((c) => {
    const rx = gsap.quickTo(c, 'rotationX', { duration: 0.6, ease: 'power3' }), ry = gsap.quickTo(c, 'rotationY', { duration: 0.6, ease: 'power3' });
    c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; rx((0.5 - y) * 14); ry((x - 0.5) * 16); c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%'); });
    c.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });

  /* section transitions */
  gsap.from('.contact', { borderRadius: '120px 120px 0 0', ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 40%', scrub: true } });
  gsap.from('.foot-word', { yPercent: 60, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top 60%', end: 'bottom bottom', scrub: true } });
  gsap.from('.ticker', { y: 40, ease: 'none', scrollTrigger: { trigger: '.ticker', start: 'top bottom', end: 'top 60%', scrub: true } });

  /* magnetic buttons */
  if (fine) $$('.mag').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,0.45)' }), y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,0.45)' });
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.3); });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });

  addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
