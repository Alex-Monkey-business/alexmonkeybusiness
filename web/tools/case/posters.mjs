import pkg from 'playwright';
const { chromium } = pkg;
import { fileURLToPath } from 'node:url';
const HERE = fileURLToPath(new URL('./', import.meta.url));
const DIR = HERE + 'rec';
const AT = { hjem: 2.0, trening: 2.4, matchmode: 12.0, 'trening-end': 14.0 };
const b = await chromium.launch();
const p = await b.newPage({ viewport:{ width: 390, height: 844 }, deviceScaleFactor: 2 });
for (const [key, t] of Object.entries(AT)) {
  const name = key.replace('-end','');
  await p.goto(`file://${DIR}/frames.html`);
  await p.evaluate(async ({ src, t }) => {
    const v = document.getElementById('v'); v.src = src;
    await Promise.race([new Promise(r => v.addEventListener('loadedmetadata', r, {once:true})), new Promise(r => setTimeout(r, 5000))]);
    v.currentTime = t;
    await Promise.race([new Promise(r => v.addEventListener('seeked', r, {once:true})), new Promise(r => setTimeout(r, 3000))]);
  }, { src: `file://${DIR}/${name}.webm`, t });
  await p.locator('#v').screenshot({ path: `${DIR}/${key}-poster.jpg`, type: 'jpeg', quality: 82 });
  console.log(key, '@', t);
}
await b.close();
