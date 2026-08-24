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
    nav: { projects: 'Prosjekter', about: 'Om', cta: 'Ta kontakt', menu: 'Meny', close: 'Lukk' },
    /** Same word as the nav item, so clicking «Prosjekter» lands on «Prosjekter». */
    work: { label: 'Prosjekter' },
    card: { readCase: 'Les caset', visitSite: 'Se siden', inProgress: 'Underveis' },
    footer: { email: 'E-post', github: 'GitHub', about: 'Om' },
    about: {
      title: 'Webapplikasjoner, mobilapper, nettsider, presentasjoner',
      body: 'Produkteier hos Avonova til daglig. Resten lager jeg på fritiden, mest fordi det er gøy.',
    },
    detail: { back: '← Tilbake', wip: 'underveis', comingSoon: 'Kommer snart.' },
    /** Offered to visitors whose browser is not Norwegian. */
    switchHint: 'Read in English',
    case: {
      lede: 'Ett kull, tre lag, og alt som skal klaffe hver uke. Laget av en trener, for trenere — så svaret står i appen, ikke et sted i Messenger-gruppa. Bygget om igjen hver gang noen sier hva som mangler.',
      back: '← Tilbake',
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
          p: 'Neste økt, neste kamp, og det du ikke har ordnet ennå. Du slipper å holde det i hodet.',
        },
        {
          h: 'Minuttene teller seg selv.',
          p: 'Sett laget på banen og blås i gang. Etterpå vet du hvem som har spilt for lite — uten å ha telt selv.',
        },
        {
          h: 'Ett lag om gangen.',
          p: 'Trykk på en farge. Resten av kullet forsvinner, og du ser bare ditt eget lag.',
        },
        {
          h: 'Er lagene jevne?',
          p: 'Spilt, vunnet, målforskjell — per lag, ikke per klubb. Verken Spond eller Hoopit viser deg det.',
        },
        {
          h: 'Den finner hvem som kan steppe inn.',
          p: 'Ledig den dagen, ikke lånt ut den uka, færrest ekstrakamper først. Du får forslaget, ikke en liste å grave i.',
        },
        {
          h: 'Sånn trener vi.',
          p: 'Sju prinsipper, skrevet ned. Vi er mange trenere, og alle kjører det samme uansett hvem som tar økta.',
        },
        {
          h: 'Uka er satt opp.',
          p: 'Perioder, økter og øvelser. Du står aldri på banen og finner på noe.',
        },
        {
          h: 'Tolv kamper. To dager. To lag.',
          p: 'Bane, avspark og kampnummer, filtrert per lag. Ingen spør hvor og når, for det står der.',
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
    nav: { projects: 'Projects', about: 'About', cta: 'Get in touch', menu: 'Menu', close: 'Close' },
    /** Same word as the nav item, so clicking "Projects" lands on "Projects". */
    work: { label: 'Projects' },
    card: { readCase: 'Read the case', visitSite: 'Visit site', inProgress: 'In progress' },
    footer: { email: 'Email', github: 'GitHub', about: 'About' },
    about: {
      title: 'Web apps, mobile apps, websites, presentations',
      body: "Product owner at Avonova by day. The rest I make in my own time, mostly because it's fun.",
    },
    detail: { back: '← Back', wip: 'in progress', comingSoon: 'Coming soon.' },
    switchHint: 'Les på norsk',
    case: {
      lede: "One age group, three squads, and everything that has to line up every week. Built by a coach, for coaches — so the answer is in the app, not somewhere in a group chat. Rebuilt every time someone says what's missing.",
      back: '← Back',
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
          p: "The next session, the next match, and the thing you haven't sorted yet. You don't have to keep it in your head.",
        },
        {
          h: 'Every minute counts itself.',
          p: 'Put the team on the pitch and kick off. Afterwards you know who has played too little — without having counted.',
        },
        {
          h: 'One squad at a time.',
          p: 'Tap a colour. The rest of the age group disappears and you see only your own team.',
        },
        {
          h: 'Are the teams even?',
          p: 'Played, won, goal difference — per squad, not per club. Neither Spond nor Hoopit shows you that.',
        },
        {
          h: 'It finds who can step in.',
          p: 'Free that day, not already lent out that week, fewest extra appearances first. You get the suggestion, not a list to dig through.',
        },
        {
          h: 'This is how we train.',
          p: 'Seven principles, written down. There are several of us coaching, and we all run the same football.',
        },
        {
          h: 'The week is already set.',
          p: 'Blocks, sessions and drills. You never stand on the pitch making it up.',
        },
        {
          h: 'Twelve matches. Two days. Two teams.',
          p: "Pitch, kick-off and match number, filtered per team. Nobody asks where and when, because it's there.",
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
