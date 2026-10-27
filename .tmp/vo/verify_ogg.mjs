// Verify generated Ogg Opus clips: browser support, reported duration vs map, real playback.
import { readFileSync, readdirSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';
const ROOT = 'D:/angles learning section';
const map = JSON.parse(readFileSync(`${ROOT}/js/vo_lines.js`, 'utf8').match(/const VO_LINES = (\{[\s\S]*\});/)[1]);
const want = Object.fromEntries(Object.values(map).map(([id, s]) => [id, s]));
const ids = readdirSync(`${ROOT}/assets/vo`).map(f => f.replace('.ogg', ''));
const b = await launch({ profile: process.argv[2] + '/prof-verify', port: 9466 });
await b.send('Page.enable');
await b.send('Page.navigate', { url: `file:///${ROOT.replace(/ /g, '%20')}/index.html?s=1&novo` });
await sleep(1500);
console.log('canPlayType ogg/opus:', JSON.stringify(await b.ev(`new Audio().canPlayType('audio/ogg; codecs="opus"')`)));
let bad = 0;
for (const id of ids) {
  const r = await b.ev(`new Promise(res => {
    const a = new Audio('assets/vo/${id}.ogg'); a.muted = true;
    a.onerror = () => res({ err: a.error && a.error.code });
    a.onloadedmetadata = async () => { const d = a.duration; try { await a.play(); } catch (e) { return res({ d, err: 'play ' + e.message }); }
      setTimeout(() => { res({ d, t: a.currentTime, paused: a.paused }); a.pause(); }, 600); };
  })`);
  const ok = !r.err && Math.abs(r.d - want[id]) < 0.05 && r.t > 0.2 && !r.paused;
  if (!ok) bad++;
  if (!ok || ids.length <= 5) console.log(id, ok ? 'OK ' : 'BAD', JSON.stringify(r), 'expected', want[id]);
}
console.log(`${ids.length - bad}/${ids.length} clips decode, match length and play`);
b.close(); process.exit(0);
