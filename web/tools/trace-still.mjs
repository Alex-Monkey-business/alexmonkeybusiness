/**
 * Still photograph → skyline, on colour rather than on luminance.
 *
 * `trace-skyline.mjs` works on video: it needs 24 frames because the ridge in
 * that clip sits in cloud and only a per-column median across time finds it.
 * The kuhnmi still has no cloud and a sky that is almost without red — blue/red
 * 3.7 and up everywhere sampled, where rock, lit or in shadow, is 2.0 and
 * below. So the edge is one question per column: the first row from the top
 * where the pixel stops being blue. Luminance would not do it — shadow rock
 * (84) and sky (68) are sixteen units apart, and the haze low on the left lifts
 * the sky past the rock.
 *
 * TWO LINES COME OUT, from one measurement:
 *
 *   --out-sky    the full-width edge, for `make-plate.mjs --mask-svg`. It cuts
 *                the sky out of the plate so that everything above the ridge is
 *                exactly #000 — including the hazy corner that a levels crush
 *                leaves at 12 rather than 0. Narrow spikes are removed first:
 *                the two lift pylons on the slope are 20 px wide and would
 *                otherwise be kept as mountain.
 *   --out        the ridges as the menu draws them, cut to `--x0 … --x1`. The
 *                trace runs on past both points, onto the foreground spurs, and
 *                those are not the Matterhorn: the segments are defined as
 *                "left of the summit" and "right of the summit", so a line that
 *                followed the spur back up would light a route that does not
 *                exist.
 *
 *   node tools/trace-still.mjs --src tools/source/matterhorn-kuhnmi.jpg \
 *     --x0 680 --x1 1896 \
 *     --out src/assets/terrain/matterhorn-still.svg \
 *     --out-sky src/assets/terrain/matterhorn-still-sky.svg
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, x, i, arr) => {
    if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1]]);
    return a;
  }, []),
);
const SRC = args.src ?? 'tools/source/matterhorn-kuhnmi.jpg';
const OUT = args.out ?? 'src/assets/terrain/matterhorn-still.svg';
const OUTSKY = args['out-sky'] ?? 'src/assets/terrain/matterhorn-still-sky.svg';
/** Sky is blue/red ≥ 3.7, rock ≤ 2.0 — 2.8 sits between them. */
const RATIO = Number(args.ratio ?? 2.8);
/** Rows the edge has to hold before it counts. Kills JPEG sparkle in the sky. */
const RUN = Number(args.run ?? 5);
/** Simplification tolerance in px. 0.7 keeps every real kink and drops the stairs. */
const EPS = Number(args.eps ?? 0.7);
/** Features narrower than this many columns are removed from the sky line. */
const SPIKE = Number(args.spike ?? 40);

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const R = (x, y) => data[(y * W + x) * 3];
const B = (x, y) => data[(y * W + x) * 3 + 2];

/* 1. per column, first non-blue run from the top */
const edge = new Array(W).fill(H);
for (let x = 0; x < W; x++) {
  let run = 0;
  for (let y = 0; y < H; y++) {
    const r = R(x, y);
    if (B(x, y) < r * RATIO && r > 12) {
      if (++run >= RUN) { edge[x] = y - RUN + 1; break; }
    } else run = 0;
  }
}

/* 2. median over five columns — a one-column spike is noise, not terrain */
const med = edge.map((_, x) => {
  const w = [];
  for (let k = -2; k <= 2; k++) w.push(edge[Math.min(W - 1, Math.max(0, x + k))]);
  return w.sort((a, b) => a - b)[2];
});

/* 3. the sky line: also drop anything narrower than SPIKE that sticks UP.
   A morphological closing on y — a running max, then a running min — removes
   every upward feature narrower than the window and leaves broad ones alone.
   It also shaves a few pixels off a genuinely sharp top, which the summit is,
   so the closed value is only taken where it removed something tall: a pylon
   is 30 px high and 15 wide, the summit loses 3 px and keeps its own line. */
const half = SPIKE >> 1;
const dil = med.map((_, x) => {
  let m = -1;
  for (let k = -half; k <= half; k++) m = Math.max(m, med[Math.min(W - 1, Math.max(0, x + k))]);
  return m;
});
const closed = dil.map((_, x) => {
  let m = Infinity;
  for (let k = -half; k <= half; k++) m = Math.min(m, dil[Math.min(W - 1, Math.max(0, x + k))]);
  return m;
});
const sky = med.map((y, x) => (closed[x] - y > 8 ? closed[x] : y));
let removed = 0;
for (let x = 0; x < W; x++) if (sky[x] !== med[x]) removed++;

/* 4. Douglas–Peucker, so 2400 columns become a few hundred points and the
   Catmull-Rom in `skyline.ts` has corners to work with instead of stairs */
const simplify = (p, eps) => {
  const keep = new Uint8Array(p.length);
  keep[0] = keep[p.length - 1] = 1;
  const st = [[0, p.length - 1]];
  while (st.length) {
    const [a, b] = st.pop();
    const [ax, ay] = p[a], [bx, by] = p[b];
    const L = Math.hypot(bx - ax, by - ay) || 1;
    let md = 0, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((by - ay) * p[i][0] - (bx - ax) * p[i][1] + bx * ay - by * ax) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return p.filter((_, i) => keep[i]);
};

const write = (path, pts, title) => {
  const d = 'M' + pts.map((p) => `${p[0]} ${p[1]}`).join('L');
  writeFileSync(
    path,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" aria-hidden="true">\n  <title>${title}</title>\n  <path class="skyline" d="${d}"/>\n</svg>\n`,
  );
  return pts.length;
};

const x0 = Number(args.x0 ?? 0), x1 = Number(args.x1 ?? W - 1);
const ridge = simplify(med.map((y, x) => [x, y]).slice(x0, x1 + 1), EPS);
const skyline = simplify(sky.map((y, x) => [x, y]), EPS);
const top = ridge.reduce((m, p, i) => (p[1] < ridge[m][1] ? i : m), 0);

const n1 = write(OUT, ridge, `matterhorn-still — the ridges, traced from the kuhnmi still on blue/red, cut to x ${x0}–${x1}`);
const n2 = write(OUTSKY, skyline, 'matterhorn-still-sky — the full-width edge for cutting the sky out of the plate');
console.log(`${SRC} ${W}x${H} · ridge ${n1} pts, summit ${ridge[top]} · sky ${n2} pts, ${removed} columns de-spiked → ${OUT}, ${OUTSKY}`);
