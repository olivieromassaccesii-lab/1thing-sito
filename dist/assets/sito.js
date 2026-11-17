/* 1thing — il sito. Il foglio dell'apertura è la Home dell'app: si tiene
   premuto il cerchio, il cerchio si chiude e il motore a pastello dipinge
   il pezzo del giorno dopo (matita, inchiostro, colore). */
(function () {
  'use strict';
  const T = window.TESTI || {};
  const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- il cerchio a mano (HandRing dell'app, ProfileView.swift) ----------
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function giro(seed, chiuso, cx, cy, r) {
    const R = rng(seed * 7919 + 17), rnd = (a, b) => a + R() * (b - a);
    const tilt = rnd(0, 3.1416), squash = rnd(0.035, 0.06);
    const a2 = rnd(0.016, 0.026), a3 = rnd(0.008, 0.014), ph2 = rnd(0, 6.283), ph3 = rnd(0, 6.283);
    const start = rnd(0, 6.283);
    const turn = chiuso ? 1 : rnd(1.06, 1.13);
    const drift = chiuso ? 0 : rnd(0.035, 0.06) * (R() < 0.7 ? 1 : -0.6);
    const reach = 1.075, n = 120, pts = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n, a = start + t * 6.283 * turn;
      const tail = drift * Math.max(0, t - 0.8) / 0.2;
      const wob = 1 + a2 * Math.sin(a * 2 + ph2) + a3 * Math.sin(a * 3 + ph3) + tail;
      const u = Math.cos(a - tilt) * (1 + squash), v = Math.sin(a - tilt) * (1 - squash);
      const x = (u * Math.cos(tilt) - v * Math.sin(tilt)) * wob / reach;
      const y = (u * Math.sin(tilt) + v * Math.cos(tilt)) * wob / reach;
      pts.push((k ? 'L' : 'M') + (cx + x * r).toFixed(2) + ' ' + (cy + y * r).toFixed(2));
    }
    return pts.join('');
  }

  // ---------- gli animali: al tocco, felici ----------
  document.querySelectorAll('.animale').forEach(b => {
    b.addEventListener('click', () => {
      b.classList.add('felice');
      clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('felice'), 1600);
    });
  });

  // ---------- le lingue: chiudi il menu fuori ----------
  const lingue = document.querySelector('.lingue');
  if (lingue) document.addEventListener('click', e => { if (!lingue.contains(e.target)) lingue.open = false; });

  // ---------- il foglio ----------
  const foglio = document.getElementById('foglio');
  if (!foglio) return;
  const tela = foglio.querySelector('.foglio__tela');
  const cerchio = foglio.querySelector('.cerchio');
  const pGiro = cerchio.querySelector('.cerchio__giro');
  const pPenna = cerchio.querySelector('.cerchio__penna');
  const nProva = document.querySelector('.nota__prova');
  const nGiorno = document.querySelector('.nota__giorno');
  const nAncora = document.querySelector('.nota__ancora');

  pGiro.setAttribute('d', giro(11, false, 50, 50, 44));
  pPenna.setAttribute('d', giro(23, false, 50, 50, 44));
  const lung = pPenna.getTotalLength();
  pPenna.style.strokeDasharray = lung;
  const penna = f => { pPenna.style.strokeDashoffset = lung * (1 - f); };
  penna(0);

  let giorno = +foglio.dataset.giorno || 12;
  let P = null, caricando = null, occupato = false;

  // il motore e la costa (1,3 MB) si caricano quando il foglio si vede e il
  // browser è libero, o subito al primo tocco del cerchio
  const scriptSrc = document.currentScript && document.currentScript.src;
  const avvia = () => {
    if (!scriptSrc) return;
    if ('requestIdleCallback' in window) requestIdleCallback(caricaDaBase, { timeout: 2500 });
    else setTimeout(caricaDaBase, 1200);
  };
  function caricaDaBase() {
    if (caricando) return caricando;
    caricando = new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = new URL('motore.js', scriptSrc).href;
      s.onload = ok; s.onerror = no; document.head.append(s);
    }).then(() => {
      Pastello.init();
      Pastello.attach(tela);
      return Pastello.load('costa');
    }).then(p => { P = p; Pastello.draw(P, giorno); foglio.classList.add('vivo'); return p; });
    caricando.catch(() => { caricando = null; });
    return caricando;
  }
  // il foglio comincia a caricare solo quando si vede
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); avvia(); } });
    io.observe(foglio);
  } else avvia();

  function scrivi() {
    nProva.hidden = true;
    nGiorno.hidden = false;
    nGiorno.textContent = giorno >= 30 ? T.done : (T.dayOf || '{d}').replace('{d}', giorno);
    nAncora.hidden = giorno < 30;
  }

  // ---------- tieni premuto ----------
  const DURATA = 850;
  let t0 = 0, raf = 0, preso = false, f = 0;
  function giu(e) {
    if (occupato || giorno >= 30) return;
    if (e.type === 'pointerdown') { if (e.button !== 0) return; cerchio.setPointerCapture(e.pointerId); }
    e.preventDefault();
    preso = true; t0 = performance.now() - f * DURATA;
    cerchio.classList.add('premuto');
    caricaDaBase();
    cancelAnimationFrame(raf);
    const passo = now => {
      if (!preso) return;
      f = Math.min(1, (now - t0) / DURATA);
      penna(1 - Math.pow(1 - f, 2.2));
      if (f >= 1) { completa(); return; }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
  }
  function su() {
    if (!preso) return;
    preso = false;
    cerchio.classList.remove('premuto');
    if (occupato) return;
    // lasciato prima: la penna torna indietro
    cancelAnimationFrame(raf);
    const da = f, ts = performance.now();
    const indietro = now => {
      const k = Math.min(1, (now - ts) / 260);
      f = da * (1 - k);
      penna(1 - Math.pow(1 - f, 2.2));
      if (k < 1 && !preso) raf = requestAnimationFrame(indietro);
    };
    raf = requestAnimationFrame(indietro);
  }
  async function completa() {
    preso = false; occupato = true; f = 0;
    cerchio.classList.remove('premuto');
    foglio.classList.add('fatto');
    if (navigator.vibrate) navigator.vibrate(14);
    giorno += 1;
    scrivi();
    try {
      await caricaDaBase();
      foglio.classList.add('disegna');
      if (calma) Pastello.draw(P, giorno);
      else await Pastello.play(giorno, 1.15);
    } catch (err) {
      giorno -= 1; scrivi();
    }
    foglio.classList.remove('disegna');
    setTimeout(() => {
      if (giorno < 30) { foglio.classList.remove('fatto'); penna(0); }
      occupato = false;
    }, 900);
  }

  cerchio.addEventListener('pointerdown', giu);
  cerchio.addEventListener('pointerup', su);
  cerchio.addEventListener('pointercancel', su);
  cerchio.addEventListener('lostpointercapture', su);
  cerchio.addEventListener('contextmenu', e => e.preventDefault());
  cerchio.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) giu(e); });
  cerchio.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') su(); });

  nAncora.addEventListener('click', async () => {
    if (occupato) return;
    occupato = true;
    giorno = 0;
    foglio.classList.remove('fatto'); penna(0);
    nAncora.hidden = true; nGiorno.hidden = true; nProva.hidden = false;
    try { await caricaDaBase(); Pastello.draw(P, 0); } catch (e) {}
    occupato = false;
  });
})();

// la lingua scelta resta per la prossima volta (la radice la legge)
document.querySelectorAll('a[hreflang]').forEach(a => a.addEventListener('click', () => {
  try { localStorage.setItem('lingua', a.getAttribute('lang') || ''); } catch (e) {}
}));
