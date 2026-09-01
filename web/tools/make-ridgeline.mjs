/**
 * Terrain → ridgeline plot ("joy plot") SVG.
 *
 * Sibling to make-contours.mjs and shares its whole front half: same open DEM
 * tiles, same terrarium decode in Chrome, same box blur. What differs is the
 * cut. Contours follow lines of equal height across the map and give you a
 * plan view — correct, and unreadable as terrain to anyone who does not read
 * maps, because a plan view carries no depth cue at all. This tool cuts the
 * same grid into parallel vertical profiles and stacks them back to front, so
 * the depth cue is the drawing.
 *
 * Three things make it read as a mountain rather than a chart:
 *
 *   1. Hidden-line removal. Every ridge is a filled shape in the page colour
 *      with a stroked top edge, painted far to near, so a near ridge simply
 *      covers what stands behind it. This is what separates a mountain from
 *      forty overlapping squiggles, and it needs no clipping maths.
 *   2. Perspective. Near rows are drawn slightly wider than far ones. It is
 *      one multiply and it does more for the illusion than any other knob.
 *   3. An arbitrary bearing. The grid is sampled through a rotated frame, so
 *      the view is not stuck on the compass points — the Matterhorn only has
 *      its famous silhouette from the north-east.
 *
 *   node tools/make-ridgeline.mjs --name matterhorn \
 *     --lat 45.9766 --lon 7.6585 --bearing 45
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

const NAME = args.name ?? 'ridgeline';
const LAT = Number(args.lat ?? 45.9766);
const LON = Number(args.lon ?? 7.6585);
const ZOOM = Number(args.zoom ?? 12);
/** Odd, so the tile block centres on the peak instead of hanging off it. */
const SPAN = Number(args.span ?? 3);
/** Depth of the sampled window in grid pixels — how far the stack reaches. */
const BOX = Number(args.box ?? 420);
/**
 * Width of the window as a multiple of its depth. A square sample makes a
 * square drawing, and a square drawing cannot be a band across the bottom of
 * a screen: fitted into one it stops far short of both sides. Widening the
 * across-axis is also the truer view — standing below a peak you take in far
 * more of it sideways than in depth.
 */
const WIDE = Number(args.wide ?? 1);
/** Compass direction the viewer stands in. 45 = north-east. */
const BEARING = Number(args.bearing ?? 45);
/**
 * Profiles drawn. Under ~30 it reads as a chart; around 46 it reads as a
 * mountain drawing.
 *
 * ABOVE ~150 IT BECOMES SOMETHING ELSE, and it is worth knowing that it is a
 * different picture rather than more of the same one. At engraved density the
 * eye stops following individual profiles and starts reading the field as a
 * shaded surface — which is exactly the depth cue a plan-view contour map
 * cannot give (see make-contours.mjs, and the reason its output was rejected).
 * Density does the work that hachure does in nineteenth-century cartography.
 *
 * The trade is legibility of the SUBJECT: a dense field of a whole range is a
 * texture, and there is no single silhouette left in it to point at. Which
 * picture you want decides `--lines` and `--pitch` together, because pitch has
 * to come down as lines go up or the drawing grows taller than the screen.
 *
 *   drawing   --lines 46  --pitch 9    a mountain, one silhouette
 *   engraved  --lines 220 --pitch 2    a range, a surface, no subject
 */
const LINES = Number(args.lines ?? 46);
/** Points sampled along each profile before simplification. */
const SAMPLES = Number(args.samples ?? 240);
/** Height of the full elevation range, in SVG units. */
const AMP = Number(args.amp ?? 300);
/** Vertical distance between stacked rows, in SVG units. */
const PITCH = Number(args.pitch ?? 9);
/**
 * Shifts the sampled window toward the viewer, as a fraction of the box, so
 * the peak sits at the FAR edge rather than in the middle. This is the single
 * most important knob in the file. A summit sampled at the centre gets buried:
 * the rows in front of it are drawn lower down the page and cover it, and the
 * result is a nice piece of terrain that happens to contain a mountain. Pushed
 * to the back, everything else stands below it and the silhouette is the
 * subject.
 */
