// Screenshots of transient moments on R01: the first point alone, and labels snapping into boxes.
import { writeFileSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';
const W = process.argv[2];
const b = await launch({ profile: W + '/prof-moments', port: 9499 });
await b.send('Page.enable');
await b.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
const shot = async n => { const r = await b.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${W}/${n}.png`, Buffer.from(r.result.data, 'base64')); };
await b.send('Page.navigate', { url: 'file:///D:/angles%20learning%20section/index.html?s=1&novo' });
// wait for the point to be shown: the line "A point marks an exact position."
for (let i = 0; i < 100; i++) { const t = await b.ev(`document.getElementById('heading').textContent`).catch(() => ''); if (/point marks/.test(t)) break; await sleep(150); }
await sleep(1300);
await shot('m_point');
for (let i = 0; i < 200; i++) { if (await b.ev(`document.getElementById('stage').dataset.state === 'READY'`).catch(() => false)) break; await sleep(200); }
await b.ev(`[...document.querySelectorAll('.dlabel')].slice(0, 2).forEach(e => e.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })))`);
await sleep(900);
await shot('m_snap');
b.close(); process.exit(0);
