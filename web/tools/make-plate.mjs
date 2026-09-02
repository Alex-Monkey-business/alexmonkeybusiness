/**
 * Photograph → high-contrast monochrome plate.
 *
 * The look this reproduces: sky crushed to true black, snow carried to near
 * white with its texture intact, rock worked hard in between. Alex found a
 * reference he liked and could not find in high resolution — which does not
 * matter, because the look is a processing recipe rather than a capture. Apply
 * it to any sharp source with a clean sky and it comes out.
 *
 * THE REASON THIS IS MORE THAN A STYLE. `trace-skyline.mjs` finds the mountain
 * by asking, per column, where the vertical luminance gradient peaks — and its
 * hardest failure is that lit snow on the right shoulder sits at almost exactly
 * sky brightness, so a luminance threshold walks straight through it. Crush the
 * sky to zero first and that ambiguity is gone: the edge becomes the largest
 * step in the frame. The plate is the better input as well as the better image.
 *
 * FOUR STAGES, IN THIS ORDER. Order matters — local contrast before the levels
 * crush would spend its range on tones that are about to be clipped away.
 *
 *   1. Desaturate on luminance, not on the channel average: 0.2126/0.7152/
 *      0.0722. A flat average turns blue sky into mid-grey and the crush then
 *      cannot separate it from rock.
 *   2. Levels. --black is the input luminance that becomes 0, --white the one
 *      that becomes 255. This is the whole effect.
 *   3. Local contrast: an unsharp mask at a large radius, so it works on
 *      slope-scale form rather than on grain. Blend, never add — adding blows
 *      the snow it is meant to shape.
 *   4. Grain, last, so the levels do not amplify it.
 *
 *   node tools/make-plate.mjs --src public/hero/matterhorn.webp \
 *     --black 78 --white 200 --out /tmp/plate.png
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, extname } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, x, i, arr) => {
    if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1]]);
    return a;
  }, []),
);

const SRC = args.src ?? 'public/hero/matterhorn.webp';
/** Input luminance that becomes pure black. Sits just above the sky. */
const BLACK = Number(args.black ?? 78);
/** Input luminance that becomes pure white. Below this the snow keeps texture. */
const WHITE = Number(args.white ?? 200);
const GAMMA = Number(args.gamma ?? 1);
/** Unsharp amount, 0–1.5. Radius is a fraction of image width. */
const CLARITY = Number(args.clarity ?? 0.55);
const RADIUS = Number(args.radius ?? 0.014);
/** Grain amplitude in levels, 0 = off. */
const GRAIN = Number(args.grain ?? 4);
/**
 * Bake the traced silhouette into the file and fill the sky with `--bg-fill`.
 *
 * THIS IS WHAT MAKES THE PLATE USABLE AT ALL, and it took a wrong turn to see.
 * A crushed plate masked in CSS shows a bright rim: the sky is luminance ~205
 * and a white point of 185 maps it to pure white, so every sky pixel the mask
 * keeps becomes maximum white. Eroding the mask does not fix it — the trace
 * carries up to 9 units of error on the Zmuttgrat (p90), and an inset that
 * clears that bites twelve screen pixels off the mountain.
 *
 * Filling the sky here instead makes the trace's accuracy IRRELEVANT rather
 * than exposed: whatever the CSS mask gets wrong now leaks page-black onto
 * page-black. Note the fill is the page colour, not #000 — a pure-black sky
 * would read as a slightly darker rectangle behind the mountain.
 */
const MASKSVG = args['mask-svg'] ?? '';
const BGFILL = args['bg-fill'] ?? '#121211';
const OUT = args.out ?? 'plate.png';

/* The silhouette, rebuilt the way `src/lib/skyline.ts` builds it. Duplicated on
   purpose: this is a build tool in plain JS and cannot import the TS module, and
   a wrong copy would be obvious immediately — the sky would end up in the wrong
   place. Keep the two in step if the closing rule ever changes. */
let silPath = '';
let silBox = '';
if (MASKSVG) {
  const svg = readFileSync(MASKSVG, 'utf8');
  const d = svg.match(/class="skyline" d="([^"]+)"/)?.[1] ?? '';
  silBox = svg.match(/viewBox="([^"]+)"/)?.[1] ?? '';
  const [, , bw, bh] = silBox.split(/\s+/).map(Number);
  const pts = d.slice(1).split('L').map((t) => t.trim().split(/\s+/).map(Number));
  const [px0, py0] = pts[0];
  const base = pts[Math.min(Math.round(pts.length * 0.2), pts.length - 1)];
  const lead = Math.round(py0 - ((base[1] - py0) / (base[0] - px0)) * px0);
  silPath = `M0 ${lead}L` + pts.map((q) => `${q[0]} ${q[1]}`).join('L') + `L${bw} ${bh}L0 ${bh}Z`;
}

