// Trace a ray's angle from the moment a narration line appears; screenshot at the swing peak.
// usage: node demo_trace.mjs <workdir> <screen> <ray> <line-regex> [linkedRay]
import { writeFileSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';
const [, , W, s, ray, re, linked] = process.argv;
const b = await launch({ profile: W + '/prof-trace', port: 9511 });
await b.send('Page.enable');
await b.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await b.send('Page.navigate', { url: `file:///D:/angles%20learning%20section/index.html?s=${s}` });
for (let i = 0; i < 1600; i++) { const t = await b.ev(`document.getElementById('heading').textContent`).catch(() => ''); if (new RegExp(re).test(t)) break; await sleep(50); }
const t0 = Date.now(), trace = [];
let peak = null, base = null;
while (Date.now() - t0 < 3200) {
  const x = await b.ev(`({ a: Math.round(scene.get('${ray}').st.angle * 10) / 10, h: Math.round(scene.get('${ray}').st.handle * 100) / 100, voice: Voice.current${linked ? `, link: Math.round((scene.get('${linked}').st.angle - scene.get('${ray}').st.angle) * 10) / 10` : ''} })`);
  x.ms = Date.now() - t0; trace.push(x);
  if (base == null) base = x.a;
  if (!peak || Math.abs(x.a - base) > Math.abs(peak.a - base)) { peak = x; const r = await b.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${W}/demo_s${s}.png`, Buffer.from(r.result.data, 'base64')); }
  await sleep(90);
}
const moved = trace.filter(x => Math.abs(x.a - base) > 0.5);
console.log(`s${s} ${ray}: start ${base}° · first movement at ${moved[0]?.ms ?? '-'} ms after the line appears · peak ${peak.a}° at ${peak.ms} ms · back to ${trace.at(-1).a}° · voice during swing: ${JSON.stringify(moved[0]?.voice)}${linked ? ' · ' + linked + '−' + ray + ' offsets seen: ' + [...new Set(trace.map(x => x.link))].join(',') : ''}`);
b.close(); process.exit(0);
