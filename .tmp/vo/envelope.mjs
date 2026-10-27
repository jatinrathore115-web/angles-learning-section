// Speech span per clip from the decoded waveform (50 ms RMS frames, -40 dBFS gate).
// usage: node envelope.mjs <workdir> vo017,vo018,...
import { launch, sleep } from './cdp.mjs';
import { readFileSync } from 'node:fs';
const [, , WORK, ids] = process.argv;
const b = await launch({ profile: WORK + '/prof-env', port: 9488 });
await b.send('Page.enable');
await b.send('Page.navigate', { url: 'file:///D:/angles%20learning%20section/index.html?s=1&novo' });
await sleep(1500);
for (const id of ids.split(',')) {
  const b64 = readFileSync('D:/angles learning section/assets/vo/' + id + '.ogg').toString('base64');
  const r = await b.ev(`new Promise(res => {
    const bytes = Uint8Array.from(atob('${b64}'), c => c.charCodeAt(0));
    (async () => {
      const buf = await new OfflineAudioContext(1, 1, 48000).decodeAudioData(bytes.buffer);
      const d = buf.getChannelData(0), F = 2400, fr = [];
      for (let i = 0; i < d.length; i += F) { let s = 0; for (let j = i; j < Math.min(i + F, d.length); j++) s += d[j] * d[j]; fr.push(10 * Math.log10(s / F + 1e-12)); }
      const on = fr.map(v => v > -40);
      const first = on.indexOf(true), last = on.lastIndexOf(true);
      // longest internal silence
      let gap = 0, run = 0; for (let k = first; k <= last; k++) { if (!on[k]) { run++; gap = Math.max(gap, run); } else run = 0; }
      res({ dur: +(d.length / 48000).toFixed(2), speechStart: +(first * 0.05).toFixed(2), speechEnd: +((last + 1) * 0.05).toFixed(2), longestPause: +(gap * 0.05).toFixed(2) });
    })().catch(e => res({ err: String(e) }));
  })`);
  console.log(id, JSON.stringify(r));
}
b.close(); process.exit(0);
