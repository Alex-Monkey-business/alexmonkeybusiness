/**
 * THE QUIET TAKES — for `/lab/rygg`. Four chapters, one action each.
 *
 * Alex, 28 Sep 2026, on the full-app takes: «for mye som skjer på skjermene …
 * overload med content og støy». So each take here is edited like film:
 *
 *   - CSS injected into the RECORDING (never the app) hides everything that is
 *     not the chapter's story: the tab bar always, and per screen the sections
 *     that are true but beside the point. It is still the real UI, cut.
 *   - Setup happens before the take: `mark()` stamps the moment the action
 *     begins, and ffmpeg trims everything before it away.
 *   - The one moment each chapter is about is MEASURED here, from the DOM, as
 *     a fraction of the 390×844 screen — the page's lilac frame lands on it
 *     without anyone reading pixels off a frame.
 *
 * Output: rec/rolig-<name>.webm (untrimmed) and rec/rolig.json (trim start,
 * moment time after trim, frame rect). `tools/case/finish-rolig.sh` does the
 * trimming, the posters and the scrub encodes.
 *
 * Needs BenchBoss demo mode on :5199 from a CLEAN checkout — see README.
 */
import pkg from 'playwright';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const { chromium } = pkg;
const HERE = fileURLToPath(new URL('./', import.meta.url));
const OUT = HERE + 'rec';
const AUTH = JSON.stringify({ profile:{id:'demo-profile',email:null,full_name:'Alex',is_platform_admin:false},
  memberships:[{id:'demo-member',cohort_id:'demo-cohort',cohort_name:'Halsen G2015',birth_year:2015,club_id:'demo-club',club_name:'Halsen IL',club_key:'halsen',club_short_name:'Halsen',players_on_pitch:7,period_count:2,period_minutes:30,role:'coach',coach_id:'demo-1',name:'Alex',preferred_team:null,preferred_cup_team:null}]});
const which = process.argv.slice(2);
const meta = fs.existsSync(`${OUT}/rolig.json`) ? JSON.parse(fs.readFileSync(`${OUT}/rolig.json`, 'utf8')) : {};
const b = await chromium.launch({ args: ['--force-device-scale-factor=2'] });

const BASE = '.demo-banner,.bottom-nav{display:none!important}';

async function record(name, path, date, css, run) {
  if (which.length && !which.includes(name)) return;
  const ctx = await b.newContext({
    viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true,
    serviceWorkers:'block', locale:'nb-NO', timezoneId:'Europe/Oslo',
    recordVideo:{ dir: OUT, size:{ width:780, height:1688 } },
  });
  await ctx.addInitScript(([a, css]) => {
    localStorage.setItem('bb_auth_v1', a); localStorage.setItem('bb_active_cohort','demo-cohort');
    const add = () => {
      const root = document.head || document.documentElement;
      if (!root) return setTimeout(add, 5);
      const st = document.createElement('style'); st.textContent = css; root.appendChild(st);
    };
    add();
  }, [AUTH, BASE + css]);
  const p = await ctx.newPage();
  const born = Date.now();
  if (date) await p.clock.setFixedTime(new Date(date + 'T10:00:00'));
  await p.goto('http://localhost:5199' + path, { waitUntil:'networkidle' });
  await p.waitForTimeout(900);
  const m = { t0: 0, at: 0, rect: null };
  const mark = () => { m.t0 = (Date.now() - born) / 1000; };
  /* The frame: the union of the matched elements' boxes, padded a little,
     as fractions of the screen. `at` is taken at the same instant. */
  const moment = async (...sels) => {
    m.at = (Date.now() - born) / 1000;
    m.rect = await p.evaluate((sels) => {
      /* `text:x` matches the innermost element whose own text contains x. */
      const find = (s) => s.startsWith('text:')
        ? Array.from(document.querySelectorAll('body *')).filter((e) => e.children.length === 0 && e.textContent.includes(s.slice(5)) && e.getBoundingClientRect().height)
        : Array.from(document.querySelectorAll(s));
      const rs = sels.flatMap(find).map((e) => e.getBoundingClientRect()).filter((r) => r.height);
      const x0 = Math.min(...rs.map((r) => r.left)), y0 = Math.min(...rs.map((r) => r.top));
      const x1 = Math.max(...rs.map((r) => r.right)), y1 = Math.max(...rs.map((r) => r.bottom));
      const P = 6;
      const f = (v, d) => Math.max(0, Math.min(1, v / d));
      return { x: f(x0 - P, 390), y: f(y0 - P, 844), w: f(x1 - x0 + 2 * P, 390), h: f(y1 - y0 + 2 * P, 844) };
    }, sels);
  };
  try { await run(p, mark, moment); } catch (e) { process.exitCode = 1; console.error(name, 'FAILED:', e.message); await p.screenshot({ path: `${OUT}/rolig-${name}-fail.png` }); }
  await p.waitForTimeout(600);
  const v = p.video();
  await ctx.close();
  fs.renameSync(await v.path(), `${OUT}/rolig-${name}.webm`);
  meta[name] = { t0: +m.t0.toFixed(2), at: +(m.at - m.t0).toFixed(2), rect: m.rect };
  console.log('recorded', name, JSON.stringify(meta[name]));
}

