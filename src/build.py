#!/usr/bin/env python3
"""Costruisce il sito di 1thing in dist/: una pagina per lingua
(dist/<lingua>/index.html) dalla stessa pagina.html e da testi.json, più la
radice che manda ognuno alla sua lingua.

    python3 src/build.py

Le immagini in dist/assets/img vengono da src/render (il motore a pastello,
Chrome senza finestra) e da motore-pastello/app (le schermate dell'app)."""
import html, json, os, re, shutil, time

QUI = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(QUI, '..', 'dist')
SITO = 'https://1thingapp.com'
# quando l'app è sull'App Store, il link va qui: il tasto passa da «presto» a «scarica»
APP_STORE = ''
LINGUE = ['it', 'en', 'es', 'fr', 'pt']
LOCALE = {'it': 'it_IT', 'en': 'en_US', 'es': 'es_ES', 'fr': 'fr_FR', 'pt': 'pt_BR'}
HREFLANG = {'it': 'it', 'en': 'en', 'es': 'es', 'fr': 'fr', 'pt': 'pt-BR'}
DIPINTI = ['costa', 'giardino', 'bosco', 'deserto', 'luminoso']
ANIMALI = ['gatto', 'cane', 'pappagallo', 'criceto']
GIORNI = [1, 5, 12, 20, 30]

testi = json.load(open(os.path.join(QUI, 'testi.json'), encoding='utf-8'))
documenti = json.load(open(os.path.join(QUI, 'documenti.json'), encoding='utf-8'))
# il titolare del trattamento (nome e indirizzo, o ragione sociale e sede):
# finché è vuoto la privacy lo mostra da completare, e il build lo ricorda
TITOLARE = 'Oliviero Massaccesi'
EMAIL = 'feedback@1thingapp.com'
for _l in testi:
    testi[_l].update({k: v for k, v in documenti[_l].items() if isinstance(v, str)})
pagina = open(os.path.join(QUI, 'pagina.html'), encoding='utf-8').read()
v = time.strftime('%Y%m%d%H%M')

COLORI = {'gatto': ['#e0873a', '#9a958c', '#5a534c', '#e8cfa2'],
          'cane': ['#d9a464', '#8f6346', '#a7a39b', '#ead7b0'],
          'pappagallo': ['#5e9e4a', '#5a8fc8', '#d4553c', '#e6b42e'],
          'criceto': ['#e3a35a', '#ecd6ae', '#b0aaa0', '#f1ebe0']}
MOMENTI = ['alba', 'giorno', 'tramonto', 'notte']
STILI = ['partenza', 'autunno', 'primavera', 'mare', 'serra']
ICONE = ['carta', 'albicocca', 'terracotta', 'rosa', 'giallo', 'verde', 'azzurro', 'blu-penna']
STORIA = [1, 2, 4, 7, 10, 14, 18, 22, 26, 30]

def tasto(t, tipo=''):
    cls = 'tasto' + (' tasto--' + tipo if tipo else '')
    if APP_STORE:
        return f'<a class="{cls}" href="{APP_STORE}">{t["cta_store"]}</a>'
    return f'<span class="{cls} tasto--presto">{t["cta_soon"]}</span>'

ICONA_CAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7.2c0-1.2.9-2 2.1-2h10.8c1.2 0 2.1.8 2.1 2v10.6c0 1.2-.9 2-2.1 2H6.6c-1.2 0-2.1-.8-2.1-2Z M4.6 10h14.8 M8.4 3.6v3 M15.6 3.6v3"/></svg>'
ICONA_TU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12.2a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z M4.8 20c.9-3.4 3.7-5.3 7.2-5.3s6.3 1.9 7.2 5.3"/></svg>'

def testa_app(t, n):
    return (f'<div class="app-testa" aria-hidden="true">{ICONA_CAL}<div class="app-testa__mezzo">'
            f'<span class="app-data"></span><span class="app-conto">{t["done_count"].replace("{n}", str(n))}</span>'
            f'</div>{ICONA_TU}</div>')

def fr_spazi(s):
    # in francese: spazio fine non separabile prima di : ; ? !
    return re.sub(r' ([:;?!])', ' \\1', s)

