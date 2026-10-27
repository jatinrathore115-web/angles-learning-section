// QA harness: drives Chrome via CDP, solves each screen, records errors + screenshots.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const SP = process.argv[2];
const ONLY = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
const SPEED = 4;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'file:///D:/angles%20learning%20section/index.html';
mkdirSync(`${SP}/shots`, { recursive: true });

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9333', `--user-data-dir=${SP}/prof`, '--window-size=1600,900', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch('http://127.0.0.1:9333/json/list')).json(); if (targets.length) break; } catch { } await sleep(200); }
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const errors = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') errors.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) errors.push('CON ' + m.params.args.map(a => a.value ?? a.description).join(' '));
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('LOG ' + m.params.entry.text);
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description); return r.result?.result?.value; };
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });

const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${SP}/shots/${name}.png`, Buffer.from(r.result.data, 'base64')); };
const state = () => ev('document.getElementById("stage").dataset.state');
async function waitState(states, ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const s = await state(); if (states.includes(s)) return s; await sleep(150); }
  return 'TIMEOUT(' + await state() + ')';
}
// in-page helpers
const H = `
if (!window.__seen) { window.__seen = []; const L = UI.line; UI.line = (t, o) => { window.__seen.push(String(t).split("*").join("")); return L(t, o); }; }
window.__q = {
  hit(id){ const o = scene.get(id); o.hitEl.dispatchEvent(new MouseEvent('click',{bubbles:true})); },
  set(id,a){ scene.drags.get(id).set(a); },
  check(){ document.getElementById('bCheck').click(); },
  type(inp,v){ inp.value = String(v); inp.dispatchEvent(new Event('input',{bubbles:true})); },
  click(sel){ const e = document.querySelector(sel); e.click(); return !!e; },
  open(i){ document.querySelectorAll('.pick')[i].click(); return new Promise(r=>setTimeout(r,250)); },
  async pick(i,v){ const t=document.querySelectorAll('.pick')[i]; if(!document.querySelector('.pmenu')) { t.click(); await new Promise(r=>setTimeout(r,250)); } document.querySelector('.pmenu .popt[data-v="'+v+'"]').click(); await new Promise(r=>setTimeout(r,200)); },
};`;
const W = (ms) => sleep(ms / SPEED + 120);

// per-screen solve scripts: array of steps, each a JS string or a wait/state directive
const SOLVE = {
  1: ['document.querySelectorAll(".dlabel").forEach(e=>e.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter"})))'],
  2: ['__q.set("OB",75)', '__q.hit("OA")', '__q.hit("OB")', '__q.hit("O")'],
  3: ['__q.set("OB",45)', ['wait', 200], '__q.set("OB",90)', ['wait', 200], '__q.set("OB",120)', ['wait', 200], '__q.set("OB",180)', ['wait', 200], '__q.set("OB",250)'],
  4: ['__q.set("OB",40)', '__q.check()', ['state', ['AWAIT_CHECK']], ['shot', 'wrong'], '__q.set("OB",130)', '__q.check()'],
  5: ['__q.set("OB",250)', '__q.check()'],
  6: ['__q.open(0)', ['shot', 'menu'], '__q.pick(0,180)', ['shot', 'wrong'], ['wait', 1600], '__q.open(0)', ['shot', 'menu2'], '__q.pick(0,90)', '__q.pick(1,180)'],
  7: ['__q.set("OC",100)', '__q.hit("OA")', ['wait', 400], '__q.hit("O")', '__q.hit("OC")'],
  8: ['__q.click(".mcard[data-id=A]")', '__q.check()', ['state', ['AWAIT_CHECK']], ['shot', 'wrong'], '__q.click(".mcard[data-id=B]")', '__q.check()'],
  9: ['__q.set("OC",120)', '__q.set("OC",160)', '__q.set("OC",30)', '__q.set("OC",90)', ['state', ['AWAIT_CHECK']], '__q.click(".choice[data-id=sum]")', '__q.check()'],
  10: ['__q.hit("OC")', ['wait', 2500], '__q.hit("OA")', '__q.hit("OB")'],
  11: ['__q.click(".mcard[data-id=B]")', '__q.check()', ['state', ['AWAIT_CHECK']], ['shot', 'wrong'], '__q.click(".mcard[data-id=C]")', '__q.check()'],
  12: ['__q.open(0)', ['shot', 'menu'], '__q.pick(0,128)', ['shot', 'wrong'], '__q.pick(0,52)'],
  13: ['__q.set("OA",200)', '__q.check()', ['state', ['AWAIT_CHECK']], '__q.set("OA",160)', '__q.check()', ['state', ['AWAIT_CHECK']], ['shot', 'wrong'], '__q.set("OA",180)', '__q.check()'],
  14: ['__q.set("OA",120)', ['wait', 200], '__q.set("OA",172)', ['wait', 200], ['shot', 'near'], '__q.set("OA",180)'],
  15: ['__q.click(".choice[data-id=all]")', '__q.check()', ['state', ['AWAIT_CHECK']], ['shot', 'wrong'], '__q.click(".choice[data-id=line]")', '__q.check()'],
  16: ['for(let k=0;k<14;k++) scene.get("OD").hHit.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown"}))'],
  17: ['__q.hit("a2")', '__q.check()', ['state', ['AWAIT_CHECK']], ['shot', 'wrong'], '__q.hit("a3")', '__q.check()', ['state', ['READY', 'AWAIT_CHECK']], ['wait', 600], '__q.hit("a4")', '__q.check()'],
  18: ['__q.set("OC",100)', ['wait', 200], '__q.set("OC",30)', ['wait', 200], '__q.set("OC",140)'],
  19: ['__q.hit("a1")', '__q.hit("a3")'],
  20: ['__q.pick(0,360)', '__q.click(".reason[data-k=vo]")', ['shot', 'wrong'], '__q.pick(0,180)', '__q.click(".reason[data-k=lp]")'],
  21: ['__q.pick(0,180)', '__q.click(".reason[data-k=lp]")'],
  22: ['document.querySelectorAll("#panel .tok.tap").forEach(t=>t.click())'],
  23: ['__q.click("#panel [data-k=L1]")', ['wait', 300], '__q.click("#panel [data-k=L2]")', '__q.click("#panel [data-k=R2]")'],
  24: ['__q.click(".reasons[data-row=\'1\'] .reason[data-v=a1]")', '__q.click(".reasons[data-row=\'2\'] .reason[data-v=a3]")', '__q.check()', ['state', ['AWAIT_CHECK']], ['shot', 'wrong'], '__q.click(".reasons[data-row=\'2\'] .reason[data-v=a1]")', '__q.check()'],
  25: ['__q.hit("a1")', ['wait', 400], '__q.hit("a4")'],
  26: ['__q.open(2)', ['shot', 'menuUp'], '__q.open(2)', '__q.pick(2,113)', '__q.pick(0,113)', '__q.pick(1,113)', ['shot', 'wrong'], '__q.pick(1,67)', 'const r=[...document.querySelectorAll("#panel .prow")]; r[0].querySelector("[data-v=lp]").click(); r[1].querySelector("[data-v=lp]").click(); r[1].querySelector("[data-v=vo]").click(); r[2].querySelector("[data-v=vo]").click();'],
  27: ['__q.hit("a2")', '__q.check()', ['state', ['AWAIT_CHECK']], ['shot', 'wrong'], '__q.hit("a3")', '__q.check()'],
  28: ['__q.click(".insp button[data-i=total]")', '__q.click(".insp button[data-i=vertex]")', ['shot', 'inspect'], '__q.click(".mcard[data-id=B]")', '__q.check()', ['state', ['AWAIT_CHECK']], '__q.click(".mcard[data-id=A]")', '__q.check()'],
  29: ['__q.click(".rtile[data-k=\'1\']")', ['wait', 4000], ['shot', 'r1'], '__q.click(".rtile[data-k=\'2\']")', ['wait', 5000], ['shot', 'r2'], '__q.click(".rtile[data-k=\'3\']")'],
};

const report = [], seenAll = [];
const list = ONLY || Array.from({ length: 29 }, (_, i) => i + 1);
for (const n of list) {
  errors.length = 0;
  await send('Page.navigate', { url: `${BASE}?s=${n}${process.env.VO ? '' : '&novo'}&speed=${SPEED}` });
  for (let k = 0; k < 60 && !(await ev("typeof UI !== 'undefined' && typeof scene !== 'undefined'").catch(() => false)); k++) await sleep(150);
  await ev(H);
  const s1 = await waitState(['READY', 'AWAIT_CHECK', 'INTERACTING']);
  await sleep(300);
  await shot(`${String(n).padStart(2, '0')}a`);
  let note = '';
  for (const step of SOLVE[n] || []) {
    try {
      if (Array.isArray(step)) {
        if (step[0] === 'wait') await W(step[1]);
        else if (step[0] === 'state') { await sleep(200); const s = await waitState(step[1]); if (s.startsWith('TIMEOUT')) note += ` [waitState ${step[1]} → ${s}]`; }
        else if (step[0] === 'shot') { await sleep(150); await shot(`${String(n).padStart(2, '0')}_${step[1]}`); }
      } else { await ev(step); await sleep(120); }
    } catch (e) { note += ` [step error: ${e.message.split('\n')[0]}]`; }
  }
  const s2 = await waitState(['COMPLETE'], 40000);
  await sleep(500);
  await shot(`${String(n).padStart(2, '0')}b`);
  const nextOk = await ev('!document.getElementById("bNext").disabled');
  seenAll.push(...(await ev('window.__seen || []')));
  report.push(`${String(n).padStart(2, '0')} ready=${s1} end=${s2} next=${nextOk}${note}${errors.length ? '\n   ERR: ' + [...new Set(errors)].slice(0, 5).join('\n   ERR: ') : ''}`);
  console.log(report[report.length - 1]);
}
writeFileSync(`${SP}/qa-report.txt`, report.join('\n'));
writeFileSync(`${SP}/lines_seen.json`, JSON.stringify([...new Set(seenAll)], null, 1));
ws.close(); chrome.kill();
process.exit(0);
