/**
 * THE GEOMETRY OF THE TRACED SKYLINE, read once and shared.
 *
 * `tools/trace-skyline.mjs` writes one polyline per run and everything here is
 * derived from it, so a re-trace moves every surface at once and no number in
 * this file is ever typed by hand. Two components draw it: `Skyline.astro`
 * cuts footage to it, `Strek.astro` draws it alone.
 */
import rawVideo from '../assets/terrain/matterhorn-sky.svg?raw';
import rawStill from '../assets/terrain/matterhorn-still.svg?raw';

/**
 * TWO TRACES, ONE GEOMETRY. The video surfaces (`Skyline`, `Strek`, and the
 * ones cut from them) are registered to the clip and its trace; `Natt` is
 * registered to the kuhnmi still and ITS trace, from `tools/trace-still.mjs`.
 * They are different photographs of the same side of the mountain, so the
 * summit sits in a different place and the ridges leave the frame at different
 * heights — a surface that mixed them would draw the line off the rock.
 *
 * So the derivation is a function of the trace, run once per trace. Everything
 * below the function is unchanged in what it computes; it just no longer
 * assumes there is only one file.
 */
export type Skyline = ReturnType<typeof fromTrace>;

export function fromTrace(raw: string) {
const d = raw.match(/class="skyline" d="([^"]+)"/)?.[1] ?? '';
/* Read from the file, never typed here: the tracer's `--width` decides it, and
   a viewBox that disagrees with the frame slides the line off the ridge. */
const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 1280 720';
const [, , w, h] = viewBox.split(/\s+/).map(Number);
const vbw = w;
const vbh = h;

const pts = d
  .slice(1)
  .split('L')
  .map((s) => s.trim().split(/\s+/).map(Number) as [number, number]);

let total = 0;
const cum = [0];
for (let i = 1; i < pts.length; i++) {
  total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  cum.push(total);
}
let top = 0;
for (let i = 1; i < pts.length; i++) if (pts[i][1] < pts[top][1]) top = i;

/**
 * THE SEGMENTS ARE THE REAL RIDGES.
 *
 * Seen from the north-east — which is what this clip is — the two halves of
 * the Matterhorn's outline are two named climbing routes, and they meet at the
 * summit. Left of the top is the ZMUTTGRAT, the north-west ridge. Right of it
 * is the HÖRNLIGRAT, the north-east ridge and the normal route, the one
 * Whymper's party took in 1865. The face between them, pointed at the camera,
 * is the Nordwand.
 *
 * So hovering a name does not light "a stretch of line" — it lights a route up
 * the mountain, and the two are true without a word of explanation.
 *
 * The split point is COMPUTED, not typed: it is the highest point on the
 * traced path, which is the summit by definition. Hand-picked fractions drift
 * the moment the trace is regenerated with a different crop.
 */
const summit = cum[top] / total;

/** Where the peak sits inside the frame, 0–1. The mobile framing hangs off it. */
const peak = { x: pts[top][0] / vbw, y: pts[top][1] / vbh };

/**
 * EVERY LINE GROWS OUT OF THE SUMMIT — the entrance and the hover both.
 *
 * With `pathLength="1"` a sub-range [a,b] is drawn by `dasharray: (b-a) 1` and
 * `dashoffset: -a`. Growing a range from ONE END is therefore two different
 * jobs depending on which end is anchored:
 *
 *   Hörnligrat runs forward from the summit, so the anchor `a` never moves:
 *   the dash length grows and the offset stays at -summit.
 *   Zmuttgrat runs backward INTO the summit, so `a` has to walk left as the
 *   length grows: dasharray 0→summit while dashoffset walks -summit→0.
 *
 * Both start at `dashoffset: -summit`, which is the summit itself: at length 0
 * every line is a point on the peak, and the mountain unfolds from there.
 */
const segs = [
  { key: 'zmuttgrat', len: summit, o0: -summit, o1: 0 },
  { key: 'hornligrat', len: 1 - summit, o0: -summit, o1: -summit },
];

/**
 * THE TRACE IS A STAIRCASE — it was measured column by column, so every point
 * sits on a whole pixel and the line climbs in visible one-pixel steps. At the
 * scales this thing is blown up to that reads as aliasing on a drawing that is
 * supposed to look drawn.
 *
 * Centripetal Catmull-Rom (alpha = 0.5) fixes it for free: the curve passes
 * through EVERY traced point exactly, so the line is no less accurate than the
 * measurement, and it cannot overshoot at a sharp corner the way the uniform
 * variant does — which matters here, because the sharpest corner in the data
 * is the summit.
 */
const smooth = (q: [number, number][]) => {
  const out = [`M${q[0][0]} ${q[0][1]}`];
  const at = (i: number) => q[Math.max(0, Math.min(q.length - 1, i))];
  for (let i = 0; i < q.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const t = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1]) ** 0.5 || 1e-6;
    const [t0, t1, t2] = [t(p0, p1), t(p1, p2), t(p2, p3)];
    const c1 = [0, 1].map((k) => p1[k] + ((p2[k] - p0[k]) * t1) / (3 * (t0 + t1)));
    const c2 = [0, 1].map((k) => p2[k] - ((p3[k] - p1[k]) * t1) / (3 * (t1 + t2)));
    out.push(`C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0]} ${p2[1]}`);
  }
  return out.join('');
};

