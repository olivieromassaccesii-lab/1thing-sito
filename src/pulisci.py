"""Toglie dalle foto dell'app (src/app) le scritte in italiano, così il sito
le può rimettere in ogni lingua: il cartello «come ti chiami?», il
contatore «48 obiettivi», i tasti in alto dello studio, le date del
calendario. Inpainting OpenCV sui soli pixel d'inchiostro nei riquadri."""
import cv2, numpy as np
from PIL import Image
A = 'src/app/'; O = 'dist/assets/img/'
K = 1206 / 300  # i riquadri sono misurati sulla miniatura larga 300

def maschera(img, boxes, soglia=150, allarga=7):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    m = np.zeros(g.shape, np.uint8)
    for b in boxes:
        x0, y0, x1, y1 = b[:4]; t = b[4] if len(b) > 4 else soglia
        X0, Y0, X1, Y1 = [int(v * K) for v in (x0, y0, x1, y1)]
        sub = g[Y0:Y1, X0:X1]
        m[Y0:Y1, X0:X1] = (sub < t).astype(np.uint8) * 255
    return cv2.dilate(m, np.ones((allarga, allarga), np.uint8))

def salva(img, nome, w, crop=None):
    im = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    if crop: im = im.crop(crop)
    im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(O + nome + '.webp', 'WEBP', quality=82, method=6)
    return im.size

STUDIO = [(22, 300, 96, 340, 215), (236, 246, 296, 264), (10, 48, 38, 82, 225), (262, 50, 292, 80)]
for s in ['partenza', 'autunno', 'primavera', 'mare', 'serra']:
    img = cv2.imread(A + f'studio-{s}.png')
    img = cv2.inpaint(img, maschera(img, STUDIO), 9, cv2.INPAINT_TELEA)
    print(s, salva(img, f'studio-{s}', 800))

img = cv2.imread(A + 'calendario.png')
righe = [(0, y - 9, 300, y + 7) for y in (155, 220, 285, 350)]
img = cv2.inpaint(img, maschera(img, righe, soglia=170, allarga=5), 7, cv2.INPAINT_TELEA)
print('cal', salva(img, 'calendario', 700, (0, int(95 * K), 1206, int(478 * K))))

# il widget (WidgetGuide, 12/11): la cornice di foglie senza il testo
img = cv2.imread('/Users/olivieromassaccesi/Desktop/poppi/poppi_claudecode/descrizione-app-2026-11-12/widget.png')
y0, y1, x0, x1 = 1333, 1755, 175, 594
w = img[y0:y1, x0:x1].copy()
g = cv2.cvtColor(w, cv2.COLOR_BGR2GRAY)
m = np.zeros(g.shape, np.uint8)
m[110:320, 100:330] = (g[110:320, 100:330] < 200).astype(np.uint8) * 255
m = cv2.dilate(m, np.ones((7, 7), np.uint8))
w = cv2.inpaint(w, m, 9, cv2.INPAINT_TELEA)
Image.fromarray(cv2.cvtColor(w, cv2.COLOR_BGR2RGB)).resize((420, 420), Image.LANCZOS).save(O + 'widget.webp', 'WEBP', quality=86)
print('widget')

# i momenti della giornata: via la data e il contatore (il sito li riscrive)
for m in ['alba', 'giorno', 'tramonto', 'notte']:
    img = cv2.imread(A + f'momento-{m}.png')
    X0, Y0, X1, Y1 = [int(v * K) for v in (90, 62, 212, 99)]
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    sub = g[Y0:Y1, X0:X1]
    chiaro = sub.mean() < 150
    mm = np.zeros(g.shape, np.uint8)
    mm[Y0:Y1, X0:X1] = ((sub > 190) if chiaro else (sub < 170)).astype(np.uint8) * 255
    mm = cv2.dilate(mm, np.ones((7, 7), np.uint8))
    img = cv2.inpaint(img, mm, 9, cv2.INPAINT_TELEA)
    print(m, salva(img, f'momento-{m}', 700))