const mime = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }[extname(SRC).toLowerCase()] ?? 'image/png';
const src = `data:${mime};base64,${readFileSync(SRC).toString('base64')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();

const out = await page.evaluate(
  async (o) => {
    const im = new Image();
    im.src = o.src;
    await im.decode();
    const W = im.naturalWidth, H = im.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(im, 0, 0);
    const img = g.getImageData(0, 0, W, H);
    const px = img.data;

    /* 1. luminance */
    const lum = new Float32Array(W * H);
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      lum[j] = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    }

    /* 2. levels */
    const span = Math.max(1, o.white - o.black);
    const lev = new Float32Array(W * H);
    for (let j = 0; j < lum.length; j++) {
      let t = (lum[j] - o.black) / span;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      lev[j] = 255 * (o.gamma === 1 ? t : Math.pow(t, 1 / o.gamma));
    }

    /* 3. local contrast — separable box blur, then blend the difference */
    let base = lev;
    if (o.clarity > 0) {
      const R = Math.max(1, Math.round(W * o.radius));
      const tmp = new Float32Array(W * H);
      const blur = new Float32Array(W * H);
      for (let y = 0; y < H; y++) {
        let acc = 0;
        for (let k = -R; k <= R; k++) acc += lev[y * W + Math.min(W - 1, Math.max(0, k))];
        for (let x = 0; x < W; x++) {
          tmp[y * W + x] = acc / (2 * R + 1);
          acc += lev[y * W + Math.min(W - 1, x + R + 1)] - lev[y * W + Math.max(0, x - R)];
        }
      }
      for (let x = 0; x < W; x++) {
        let acc = 0;
        for (let k = -R; k <= R; k++) acc += tmp[Math.min(H - 1, Math.max(0, k)) * W + x];
        for (let y = 0; y < H; y++) {
          blur[y * W + x] = acc / (2 * R + 1);
          acc += tmp[Math.min(H - 1, y + R + 1) * W + x] - tmp[Math.max(0, y - R) * W + x];
        }
      }
      base = new Float32Array(W * H);
      for (let j = 0; j < lev.length; j++) {
        base[j] = lev[j] + o.clarity * (lev[j] - blur[j]);
      }
    }

    /* 4. grain, and write back as neutral grey */
    for (let j = 0, i = 0; j < base.length; j++, i += 4) {
      let v = base[j] + (o.grain ? (Math.random() - 0.5) * 2 * o.grain : 0);
      v = v < 0 ? 0 : v > 255 ? 255 : v;
      px[i] = px[i + 1] = px[i + 2] = v;
      px[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);

    /* Cut to the mountain, then flatten onto the page colour. `destination-in`
       keeps only what the silhouette covers; the fill underneath then becomes
       the sky. Two operations, no per-pixel loop. */
    if (o.silPath) {
      const m = new Image();
      m.src =
        'data:image/svg+xml,' +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${o.silBox}" preserveAspectRatio="none" width="${W}" height="${H}"><path d="${o.silPath}" fill="#fff"/></svg>`,
        );
      await m.decode();
      g.globalCompositeOperation = 'destination-in';
      g.drawImage(m, 0, 0, W, H);
      g.globalCompositeOperation = 'destination-over';
      g.fillStyle = o.bgFill;
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';
    }

    /* how black is the black, and how much of the frame is it */
    let pure = 0, blown = 0;
    for (let j = 0; j < base.length; j++) { if (base[j] <= 1) pure++; if (base[j] >= 254) blown++; }
    return {
      data: c.toDataURL(o.type, o.type === 'image/webp' ? o.quality : undefined),
      w: W, h: H,
      pureBlack: +(100 * pure / base.length).toFixed(1),
      blown: +(100 * blown / base.length).toFixed(1),
    };
  },
  {
    src, black: BLACK, white: WHITE, gamma: GAMMA, clarity: CLARITY, radius: RADIUS, grain: GRAIN,
    /* WebP by extension. A crushed monochrome plate is mostly flat black and
       flat white, which is exactly what WebP is good at — the PNG of this frame
       is 1.6 MB and the WebP is a fraction of it at quality 0.9. */
    type: OUT.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/png',
    quality: Number(args.quality ?? 0.9),
    silPath, silBox, bgFill: BGFILL,
  },
);

await browser.close();

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, Buffer.from(out.data.split(',')[1], 'base64'));
console.log(`${SRC} → ${OUT} · ${out.w}x${out.h} · helsvart ${out.pureBlack}% · utblåst ${out.blown}%`);
