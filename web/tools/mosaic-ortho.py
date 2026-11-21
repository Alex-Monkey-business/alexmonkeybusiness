import argparse
import glob
import re
from pathlib import Path

import numpy as np
from PIL import Image

parser = argparse.ArgumentParser(description="Mosaic SWISSIMAGE tiles in SOURCE/ortho.")
parser.add_argument("source", type=Path)
parser.add_argument("--high-res", action="store_true", help="Mosaic the 0.1 m GeoTIFF downloads around the summit.")
args = parser.parse_args()

if args.high_res:
    # Exact LV95 bounds used by the detail texture, sampled from the 0.4 m COG overview.
    west, south, east, north = 2615648, 1090374, 2618748, 1093474
    pixels_per_km = 2500
    Image.MAX_IMAGE_PIXELS = 10_000 ** 2  # The source COG itself is 10,000 px square.
    size = (east - west) * pixels_per_km // 1000
    mosaic = np.empty((size, size, 3), dtype=np.uint8)
    folder = args.source / "ortho"
    for e in range(west // 1000, (east - 1) // 1000 + 1):
        for n in range(south // 1000, (north - 1) // 1000 + 1):
            tiles = list(folder.glob(f"swissimage-dop10_*_{e}-{n}_0.1_2056.tif"))
            if len(tiles) != 1:
                raise SystemExit(f"Expected one high-resolution tile for {e}-{n}, found {len(tiles)}")
            left, top = e * 1000, (n + 1) * 1000
            x0, x1 = max(west, left), min(east, left + 1000)
            y0, y1 = min(north, top), max(south, top - 1000)
            with Image.open(tiles[0]) as tile:
                if tile.size != (10_000, 10_000):
                    raise SystemExit(f"Unexpected original dimensions in {tiles[0]}")
                tile.seek(2)
                if tile.size != (pixels_per_km, pixels_per_km):
                    raise SystemExit(f"Unexpected overview dimensions in {tiles[0]}")
                crop = tile.crop(tuple(value * pixels_per_km // 1000 for value in (
                    x0 - left, top - y0, x1 - left, top - y1,
                ))).convert("RGB")
            col = (x0 - west) * pixels_per_km // 1000
            row = (north - y0) * pixels_per_km // 1000
            mosaic[row:row + crop.height, col:col + crop.width] = np.asarray(crop)
    np.save(folder / "mosaic-detail.npy", mosaic)
    raise SystemExit(0)

import tifffile

S=str(args.source)
E0,E1,N0,N1=2612,2622,1087,1096
W=(E1-E0)*500;H=(N1-N0)*500
m=np.zeros((H,W,3),np.uint8); have=np.zeros((H,W),bool)
for f in glob.glob(S+'/ortho/*.tif'):
    e,n=map(int,re.search(r'_(\d{4})-(\d{4})_2_2056',f).groups())
    a=tifffile.imread(f)
    if a.ndim==3 and a.shape[0] in (3,4): a=np.moveaxis(a,0,-1)
    a=a[:500,:500,:3]
    r=(N1-1-n)*500;c=(e-E0)*500
    m[r:r+500,c:c+500]=a; have[r:r+500,c:c+500]=a.sum(2)>0
np.save(S+'/ortho/mosaic.npy',m)
print(m.shape,have.mean())
# crop around summit
r0,c0=(N1*1000-1091674)//2,(2617048-E0*1000)//2
Image.fromarray(m[r0-800:r0+800,c0-800:c0+800]).resize((800,800)).save(S+'/ortho/peek.png')
