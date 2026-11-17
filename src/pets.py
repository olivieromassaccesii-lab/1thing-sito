"""Ritaglia gli animali dal foglio del motore (render/animali3.png, #animali a
scala 3) con la carta trasparente, e mette il gatto nello studio."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
R = 'src/render/'; O = 'dist/assets/img/'
sheet = np.asarray(Image.open(R + 'animali3.png').convert('RGB')).astype(float)
paper = np.array([248, 245, 238], float)

def cut(r, c):
    a = sheet[r*408:(r+1)*408, c*462:(c+1)*462]
    d = np.sqrt(((a - paper) ** 2).sum(-1))
    al = np.clip((d - 14) / 40, 0, 1)
    solid = Image.fromarray(((al > 0.15) * 255).astype('uint8'))
    solid = solid.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
    outside = solid.copy(); ImageDraw.floodfill(outside, (0, 0), 128)
    inside = np.asarray(Image.fromarray(((np.asarray(outside) != 128) * 255).astype("uint8")).filter(ImageFilter.MinFilter(7))).astype(float) / 255
    inside = np.asarray(Image.fromarray((inside * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1))).astype(float) / 255
    alpha = np.maximum(al, inside)
    rgba = np.dstack([a, alpha * 255]).clip(0, 255).astype('uint8')
    return Image.fromarray(rgba)

pets = {}
for r, n in enumerate(['gatto', 'cane', 'pappagallo', 'criceto']):
    for c, t in [(0, 'aspetta'), (4, 'felice')]:
        im = cut(r, c); pets[n, t] = im
        im.resize((308, 272), Image.LANCZOS).save(O + f'{n}-{t}.webp', 'WEBP', quality=85, method=6)
print('alpha angolo', pets['gatto', 'aspetta'].getpixel((2, 2)))

st = Image.open(R + 'studio.png').convert('RGBA')
cat = pets['gatto', 'aspetta']
# sul tappeto, davanti al cavalletto
st.alpha_composite(cat.resize((380, 336), Image.LANCZOS), (300, 1930))
st = st.convert('RGB').crop((0, 150, 1170, 2440))
st.resize((800, round(st.height * 800 / 1170)), Image.LANCZOS).save(O + 'studio.webp', 'WEBP', quality=80, method=6)
print('studio', 800, round(st.height * 800 / 1170))
