import pkg from 'playwright';
import fs from 'node:fs';
const { chromium } = pkg;
import { fileURLToPath } from 'node:url';
const HERE = fileURLToPath(new URL('./', import.meta.url));
const OUT = HERE + 'rec';
const AUTH = JSON.stringify({ profile:{id:'demo-profile',email:null,full_name:'Alex',is_platform_admin:false},
  memberships:[{id:'demo-member',cohort_id:'demo-cohort',cohort_name:'Halsen G2015',birth_year:2015,club_id:'demo-club',club_name:'Halsen IL',club_key:'halsen',club_short_name:'Halsen',players_on_pitch:7,period_count:2,period_minutes:30,role:'coach',coach_id:'demo-1',name:'Alex',preferred_team:null,preferred_cup_team:null}]});
const which = process.argv.slice(2);
const b = await chromium.launch({ args: ['--force-device-scale-factor=2'] });

async function record(name, path, date, run) {
  if (which.length && !which.includes(name)) return;
  const ctx = await b.newContext({
    viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true,
    serviceWorkers:'block', locale:'nb-NO', timezoneId:'Europe/Oslo',
    recordVideo:{ dir: OUT, size:{ width:780, height:1688 } },
  });
  await ctx.addInitScript(a => {
    localStorage.setItem('bb_auth_v1', a); localStorage.setItem('bb_active_cohort','demo-cohort');
    // The init script can run before <head> exists; poll until it does so
    // the banner is gone from the very first frame.
    const hide = () => {
      const root = document.head || document.documentElement;
      if (!root) return setTimeout(hide, 5);
      const st = document.createElement('style'); st.textContent = '.demo-banner{display:none!important}';
      root.appendChild(st);
    };
    hide();
  }, AUTH);
  const p = await ctx.newPage();
  if (date) await p.clock.setFixedTime(new Date(date + 'T10:00:00'));
  await p.goto('http://localhost:5199' + path, { waitUntil:'networkidle' });
  await p.addStyleTag({ content:'.demo-banner{display:none!important}' });
  await p.waitForTimeout(1500);
  try { await run(p); } catch (e) { process.exitCode = 1; console.error(name, 'FAILED:', e.message); await p.screenshot({ path: `${OUT}/${name}-fail.png` }); }
  await p.waitForTimeout(1200);
  const v = p.video();
  await ctx.close();
  const src = await v.path();
  fs.renameSync(src, `${OUT}/${name}.webm`);
  console.log('recorded', name);
}

const ease = async (p, dy, steps=24) => { for (let i=0;i<steps;i++){ await p.mouse.wheel(0, dy/steps); await p.waitForTimeout(28);} };

// 01 — Hjem: trening i dag, neste kamp, treningene denne uka. Tirsdag 10. mars
// er dagen som gir alle tre over hverandre (torsdag 12. mister neste-kamp-
// kortet til dommervarselet). Ett rolig drag ned til uka, hold, og opp igjen —
// Alex, 14. sep: «det holder med neste kamp, dagens trening og treninger
// denne uka».
await record('hjem', '/', '2026-03-10', async p => {
  await p.waitForTimeout(2200);
  await ease(p, 300, 30); await p.waitForTimeout(2600);
  await ease(p, -300, 30); await p.waitForTimeout(1600);
});

// 05 — Treningsuka (28. sep-flyten): «Planlegg treninga» gjør dagen til rader;
// trykk en rad → arket med «Tid i dag», trykk + noen ganger, lukk. Tre
// øvelser får tid, og dagens budsjett fylles opp mot 1 t 30 min.
await record('trening', '/trening', '2026-09-08', async p => {
  await p.waitForTimeout(1500);
  await p.getByRole('button', {name:'Planlegg treninga', exact:true}).first().click();
  await p.waitForTimeout(1300);
  for (const [name, taps] of [['Medtak, dribling, vending og pasning', 3], ['3v3 med press i ryggen', 3], ['Vinneren står', 2]]) {
    await p.getByRole('button', { name: `Endre ${name}` }).click();
    await p.waitForSelector('.stepper__btn', { timeout: 4000 });
    await p.waitForTimeout(500);
    for (let i = 0; i < taps; i++) { await p.locator('.stepper__btn[aria-label="Lengre"]').click(); await p.waitForTimeout(260); }
    await p.waitForTimeout(450);
    await p.locator('.ds-sheet__close').click();
    await p.waitForTimeout(700);
  }
  await p.waitForTimeout(2000);
});
await record('ovelsesbank', '/trening/ovelser', '2026-09-08', async p => {
  await p.getByText('Medtak, dribling, vending og pasning', {exact:true}).click();
  await p.waitForTimeout(2200);
  await ease(p, 380); await p.waitForTimeout(2200);
});
await record('filter', '/kamper', '2026-03-12', async p => {
  await p.locator('.team-pill--rod').click();
  await p.waitForTimeout(2200);
});
await record('stats-teams', '/statistikk', '2026-03-12', async p => {
  await ease(p, 360); await p.waitForTimeout(1800);
});
await record('cup', '/cup', '2026-08-07', async p => {
  await ease(p, 380); await p.waitForTimeout(1800);
});
// 02 — Kampmodus (28. sep-flyten): «Fyll resten» fyller laget, «Start kamp»,
// trykk Filip → «Hvem går inn for Filip?» med forslaget uthevet → trykk det →
// «Filip ut, Henrik inn · Angre». To trykk per bytte, ingen velgerark.
await record('matchmode', '/kamp/dm-4/live', null, async p => {
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: 'Fyll resten' }).click();
  await p.waitForTimeout(1500);
  await p.getByRole('button', { name: 'Start kamp' }).click();
  await p.waitForTimeout(4200);
  await p.locator('.marker', { hasText: 'Filip' }).click();
  await p.waitForSelector('.mm__bchip--forslag', { timeout: 4000 });
  await p.waitForTimeout(2400);
  await p.locator('.mm__bchip--forslag').click();
  await p.waitForTimeout(3200);
});

// 04 — Lånespilleren: kampsida, åpne Tropp, rull ned til lånespillerne og
// trykk den første anbefalte — den flytter opp til Valgt. Appen foreslår,
// treneren bekrefter.
await record('loan-suggest', '/kamp/dm-4', '2026-03-12', async p => {
  await p.waitForTimeout(1200);
  await p.getByText('Tropp', { exact: true }).click();
  await p.waitForTimeout(900);
  await ease(p, 560, 36); await p.waitForTimeout(2200);
  await p.locator('.loan-pill', { hasText: 'Mads' }).click();
  await p.waitForTimeout(2600);
});

await b.close();