os.makedirs(DIST, exist_ok=True)
for lg in LINGUE:
    t = dict(testi[lg])
    if lg == 'fr':
        t = {k: (fr_spazi(v_) if isinstance(v_, str) else v_) for k, v_ in t.items()}
    e = {k: html.escape(v_, quote=True) for k, v_ in t.items() if isinstance(v_, str)}
    links = ''.join(
        f'<li><a href="../{o}/" hreflang="{HREFLANG[o]}" lang="{o}"' + (' aria-current="page"' if o == lg else '') +
        f'>{html.escape(testi[o]["lang_name"])}</a></li>' for o in LINGUE)
    hreflang = '\n'.join(f'<link rel="alternate" hreflang="{HREFLANG[o]}" href="{SITO}/{o}/">' for o in LINGUE) + \
        f'\n<link rel="alternate" hreflang="x-default" href="{SITO}/en/">'
    pigro = ['' if i == 0 else 'decoding="async" ' for i in range(len(STORIA))]
    frames = '\n            '.join(
        f'<img class="storia__quadro{" on" if i == 0 else ""}" data-d="{d}" src="../assets/img/storia-{d}.webp" width="600" height="1354" '
        f'{pigro[i]}alt="">' for i, d in enumerate(STORIA))
    quadri = '\n    '.join(
        f'<li data-r><figure class="quadro"><img src="../assets/img/{p}.webp" width="600" height="1354" loading="lazy" alt=""></figure>'
        f'<span>{e["p_" + p]}</span></li>' for p in DIPINTI)
    def animale(a):
        tinte = ''.join(
            f'<button class="tinta" type="button" role="radio" aria-checked="{"true" if i == 0 else "false"}" data-c="{i}" '
            f'style="--c:{c}" aria-label="{e["color"]} {i + 1}"><svg viewBox="0 0 40 40" aria-hidden="true"><path d=""/></svg></button>'
            for i, c in enumerate(COLORI[a]))
        return (f'<li class="animale" data-animale="{a}" data-colore="0">'
                f'<button class="animale__figura" type="button" aria-label="{e["pet_" + a]}">'
                f'<img class="animale__a" src="../assets/img/{a}-0-aspetta.webp" width="462" height="408" loading="lazy" alt="">'
                f'<img class="animale__f" src="../assets/img/{a}-0-felice.webp" width="462" height="408" loading="lazy" alt=""></button>'
                f'<span class="animale__nome" aria-hidden="true">{e["pet_" + a]}</span>'
                f'<div class="tinte" role="radiogroup" aria-label="{e["pet_" + a]}: {e["color"]}">{tinte}</div></li>')
    animali = '\n    '.join(animale(a) for a in ANIMALI)
    momenti = '\n    '.join(
        f'<li class="momento momento--{m}" data-r><div class="telefono telefono--foto"><div class="telefono__schermo">'
        f'<img class="foto" src="../assets/img/momento-{m}.webp" width="700" height="1522" loading="lazy" alt="">'
        f'<div class="app-sopra" aria-hidden="true"><span class="app-data"></span><span class="app-conto">{e["done_count"].replace("{n}", "18")}</span></div>'
        f'<p class="momento__obiettivo" aria-hidden="true">{e["goal_example"]}</p></div></div>'
        f'<span class="momento__nome">{e["m_" + m]}</span></li>' for m in MOMENTI)
    stili_tab = ''.join(
        f'<button class="stile" type="button" role="tab" aria-selected="{"true" if i == 0 else "false"}" data-s="{st}">{e["d_" + st]}</button>'
        for i, st in enumerate(STILI))
    pigri = ['' if i == 0 else 'loading="lazy" ' for i in range(len(STILI))]
    alts = [e['studio_alt']] + [''] * (len(STILI) - 1)
    stili_img = '\n        '.join(
        f'<img class="foto stile__foto{" on" if i == 0 else ""}" data-s="{st}" src="../assets/img/studio-{st}.webp" width="800" height="1739" '
        f'{pigri[i]}alt="{alts[i]}">' for i, st in enumerate(STILI))
    voci = [(18, 'g1', 'g1n'), (17, 'g2', None), (16, 'g3', 'g3n')]
    traccia = '\n        '.join(
        f'<li><span class="elenco__giorno">{e["day_short"].replace("{d}", str(d))}</span><span class="elenco__obiettivo">{e[g]}</span>'
        + (f'<span class="elenco__nota">{e[n]}</span>' if n else '') + '</li>' for d, g, n in voci)
    icone = ''.join(f'<img src="../assets/img/icona-{i}.webp" width="240" height="240" loading="lazy" alt="">' for i in ICONE)
    # il calendario: 30 giorni, i primi 18 fatti, con il pezzo di dipinto vero
    def anello(i):
        return f'<svg class="giorno__anello" viewBox="0 0 100 100" aria-hidden="true"><path data-seme="{i}" d=""/></svg>'
    giorni_cal = []
    for i in range(1, 31):
        if i <= 18:
            nota = '<span class="giorno__nota" aria-hidden="true"></span>' if str(i) in t['cal_notes'] else ''
            giorni_cal.append(f'<li><button class="giorno" type="button" data-d="{i}" aria-pressed="{"true" if i == 18 else "false"}" '
                              f'aria-label="{e["day"].replace("{d}", str(i))}: {html.escape(t["cal_goals"][i - 1], quote=True)}">'
                              f'<span class="giorno__n" aria-hidden="true">{i}</span><img src="../assets/img/cal-{i}.webp" width="172" height="172" loading="lazy" alt="">{nota}</button></li>')
        else:
            giorni_cal.append(f'<li><span class="giorno giorno--vuoto" title="{e["cal_todo"]}"><span class="giorno__n" aria-hidden="true">{i}</span>{anello(i)}</span></li>')
    js_cal = json.dumps({'goals': t['cal_goals'], 'notes': t['cal_notes'], 'day': t['day']}, ensure_ascii=False)
    val = dict(e)
    val.update(lang=lg, site=SITO, v=v, locale=LOCALE[lg], hreflang=hreflang, lang_links=links,
               story_frames=frames, cal_days='\n        '.join(giorni_cal), js_cal=js_cal, moments=momenti, style_tabs=stili_tab, style_frames=stili_img, track_items=traccia, icons=icone, paintings=quadri, pets=animali, cta=tasto(e),
               cta_small=tasto(e, 'piccolo'), cta_light=tasto(e, 'chiaro'),
               app_head=testa_app(e, 12), app_head_story=testa_app(e, 1),
               js_count=json.dumps(t['done_count'], ensure_ascii=False),
               js_day_of=json.dumps(t['day_of'], ensure_ascii=False),
               js_done=json.dumps(t['painting_done'], ensure_ascii=False))
    out = re.sub(r'\{\{(\w+)\}\}', lambda m: val[m.group(1)], pagina)
    out = out.replace(f'<html lang="{lg}">', f'<html lang="{HREFLANG[lg]}">', 1)
    os.makedirs(os.path.join(DIST, lg), exist_ok=True)
    open(os.path.join(DIST, lg, 'index.html'), 'w', encoding='utf-8').write(out)

