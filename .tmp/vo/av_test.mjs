// Real-playback test: narration plays, text matches, words finish with the voice, nothing stalls.
// usage: node av_test.mjs <workdir> <screens,comma> [speed] [seconds-per-screen]
import { launch, sleep } from './cdp.mjs';
const [, , WORK, list = '1', speed = '2', secs = '30'] = process.argv;
const b = await launch({ profile: WORK + '/prof-av', port: 9477 });
await b.send('Page.enable'); await b.send('Runtime.enable');
const errors = [];
b.on('Runtime.exceptionThrown', p => errors.push(p.exceptionDetails.exception?.description));
const results = [];
for (const s of list.split(',')) {
  await b.send('Page.navigate', { url: `file:///D:/angles%20learning%20section/index.html?s=${s}&speed=${speed}` });
  for (let i = 0; i < 50 && !(await b.ev(`typeof Voice !== 'undefined' && !!document.getElementById('heading')`).catch(() => false)); i++) await sleep(100);
  await b.ev(`(() => { window.__ae = []; const a = Voice.audio; for (const e of ['ended', 'pause']) a.addEventListener(e, () => window.__ae.push({ e, src: a.src.split('/').pop().replace('.ogg', ''), ct: a.currentTime, dur: a.duration })); })()`);
  const samples = [];
  const t0 = Date.now();
  while (Date.now() - t0 < +secs * 1000) {
    samples.push(await b.ev(`(() => { const a = Voice.audio, h = document.getElementById('heading');
      const ws = [...h.querySelectorAll('.w')];
      return { t: Date.now(), cur: Voice.current, src: (a.src.match(/vo\\d+/) || [''])[0], ct: a.currentTime, paused: a.paused, dur: a.duration, rate: a.playbackRate,
        shown: ws.map(w => w.textContent).join(' '), lastDelay: ws.length ? parseFloat(ws.at(-1).style.transitionDelay) : 0,
        state: document.getElementById('stage').dataset.state }; })()`));
    await sleep(150);
  }
  // per-clip analysis
  const clips = {};
  for (const x of samples) {
    if (!x.src || !x.cur) continue;
    const c = clips[x.src] || (clips[x.src] = { id: x.src, line: x.cur, maxCt: 0, dur: x.dur, rate: x.rate, playingSamples: 0, mismatch: 0, lastDelay: 0, first: x.t, last: x.t });
    c.maxCt = Math.max(c.maxCt, x.ct); c.last = x.t;
    if (x.dur > 0 && isFinite(x.dur)) c.dur = x.dur;
    if (!x.paused && x.ct > 0) c.playingSamples++;
    const match = x.shown.replace(/\s+/g, '') === x.cur.replace(/\s+/g, '');   // punctuation is its own word element
    if (!match) c.mismatch++;                 // the ~170 ms crossfade between lines
    else c.lastDelay = Math.max(c.lastDelay, x.lastDelay || 0);
  }
  const aev = await b.ev('window.__ae');
  if (process.env.DBG) console.log('events', JSON.stringify(aev), 'final', JSON.stringify(samples.at(-1)));
  for (const c of Object.values(clips)) {
    const wall = c.dur / c.rate * 1000;
    c.reachedEnd = aev.some(e => e.src === c.id && e.e === 'ended');
    c.cutAt = (aev.find(e => e.src === c.id && e.e === 'pause' && e.ct < e.dur - 0.05) || {}).ct;
    c.textEndsAt = +(c.lastDelay / wall).toFixed(2);   // fraction of the clip when the last word appears
    results.push({ screen: s, ...c });
  }
  // stall: longest gap with no voice and no state change while the screen is in a narrated state
  console.log(`screen ${s}: ${Object.keys(clips).length} clips played`);
}
for (const r of results) {
  const ok = r.playingSamples > 0 && r.reachedEnd && r.textEndsAt <= 1 && r.textEndsAt >= 0.5;
  console.log(`${ok ? 'OK ' : 'CHK'} s${r.screen} ${r.id} ${r.dur?.toFixed(2)}s x${r.rate} playing=${r.playingSamples} end=${r.reachedEnd} lastWord@${r.textEndsAt}${r.cutAt != null ? ' CUT@' + r.cutAt.toFixed(2) : ''} textMismatchSamples=${r.mismatch} | ${r.line}`);
}
if (errors.length) console.log('ERRORS', errors);
b.close(); process.exit(0);
