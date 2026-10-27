import { launch, sleep } from './cdp.mjs';
const b = await launch({ profile: process.argv[2] + '/prof-midtap', port: 9518 });
await b.send('Page.enable');
await b.send('Page.navigate', { url: 'file:///D:/angles%20learning%20section/index.html?s=10' });
for (let i = 0; i < 1200; i++) { const t = await b.ev(`document.getElementById('heading').textContent`).catch(() => ''); if (/arm they share/.test(t)) break; await sleep(50); }
await sleep(300);
const before = await b.ev(`({ voice: Voice.current, playing: !Voice.audio.paused, at: +Voice.audio.currentTime.toFixed(2) })`);
await b.ev(`scene.get('OC').hitEl.dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
await sleep(1500);
const after = await b.ev(`document.getElementById('heading').textContent.trim()`);
console.log('tapped OC while voice was', JSON.stringify(before), '→ narration moved on to:', JSON.stringify(after));
b.close(); process.exit(0);
