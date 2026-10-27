import { writeFileSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';
const W = process.argv[2];
const b = await launch({ profile: W + '/prof-start', port: 9520 });
await b.send('Page.enable'); await b.send('Runtime.enable');
await b.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
const errs = []; b.on('Runtime.exceptionThrown', p => errs.push(p.exceptionDetails.exception?.description));
const shot = async n => { const r = await b.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${W}/${n}.png`, Buffer.from(r.result.data, 'base64')); };
await b.send('Page.navigate', { url: 'file:///D:/angles%20learning%20section/index.html?novo' });
await sleep(2600); await shot('start_a');
const scaleAt = () => b.ev(`getComputedStyle(document.querySelector('.start-btn img')).transform`);
const s1 = await scaleAt(); await sleep(950); const s2 = await scaleAt();
const img = await b.ev(`(() => { const t = document.querySelector('.start-thumb'), i = document.querySelector('.start-btn img'); return { thumb: t.complete && t.naturalWidth, btn: i.complete && i.naturalWidth }; })()`);
// pointer parallax
await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1500, y: 200 }); await sleep(900);
const px = await b.ev(`getComputedStyle(document.getElementById('start')).getPropertyValue('--px')`);
// real click on Start
const r = await b.ev(`(() => { const e = document.getElementById('bStart').getBoundingClientRect(); return { x: e.x + e.width / 2, y: e.y + e.height / 2 }; })()`);
for (const type of ['mousePressed', 'mouseReleased']) await b.send('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 });
await sleep(3500);
const after = await b.ev(`({ gone: document.getElementById('start').classList.contains('gone'), screen: document.getElementById('pNum').textContent, line: document.getElementById('heading').textContent.trim() })`);
await b.ev(`Engine.finish()`); await sleep(1500); await shot('start_done');
console.log('images loaded:', JSON.stringify(img), '| pulse transforms differ:', s1 !== s2, '| parallax --px after pointer at right:', px.trim());
console.log('after Start click:', JSON.stringify(after), '| errors:', errs);
b.close(); process.exit(0);