# ---------- le pagine /faq e /privacy, una per lingua ----------
DOC = """<!doctype html>
<html lang="{htmllang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} — 1thing</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#f9f5ef">
<link rel="canonical" href="{site}/{lang}/{slug}/">
{hreflang}
<link rel="icon" href="../../assets/img/icona.png">
<link rel="preload" href="../../assets/poppi.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../../assets/sito.css?v={v}">
</head>
<body class="documento">
<a class="salta" href="#contenuto">{skip}</a>
<header class="testa">
  <div class="testa__riga">
    <a class="marchio" href="../">1thing</a>
    <nav class="voci" aria-label="1thing">
      <a href="../">{home_nav}</a>
      <a href="../faq/"{cur_faq}>{faq_nav}</a>
      <a href="../privacy/"{cur_priv}>{privacy_nav}</a>
    </nav>
    <details class="lingue">
      <summary aria-label="{lang_label}">{lang}</summary>
      <ul>{links}</ul>
    </details>
  </div>
</header>
<main id="contenuto" class="foglio-testo">
  <h1>{title}</h1>
  <p class="foglio-testo__intro">{intro}</p>
  {extra}
  {body}
</main>
<footer class="piede">
  <div class="piede__riga">
    <span class="marchio marchio--piccolo">1thing</span>
    <ul class="piede__lingue" aria-label="{lang_label}">{links}</ul>
    <a href="mailto:{email}">{write}</a>
    <span class="piede__anno">© 2026</span>
  </div>
</footer>
<script>
document.querySelectorAll('a[hreflang]').forEach(a => a.addEventListener('click', () => {{ try {{ localStorage.setItem('lingua', a.getAttribute('lang') || ''); }} catch (e) {{}} }}));
const L = document.querySelector('.lingue'); if (L) document.addEventListener('click', e => {{ if (!L.contains(e.target)) L.open = false; }});
</script>
</body>
</html>
"""
mancano = False
for lg in LINGUE:
    t = testi[lg]; dd = documenti[lg]
    fr = (lambda x: fr_spazi(x)) if lg == 'fr' else (lambda x: x)
    E = lambda x: html.escape(fr(x), quote=True)
    mail = f'<a href="mailto:{EMAIL}">{EMAIL}</a>'
    tit = html.escape(TITOLARE) if TITOLARE else '<mark class="da-completare">[da completare]</mark>'
    if not TITOLARE: mancano = True
    for slug in ['faq', 'privacy']:
        links = ''.join(
            f'<li><a href="../../{o}/{slug}/" hreflang="{HREFLANG[o]}" lang="{o}"' + (' aria-current="page"' if o == lg else '') +
            f'>{html.escape(testi[o]["lang_name"])}</a></li>' for o in LINGUE)
        hl = '\n'.join(f'<link rel="alternate" hreflang="{HREFLANG[o]}" href="{SITO}/{o}/{slug}/">' for o in LINGUE) + \
            f'\n<link rel="alternate" hreflang="x-default" href="{SITO}/en/{slug}/">'
        if slug == 'faq':
            body = '<div class="domande">' + ''.join(
                f'<details class="domanda"><summary><h2>{E(q)}</h2><span class="domanda__segno" aria-hidden="true"></span></summary><p>{E(a)}</p></details>'
                for q, a in dd['faq']) + '</div>' + \
                f'<p class="foglio-testo__fine">{E(dd["faq_more"])} <a href="mailto:{EMAIL}">{EMAIL}</a></p>'
            extra = ''
            title, intro = dd['faq_title'], dd['faq_intro']
        else:
            parti = []
            for h, ps in dd['privacy']:
                pp = ''.join('<p>' + E(x).replace('{titolare}', tit).replace('{email}', mail) + '</p>' for x in ps)
                parti.append(f'<section><h2>{E(h)}</h2>{pp}</section>')
            body = '<div class="informativa">' + ''.join(parti) + '</div>'
            extra = f'<p class="foglio-testo__data">{E(dd["updated"])}</p>'
            title, intro = dd['privacy_title'], dd['privacy_intro']
        out = DOC.format(htmllang=HREFLANG[lg], lang=lg, title=E(title), desc=E(intro), site=SITO, slug=slug, hreflang=hl, v=v,
                         skip=E(t['skip']), home_nav=E(dd['home_nav']), faq_nav=E(dd['faq_nav']), privacy_nav=E(dd['privacy_nav']),
                         cur_faq=' aria-current="page"' if slug == 'faq' else '', cur_priv=' aria-current="page"' if slug == 'privacy' else '',
                         lang_label=E(t['lang_label']), links=links, intro=E(intro), extra=extra, body=body, email=EMAIL, write=E(t['write']))
        os.makedirs(os.path.join(DIST, lg, slug), exist_ok=True)
        open(os.path.join(DIST, lg, slug, 'index.html'), 'w', encoding='utf-8').write(out)

