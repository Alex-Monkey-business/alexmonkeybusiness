/**
 * Video → poster still.
 *
 * The clip is locked off, so any frame is the whole composition. The page
 * needs one anyway: it is what `prefers-reduced-motion` gets instead of
 * playback, and what paints while several megabytes of video are still on the
 * wire. Encoded through Chrome's own WebP encoder, so there is still no image
 * dependency in the project.
 *
 *   node tools/make-poster.mjs --src http://localhost:4321/hero/matterhorn.mp4 \
 *     --out public/hero/matterhorn.webp --time 3 --width 1600
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
const OUT = args.out ?? 'public/hero/poster.webp';
const TIME = Number(args.time ?? 0);
const WIDTH = Number(args.width ?? 1600);
const QUALITY = Number(args.quality ?? 0.82);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.goto('http://localhost:4321/lab/');

const data = await page.evaluate(
  async (o) => {
    const v = document.createElement('video');
    v.src = o.src;
    v.muted = true;
    await new Promise((res, rej) => {
      v.onloadeddata = res;
      v.onerror = rej;
    });
    await new Promise((res) => {
      v.onseeked = res;
      v.currentTime = o.time;
    });
    const h = Math.round((v.videoHeight / v.videoWidth) * o.width);
    const c = document.createElement('canvas');
    c.width = o.width;
    c.height = h;
    c.getContext('2d').drawImage(v, 0, 0, o.width, h);
    return { url: c.toDataURL('image/webp', o.quality), w: o.width, h };
  },
  { src: SRC, time: TIME, width: WIDTH, quality: QUALITY },
);

await browser.close();

const buf = Buffer.from(data.url.split(',')[1], 'base64');
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, buf);
console.log(`wrote ${OUT} · ${data.w}×${data.h} · ${(buf.length / 1024).toFixed(0)} kB`);
