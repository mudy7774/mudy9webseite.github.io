// MI Studio bridge
// Wird nur aktiv, wenn website.html im 3D-Studio mit ?mi=<abschnitt> geladen wird.
// Ohne Parameter verhält sich deine Website ganz normal.
(function(){
  var m = window.__miParam ? [0, window.__miParam] : location.search.match(/[?&]mi=([^&]+)/);
  if(m){ window.__miSection = '#' + decodeURIComponent(m[1]); window.__miPaused = true; }
  var raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function(cb){ return window.__miPaused ? setTimeout(function(){ raf(cb); }, 350) : raf(cb); };
  if(!m) return;
  document.addEventListener('DOMContentLoaded', function(){
  var css = document.createElement('style');
  css.textContent =
    'html.mi-solo body>*{display:none!important}' +
    'html.mi-solo body>.mi-on,html.mi-solo body>#particles-canvas,html.mi-solo body>.cursor,html.mi-solo body>.cursor-dot{display:block!important}' +
    'html.mi-solo body>.mi-on.hero{display:flex!important}' +
    'html.mi-solo .loader,html.mi-solo nav,html.mi-solo .back-to-top,html.mi-solo .scroll-indicator{display:none!important}' +
    'html.mi-solo body{overflow-x:hidden}' +
    'html.mi-solo body>.mi-on:not(.hero){display:flex!important;flex-direction:column;justify-content:center;padding-top:3.5rem!important;padding-bottom:3.5rem!important}' +
    'html.mi-solo body>.mi-on:not(.hero)>.container{width:100%}' +
    'html.mi-solo .reveal{opacity:1!important;transform:none!important}' +
    /* Dark Mode nur im Studio: passt zu Start- und Kontakt-Bildschirm. Deine normale Website bleibt hell. */
    'html.mi-solo{--bg:#0b1120;--bg-alt:#0d1427;--text:#ffffff;--text-light:#ffffff;--secondary:#f1f5f9;--shadow:0 10px 40px rgba(0,0,0,.45);--shadow-lg:0 20px 60px rgba(0,0,0,.5);--shadow-xl:0 25px 80px rgba(0,0,0,.6);background:#0b1120}' +
    'html.mi-solo body{background:#0b1120;color:#fff}' +
    'html.mi-solo .section-title,html.mi-solo .section-subtitle,html.mi-solo p,html.mi-solo h3,html.mi-solo h4,html.mi-solo blockquote,html.mi-solo li,html.mi-solo .skill-tag,html.mi-solo .card-text p,html.mi-solo .card-text a{color:#fff!important}' +
    'html.mi-solo .about,html.mi-solo .process{background:radial-gradient(70% 60% at 20% 0%,rgba(99,102,241,.14),transparent 60%),#0b1120!important}' +
    'html.mi-solo .services,html.mi-solo .portfolio,html.mi-solo .skills{background:radial-gradient(70% 60% at 80% 0%,rgba(6,182,212,.10),transparent 60%),#0d1427!important}' +
    'html.mi-solo .service-card,html.mi-solo .portfolio-card,html.mi-solo .process-step,html.mi-solo .skill-item,html.mi-solo .skill-tag{background:#141d33!important;border:1px solid rgba(148,163,255,.14)}' +
    'html.mi-solo .skill-tag{color:#fff}' +
    'html.mi-solo .skill-bar{background:#24304f}' +
    'html.mi-solo .section-tag,html.mi-solo .process-result,html.mi-solo .feature-item .icon{background:rgba(99,102,241,.2);color:#b4bdff}' +
    'html.mi-solo .portfolio-category,html.mi-solo .portfolio-link,html.mi-solo .skill-percent{color:#a5b4fc}' +
    'html.mi-solo .process-num{color:rgba(165,180,252,.2)}' +
    'html.mi-solo .process-promises{background:#141d33;border:1px solid rgba(148,163,255,.14)}' +
    'html.mi-solo .about-image-secondary{border-color:#0b1120}' +
    'html.mi-solo .section-title .highlight{background:linear-gradient(135deg,#8b9dff 0%,#b388ff 100%);-webkit-background-clip:text;background-clip:text}' +
    '.mi-photo-hint{position:absolute;left:12px;bottom:12px;z-index:5;font:600 12px/1.3 system-ui,sans-serif;color:#fff;background:rgba(15,23,42,.75);padding:6px 10px;border-radius:8px;pointer-events:none}';
  document.head.appendChild(css);

  /* placeholders for photos that are not uploaded yet (real files in img/ replace them automatically) */
  function placeholder(label, w, h){
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#667eea"/><stop offset="1" stop-color="#764ba2"/></linearGradient></defs>' +
      '<rect width="'+w+'" height="'+h+'" fill="url(#g)"/>' +
      '<rect x="'+(w*.06)+'" y="'+(h*.06)+'" width="'+(w*.88)+'" height="'+(h*.88)+'" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-dasharray="14 10" rx="18"/>' +
      '<text x="50%" y="46%" fill="#fff" font-family="Arial" font-weight="700" font-size="'+Math.round(w/11)+'" text-anchor="middle">Dein Foto</text>' +
      '<text x="50%" y="56%" fill="rgba(255,255,255,.85)" font-family="monospace" font-size="'+Math.round(w/26)+'" text-anchor="middle">'+label+'</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  document.querySelectorAll('img').forEach(function(img){
    var src = img.getAttribute('src') || '';
    if(src.indexOf('img/') !== 0) return;
    var big = img.closest('.about-image-main');
    function swap(){ img.onerror = null; img.src = placeholder(src, big ? 800 : 500, big ? 1000 : 500); }
    img.onerror = swap;
    if(img.complete && img.naturalWidth === 0) swap();
  });
  var heroTest = new Image();
  heroTest.onerror = function(){
    var hero = document.querySelector('.hero');
    if(hero){ hero.style.backgroundImage = 'url("' + placeholder('img/Herobild.jpg', 1600, 900) + '")'; hero.style.backgroundSize = 'cover'; }
  };
  heroTest.src = 'img/Herobild.jpg';

  /* show only one section */
  var current = null;
  function show(hash){
    var t = document.querySelector(hash);
    if(!t) return;
    document.querySelectorAll('.mi-on').forEach(function(el){ el.classList.remove('mi-on'); el.style.zoom = ''; el.style.minHeight = ''; });
    document.documentElement.classList.add('mi-solo');
    t.classList.add('mi-on');
    current = t;
    window.scrollTo(0, 0);
    t.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('active'); });
    // links to other pages (case studies, LinkedIn ...) open in a new tab instead of inside the monitor
    document.querySelectorAll('a[href]').forEach(function(l){
      var h = l.getAttribute('href') || '';
      if(h.charAt(0) !== '#' && h.indexOf('mailto:') !== 0){ l.target = '_blank'; l.rel = 'noopener'; }
    });
    t.querySelectorAll('.skill-progress').forEach(function(bar){ bar.style.width = bar.getAttribute('data-width') + '%'; });
    fit();
  }
  function fit(){
    if(!current) return;
    current.style.zoom = '';
    current.style.minHeight = window.innerHeight + 'px';
    var h = current.scrollHeight, z = Math.max(0.88, Math.min(1, (window.innerHeight - 4) / h));   // nie kleiner als 88 %, damit die Schrift lesbar bleibt; der Rest lässt sich scrollen
    if(z < 1 && 'zoom' in current.style){
      current.style.zoom = z;
      current.style.minHeight = (window.innerHeight / z) + 'px';
    }
  }
  window.addEventListener('resize', fit);

  /* links inside the screen: anchors move the studio to that monitor */
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if(!a || !document.documentElement.classList.contains('mi-solo')) return;
    var href = a.getAttribute('href');
    e.preventDefault(); e.stopImmediatePropagation();
    try { parent.postMessage({miNav: href === '#' ? '#home' : href}, '*'); } catch(_){}
  }, true);

  window.addEventListener('message', function(e){
    var d = e.data;
    if(!d) return;
    if(d.miShow) show(d.miShow);
    if(typeof d.miActive === 'boolean') window.__miPaused = !d.miActive;
  });
  if(window.__miSection) show(window.__miSection);
  window.addEventListener('load', fit);
  function ready(){ try { parent.postMessage({miReady:true}, '*'); } catch(_){} }
  if(document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
  });
})();
