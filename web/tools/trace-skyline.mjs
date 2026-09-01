/**
 * Photograph → skyline path.
 *
 * The 30 m elevation model cannot draw the Matterhorn's actual silhouette —
 * the hooked summit and the near-vertical north face are smaller than one
 * sample. A photograph can. This walks a still frame column by column, finds
 * where sky becomes mountain, and writes that boundary out as one SVG path.
 *
 * The frame is decoded in Chrome, same as the other two terrain tools, so
 * there is still no compiled image dependency in the project.
 *
 * TWO MODES, because two skies behave nothing alike.
 *
 * OVERCAST (default) is a brightness problem: the sky is the bright thing and
 * the mountain is the dark thing, judged per column against the top of the
 * frame, with the texture rule below to hold the snow.
 *
 * BLUE SKY (`--blue`) is a COLOUR problem, and brightness actively misleads —
 * sunlit snow at 0.48–0.54 sits below hazy sky at 0.60–0.64, so every
 * brightness rule cuts slits into the face. Measured off this clip:
 *
 *     blue = (B − R) / 255       lum = Rec.709 luma
 *     sky     blue +0.06 … +0.15     lum 0.55 … 0.64
 *     mountain blue −0.06 … +0.03    lum 0.45 … 0.54
 *     cloud    blue −0.15            lum 0.77
 *
 * Blue separates sky from mountain outright. Cloud is the awkward one: it is
 * as warm as the rock and would be traced as a ridge — but it is far brighter
 * than any rock in frame, so one brightness ceiling removes it. Hence rock =
 * not blue enough AND not bright enough, two absolute thresholds taken from
 * the picture rather than guessed.
 *
 * SNOW, in overcast mode. Luminance alone cannot find the edge. The Matterhorn's right shoulder
 * is a lit snow face at almost exactly sky brightness, so a threshold walks
 * straight through it and cuts the ridge in half. What separates them is not
 * brightness but TEXTURE: rock and snow carry detail at every scale, sky and
 * cloud are smooth. So a pixel counts as mountain if it is darker than the sky
 * OR if it has local structure, and the bright half of the ridge is found by
 * the second test.
 *
 * TWO STAGES, because the texture test is deliberately generous. Any window
 * that reaches far enough to recognise rock also reaches over the boundary, so
 * the coarse pass fires a few rows into the sky and the finished line floats
 * off the mountain — measured on the page, a steady 5.5 px gap the whole way
 * along. Reshaping the window does not fix it (looking downward only makes it
 * fire even earlier, since the window fills with rock sooner). What fixes it
 * is to treat the coarse hit as an approximate location and then snap to the
 * real thing: the HALF-WAY CROSSING between the sky level just above and the
 * rock level just below, measured locally per column.
 *
 * Not the gradient peak — that was the first attempt and it fails exactly
 * where it matters. On the lit snow shoulder the sky/snow edge is soft and
 * low-contrast, so the strongest gradient inside the band is some rock band a
 * few rows off rather than the boundary, and the line floats above the snow
 * for the whole diagonal. A half-way crossing does not care how sharp the edge
 * is, only where the two levels meet, so it lands correctly on a soft edge and
 * a hard one alike. The gradient peak survives as the fallback for columns
 * where the two levels are too close to tell apart at all.
 *
 * CLOUD REMOVAL. Tracing one frame gives you the clouds as well as the rock:
 * a bank sitting on the left ridge is followed as if it were the mountain, and
 * a wisp crossing the summit cuts a notch into it. The fix is the locked
 * camera — the mountain is on the same pixels in every frame and the weather
 * is not. Trace `--frames` moments spread across the clip and take the median
 * per column: rock is the only answer that keeps coming back, so every cloud
 * that ever crossed the ridge is voted out. Nothing here would work on a
 * moving camera, which is exactly why it is worth checking first.
 *
 * THE 4K SOURCE THIS ASSET WAS TRACED FROM NO LONGER EXISTS. The clip in
 * `public/hero/` was replaced with the 1920 cut on 31 Aug 2026 to get the page
 * weight down, which was the right call for shipping and destroyed the tracer's
 * input: a column's edge is found by where the vertical luminance gradient
 * peaks, and a sharper source gives a sharper peak to snap to.
 *
 * Measured, so nobody has to guess: re-tracing the committed silhouette from
 * the 720p file more than doubles the wobble — median deviation over a ±3-point
 * window goes from 3.1 px to 7.4 px at 1280 wide, p90 from 8.8 to 20.0. Every
 * smoothing knob was already on (median 11, binomial 5) and widening them makes
 * it worse, not better, because the noise is in the edge detection and not in
 * the simplification.
 *
 * SO: `matterhorn-sky.svg` cannot currently be reproduced or improved, and it
 * is better than anything this tool can now produce. Do not re-run it against
 * the shipped mp4 and commit the result. To improve the trace, re-download the
 * 3840×2160 original from Pexels first, or move to swissALTI3D and stop tracing
 * photographs.
 *
 *   node tools/trace-skyline.mjs --src http://localhost:4321/hero/matterhorn.mp4 \
 *     --name matterhorn-sky --frames 40
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

const SRC = args.src;
const TIME = Number(args.time ?? 0);
/** Frames sampled across the clip and voted on. 1 traces `--time` alone. */
const FRAMES = Number(args.frames ?? 1);
const NAME = args.name ?? 'skyline';
/** Working width. The trace is per column, so this is also the sample count. */
const W = Number(args.width ?? 1400);
/** Overcast mode: how much darker than the sky a row must be to count as rock. */
const DROP = Number(args.drop ?? 0.1);
/** Blue mode: at or above this blueness the row is sky. */
const BLUEMAX = Number(args.bluemax ?? 0.045);
/** Blue mode: at or above this brightness the row is cloud, so also not rock. */
const LUMMAX = Number(args.lummax ?? 0.65);
/** Local standard deviation above which a pixel counts as rock regardless of
    how bright it is. This is what holds the snow faces. */
