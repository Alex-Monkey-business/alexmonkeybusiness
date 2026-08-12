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
      description: 'Produktdesign og små apper, bygget fra ende til ende.',
      aboutTitle: 'Om — Alex Monkey Business',
    },
    nav: { projects: 'Prosjekter', about: 'Om', cta: 'Ta kontakt' },
    hero: {
      lede: 'Produktdesign og små apper, bygget fra ende til ende. Sideprosjekter og verktøy for folk jeg kjenner.',
      seeWork: 'Se arbeidet',
      getInTouch: 'Ta kontakt',
    },
    work: {
      count: (n: number) => `${n} prosjekter`,
      titleA: 'Ting jeg har',
      titleEm: 'bygget',
    },
    card: { readCase: 'Les caset', visitSite: 'Se siden', inProgress: 'Underveis' },
    footer: { email: 'E-post', github: 'GitHub', about: 'Om' },
    about: {
      eyebrow: 'Om',
      title: 'Bygger',
      body1a: 'Produktmann av yrke. Sideprosjekter av',
      body1em: 'natur',
      body2: 'Inspirert av Elon Musks ambisjon og Candide Thovex’ flyt.',
    },
    detail: { back: '← Tilbake', wip: 'underveis', comingSoon: 'Kommer snart.' },
    /** Offered to visitors whose browser is not Norwegian. */
    switchHint: 'Read in English',
    case: {
      eyebrow: 'Case — Halsen G2015',
      lede: 'Full kontroll på laget. Mesteparten på autopilot.',
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
          p: 'Neste økt, neste kamp, og det som fortsatt henger. Ingenting annet på skjermen.',
        },
        {
          h: 'Minuttene teller seg selv.',
          p: 'Sett laget på banen, så blås i gang. Hver spiller har sin egen klokke: en innbytter som kommer inn i det åttende minuttet starter på null mens kampklokka går videre.',
        },
        {
          h: 'Tre lag, ett om gangen.',
          p: 'Tre lag ut av én klubb. Trykk på en farge, og sesongen blir det lagets sesong. Tallene står på fanene.',
        },
        {
          h: 'Er lagene jevne?',
          p: 'Spilt, vunnet, uavgjort, målforskjell, poeng — per lag, ikke per klubb. Ingen tabell viser deg det.',
        },
        {
          h: 'Den foreslår innbytteren.',
          p: 'Appen stjernemerker de som er egnet, ledige den dagen, og ikke alt lånt ut den uka. Færrest ekstrakamper først, så belastningen fordeles i stedet for å havne på den som svarer først i gruppechatten.',
        },
        {
          h: 'Hvorfor-et, skrevet ned.',
          p: 'Sju prinsipper for hvordan dette laget trener. En vikar på en tirsdag kjører samme fotball som lørdagen før. Det ligger i appen, ikke i en PDF.',
        },
        {
          h: 'Økter med ryggrad.',
          p: 'Perioder holder økter, økter holder øvelser. Hver øvelse har sitt fokus og en tyngre variant. Uka er skrevet ned, ikke husket.',
        },
        {
          h: 'En hel turnering, to lag.',
          p: 'Tolv kamper over to dager, to Halsen-lag. Bane, avspark, kampnummer, filtrert per lag. Én skjerm i stedet for et utskrevet ark.',
        },
      ],
    },
    projects: {
      'halsen-g15': 'trenerapp for fotballag',
      'ai-meetup-larvik': 'eventside + invitasjon',
      'larvik-beach-volley': 'forslag om innendørsbane i Agnespark',
    } as Record<string, string>,
  },

  en: {
    label: 'English',
    site: {
      description: 'Product design and small software, built end to end.',
      aboutTitle: 'About — Alex Monkey Business',
    },
    nav: { projects: 'Projects', about: 'About', cta: 'Get in touch' },
    hero: {
      lede: 'Product design and small software, built end to end. Side projects and tools for people I know.',
      seeWork: 'See the work',
      getInTouch: 'Get in touch',
    },
    work: {
      count: (n: number) => `${n} projects`,
      titleA: "Things I've",
      titleEm: 'shipped',
    },
    card: { readCase: 'Read the case', visitSite: 'Visit site', inProgress: 'In progress' },
    footer: { email: 'Email', github: 'GitHub', about: 'About' },
    about: {
      eyebrow: 'About',
      title: 'Builder',
      body1a: 'Product guy by profession. Side hustles by',
      body1em: 'nature',
      body2: 'Inspired by Elon Musk’s ambition and Candide Thovex’s flow.',
    },
    detail: { back: '← Back', wip: 'in progress', comingSoon: 'Coming soon.' },
    switchHint: 'Les på norsk',
    case: {
      eyebrow: 'Case — Halsen G2015',
      lede: 'Full control of the team. Most of it on autopilot.',
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
          p: 'The next session, the next match, and whatever is still unfinished. Nothing else on the screen.',
        },
        {
          h: 'Every minute counts itself.',
          p: "Build the team on the pitch, then kick off. Each player's clock runs on its own: a substitute coming on in the eighth minute starts at zero while the match clock carries on.",
        },
        {
          h: 'Three teams, one at a time.',
          p: "Three squads out of one club. Tap a colour and the season becomes that squad's season. The counts are on the tabs.",
        },
        {
          h: 'Are the teams even?',
          p: 'Played, won, drawn, goal difference, points — per squad rather than per club. No league table shows you that.',
        },
        {
          h: 'It picks the stand-in for you.',
          p: 'The app stars whoever is eligible, free that day, and not already lent out that week. Fewest extra appearances first, so the load spreads instead of landing on whoever answers the group chat fastest.',
        },
        {
          h: 'The why, written down.',
          p: 'Seven principles for how this team trains. A stand-in on a Tuesday runs the same football as the Saturday before. It lives in the app, not a PDF.',
        },
        {
          h: 'Sessions with a spine.',
          p: 'Periods hold sessions, sessions hold drills. Every drill carries its focus and a harder variant. The week is written down rather than remembered.',
        },
        {
          h: 'A whole tournament, two teams.',
          p: 'Twelve matches over two days, two Halsen sides. Pitch, kick-off, match number, filtered per team. One screen instead of a printed sheet.',
        },
      ],
    },
    projects: {
      'halsen-g15': 'coaching app for football teams',
      'ai-meetup-larvik': 'event page + invite',
      'larvik-beach-volley': 'pitch for an indoor court at Agnes park',
    } as Record<string, string>,
  },
} as const;

export type Strings = (typeof strings)['en'];
