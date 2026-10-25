# Fill Italy into the coarse height file. swissALTI3D stops at the border and
# pack-dem.py filled the rest with a flat floor at 2300 m: seen from the Zmutt
# side, the background behind the mountain was a grey plain. This takes the
# Copernicus GLO-30 DSM (30 m, open; tile N45 E007 from
# copernicus-dem-30m.s3.amazonaws.com), samples it on the same LV95 grid,
# levels it to the Swiss data along the border and puts it where the floor was.
#   python fill-italy.py public/hero/matterhorn-dem.webp cop.tif out.webp
# Needs numpy, pillow, tifffile, imagecodecs.
import sys, numpy as np, tifffile
from PIL import Image
src, cop, out = sys.argv[1:4]
N = 1024; PX = 8000 / N; E0, N1 = 2613000, 1096000

rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.int32)
h = (rgb[..., 0] * 256 + rgb[..., 1]) / 4 + 1500
floor = h == 2300

# The grid in LV95, then WGS84 by swisstopo's approximate formulas (~1 m).
j, i = np.meshgrid(np.arange(N), np.arange(N))
E = E0 + (j + 0.5) * PX; Nn = N1 - (i + 0.5) * PX
y = (E - 2600000) / 1e6; x = (Nn - 1200000) / 1e6
lon = (2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x * x - 0.0436 * y ** 3) * 100 / 36
lat = (16.9023892 + 3.238272 * x - 0.270978 * y * y - 0.002528 * x * x - 0.0447 * y * y * x - 0.0140 * x ** 3) * 100 / 36

# Copernicus: pixel-is-point, (0, 0) at 7°E 46°N, one arc-second. Bilinear.
c = tifffile.imread(cop).astype(np.float64)
cc = (lon - 7) * 3600; rr = (46 - lat) * 3600
r0 = np.floor(rr).astype(int); c0 = np.floor(cc).astype(int); fr = rr - r0; fc = cc - c0
g = lambda a, b: c[np.clip(a, 0, 3599), np.clip(b, 0, 3599)]
k = (g(r0, c0) * (1 - fc) + g(r0, c0 + 1) * fc) * (1 - fr) + (g(r0 + 1, c0) * (1 - fc) + g(r0 + 1, c0 + 1) * fc) * fr

# Level: the mean difference over Swiss texels within ~250 m of the floor.
def grow(m, n):
    m = m.copy()
    for _ in range(n):
        m[1:] |= m[:-1]; m[:-1] |= m[1:]; m[:, 1:] |= m[:, :-1]; m[:, :-1] |= m[:, 1:]
    return m
band = grow(floor, 32) & ~floor
off = np.median(h[band] - k[band])
k += off
print('floor', floor.mean().round(3), 'offset', round(off, 2), 'm, band rms', round(float(np.sqrt(np.mean((h[band] - k[band]) ** 2))), 1))

# Into the floor, and feathered over the first few Swiss texels so the seam
# does not stand as a step.
f = h.copy(); f[floor] = k[floor]
w = np.zeros((N, N)); ring = floor.copy()
for d in range(1, 5):
    nxt = grow(ring, 1); new = nxt & ~ring; w[new] = 1 - d / 5; ring = nxt
f = np.where(floor, f, h * (1 - w) + k * w)

q = np.clip(np.round((f - 1500) * 4), 0, 65535).astype(np.uint16)
o = np.dstack([(q >> 8).astype(np.uint8), (q & 255).astype(np.uint8), np.zeros_like(q, np.uint8)])
Image.fromarray(o).save(out, 'WEBP', lossless=True, quality=100, method=6)
print('min', f.min().round(), 'max', f.max().round())
