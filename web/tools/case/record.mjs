import pkg from 'playwright';
import fs from 'node:fs';
const { chromium } = pkg;
import { fileURLToPath } from 'node:url';
const HERE = fileURLToPath(new URL('./', import.meta.url));
const OUT = HERE + 'rec';
const AUTH = JSON.stringify({ profile:{id:'demo-profile',email:null,full_name:'Alex',is_platform_admin:false},
  memberships:[{id:'demo-member',cohort_id:'demo-cohort',cohort_name:'Halsen G2015',role:'coach',coach_id:'demo-1',name:'Alex',preferred_team:null,preferred_cup_team:null}]});
const which = process.argv.slice(2);
const b = await chromium.launch({ args: ['--force-device-scale-factor=2'] });

async function record(name, path, date, run) {
  if (which.length && !which.includes(name)) return;
  const ctx = await b.newContext({
    viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true,
    locale:'nb-NO', timezoneId:'Europe/Oslo',
    recordVideo:{ dir: OUT, size:{ width:780, height:1688 } },
  });
  await ctx.addInitScript(a => {
    localStorage.setItem('bb_auth_v1', a); localStorage.setItem('bb_active_cohort','demo-cohort');
    const st = document.createElement('style'); st.textContent = '.demo-banner{display:none!important}';
    (document.head || document.documentElement).appendChild(st);
  }, AUTH);
  const p = await ctx.newPage();
  if (date) await p.clock.setFixedTime(new Date(date + 'T10:00:00'));
  await p.goto('http://localhost:5199' + path, { waitUntil:'networkidle' });
  await p.addStyleTag({ content:'.demo-banner{display:none!important}' });
  await p.waitForTimeout(1500);
  try { await run(p); } catch (e) { console.error(name, 'FAILED:', e.message); await p.screenshot({ path: `${OUT}/${name}-fail.png` }); }
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

// 06 — Trening: åpne tirsdag, sett tid på øvelsene til dagen går opp
await record('trening', '/trening', '2026-06-10', async p => {
  const tue = p.locator('.dag').filter({ hasText: 'Tirsdag' }).first();
  const isOpen = await tue.evaluate(el => el.classList.contains('dag--open'));
  if (!isOpen) { await tue.locator('.dag__toggle').click(); await p.waitForTimeout(900); }
  const drills = tue.locator('.ovelse');
  const n = await drills.count();
  const plan = [20, 30, 40];
  for (let i = 0; i < Math.min(n, 3); i++) {
    const d = drills.nth(i);
    await d.scrollIntoViewIfNeeded(); await p.waitForTimeout(350);
    await d.locator('.ovelse__meta').click(); await p.waitForTimeout(500);
    const plus = d.locator('.stepper__btn[aria-label="Lengre"]');
    for (let k = 0; k < (plan[i] - 10) / 5; k++) { await plus.click(); await p.waitForTimeout(140); }
    await p.waitForTimeout(500);
    await d.locator('.ovelse__done').click(); await p.waitForTimeout(700);
  }
  await tue.locator('.dag__budget').scrollIntoViewIfNeeded(); await p.waitForTimeout(1800);
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
