import { launch, sleep } from './cdp.mjs';
const [, , W, gpu] = process.argv;
const b = await launch({ profile: W + '/prof-fps' + (gpu || ''), port: 9516, args: gpu ? ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] : [] });
await b.send('Page.enable');
await b.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await b.send('Page.navigate', { url: 'file:///D:/angles%20learning%20section/index.html?s=6&novo' });
for (let i = 0; i < 80 && !(await b.ev(`typeof UI !== 'undefined'`).catch(() => false)); i++) await sleep(100);
await sleep(5000);
const probe = async (rain) => {
  await b.ev(`(() => { window.__f = []; let last = performance.now(); const loop = t => { window.__f.push(t - last); last = t; if (window.__f.length < 200) requestAnimationFrame(loop); }; requestAnimationFrame(loop); ${rain ? 'UI.correct();' : ''} })()`);
  await sleep(3500);
  const f = (await b.ev(`window.__f`)).slice(1), avg = f.reduce((a, x) => a + x, 0) / f.length;
  return `${(1000 / avg).toFixed(0)} fps`;
};
console.log(`${gpu ? 'GPU' : 'software'}: idle ${await probe(false)} · during rain ${await probe(true)}`);
b.close(); process.exit(0);
