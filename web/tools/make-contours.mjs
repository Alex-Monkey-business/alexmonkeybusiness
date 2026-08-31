/**
 * Terrain → contour SVG.
 *
 * Takes a place (lat/lon), pulls open elevation tiles, and writes a handful of
 * nested contour lines as one SVG. Build-time only — nothing here ships.
 *
 * Data: AWS Open Data "elevation-tiles-prod", terrarium encoding. Global, 30m
 * (Copernicus/SRTM under the hood), no key and no account, which is why it is
 * used here instead of Mapbox Terrain-RGB.
 *
 * Elevation is packed into the pixel as
 *   metres = red * 256 + green + blue / 256 - 32768
 *
 * The decode runs in Chrome rather than a native image library, so this tool
 * needs no compiled dependency — Playwright is already in the project for the
 * screenshot work. d3-contour does the marching squares; writing that by hand
 * gets the rings right about 90% of the time, which is the bad 10%.
 *
 *   node tools/make-contours.mjs --name tignes --lat 45.4685 --lon 6.9059
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const NAME = args.name ?? 'terrain';
const LAT = Number(args.lat ?? 45.4685);
const LON = Number(args.lon ?? 6.9059);
const ZOOM = Number(args.zoom ?? 11);
/** Tiles per side. 2 at z11 is roughly 19 km across — one massif. */
const SPAN = Number(args.span ?? 2);
/** How many lines end up in the file. A frame wants ten, not three hundred. */
const LINES = Number(args.lines ?? 12);
/** Simplify tolerance in grid pixels. Straight from 438 kB to ~20 kB. */
const TOL = Number(args.tol ?? 1.5);
/** Rings shorter than this are lake-sized specks; they read as dirt. */
const MIN_RING = Number(args.minRing ?? 60);
/**
 * Largest rings kept per elevation. This is the knob that decides whether the
 * result is a frame or wallpaper. Ten elevations across a whole massif produce
 * several hundred rings — correct as a map, unusable as a page element,
 * because the eye reads density as texture. Keeping the two or three biggest
 * rings per level leaves the nested-curve shape and throws away the noise.
 */
const KEEP = Number(args.keep ?? 3);
const OUT = args.out ?? `src/assets/terrain/${NAME}.svg`;

/* ---- tile maths (Web Mercator, standard slippy-map scheme) ---- */
const n = 2 ** ZOOM;
const latRad = (LAT * Math.PI) / 180;
const cx = Math.floor(((LON + 180) / 360) * n);
const cy = Math.floor(
  ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
);
/* Centre the block on the place rather than hanging it off the corner. */
const x0 = cx - Math.floor((SPAN - 1) / 2);
const y0 = cy - Math.floor((SPAN - 1) / 2);

