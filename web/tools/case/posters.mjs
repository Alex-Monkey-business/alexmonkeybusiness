import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const DIR = fileURLToPath(new URL('./rec/', import.meta.url));
const AT = { hjem: 2, trening: 2, ovelsesbank: 4, matchmode: 14, filter: 3, 'stats-teams': 2, cup: 2 };
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: {width:390,height:844}, deviceScaleFactor:2 });
  fs.writeFileSync(DIR+'frames.html', '<style>body{margin:0}video{width:390px;height:844px;display:block}</style><video id="v" muted></video>');
  for (const [name,t] of Object.entries(AT)) {
    await p.goto('file://'+DIR+'frames.html');
    await p.evaluate(async ({src,t}) => {
      const v=document.querySelector('video');
      await new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=reject;v.src=src;});
      await new Promise(resolve=>{v.onseeked=resolve;v.currentTime=t;});
    },{src:`file://${DIR}${name}.webm`,t});
    await p.locator('video').screenshot({path:DIR+name+'-poster.jpg',type:'jpeg',quality:85});
    console.log(name,t);
  }
} finally {await b.close();}
