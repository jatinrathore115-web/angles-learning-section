import { launch, sleep } from './cdp.mjs';
const b = await launch({ profile: process.argv[2] + '/prof-dbg', port: 9512 });
await b.send('Page.enable'); await b.send('Runtime.enable');
const errs = []; b.on('Runtime.exceptionThrown', p => errs.push(p.exceptionDetails.exception?.description));
b.on('Runtime.consoleAPICalled', p => errs.push('console ' + p.type + ' ' + p.args.map(a => a.value ?? a.description).join(' ')));
await b.send('Page.navigate', { url: 'file:///D:/angles%20learning%20section/index.html?s=2' });
for (let i = 0; i < 1600; i++) { const t = await b.ev(`document.getElementById('heading').textContent`).catch(() => ''); if (/Move ray/.test(t)) break; await sleep(50); }
for (let k = 0; k < 12; k++) { console.log(JSON.stringify(await b.ev(`(() => { const r = scene.get('OB'); return { ms: ${k} * 150, a: +r.st.angle.toFixed(1), handle: r.st.handle, hs: +r.st.hs.toFixed(2), um: r.userMovedAt || 0, now: Math.round(performance.now()), state: document.getElementById('stage').dataset.state, voice: Voice.current }; })()`))); await sleep(150); }
console.log(errs.slice(0, 5));
b.close(); process.exit(0);
