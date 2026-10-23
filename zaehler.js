/* Besucherzähler ohne Cookies (GoatCounter, kostenlos)
   1. Auf https://www.goatcounter.com ein Konto anlegen, z. B. mit dem Namen "mohamadissa".
   2. Den Namen hier eintragen:                                                         */
var GOATCOUNTER_NAME = '';
/* Fertig. Die Zahlen siehst du dann auf https://DEINNAME.goatcounter.com
   Bildschirme im 3D-Studio und dein eigener Rechner (localhost) werden nicht mitgezählt. */
(function(){
  if(!GOATCOUNTER_NAME) return;
  if(window.self !== window.top) return;                       // Monitore im Studio
  if(/^(localhost|127\.|192\.168\.)/.test(location.hostname) || location.protocol === 'file:') return;
  var s = document.createElement('script');
  s.async = true; s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + GOATCOUNTER_NAME + '.goatcounter.com/count');
  document.head.appendChild(s);
})();