const PUSH = Number(args.push ?? 0.32);
/** How much wider the nearest row is than the farthest. 0 = flat elevation. */
const PERSP = Number(args.persp ?? 0.16);
const TOL = Number(args.tol ?? 0.6);
/** Box-blur radius. 0 keeps the rock; the contour tool needs 2, this one does
    not, because a silhouette tolerates jaggedness that a closed curve cannot. */
const BLUR = Number(args.blur ?? 1);
/**
 * A FOREGROUND FIR BAND. Conifers scattered along the nearest profiles, each
 * one standing on the terrain it was placed on.
 *
 * This is not decoration — it is the scale cue the drawing otherwise has none
 * of. A stack of ridges is scaleless: the same picture works as a dune field
 * or as the Alps, and the eye has nothing to measure against. One recognisable
 * object of known size in the front row settles it, and settles the depth of
 * everything behind it at the same time.
 *
 * They are placed with a seeded PRNG, so re-running the tool does not reshuffle
 * the forest. 0 turns the band off.
 */
const FIRS = Number(args.firs ?? 0);
/** How many of the nearest rows carry firs. */
const FIR_ROWS = Number(args['fir-rows'] ?? 9);
/** Height of a fir on the nearest row, in SVG units. Far rows scale down. */
const FIR_SIZE = Number(args['fir-size'] ?? 13);
const SEED = Number(args.seed ?? 7);
const OUT = args.out ?? `src/assets/terrain/${NAME}.svg`;

const WIDTH = 1000;

/* ---- tile maths (Web Mercator, standard slippy-map scheme) ---- */
const n = 2 ** ZOOM;
const latRad = (LAT * Math.PI) / 180;
const fx = ((LON + 180) / 360) * n;
const fy = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
const cx = Math.floor(fx);
const cy = Math.floor(fy);
const x0 = cx - Math.floor(SPAN / 2);
const y0 = cy - Math.floor(SPAN / 2);
/* Where the peak actually lands inside the stitched grid, to the pixel. The
   contour tool did not need this — a centred crop does. */
const peakPx = (fx - x0) * 256;
const peakPy = (fy - y0) * 256;

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

console.log(`${NAME}: z${ZOOM} ${SPAN}×${SPAN} tiles from ${x0}/${y0}, bearing ${BEARING}°`);

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

