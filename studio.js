(function(){
  document.documentElement.classList.add('js');
  /* loading screen: the MI logo assembles while the studio is built */
  const ld = document.getElementById('loader'), ldBar = document.getElementById('ldBar'), ldStart = performance.now();
  const ldProgress = p => { if(ldBar) ldBar.style.width = Math.round(p * 100) + '%'; };
  let ldDone = false;
  const ldHide = () => { if(ldDone || !ld) return; ldDone = true; ldProgress(1); setTimeout(() => ld.classList.add('done'), Math.max(0, 1700 - (performance.now() - ldStart))); };
  setTimeout(ldHide, 12000);
  ldProgress(.12);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = () => innerWidth < 820 || innerWidth < innerHeight;
  const PORTRAIT = false;   // Bildschirme immer im Querformat

  /* ---------- the original website, live in an iframe ---------- */
  const PXW = PORTRAIT ? 400 : 1360, PXH = PORTRAIT ? 680 : 800;
  const sites = [];      // one live section of the website per monitor
  function makeSite(hash){
    const wrap = document.createElement('div');
    wrap.className = 'site';
    wrap.style.width = PXW + 'px'; wrap.style.height = PXH + 'px';
    const f = document.createElement('iframe');
    f.title = 'Mohamad Issa, Abschnitt ' + hash.slice(1);
    wrap.appendChild(f);
    return {wrap, f, hash, url:'index.html?mi=' + encodeURIComponent(hash.slice(1)), loaded:false, active:false, op:-1};
  }
  // iframes load only when you get close: faster start, lighter on phones
  function loadSite(s){
    if(s.loaded) return; s.loaded = true;
    s.f.src = s.url;   // deine Original-Website, nur dieser Abschnitt
  }
  addEventListener('message', e => {
    if(!e.data || !e.data.miNav) return;
    if(!sites.some(s => s && s.f.contentWindow === e.source)) return;
    const i = stops.findIndex(s => s.dataset.hash === e.data.miNav);
    if(i > 0) goStation(i);
  });


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
  helloDev();

  /* ---------- stations ---------- */
  const stops = [...document.querySelectorAll('.stop')];
  const N = stops.length;
  const intro = document.getElementById('intro'), tip = document.getElementById('tip');
  const roomName = document.getElementById('roomName'), bar = document.getElementById('bar'), ticks = document.getElementById('ticks');
  stops.forEach((_, i) => { const t = document.createElement('span'); t.style.left = (i/(N-1)*100) + '%'; ticks.appendChild(t); });
  const tickEls = [...ticks.children];
  let holds = [];
  function measure(){
    const vh = innerHeight, maxS = document.documentElement.scrollHeight - vh;
    holds = stops.map(s => {
      const mid = s.offsetTop + s.offsetHeight/2 - vh/2;
      const pad = Math.max(vh*.12, (s.offsetHeight - vh)/2 + vh*.1);
      return [Math.max(0, mid - pad), Math.min(maxS, mid + pad)];
    });
    holds[0][0] = 0; holds[0][1] = Math.max(holds[0][1], vh*.08);
    holds[N-1][1] = maxS + 1;
    // the last monitor must be reachable even when the page ends before its centre
    holds[N-1][0] = Math.min(holds[N-1][0], Math.max(holds[N-2][1] + 1, maxS - vh*.2));
  }
  measure(); addEventListener('resize', measure); addEventListener('load', measure);
  function stationProgress(){
    const y = scrollY;
    for(let i=0;i<N;i++){
      if(y <= holds[i][1]){
        if(y >= holds[i][0] || i === 0) return i;
        const a = holds[i-1][1], b = holds[i][0], t = (y - a) / Math.max(1, b - a);
        return i - 1 + t*t*(3-2*t);
      }
    }
    return N-1;
  }
  const centerOf = i => i === 0 ? 0 : (holds[i][0] + Math.min(holds[i][1], document.documentElement.scrollHeight - innerHeight)) / 2;
  const goStation = (i, fast) => { i = Math.max(0, Math.min(N-1, i)); scrollTo({top: centerOf(i), behavior: (reduce || fast) ? 'auto' : 'smooth'}); };
  const prevBtn = document.getElementById('prev'), nextBtn = document.getElementById('next');
  prevBtn.addEventListener('click', () => goStation(Math.round(stationProgress()) - 1));
  nextBtn.addEventListener('click', () => goStation(Math.round(stationProgress()) + 1));
  addEventListener('keydown', e => {
    if(e.target && e.target.closest && e.target.closest('input,textarea')) return;
    if(e.key === 'ArrowDown' || e.key === 'PageDown'){ e.preventDefault(); goStation(Math.round(stationProgress()) + 1); }
    if(e.key === 'ArrowUp' || e.key === 'PageUp'){ e.preventDefault(); goStation(Math.round(stationProgress()) - 1); }
  });
  document.querySelector('.logo').addEventListener('click', e => { e.preventDefault(); goStation(0); });

  let shownIdx = -1, tipSince = 0;
  function updateHud(p, parked){
    const idx = Math.round(p), near = Math.abs(p - idx) < .07;
    intro.classList.toggle('away', !(idx === 0 && near));
    if(idx !== shownIdx){ shownIdx = idx; roomName.textContent = stops[idx].dataset.name; prevBtn.disabled = idx === 0; nextBtn.disabled = idx === N-1; }
    tickEls.forEach((t,i) => t.classList.toggle('on', i < idx || (i === idx && near)));
    bar.style.width = (p/(N-1)*100) + '%';
    // short hint when you arrive at a monitor, then it disappears so it never covers the text
    if(!(parked && idx > 0)) tipSince = 0; else if(!tipSince) tipSince = performance.now();
    tip.classList.toggle('on', tipSince > 0 && performance.now() - tipSince < 2800);
  }

  function flatFallback(){
    for(let i=1;i<N;i++){ const s = makeSite(stops[i].dataset.hash); loadSite(s); s.wrap.classList.add('flat'); s.wrap.style.height = '80vh'; stops[i].style.minHeight = 'auto'; stops[i].style.padding = '40px 0'; stops[i].appendChild(s.wrap); }
    document.querySelectorAll('.gap').forEach(g => g.style.display = 'none');
    updateHud(0, false);
    ldHide();
  }
  if(!window.THREE){ flatFallback(); return; }
  const canvas = document.getElementById('gl');
  let renderer;
  const low = isSmall();
  // phones: no MSAA (the bloom pass renders off-screen anyway) and fewer pixels; text on the monitors stays sharp because it is real HTML
  try { renderer = new THREE.WebGLRenderer({canvas, antialias:!low, powerPreference:'high-performance'}); } catch(e){ flatFallback(); return; }
  const PR_MAX = Math.min(devicePixelRatio, low ? 1.25 : 2);
  let PR = PR_MAX;
  renderer.setPixelRatio(PR);
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x06070f);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x06070f, 14, 70);
  const BASE_FOV = low ? 66 : 56;
  const camera = new THREE.PerspectiveCamera(BASE_FOV, innerWidth/innerHeight, .05, 200);

  const GAP = 18, Z0 = 12, ROOM_W = 16, ROOM_H = 4.2;
  const ZEND = -(N-1)*GAP - 26;
  const LEN = Z0 - ZEND, ZC = (Z0 + ZEND)/2;
  const STZ = i => -i*GAP;
  const SIDE = i => i === 0 ? 0 : (i % 2 ? 1 : -1);
  const SW = PORTRAIT ? .8 : 1.36, SH = PORTRAIT ? 1.36 : .8;   // hero screen size (world units)
  let seed = 3; const rnd = () => (seed = (seed*16807) % 2147483647) / 2147483647;

  const hemi = new THREE.HemisphereLight(0xffe4c4, 0x1a1420, .62); scene.add(hemi);
  const dl = new THREE.DirectionalLight(0xb8c0ff, .35); dl.position.set(-6, 10, 4); scene.add(dl);

  // room shell
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, LEN), new THREE.MeshStandardMaterial({color:0x0d0f1d, roughness:.45, metalness:.35}));
  floor.rotation.x = -Math.PI/2; floor.position.set(0, 0, ZC); scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, LEN), new THREE.MeshStandardMaterial({color:0x090a14, roughness:1}));
  ceil.rotation.x = Math.PI/2; ceil.position.set(0, ROOM_H, ZC); scene.add(ceil);

  /* ---------- glass walls with New York, Berlin and Paris ----------
     Real photos placed at img/new-york.jpg, img/berlin.jpg, img/paris.jpg replace the painted skylines automatically. */
  function skyline(city, mode){
    const sunset = mode === 'sunset', LITF = sunset ? .4 : 1;
    const W = 2048, H = 560;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const skies = {ny:['#060a24','#1b1f5c','#4a2a6e'], berlin:['#050d1e','#123a52','#2a4f6b'], paris:['#0a0820','#2a1850','#6b2f62']};
    const [s0,s1,s2] = sunset ? {ny:['#2a1b4a','#c4527a','#ffb36b'], berlin:['#1f2350','#b0587e','#ffc27a'], paris:['#2b1a48','#d0607a','#ffcf8a']}[city] : skies[city];
    const sky = g.createLinearGradient(0,0,0,H); sky.addColorStop(0,s0); sky.addColorStop(.62,s1); sky.addColorStop(1,s2);
    g.fillStyle = sky; g.fillRect(0,0,W,H);
    if(!sunset) for(let i=0;i<220;i++){ g.fillStyle = `rgba(255,255,255,${.25 + rnd()*.6})`; g.fillRect(rnd()*W, rnd()*H*.45, 1.6, 1.6); }
    const moon = g.createRadialGradient(W*.82,90,0,W*.82,90,70); moon.addColorStop(0,'rgba(255,248,230,.95)'); moon.addColorStop(.35,'rgba(255,240,210,.5)'); moon.addColorStop(1,'rgba(255,240,210,0)');
    if(!sunset){ g.fillStyle = moon; g.fillRect(W*.82-70, 20, 140, 140); }
    else { const sun = g.createRadialGradient(W*.72, H*.74, 0, W*.72, H*.74, 260); sun.addColorStop(0,'rgba(255,240,200,1)'); sun.addColorStop(.18,'rgba(255,190,120,.9)'); sun.addColorStop(.5,'rgba(255,140,110,.3)'); sun.addColorStop(1,'rgba(255,120,120,0)');
      g.fillStyle = sun; g.fillRect(0, 0, W, H); }
    const lit = () => rnd() < .7 ? `rgba(255,${200 + (rnd()*40|0)},${130 + (rnd()*60|0)},${.6 + rnd()*.4})` : `rgba(150,${190 + (rnd()*50|0)},255,.8)`;
    function block(x, w, h, dense, col){
      g.fillStyle = col; g.fillRect(x, H - h, w, h);
      for(let wy = H - h + 10; wy < H - 8; wy += 9) for(let wx = x + 4; wx < x + w - 5; wx += 7) if(rnd() < dense * LITF){ g.fillStyle = lit(); g.fillRect(wx, wy, 3, 4); }
    }
    function farRow(maxH, col, dense){ for(let x = 0; x < W;){ const w = 26 + rnd()*60, h = 40 + rnd()*maxH; block(x, w, h, dense, col); x += w + 2; } }
    if(city === 'ny'){
      farRow(200, '#0c1030', .18);
      for(let x = 0; x < W;){ const w = 40 + rnd()*70, h = 120 + rnd()*230; block(x, w, h, .32, '#080a1f'); x += w + 3; }
      // Empire State Building
      const ex = 860;
      block(ex, 150, 250, .4, '#070818'); block(ex + 25, 100, 330, .4, '#070818'); block(ex + 45, 60, 395, .45, '#070818');
      g.fillStyle = '#070818'; g.fillRect(ex + 62, H - 440, 26, 45); g.fillRect(ex + 72, H - 500, 6, 60);
      g.fillStyle = 'rgba(255,90,140,.9)'; g.fillRect(ex + 50, H - 398, 50, 6);
      g.fillStyle = 'rgba(120,200,255,.9)'; g.fillRect(ex + 62, H - 438, 26, 4);
      // Chrysler-like crown
      const cx = 1240; block(cx, 90, 330, .4, '#070818');
      g.fillStyle = '#070818'; for(let k = 0; k < 5; k++){ g.beginPath(); g.arc(cx + 45, H - 330 - k*16, 45 - k*8, Math.PI, 0); g.fill(); }
      g.strokeStyle = 'rgba(255,230,180,.85)'; g.lineWidth = 2; for(let k = 0; k < 4; k++){ g.beginPath(); g.arc(cx + 45, H - 330 - k*16, 42 - k*8, Math.PI, 0); g.stroke(); }
      g.fillStyle = '#070818'; g.fillRect(cx + 43, H - 440, 4, 50);
      // One World Trade Center
      const wx = 340; g.fillStyle = '#080a1f'; g.beginPath(); g.moveTo(wx, H); g.lineTo(wx + 120, H); g.lineTo(wx + 95, H - 430); g.lineTo(wx + 25, H - 430); g.closePath(); g.fill();
      for(let wy = H - 420; wy < H - 10; wy += 9) for(let k = 0; k < 9; k++) if(rnd() < .35){ g.fillStyle = lit(); g.fillRect(wx + 28 + k*8 + (H - wy)*.0, wy, 3, 4); }
      g.fillRect(wx + 58, H - 500, 4, 70);
      g.fillStyle = 'rgba(255,60,60,.95)'; g.fillRect(wx + 57, H - 503, 6, 6); g.fillRect(ex + 72, H - 503, 6, 6);
    } else if(city === 'berlin'){
      farRow(120, '#0b1626', .2);
      for(let x = 0; x < W;){ const w = 90 + rnd()*120, h = 90 + rnd()*90; block(x, w, h, .38, '#071019'); x += w + 6; }
      // Fernsehturm
      const tx = 1100;
      g.fillStyle = '#081320'; g.beginPath(); g.moveTo(tx - 20, H); g.lineTo(tx + 20, H); g.lineTo(tx + 9, H - 300); g.lineTo(tx - 9, H - 300); g.closePath(); g.fill();
      const sg = g.createRadialGradient(tx - 14, H - 330, 4, tx, H - 320, 48); sg.addColorStop(0,'#3d5a7a'); sg.addColorStop(1,'#0a1626');
      g.fillStyle = sg; g.beginPath(); g.arc(tx, H - 320, 46, 0, Math.PI*2); g.fill();
      g.fillStyle = 'rgba(255,220,150,.9)'; for(let k = -40; k <= 40; k += 6) g.fillRect(tx + k, H - 322, 3, 4);
      g.fillStyle = '#081320'; g.fillRect(tx - 6, H - 380, 12, 18); g.fillRect(tx - 3, H - 470, 6, 92);
      g.fillStyle = 'rgba(255,40,40,.95)'; for(let k = 0; k < 4; k++) g.fillRect(tx - 3, H - 470 + k*22, 6, 4);
      // Brandenburger Tor
      const bx = 520; g.fillStyle = '#081320';
      g.fillRect(bx, H - 120, 260, 22); g.fillRect(bx + 10, H - 140, 240, 20);
      for(let k = 0; k < 6; k++) g.fillRect(bx + 10 + k*46, H - 98, 14, 98);
      g.fillRect(bx + 105, H - 165, 50, 25);
      g.fillStyle = 'rgba(255,214,140,.35)'; g.fillRect(bx, H - 98, 260, 98);
      g.fillStyle = '#081320'; for(let k = 0; k < 6; k++) g.fillRect(bx + 10 + k*46, H - 98, 14, 98);
      // Oberbaum-style towers
      block(1560, 34, 190, .2, '#071019'); block(1650, 34, 190, .2, '#071019');
    } else {
      farRow(90, '#140c2a', .25);
      // Haussmann rows with mansard roofs
      for(let x = 0; x < W;){
        const w = 110 + rnd()*90, h = 90 + rnd()*40;
        block(x, w, h, .5, '#0e0820');
        g.fillStyle = '#120a28'; g.beginPath(); g.moveTo(x, H - h); g.lineTo(x + 12, H - h - 26); g.lineTo(x + w - 12, H - h - 26); g.lineTo(x + w, H - h); g.closePath(); g.fill();
        x += w + 2;
      }
      // Eiffel Tower, lit gold
      const ex = 1180, base = H, top = H - 470;
      const gold = g.createLinearGradient(0, top, 0, base); gold.addColorStop(0,'#ffe6a8'); gold.addColorStop(1,'#d48a2a');
      g.fillStyle = gold;
      g.beginPath();
      g.moveTo(ex - 120, base); g.quadraticCurveTo(ex - 40, base - 150, ex - 26, base - 260); g.lineTo(ex - 8, top + 40);
      g.lineTo(ex - 3, top); g.lineTo(ex + 3, top); g.lineTo(ex + 8, top + 40); g.lineTo(ex + 26, base - 260);
      g.quadraticCurveTo(ex + 40, base - 150, ex + 120, base); g.lineTo(ex + 78, base);
      g.quadraticCurveTo(ex, base - 120, ex - 78, base); g.closePath(); g.fill();
      g.fillStyle = '#ffe6a8'; g.fillRect(ex - 62, base - 140, 124, 9); g.fillRect(ex - 34, base - 262, 68, 7); g.fillRect(ex - 13, top + 60, 26, 5);
      g.strokeStyle = 'rgba(80,40,10,.55)'; g.lineWidth = 1.2;
      for(let y = base - 20; y > top + 50; y -= 14){ const half = 8 + (y - top) * .2; g.beginPath(); g.moveTo(ex - half, y); g.lineTo(ex + half, y - 14); g.moveTo(ex + half, y); g.lineTo(ex - half, y - 14); g.stroke(); }
      const beam = g.createLinearGradient(ex, top, ex + 600, top - 80); beam.addColorStop(0,'rgba(255,240,200,.35)'); beam.addColorStop(1,'rgba(255,240,200,0)');
      g.fillStyle = beam; g.beginPath(); g.moveTo(ex, top + 4); g.lineTo(ex + 700, top - 120); g.lineTo(ex + 700, top - 60); g.closePath(); g.fill();
      // Seine glow
      g.fillStyle = 'rgba(255,200,120,.12)'; g.fillRect(0, H - 14, W, 14);
    }
    g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '500 26px "JetBrains Mono", monospace';
    g.fillText({ny:'NEW YORK', berlin:'BERLIN', paris:'PARIS'}[city], 40, 52);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  const SEG = 16, WALL_ASPECT = SEG / ROOM_H;
  const CITIES = [['ny','img/new-york.jpg'], ['berlin','img/berlin.jpg'], ['paris','img/paris.jpg']];
  const cityMats = CITIES.map(([key]) => new THREE.MeshBasicMaterial({map:skyline(key)}));
  const cityReal = [], cityNight = cityMats.map(m => m.map);
  CITIES.forEach(([key, file], i) => {
    new THREE.TextureLoader().load(file, tex => {
      tex.encoding = THREE.sRGBEncoding;
      const a = tex.image.width / tex.image.height;
      if(a < WALL_ASPECT){ tex.repeat.set(1, a / WALL_ASPECT); tex.offset.set(0, (1 - a / WALL_ASPECT) / 2); }
      else { tex.repeat.set(WALL_ASPECT / a, 1); tex.offset.set((1 - WALL_ASPECT / a) / 2, 0); }
      cityMats[i].map = tex; cityMats[i].needsUpdate = true; cityReal[i] = true;
    }, undefined, () => {});
  });
  const mullionMat = new THREE.MeshStandardMaterial({color:0x0b0c16, roughness:.5, metalness:.6});
  // walls alternate: city windows and MI brand walls (decorated further down)
  const brandWalls = [];
  [-1, 1].forEach(side => {
    let k = side < 0 ? 0 : 1, seg = 0;
    for(let z = Z0; z > ZEND; z -= SEG, seg++){
      const len = Math.min(SEG, z - ZEND), zc = z - len/2;
      if((seg + (side < 0 ? 0 : 1)) % 2 === 1){
        const hasMirror = side > 0 && zc - len/2 < -29 && zc + len/2 > -29;
        const nearShelfOrPhotos = (side < 0 && seg === 1) || (side > 0 && seg === 0);
        brandWalls.push({side, zc, len, decor: hasMirror ? null : (nearShelfOrPhotos ? 'logo' : 'full')});
        continue;
      }
      const m = new THREE.Mesh(new THREE.PlaneGeometry(len, ROOM_H), cityMats[k++ % 3]);
      m.rotation.y = side * -Math.PI/2;
      m.position.set(side * ROOM_W/2, ROOM_H/2, zc);
      scene.add(m);
      for(let mz = z; mz >= z - len - .01; mz -= 4){
        const mu = new THREE.Mesh(new THREE.BoxGeometry(.08, ROOM_H, .1), mullionMat);
        mu.position.set(side * (ROOM_W/2 - .04), ROOM_H/2, mz); scene.add(mu);
      }
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(.1, .08, LEN), mullionMat);
    rail.position.set(side * (ROOM_W/2 - .05), 1.05, ZC); scene.add(rail);
  });

  /* ---------- mirrors: a glossy mirror floor and a large framed wall mirror near the logo ---------- */
  const mirrors = [];
  if(THREE.Reflector){
    const dpr = Math.min(devicePixelRatio, 2);
    if(!low){
      const fm = new THREE.Reflector(new THREE.PlaneGeometry(ROOM_W, LEN), {
        textureWidth: Math.round(innerWidth * dpr * .5), textureHeight: Math.round(innerHeight * dpr * .5), color: 0x8a8ca0, clipBias: .003
      });
      fm.rotation.x = -Math.PI/2; fm.position.set(0, -.03, ZC); scene.add(fm); mirrors.push(fm);
      floor.material.transparent = true; floor.material.opacity = .8; floor.material.depthWrite = false;
    }
    const MW = 5.6, MH = 2.9, MZ = -29;
    const wm = new THREE.Reflector(new THREE.PlaneGeometry(MW, MH), {
      textureWidth: low ? 512 : 1024, textureHeight: low ? 266 : 532, color: 0xc4c7d6, clipBias: .003
    });
    wm.rotation.y = -Math.PI/2; wm.position.set(ROOM_W/2 - .09, 2.05, MZ); scene.add(wm); mirrors.push(wm);
    const fmMat = new THREE.MeshStandardMaterial({color:0xb9a27a, roughness:.3, metalness:.9});
    [[0, MH/2 + .06, MW + .24, .12], [0, -MH/2 - .06, MW + .24, .12], [MW/2 + .06, 0, .12, MH], [-MW/2 - .06, 0, .12, MH]].forEach(([dz, dy, w, h]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(.08, h, w), fmMat);
      b.position.set(ROOM_W/2 - .08, 2.05 + dy, MZ + dz); scene.add(b);
    });
    const mlight = new THREE.Mesh(new THREE.BoxGeometry(.06, .04, MW), new THREE.MeshBasicMaterial({color:0xfff1d6}));
    mlight.position.set(ROOM_W/2 - .2, 2.05 + MH/2 + .22, MZ); scene.add(mlight);
  }

  /* ---------- office interior: wooden slat ceiling, recessed spots, wood floor beside a polished aisle ---------- */
  const woodCanvas = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
    for(let p = 0; p < 8; p++){
      const base = 70 + rnd()*22;
      g.fillStyle = `rgb(${base + 34},${base + 6},${base - 22})`; g.fillRect(0, p*64, 512, 64);
      for(let k = 0; k < 40; k++){ g.strokeStyle = `rgba(40,22,10,${.05 + rnd()*.12})`; g.lineWidth = 1 + rnd()*2; g.beginPath(); const y = p*64 + rnd()*64; g.moveTo(0, y); g.bezierCurveTo(170, y + (rnd()-.5)*10, 340, y + (rnd()-.5)*10, 512, y + (rnd()-.5)*6); g.stroke(); }
      g.fillStyle = 'rgba(20,10,4,.55)'; g.fillRect(0, p*64, 512, 2);
      g.fillRect((rnd()*512)|0, p*64, 2, 64);
    }
    return c;
  })();
  const WOOD_W = ROOM_W/2 - 2.3;
  const woodTex = new THREE.CanvasTexture(woodCanvas); woodTex.encoding = THREE.sRGBEncoding;
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(WOOD_W/2.2, LEN/2.6); woodTex.anisotropy = 4;
  const woodFloorMat = new THREE.MeshStandardMaterial({map:woodTex, roughness:.55, metalness:.05, color:0x8a7a70});
  [-1, 1].forEach(side => {
    const wf = new THREE.Mesh(new THREE.PlaneGeometry(WOOD_W, LEN), woodFloorMat);
    wf.rotation.x = -Math.PI/2; wf.rotation.z = Math.PI/2 * 0; wf.position.set(side * (2.3 + WOOD_W/2), .006, ZC); scene.add(wf);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(.04, .02, LEN), new THREE.MeshStandardMaterial({color:0xb9a27a, metalness:.9, roughness:.3}));
    edge.position.set(side * 2.3, .012, ZC); scene.add(edge);
  });
  // polished concrete aisle (the mirror floor shows through here)
  floor.material.color.set(low ? 0x14151c : 0x23252f);   // phones have no mirror floor: keep the aisle dark and calm

  // wooden slat ceiling
  const slatTex = woodTex.clone(); slatTex.needsUpdate = true; slatTex.repeat.set(.2, LEN/3);
  const slatMat = new THREE.MeshStandardMaterial({map:slatTex, color:0x7a5a40, roughness:.7});
  const slatCount = Math.floor(ROOM_W / .26);
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(.08, .16, LEN), slatMat, slatCount);
  const st = new THREE.Object3D();
  for(let k = 0; k < slatCount; k++){ st.position.set(-ROOM_W/2 + .13 + k*.26, ROOM_H - .09, ZC); st.updateMatrix(); slats.setMatrixAt(k, st.matrix); }
  scene.add(slats);
  ceil.material.color.set(0x07070b);
  // small recessed spots in a calm grid
  const spotGeo = new THREE.CircleGeometry(.07, 16); spotGeo.rotateX(Math.PI/2);
  const spots = new THREE.InstancedMesh(spotGeo, new THREE.MeshBasicMaterial({color:0xfff0d8}), 400);
  let sc = 0;
  for(let z = Z0 - 1; z > ZEND + 1; z -= 3){ [-1.2, 1.2].forEach(x => { st.position.set(x, ROOM_H - .18, z); st.updateMatrix(); spots.setMatrixAt(sc++, st.matrix); }); }
  spots.count = sc; scene.add(spots);

  // warm pendant lamps (shared parts, added to every desk)
  const PEND_Y = 2.55;
  const cordGeo = new THREE.CylinderGeometry(.006, .006, ROOM_H - PEND_Y - .28, 4);
  const shadeGeo = new THREE.CylinderGeometry(.07, .3, .28, 24, 1, true);
  const shadeMat = new THREE.MeshStandardMaterial({color:0x1b1c22, metalness:.7, roughness:.35, side:THREE.DoubleSide});
  const shadeInMat = new THREE.MeshBasicMaterial({color:0xffcf8a, side:THREE.BackSide, transparent:true, opacity:.55});
  const bulbGeo = new THREE.SphereGeometry(.06, 12, 8);
  const bulbMat = new THREE.MeshBasicMaterial({color:0xfff1d0});
  const cordMat = new THREE.MeshBasicMaterial({color:0x111116});
  const poolTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(255,205,140,.55)'); gr.addColorStop(.5,'rgba(255,180,110,.18)'); gr.addColorStop(1,'rgba(255,170,100,0)');
    g.fillStyle = gr; g.fillRect(0,0,128,128); const t = new THREE.CanvasTexture(c); return t;
  })();
  const poolMat = new THREE.MeshBasicMaterial({map:poolTex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false});
  const poolGeo = new THREE.PlaneGeometry(2.4, 2.4); poolGeo.rotateX(-Math.PI/2);
  function pendant(parent, x, y0, z, withPool){
    const p = new THREE.Group();
    const cord = new THREE.Mesh(cordGeo, cordMat); cord.position.y = (ROOM_H - PEND_Y - .28)/2 + .14; p.add(cord);
    const shade = new THREE.Mesh(shadeGeo, shadeMat); p.add(shade);
    const inner = new THREE.Mesh(shadeGeo, shadeInMat); inner.scale.setScalar(.97); p.add(inner);
    const bulb = new THREE.Mesh(bulbGeo, bulbMat); bulb.position.y = -.08; p.add(bulb);
    p.position.set(x, PEND_Y - y0, z); parent.add(p);
    if(withPool && !low){ const pool = new THREE.Mesh(poolGeo, poolMat); pool.position.set(x, .78 - y0, z); parent.add(pool); }
  }

  // screen textures for the background monitors
  function genericTex(kind){
    const c = document.createElement('canvas'); c.width = 512; c.height = 300; const g = c.getContext('2d');
    if(kind === 0){
      g.fillStyle = '#12142a'; g.fillRect(0,0,512,300); g.fillStyle = '#1b1e3a'; g.fillRect(0,0,90,300);
      const cols = ['#c792ea','#82aaff','#c3e88d','#f78c6c','#89ddff','#eef0fa'];
      for(let y=16; y<290; y+=13){ let x = 104 + Math.floor(rnd()*4)*16; const n = 1 + Math.floor(rnd()*4);
        for(let k=0;k<n;k++){ const w = 20 + rnd()*90; g.fillStyle = cols[Math.floor(rnd()*cols.length)]; g.fillRect(x, y, w, 6); x += w + 8; } }
    } else if(kind === 1){
      g.fillStyle = '#2c2d3a'; g.fillRect(0,0,512,300); g.fillStyle = '#1e1f29'; g.fillRect(0,0,80,300); g.fillRect(432,0,80,300);
      g.fillStyle = '#e8e9f2'; g.fillRect(110, 30, 290, 240);
      g.fillStyle = ['#6d6af8','#ff7a59','#45dcf0'][Math.floor(rnd()*3)]; g.fillRect(130, 50, 250, 70);
      g.fillStyle = '#c9cbe0'; g.fillRect(130, 136, 160, 10); g.fillRect(130, 154, 200, 8); g.fillRect(130, 168, 120, 8);
      g.fillStyle = '#17182c'; g.fillRect(130, 200, 90, 26); g.strokeStyle = '#45dcf0'; g.lineWidth = 2; g.strokeRect(126, 46, 258, 78);
      for(let y=20;y<280;y+=18){ g.fillStyle = '#3a3c4e'; g.fillRect(10,y,60,7); g.fillRect(442,y,58,7); }
    } else if(kind === 2){
      g.fillStyle = '#f4f5fb'; g.fillRect(0,0,512,300);
      for(let k=0;k<3;k++){ g.fillStyle = '#fff'; g.fillRect(20+k*162, 20, 150, 60); g.fillStyle = '#6d6af8'; g.fillRect(32+k*162, 52, 50+rnd()*60, 12); }
      g.fillStyle = '#fff'; g.fillRect(20, 96, 472, 184);
      g.strokeStyle = '#6d6af8'; g.lineWidth = 4; g.beginPath(); let y = 230; g.moveTo(40, y);
      for(let x=40; x<=470; x+=30){ y = Math.max(120, Math.min(260, y - 6 - (rnd()-.35)*40)); g.lineTo(x, y); } g.stroke();
    } else {
      g.fillStyle = '#07090f'; g.fillRect(0,0,512,300);
      for(let y=18; y<290; y+=14){ g.fillStyle = rnd() < .2 ? '#45dcf0' : '#3ddc97'; g.fillRect(14, y, 10, 6); g.fillStyle = 'rgba(220,240,230,.8)'; g.fillRect(32, y, 60 + rnd()*300, 6); }
    }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  const generic = [0,1,2,3,0,1].map(genericTex);
  function saverTex(label){
    const W = PORTRAIT ? 300 : 512, H = PORTRAIT ? 512 : 300;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0,0,W,H); gr.addColorStop(0,'#14123a'); gr.addColorStop(1,'#0a2a3a'); g.fillStyle = gr; g.fillRect(0,0,W,H);
    g.fillStyle = '#6d6af8'; g.fillRect(W/2-50, H/2-70, 100, 100);
    g.fillStyle = '#fff'; g.font = '700 44px "Space Grotesk", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MI', W/2, H/2-18);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '600 22px "Space Grotesk", sans-serif'; g.fillText(label, W/2, H/2+62);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '400 14px "JetBrains Mono", monospace'; g.fillText('klicken oder näherkommen', W/2, H/2+92);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  function bootTex(){
    const W = PORTRAIT ? 300 : 512, H = PORTRAIT ? 512 : 300;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = '#fbfbfe'; g.fillRect(0,0,W,H); g.fillStyle = '#eef0f7'; g.fillRect(0,0,W,22);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  const boot = bootTex();

  const deskMat = new THREE.MeshStandardMaterial({color:0x2a2d44, roughness:.5, metalness:.2});
  const woodMat = new THREE.MeshStandardMaterial({color:0x5a4636, roughness:.7});
  const legMat = new THREE.MeshStandardMaterial({color:0x8a8fa8, roughness:.35, metalness:.8});
  const monMat = new THREE.MeshStandardMaterial({color:0x15161f, roughness:.35, metalness:.6});
  const chairMat = new THREE.MeshStandardMaterial({color:0x1d2038, roughness:.8});
  const keyMat = new THREE.MeshStandardMaterial({color:0xd5d8e8, roughness:.6});
  const plantMat = new THREE.MeshStandardMaterial({color:0x2f7d5a, roughness:.8, flatShading:true});
  const potMat = new THREE.MeshStandardMaterial({color:0xe8e4dc, roughness:.7});
  const deskTop = new THREE.BoxGeometry(1.3, .05, 2.3), leg = new THREE.BoxGeometry(.05, .72, .05);
  const seat = new THREE.BoxGeometry(.55, .08, .55), back = new THREE.BoxGeometry(.06, .6, .5), post = new THREE.CylinderGeometry(.03,.03,.45,6);
  const kb = new THREE.BoxGeometry(.18, .02, .5);

  function monitor(w, h, map, bright){
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w + .05, h + .05, .04), monMat));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map, color:new THREE.Color(bright, bright, bright)}));
    scr.position.z = .022; g.add(scr);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(.06, .3, .04), legMat); neck.position.set(0, -h/2 - .15, -.05); g.add(neck);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.32, .02, .22), legMat); foot.position.set(0, -h/2 - .3, -.05); g.add(foot);
    g.userData.screen = scr;
    return g;
  }
  /* hero monitor: slim black bezel with rounded corners, aluminium back, slanted aluminium stand, soft glow behind */
  const bezelMat = new THREE.MeshStandardMaterial({color:0x0a0a0d, roughness:.35, metalness:.3});
  const aluMat = new THREE.MeshStandardMaterial({color:0xc9ccd4, roughness:.26, metalness:.95});
  const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64,64,10,64,64,64); gr.addColorStop(0,'rgba(120,118,255,.38)'); gr.addColorStop(.6,'rgba(69,220,240,.08)'); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); })();
  const rr = (w, h, r) => { const s = new THREE.Shape(), x = -w/2, y = -h/2;
    s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y); return s; };
  function heroMonitor(w, h, map){
    const g = new THREE.Group();
    const bw = w + .045, bh = h + .045, r = .04;
    const bezel = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(bw, bh, r), {depth:.012, bevelEnabled:false, curveSegments:10}), bezelMat);
    bezel.position.z = .008; g.add(bezel);
    const shell = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(bw, bh, r), {depth:.026, bevelEnabled:true, bevelThickness:.01, bevelSize:.006, bevelSegments:3, curveSegments:10}), aluMat);
    shell.position.z = -.028; g.add(shell);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map})); scr.position.z = .022; g.add(scr);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.1, h * 2.3), new THREE.MeshBasicMaterial({map:haloTex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
    halo.position.z = -.08; g.add(halo);
    const footY = -h/2 - .3 + .006;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.34, .012, .27), aluMat); foot.position.set(0, footY, -.13); g.add(foot);
    const y1 = footY + .006, z1 = -.2, y2 = -h * .08, z2 = -.05;
    const len = Math.hypot(y2 - y1, z2 - z1);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(.2, len, .014), aluMat);
    neck.position.set(0, (y1 + y2)/2, (z1 + z2)/2); neck.rotation.x = Math.atan2(z2 - z1, y2 - y1); g.add(neck);
    g.userData.screen = scr;
    return g;
  }
  function desk(side, z, hero, label){
    const g = new THREE.Group();
    const top = new THREE.Mesh(deskTop, hero ? woodMat : deskMat); top.position.set(0, .74, 0); g.add(top);
    [[-.58,-1.08],[.58,-1.08],[-.58,1.08],[.58,1.08]].forEach(([x,zz]) => { const l = new THREE.Mesh(leg, legMat); l.position.set(x, .37, zz); g.add(l); });
    const k = new THREE.Mesh(kb, keyMat); k.position.set(-.25, .775, 0); g.add(k);
    if(!hero){
      const dual = rnd() < .4, n = dual ? 2 : 1;
      for(let m=0;m<n;m++){
        const mm = monitor(.82, .48, generic[Math.floor(rnd()*generic.length)], .75 + rnd()*.25);
        mm.position.set(.35, .77 + .24 + .3, dual ? (m ? -.44 : .44) : 0); mm.rotation.y = -Math.PI/2 + (dual ? (m ? -.18 : .18) : 0);
        g.add(mm);
      }
      const ch = new THREE.Group();
      const s = new THREE.Mesh(seat, chairMat); s.position.y = .48; ch.add(s);
      const b = new THREE.Mesh(back, chairMat); b.position.set(-.27, .82, 0); ch.add(b);
      const p = new THREE.Mesh(post, legMat); p.position.y = .22; ch.add(p);
      ch.position.set(-.95, 0, (rnd()-.5)*.6); ch.rotation.y = (rnd()-.5)*.7; g.add(ch);
      if(rnd() < .25){ const pot = new THREE.Mesh(new THREE.CylinderGeometry(.09,.07,.16,10), potMat); pot.position.set(.45, .85, .95); g.add(pot);
        const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 0), plantMat); lf.position.set(.45, 1.02, .95); g.add(lf); }
      pendant(g, 0, 0, 0, true);
    } else {
      const mon = new THREE.Group();
      const saver = saverTex(label);
      const mm = monitor(SW, SH, saver, 1);
      mon.add(mm);
      const baseY = .77 + SH/2 + .3;
      mon.position.set(.3, baseY, 0);
      mon.rotation.y = -Math.PI/2 + .55;
      g.add(mon);
      Object.assign(g.userData, {mon, mm, screen:mm.userData.screen, saver, baseY});
      const lamp = new THREE.PointLight(0x8f8cff, 0, 4, 2); lamp.position.set(-.6, 1.4, 0); g.add(lamp);
      g.userData.lamp = lamp;
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(.11,.09,.2,12), potMat); pot.position.set(.35, .86, -1.0); g.add(pot);
      const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(.22, 0), plantMat); lf.position.set(.35, 1.1, -1.0); g.add(lf);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(.13, .006, .17), aluMat); pad.position.set(-.25, .776, .45); g.add(pad);
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.1,12), new THREE.MeshStandardMaterial({color:0x6d6af8})); mug.position.set(-.3, .82, .75); g.add(mug);
    }
    g.position.set(side * 4.2, 0, z);
    g.rotation.y = side > 0 ? 0 : Math.PI;
    scene.add(g);
    return g;
  }
  // entrance (reception + lounge) and the meeting room stay free of desks
  const freeSpot = (side, z) => !(z > -9) && !(side < 0 && z < -42 && z > -66);
  for(let z = Z0 - 4; z > ZEND + 4; z -= 6){
    [-1, 1].forEach(side => {
      const nearHero = stops.some((_, i) => i > 0 && SIDE(i) === side && Math.abs(z - STZ(i)) < 4);
      if(!nearHero && freeSpot(side, z)) desk(side, z, false);
    });
  }
  for(let z = Z0 - 7; z > ZEND + 4; z -= 6){ [-1, 1].forEach(side => { if(!freeSpot(side, z)) return; const d = desk(side, z, false); d.position.x = side * 6.6; }); }

  // hero desks
  const heroes = [];
  for(let i=1;i<N;i++){
    const h = desk(SIDE(i), STZ(i), true, stops[i].dataset.name);
    h.userData.booted = false;
    heroes[i] = h;
  }

  function signTex(){
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 120px "Space Grotesk", sans-serif'; g.fillStyle = '#c9c7ff'; g.shadowColor = '#6d6af8'; g.shadowBlur = 30; g.fillText('MI STUDIO', 512, 110);
    g.font = '500 34px "JetBrains Mono", monospace'; g.fillStyle = '#45dcf0'; g.shadowColor = '#45dcf0'; g.fillText('DESIGN · CODE · UX', 512, 205);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  const endWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), new THREE.MeshStandardMaterial({color:0x101326, roughness:.9}));
  endWall.position.set(0, ROOM_H/2, ZEND); scene.add(endWall);
  const sTex = signTex();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({map:sTex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
  sign.position.set(0, 2.6, ZEND + .05); scene.add(sign);
  const hang = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .65), new THREE.MeshBasicMaterial({map:sTex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
  hang.position.set(0, 3.4, Z0 - 10);

  /* ---------- reception, lounge with bookshelf, glass meeting room ---------- */
  const whiteMat = new THREE.MeshStandardMaterial({color:0xe9e7e2, roughness:.35});
  const darkWood = new THREE.MeshStandardMaterial({map:woodTex, color:0x4a3628, roughness:.6});
  const fabric = new THREE.MeshStandardMaterial({color:0x2c3a4f, roughness:.95});
  const fabric2 = new THREE.MeshStandardMaterial({color:0x5b4b6e, roughness:.95});
  const brass = new THREE.MeshStandardMaterial({color:0xb9a27a, metalness:.9, roughness:.3});
  const box = (w, h, d, mat, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (parent || scene).add(m); return m; };

  // Reception (right side of the entrance)
  const rec = new THREE.Group();
  box(.9, 1.05, 3.2, darkWood, 0, .525, 0, rec);
  box(1.05, .05, 3.35, whiteMat, 0, 1.075, 0, rec);
  const led = box(.02, .02, 3.2, new THREE.MeshBasicMaterial({color:0xffd9a0}), -.47, .06, 0, rec);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(.8, .3), new THREE.MeshBasicMaterial({map:sTex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
  plate.rotation.y = -Math.PI/2; plate.position.set(-.46, .7, 0); rec.add(plate);
  const rChair = new THREE.Group(); box(.5,.08,.5,chairMat,0,.5,0,rChair); box(.06,.6,.46,chairMat,.24,.84,0,rChair); rChair.position.set(.75, 0, .4); rChair.rotation.y = Math.PI; rec.add(rChair);
  const rMon = monitor(.6, .36, generic[1], .9); rMon.position.set(.15, 1.48, -.7); rMon.rotation.y = -Math.PI/2 + .3; rec.add(rMon);
  rec.position.set(3.6, 0, -1.5); scene.add(rec);
  pendant(scene, 3.6, 0, -2.3, true); pendant(scene, 3.6, 0, -.7, true);
  const recPot = new THREE.Mesh(new THREE.CylinderGeometry(.26,.2,.55,16), potMat); recPot.position.set(3.4, .28, .7); scene.add(recPot);
  const recPlant = new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 1), plantMat); recPlant.position.set(3.4, 1.0, .7); recPlant.scale.set(1, 1.4, 1); scene.add(recPlant);

  // Lounge with sofa, coffee table and bookshelf (left side of the entrance)
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.2), new THREE.MeshStandardMaterial({color:0x2a2440, roughness:1}));
  rug.rotation.x = -Math.PI/2; rug.position.set(-5.4, .012, -1.9); scene.add(rug);
  const sofa = new THREE.Group();
  box(.9, .42, 2.6, fabric, 0, .21, 0, sofa); box(.25, .5, 2.6, fabric, .32, .62, 0, sofa);
  box(.9, .3, .22, fabric, 0, .52, 1.4, sofa); box(.9, .3, .22, fabric, 0, .52, -1.4, sofa);
  [-.6, .2, .9].forEach((z, k) => { const c = box(.18, .32, .4, k === 1 ? fabric2 : brass, .12, .6, z, sofa); c.rotation.x = .1; });
  sofa.position.set(-6.9, 0, -1.9); scene.add(sofa);
  const table = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .05, 32), darkWood); table.position.set(-5.4, .42, -1.9); scene.add(table);
  const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(.06, .12, .4, 12), brass); tLeg.position.set(-5.4, .2, -1.9); scene.add(tLeg);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(.045,.04,.09,12), whiteMat); cup.position.set(-5.2, .49, -2.1); scene.add(cup);
  const bookA = box(.22, .04, .3, new THREE.MeshStandardMaterial({color:0x6d6af8}), -5.55, .465, -1.7); bookA.rotation.y = .4;
  const armchair = new THREE.Group(); box(.8,.4,.8,fabric2,0,.2,0,armchair); box(.8,.5,.18,fabric2,0,.6,-.33,armchair); box(.16,.25,.8,fabric2,.36,.5,0,armchair); box(.16,.25,.8,fabric2,-.36,.5,0,armchair);
  armchair.position.set(-4.4, 0, .1); armchair.rotation.y = Math.PI + .5; scene.add(armchair);
  const flamp = new THREE.Group(); box(.04, 1.6, .04, brass, 0, .8, 0, flamp);
  const fShade = new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,.3,20,1,true), new THREE.MeshBasicMaterial({color:0xffe1b0, side:THREE.DoubleSide})); fShade.position.y = 1.65; flamp.add(fShade);
  flamp.position.set(-7.3, 0, -.2); scene.add(flamp);
  pendant(scene, -5.4, 0, -1.9, true);
  // bookshelf against the window
  const shelf = new THREE.Group();
  const SH_W = 3.2, SH_H = 2.3;
  box(.36, SH_H, .05, darkWood, 0, SH_H/2, -SH_W/2, shelf); box(.36, SH_H, .05, darkWood, 0, SH_H/2, SH_W/2, shelf);
  for(let r = 0; r <= 5; r++) box(.36, .04, SH_W, darkWood, 0, .02 + r*(SH_H/5) * .99, 0, shelf);
  const bookCols = [0x6d6af8,0x45dcf0,0xe8e4dc,0xb9a27a,0x8a3b4a,0x2f7d5a,0x1b1d3a,0xff7a59,0x5b4b6e];
  const bookGeo = new THREE.BoxGeometry(.26, 1, 1);
  const books = new THREE.InstancedMesh(bookGeo, new THREE.MeshStandardMaterial({roughness:.8}), 220);
  let bc = 0; const bo = new THREE.Object3D(), col = new THREE.Color();
  for(let r = 0; r < 5; r++){
    let z = -SH_W/2 + .08;
    while(z < SH_W/2 - .12 && bc < 220){
      const w = .04 + rnd()*.05, h = .26 + rnd()*.14;
      if(rnd() < .08){ z += .18; continue; }
      bo.position.set(.02, .04 + r*(SH_H/5)*.99 + h/2, z + w/2); bo.scale.set(1, h, w); bo.rotation.set(0,0,0); bo.updateMatrix();
      books.setMatrixAt(bc, bo.matrix); books.setColorAt(bc, col.setHex(bookCols[(rnd()*bookCols.length)|0])); bc++;
      z += w + .004;
    }
  }
  books.count = bc; shelf.add(books);
  shelf.position.set(-ROOM_W/2 + .3, 0, -5.6); scene.add(shelf);

  // Glass meeting room (left side, between two stations)
  const MR = {x0:-2.6, x1:-ROOM_W/2 + .02, z0:-45, z1:-63};
  const glassMat = new THREE.MeshStandardMaterial({color:0xaab8ff, transparent:true, opacity:.1, roughness:.05, metalness:.2, depthWrite:false, side:THREE.DoubleSide});
  const mullMat2 = new THREE.MeshStandardMaterial({color:0x15161d, metalness:.7, roughness:.35});
  const glassF = new THREE.Mesh(new THREE.PlaneGeometry(MR.z0 - MR.z1, ROOM_H), glassMat); glassF.rotation.y = Math.PI/2; glassF.position.set(MR.x0, ROOM_H/2, (MR.z0 + MR.z1)/2); scene.add(glassF);
  [MR.z0, MR.z1].forEach(z => { const g = new THREE.Mesh(new THREE.PlaneGeometry(MR.x0 - MR.x1, ROOM_H), glassMat); g.position.set((MR.x0 + MR.x1)/2, ROOM_H/2, z); scene.add(g); });
  for(let z = MR.z0; z >= MR.z1; z -= 3) box(.05, ROOM_H, .05, mullMat2, MR.x0, ROOM_H/2, z);
  box(.05, .05, MR.z0 - MR.z1, mullMat2, MR.x0, 1.0, (MR.z0 + MR.z1)/2);
  const frost = new THREE.Mesh(new THREE.PlaneGeometry(MR.z0 - MR.z1, .5), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.12, depthWrite:false, side:THREE.DoubleSide}));
  frost.rotation.y = Math.PI/2; frost.position.set(MR.x0 + .01, 1.25, (MR.z0 + MR.z1)/2); scene.add(frost);
  const mrLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .45), new THREE.MeshBasicMaterial({map:(() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0,0,512,128); g.fillStyle = '#eef0fa'; g.font = '600 52px "Space Grotesk", sans-serif'; g.textBaseline = 'middle'; g.fillText('Meeting Room', 20, 64);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })(), transparent:true, depthWrite:false}));
  mrLabel.rotation.y = Math.PI/2; mrLabel.position.set(MR.x0 + .03, 2.3, MR.z0 - 2); scene.add(mrLabel);
  const mt = new THREE.Group();
  box(1.3, .06, 6, whiteMat, 0, .76, 0, mt); box(.12, .72, .12, brass, 0, .37, -2.2, mt); box(.12, .72, .12, brass, 0, .37, 2.2, mt);
  for(let k = 0; k < 4; k++) [-1, 1].forEach(s => {
    const ch = new THREE.Group(); box(.5,.07,.5,chairMat,0,.48,0,ch); box(.5,.55,.06,chairMat,0,.8,-.24,ch);
    ch.position.set(s * 1.05, 0, -2.1 + k * 1.4); ch.rotation.y = s > 0 ? -Math.PI/2 : Math.PI/2; mt.add(ch);
  });
  mt.position.set((MR.x0 + MR.x1)/2, 0, (MR.z0 + MR.z1)/2); scene.add(mt);
  const linLamp = box(.12, .05, 5, new THREE.MeshBasicMaterial({color:0xfff0d8}), (MR.x0 + MR.x1)/2, 2.6, (MR.z0 + MR.z1)/2);
  for(const z of [-1.8, 1.8]) box(.008, ROOM_H - 2.6, .008, cordMat, (MR.x0 + MR.x1)/2, (ROOM_H + 2.6)/2, (MR.z0 + MR.z1)/2 + z);
  const mrPool = new THREE.Mesh(new THREE.PlaneGeometry(3, 7), poolMat); mrPool.rotation.x = -Math.PI/2; mrPool.position.set((MR.x0 + MR.x1)/2, .8, (MR.z0 + MR.z1)/2); if(!low) scene.add(mrPool);
  const mrScreen = monitor(2.2, 1.24, generic[2], .9); mrScreen.position.set(MR.x1 + .3, 1.9, (MR.z0 + MR.z1)/2); mrScreen.rotation.y = Math.PI/2;
  mrScreen.children.slice(2).forEach(o => o.visible = false); scene.add(mrScreen);
  const mrPlant = new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 1), plantMat); mrPlant.position.set(MR.x0 - .6, .9, MR.z1 + .8); mrPlant.scale.set(1,1.5,1); scene.add(mrPlant);
  const mrPot = new THREE.Mesh(new THREE.CylinderGeometry(.22,.18,.5,16), potMat); mrPot.position.set(MR.x0 - .6, .25, MR.z1 + .8); scene.add(mrPot);

  // a few tall plants along the aisle edge, like in a real office
  [[-2.15, -9], [2.15, -27], [-2.15, -82], [2.15, -100], [-2.15, -118]].forEach(([x, z]) => {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(.2,.16,.45,16), potMat); pot.position.set(x, .23, z); scene.add(pot);
    const pl = new THREE.Mesh(new THREE.IcosahedronGeometry(.4, 1), plantMat); pl.position.set(x, .95, z); pl.scale.set(.9, 1.5, .9); scene.add(pl);
  });


  /* ---------- MI Studio logo, spinning in the middle of the entrance ---------- */
  const poly = pts => { const s = new THREE.Shape(); pts.forEach(([x,y],i) => i ? s.lineTo(x,y) : s.moveTo(x,y)); s.closePath(); return s; };
  const rrect = (w,h,r) => { const s = new THREE.Shape(), x = -w/2, y = -h/2;
    s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y); return s; };
  const logo = new THREE.Group(), logoSpin = new THREE.Group(); logo.add(logoSpin);
  const ex = {depth:.24, bevelEnabled:true, bevelThickness:.035, bevelSize:.025, bevelSegments:3, curveSegments:12};
  const letterGeo = new THREE.ExtrudeGeometry([
    poly([[0,0],[.22,0],[.22,.6],[.5,.26],[.78,.6],[.78,0],[1,0],[1,1],[.8,1],[.5,.62],[.2,1],[0,1]]),
    poly([[1.18,0],[1.4,0],[1.4,.7],[1.18,.7]])
  ], ex); letterGeo.translate(-.7, -.5, -.12);
  const dotGeo = new THREE.ExtrudeGeometry(poly([[1.18,.8],[1.4,.8],[1.4,1],[1.18,1]]), ex); dotGeo.translate(-.7, -.5, -.12);
  const frameShape = rrect(2.2, 1.7, .32); frameShape.holes.push(rrect(2.04, 1.54, .25));
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {depth:.1, bevelEnabled:false, curveSegments:16}); frameGeo.translate(0, 0, -.05);
  const letters = new THREE.Mesh(letterGeo, new THREE.MeshStandardMaterial({color:0xeef0fa, metalness:.55, roughness:.22, emissive:0x2b2990, emissiveIntensity:.55}));
  const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({color:0x45dcf0}));
  const frameM = new THREE.Mesh(frameGeo, new THREE.MeshBasicMaterial({color:0x6d6af8}));
  logoSpin.add(letters, dot, frameM);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.55, .012, 8, 120), new THREE.MeshBasicMaterial({color:0x45dcf0, transparent:true, opacity:.8}));
  orbit.rotation.x = Math.PI/2.4; logo.add(orbit);
  const orbit2 = new THREE.Mesh(new THREE.TorusGeometry(1.75, .008, 8, 120), new THREE.MeshBasicMaterial({color:0x6d6af8, transparent:true, opacity:.6}));
  orbit2.rotation.set(Math.PI/2.1, .5, 0); logo.add(orbit2);
  const logoLight = new THREE.PointLight(0x9a97ff, 2.2, 7, 2); logoLight.position.set(0, .2, 1.6); logo.add(logoLight);
  const logoLight2 = new THREE.PointLight(0x45dcf0, 1.2, 6, 2); logoLight2.position.set(0, .2, -1.6); logo.add(logoLight2);
  (function(){
    const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const g = c.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#eef0fa';
    g.font = '600 92px "Space Grotesk", sans-serif'; if('letterSpacing' in g) g.letterSpacing = '38px';
    g.shadowColor = '#6d6af8'; g.shadowBlur = 24; g.fillText('STUDIO', 512 + 19, 84);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    const word = new THREE.Sprite(new THREE.SpriteMaterial({map:t, transparent:true, depthWrite:false}));
    word.scale.set(2.1, .33, 1); word.position.set(0, -1.32, 0); logo.add(word);
  })();
  // centre of the studio, visible from the entrance like a light at the end of the hall
  const LOGO_Y = 3.15;
  logo.position.set(0, LOGO_Y, -30); logo.scale.setScalar(.85);
  logo.traverse(o => { if(o.material) o.material.fog = false; });
  scene.add(logo);
  const logoMeshes = [letters, dot, frameM];
  let spinBoost = 0;









  /* ---------- brand walls: MI wallpaper, mounted 3D logos and framed logo prints ---------- */
  const MI_PATH = new Path2D('M12 40V12h6l8 11 8-11h6v28h-6V22l-8 10.5L18 22v18z');
  function drawMark(g, x, y, s, fg, frame, dot, lw){
    g.save(); g.translate(x, y); g.scale(s, s);
    g.lineWidth = (lw || 3) / 1; g.strokeStyle = frame;
    g.beginPath(); if(g.roundRect) g.roundRect(1.5, 1.5, 61, 49, 10); else g.rect(1.5, 1.5, 61, 49); g.stroke();
    g.fillStyle = fg; g.fill(MI_PATH); g.fillRect(45, 20, 6, 20);
    g.fillStyle = dot; g.fillRect(45, 12, 6, 5.5);
    g.restore();
  }
  const wallpaperTex = (() => {
    const W = 2048, H = 540, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0d0f20'); bg.addColorStop(1, '#090a15'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for(let row = 0, y = 18; y < H; y += 70, row++)
      for(let x = (row % 2) * 60 + 14; x < W; x += 120)
        drawMark(g, x, y, .62, 'rgba(140,140,255,.07)', 'rgba(109,106,248,.10)', 'rgba(69,220,240,.12)', 2);
    const glow = g.createRadialGradient(W/2, H*.45, 0, W/2, H*.45, H*.8); glow.addColorStop(0, 'rgba(109,106,248,.28)'); glow.addColorStop(1, 'rgba(109,106,248,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(185,162,122,.55)'; g.fillRect(0, 26, W, 3); g.fillRect(0, H - 30, W, 3);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  })();
  function posterTex(kind){
    const W = 480, H = 640, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    if(kind === 0){
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#667eea'); gr.addColorStop(1, '#764ba2'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      drawMark(g, 60, 150, 5.6, 'rgba(255,255,255,.95)', 'rgba(255,255,255,.95)', '#45dcf0', 2.4);
      g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '600 26px "Space Grotesk", sans-serif'; g.fillText('MI STUDIO', 60, 560);
      g.font = '400 18px "JetBrains Mono", monospace'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText('FORM FOLLOWS FEELING', 60, 592);
    } else if(kind === 1){
      g.fillStyle = '#0b0d1a'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#eef0fa'; g.save(); g.translate(40, 120); g.scale(6.2, 6.2); g.fill(MI_PATH); g.fillRect(45, 20, 6, 20); g.fillStyle = '#45dcf0'; g.fillRect(45, 12, 6, 5.5); g.restore();
      g.strokeStyle = '#6d6af8'; g.lineWidth = 3; g.strokeRect(24, 24, W - 48, H - 48);
      g.fillStyle = '#45dcf0'; g.font = '500 22px "JetBrains Mono", monospace'; g.fillText('DESIGN · CODE · UX', 60, 580);
    } else {
      g.fillStyle = '#10122a'; g.fillRect(0, 0, W, H);
      const cols = [['#eef0fa','#6d6af8','#45dcf0'], ['#45dcf0','#45dcf0','#eef0fa'], ['#6d6af8','#eef0fa','#6d6af8']];
      for(let r = 0; r < 6; r++) for(let k = 0; k < 4; k++){ const [f, fr, d] = cols[(r + k) % 3]; drawMark(g, 34 + k*106, 40 + r*96, 1.35, f, fr, d, 3); }
      g.fillStyle = 'rgba(16,18,42,.85)'; g.fillRect(0, H - 70, W, 70);
      g.fillStyle = '#eef0fa'; g.font = '600 22px "Space Grotesk", sans-serif'; g.fillText('MI — SYSTEM', 34, H - 28);
    }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  const posters = [0, 1, 2].map(k => new THREE.MeshBasicMaterial({map:posterTex(k)}));
  const printFrameMat = new THREE.MeshStandardMaterial({color:0x111218, metalness:.6, roughness:.35});
  const wallLogoLetters = new THREE.MeshStandardMaterial({color:0xeef0fa, metalness:.6, roughness:.25, emissive:0x2b2990, emissiveIntensity:.7});
  const wallLogoFrame = new THREE.MeshBasicMaterial({color:0x6d6af8});
  const wallLogoDot = new THREE.MeshBasicMaterial({color:0x45dcf0});
  const capMat = new THREE.MeshBasicMaterial({map:sTex, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false});
  let pk = 0;
  brandWalls.forEach(({side, zc, len, decor}) => {
    const wx = side * (ROOM_W/2 - .02);
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(len, ROOM_H), new THREE.MeshStandardMaterial({map:wallpaperTex, roughness:.85, emissive:0xffffff, emissiveMap:wallpaperTex, emissiveIntensity:.35}));
    paper.rotation.y = -side * Math.PI/2; paper.position.set(wx, ROOM_H/2, zc); scene.add(paper);
    if(!decor) return;
    const rot = -side * Math.PI/2, wxi = side * (ROOM_W/2 - .1);
    // mounted 3D logo, same design as the big one in the middle
    const wl = new THREE.Group();
    wl.add(new THREE.Mesh(letterGeo, wallLogoLetters), new THREE.Mesh(dotGeo, wallLogoDot), new THREE.Mesh(frameGeo, wallLogoFrame));
    wl.scale.setScalar(.62); wl.position.set(wxi - side*.08, 2.45, zc); wl.rotation.y = rot; scene.add(wl);
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .6), capMat);
    cap.position.set(wxi - side*.02, 1.55, zc); cap.rotation.y = rot; scene.add(cap);
    // two framed logo prints
    if(decor === 'full') [-4.6, 4.6].forEach(dz => {
      const f = new THREE.Group();
      f.add(new THREE.Mesh(new THREE.BoxGeometry(1.66, 2.16, .05), printFrameMat));
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), posters[pk++ % 3]); p.position.z = .03; f.add(p);
      f.position.set(wxi, 2.15, zc + dz); f.rotation.y = rot; scene.add(f);
      const sp = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, 1.2), new THREE.MeshBasicMaterial({color:0xfff0d8}));
      sp.position.set(wxi - side*.25, 3.45, zc + dz); scene.add(sp);
    });
  });

  /* no plants */
  const plantParts = [];
  scene.traverse(o => { if(o.material === plantMat || o.material === potMat) plantParts.push(o); });
  plantParts.forEach(o => o.parent && o.parent.remove(o));

  /* photo wall: frames for Mohamad's own photos (img/foto1.jpg ... img/foto3.jpg replace the placeholders automatically) */
  function photoPlaceholder(name){
    const c = document.createElement('canvas'); c.width = 400; c.height = 500; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0,0,400,500); gr.addColorStop(0,'#667eea'); gr.addColorStop(1,'#764ba2'); g.fillStyle = gr; g.fillRect(0,0,400,500);
    g.setLineDash([14,10]); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 4; g.strokeRect(24,24,352,452);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '700 40px "Space Grotesk", sans-serif'; g.fillText('Dein Foto', 200, 240);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '400 20px "JetBrains Mono", monospace'; g.fillText(name, 200, 285);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  const frameMat = new THREE.MeshStandardMaterial({color:0x1a1c2e, roughness:.4, metalness:.6});
  ['img/foto1.jpg','img/foto2.jpg','img/foto3.jpg'].forEach((name, k) => {
    const g = new THREE.Group();
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.66, .05), frameMat); g.add(fr);
    const mat = new THREE.MeshBasicMaterial({map:photoPlaceholder(name)});
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), mat); pic.position.z = .03; g.add(pic);
    const glow = new THREE.PointLight(0xffe2b0, .5, 2.5, 2); glow.position.set(0, .2, .8); g.add(glow);
    g.position.set(ROOM_W/2 - .1, 2.15, 2 - k*4); g.rotation.y = -Math.PI/2;
    scene.add(g);
    new THREE.TextureLoader().load(name, tex => { tex.encoding = THREE.sRGBEncoding; mat.map = tex; mat.needsUpdate = true; }, undefined, () => {});
  });

  /* every monitor permanently shows its own section of the website.
     Each iframe gets ONE flat perspective transform (matrix3d homography) that maps it onto the
     screen's four projected corners. CSS3DRenderer's nested preserve-3d camera looked the same,
     but Chrome's hit-testing never reached the iframes, so links on the screens were not
     clickable (clicks fell through to the page behind). */
  const cssLayer = document.getElementById('css3d');
  const corner = [[-PXW/2, PXH/2], [PXW/2, PXH/2], [PXW/2, -PXH/2], [-PXW/2, -PXH/2]];   // TL TR BR BL
  const _v = new THREE.Vector3(), quad = [[0,0],[0,0],[0,0],[0,0]];
  for(let i=1;i<N;i++){
    const s = makeSite(stops[i].dataset.hash);
    const anchor = new THREE.Object3D();          // where the screen sits in the room
    anchor.scale.setScalar(SW / PXW);
    anchor.position.z = .0235;
    heroes[i].userData.mm.add(anchor);
    Object.assign(s.wrap.style, {position:'absolute', left:'0', top:'0', transformOrigin:'0 0', willChange:'transform'});
    cssLayer.appendChild(s.wrap);
    s.anchor = anchor; sites[i] = s;
  }
  // matrix3d that maps the w×h element rectangle onto quad q (Heckbert's square-to-quad)
  function homography(q, w, h){
    const [x0,y0] = q[0], [x1,y1] = q[1], [x2,y2] = q[2], [x3,y3] = q[3];
    const dx1 = x1-x2, dx2 = x3-x2, dx3 = x0-x1+x2-x3, dy1 = y1-y2, dy2 = y3-y2, dy3 = y0-y1+y2-y3;
    let g = 0, k = 0;
    if(Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9){
      const det = dx1*dy2 - dx2*dy1;
      g = (dx3*dy2 - dx2*dy3) / det; k = (dx1*dy3 - dx3*dy1) / det;
    }
    const a = x1-x0+g*x1, b = x3-x0+k*x3, d = y1-y0+g*y1, e = y3-y0+k*y3;
    return `matrix3d(${a/w},${d/w},0,${g/w},${b/h},${e/h},0,${k/h},0,0,1,0,${x0},${y0},0,1)`;
  }
  function renderCss(){
    const W = innerWidth, H = innerHeight;
    camera.updateMatrixWorld();
    const order = [];
    for(let i=1;i<N;i++){
      const s = sites[i];
      if(s.op <= 0){ continue; }
      s.anchor.updateWorldMatrix(true, false);
      let ok = true, depth = 0;
      for(let c=0;c<4;c++){
        _v.set(corner[c][0], corner[c][1], 0).applyMatrix4(s.anchor.matrixWorld);
        _v.applyMatrix4(camera.matrixWorldInverse);
        if(_v.z > -camera.near){ ok = false; break; }           // corner behind the camera
        depth += -_v.z;
        _v.applyMatrix4(camera.projectionMatrix);
        quad[c][0] = (_v.x + 1) / 2 * W; quad[c][1] = (1 - _v.y) / 2 * H;
      }
      if(!ok){ s.wrap.style.visibility = 'hidden'; continue; }
      s.wrap.style.visibility = 'visible';
      if(s.sharp){
        // parked in front of this monitor: show the site flat at real pixel size, so text is crisp (no 3D scaling)
        const xs = quad.map(q => q[0]), ys = quad.map(q => q[1]);
        let x0 = Math.round(Math.min(...xs)), y0 = Math.round(Math.min(...ys));
        let w = Math.round(Math.max(...xs)) - x0, h = Math.round(Math.max(...ys)) - y0;
        if(innerWidth < 820){   // phones: open the screen large enough to read
          w = innerWidth - 24; h = Math.round(Math.min(innerHeight * .68, innerHeight - 150)); x0 = 12; y0 = Math.round((innerHeight - h) / 2);
        }
        if(!s.flat || Math.abs(w - s.fw) > 2 || Math.abs(h - s.fh) > 2){
          s.wrap.style.width = w + 'px'; s.wrap.style.height = h + 'px'; s.fw = w; s.fh = h; s.flat = true;
        }
        s.wrap.style.transform = `translate(${x0}px,${y0}px)`;
      } else {
        if(s.flat){ s.wrap.style.width = PXW + 'px'; s.wrap.style.height = PXH + 'px'; s.flat = false; }
        s.wrap.style.transform = homography(quad, PXW, PXH);
      }
      order.push([depth, s]);
    }
    order.sort((p, q) => q[0] - p[0]).forEach(([, s], n) => { s.wrap.style.zIndex = n + 1; });   // nearer on top
  }
  const camFwd = new THREE.Vector3(), toScr = new THREE.Vector3();

  let composer = null, bloom = null;
  // automatic quality: if the device cannot hold a smooth frame rate, render fewer pixels (and more again when it can)
  const perf = {n:0, t:0, lastDrop:-99};
  function setPR(v){
    if(Math.abs(v - PR) < .01) return; PR = v;
    renderer.setPixelRatio(PR);
    if(composer){ if(composer.setPixelRatio) composer.setPixelRatio(PR); composer.setSize(innerWidth, innerHeight); }
  }
  function adaptQuality(dt){
    if(!ldDone || document.hidden) return;
    perf.n++; perf.t += dt;
    if(perf.t < 1.5) return;
    const fps = perf.n / perf.t; perf.n = 0; perf.t = 0;
    if(fps < 40 && PR > .75){ setPR(Math.max(.75, PR - .25)); perf.lastDrop = time; }
    else if(fps > 57 && PR < PR_MAX && time - perf.lastDrop > 8) setPR(Math.min(PR_MAX, PR + .25));
  }
  if(THREE.EffectComposer && THREE.UnrealBloomPass){
    try {
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene, camera));
      bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .5, .5, .6);
      composer.addPass(bloom);
    } catch(e){ composer = null; }
  }

  /* ---------- sunset / night mode ---------- */
  let mode = 'night';
  const citySunset = [];
  const modeBtn = document.getElementById('modeBtn');
  function setMode(m){
    mode = m;
    CITIES.forEach(([key], i) => {
      if(cityReal[i]) return;                       // a real photo stays as it is
      if(m === 'sunset' && !citySunset[i]) citySunset[i] = skyline(key, 'sunset');
      cityMats[i].map = m === 'sunset' ? citySunset[i] : cityNight[i]; cityMats[i].needsUpdate = true;
    });
    const sky = m === 'sunset' ? 0x1d1424 : 0x06070f;
    scene.fog.color.setHex(sky); renderer.setClearColor(sky);
    hemi.color.setHex(m === 'sunset' ? 0xffd2b0 : 0xffe4c4); hemi.intensity = m === 'sunset' ? 1.0 : .62;
    dl.color.setHex(m === 'sunset' ? 0xff9a6a : 0xb8c0ff); dl.intensity = m === 'sunset' ? .75 : .35;
    modeBtn.classList.toggle('on', m === 'sunset');
    modeBtn.setAttribute('aria-pressed', m === 'sunset');
    modeBtn.querySelector('span').textContent = m === 'sunset' ? 'Nacht' : 'Abend';
    modeBtn.setAttribute('aria-label', m === 'sunset' ? 'Zur Nacht wechseln' : 'Zum Sonnenuntergang wechseln');
  }
  modeBtn.addEventListener('click', () => setMode(mode === 'night' ? 'sunset' : 'night'));

  /* ---------- guided tour ---------- */
  let touring = false, tourWait = 0;
  const tourBtn = document.getElementById('tourBtn');
  function setTourUi(on){
    tourBtn.classList.toggle('on', on); tourBtn.setAttribute('aria-pressed', on);
    tourBtn.querySelector('span').textContent = on ? 'Stopp' : 'Tour';
  }
  function stopTour(){ if(!touring) return; touring = false; setTourUi(false); }
  function startTour(){
    touring = true; tourWait = 0; setTourUi(true);
    const at = Math.round(stationProgress());
    goStation(at >= N - 1 ? 0 : at + 1, true);
  }
  tourBtn.addEventListener('click', e => { e.stopPropagation(); touring ? stopTour() : startTour(); });
  ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, e => {
    if(touring && !(e.target && e.target.closest && e.target.closest('#tourBtn'))) stopTour();
  }, {passive:true}));
  function tourStep(dt, idx, park, target){
    if(!touring) return;
    if(park > .97 && Math.abs(target - idx) < .001){
      tourWait += dt;
      if(tourWait > (idx === 0 ? 1 : 2.5)){ tourWait = 0; if(idx >= N - 1) stopTour(); else goStation(idx + 1, true); }   // kurze Tour: 2,5 s pro Bildschirm
    } else tourWait = 0;
  }

  /* ---------- optional sound (generated in the browser, no audio files) ---------- */
  let audio = null, soundOn = false;
  const soundBtn = document.getElementById('soundBtn');
  function initAudio(){
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
    const ctx = new AC(), master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    // quiet room tone: soft filtered brown noise
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
    for(let i = 0; i < len; i++){ const w = Math.random()*2 - 1; last = (last + .02*w) / 1.02; d[i] = last * 3.2; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const ng = ctx.createGain(); ng.gain.value = .3;
    src.connect(lp); lp.connect(ng); ng.connect(master); src.start();
    // warm pad
    [110, 164.81, 220].forEach((f, k) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; o.detune.value = (k - 1) * 5; og.gain.value = .012; o.connect(og); og.connect(master); o.start(); });
    // short click buffer for distant keyboards
    const cl = ctx.createBuffer(1, ctx.sampleRate * .02, ctx.sampleRate), cd = cl.getChannelData(0);
    for(let i = 0; i < cd.length; i++) cd[i] = (Math.random()*2 - 1) * Math.pow(1 - i / cd.length, 6);
    return {ctx, master, cl};
  }
  function tick(){
    if(!audio || !soundOn) return;
    const {ctx, master, cl} = audio, t0a = ctx.currentTime, n = 3 + (Math.random()*6 | 0);
    for(let k = 0; k < n; k++){
      const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = cl; hp.type = 'highpass'; hp.frequency.value = 1800 + Math.random()*1200; g.gain.value = .05 + Math.random()*.04;
      s.connect(hp); hp.connect(g); g.connect(master); s.start(t0a + k * (.08 + Math.random()*.1));
    }
  }
  setInterval(() => { if(Math.random() < .6) tick(); }, 2600);
  function blip(){
    if(!audio || !soundOn) return;
    const {ctx, master} = audio, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(980, t + .12);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.1, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + .35);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + .4);
  }
  soundBtn.addEventListener('click', () => {
    if(!audio) audio = initAudio();
    if(!audio) return;
    soundOn = !soundOn;
    audio.ctx.resume();
    audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);
    audio.master.gain.linearRampToValueAtTime(soundOn ? .7 : 0, audio.ctx.currentTime + .6);
    soundBtn.classList.toggle('on', soundOn); soundBtn.setAttribute('aria-pressed', soundOn);
    soundBtn.querySelector('span').textContent = soundOn ? 'Ton an' : 'Ton';
    soundBtn.setAttribute('aria-label', soundOn ? 'Ton ausschalten' : 'Ton einschalten');
  });


  /* ---------- entrance: a glass sliding door with the welcome text ----------
     The studio starts outside. Scroll, click or press a key: the doors slide open and the camera walks in. */
  const DOOR_W = 3.2, DOOR_H = 3.0, VEST_W = 7.4, VEST_H = 3.7, VEST_L = 11;
  const skipDoor = reduce || /^#s[1-9]/.test(location.hash);
  let doorState = skipDoor ? 'open' : 'closed', doorT = 0, doorThen = null;
  {
    const wallMat = new THREE.MeshStandardMaterial({color:0x05060c, roughness:.9, metalness:.1});
    const zc = Z0 + VEST_L/2;
    // vestibule: floor, ceiling, side walls
    const vf = new THREE.Mesh(new THREE.PlaneGeometry(VEST_W, VEST_L), new THREE.MeshStandardMaterial({color:0x04050a, roughness:.4, metalness:.4}));
    vf.rotation.x = -Math.PI/2; vf.position.set(0, .001, zc); scene.add(vf);
    const vc = new THREE.Mesh(new THREE.PlaneGeometry(VEST_W, VEST_L), new THREE.MeshBasicMaterial({color:0x040409}));
    vc.rotation.x = Math.PI/2; vc.position.set(0, VEST_H, zc); scene.add(vc);
    [-1, 1].forEach(side => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(VEST_L, VEST_H), wallMat);
      w.rotation.y = -side * Math.PI/2; w.position.set(side * VEST_W/2, VEST_H/2, zc); scene.add(w);
      // thin light lines along the walls and the ceiling lead to the door
      const ln = new THREE.Mesh(new THREE.BoxGeometry(.03, .03, VEST_L), new THREE.MeshBasicMaterial({color: side < 0 ? 0x6d6af8 : 0x45dcf0}));
      ln.position.set(side * (VEST_W/2 - .02), .45, zc); scene.add(ln);
    });
    // front wall around the doorway
    const side = (VEST_W - DOOR_W)/2, lint = VEST_H - DOOR_H;
    [[-(DOOR_W/2 + side/2), side, VEST_H, VEST_H/2], [DOOR_W/2 + side/2, side, VEST_H, VEST_H/2], [0, DOOR_W, lint, DOOR_H + lint/2]].forEach(([x, w, h, y]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .24), wallMat); b.position.set(x, y, Z0); scene.add(b);
    });
    // glowing door frame
    const fm = new THREE.MeshBasicMaterial({color:0x45dcf0});
    [[-DOOR_W/2 - .03, .04, DOOR_H, DOOR_H/2], [DOOR_W/2 + .03, .04, DOOR_H, DOOR_H/2], [0, DOOR_W + .1, .04, DOOR_H + .02]].forEach(([x, w, h, y]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .05), fm); b.position.set(x, y, Z0 + .13); scene.add(b);
    });
    // sign above the door
    const sc = document.createElement('canvas'); sc.width = 1024; sc.height = 160;
    const sg = sc.getContext('2d');
    const signTex = new THREE.CanvasTexture(sc); signTex.encoding = THREE.sRGBEncoding; signTex.anisotropy = 4;
    const drawSign = () => {
      sg.clearRect(0, 0, 1024, 160);
      sg.font = '600 46px "JetBrains Mono", ui-monospace, monospace'; sg.textAlign = 'center'; sg.textBaseline = 'middle';
      sg.shadowColor = 'rgba(109,106,248,.9)'; sg.shadowBlur = 24; sg.fillStyle = '#eef0fa';
      sg.fillText('M I   S T U D I O', 512, 80); signTex.needsUpdate = true;
    };
    drawSign();
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .5), new THREE.MeshBasicMaterial({map:signTex, transparent:true}));
    sign.position.set(0, DOOR_H + lint/2, Z0 + .13); scene.add(sign);
    // the welcome text lives on the two glass doors; each door shows one half of the same picture
    const dc = document.createElement('canvas'); dc.width = 2048; dc.height = Math.round(2048 * DOOR_H / DOOR_W);
    const dg = dc.getContext('2d'), DW = dc.width, DH = dc.height;
    const doorTex = new THREE.CanvasTexture(dc); doorTex.encoding = THREE.sRGBEncoding; doorTex.anisotropy = 8;
    function wrap(text, maxW){ const words = text.split(' '), lines = []; let l = '';
      words.forEach(w => { const t = l ? l + ' ' + w : w; if(dg.measureText(t).width > maxW && l){ lines.push(l); l = w; } else l = t; }); if(l) lines.push(l); return lines; }
    const drawDoor = () => {
      dg.clearRect(0, 0, DW, DH);
      // frosted glass
      let g = dg.createLinearGradient(0, 0, 0, DH);
      g.addColorStop(0, 'rgba(14,15,34,.9)'); g.addColorStop(.5, 'rgba(8,9,22,.94)'); g.addColorStop(1, 'rgba(14,15,34,.9)');
      dg.fillStyle = g; dg.fillRect(0, 0, DW, DH);
      g = dg.createRadialGradient(DW/2, DH*.42, 0, DW/2, DH*.42, DW*.6);
      g.addColorStop(0, 'rgba(109,106,248,.22)'); g.addColorStop(1, 'rgba(109,106,248,0)');
      dg.fillStyle = g; dg.fillRect(0, 0, DW, DH);
      // door edges and the gap in the middle
      dg.strokeStyle = 'rgba(200,205,255,.35)'; dg.lineWidth = 6;
      dg.strokeRect(3, 3, DW/2 - 6, DH - 6); dg.strokeRect(DW/2 + 3, 3, DW/2 - 6, DH - 6);
      // handles
      dg.fillStyle = 'rgba(220,224,255,.75)';
      dg.fillRect(DW/2 - 70, DH*.84, 14, DH*.12); dg.fillRect(DW/2 + 56, DH*.84, 14, DH*.12);
      // logo
      dg.save(); const L = 230; dg.translate(DW/2 - L/2, DH*.08); dg.scale(L/64, L/64);
      dg.shadowColor = 'rgba(109,106,248,.9)'; dg.shadowBlur = 18;
      dg.lineWidth = 3; dg.strokeStyle = '#6d6af8'; dg.beginPath(); if(dg.roundRect) dg.roundRect(1.5, 1.5, 61, 49, 10); else dg.rect(1.5, 1.5, 61, 49); dg.stroke();
      dg.fillStyle = '#eef0fa'; dg.fill(new Path2D('M12 40V12h6l8 11 8-11h6v28h-6V22l-8 10.5L18 22v18z')); dg.fillRect(45, 20, 6, 20);
      dg.fillStyle = '#45dcf0'; dg.fillRect(45, 12, 6, 5.5); dg.restore();
      dg.textAlign = 'center'; dg.textBaseline = 'alphabetic';
      // kicker
      dg.font = '500 46px "JetBrains Mono", ui-monospace, monospace'; dg.fillStyle = '#45dcf0';
      dg.fillText('MI STUDIO · MEDIENINFORMATIK · UX/UI DESIGN', DW/2, DH*.355);
      // headline: gradient + outlined "Studio", as on the website
      dg.font = '700 190px "Space Grotesk", system-ui, sans-serif';
      g = dg.createLinearGradient(DW*.12, 0, DW*.88, 0);
      g.addColorStop(0, '#d9d7ff'); g.addColorStop(.35, '#8f8cff'); g.addColorStop(.6, '#6d6af8'); g.addColorStop(1, '#45dcf0');
      dg.fillStyle = g; dg.fillText('Willkommen in', DW/2, DH*.5);
      dg.fillText('meinem', DW/2 - 250, DH*.5 + 190);
      dg.lineWidth = 5; dg.strokeStyle = '#45dcf0'; dg.shadowColor = 'rgba(69,220,240,.6)'; dg.shadowBlur = 20;
      dg.textAlign = 'left'; dg.strokeText('Studio', DW/2 - 250 + dg.measureText('meinem').width/2 + 40, DH*.5 + 190);
      dg.shadowBlur = 0; dg.textAlign = 'center';
      // text
      dg.font = '400 58px Inter, system-ui, sans-serif'; dg.fillStyle = '#d4d8ee';
      wrap('Ich bin Mohamad Issa. Gehen Sie durch mein Studio: Jeder Bildschirm zeigt einen Teil meiner Website, und alles darauf ist klickbar.', DW*.72)
        .forEach((l, i) => dg.fillText(l, DW/2, DH*.75 + i * 78));
      doorTex.needsUpdate = true;
    };
    drawDoor();
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawDoor(); drawSign(); });
    const doorMat = new THREE.MeshBasicMaterial({map:doorTex, transparent:true, side:THREE.DoubleSide, depthWrite:false});
    const half = u0 => { const g = new THREE.PlaneGeometry(DOOR_W/2, DOOR_H); const uv = g.attributes.uv;
      for(let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * .5); uv.needsUpdate = true; return g; };
    var doorL = new THREE.Mesh(half(0), doorMat), doorR = new THREE.Mesh(half(.5), doorMat);
    doorL.position.set(-DOOR_W/4, DOOR_H/2, Z0 + .16); doorR.position.set(DOOR_W/4, DOOR_H/2, Z0 + .16);
    scene.add(doorL, doorR);
    const runway = new THREE.Mesh(new THREE.PlaneGeometry(.025, VEST_L - .3), new THREE.MeshBasicMaterial({color:0x6d6af8, transparent:true, opacity:.35}));
    runway.rotation.x = -Math.PI/2; runway.position.set(0, .004, Z0 + VEST_L/2 + .15); scene.add(runway);
    const porch = new THREE.PointLight(0x8f8cff, .7, 7, 2); porch.position.set(0, 3.1, Z0 + 2.2); scene.add(porch);
    if(doorState === 'open'){ doorL.position.x = -DOOR_W/4 - DOOR_W/2 - .02; doorR.position.x = DOOR_W/4 + DOOR_W/2 + .02; }
  }
  const doorOutside = new THREE.Vector3(), doorLook = new THREE.Vector3(0, 1.3, Z0);
  function outsideDistance(){
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    return Math.min(VEST_L - .6, Math.max(4.4, (DOOR_W + .9) / (2 * t * camera.aspect), (DOOR_H + 2.3) / (2 * t)));
  }
  function openDoor(then){
    if(doorState !== 'closed'){ if(then) then(); return; }
    doorState = 'opening'; doorT = 0; doorThen = then || null;
    document.documentElement.classList.remove('door'); document.documentElement.classList.add('door-walk');
    blip();
  }
  if(doorState === 'closed'){
    document.documentElement.classList.add('door', 'door-used');
    if('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollTo(0, 0);
    const opener = e => {
      if(doorState !== 'closed') return;
      if(e.type === 'keydown' && !['ArrowDown', 'PageDown', ' ', 'Enter', 'Spacebar'].includes(e.key)) return;
      if(e.type === 'click' && e.target.closest && e.target.closest('.hud, .prog, a, button:not(#doorBtn)')) return;
      if(e.cancelable && e.type !== 'click') e.preventDefault();
      if(e.type === 'click') e.stopPropagation();   // the first click only opens the door
      openDoor();
    };
    addEventListener('wheel', opener, {passive:false});
    addEventListener('touchmove', opener, {passive:false});
    addEventListener('keydown', opener);
    addEventListener('click', opener, true);
    tourBtn.addEventListener('click', e => { if(doorState === 'closed'){ e.stopImmediatePropagation(); openDoor(() => startTour()); } }, true);
  }

  /* ---------- camera + loop ---------- */
  let cur = 0, mx = 0, my = 0, smx = 0, smy = 0, t0 = performance.now(), time = 0;
  addEventListener('pointermove', e => { mx = e.clientX/innerWidth - .5; my = e.clientY/innerHeight - .5; }, {passive:true});
  addEventListener('resize', () => {
    camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if(composer) composer.setSize(innerWidth, innerHeight);
  });
  let zoomT = 0;
  const Cfar = new THREE.Vector3();
  const A = new THREE.Vector3(), C = new THREE.Vector3(), P = new THREE.Vector3(), LA = new THREE.Vector3(), L = new THREE.Vector3(), M = new THREE.Vector3();
  const ease = t => t*t*(3-2*t);
  function fitDistance(){
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const usableH = PORTRAIT ? .8 : .86, usableW = .95;
    return Math.max((SH/usableH)/(2*t), (SW/usableW)/(2*t*camera.aspect));
  }

  /* clickable monitors + logo */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pickables = [];
  heroes.forEach((h,i) => { if(h){ h.userData.screen.userData.station = i; pickables.push(h.userData.screen); } });
  logoMeshes.forEach(m => { m.userData.logo = true; pickables.push(m); });
  const onUi = e => e.target && e.target.closest && e.target.closest('a,button,.hud,.prog');
  function pick(e){
    ndc.set(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    return hit ? hit.object : null;
  }
  let hoverT = 0;
  addEventListener('pointermove', e => {
    const n = performance.now(); if(n - hoverT < 60) return; hoverT = n;
    if(onUi(e)){ document.body.style.cursor = ''; return; }
    const o = pick(e);
    document.body.style.cursor = o && (o.userData.logo || o.userData.station !== Math.round(cur)) ? 'pointer' : '';
  }, {passive:true});
  addEventListener('click', e => {
    if(onUi(e)) return;
    const o = pick(e); if(!o) return;
    if(o.userData.logo){ spinBoost = 14; return; }
    const i = o.userData.station;
    if(i != null && i !== Math.round(cur)) goStation(i);
  });

  function frame(now){
    const rawDt = (now - t0)/1000;
    const dt = Math.min(.05, rawDt); t0 = now; if(!reduce) time += dt;
    if(rawDt < .5) adaptQuality(rawDt);
    const target = stationProgress();
    cur += (target - cur) * (reduce ? 1 : 1 - Math.pow(touring ? .003 : .09, dt));   // ruhig beim Scrollen, schnell während der Tour
    smx += (mx - smx) * .05; smy += (my - smy) * .05;

    const idx = Math.round(cur);
    const pr = Math.max(0, 1 - Math.abs(cur - idx) / .55);
    const park = pr * pr * pr * (pr * (pr * 6 - 15) + 10);   // smootherstep: sanft anfahren, sanft ankommen
    const dolly = park;
    updateHud(cur, park > .95);
    tourStep(dt, idx, park, target);
    const walkZ = Z0 - 6 - cur*GAP;
    const step = reduce ? 0 : Math.abs(Math.sin(walkZ * 1.6)) * .035 * (1 - park);
    A.set(smx*.5, 1.65 + step - smy*.15, walkZ);
    LA.set(smx*1.5, 1.45 - smy*.6, walkZ - 10);

    if(idx > 0 && heroes[idx]){
      const h = heroes[idx], s = SIDE(idx);
      h.userData.screen.getWorldPosition(M);
      C.set(M.x - s*fitDistance(), M.y, M.z);
      P.lerpVectors(A, C, park);
      L.lerpVectors(LA, M, Math.min(1, park*1.15));
      P.x += smx * .04 * (1 - park); P.y -= smy * .03 * (1 - park);
    } else { P.copy(A); L.copy(LA); }
    // outside the door, then walking in
    if(doorState !== 'open'){
      doorOutside.set(smx * .25, 1.62 - smy * .08, Z0 + outsideDistance());
      if(doorState === 'opening'){
        doorT += dt;
        const sl = ease(Math.min(1, doorT / 1.1)), m = ease(Math.min(1, Math.max(0, (doorT - .35) / 1.9)));
        doorL.position.x = -DOOR_W/4 - sl * (DOOR_W/2 + .02); doorR.position.x = DOOR_W/4 + sl * (DOOR_W/2 + .02);
        P.lerpVectors(doorOutside, P, m); L.lerpVectors(doorLook, L, m);
        if(bloom) bloom.strength = .25 + .25 * m;
        if(m >= 1){ doorState = 'open'; document.documentElement.classList.remove('door-walk'); if(doorThen){ const f = doorThen; doorThen = null; f(); } }
      } else { P.copy(doorOutside); L.copy(doorLook); if(bloom) bloom.strength = .25; }
    }
    camera.position.copy(P);
    camera.lookAt(L);

    for(let i=1;i<N;i++){
      const h = heroes[i]; if(!h) continue;
      const k = i === idx ? park : 0;
      const mon = h.userData.mon;
      mon.rotation.y += ((-Math.PI/2 + (1 - k) * .55) - mon.rotation.y) * .14;
      mon.position.y += ((h.userData.baseY + k*.08) - mon.position.y) * .14;
      mon.position.x += ((.3 - k*.15) - mon.position.x) * .14;
      const scr = h.userData.screen;
      if(k > .3 && !h.userData.booted){
        scr.material.map = boot; scr.material.needsUpdate = true; h.userData.booted = true; h.userData.bootT = time; blip();
      }
      if(k < .15 && h.userData.booted){ scr.material.map = h.userData.saver; scr.material.needsUpdate = true; h.userData.booted = false; }
      let b = 1;
      if(h.userData.booted && time - h.userData.bootT < .3 && !reduce) b = Math.random() < .5 ? .35 : 1.3;
      scr.material.color.setScalar(b);
      h.userData.lamp.intensity = k * 1.4;
      // the section stays visible on the monitor, fading with distance like the room's fog
      const s = sites[i];
      scr.getWorldPosition(toScr); toScr.sub(camera.position);
      camera.getWorldDirection(camFwd);
      const d = toScr.length();
      const ahead = toScr.dot(camFwd) > .2;
      let op = ahead ? Math.max(0, Math.min(1, 1 - (d - 7) / 30)) : 0;
      if(i === idx) op = Math.max(op, park);
      if(h.userData.booted && time - h.userData.bootT < .3 && !reduce) op *= Math.random() < .5 ? .4 : 1;
      if(Math.abs(op - s.op) > .02 || (op === 0) !== (s.op === 0)){
        s.wrap.style.opacity = op.toFixed(2);
        s.wrap.style.visibility = op > .01 ? 'visible' : 'hidden';
        s.op = op;
      }
      s.sharp = i === idx && dolly > .985 && Math.abs(mon.rotation.y + Math.PI/2) < .01;
      const act = i === idx && dolly > .9;
      if(Math.abs(i - cur) < 2.6) loadSite(s);
      if(act !== s.active){
        s.active = act;
        s.wrap.style.pointerEvents = act ? 'auto' : 'none';
        try { s.f.contentWindow.postMessage({miActive:act}, '*'); } catch(_){}
      }
    }

    if(!reduce){
      logoSpin.rotation.y += dt * (.7 + spinBoost);
      logoSpin.rotation.x = Math.sin(time*.6) * .12;
      orbit.rotation.z += dt * .5; orbit2.rotation.z -= dt * .35;
      logo.position.y = LOGO_Y + Math.sin(time*1.2) * .06;
    }
    spinBoost *= Math.pow(.25, dt);
    if(composer) composer.render(); else renderer.render(scene, camera);
    renderCss();
    ldHide();
    requestAnimationFrame(frame);
  }
  ldProgress(.8);
  const go = () => { measure(); cur = stationProgress(); requestAnimationFrame(frame); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go, go);
})();
