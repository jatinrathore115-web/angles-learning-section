import { readFileSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';
const b = await launch({ profile: process.argv[2] + '/prof-sfx', port: 9513 });
await b.send('Page.enable');
await b.send('Page.navigate', { url: 'file:///D:/angles%20learning%20section/index.html?s=1&novo' });
await sleep(1500);
for (const f of ['correct', 'incorrect']) {
  const b64 = readFileSync(`D:/angles learning section/assets/sfx/${f}.mp3`).toString('base64');
  console.log(f, JSON.stringify(await b.ev(`(async () => {
    const bytes = Uint8Array.from(atob('${b64}'), c => c.charCodeAt(0));
    const buf = await new OfflineAudioContext(1, 1, 48000).decodeAudioData(bytes.buffer);
    let peak = 0, sum = 0; const d = buf.getChannelData(0);
    for (const x of d) { peak = Math.max(peak, Math.abs(x)); sum += x * x; }
    let first = d.findIndex(x => Math.abs(x) > 0.01), last = d.length - 1; while (last > 0 && Math.abs(d[last]) < 0.01) last--;
    return { seconds: +(buf.length / 48000).toFixed(2), channels: buf.numberOfChannels, peakDb: +(20 * Math.log10(peak)).toFixed(1), rmsDb: +(10 * Math.log10(sum / d.length)).toFixed(1), soundFrom: +(first / 48000).toFixed(2), soundTo: +(last / 48000).toFixed(2) };
  })()`)));
}
b.close(); process.exit(0);
