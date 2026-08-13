/**
 * Every piece of prose on the site, in both languages.
 *
 * Norwegian is the default and sits at `/`; English is at `/en/`. Keeping the
 * copy here rather than in the pages means a wording change is one edit in one
 * file instead of a hunt through four templates.
 *
 * Where a line carries an italic accent, it is split into parts rather than
 * holding markup in a string — `titleEm` is the accented word.
 */
export type Lang = 'nb' | 'en';
export const LANGS: Lang[] = ['nb', 'en'];
export const DEFAULT_LANG: Lang = 'nb';

/** BCP-47 values for <html lang> and hreflang. */
export const HTML_LANG: Record<Lang, string> = { nb: 'nb-NO', en: 'en' };

export const strings = {
  nb: {
    label: 'Norsk',
    site: {
      description: 'Små ting. Store planer. Og et par ting som faktisk ble ferdige.',
      aboutTitle: 'Om — Alex Monkey Business',
    },
    nav: { projects: 'Prosjekter', about: 'Om', cta: 'Ta kontakt' },
    /** The hero shows no words beyond the name — this labels the scroll cue. */
    hero: { seeWork: 'Se arbeidet' },
    card: { readCase: 'Les caset', visitSite: 'Se siden', inProgress: 'Underveis' },
    footer: { email: 'E-post', github: 'GitHub', about: 'Om' },
    about: {
      title: 'Webapplikasjoner, mobilapper, nettsider, presentasjoner',
      body: 'Produkteier og designer hos Avonova til daglig. Resten lager jeg på fritiden, mest fordi det er gøy.',
    },
    detail: { back: '← Tilbake', wip: 'underveis', comingSoon: 'Kommer snart.' },
    /** Offered to visitors whose browser is not Norwegian. */
    switchHint: 'Read in English',
    case: {
      eyebrow: 'Case — Halsen G2015',
      lede: 'En hel sesong i én app. Det meste passer seg selv.',
      back: '← Tilbake',
      underHood: 'Under panseret',
      hood: [
        { em: 'NFF-sync', rest: ' — tider, baner og motstandere oppdaterer seg selv.' },
        { pre: 'Dommerhonorar over ', em: 'Vipps', rest: ', utlegget logget i samme trykk.' },
        { em: 'Sesongoppgjør', rest: ' — troppene ruller over, historikken blir liggende i sesongen den skjedde i.' },
        { em: 'Excel-eksport', rest: ' til sesongregnskapet.' },
      ],
      stack: ['Live med Halsen G2015', 'Tre lag, to cuplag', 'Design + utvikling · Alex'],
      features: [
        {
          h: 'Åpner på dagen du er i.',
          p: 'Neste økt, neste kamp, og det som fortsatt henger. Ingenting annet.',
        },
        {
          h: 'Minuttene teller seg selv.',
          p: 'Sett laget på banen og blås i gang. Hver spiller har sin egen klokke.',
        },
        {
          h: 'Tre lag, ett om gangen.',
          p: 'Trykk på en farge. Sesongen blir det lagets sesong.',
        },
        {
          h: 'Er lagene jevne?',
          p: 'Spilt, vunnet, målforskjell — per lag, ikke per klubb. Ingen tabell viser deg det.',
        },
        {
          h: 'Den finner hvem som kan steppe inn.',
          p: 'Ledig den dagen, ikke lånt ut den uka, færrest ekstrakamper først. Gruppechatten får hvile litt.',
        },
        {
          h: 'Hvorfor-et, skrevet ned.',
          p: 'Sju prinsipper for hvordan laget trener. En vikar på tirsdag kjører samme fotball som lørdagen før.',
        },
        {
          h: 'Økter med ryggrad.',
          p: 'Perioder, økter, øvelser. Uka er skrevet ned, ikke husket.',
        },
        {
          h: 'Tolv kamper. To dager. To lag.',
          p: 'Alt på ett sted. Bane, avspark og kampnummer, filtrert per lag.',
        },
      ],
    },
    projects: {
      'halsen-g15': 'Mindre styr. Mer fotball.',
      'ai-meetup-larvik': 'En kveld om AI. Uten dresskode.',
      'larvik-beach-volley': 'Sand er best inne også.',
      diggski: 'Ikke helt klar ennå. Men på vei et sted.',
    } as Record<string, string>,
  },

  en: {
    label: 'English',
    site: {
      description: 'Small things. Big plans. And a couple that actually got finished.',
      aboutTitle: 'About — Alex Monkey Business',
    },
    nav: { projects: 'Projects', about: 'About', cta: 'Get in touch' },
    /** The hero shows no words beyond the name — this labels the scroll cue. */
    hero: { seeWork: 'See the work' },
    card: { readCase: 'Read the case', visitSite: 'Visit site', inProgress: 'In progress' },
    footer: { email: 'Email', github: 'GitHub', about: 'About' },
    about: {
      title: 'Web apps, mobile apps, websites, presentations',
      body: "Product owner and designer at Avonova by day. The rest I make in my own time, mostly because it's fun.",
    },
    detail: { back: '← Back', wip: 'in progress', comingSoon: 'Coming soon.' },
    switchHint: 'Les på norsk',
    case: {
      eyebrow: 'Case — Halsen G2015',
      lede: 'A whole season in one app. Most of it looks after itself.',
      back: '← Back',
      underHood: 'Under the hood',
      hood: [
        { em: 'NFF sync', rest: ' — times, venues and opponents update on their own.' },
        { pre: 'Referee fees over ', em: 'Vipps', rest: ', expense logged in the same tap.' },
        { em: 'Season settlement', rest: ' — squads roll over, history stays with the season it happened in.' },
        { em: 'Excel export', rest: ' for the end-of-season accounts.' },
      ],
      stack: ['Live with Halsen G2015', 'Three squads, two cup teams', 'Design + build · Alex'],
      features: [
        {
          h: "Opens to the day you're in.",
          p: 'The next session, the next match, and whatever is still unfinished. Nothing else.',
        },
        {
          h: 'Every minute counts itself.',
          p: "Put the team on the pitch and kick off. Every player has their own clock.",
        },
        {
          h: 'Three teams, one at a time.',
          p: "Tap a colour. The season becomes that squad's season.",
        },
        {
          h: 'Are the teams even?',
          p: 'Played, won, goal difference — per squad, not per club. No league table shows you that.',
        },
        {
          h: 'It finds who can step in.',
          p: 'Free that day, not already lent out that week, fewest extra appearances first. The group chat gets a rest.',
        },
        {
          h: 'The why, written down.',
          p: 'Seven principles for how the team trains. A stand-in on Tuesday runs the same football as the Saturday before.',
        },
        {
          h: 'Sessions with a spine.',
          p: 'Periods, sessions, drills. The week is written down rather than remembered.',
        },
        {
          h: 'Twelve matches. Two days. Two teams.',
          p: 'All in one place. Pitch, kick-off and match number, filtered per team.',
        },
      ],
    },
    projects: {
      'halsen-g15': 'Less hassle. More football.',
      'ai-meetup-larvik': 'An evening about AI. No dress code.',
      'larvik-beach-volley': 'Sand belongs indoors too.',
      diggski: "Not quite ready. But headed somewhere.",
    } as Record<string, string>,
  },
} as const;

export type Strings = (typeof strings)['en'];