/** The ridge itself: one open curve from the left edge of the trace to the right. */
const line = smooth(pts);

/**
 * THE MOUNTAIN AS A CLOSED SHAPE — everything below the traced line.
 *
 * `Skyline.astro` uses it as a mask so the photograph is cut to the mountain
 * and there is no rectangle left to hide at any framing; `Strek.astro` fills
 * it. Either way the drawn line sits on the boundary of the mass rather than
 * on top of it, which is as registered as a line can get.
 *
 * Left of the trace's first point the ridge is inside cloud and was never
 * measured, so the shape leaves the frame on the slope the trace was running
 * when it stopped. `traceX0` is where that guess begins, so a surface can fade
 * it out instead of showing a corner.
 */
const [x0, y0] = pts[0];
/**
 * THE GUESS RUNS OFF THE CORNER, NOT ALONG A SHELF.
 *
 * Extrapolating from the first TWO traced points reads the slope at the exact
 * moment the ridge disappears into cloud, and right there it is almost flat:
 * -0.035, which walks the shape out to the left edge at very nearly the same
 * height and draws a horizontal shelf across the bottom-left of the screen. On
 * the photographic surface that never showed, because the whole stretch is
 * faded out; on a flat block it is the most prominent edge on the page and it
 * reads as a plateau, which the Matterhorn does not have.
 *
 * A fifth of the trace is a long enough baseline to catch what the ridge is
 * actually doing (-1.05) and short enough to still be local to the left end.
 * That slope leaves the frame at or below the bottom-left corner, so the shape
 * has no left edge at all — which is the truthful drawing of "the measurement
 * stopped here", rather than an invented flat.
 */
const base = pts[Math.min(Math.round(pts.length * 0.2), pts.length - 1)];
const lead = Math.round(y0 - ((base[1] - y0) / (base[0] - x0)) * x0);
const silhouette =
  `M0 ${lead}L${x0} ${y0}` + line.slice(line.indexOf('C')) + `L${vbw} ${vbh}L0 ${vbh}Z`;
const traceX0 = x0 / vbw;

/**
 * The same shape as a mask image, for surfaces that cut a raster to it.
 *
 * `inset` pushes the whole closed shape DOWN by that many viewBox units, which
 * erodes the ridge edge and leaves the bottom (already below the frame) alone.
 * `feather` blurs the mask edge, in the same units.
 *
 * BOTH EXIST BECAUSE OF ONE ARTEFACT, and it only shows on a high-contrast
 * plate. A mask cut exactly on the traced line keeps the last row of SKY
 * pixels — and on our source the sky is luminance ~205, which a plate graded to
 * white point 185 maps to pure white. Every retained pixel becomes maximum
 * white, so the leak reads as a bright rim around a bad cutout.
 *
 * ERODING ALONE DOES NOT FIX IT. The trace carries ±3 units of noise, so the
 * inset has to clear that everywhere, and by the time it does it is biting
 * visibly into the mountain — worse on the Zmuttgrat, which is the noisier half
 * (3.3 against 2.9 median deviation). Feathering fixes what eroding cannot: a
 * soft edge fades the leak out instead of cutting through it, and on a
 * photograph a soft edge reads as atmosphere rather than as a mistake. 3 and 2
 * together is the pair that works.
 *
 * The blur has to live INSIDE the mask SVG — CSS cannot blur a mask image from
 * outside, and `filter` on the masked element would blur the photograph too.
 *
 * Translating a `<g>` rather than regenerating the path is deliberate: an
 * offset baked into the path data would put the mask and the drawn line in two
 * different coordinate spaces, and the registration between them is the one
 * thing this file exists to protect.
 */
const silhouetteMask = (inset = 0, feather = 0) =>
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbw} ${vbh}" preserveAspectRatio="none">` +
      (feather
        ? `<filter id="f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${feather}"/></filter>`
        : '') +
      `<g transform="translate(0 ${inset})"${feather ? ' filter="url(%23f)"' : ''}><path d="${silhouette}" fill="#fff"/></g></svg>`,
  ).replace(/'/g, '%27') +
  '")';

const silUrl = silhouetteMask(0);

/**
 * THE LOWER EDGE OF THE SKY, as plain points, full width: the guessed lead-in
 * on the left, every traced point, and the straight run to the bottom-right
 * corner that closes the silhouette. For anything drawn in the sky at runtime
 * — the stars in `Natt.astro` — so it can stay above the rock without
 * touching the path string.
 */
const ridge: [number, number][] = [[0, lead], ...pts, [vbw, vbh]];

  return { viewBox, vbw, vbh, peak, segs, line, silhouette, traceX0, silhouetteMask, silUrl, ridge };
}

/* The video trace keeps the bare names, so nothing that already imports them
   moves. The still is its own object. */
export const { viewBox, vbw, vbh, peak, segs, line, silhouette, traceX0, silhouetteMask, silUrl, ridge } = fromTrace(rawVideo);
export const still = fromTrace(rawStill);
