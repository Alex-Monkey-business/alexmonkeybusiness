"""Orthophoto -> two channels for the 3100 m square around the summit:
R = rock structure: luminance high-passed over ~40 m (baked large-scale shading removed), 128 = flat.
G = snow/ice: bright and grey, or blue in shadow."""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("source", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("--high-res", nargs="?", type=int, const=4096, choices=(2048, 4096),
                    help="Pack the detail mosaic at the given size (4096 px by default).")
args = parser.parse_args()
folder = args.source / "ortho"
size = args.high_res or 1024
if args.high_res:
    crop = np.load(folder / "mosaic-detail.npy", mmap_mode="r")
else:
    mosaic = np.load(folder / "mosaic.npy", mmap_mode="r")
    c0 = (2615648 - 2612000) // 2
    r0 = (1096000 - 1093474) // 2
    crop = mosaic[r0:r0 + 1550, c0:c0 + 1550]
im = Image.fromarray(crop).resize((size, size), Image.BOX)
rgb = np.asarray(im).astype(np.float32) / 255
r, g, b = rgb.transpose(2, 0, 1)
lum = 0.299 * r + 0.587 * g + 0.114 * b
gray = Image.fromarray((lum * 255).astype(np.uint8))
blur = np.asarray(gray.filter(ImageFilter.GaussianBlur(7 * size / 1024))).astype(np.float32) / 255
hp = np.clip(lum / (blur + 0.03), 0, 2)
rock = np.clip(128 + (hp - 1) * 160, 0, 255)
max_rgb = np.maximum(np.maximum(r, g), b)
min_rgb = np.minimum(np.minimum(r, g), b)
sat = (max_rgb - min_rgb) / (max_rgb + 1e-3)
snow = np.clip((lum - 0.74) / 0.1, 0, 1) * np.clip((0.14 - sat) / 0.06, 0, 1)
shadow_snow = np.clip((b - r - 0.11) / 0.06, 0, 1) * np.clip((lum - 0.18) / 0.12, 0, 1)
ice = np.maximum(snow, shadow_snow) * 255
packed = Image.fromarray(np.dstack([rock, ice, np.zeros_like(rock)]).astype(np.uint8))
packed.save(args.output, "WEBP", quality=76 if args.high_res else 70, method=6)
print(f"{size} × {size}, {args.output.stat().st_size:,} bytes")
packed.resize((768, 768)).save(folder / "packed.png")
