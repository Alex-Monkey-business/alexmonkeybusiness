# The Alps around the map: 40 x 40 km centred on the summit at 78 m, from the
# Copernicus GLO-30 DSM (tiles N45 E007 and N46 E007,
# copernicus-dem-30m.s3.amazonaws.com). Behind the 8 km map it is the horizon
# — Weisshorn, Dent Blanche, Monte Rosa — instead of haze, and from high above
# it is the map the climb pulls out to. R/G = high/low byte of h x 2.
#   python pack-far.py cop45.tif cop46.tif out.webp
# Needs numpy, pillow, tifffile, imagecodecs.
import sys, numpy as np, tifffile
from PIL import Image
t45, t46, out = sys.argv[1:4]
N = 512; SPAN = 40000; PX = SPAN / N; SE, SN = 2617048, 1091674
tiles = [(tifffile.imread(t45).astype(np.float64), 46.0), (tifffile.imread(t46).astype(np.float64), 47.0)]

def sample(x, yy):
    """Copernicus at summit-relative metres, bilinear, from whichever tile."""
    y = (SE + x - 2600000) / 1e6; xx = (SN + yy - 1200000) / 1e6
    lon = (2.6779094 + 4.728982 * y + 0.791484 * y * xx + 0.1306 * y * xx * xx - 0.0436 * y ** 3) * 100 / 36
    lat = (16.9023892 + 3.238272 * xx - 0.270978 * y * y - 0.002528 * xx * xx - 0.0447 * y * y * xx - 0.0140 * xx ** 3) * 100 / 36
    h = np.zeros_like(x)
    for c, top in tiles:
        rr = (top - lat) * 3600; cc = (lon - 7) * 3600
        # Up to the last row: the next tile's first row is the same latitude.
        m = (rr >= 0) & (rr < 3600) & (cc >= 0) & (cc < 3599)
        r0 = np.minimum(np.floor(rr[m]).astype(int), 3598); c0 = np.floor(cc[m]).astype(int); fr = np.minimum(rr[m] - r0, 1); fc = cc[m] - c0
        h[m] = (c[r0, c0] * (1 - fc) + c[r0, c0 + 1] * fc) * (1 - fr) + (c[r0 + 1, c0] * (1 - fc) + c[r0 + 1, c0 + 1] * fc) * fr
    return h

# Each texel the mean of 3 x 3 samples, so the 30 m data is filtered, not picked.
j, i = np.meshgrid(np.arange(N), np.arange(N))
acc = np.zeros((N, N))
for a in (-1, 0, 1):
    for b in (-1, 0, 1):
        acc += sample(-SPAN / 2 + (j + 0.5 + a / 3) * PX, SPAN / 2 - (i + 0.5 + b / 3) * PX)
h = acc / 9
q = np.clip(np.round(h * 2), 0, 65535).astype(np.uint16)
o = np.dstack([(q >> 8).astype(np.uint8), (q & 255).astype(np.uint8), np.zeros_like(q, np.uint8)])
Image.fromarray(o).save(out, 'WEBP', lossless=True, quality=100, method=6)
print('min', h.min().round(), 'max', h.max().round(), 'at', np.unravel_index(h.argmax(), h.shape))