// 01 — Dagen. Only today's training and the next match; the week, the
// reminders and the cup are true but not this sentence. No action: the page
// arriving IS the take (its cards fade up). The frame is what the coach did
// not have to remember.
await record('dagen', '/', '2026-03-10',
  '.hjem-stack>section{display:none!important}',
  async (p, mark, moment) => {
    mark();
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(2600);
    await moment('.next-match__missing');
    await p.waitForTimeout(3400);
  });

// 02 — Byttet. The match is already running when the take starts; the lineup
// happened off camera. One tap on Filip, the app offers Henrik, one tap.
await record('byttet', '/kamp/dm-4/live', null,
  '.mm__score,.mm__controls,.mm__back{display:none!important}',
  async (p, mark, moment) => {
    await p.getByRole('button', { name: 'Fyll resten' }).click();
    await p.waitForTimeout(500);
    await p.getByRole('button', { name: 'Start kamp' }).click();
    await p.waitForTimeout(1200);
    mark();
    await p.waitForTimeout(2200);
    await p.locator('.marker', { hasText: 'Filip' }).click();
    await p.waitForSelector('.mm__bchip--forslag', { timeout: 4000 });
    await p.waitForTimeout(900);
    await moment('text:Hvem går inn', '.mm__bchip--forslag');
    await p.waitForTimeout(1500);
    await p.locator('.mm__bchip--forslag').click();
    await p.waitForTimeout(3000);
  });

// 03 — Lånet. The match header, then the loan list with only what is chosen
// and what is recommended. One tap on Mads; he moves up to Valgt.
await record('lanet', '/kamp/dm-4', '2026-03-12',
  [
    '.md-top',
    '.px-lg.mt-lg:has(.match-mode-cta)',
    '.detail-disclosures>.disclosure:first-child',
    '.disclosure__inner>.sub-section:first-child',
    '.sub-section:has(.coach-pills)',
    '.loan-group:has(.loan-group__label--muted)',
    '.sub-section__label--soft',
  ].join(',') + '{display:none!important}',
  async (p, mark, moment) => {
    await p.getByText('Tropp', { exact: true }).click();
    await p.waitForTimeout(900);
    mark();
    await p.waitForTimeout(1800);
    await moment('.loan-group__star', '.loan-group:has(.loan-group__star) .loan-pill:first-child');
    await p.waitForTimeout(1600);
    await p.locator('.loan-pill', { hasText: 'Mads' }).click();
    await p.waitForTimeout(3000);
  });

// 04 — Treningsuka. Tuesday only, in plan mode, without the focus prose, the
// other days, the arrows or the way in to the bank. Two drills already have
// their time (off camera); the take gives the third its time and the day's
// budget counts down. The frame is the budget line.
await record('uka', '/trening', '2026-09-08',
  [
    '.dag__resten', 'section.dag:not(.dag--open)', '.uke__legg-til', '.uke__steder',
    '.dag__action', '.knapp--legg', '.rad__piler', '.uke__head',
  ].join(',') + '{display:none!important}',
  async (p, mark, moment) => {
    await p.getByRole('button', { name:'Planlegg treninga', exact:true }).first().click();
    await p.waitForTimeout(700);
    const give = async (drill, taps) => {
      await p.getByRole('button', { name: `Endre ${drill}` }).click();
      await p.waitForSelector('.stepper__btn', { timeout: 4000 });
      await p.waitForTimeout(450);
      for (let i = 0; i < taps; i++) { await p.locator('.stepper__btn[aria-label="Lengre"]').click(); await p.waitForTimeout(240); }
      await p.waitForTimeout(350);
      await p.locator('.ds-sheet__close').click();
      await p.waitForTimeout(650);
    };
    await give('Medtak, dribling, vending og pasning', 4);
    await give('3v3 med press i ryggen', 4);
    mark();
    await p.waitForTimeout(1600);
    await give('Vinneren står', 3);
    await p.waitForTimeout(400);
    await moment('text:min ledig');
    await p.waitForTimeout(2800);
  });

fs.writeFileSync(`${OUT}/rolig.json`, JSON.stringify(meta, null, 2));
await b.close();