const result = await page.evaluate(
  async (o) => {
    const TILE = 256;
    const size = TILE * o.span;

    /* ---- stitch and decode ---- */
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    await Promise.all(
      o.tiles.map(
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
    for (let i = 0; i < size * size; i++) {
      grid[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768;
    }

    /* ---- smooth ----
       Lighter than the contour tool's blur. A profile is read as a silhouette
       rather than as a closed curve, so it tolerates — and wants — more of the
       real jaggedness of rock. */
    const blur = Float64Array.from(grid);
    const tmp = new Float64Array(size * size);
    if (o.blur > 0) {
    const R = o.blur;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let s = 0;
        for (let k = -R; k <= R; k++) s += blur[y * size + Math.min(size - 1, Math.max(0, x + k))];
        tmp[y * size + x] = s / (R * 2 + 1);
      }
    }
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        let s = 0;
        for (let k = -R; k <= R; k++) s += tmp[Math.min(size - 1, Math.max(0, y + k)) * size + x];
        blur[y * size + x] = s / (R * 2 + 1);
      }
    }
    }

    const sample = (x, y) => {
      /* Bilinear. The rotated frame lands between grid cells on almost every
         sample, and nearest-neighbour there puts visible stair-steps along
         every ridge. */
      const xi = Math.min(size - 2, Math.max(0, Math.floor(x)));
      const yi = Math.min(size - 2, Math.max(0, Math.floor(y)));
      const tx = Math.min(1, Math.max(0, x - xi));
      const ty = Math.min(1, Math.max(0, y - yi));
      const a = blur[yi * size + xi];
      const b = blur[yi * size + xi + 1];
      const c = blur[(yi + 1) * size + xi];
      const d = blur[(yi + 1) * size + xi + 1];
      return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
    };

    /* ---- the rotated frame ----
       Map axes are east/north; the grid's y runs south, hence the sign flips.
       `right` is the viewer's right hand, `fwd` points from the viewer into
       the scene, so stepping along +fwd walks away from the camera. */
    const th = (o.bearing * Math.PI) / 180;
    const right = [-Math.cos(th), -Math.sin(th)];
    const fwd = [-Math.sin(th), Math.cos(th)];
    const halfU = (o.box * o.wide) / 2;
    const halfV = o.box / 2;
    /* Positive `push` walks the window's centre toward the camera. */
    const shift = -o.push * o.box;

    /* First pass: heights only, so the vertical scale is fitted to what is
       actually in frame rather than to the whole tile block. */
    const rows = [];
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = 0; j < o.lines; j++) {
      /* j = 0 is the far edge. */
      const dv = halfV - (j / (o.lines - 1)) * o.box;
      const row = [];
      for (let i = 0; i < o.samples; i++) {
        const du = -halfU + (i / (o.samples - 1)) * o.box * o.wide;
        const gx = o.peakPx + du * right[0] + (dv + shift) * fwd[0];
        const gy = o.peakPy + du * right[1] + (dv + shift) * fwd[1];
        const h = sample(gx, gy);
        if (h < lo) lo = h;
        if (h > hi) hi = h;
        row.push(h);
      }
      rows.push(row);
    }

    const span = hi - lo || 1;

    /* ---- project ---- */
    const W = o.width;
    const H = Math.round(o.amp + (o.lines - 1) * o.pitch + o.pitch * 2);
    const projected = rows.map((row, j) => {
      const near = j / (o.lines - 1);              // 0 far → 1 near
      const scale = 1 - o.persp * (1 - near);      // near rows sit wider
      const base = o.pitch + o.amp + j * o.pitch;
      return row.map((h, i) => {
        const u = i / (o.samples - 1) - 0.5;
        return [W / 2 + u * W * scale, base - ((h - lo) / span) * o.amp];
      });
    });

    /* ---- simplify ----
       Same Douglas–Peucker as the contour tool, on open polylines instead of
       closed rings. */
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
          const [pxx, pyy] = pts[i];
          let d;
          if (len === 0) {
            d = (pxx - ax) ** 2 + (pyy - ay) ** 2;
          } else {
            let t = ((pxx - ax) * dx + (pyy - ay) * dy) / len;
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            d = (pxx - (ax + t * dx)) ** 2 + (pyy - (ay + t * dy)) ** 2;
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

    const fmt = (v) => Math.round(v * 10) / 10;

    /**
     * THE FIR BAND.
     *
     * Mulberry32 rather than Math.random: the forest has to be the same forest
     * on every run, or a re-trace reshuffles every tree and the drawing is not
     * the same drawing.
     */
    let seed = o.seed >>> 0;
    const rnd = () => {
      seed = (seed + 0x6d2b79f5) >>> 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    /* A two-tier conifer, drawn as one closed silhouette. Two tiers is the
       fewest that still reads as a conifer rather than as a triangle, and at
       the sizes in play — six to thirteen units — a third tier is mud. */
    const fir = (x, y, h) => {
      const w = h * 0.30;
      return (
        `M${fmt(x - w)} ${fmt(y)}` +
        `L${fmt(x - w * 0.42)} ${fmt(y - h * 0.44)}` +
        `L${fmt(x - w * 0.72)} ${fmt(y - h * 0.42)}` +
        `L${fmt(x)} ${fmt(y - h)}` +
        `L${fmt(x + w * 0.72)} ${fmt(y - h * 0.42)}` +
        `L${fmt(x + w * 0.42)} ${fmt(y - h * 0.44)}` +
        `L${fmt(x + w)} ${fmt(y)}Z`
      );
    };

    const ridges = projected.map((pts, j) => {
      const s = rdp(pts, o.tol);
      const line = 'M' + s.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L');
      /* The mask closes down past the bottom edge, never along it, so the
         shape has no visible foot of its own. */
      const fill = `${line}L${fmt(s[s.length - 1][0])} ${H + 40}L${fmt(s[0][0])} ${H + 40}Z`;

      /**
       * Firs live INSIDE the ridge group, after its own line — so the next
       * row's opaque mask paints over them. That is the same hidden-line trick
       * the ridges use, and it is what makes a tree on the fourth row from the
       * front peek over the third row instead of floating on top of it.
       *
       * They stand on the UNSIMPLIFIED profile, sampled at the tree's own x,
       * because Douglas–Peucker moves the line by up to a tolerance and a tree
       * hovering half a unit above the ground is the one error the eye catches
       * immediately.
       */
      const near = j / (o.lines - 1);
      const rowsFromFront = o.lines - 1 - j;
      const firs = [];
      if (o.firs > 0 && rowsFromFront < o.firRows) {
        /* Front row gets the most, and it thins out backwards — a band, not a
           uniform sprinkle, which is how a treeline actually sits. */
        const share = 1 - rowsFromFront / o.firRows;
        const count = Math.round((o.firs / o.firRows) * share * 2);
        for (let k = 0; k < count; k++) {
          const t = rnd();
          const i = Math.min(pts.length - 1, Math.max(0, Math.round(t * (pts.length - 1))));
          const [fx2, fy2] = pts[i];
          /* Size jitters ±22%, and scales with the row's own perspective, so
             the band has depth inside itself rather than reading as a row of
             identical stamps. */
          const h = o.firSize * (0.55 + 0.45 * near) * (0.78 + rnd() * 0.44);
          firs.push(fir(fx2, fy2 + h * 0.06, h));
        }
      }

      return { j, line, fill, firs, points: s.length };
    });

    return { W, H, lo: Math.round(lo), hi: Math.round(hi), ridges };
  },
  {
    tiles,
    span: SPAN,
    box: BOX,
    wide: WIDE,
    bearing: BEARING,
    lines: LINES,
    samples: SAMPLES,
    amp: AMP,
    pitch: PITCH,
    push: PUSH,
    persp: PERSP,
    tol: TOL,
    blur: BLUR,
    firs: FIRS,
    firRows: FIR_ROWS,
    firSize: FIR_SIZE,
    seed: SEED,
    width: WIDTH,
    peakPx,
    peakPy,
  },
);

await browser.close();

const { W, H, lo, hi, ridges } = result;
const pts = ridges.reduce((a, r) => a + r.points, 0);
const firCount = ridges.reduce((a, r) => a + r.firs.length, 0);
console.log(
  `elevation ${lo}–${hi} m · ${ridges.length} ridges · ${pts} points` +
    (firCount ? ` · ${firCount} firs` : ''),
);

/* Far to near in document order, which is also paint order — the hidden-line
   removal is nothing more than that plus an opaque fill. `data-i` lets a page
   stagger the reveal in the same direction. */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" aria-hidden="true">
  <title>${NAME} — ${lo}–${hi} m, viewed from ${BEARING}°</title>
${ridges
  .map(
    (r) => `  <g class="ridge" data-i="${r.j}" style="--i:${r.j}">
    <path class="ridge-mask" d="${r.fill}"/>
    <path class="ridge-line" d="${r.line}"/>${r.firs
      .map((d) => `\n    <path class="fir" d="${d}"/>`)
      .join('')}
  </g>`,
  )
  .join('\n')}
</svg>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`wrote ${OUT} · ${(svg.length / 1024).toFixed(0)} kB`);
