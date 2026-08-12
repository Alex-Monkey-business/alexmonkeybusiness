// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Needed so Astro can build absolute URLs. Social scrapers (Facebook,
  // LinkedIn, Slack, iMessage) reject relative og:image paths, so without
  // this the site shares with no preview image at all.
  site: 'https://alexmonkeybusiness.com',

  // Norwegian is the main audience, so it sits at the root with no prefix.
  // English lives under /en/. Path-based, so it has nothing to do with owning
  // a .no domain.
  i18n: {
    defaultLocale: 'nb',
    locales: ['nb', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