const TEX = Number(args.tex ?? 0.022);
/** Switches to blue-sky mode. A flag — the thresholds are the two above. */
const BLUE = 'blue' in args ? 1 : -1;
/** Radius of the window that texture is measured over, in pixels. */
const TEXR = Number(args.texr ?? 3);
/** How far the second stage may move the edge, in rows. */
const SNAP = Number(args.snap ?? 6);
/** Rows below the candidate that must stay dark for it to be the edge. */
const RUN = Number(args.run ?? 14);
/** Median filter width across columns — kills cloud wisps and lone spikes. */
const SMOOTH = Number(args.smooth ?? 11);
/* Mean pass after the median. The median returns whole pixels — it is a pick,
   not an average — so the finished line climbs in one-pixel steps, and at the
   scales this gets blown up to on a page those steps are the most visible
   thing about it. A short binomial mean turns them into fractions. Short is
   the point: five columns cannot pull the summit down by a pixel, where the
   eleven-wide median it follows would have. */
const SOFT = Number(args.soft ?? 5);
const TOL = Number(args.tol ?? 0.8);
/** Final nudge in working pixels, positive = down. Should be near zero once
    the detector is honest; kept because haze varies with the source. */
const BIAS = Number(args.bias ?? 0);
/**
 * Keep only this slice of the width, 0–1. A cloud bank that sits in the same
 * place for the whole clip survives the vote — it is as static as the rock —
 * so the left end of this trace follows weather, not mountain. Cropping is the
 * honest fix: the drawing stops where the ridge goes behind cloud, rather than
 * inventing a line nobody can see.
 */
const X0 = Number(args.x0 ?? 0);
const X1 = Number(args.x1 ?? 1);
const OUT = args.out ?? `src/assets/terrain/${NAME}.svg`;
const DEBUG = 'debug' in args;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
/* Same origin as the clip, or the canvas comes back tainted and every pixel
   read fails. Derived from --src so a dev server on any port works. */
await page.goto(new URL(SRC, 'http://localhost:4321').origin + '/lab/');

