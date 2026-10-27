// Web-sized copies of the start-screen art (originals untouched).
import { readFileSync, writeFileSync } from 'node:fs';
import { launch, sleep } from './cdp.mjs';
const ROOT = 'D:/angles learning section';
const b = await launch({ profile: process.argv[2] + '/prof-img', port: 9519 });
await b.send('Page.enable');
await b.send('Page.navigate', { url: 'file:///D:/angles%20learning%20section/.tmp/vo_build_encoder.html' });
await sleep(800);
const conv = async (src, w, h, type, q) => {
  const b64 = readFileSync(`${ROOT}/${src}`).toString('base64');
  return b.ev(`new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = ${w}; c.height = ${h};
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, ${w}, ${h}); res(c.toDataURL('${type}', ${q}).split(',')[1]); }; im.src = 'data:image/png;base64,${b64}'; })`);
};
// thumbnail: exact 16:9 stage size (2x for crisp HiDPI would be 3200 — keep 1920 as a balance)
const thumb = await conv('thumbnail0001.png', 1920, 1080, 'image/jpeg', 0.9);
writeFileSync(`${ROOT}/assets/start/thumbnail.jpg`, Buffer.from(thumb, 'base64'));
const btn = await conv('startbutton 000.png', 440, 435, 'image/webp', 0.92);
writeFileSync(`${ROOT}/assets/start/start-button.webp`, Buffer.from(btn, 'base64'));
console.log('thumbnail.jpg', (Buffer.from(thumb, 'base64').length / 1024).toFixed(0) + ' KB · start-button.webp', (Buffer.from(btn, 'base64').length / 1024).toFixed(0) + ' KB');
b.close(); process.exit(0);
