// Drives the TTS studio's Batch Generation over CDP.
// usage: node gen.mjs <script.json> <fromIndex> <count> <outDir> [probe]
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { launch, sleep } from './cdp.mjs';

const [, , scriptPath, fromS, countS, outDir, mode] = process.argv;
const STUDIO = 'https://ai-wala-human-by-aamir-809572708022.asia-southeast1.run.app/';
const SET = { lang: 'hi', format: 'mp3', voice: 'Female Teacher (Standard)', conc: '3' };
const rows = JSON.parse(readFileSync(scriptPath, 'utf8')).slice(+fromS, +fromS + +countS);
mkdirSync(outDir, { recursive: true });
const log = [];
const say = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

/* ---------- minimal .xlsx (stored zip, inlineStr cells) ---------- */
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = b => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function zip(files) {
  const parts = [], cen = []; let off = 0;
  for (const [name, str] of files) {
    const data = Buffer.from(str, 'utf8'), nm = Buffer.from(name), c = crc32(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6);
    h.writeUInt32LE(c, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(nm.length, 26);
    const ce = Buffer.alloc(46); ce.writeUInt32LE(0x02014b50, 0); ce.writeUInt16LE(20, 4); ce.writeUInt16LE(20, 6); ce.writeUInt16LE(0x0800, 8);
    ce.writeUInt32LE(c, 16); ce.writeUInt32LE(data.length, 20); ce.writeUInt32LE(data.length, 24); ce.writeUInt16LE(nm.length, 28); ce.writeUInt32LE(off, 42);
    parts.push(h, nm, data); cen.push(ce, nm); off += 30 + nm.length + data.length;
  }
  const cd = Buffer.concat(cen), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, end]);
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function xlsx(rs) {
  const cell = (r, c, v) => `<c r="${c}${r}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>`
    + `<row r="1">${cell(1, 'A', 'filename')}${cell(1, 'B', 'text')}</row>`
    + rs.map((r, i) => `<row r="${i + 2}">${cell(i + 2, 'A', r.id)}${cell(i + 2, 'B', r.spoken)}</row>`).join('') + `</sheetData></worksheet>`;
  return zip([
    ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`],
    ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`],
    ['xl/worksheets/sheet1.xml', sheet],
  ]);
}
const xlsxPath = join(outDir, 'batch.xlsx');
writeFileSync(xlsxPath, xlsx(rows));
say(`xlsx: ${rows.length} rows (${rows[0].id}..${rows[rows.length - 1].id})`);

/* ---------- browser ---------- */
const b = await launch({ profile: join(outDir, 'prof'), port: 9455 });
await b.send('Page.enable'); await b.send('Runtime.enable'); await b.send('Network.enable');
await b.send('Network.setBypassServiceWorker', { bypass: true });
await b.send('Fetch.enable', { patterns: [{ urlPattern: '*generativelanguage.googleapis.com*', requestStage: 'Request' }] });
await b.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: outDir.replace(/\//g, '\\'), eventsEnabled: true });

const CORS = [{ name: 'access-control-allow-origin', value: '*' }, { name: 'access-control-allow-headers', value: '*' }, { name: 'access-control-allow-methods', value: 'GET,POST,OPTIONS' }];
b.on('Fetch.requestPaused', async p => {
  const { requestId, request } = p;
  try {
    if (request.method === 'OPTIONS') { await b.send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: CORS }); return; }
    const u = new URL(request.url);
    const path = u.pathname + (u.search ? u.search + '&' : '?') + '__applet_proxy=true';
    const proxied = STUDIO + 'gemini-api-proxy' + path;
    const headers = {};
    for (const [k, v] of Object.entries(request.headers || {})) if (/^(content-type|accept)$/i.test(k)) headers[k] = v;
    let body = request.postData;
    if (request.hasPostData && body == null) { const r = await b.send('Network.getRequestPostData', { requestId: p.networkId }); body = r.result?.postData; }
    const res = await fetch(proxied, { method: request.method, headers, body: request.method === 'GET' ? undefined : body });
    const buf = Buffer.from(await res.arrayBuffer());
    const kind = /tts/i.test(u.pathname) ? 'tts' : /generateContent/.test(u.pathname) ? 'script' : 'other';
    const entry = { t: Date.now(), kind, status: res.status, path: u.pathname, remaining: res.headers.get('ratelimit-remaining') };
    if (kind === 'script' && res.status === 200) {
      try { const j = JSON.parse(buf.toString('utf8')); entry.text = j.candidates?.[0]?.content?.parts?.[0]?.text; } catch { }
      try { entry.req = JSON.parse(body).contents?.[0]?.parts?.map(x => x.text).join(' ').slice(-300); } catch { }
    }
    if (res.status !== 200) entry.body = buf.toString('utf8').slice(0, 400);
    log.push(entry);
    say(kind, res.status, 'remaining', entry.remaining, entry.text ? '→ ' + entry.text.slice(0, 70) : '');
    const rh = [{ name: 'content-type', value: res.headers.get('content-type') || 'application/json' }, ...CORS];
    await b.send('Fetch.fulfillRequest', { requestId, responseCode: res.status, responseHeaders: rh, body: buf.toString('base64') });
  } catch (e) {
    say('route error', e.message);
    await b.send('Fetch.failRequest', { requestId, errorReason: 'Failed' }).catch(() => { });
  }
});

