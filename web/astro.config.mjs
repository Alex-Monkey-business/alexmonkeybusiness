// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Needed so Astro can build absolute URLs. Social scrapers (Facebook,
  // LinkedIn, Slack, iMessage) reject relative og:image paths, so without
  // this the site shares with no preview image at all.
  site: 'https://alexmonkeybusiness.com',
});
