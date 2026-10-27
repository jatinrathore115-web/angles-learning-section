import { launch, sleep } from './cdp.mjs';
const b = await launch({ profile: process.argv[2] + '/prof-sad2', port: 9522 });
await b.send('Page.enable'); await b.send('Runtime.enable');
await b.send('Page.navigate', { url: 'file:///D:/angles%20learning%20section/index.html?s=4&novo' });
for (let i = 0; i < 80 && !(await b.ev(`typeof UI !== 'undefined'`).catch(() => false)); i++) await sleep(100);
await sleep(1500);
console.log(await b.ev(`(() => { try { UI.incorrect(); } catch (e) { return 'THROW ' + e.message; }
  const s = document.querySelectorAll('.sadface'); return { faces: s.length, pieces: document.querySelectorAll('.sadface .sp').length, cls: s[0] && s[0].className }; })()`));
b.close(); process.exit(0);
