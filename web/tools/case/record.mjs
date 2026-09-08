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
    const st = document.createElement('style'); st.textContent = '.demo-banner{display:none!important}';
    (document.head || document.documentElement).appendChild(st);
  }, AUTH);
  const p = await ctx.newPage();
  if (date) await p.clock.setFixedTime(new Date(date + 'T10:00:00'));
  await p.goto('http://127.0.0.1:5199' + path, { waitUntil:'networkidle' });
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

// 01 — Hjem: les dagen, scroll ned til Å ordne og opp igjen
await record('hjem', '/', '2026-03-12', async p => {
  await p.waitForTimeout(1200);
  await ease(p, 520); await p.waitForTimeout(1600);
  await ease(p, 380); await p.waitForTimeout(1600);
  await ease(p, -900, 30); await p.waitForTimeout(800);
});

// Training week and the guidance sheet for a real demo drill.
await record('trening', '/trening', '2026-09-08', async p => {
  await p.waitForTimeout(1800);
  await p.getByRole('button', {name:'Planlegg treninga', exact:true}).first().click();
  await p.waitForTimeout(1800);
  await ease(p, 320); await p.waitForTimeout(1800);
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
// 02 — Kampmodus: sett opp laget, start, bytt én — forslaget sorteres på posisjon
await record('matchmode', '/kamp/dm-4/live', null, async p => {
  const sheetOpen = () => p.locator('.ds-sheet__close').count();
  let guard = 0;
  while (await p.locator('.marker--empty').count() > 0 && guard++ < 12) {
    await p.locator('.marker--empty').first().click();
    await p.waitForSelector('.ds-sheet__close', { timeout: 4000 });
    await p.waitForTimeout(350);
    await p.locator('.ds-overlay .mm__bchip').first().click();
    await p.waitForFunction(() => !document.querySelector('.ds-sheet__close'), null, { timeout: 4000 }).catch(()=>{});
    await p.waitForTimeout(220);
  }
  await p.waitForTimeout(600);
  await p.locator('.mm__start').click();
  await p.waitForTimeout(5500);
  // en utespiller ut — sheetet viser hvem som passer i posisjonen først
  const field = p.locator('.marker:not(.marker--empty):not(.marker--gk):not(.marker--ghost)');
  await field.nth(2).click();
  await p.waitForSelector('.ds-sheet__close', { timeout: 4000 });
  await p.waitForTimeout(2200);
  await p.locator('.ds-overlay .mm__bchip').first().click();
  await p.waitForTimeout(3000);
});

await b.close();
