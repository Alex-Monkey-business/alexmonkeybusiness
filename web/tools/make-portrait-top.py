"""The About page's portrait treatment, baked into one image with alpha, so it
can sit on any ground (the climb's summit is sky and rock, not the page's
black): grayscale + the same S-curve, the shadow side coming in from the right
and up from the hem, and the edges dissolving into transparency instead of a
frame. Numbers are the ones in about.css / About.astro.

The shadow side is TRANSPARENCY more than darkness: whatever sky is behind it
fills the shadow, and the page blends the photo by luminosity, so the face
takes the colour of the light it is shown in — blue at noon, violet at dawn,
black under stars."""
import sys, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA').resize((640, 640), Image.LANCZOS)
a = np.asarray(im).astype(np.float32) / 255
lum = a[..., :3] @ np.array([0.299, 0.587, 0.114], np.float32)
curve = np.interp(lum, [0, .25, .5, .75, 1], [0, .05, .40, .74, 1.0])
H, W = lum.shape
x = (np.arange(W) + .5) / W; y = (np.arange(H) + .5) / H
X, Y = np.meshgrid(x, y)
fr = 1 - X  # distance from the right edge, 0..1
right = np.interp(fr, [0, .2, .36, .46, .56, .66, 1], [1, 1, .97, .85, .5, .12, 0])
bottom = np.interp(Y, [0, .5, .88, 1], [0, 0, 1, 1])
shade = np.maximum(right, bottom)
rgb = curve * (1 - 0.45 * shade)
ex = (X - .46) / .72; ey = (Y - .42) / .78
r = np.sqrt(ex ** 2 + ey ** 2)
mask = np.clip((1 - r) / (1 - .40), 0, 1) ** 1.2
alpha = a[..., 3] * mask * (1 - .88 * right) * (1 - bottom)
outa = np.dstack([rgb, rgb, rgb * 1.02, alpha]).clip(0, 1)
Image.fromarray((outa * 255).astype(np.uint8), 'RGBA').save(out, 'WEBP', quality=84, method=6)
import os; print(os.path.getsize(out) // 1024, 'kB')
