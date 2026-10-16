/* Image compare adapted from Bencho — MIT: https://bencho.dev/licence.
   Framework-free adapter for CarusMKT's static site; no runtime dependencies. */
(() => {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ══ Image compare ════════════════════════════════════════
     One picture, two states of it, and a line to drag across.
     Left of the line is the raw shot, right of it the edit. Drag
     slowly and it stays where you leave it; flick it and it
     glides to the edge you threw it at.

     ── TWO PICTURES, ONE FRAME ─────────────────────────────
     The x-ray and the colour photograph are the same scene at the
     same size, so the two halves line up exactly and the line
     reads as seeing through the picture.
     CarusMKT uses the supplied original and restored family photos.

     ── THE LINE IS JELLY ───────────────────────────────────
     The knob is exactly where the finger is; the two ends of the
     line are not. They follow it on an under-damped spring, so a
     hard swing leaves them behind and the line bows into a curve,
     then wobbles straight when you stop. The before layer is cut
     along the SAME curve — clip-path: path(), in the block's own
     pixels — so the picture's edge bends with the line rather than
     the line bending over a straight cut.

     ── THE LAYERS DRIFT ────────────────────────────────────
     The back layer moves a few pixels against the line as it
     goes, so the wipe reads as two sheets with depth between them
     rather than a mask sliding over a flat picture.
     Drift remains disabled here, as in the supplied CSS, to keep
     these two photographs in register. */
  class ImageCompare {
    constructor(box) {
      this.box = box;
      this.cur = 0.5;
      this.target = null;
      /* the ends of the line, and how fast they are moving */
      this.ends = { x: 0.5, v: 0 };
      this.raf = 0;
      this.drag = null;
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.before = box.querySelector('.cmp-before');
      this.line = box.querySelector('.cmp-line path');
      this.svg = box.querySelector('.cmp-line');
      this.grip = box.querySelector('.cmp-grip');
      this.tags = box.querySelectorAll('.cmp-tag');
      this.events = new AbortController();
      const on = (type, handler) => box.addEventListener(type, handler, { signal: this.events.signal });
      on('pointerdown', e => {
        if (!e.isPrimary || e.button !== 0) return;
        try { box.setPointerCapture(e.pointerId); } catch { /* a scripted pointer */ }
        const v = this.at(e.clientX);
        this.drag = { id: e.pointerId, v: 0, t: performance.now(), last: v };
        box.dataset.held = 'true';
        box.focus({ preventScroll: true });
        this.glide(v);
      });
      on('pointermove', e => {
        const d = this.drag;
        if (!d || d.id !== e.pointerId) return;
        const v = this.at(e.clientX), now = performance.now();
        d.v = (v - d.last) / Math.max(1, now - d.t);
        d.t = now;
        d.last = v;
        this.place(v);
      });
      on('pointerup', e => {
        const d = this.drag;
        if (!d || d.id !== e.pointerId) return;
        this.release();
        try { box.releasePointerCapture(e.pointerId); } catch { /* never captured */ }
        /* a flick carries it to the edge it was thrown at */
        if (performance.now() - d.t < 100 && Math.abs(d.v) > 0.0025) this.glide(d.v > 0 ? 1 : 0);
      });
      on('pointercancel', () => this.release());
      on('lostpointercapture', () => this.release());
      on('keydown', e => {
        const p = this.target ?? this.cur;
        const keys = { ArrowLeft: p - 0.1, ArrowRight: p + 0.1, Home: 0, End: 1 };
        if (!(e.key in keys)) return;
        e.preventDefault();
        this.glide(clamp(keys[e.key], 0, 1));
      });
      this.resize = new ResizeObserver(() => this.draw());
      this.resize.observe(box);
      this.draw();
    }
    release() { this.drag = null; delete this.box.dataset.held; }
    at(cx) {
      const r = this.box.getBoundingClientRect();
      return clamp((cx - r.left) / r.width, 0, 1);
    }
    /* one loop for both motions: the glide toward a target, and
       the ends catching up with the middle. It stops itself once
       everything is still. */
    loop() {
      if (this.raf) return;
      let prev = performance.now();
      const step = t => {
        const dt = Math.min(0.033, (t - prev) / 1000);
        prev = t;
        if (this.target !== null) {
          this.cur += (this.target - this.cur) * (1 - Math.pow(0.0004, dt));
          if (Math.abs(this.target - this.cur) < 0.0005) { this.cur = this.target; this.target = null; }
        }
        /* the jelly: a spring from the ends to the middle, damped
           firmly enough that it flexes and settles without a wobble */
        const e = this.ends;
        e.v += ((this.cur - e.x) * 620 - e.v * 44) * dt;
        e.x += e.v * dt;
        const still = this.target === null && Math.abs(this.cur - e.x) < 0.0006 && Math.abs(e.v) < 0.002;
        if (still) { e.x = this.cur; e.v = 0; }
        this.draw();
        this.raf = still ? 0 : requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    }
    glide(to) {
      if (this.reduced.matches) { this.place(to); return; }
      this.target = to;
      this.loop();
    }
    /* under the finger: the knob is drawn this frame, not the next —
       only the ends are left to the loop */
    place(v) {
      this.target = null;
      this.cur = v;
      if (this.reduced.matches) { this.ends.x = v; this.ends.v = 0; }
      this.draw();
      if (!this.reduced.matches) this.loop();
    }
    draw() {
      // Use the actual responsive frame's pixels for both the cut and curve.
      const W = this.box.clientWidth, H = this.box.clientHeight;
      const p = this.cur, x = p * W;
      const bend = clamp((p - this.ends.x) * W * 0.5, -9, 9);
      /* the line as a curve: ends at x - bend, and a control point at
         x + bend so the curve passes exactly through the knob */
      const top = (x - bend).toFixed(2), control = (x + bend).toFixed(2);
      const curve = `M ${top} 0 Q ${control} ${H / 2} ${top} ${H}`;
      const cut = `path("M 0 0 L ${top} 0 Q ${control} ${H / 2} ${top} ${H} L 0 ${H} Z")`;
      this.before.style.clipPath = cut;
      this.line.setAttribute('d', curve);
      this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      this.grip.style.left = `${x}px`;
      this.box.setAttribute('aria-valuenow', Math.round(p * 100));
      const pt = this.box.lang === 'pt-BR';
      this.box.setAttribute('aria-valuetext', pt ? `${Math.round(p * 100)}% da foto original` : `${Math.round(p * 100)}% of the original photo`);
      this.tags[0].style.opacity = clamp((p - 0.14) * 4, 0, 1);
      this.tags[1].style.opacity = clamp((0.86 - p) * 4, 0, 1);
    }
    destroy() {
      cancelAnimationFrame(this.raf);
      this.resize.disconnect();
      this.events.abort();
    }
    static markup(lang = 'pt', variant = 'family') {
      const pt = lang === 'pt';
      const group = variant === 'group';
      const baby = variant === 'baby';
      const studio = variant === 'studio';
      const id = `compare-${variant}-help`;
      const before = baby ? 'restauracao-bebe-antes.jpg' : studio ? 'estudio-antes.png' : group ? 'restauracao-grupo-antes.jpg' : 'restauracao-antes.jpg';
      const after = baby ? 'restauracao-bebe-depois.png' : studio ? 'ester-carus.png' : group ? 'restauracao-grupo-depois.jpg' : 'restauracao-depois.jpg';
      const label = studio
        ? (pt ? 'Comparar foto original e retrato de estúdio' : 'Compare original photo and studio portrait')
        : (pt ? 'Comparar foto original e restaurada' : 'Compare original and restored photo');
      const beforeAlt = baby
        ? (pt ? 'Foto original de um bebê dormindo no sofá' : 'Original photograph of a baby sleeping on a couch')
        : studio
        ? (pt ? 'Foto original colorida de Ester Carus' : 'Original colour photograph of Ester Carus')
        : (pt ? 'Foto original da família em preto e branco' : 'Original black and white family photograph');
      const afterAlt = baby
        ? (pt ? 'Foto restaurada de um bebê dormindo no sofá' : 'Restored photograph of a baby sleeping on a couch')
        : studio
        ? (pt ? 'Retrato de estúdio de Ester Carus em preto e branco' : 'Black and white studio portrait of Ester Carus')
        : (pt ? 'Foto de família restaurada e colorida' : 'Restored family photograph in colour');
      /* two photographs of one scene, the same size and framing: the
         x-ray is the before, the colour the after */
      return `<figure class="restoration-compare${studio ? ' studio-compare' : baby ? ' restoration-compare-portrait restoration-compare-baby' : group ? ' restoration-compare-portrait' : ''}">
        <div class="cmp" data-image-compare lang="${pt ? 'pt-BR' : 'en'}" role="slider" tabindex="0" aria-label="${label}" aria-describedby="${id}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-orientation="horizontal">
          <!-- the edit underneath, drifting a little with the line (drift disabled) -->
          <img class="cmp-img cmp-after" src="assets/images/${after}" alt="${afterAlt}" width="${baby ? 1097 : studio ? 683 : group ? 864 : 1248}" height="${baby ? 1434 : studio ? 1024 : group ? 1184 : 832}" ${group || studio || baby ? 'loading="lazy"' : 'fetchpriority="high"'} draggable="false">
          <!-- the raw shot on top, cut off at the line -->
          <div class="cmp-before"><img class="cmp-img" src="assets/images/${before}" alt="${beforeAlt}" width="${baby ? 2541 : studio ? 2780 : group ? 720 : 705}" height="${baby ? 3328 : studio ? 3707 : group ? 1280 : 474}" ${group || studio || baby ? 'loading="lazy"' : ''} draggable="false"></div>
          <!-- show the Before and After tags -->
          <span class="cmp-tag">${pt ? 'Antes' : 'Before'}</span><span class="cmp-tag cmp-right">${pt ? 'Depois' : 'After'}</span>
          <svg class="cmp-line" aria-hidden="true"><path /></svg>
          <span class="cmp-grip"><span class="cmp-knob"><svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true"><path d="M5 1 1 5l4 4M11 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg></span></span>
        </div>
        <figcaption id="${id}" class="muted">${pt ? 'Arraste para comparar o antes e depois. Use também as setas do teclado.' : 'Drag to compare before and after. You can also use the arrow keys.'}</figcaption>
      </figure>`;
    }
  }
  window.ImageCompare = ImageCompare;
})();