const result = await page.evaluate(
  async (o) => {
    const video = document.createElement('video');
    video.src = o.src;
    video.muted = true;
    await new Promise((res, rej) => {
      video.onloadeddata = res;
      video.onerror = rej;
    });

    const h = Math.round((video.videoHeight / video.videoWidth) * o.width);
    const c = document.createElement('canvas');
    c.width = o.width;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const lum = new Float32Array(o.width * h);
    const blue = new Float32Array(o.width * h);

    const seek = async (t) => {
      await new Promise((res) => {
        video.onseeked = res;
        video.currentTime = t;
      });
      ctx.drawImage(video, 0, 0, o.width, h);
      const px = ctx.getImageData(0, 0, o.width, h).data;
      for (let i = 0; i < o.width * h; i++) {
        lum[i] = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
        blue[i] = (px[i * 4 + 2] - px[i * 4]) / 255;
      }
    };

    /* Local standard deviation, separable: two box passes for the mean and two
       for the mean of squares, then sd = sqrt(E[x²] − E[x]²). Cheap enough to
       run once per sampled frame. */
    const sd = new Float32Array(o.width * h);
    const bx = new Float32Array(o.width * h);
    const by = new Float32Array(o.width * h);
    const box = (src, dst, r) => {
      const tmp = new Float32Array(o.width * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < o.width; x++) {
          let acc = 0;
          for (let k = -r; k <= r; k++) acc += src[y * o.width + Math.min(o.width - 1, Math.max(0, x + k))];
          tmp[y * o.width + x] = acc / (r * 2 + 1);
        }
      }
      for (let x = 0; x < o.width; x++) {
        for (let y = 0; y < h; y++) {
          let acc = 0;
          for (let k = -r; k <= r; k++) acc += tmp[Math.min(h - 1, Math.max(0, y + k)) * o.width + x];
          dst[y * o.width + x] = acc / (r * 2 + 1);
        }
      }
    };
    const texture = () => {
      const sq = new Float32Array(o.width * h);
      for (let i = 0; i < sq.length; i++) sq[i] = lum[i] * lum[i];
      box(lum, bx, o.texr);
      box(sq, by, o.texr);
      for (let i = 0; i < sd.length; i++) {
        sd[i] = Math.sqrt(Math.max(0, by[i] - bx[i] * bx[i]));
      }
    };

    const traceOne = () => {
      texture();
    /* Overcast mode's reference: per column from the top of the frame, never
       one number for the whole image — a real sky is not evenly lit, and a
       single global threshold cuts the ridge in the bright half and finds
       cloud in the dark half. */
    const skyRows = Math.max(4, Math.round(h * 0.05));
    const sky = new Float32Array(o.width);
    for (let x = 0; x < o.width; x++) {
      let acc = 0;
      for (let y = 0; y < skyRows; y++) acc += lum[y * o.width + x];
      sky[x] = acc / skyRows;
    }

    /* ---- walk each column ----
       A single dark pixel is a bird or a wisp. The edge is the first row whose
       next `run` rows ALL read as rock — rock keeps going, weather does not. */
    const horizon = new Float32Array(o.width);
    for (let x = 0; x < o.width; x++) {
      const limit = sky[x] - o.drop;
      const rock =
        o.blue > 0
          ? (j) => blue[j] < o.bluemax && lum[j] < o.lummax
          : (j) => lum[j] < limit || sd[j] > o.tex;

      let found = h - 1;
      for (let y = skyRows; y < h - o.run; y++) {
        const i = y * o.width + x;
        if (rock(i)) {
          let ok = true;
          for (let k = 1; k <= o.run; k++) {
            if (!rock(i + k * o.width)) {
              ok = false;
              break;
            }
          }
          if (ok) {
            found = y;
            break;
          }
        }
      }

      /* Stage two: snap to where the two levels meet. */
      if (found < h - 1) {
        /* SYMMETRIC, and small. The coarse pass is already within a few rows
           of the truth; the snap only has to remove that bias. Given a long
           reach downward it will happily leave the ridge altogether wherever
           sunlit snow and hazy sky sit at the same brightness — the levels are
           then indistinguishable, the fallback fires, and the strongest change
           inside the band is some rock band well below the skyline. Short
           reach, and the worst case is that the bias stays. */
        const S = o.snap;
        const lo = Math.max(1, found - S);
        const hi = Math.min(h - 2, found + S);

        const band = (from, to) => {
          let acc = 0;
          let n = 0;
          for (let y = Math.max(0, from); y <= Math.min(h - 1, to); y++) {
            acc += lum[y * o.width + x];
            n++;
          }
          return n ? acc / n : 0;
        };
        /* Sampled clear of the transition on both sides, so neither reference
           is contaminated by the edge it is being used to find. */
        const skyLvl = band(found - S * 3, found - S - 1);
        const rockLvl = band(hi + 1, hi + S * 3);
        const mid = (skyLvl + rockLvl) / 2;
        const darker = rockLvl < skyLvl;

        let at = -1;
        if (Math.abs(rockLvl - skyLvl) > 0.02) {
          for (let y = lo; y <= hi; y++) {
            const v = lum[y * o.width + x];
            if (darker ? v <= mid : v >= mid) {
              at = y;
              break;
            }
          }
        }
        if (at < 0) {
          /* Levels indistinguishable — fall back to the sharpest change. */
          let best = -1;
          at = found;
          for (let y = lo; y <= hi; y++) {
            const g = Math.abs(lum[(y + 1) * o.width + x] - lum[(y - 1) * o.width + x]);
            if (g > best) {
              best = g;
              at = y;
            }
          }
        }
        found = at;
      }
      horizon[x] = found;
    }
    return horizon;
    };

    /* ---- vote across time ----
       Per column, the median of every frame's answer. The mountain is the only
       edge that is in the same place every time. */
    const stack = [];
    const times =
      o.frames <= 1
        ? [o.time]
        : Array.from({ length: o.frames }, (_, i) => (i / (o.frames - 1)) * (video.duration - 0.1));
    for (const t of times) {
      await seek(t);
      stack.push(traceOne());
    }

    const horizon = new Float32Array(o.width);
    const col = [];
    for (let x = 0; x < o.width; x++) {
      col.length = 0;
      for (const s of stack) col.push(s[x]);
      col.sort((a, b) => a - b);
      horizon[x] = col[Math.floor(col.length / 2)];
    }

    /* ---- median across columns ----
       A mean would drag the summit down toward the sky on either side of it;
       a median leaves a genuine spike alone and deletes a lone one. */
    const half = Math.floor(o.smooth / 2);
    const smooth = new Float32Array(o.width);
    const win = [];
    for (let x = 0; x < o.width; x++) {
      win.length = 0;
      for (let k = -half; k <= half; k++) {
        win.push(horizon[Math.min(o.width - 1, Math.max(0, x + k))]);
      }
      win.sort((a, b) => a - b);
      smooth[x] = win[half];
    }

    /* ---- mean across columns, short ---- */
    const soft = new Float32Array(o.width);
    const k = Math.max(0, Math.floor(o.soft / 2));
    /* Binomial weights: smoother than a box of the same width, and it keeps
       most of its weight on the column it is actually answering for. */
    const wts = [];
    for (let i = -k; i <= k; i++) wts.push(Math.exp(-((i / (k || 1)) ** 2) * 1.6));
    const wsum = wts.reduce((a, b) => a + b, 0);
    for (let x = 0; x < o.width; x++) {
      let acc = 0;
      for (let i = -k; i <= k; i++) {
        acc += wts[i + k] * smooth[Math.min(o.width - 1, Math.max(0, x + i))];
      }
      soft[x] = acc / wsum;
    }

    return { w: o.width, h, points: Array.from(o.soft > 1 ? soft : smooth) };
  },
  { src: SRC, time: TIME, frames: FRAMES, width: W, drop: DROP, tex: TEX, texr: TEXR, snap: SNAP, blue: BLUE, bluemax: BLUEMAX, lummax: LUMMAX, run: RUN, smooth: SMOOTH, soft: SOFT },
);

