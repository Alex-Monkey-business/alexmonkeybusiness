/**
 * Renders tools/og-image.html into public/brand/social-card-natt*.png.
 *
 * The card is built from the site's own tokens, the real AMB monogram and the
 * front page's plate, so regenerating it after a design change keeps the
 * share preview honest.
 *
 *   node tools/render-og.mjs
 *
 * THE FILENAME IS THE CACHE-BUSTER. Slack, LinkedIn and X cache a card by URL
 * for days; when the design changes, the file gets a new name and the layout
 * points at it, or everyone keeps seeing the old card.
 *
 * Needs network access on first run: the template pulls Martian Mono from
 * Google Fonts, and the script fails loudly if it doesn't load rather than
 * silently shipping a card set in a fallback face.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = resolve(here, 'og-image.html');
const CARDS = [
  { lang: 'nb', out: resolve(here, '../public/brand/social-card-natt.png') },
  { lang: 'en', out: resolve(here, '../public/brand/social-card-natt-en.png') },
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2, // 2400x1260 — sharp on retina, still well inside limits
});

for (const card of CARDS) {
await page.goto(`file://${TEMPLATE}?lang=${card.lang}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const fonts = await page.evaluate(() => ({
  mono: document.fonts.check("300 72px 'Martian Mono'"),
}));
if (!fonts.mono) {
  throw new Error('Martian Mono did not load. Refusing to render a card in a fallback font.');
}
await page.evaluate(() => document.querySelector('img').decode());

await page.screenshot({ path: card.out, type: 'png' });
console.log(`wrote ${card.out}`);
}
await browser.close();
