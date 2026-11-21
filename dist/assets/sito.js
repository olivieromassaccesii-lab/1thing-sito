/* 1thing — il sito.
   - L'iPhone dell'apertura è la Home dell'app: si tiene premuto il cerchio,
     il cerchio si chiude e il motore a pastello dipinge il pezzo del giorno
     dopo (matita, inchiostro, colore).
   - Gli animali: un tocco e sono felici, i pallini cambiano il colore.
   - «come funziona» si ferma mentre si scorre: il cerchio si chiude e il
     dipinto cresce dal giorno 1 al 30. */
(function () {
  'use strict';
  const T = window.TESTI || {};
  const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scriptSrc = document.currentScript && document.currentScript.src;

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
    return pts.join('') + (chiuso ? 'Z' : '');
  }
  // ogni cerchio della pagina ha il suo tratto: il giro d'inchiostro e la penna blu
  function penna(svg, seed) {
    const g = svg.querySelector('.cerchio__giro'), p = svg.querySelector('.cerchio__penna');
    g.setAttribute('d', giro(seed, false, 50, 50, 44));
    p.setAttribute('d', giro(seed + 12, false, 50, 50, 44));
    const L = p.getTotalLength();
    p.style.strokeDasharray = L;
    const set = f => { p.style.strokeDashoffset = L * (1 - f); };
    set(0);
    return set;
  }

  // ---------- testata, data ----------
  const testa = document.querySelector('.testa');
  const suTesta = () => testa.classList.toggle('giu', scrollY > 8);
  addEventListener('scroll', suTesta, { passive: true }); suTesta();
  try {
    const d = new Intl.DateTimeFormat(T.lang === 'pt' ? 'pt-BR' : T.lang, { day: 'numeric', month: 'short' })
      .format(new Date()).replace(/\./g, '').replace(' de ', ' ').toLowerCase();
    document.querySelectorAll('.app-data').forEach(e => { e.textContent = d; });
  } catch (e) {}
  const conto = (el, n) => { if (el) el.textContent = (T.count || '{n}').replace('{n}', n); };

  const lingue = document.querySelector('.lingue');
  if (lingue) document.addEventListener('click', e => { if (!lingue.contains(e.target)) lingue.open = false; });
  document.querySelectorAll('a[hreflang]').forEach(a => a.addEventListener('click', () => {
    try { localStorage.setItem('lingua', a.getAttribute('lang') || ''); } catch (e) {}
  }));

  // ---------- gli animali ----------
  // l'immagine nuova si cambia solo quando è già scaricata e decodificata:
  // altrimenti per un attimo l'animale spariva
  const pronta = src => { const im = new Image(); im.src = src; return (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => src); };
  const salto = li => {
    li.classList.remove('saltello'); void li.offsetWidth;
    li.classList.add('felice', 'saltello');
    clearTimeout(li._t); li._t = setTimeout(() => li.classList.remove('felice', 'saltello'), 1400);
  };
  document.querySelectorAll('.animale').forEach((li, i) => {
    const nome = li.dataset.animale;
    const [ia, iff] = li.querySelectorAll('.animale__figura img');
    li.querySelector('.animale__figura').addEventListener('click', () => {
      salto(li);
      if (navigator.vibrate) navigator.vibrate(8);
    });
    li.querySelectorAll('.tinta').forEach((b, k) => {
      b.querySelector('path').setAttribute('d', giro(31 + i * 4 + k, true, 20, 20, 17));
      const src = t => `../assets/img/${nome}-${b.dataset.c}-${t}.webp`;
      const scalda = () => { pronta(src('aspetta')); pronta(src('felice')); };
      b.addEventListener('pointerenter', scalda, { once: true });
      b.addEventListener('focus', scalda, { once: true });
      b.addEventListener('click', async () => {
        li.querySelectorAll('.tinta').forEach(x => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
        li.dataset.colore = b.dataset.c;
        const [a, f] = await Promise.all([pronta(src('aspetta')), pronta(src('felice'))]);
        if (li.dataset.colore !== b.dataset.c) return;
        ia.src = a; iff.src = f;
        salto(li);
      });
    });
  });
  // quando la sezione si avvicina, scarica anche gli altri colori
  const compagno = document.getElementById('compagno');
  if (compagno && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      document.querySelectorAll('.animale').forEach(li => [0, 1, 2, 3].forEach(c => ['aspetta', 'felice'].forEach(t =>
        pronta(`../assets/img/${li.dataset.animale}-${c}-${t}.webp`))));
    }, { rootMargin: '400px' });
    io.observe(compagno);
  }

  // ---------- lo studio: gli arredamenti ----------
  const stili = [...document.querySelectorAll('.stile')];
  const foto = [...document.querySelectorAll('.stile__foto')];
  stili.forEach(b => b.addEventListener('click', () => {
    stili.forEach(x => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
    foto.forEach(f => f.classList.toggle('on', f.dataset.s === b.dataset.s));
  }));

  // ---------- anelli a mano: numeri dello studio, giorni del calendario ----------
  const svgNS = 'http://www.w3.org/2000/svg';
  const anelloSVG = (seed, cls, chiuso) => {
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('aria-hidden', 'true');
    if (cls) svg.setAttribute('class', cls);
    const p = document.createElementNS(svgNS, 'path'); p.setAttribute('d', giro(seed, chiuso, 50, 50, 44)); svg.append(p); return svg;
  };
  document.querySelectorAll('.segno, .punto').forEach((el, i) => {
    const n = el.textContent; el.textContent = '';
    const s = document.createElement('span'); s.textContent = n;
    el.append(anelloSVG(51 + i * 3, '', false), s);
  });
  // i giorni ancora da dipingere: il tratteggio a mano
  document.querySelectorAll('.giorno__anello path').forEach(p => {
    const i = +p.dataset.seme; p.setAttribute('d', giro(70 + i, true, 50, 50, 40));
    const L = p.getTotalLength(), R = rng(i * 13 + 5), pezzi = [];
    let fatto = 0; while (fatto < L) { const a = 5 + R() * 9, b = 4 + R() * 6; pezzi.push(a.toFixed(1), b.toFixed(1)); fatto += a + b; }
    p.style.strokeDasharray = pezzi.join(' ');
  });

  // ---------- il calendario: tocchi un giorno, rileggi l'obiettivo ----------
  const cal = document.querySelector('.cal');
  if (cal && T.cal) {
    const foglio = document.querySelector('.cal__foglio');
    const emb = foglio.querySelector('.cal__emblema'), quando = foglio.querySelector('.cal__quando');
    const ob = foglio.querySelector('.cal__obiettivo'), nota = foglio.querySelector('.cal__nota');
    const fmt = (() => { try { return new Intl.DateTimeFormat(T.lang === 'pt' ? 'pt-BR' : T.lang, { day: 'numeric', month: 'long' }); } catch (e) { return null; } })();
    const oggi = new Date();
    const data = d => { const x = new Date(oggi); x.setDate(oggi.getDate() - (19 - d)); return fmt ? fmt.format(x).toLowerCase() : ''; };
    const bottoni = [...cal.querySelectorAll('button.giorno')];
    bottoni.forEach((b, i) => {
      const svg = anelloSVG(90 + i, 'giorno__scelto', false); b.append(svg);
      const p = svg.querySelector('path'); svg.style.setProperty('--l', p.getTotalLength());
    });
    const mostra = (d, anima) => {
      bottoni.forEach(b => b.setAttribute('aria-pressed', +b.dataset.d === d ? 'true' : 'false'));
      emb.src = `../assets/img/cal-${d}.webp`;
      quando.textContent = (T.cal.day || '{d}').replace('{d}', d) + (data(d) ? ' · ' + data(d) : '');
      ob.textContent = T.cal.goals[d - 1];
      nota.textContent = T.cal.notes[String(d)] || '';
      if (anima) { foglio.classList.remove('cambia'); void foglio.offsetWidth; foglio.classList.add('cambia'); }
    };
    bottoni.forEach(b => b.addEventListener('click', () => {
      mostra(+b.dataset.d, true);
      // su telefono la scheda sta sotto la griglia: se non si vede, ci si arriva
      const r = foglio.getBoundingClientRect();
      if (r.top > innerHeight - 120 || r.bottom < 80) foglio.scrollIntoView({ behavior: calma ? 'auto' : 'smooth', block: 'center' });
    }));
    mostra(18, false);
  }

  // ---------- come funziona: il dipinto cresce scorrendo ----------
  const storia = document.querySelector('.storia');
  if (storia) {
    const tel = storia.querySelector('.telefono');
    const setPenna = penna(storia.querySelector('.cerchio svg'), 23);
    const passi = [...storia.querySelectorAll('.passi li')];
    const quadri = [...storia.querySelectorAll('.storia__quadro')];
    const giorni = quadri.map(q => +q.dataset.d);
    const nEl = storia.querySelector('.storia__n'), contoEl = storia.querySelector('.app-conto');
    let ultimo = -1, raf = 0;
    const aggiorna = () => {
      raf = 0;
      const r = storia.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      const passo = p < 0.28 ? 0 : p < 0.58 ? 1 : 2;
      passi.forEach((li, i) => li.classList.toggle('on', i === passo));
      // si parte dal giorno 1 (il faro): il cerchio si chiude e arriva il 2,
      // poi scorrendo il dipinto cresce fino al 30
      let giorno = 1, f = 0;
      if (passo === 1) { f = Math.min(1, (p - 0.28) / 0.24); giorno = f >= 1 ? 2 : 1; }
      if (passo === 2) { f = 1; giorno = Math.min(30, Math.max(2, Math.round(2 + (p - 0.58) / 0.38 * 28))); }
      setPenna(f);
      tel.classList.toggle('fatto', f >= 1);
      if (giorno !== ultimo) {
        ultimo = giorno;
        let k = 0; giorni.forEach((d, i) => { if (d <= giorno) k = i; });
        quadri.forEach((q, i) => q.classList.toggle('on', i === k));
        nEl.textContent = giorno;
        conto(contoEl, giorno);
      }
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(aggiorna); }, { passive: true });
    addEventListener('resize', aggiorna);
    aggiorna();
  }

  // ---------- l'apertura: tieni premuto ----------
  const foglio = document.getElementById('foglio');
  if (!foglio) return;
  const tela = foglio.querySelector('.foglio__tela');
  const cerchio = foglio.querySelector('.cerchio');
  const setPenna = penna(cerchio.querySelector('svg'), 11);
  const contoEl = foglio.querySelector('.app-conto');
  const nProva = document.querySelector('.nota__prova');
  const nGiorno = document.querySelector('.nota__giorno');
  const nAncora = document.querySelector('.nota__ancora');

  let giorno = +foglio.dataset.giorno || 12;
  let P = null, caricando = null, occupato = false;

  // il motore e la costa (1,3 MB) si caricano quando l'iPhone si vede e il
  // browser è libero, o subito al primo tocco del cerchio
  function carica() {
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
  const avvia = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(carica, { timeout: 2500 });
    else setTimeout(carica, 1200);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); avvia(); } });
    io.observe(foglio);
  } else avvia();

  function scrivi() {
    nProva.hidden = true;
    nGiorno.hidden = false;
    nGiorno.textContent = giorno >= 30 ? T.done : (T.dayOf || '{d}').replace('{d}', giorno);
    nAncora.hidden = giorno < 30;
    conto(contoEl, giorno);
  }

  const DURATA = 850;
  let t0 = 0, raf = 0, preso = false, f = 0;
  const curva = x => 1 - Math.pow(1 - x, 2.2);
  function giu(e) {
    if (occupato || giorno >= 30) return;
    if (e.type === 'pointerdown') { if (e.button !== 0) return; cerchio.setPointerCapture(e.pointerId); }
    e.preventDefault();
    preso = true; t0 = performance.now() - f * DURATA;
    cerchio.classList.add('premuto');
    carica();
    cancelAnimationFrame(raf);
    const passo = now => {
      if (!preso) return;
      f = Math.min(1, (now - t0) / DURATA);
      setPenna(curva(f));
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
    cancelAnimationFrame(raf);
    const da = f, ts = performance.now();
    const indietro = now => {
      const k = Math.min(1, (now - ts) / 260);
      f = da * (1 - k);
      setPenna(curva(f));
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
      await carica();
      foglio.classList.add('disegna');
      if (calma) Pastello.draw(P, giorno);
      else await Pastello.play(giorno, 1.15);
    } catch (err) {
      giorno -= 1; scrivi();
    }
    foglio.classList.remove('disegna');
    setTimeout(() => {
      if (giorno < 30) { foglio.classList.remove('fatto'); setPenna(0); }
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
    foglio.classList.remove('fatto'); setPenna(0);
    nAncora.hidden = true; nGiorno.hidden = true; nProva.hidden = false;
    conto(contoEl, 0);
    try { await carica(); Pastello.draw(P, 0); } catch (e) {}
    occupato = false;
  });
})();