const urls = [];
for (let dy = 0; dy < SPAN; dy++) {
  for (let dx = 0; dx < SPAN; dx++) {
    urls.push({
      dx,
      dy,
      url: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${ZOOM}/${x0 + dx}/${y0 + dy}.png`,
    });
  }
}

console.log(`${NAME}: z${ZOOM} tiles ${x0}..${x0 + SPAN - 1} / ${y0}..${y0 + SPAN - 1}`);

/* Fetched here and handed to the page as data URIs, so the browser makes no
   network requests of its own and the tool works behind a proxy. */
const tiles = await Promise.all(
  urls.map(async (t) => {
    const res = await fetch(t.url);
    if (!res.ok) throw new Error(`${t.url} → ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return { ...t, data: `data:image/png;base64,${buf.toString('base64')}` };
  }),
);
console.log(`fetched ${tiles.length} tiles`);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/d3-contour@4/dist/d3-contour.min.js' });

const result = await page.evaluate(async ({ tiles, span, lines, tol, minRing, keep }) => {
  const TILE = 256;
  const size = TILE * span;

  /* ---- stitch and decode ---- */
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  await Promise.all(
    tiles.map(
      (t) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, t.dx * TILE, t.dy * TILE);
            resolve();
          };
          img.onerror = reject;
          img.src = t.data;
        }),
    ),
  );

  const px = ctx.getImageData(0, 0, size, size).data;
  const grid = new Float64Array(size * size);
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < size * size; i++) {
    const r = px[i * 4];
    const g = px[i * 4 + 1];
    const b = px[i * 4 + 2];
    const m = r * 256 + g + b / 256 - 32768;
    grid[i] = m;
    if (m < min) min = m;
    if (m > max) max = m;
  }

  /* ---- smooth ----
     A raw 30m grid gives contours with a permanent case of the shivers. Two
     passes of a small box blur turn them into lines a person would draw, and
     cost far less detail than dropping the zoom level would. */
  const blurred = Float64Array.from(grid);
  const tmp = new Float64Array(size * size);
  const R = 2;
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0;
        let count = 0;
        for (let k = -R; k <= R; k++) {
          const xx = Math.min(size - 1, Math.max(0, x + k));
          sum += blurred[y * size + xx];
          count++;
        }
        tmp[y * size + x] = sum / count;
      }
    }
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        let sum = 0;
        let count = 0;
        for (let k = -R; k <= R; k++) {
          const yy = Math.min(size - 1, Math.max(0, y + k));
          sum += tmp[yy * size + x];
          count++;
        }
        blurred[y * size + x] = sum / count;
      }
    }
  }

  /* ---- contour ----
     Thresholds are placed on a round interval rather than evenly across the
     range, so the lines land on numbers a map would use (2200 m, 2400 m) and
     stay put when the bounding box moves a little. */
  const rough = (max - min) / (lines + 1);
  const step = [25, 50, 100, 150, 200, 250, 500].find((s) => s >= rough) ?? 500;
  const thresholds = [];
  for (let v = Math.ceil(min / step) * step; v < max; v += step) thresholds.push(v);

  const contours = d3.contours().size([size, size]).thresholds(thresholds)(blurred);

  /* ---- simplify ----
     Marching squares walks the grid cell by cell, so every ring arrives as a
     staircase of one-pixel steps: correct, and 438 kB of correct. Douglas–
     Peucker keeps the points that carry the shape and drops the rest. At a
     tolerance of ~1.5 grid pixels the line is visually identical and the file
     is twenty times smaller. */
  const rdp = (pts, tol) => {
    if (pts.length < 3) return pts;
    const sq = tol * tol;
    const keep = new Uint8Array(pts.length);
    keep[0] = 1;
    keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop();
      const [ax, ay] = pts[a];
      const [bx, by] = pts[b];
      const dx = bx - ax;
      const dy = by - ay;
      const len = dx * dx + dy * dy;
      let far = -1;
      let best = 0;
      for (let i = a + 1; i < b; i++) {
        const [px, py] = pts[i];
        /* Perpendicular distance, squared — no sqrt in the inner loop. A
           degenerate segment (a === b, which closed rings produce) falls back
           to distance from the endpoint. */
        let d;
        if (len === 0) {
          d = (px - ax) ** 2 + (py - ay) ** 2;
        } else {
          let t = ((px - ax) * dx + (py - ay) * dy) / len;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          d = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2;
        }
        if (d > best) {
          best = d;
          far = i;
        }
      }
      if (best > sq && far > 0) {
        keep[far] = 1;
        stack.push([a, far], [far, b]);
      }
    }
    return pts.filter((_, i) => keep[i]);
  };

  /* Coordinates rounded to one decimal: at this scale the second decimal is
     smaller than a hair's width on screen and doubles the file. */
  const fmt = (v) => Math.round(v * 10) / 10;

  /* Shoelace: ranks rings by enclosed area so `keep` takes the biggest, not
     the first ones the scan happened to close. Absolute value, because a hole
     winds the other way and is just as worth keeping. */
  const area = (ring) => {
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    }
    return Math.abs(a / 2);
  };

  const paths = contours
    .map((c) => {
      const rings = c.coordinates
        .flat()
        .filter((r) => r.length >= 8 && area(r) >= minRing * minRing)
        .sort((a, b) => area(b) - area(a))
        .slice(0, keep)
        .map((r) => rdp(r, tol))
        .filter((r) => r.length >= 4)
        .map((r) => 'M' + r.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L') + 'Z');
      return { value: c.value, d: rings.join('') };
    })
    .filter((p) => p.d.length > 40);

  return { size, min: Math.round(min), max: Math.round(max), step, paths };
}, { tiles, span: SPAN, lines: LINES, tol: TOL, minRing: MIN_RING, keep: KEEP });

await browser.close();

const { size, min, max, step, paths } = result;
console.log(`elevation ${min}–${max} m · interval ${step} m · ${paths.length} lines`);

/* One <path> per elevation, carrying its height as a data attribute so a page
   can stagger the reveal from the valley floor upward. */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none" aria-hidden="true">
  <title>${NAME} — ${min}–${max} m, ${step} m interval</title>
  <g stroke="currentColor" stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke">
${paths.map((p, i) => `    <path data-m="${p.value}" style="--i:${i}" d="${p.d}"/>`).join('\n')}
  </g>
</svg>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`wrote ${OUT} · ${(svg.length / 1024).toFixed(0)} kB`);
