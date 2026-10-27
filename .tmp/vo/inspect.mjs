// Step 1: load the studio, open Batch Generation, list selects (with options), inputs and buttons.
import { launch, sleep } from './cdp.mjs';
const SP = process.argv[2];
const STUDIO = 'https://ai-wala-human-by-aamir-809572708022.asia-southeast1.run.app/';
const b = await launch({ profile: `${SP}/prof-inspect` });
await b.send('Page.enable'); await b.send('Runtime.enable');
await b.send('Page.navigate', { url: STUDIO });
await sleep(9000);
const dump = () => b.ev(`(() => {
  const vis = e => !!(e.offsetWidth || e.offsetHeight);
  return {
    title: document.title,
    buttons: [...document.querySelectorAll('button')].filter(vis).map(e => e.innerText.trim().replace(/\\s+/g,' ')),
    selects: [...document.querySelectorAll('select')].map(s => ({ label: (s.closest('label')||s.parentElement)?.innerText?.split('\\n')[0].trim(), value: s.value, options: [...s.options].map(o => o.value + '=' + o.text.trim()) })),
    inputs: [...document.querySelectorAll('input')].map(i => ({ type: i.type, name: i.name, value: i.value, label: (i.closest('label')||i.parentElement)?.innerText?.split('\\n')[0].trim() })),
  };
})()`);
console.log('--- initial ---'); console.log(JSON.stringify(await dump(), null, 1));
await b.ev(`(() => { const t = [...document.querySelectorAll('button')].find(e => /Batch Generation/i.test(e.innerText)); t && t.click(); return !!t; })()`);
await sleep(1500);
console.log('--- batch tab ---'); console.log(JSON.stringify(await dump(), null, 1));
const r = await fetch(STUDIO + 'gemini-api-proxy/v1beta/models?__applet_proxy=true');
console.log('--- proxy headers ---', r.status, ['ratelimit-limit', 'ratelimit-remaining', 'ratelimit-reset'].map(h => h + '=' + r.headers.get(h)).join(' '));
b.close(); process.exit(0);
