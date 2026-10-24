/* MI — Cinematic
   Ein festes Canvas als Bühne. Drei Szenen werden vom Scrollen gesteuert:
   1  Ich bin Mohamad    – das Foto taucht aus dem Dunkel auf, Licht streift über das Gesicht
   2  Build with MI      – Funken setzen sich zum MI-Logo zusammen, Blitze schlagen ein
   3  Zwei Seiten        – ein Scan verwandelt eine Gesichtshälfte in Wireframe und Code
   Das Foto liegt in img/portrait.jpg. */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cvs = document.getElementById('stage'), ctx = cvs.getContext('2d');
  const scenes = [...document.querySelectorAll('.scene')];
  const reveals = [...document.querySelectorAll('.reveal')].map(el => ({el, at: parseFloat(el.dataset.in || '0'), scene: scenes.indexOf(el.closest('.scene'))}));
  const loader = document.getElementById('loader'), started = performance.now();

  /* ---------- screen mode for the 3D studio ----------
     index.html?mi=sc1 shows only that part of the page on a studio monitor.
     Scenes play their scroll animation by themselves in a loop. */
  const miParam = window.__miParam || (location.search.match(/[?&]mi=([^&]+)/) || [])[1];
  const soloEl = miParam ? document.getElementById(decodeURIComponent(miParam)) : null;
  const soloScene = soloEl ? scenes.indexOf(soloEl) : -1;
  let soloActive = false;
  if(soloEl){
    document.documentElement.classList.add('mi-solo');
    if(soloScene < 0) document.documentElement.classList.add('mi-flat');
    soloEl.classList.add('mi-on');
    document.querySelectorAll('a[href]').forEach(l => { const h = l.getAttribute('href') || ''; if(h[0] !== '#' && h.indexOf('mailto:') !== 0){ l.target = '_blank'; l.rel = 'noopener'; } });
    addEventListener('message', e => { if(e.data && typeof e.data.miActive === 'boolean') soloActive = e.data.miActive; });
    const fit = () => {
      if(soloScene >= 0) return;
      soloEl.style.zoom = ''; const h = soloEl.scrollHeight, z = Math.max(.8, Math.min(1, (innerHeight - 8) / h));
      if(z < 1) soloEl.style.zoom = z;
    };
    addEventListener('resize', fit); addEventListener('load', fit); setTimeout(fit, 300);
  }
  function soloProgress(time){
    const cycle = 8, u = reduce ? 1 : (time % cycle) / cycle, k = ease(Math.min(1, u / .75));
    const range = [[0, .9], [.25, .92], [.25, .75]][soloScene], p = range[0] + (range[1] - range[0]) * k;
    return scenes.map((_, i) => i < soloScene ? 1 : i === soloScene ? p : 0);
  }
  let W = 0, H = 0, DPR = 1, mobile = false;

  /* ---------- helpers ---------- */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => t * t * (3 - 2 * t);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function resize(){
    W = innerWidth; H = innerHeight; mobile = W < 860;
    DPR = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);   // phones: fewer pixels, smoother scrolling
    cvs.width = Math.round(W * DPR); cvs.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    smk.width = Math.ceil(W / 4); smk.height = Math.ceil(H / 4);   // smoke is soft anyway: draw it at quarter size
    overlays = {};
    buildLogoTargets();
  }

  /* ---------- the photo ---------- */
  const img = new Image();
  img.decoding = 'async';
  img.src = window.MI_PHOTO || 'img/portrait.jpg';
  const FACE = {x: .506, y: .215};          // face centre in the photo (relative)
  let wire = null, ready = false, photo = null;

  // soft edges so the photo melts into the dark stage instead of showing a rectangle
  function feather(src, w, h){
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0, w, h);
    g.globalCompositeOperation = 'destination-in';
    let m = g.createLinearGradient(0, 0, w, 0);
    m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(.24, 'rgba(0,0,0,1)'); m.addColorStop(.78, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m; g.fillRect(0, 0, w, h);
    m = g.createLinearGradient(0, 0, 0, h);
    m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(.12, 'rgba(0,0,0,1)'); m.addColorStop(.9, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m; g.fillRect(0, 0, w, h);
    return c;
  }

  function photoRect(anchorX, scale){
    const h = (mobile ? H * .8 : H * 1.08) * scale;
    const w = h * (img.naturalWidth / img.naturalHeight);
    const fx = anchorX * W, fy = mobile ? H * .26 : H * .3;
    return {x: fx - FACE.x * w, y: fy - FACE.y * h, w, h};
  }

  // edge detection for the wireframe half of the face
  function makeWire(){
    const w = 578, h = Math.round(578 * img.naturalHeight / img.naturalWidth);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
    let d;
    try { d = g.getImageData(0, 0, w, h).data; } catch(e){ return null; }
    const gray = new Float32Array(w * h);
    for(let i = 0; i < w * h; i++) gray[i] = .299 * d[i*4] + .587 * d[i*4+1] + .114 * d[i*4+2];
    const out = g.createImageData(w, h), o = out.data;
    for(let y = 1; y < h - 1; y++) for(let x = 1; x < w - 1; x++){
      const i = y * w + x;
      const gx = -gray[i-w-1] - 2*gray[i-1] - gray[i+w-1] + gray[i-w+1] + 2*gray[i+1] + gray[i+w+1];
      const gy = -gray[i-w-1] - 2*gray[i-w] - gray[i-w+1] + gray[i+w-1] + 2*gray[i+w] + gray[i+w+1];
      const v = clamp((Math.hypot(gx, gy) - 14) / 55);
      if(v > 0){ const p = i * 4; o[p] = 90; o[p+1] = 225; o[p+2] = 245; o[p+3] = v * 255; }
    }
    g.clearRect(0, 0, w, h); g.putImageData(out, 0, 0);
    // a fine technical grid on top
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(109,106,248,.18)'; g.lineWidth = 1;
    for(let x = 0; x < w; x += 18){ g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, h); g.stroke(); }
    for(let y = 0; y < h; y += 18){ g.beginPath(); g.moveTo(0, y + .5); g.lineTo(w, y + .5); g.stroke(); }
    return c;
  }

  /* ---------- MI logo as particle targets ---------- */
  const MI_PATH = new Path2D('M12 40V12h6l8 11 8-11h6v28h-6V22l-8 10.5L18 22v18z');
  let parts = [];
  function buildLogoTargets(){
    const S = 6, c = document.createElement('canvas'); c.width = 64 * S; c.height = 52 * S;
    const g = c.getContext('2d'); g.scale(S, S);
    g.lineWidth = 3; g.strokeStyle = '#f00'; g.beginPath(); if(g.roundRect) g.roundRect(1.5, 1.5, 61, 49, 10); else g.rect(1.5, 1.5, 61, 49); g.stroke();
    g.fillStyle = '#0f0'; g.fill(MI_PATH); g.fillRect(45, 20, 6, 20);
    g.fillStyle = '#00f'; g.fillRect(45, 12, 6, 5.5);
    const data = g.getImageData(0, 0, c.width, c.height).data, pts = [];
    const step = mobile ? 5 : 3.4;
    for(let y = 0; y < c.height; y += step) for(let x = 0; x < c.width; x += step){
      const i = ((y | 0) * c.width + (x | 0)) * 4;
      if(data[i+3] > 128){ pts.push({x: x / c.width, y: y / c.height, k: data[i] > 128 ? 0 : data[i+1] > 128 ? 1 : 2}); }
    }
    seed = 11;
    parts = pts.map(p => {
      const a = rnd() * Math.PI * 2, r = .6 + rnd() * .9;
      return {...p, sx: Math.cos(a) * r, sy: Math.sin(a) * r, ph: rnd() * 6.28, sz: .8 + rnd() * 1.4};
    });
  }
  function logoBox(){
    const lw = mobile ? Math.min(W * .62, 300) : Math.min(W * .3, H * .5, 460);
    return {cx: mobile ? W * .5 : W * .7, cy: mobile ? H * .3 : H * .42, w: lw, h: lw * 52 / 64};
  }

  /* ---------- atmosphere: smoke and embers ---------- */
  const smk = document.createElement('canvas'), sctx = smk.getContext('2d');
  // framing + vignette never change while scrolling: draw them once (half size) and reuse
  let overlays = {};
  function overlay(side){
    if(overlays[side]) return overlays[side];
    const c = document.createElement('canvas'), w = c.width = Math.ceil(W / 2), h = c.height = Math.ceil(H / 2), g = c.getContext('2d');
    let gr;
    if(!mobile){ gr = side ? g.createLinearGradient(w, 0, w * .4, 0) : g.createLinearGradient(0, 0, w * .6, 0); gr.addColorStop(0, 'rgba(5,5,8,.9)'); gr.addColorStop(1, 'rgba(5,5,8,0)'); }
    else { gr = g.createLinearGradient(0, h * .45, 0, h); gr.addColorStop(0, 'rgba(5,5,8,0)'); gr.addColorStop(1, 'rgba(5,5,8,.95)'); }
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    return overlays[side] = c;
  }
  const smoke = Array.from({length: 7}, (_, i) => ({x: rnd(), y: .35 + rnd() * .6, r: .25 + rnd() * .3, v: (rnd() - .5) * .012, a: .05 + rnd() * .05}));
  const embers = Array.from({length: 70}, () => ({x: rnd(), y: rnd(), v: .02 + rnd() * .05, s: .6 + rnd() * 1.6, c: rnd() < .7 ? '69,220,240' : '255,190,120'}));

  /* ---------- lightning ---------- */
  let bolts = [], flash = 0;
  function makeBolt(x1, y1, x2, y2){
    let pts = [[x1, y1], [x2, y2]], disp = Math.hypot(x2 - x1, y2 - y1) * .22;
    for(let k = 0; k < 6; k++){
      const n = [pts[0]];
      for(let i = 0; i < pts.length - 1; i++){
        const [ax, ay] = pts[i], [bx, by] = pts[i+1], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
        const off = (Math.random() - .5) * disp;
        n.push([(ax + bx) / 2 - dy / l * off, (ay + by) / 2 + dx / l * off], pts[i+1]);
      }
      pts = n; disp *= .55;
    }
    return {pts, life: .22};
  }

  /* ---------- scroll state ---------- */
  function progressOf(el){
    const r = el.getBoundingClientRect(), span = el.offsetHeight - innerHeight;
    return clamp(-r.top / Math.max(1, span));
  }
  const chap = document.getElementById('chap'), railBar = document.getElementById('railBar'), hint = document.getElementById('hint');

  /* ---------- render ---------- */
  let t0 = performance.now(), time = 0, faceAnchor = .68, idle = false;
  const hud = {};
  function frame(now){
    const dt = Math.min(.05, (now - t0) / 1000); t0 = now; if(!reduce) time += dt;
    const P = soloScene >= 0 ? soloProgress(time) : scenes.map(progressOf);
    const p1 = P[0], p2 = P[1], p3 = P[2];
    const in2 = ease(clamp(p2 * 4)), in3 = ease(clamp(p3 * 4));
    const w1 = 1 - in2, w2 = in2 * (1 - in3), w3 = in3;
    const past = soloScene >= 0 ? 0 : clamp(-scenes[scenes.length - 1].getBoundingClientRect().bottom / innerHeight + 1);   // after the last scene

    // DOM: reveal text, HUD (only touch the page when a value really changes)
    reveals.forEach(r => {
      const p = P[r.scene];
      let o = r.at <= 0 ? 1 : clamp((p - r.at) / .15);
      o *= 1 - clamp((p - .9) / .1);
      const v = o.toFixed(2);
      if(v !== r.last){ r.last = v; r.el.style.setProperty('--o', v); }
    });
    const active = w3 > .5 ? 2 : w2 > .5 ? 1 : 0;
    if(active !== hud.chap){ hud.chap = active; chap.textContent = '0' + (active + 1); }
    const docP = (scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight) * 100).toFixed(1) + '%';
    if(docP !== hud.rail){ hud.rail = docP; railBar.style.height = docP; }
    const hintO = scrollY > 40 ? '0' : '1';
    if(hint && hintO !== hud.hint){ hud.hint = hintO; hint.style.opacity = hintO; }
    const isPast = past > .6;
    if(isPast !== hud.past){ hud.past = isPast; document.documentElement.classList.toggle('past', isPast); }

    // stage
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if(!hud.loaderSet && performance.now() - started > 600){ hud.loaderSet = true; setTimeout(() => loader.classList.add('done'), Math.max(0, 900 - (performance.now() - started))); }
    // below the scenes the stage is fully covered: draw nothing, save battery
    if(past >= .999){ if(!idle){ cvs.style.visibility = 'hidden'; idle = true; } requestAnimationFrame(frame); return; }
    if(idle){ cvs.style.visibility = ''; idle = false; }
    ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, W, H);
    if(!ready){ requestAnimationFrame(frame); return; }

    faceAnchor = mobile ? .5 : lerp(.68, .3, w3);
    const scale = lerp(1.12 - .12 * easeOut(p1), 1, Math.max(w2, w3));
    const R = photoRect(faceAnchor, scale);

    // photo
    const photoAlpha = w1 * lerp(.55, 1, ease(clamp(p1 * 1.6))) + w2 * .28 + w3;
    if(photoAlpha > .005){
      ctx.globalAlpha = clamp(photoAlpha);
      ctx.drawImage(photo, R.x, R.y, R.w, R.h);
      ctx.globalAlpha = 1;
    }
    // scene 1: darkness lifts, light sweeps over the face
    const dark = w1 * .5 * (1 - easeOut(clamp(p1 * 1.3))) + w2 * .35;
    if(dark > 0){ ctx.fillStyle = `rgba(5,5,8,${dark})`; ctx.fillRect(0, 0, W, H); }
    if(w1 > .01){
      const lx = R.x + R.w * lerp(.1, .95, ease(p1)), ly = R.y + R.h * FACE.y;
      ctx.globalCompositeOperation = 'overlay';
      let g = ctx.createRadialGradient(lx, ly, 0, lx, ly, R.w * .55);
      g.addColorStop(0, `rgba(120,200,255,${.55 * w1})`); g.addColorStop(.5, `rgba(109,106,248,${.25 * w1})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
      ctx.globalCompositeOperation = 'screen';
      g = ctx.createRadialGradient(lx, ly, 0, lx, ly, R.w * .3);
      g.addColorStop(0, `rgba(160,230,255,${.12 * w1})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h);
    }

    // smoke and embers (all scenes, a little less in scene 3)
    ctx.globalCompositeOperation = 'screen';
    const atm = 1 - w3 * .6;
    const sw = smk.width, sh = smk.height;
    sctx.globalCompositeOperation = 'source-over'; sctx.clearRect(0, 0, sw, sh); sctx.globalCompositeOperation = 'lighter';
    smoke.forEach(s => {
      const x = ((s.x + time * s.v) % 1.4 + 1.4) % 1.4 - .2;
      const g = sctx.createRadialGradient(x * sw, s.y * sh, 0, x * sw, s.y * sh, s.r * Math.max(sw, sh));
      g.addColorStop(0, `rgba(150,160,190,${s.a * atm})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = g; sctx.fillRect(0, 0, sw, sh);
    });
    ctx.drawImage(smk, 0, 0, W, H);
    embers.forEach(e => {
      const y = ((e.y - time * e.v) % 1 + 1) % 1, x = e.x + Math.sin(time * .7 + e.y * 9) * .01;
      ctx.fillStyle = `rgba(${e.c},${(.25 + .6 * Math.sin(y * Math.PI)) * atm})`;
      ctx.fillRect(x * W, y * H, e.s, e.s);
    });

    // scene 2: particles become the MI logo, lightning strikes
    if(w2 > .01){
      const B = logoBox(), t = ease(clamp((p2 - .02) / .55));
      ctx.globalCompositeOperation = 'lighter';
      const halo = ctx.createRadialGradient(B.cx, B.cy, 0, B.cx, B.cy, B.w * .9);
      halo.addColorStop(0, `rgba(109,106,248,${.32 * w2 * t})`); halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo; ctx.fillRect(B.cx - B.w, B.cy - B.w, B.w * 2, B.w * 2);
      const spread = Math.max(W, H) * .6;
      for(const q of parts){
        const tx = B.cx + (q.x - .5) * B.w, ty = B.cy + (q.y - .5) * B.h;
        const sx = B.cx + q.sx * spread + Math.cos(time * .6 + q.ph) * 30, sy = B.cy + q.sy * spread + Math.sin(time * .5 + q.ph) * 30;
        const x = lerp(sx, tx, t) + Math.sin(time * 3 + q.ph) * 3 * (1 - t), y = lerp(sy, ty, t) + Math.cos(time * 3 + q.ph) * 3 * (1 - t);
        ctx.fillStyle = q.k === 2 ? `rgba(69,220,240,${.9 * w2})` : q.k === 0 ? `rgba(109,106,248,${.9 * w2})` : `rgba(235,236,255,${.85 * w2})`;
        ctx.fillRect(x, y, q.sz, q.sz);
      }
      // solid logo once assembled
      const solid = clamp((t - .85) / .15) * w2;
      if(solid > 0){
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = solid;
        ctx.translate(B.cx - B.w / 2, B.cy - B.h / 2); ctx.scale(B.w / 64, B.h / 52);
        ctx.shadowColor = 'rgba(109,106,248,.9)'; ctx.shadowBlur = 24;
        ctx.lineWidth = 3; ctx.strokeStyle = '#6d6af8'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(1.5, 1.5, 61, 49, 10); else ctx.rect(1.5, 1.5, 61, 49); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.fill(MI_PATH); ctx.fillRect(45, 20, 6, 20);
        ctx.shadowColor = 'rgba(69,220,240,1)'; ctx.fillStyle = '#45dcf0'; ctx.fillRect(45, 12, 6, 5.5);
        ctx.restore();
      }
      if(!reduce && p2 > .12 && p2 < .9 && Math.random() < .045){
        const ex = B.cx + (Math.random() - .5) * B.w, ey = B.cy + (Math.random() < .5 ? -1 : 1) * B.h * .5;
        bolts.push(makeBolt(B.cx + (Math.random() - .5) * W * .6, -20, ex, ey)); flash = .1;
      }
    }
    if(bolts.length){
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      bolts.forEach(b => {
        const a = clamp(b.life / .22);
        ctx.shadowColor = 'rgba(69,220,240,1)'; ctx.shadowBlur = 22;
        ctx.strokeStyle = `rgba(120,230,255,${.75 * a})`; ctx.lineWidth = 3;
        ctx.beginPath(); b.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
        ctx.shadowBlur = 0; ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1.2; ctx.stroke();
        b.life -= dt;
      });
      bolts = bolts.filter(b => b.life > 0);
    }
    if(flash > 0){ ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(80,200,255,${flash * .5})`; ctx.fillRect(0, 0, W, H); flash -= dt; }

    // scene 3: scan turns half the face into wireframe and code
    if(w3 > .01 && wire){
      const scanT = ease(clamp(p3 / .6));
      const sx = R.x + R.w * lerp(.12, FACE.x, scanT);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, sx, H); ctx.clip();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(5,6,14,${.88 * w3})`; ctx.fillRect(0, 0, sx, H);
      ctx.globalAlpha = w3; ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(wire, R.x, R.y, R.w, R.h);
      ctx.globalAlpha = 1;
      // code fragments floating on the wireframe side
      ctx.font = '500 12px "JetBrains Mono", ui-monospace, monospace';
      const code = ['<Mohamad />', 'const idee = skizze();', 'transform: perspective(900px);', 'figma → prototyp → code', 'git commit -m "design"', 'display: grid;', 'requestAnimationFrame(loop)', 'aria-label="Kontakt"'];
      code.forEach((s, i) => {
        const y = R.y + R.h * (.08 + i * .075), x = R.x + R.w * (.12 + (i % 3) * .06) + Math.sin(time + i) * 4;
        ctx.fillStyle = `rgba(${i % 2 ? '69,220,240' : '185,183,255'},${.75 * w3})`;
        ctx.fillText(s, x, y);
      });
      ctx.restore();
      // the scan line
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(sx - 40, 0, sx + 6, 0);
      g.addColorStop(0, 'rgba(69,220,240,0)'); g.addColorStop(1, `rgba(69,220,240,${.35 * w3})`);
      ctx.fillStyle = g; ctx.fillRect(sx - 40, R.y, 46, R.h);
      ctx.fillStyle = `rgba(200,250,255,${.95 * w3})`; ctx.fillRect(sx - 1, R.y, 2, R.h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = `rgba(69,220,240,${w3})`;
      ctx.fillText('SCAN ' + Math.round(scanT * 100) + '%', sx + 8, R.y + R.h * .06);
      ctx.fillStyle = `rgba(185,183,255,${w3})`; ctx.fillText('DESIGNER', sx + 8, R.y + R.h * .1);
      ctx.fillStyle = `rgba(69,220,240,${w3})`; ctx.fillText('ENTWICKLER', Math.max(8, sx - 86), R.y + R.h * .1);
    }

    // framing: darker on the text side, vignette, fade out after the scenes
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(overlay(!mobile && w3 > .5 ? 1 : 0), 0, 0, W, H);
    if(past > 0){ ctx.fillStyle = `rgba(5,5,8,${past * .85})`; ctx.fillRect(0, 0, W, H); }

    // monitors you are not looking at in the studio update slowly to save power
    if(soloEl && !soloActive) setTimeout(() => requestAnimationFrame(frame), 250); else requestAnimationFrame(frame);
  }

  img.onload = () => { photo = feather(img, img.naturalWidth, img.naturalHeight); const wr = makeWire(); wire = wr ? feather(wr, wr.width, wr.height) : null; ready = true; };
  img.onerror = () => { ready = false; loader.classList.add('done'); };
  setTimeout(() => loader.classList.add('done'), 6000);
  resize();
  // phones: the address bar slides in and out while scrolling; do not rebuild the stage for that
  addEventListener('resize', () => { if(mobile && innerWidth === W && Math.abs(innerHeight - H) < 160) return; resize(); });
  requestAnimationFrame(frame);


  /* ---------- a hello for developers who open the console (F12) ---------- */
  function helloDev(){
    try {
      const big = 'font:700 22px "Space Grotesk",system-ui,sans-serif;color:#fff;background:linear-gradient(90deg,#6d6af8,#45dcf0);padding:10px 16px;border-radius:8px';
      const txt = 'font:14px Inter,system-ui,sans-serif;color:#d9dcea;line-height:1.6';
      const acc = 'font:600 14px Inter,system-ui,sans-serif;color:#45dcf0';
      console.log('%cMI · Mohamad Issa', big);
      console.log('%cHi! Du schaust dir den Code an? Das gefällt mir. 👀', txt);
      console.log('%cGebaut mit Canvas 2D und Three.js, ganz ohne Framework.', txt);
      console.log('%cLass uns reden: %cmohamad95issa@gmail.com', txt, acc);
      console.log('%cLinkedIn: %chttps://linkedin.com/in/mohamad-issa-35660a3a6/', txt, acc);
    } catch(e){}
  }
  if(!soloEl && window.self === window.top) helloDev();

  /* ---------- small things ---------- */
  const clock = document.getElementById('clock');
  const fmt = new Intl.DateTimeFormat('de-DE', {hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin'});
  const tick = () => clock.textContent = fmt.format(new Date()); tick(); setInterval(tick, 20000);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    if(soloEl){ e.preventDefault(); try { parent.postMessage({miNav: a.getAttribute('href')}, '*'); } catch(_){} return; }
    const el = document.querySelector(a.getAttribute('href')); if(!el) return;
    e.preventDefault(); el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
  }));
  const copy = document.getElementById('copy');
  copy.addEventListener('click', () => {
    const done = () => { copy.textContent = 'Kopiert ✓'; setTimeout(() => copy.textContent = 'Adresse kopieren', 1800); };
    try { navigator.clipboard.writeText('mohamad95issa@gmail.com').then(done, () => copy.textContent = 'mohamad95issa@gmail.com'); }
    catch(e){ copy.textContent = 'mohamad95issa@gmail.com'; }
  });
})();