const { w, h, points } = result;

/* ---- simplify (same Douglas–Peucker as the other two tools) ---- */
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

const raw = points
  .map((y, x) => [x, y + BIAS])
  .slice(Math.round(X0 * points.length), Math.round(X1 * points.length));
const simple = rdp(raw, TOL);
const fmt = (v) => Math.round(v * 100) / 100;
const d = 'M' + simple.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L');

console.log(`${w}×${h} · ${raw.length} columns → ${simple.length} points`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true">
  <title>${NAME} — skyline traced from frame at ${TIME}s</title>
  <path class="skyline" d="${d}"/>
</svg>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`wrote ${OUT} · ${(svg.length / 1024).toFixed(1)} kB`);

if (DEBUG) {
  /* Overlay the trace on the frame, so a bad threshold is obvious rather than
     something you find later on the page. Rendered on a blank document: the
     page this tool borrows for its codec support runs its own scripts, and
     replacing its body under them tears down the execution context. */
  const dbg = await browser.newPage();
  await dbg.goto(new URL(SRC, 'http://localhost:4321').origin + '/lab/');
  const p2 = await dbg.evaluate(
    async ({ src, time, width, d }) => {
      const video = document.createElement('video');
      video.src = src;
      video.muted = true;
      await new Promise((res) => (video.onloadeddata = res));
      await new Promise((res) => {
        video.onseeked = res;
        video.currentTime = time;
      });
      const h = Math.round((video.videoHeight / video.videoWidth) * width);
      document.body.innerHTML = `<div style="position:relative;width:${width}px">
        <canvas id="c" width="${width}" height="${h}" style="display:block"></canvas>
        <svg viewBox="0 0 ${width} ${h}" style="position:absolute;inset:0;width:100%">
          <path d="${d}" fill="none" stroke="#f0d7ff" stroke-width="3"/>
        </svg></div>`;
      document.getElementById('c').getContext('2d').drawImage(video, 0, 0, width, h);
      return h;
    },
    { src: SRC, time: TIME, width: W, d },
  );
  await dbg.setViewportSize({ width: W, height: p2 });
  await dbg.screenshot({ path: `${process.env.SCRATCH ?? '.'}/trace-${NAME}.png` });
  console.log(`overlay: ${process.env.SCRATCH ?? '.'}/trace-${NAME}.png`);
}

await browser.close();
