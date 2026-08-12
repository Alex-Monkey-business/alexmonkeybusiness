import { strings, LANGS, DEFAULT_LANG, HTML_LANG, type Lang } from './strings';

export { strings, LANGS, DEFAULT_LANG, HTML_LANG };
export type { Lang };

/** Which language a URL is asking for. `/en/...` is English, everything else Norwegian. */
export function langFromUrl(url: URL): Lang {
  const first = url.pathname.split('/').filter(Boolean)[0];
  return first === 'en' ? 'en' : DEFAULT_LANG;
}

export function t(lang: Lang) {
  return strings[lang];
}

/**
 * Prefix a root-relative path for a language. Norwegian is unprefixed because
 * it is the default locale, so `/` stays `/` and `/about` stays `/about`.
 */
export function path(lang: Lang, p: string): string {
  const clean = '/' + p.replace(/^\/+/, '');
  if (lang === DEFAULT_LANG) return clean;
  return clean === '/' ? '/en/' : `/en${clean}`;
}

/** The same page in the other language, for the nav switch and hreflang. */
export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? DEFAULT_LANG : 'en';
}

/** Strip the locale prefix so a path can be re-prefixed for the other language. */
export function stripLang(pathname: string): string {
  const p = pathname.replace(/^\/en(?=\/|$)/, '');
  return p === '' ? '/' : p;
}
