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
        t = {k: fr_spazi(v_) for k, v_ in t.items()}
    e = {k: html.escape(v_, quote=True) for k, v_ in t.items()}
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
    val = dict(e)
    val.update(lang=lg, site=SITO, v=v, locale=LOCALE[lg], hreflang=hreflang, lang_links=links,
               story_frames=frames, moments=momenti, style_tabs=stili_tab, style_frames=stili_img, track_items=traccia, icons=icone, paintings=quadri, pets=animali, cta=tasto(e),
               cta_small=tasto(e, 'piccolo'), cta_light=tasto(e, 'chiaro'),
               app_head=testa_app(e, 12), app_head_story=testa_app(e, 1),
               js_count=json.dumps(t['done_count'], ensure_ascii=False),
               js_day_of=json.dumps(t['day_of'], ensure_ascii=False),
               js_done=json.dumps(t['painting_done'], ensure_ascii=False))
    out = re.sub(r'\{\{(\w+)\}\}', lambda m: val[m.group(1)], pagina)
    out = out.replace(f'<html lang="{lg}">', f'<html lang="{HREFLANG[lg]}">', 1)
    os.makedirs(os.path.join(DIST, lg), exist_ok=True)
    open(os.path.join(DIST, lg, 'index.html'), 'w', encoding='utf-8').write(out)

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
