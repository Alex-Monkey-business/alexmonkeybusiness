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
      aboutTitle: 'Kontakt — Alex Monkey Business',
    },
    nav: { projects: 'Prosjekter', about: 'Kontakt', cta: 'Ta kontakt', menu: 'Meny', close: 'Lukk' },
    /** A VERB, because the row is a button. «Ting jeg har laget» was a
        heading, and people tested on the front page read it as one — a list,
        not a thing to press (Sep 2026). Nouns label; verbs act. */
    work: { label: 'Se hva jeg har laget' },
    /** The other row on the front page, and the nav's name for /about. */
    aboutCard: { title: 'Ta', titleEm: 'kontakt' },
    card: { readCase: 'Les caset', visitSite: 'Se siden', inProgress: 'Underveis' },
    footer: { email: 'E-post', github: 'GitHub', about: 'Om' },
    /** The contact page. Four channels and nothing else — the rest of what
        used to be here was about; people come for a way in. */
    about: {
      eyebrow: 'ALEXANDER SAMNØY · BUILDER',
      channels: { x: 'x', linkedin: 'linkedin', email: 'e-post', phone: 'telefon' },
    },
    detail: { back: '← Tilbake', wip: 'underveis', comingSoon: 'Kommer snart.' },
    /** Offered to visitors whose browser is not Norwegian. */
    switchHint: 'Read in English',
    case: {
      lede: 'Ett kull, flere lag, og alt som skal klaffe hver uke. Laget av en trener, for trenere — så svaret står i appen, ikke et sted i Messenger-gruppa. Kamper og endringer synker fra FIKS/Min Fotball, og over 100 øvelser fra Tiim/NFF er klare til neste trening.',
      back: '← Tilbake',
      hood: [
        { em: 'FIKS / Min Fotball', rest: ' — alle kamper synker automatisk, også når tid, bane eller motstander endres.' },
        { em: 'Automatisk oppsett', rest: ' — lag, kull og kamper hentes inn når du oppretter et nytt kull eller lag.' },
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
          h: 'Neste bytte er ett trykk unna.',
          p: 'Appen foreslår hvem som skal ut og hvem som skal inn, så du slipper å holde styr på neste bytte. Ett trykk gjennomfører forslaget. Spilletida telles automatisk, og fargene viser hvem som har stått lenge på banen.',
        },
        {
          h: 'Ett lag om gangen.',
          p: 'Trykk på en farge. Resten av kullet forsvinner, og du ser bare ditt eget lag.',
        },
        {
          h: 'Er lagene jevne?',
          p: 'Spilt, vunnet og målforskjell per lag. Sammenlign lagene i kullet og følg utviklingen gjennom sesongen.',
        },
        {
          h: 'Appen foreslår hvem som kan steppe inn.',
          p: 'Ledig den dagen, ikke lånt ut den uka, færrest ekstrakamper først. Du får forslaget, ikke en liste å grave i.',
        },
        {
          h: 'Hele treningsuka på ett sted.',
          p: 'Planlegg uka med øvelser fra banken. Hver øvelse har sin egen veiledning, og tidsbudsjettet viser om du rekker alt før økta er over.',
        },
        {
          h: 'Over 100 øvelser. Rett på feltet.',
          p: 'Øvelser fra Tiim og NFF med video, beskrivelse og konkret veiledning. Se hvordan øvelsen gjøres, hva du skal se etter, og hva du kan si til spillerne.',
        },
        {
          h: 'Tolv kamper. To dager. To lag.',
          p: 'Bane, avspark og kampnummer, filtrert per lag. Ingen spør hvor og når, for det står der.',
        },
      ],
    },
    beach: {
      eyebrow: 'BEACHVOLLEY I LARVIK',
      lede: 'Hvem kommer, hvem vant, og hva skylder jeg? En app for Larvik Beach Volley klubb som samler påmelding, automatisk kampoppsett, lagtrekning og spleis på hallen. Mindre administrasjon mellom øktene, mer tid til å spille.',
      stack: 'Design + utvikling · Alex · 2026',
      features: [
        { h: 'Blir du med på neste økt?', p: 'Se når og hvor dere spiller, hvem som kommer og om det er plass. Meld deg på, eller sett deg på ventelista når økta er full.', alt: 'Neste økt med påmelding og deltakerliste', image: 'spill' },
        { h: 'Hallen deles på dem som var der.', p: 'Kostnaden fordeles etter oppmøte. Hver spiller får en samlet månedsregning og melder fra i appen når beløpet er vippset. Administrator bekrefter betalingen.', alt: 'Oversikt over utestående beløp og månedsregninger', image: 'betaling' },
        { h: 'Appen trekker lag. Dere spiller.', p: 'Lagene trekkes og kampoppsettet lages automatisk. Med fem spillere blir det King of the Beach: alle spiller med alle, og én hviler hver runde. Registrer resultatene og følg seire, poeng og oppmøte gjennom sesongen.', alt: 'Sesongstatistikk med spillernes resultater', image: 'statistikk' },
      ],
    },
    projects: {
      'halsen-g15': 'Kamper, spilletid og trening samlet i én trenerapp.',
      'larvik-beach': 'Påmelding, kamper og spleis for Larvik Beach Volley klubb.',
      'simons-solfilm': 'Nettside for et solfilmfirma i Larvik.',
    } as Record<string, string>,
  },

  en: {
    label: 'English',
    site: {
      aboutTitle: 'Contact — Alex Monkey Business',
    },
    nav: { projects: 'Projects', about: 'Contact', cta: 'Get in touch', menu: 'Menu', close: 'Close' },
    /** A verb, because the row is a button — see the Norwegian note. */
    work: { label: "See what I've made" },
    aboutCard: { title: 'Get in', titleEm: 'touch' },
    card: { readCase: 'Read the case', visitSite: 'Visit site', inProgress: 'In progress' },
    footer: { email: 'Email', github: 'GitHub', about: 'About' },
    about: {
      eyebrow: 'ALEXANDER SAMNØY · BUILDER',
      channels: { x: 'x', linkedin: 'linkedin', email: 'email', phone: 'phone' },
    },
    detail: { back: '← Back', wip: 'in progress', comingSoon: 'Coming soon.' },
    switchHint: 'Les på norsk',
    case: {
      lede: "One age group, several squads, and everything that has to line up every week. Built by a coach, for coaches — so the answer is in the app, not somewhere in a group chat. Fixtures and changes sync from FIKS/Min Fotball, with over 100 drills from Tiim/NFF ready for the next training session.",
      back: '← Back',
      hood: [
        { em: 'FIKS / Min Fotball', rest: ' — every match syncs automatically, including changes to times, venues and opponents.' },
        { em: 'Automatic setup', rest: ' — teams, age groups and fixtures are imported when you create a new age group or team.' },
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
          h: 'The next substitution is one tap away.',
          p: 'The app suggests who comes off and who goes on, so you don’t have to keep track of the next substitution. One tap makes the suggested change. Playing time is tracked automatically, and colours show who has been on the pitch longest.',
        },
        {
          h: 'One squad at a time.',
          p: 'Tap a colour. The rest of the age group disappears and you see only your own team.',
        },
        {
          h: 'Are the teams even?',
          p: 'Played, won and goal difference for each squad. Compare teams within the age group and follow their progress through the season.',
        },
        {
          h: 'The app suggests who can step in.',
          p: 'Free that day, not already lent out that week, fewest extra appearances first. You get the suggestion, not a list to dig through.',
        },
        {
          h: 'The whole training week in one place.',
          p: 'Plan the week with drills from the library. Each drill has its own guidance, and the time budget shows whether everything fits before the session ends.',
        },
        {
          h: 'Over 100 drills. Ready for the pitch.',
          p: 'Drills from Tiim and NFF with video, descriptions and practical coaching guidance. See how each drill works, what to look for and what to tell the players.',
        },
        {
          h: 'Twelve matches. Two days. Two teams.',
          p: "Pitch, kick-off and match number, filtered per team. Nobody asks where and when, because it's there.",
        },
      ],
    },
    beach: {
      eyebrow: 'BEACH VOLLEYBALL IN LARVIK',
      lede: "Who is coming, who won, and what do I owe? An app for Larvik Beach Volley club, bringing sign-ups, automatic match schedules, team draws and shared hall costs together. Less admin between sessions, more time to play.",
      stack: 'Design + build · Alex · 2026',
      features: [
        { h: 'Joining the next session?', p: 'See when and where you play, who is coming and whether there is room. Sign up, or join the waiting list when the session is full.', alt: 'Next session with sign-up and attendance list', image: 'spill' },
        { h: 'Share the hall with those who played.', p: 'Costs are split by attendance. Each player gets one monthly bill and reports their Vipps payment in the app. An administrator confirms the payment.', alt: 'Outstanding balance and monthly bills', image: 'betaling' },
        { h: 'The app draws the teams. You play.', p: 'Teams are drawn and the match schedule is created automatically. With five players, King of the Beach pairs everyone with everyone, with one player resting each round. Record results and track wins, points and attendance throughout the season.', alt: 'Season statistics with player results', image: 'statistikk' },
      ],
    },
    projects: {
      'halsen-g15': 'Fixtures, playing time and training in one coaching app.',
      'larvik-beach': 'Sign-ups, matches and shared costs for Larvik Beach Volley club.',
      'simons-solfilm': 'A site for a window-tint shop in Larvik.',
    } as Record<string, string>,
  },
} as const;

export type Strings = (typeof strings)['en'];
