import { launch, sleep } from './cdp.mjs';
const b = await launch({ profile: process.argv[2] + '/prof-begin', port: 9517 });
await b.send('Page.enable'); await b.send('Runtime.enable');
const errs = []; b.on('Runtime.exceptionThrown', p => errs.push(p.exceptionDetails.exception?.description));
await b.send('Page.navigate', { url: 'file:///D:/angles%20learning%20section/index.html' });
for (let i = 0; i < 80 && !(await b.ev(`!!document.getElementById('bStart')`).catch(() => false)); i++) await sleep(100);
await sleep(800);
// a real click (trusted input), as a learner would
const r = await b.ev(`(() => { const e = document.getElementById('bStart').getBoundingClientRect(); return { x: e.x + e.width / 2, y: e.y + e.height / 2 }; })()`);
for (const type of ['mousePressed', 'mouseReleased']) await b.send('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 });
const seen = [];
for (let k = 0; k < 40; k++) {
  seen.push(await b.ev(`({ t: ${k} * 250, voice: Voice.current, src: Voice.audio.src.split('/').pop(), ct: +Voice.audio.currentTime.toFixed(2), paused: Voice.audio.paused, muted: Voice.audio.muted, line: document.getElementById('heading').textContent.trim() })`));
  await sleep(250);
}
const played = seen.filter(s => !s.paused && s.ct > 0 && !s.muted);
console.log('start overlay hidden:', await b.ev(`document.getElementById('start').classList.contains('gone')`));
console.log('narration audible samples:', played.length, '| clips heard:', [...new Set(played.map(s => s.src))].join(', '));
console.log('first narrated line:', JSON.stringify(played[0]?.voice), '| errors:', errs);
b.close(); process.exit(0);
