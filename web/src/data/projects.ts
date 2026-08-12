/**
 * Card copy lives in `i18n/strings.ts` under `projects[slug]`, not here — it is
 * a voice, and it differs per language. This file holds only what is the same
 * in both: the name, the year, and where the card points.
 */
export type Project = {
  slug: string;
  title: string;
  titleEm?: string;
  year: string;
  status?: 'wip';
  /** External URL — when present, the card opens in a new tab. */
  url?: string;
};

export const projects: Project[] = [
  {
    slug: 'halsen-g15',
    title: 'Bench',
    titleEm: 'Boss',
    year: '2026',
  },
  {
    slug: 'ai-meetup-larvik',
    title: 'AI Meetup',
    titleEm: 'Larvik',
    year: '2026',
    url: 'https://ai-meetup-larvik.netlify.app/',
  },
  {
    slug: 'larvik-beach-volley',
    title: 'Larvik Beach',
    titleEm: 'Volley',
    year: '2026',
    url: 'https://larvik-beach-volley.netlify.app/',
  },
  {
    slug: 'diggski',
    title: 'DiggSki',
    year: '2026',
    status: 'wip',
  },
];
