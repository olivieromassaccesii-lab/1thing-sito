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

def tasto(t):
    if APP_STORE:
        return f'<a class="tasto" href="{APP_STORE}">{t["cta_store"]}</a>'
    return f'<span class="tasto tasto--attesa">{t["cta_soon"]}</span>'

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
    strip = '\n    '.join(
        f'<figure role="listitem"><img src="../assets/img/giorno-{d}.webp" width="420" height="876" loading="lazy" alt="">'
        f'<figcaption>{e["day"].replace("{d}", str(d))}</figcaption></figure>' for d in GIORNI)
    quadri = '\n    '.join(
        f'<li><div class="cornice"><img src="../assets/img/{p}.webp" width="600" height="1354" loading="lazy" alt=""></div>'
        f'<span>{e["p_" + p]}</span></li>' for p in DIPINTI)
    animali = '\n      '.join(
        f'<li><button class="animale" type="button" aria-label="{e["pet_" + a]}">'
        f'<img src="../assets/img/{a}-aspetta.webp" width="154" height="136" loading="lazy" alt="">'
        f'<img src="../assets/img/{a}-felice.webp" width="154" height="136" loading="lazy" alt=""></button>'
        f'<span aria-hidden="true">{e["pet_" + a]}</span></li>' for a in ANIMALI)
    val = dict(e)
    val.update(lang=lg, site=SITO, v=v, locale=LOCALE[lg], hreflang=hreflang, lang_links=links,
               strip=strip, paintings=quadri, pets=animali, cta=tasto(e),
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