await b.send('Page.navigate', { url: STUDIO });
await sleep(8000);
const clickText = (re) => b.ev(`(() => { const t = [...document.querySelectorAll('button')].find(e => ${re}.test(e.innerText.trim())); if (t) t.click(); return t ? t.innerText.trim() : null; })()`);
say('tab:', await clickText('/^Batch Generation$/i'));
await sleep(1200);
const doc = await b.send('DOM.getDocument', { depth: -1 });
const q = await b.send('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: 'input[type=file]' });
await b.send('DOM.setFileInputFiles', { nodeId: q.result.nodeId, files: [xlsxPath.replace(/\//g, '\\')] });
await sleep(2500);

const controls = () => b.ev(`(() => {
  const vis = e => !!(e.offsetWidth || e.offsetHeight);
  const lab = e => { let p = e.parentElement; for (let i = 0; i < 4 && p; i++, p = p.parentElement) { const l = p.querySelector('label'); if (l && l.innerText.trim()) return l.innerText.trim(); } return ''; };
  return {
    selects: [...document.querySelectorAll('select')].filter(vis).map(s => ({ label: lab(s), value: s.value, options: [...s.options].map(o => o.value + '=' + o.text.trim()) })),
    inputs: [...document.querySelectorAll('input')].filter(vis).map(i => ({ type: i.type, label: lab(i), value: i.value })),
    buttons: [...document.querySelectorAll('button')].filter(vis).map(e => e.innerText.trim().replace(/\\s+/g, ' ')),
  };
})()`);
const c0 = await controls();
say('controls after upload:\n' + JSON.stringify(c0, null, 1));
if (mode === 'probe') { b.close(); process.exit(0); }

// set controls: selects by label/option match, numbers via native setter
const setAll = await b.ev(`(() => {
  const SET = ${JSON.stringify(SET)}, n = ${rows.length}, out = [];
  const vis = e => !!(e.offsetWidth || e.offsetHeight);
  const lab = e => { let p = e.parentElement; for (let i = 0; i < 4 && p; i++, p = p.parentElement) { const l = p.querySelector('label'); if (l && l.innerText.trim()) return l.innerText.trim().toLowerCase(); } return ''; };
  const setSel = (s, v) => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, v); s.dispatchEvent(new Event('change', { bubbles: true })); out.push(lab(s) + '=' + s.value); };
  const setIn = (i, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, String(v)); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); out.push(lab(i) + '=' + i.value); };
  for (const s of [...document.querySelectorAll('select')].filter(vis)) {
    const opts = [...s.options].map(o => o.value), l = lab(s);
    if (opts.includes(SET.lang)) setSel(s, SET.lang);
    else if (opts.includes(SET.voice)) setSel(s, SET.voice);
    else if (/text/.test(l) && opts.includes('text')) setSel(s, 'text');
    else if (/file/.test(l) && opts.includes('filename')) setSel(s, 'filename');
    else if (/concur/.test(l)) { const o = [...s.options].find(o => o.value === SET.conc || o.text.startsWith(SET.conc)); o && setSel(s, o.value); }
    else if (/format/.test(l)) { const o = [...s.options].find(o => /mp3/i.test(o.value + o.text)); o && setSel(s, o.value); }
  }
  for (const i of [...document.querySelectorAll('input')].filter(vis)) {
    const l = lab(i);
    if (/start/.test(l)) setIn(i, 1);
    else if (/quant/.test(l)) setIn(i, n);
  }
  // format may be a toggle button
  const mp3 = [...document.querySelectorAll('button')].find(e => /^\\.?MP3$/i.test(e.innerText.trim()));
  if (mp3) { mp3.click(); out.push('format button=MP3'); }
  return out;
})()`);
say('set:', setAll.join(' | '));
await sleep(800);
say('controls now:\n' + JSON.stringify(await controls(), null, 1));
if (mode === 'setonly') { b.close(); process.exit(0); }

const gen = await clickText('/^GENERATE \\(/');
say('clicked:', gen);
if (!gen || !gen.includes(`(${rows.length})`)) { say('ABORT: generate button mismatch'); b.close(); process.exit(2); }

const done = () => b.ev(`!document.body.innerText.includes('Processing...')`);
const status = () => b.ev(`(() => { const t = document.body.innerText; return { done: (t.match(/\\bDone\\b/g) || []).length, failed: (t.match(/\\bFailed\\b/g) || []).length }; })()`);
await sleep(4000);
for (let attempt = 0; attempt < 4; attempt++) {
  while (!(await done())) await sleep(3000);
  const st = await status();
  say('batch finished:', JSON.stringify(st));
  if (!st.failed || attempt === 3) break;
  const left = +(log.filter(l => l.remaining != null).at(-1)?.remaining ?? 0);
  if (left < 4) { say('failures but no quota left'); break; }
  say('retrying failed rows:', await clickText('/^Retry/i'));
  await sleep(4000);
}
const before = new Set(readdirSync(outDir));
say('download:', await clickText('/^DOWNLOAD ALL/i'));
for (let i = 0; i < 60; i++) { await sleep(1000); const nz = readdirSync(outDir).filter(f => f.endsWith('.zip') && !before.has(f)); if (nz.length) { await sleep(1500); say('zip:', nz[0]); break; } }
writeFileSync(join(outDir, 'log.json'), JSON.stringify(log, null, 1));
b.close();
process.exit(0);