# /faq e /privacy senza lingua (i link dentro l'app): ognuno alla sua
for slug in ['faq', 'privacy']:
    os.makedirs(os.path.join(DIST, slug), exist_ok=True)
    open(os.path.join(DIST, slug, 'index.html'), 'w', encoding='utf-8').write(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>1thing</title><link rel="canonical" href="{SITO}/en/{slug}/">
<script>(function(){{var L={json.dumps(LINGUE)},s;try{{s=localStorage.getItem('lingua')}}catch(e){{}}
var a=(navigator.languages||[navigator.language||'en']).map(function(x){{return String(x).slice(0,2).toLowerCase()}});
var l=L.indexOf(s)>=0?s:(a.filter(function(x){{return L.indexOf(x)>=0}})[0]||'en');location.replace('../'+l+'/{slug}/')}})();</script>
<style>body{{background:#f9f5ef;color:#3a322b;font:20px/1.5 system-ui;padding:40px 20px}}a{{color:inherit;margin-right:14px}}</style>
</head><body>{''.join(f'<a href="../{o}/{slug}/" hreflang="{HREFLANG[o]}">{html.escape(testi[o]["lang_name"])}</a>' for o in LINGUE)}</body></html>
""")

# ---------- per il dominio: 404, robots, sitemap, favicon, intestazioni ----------
oggi = time.strftime('%Y-%m-%d')
sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
for x in ['', 'faq/', 'privacy/']:
    for o in LINGUE:
        sitemap.append(f'  <url><loc>{SITO}/{o}/{x}</loc><lastmod>{oggi}</lastmod>')
        for o2 in LINGUE:
            sitemap.append(f'    <xhtml:link rel="alternate" hreflang="{HREFLANG[o2]}" href="{SITO}/{o2}/{x}"/>')
        sitemap.append('  </url>')
sitemap.append('</urlset>')
open(os.path.join(DIST, 'sitemap.xml'), 'w', encoding='utf-8').write('\n'.join(sitemap) + '\n')
open(os.path.join(DIST, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\n\nSitemap: {SITO}/sitemap.xml\n')

# la pagina che non c'è: percorsi dalla radice, perché l'hosting la serve a qualsiasi indirizzo
P404 = {'it': 'questa pagina non c’è.', 'en': 'this page doesn’t exist.', 'es': 'esta página no existe.', 'fr': 'cette page n’existe pas.', 'pt': 'esta página não existe.'}
righe = ''.join(f'<p lang="{o}">{html.escape(P404[o])} <a href="/{o}/">1thing</a></p>' for o in LINGUE)
open(os.path.join(DIST, '404.html'), 'w', encoding='utf-8').write(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>1thing</title><meta name="robots" content="noindex">
<link rel="icon" href="/assets/img/icona.png"><link rel="stylesheet" href="/assets/sito.css?v={v}">
<style>.vuota{{max-width:640px;margin:0 auto;min-height:100svh;padding:15vh 24px;display:flex;flex-direction:column;gap:14px}}.vuota img{{width:160px;margin-bottom:12px}}.vuota p{{color:var(--matita)}}.vuota a{{color:var(--penna)}}</style>
</head><body><main class="vuota"><img src="/assets/img/gatto-0-aspetta.webp" width="462" height="408" alt=""><h1 style="font-size:3rem">1thing</h1>{righe}</main></body></html>
""")

# il favicon in piccolo, dall'icona dell'app
try:
    from PIL import Image
    ic = Image.open(os.path.join(DIST, 'assets', 'img', 'icona.png')).convert('RGBA')
    ic.resize((32, 32), Image.LANCZOS).save(os.path.join(DIST, 'favicon.ico'), sizes=[(32, 32)])
    ic.resize((180, 180), Image.LANCZOS).save(os.path.join(DIST, 'apple-touch-icon.png'))
except Exception as err:
    print('favicon non fatto:', err)

# intestazioni per Cloudflare Pages o Netlify (gli altri hosting le ignorano)
open(os.path.join(DIST, '_headers'), 'w').write("""/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()

/assets/*
  Cache-Control: public, max-age=604800

/*.html
  Cache-Control: public, max-age=0, must-revalidate
""")

# GitHub Pages: il dominio e niente Jekyll
open(os.path.join(DIST, 'CNAME'), 'w').write(SITO.split('://')[1] + '\n')
open(os.path.join(DIST, '.nojekyll'), 'w').write('')

if mancano:
    print('ATTENZIONE: TITOLARE vuoto in build.py: la privacy mostra «[da completare]».')

# la radice: ognuno alla sua lingua, l'inglese se non è fra le cinque
radice = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>1thing</title>
<link rel="canonical" href="{SITO}/en/">
{chr(10).join(f'<link rel="alternate" hreflang="{HREFLANG[o]}" href="{SITO}/{o}/">' for o in LINGUE)}
<link rel="alternate" hreflang="x-default" href="{SITO}/en/">
<script>
(function(){{var L={json.dumps(LINGUE)},s;try{{s=localStorage.getItem('lingua')}}catch(e){{}}
var a=(navigator.languages||[navigator.language||'en']).map(function(x){{return String(x).slice(0,2).toLowerCase()}});
var l=L.indexOf(s)>=0?s:(a.filter(function(x){{return L.indexOf(x)>=0}})[0]||'en');
location.replace(l+'/'+location.hash)}})();
</script>
<style>body{{background:#f9f5ef;color:#3a322b;font:20px/1.5 system-ui;padding:40px 20px}}a{{color:inherit;margin-right:14px}}</style>
</head><body>
{''.join(f'<a href="{o}/" hreflang="{HREFLANG[o]}">{html.escape(testi[o]["lang_name"])}</a>' for o in LINGUE)}
</body></html>
'''
open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(radice)

# il css e il js della pagina
for f in ['sito.css', 'sito.js']:
    shutil.copy(os.path.join(QUI, f), os.path.join(DIST, 'assets', f))
print('fatto:', ', '.join(LINGUE), 'v', v)
