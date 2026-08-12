/**
 * Renders tools/og-image.html into public/brand/social-card.png.
 *
 * The card is built from the site's own tokens and the real AMB monogram, so
 * regenerating it after a design change keeps the share preview honest.
 *
 *   node tools/render-og.mjs
 *
 * Needs network access on first run: the template pulls EB Garamond and
 * Figtree from Google Fonts, and the script fails loudly if they don't load
 * rather than silently shipping a card set in a fallback face.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = resolve(here, 'og-image.html');
const OUT = resolve(here, '../public/brand/social-card.png');

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2, // 2400x1260 — sharp on retina, still well inside limits
});

await page.goto(`file://${TEMPLATE}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const fonts = await page.evaluate(() => ({
  serif: document.fonts.check("400 116px 'EB Garamond'"),
  sans: document.fonts.check("400 25px 'Figtree'"),
}));
if (!fonts.serif || !fonts.sans) {
  await browser.close();
  throw new Error(
    `Webfonts did not load (EB Garamond: ${fonts.serif}, Figtree: ${fonts.sans}). ` +
      'Refusing to render a card in a fallback font.'
  );
}

await page.screenshot({ path: OUT, type: 'png' });
await browser.close();
console.log(`wrote ${OUT}`);
