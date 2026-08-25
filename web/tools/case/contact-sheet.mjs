import pkg from 'playwright';
const { chromium } = pkg;
import { fileURLToPath } from 'node:url';
const HERE = fileURLToPath(new URL('./', import.meta.url));
const DIR = HERE + 'rec';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{ width: 390*6+50, height: 844+20 } });
for (const name of ['hjem','trening','matchmode']) {
  await p.goto(`file://${DIR}/frames.html`);
  const dur = await p.evaluate(async src => {
    const v = document.getElementById('v'); v.src = src;
    await Promise.race([new Promise(r => v.addEventListener('loadedmetadata', r, {once:true})), new Promise(r => setTimeout(r, 5000))]);
    return v.duration;
  }, `file://${DIR}/${name}.webm`);
  const ts = [];
  for (let t = 0.5; t < dur; t += Math.max(1.5, dur / 7)) ts.push(+t.toFixed(1));
  // bygg en kontaktside: canvas med 6 frames
  await p.evaluate(async ts => {
    const v = document.getElementById('v');
    const wrap = document.createElement('div'); wrap.style.cssText='display:flex;gap:10px;padding:10px';
    document.body.appendChild(wrap); v.style.display='none';
    for (const t of ts) {
      v.currentTime = t;
      await Promise.race([new Promise(r => v.addEventListener('seeked', r, {once:true})), new Promise(r => setTimeout(r, 3000))]);
      const c = document.createElement('canvas'); c.width = 390; c.height = 844;
      c.getContext('2d').drawImage(v, 0, 0, 390, 844);
      const box = document.createElement('div'); box.style.cssText='color:#fff;font:12px monospace';
      box.innerHTML = `<div>${t}s</div>`; box.appendChild(c); wrap.appendChild(box);
    }
  }, ts.slice(0, 6));
  await p.screenshot({ path: `${DIR}/${name}-sheet.png` });
  console.log(name, 'duration', dur.toFixed(1), 'frames at', ts.slice(0,6).join(','));
}
await b.close();
