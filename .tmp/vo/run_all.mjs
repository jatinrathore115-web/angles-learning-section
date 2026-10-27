// Full run: chunks sized from the live rate-limit headers, waiting out each window.
// usage: node run_all.mjs <workdir> <script.json> [ids-to-skip,comma] [only-ids,comma]
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
const [, , WORK, SCRIPT, skipS = '', onlyS = ''] = process.argv;
const STUDIO = 'https://ai-wala-human-by-aamir-809572708022.asia-southeast1.run.app/';
const skip = new Set(skipS.split(',').filter(Boolean)), only = new Set(onlyS.split(',').filter(Boolean));
const rest = JSON.parse(readFileSync(SCRIPT, 'utf8')).filter(s => !skip.has(s.id) && (!only.size || only.has(s.id)));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const say = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const quota = async () => {
  const r = await fetch(STUDIO + 'gemini-api-proxy/v1beta/models?__applet_proxy=true');
  return { rem: +r.headers.get('ratelimit-remaining'), reset: +r.headers.get('ratelimit-reset') };
};
say(`${rest.length} lines to voice`);
let i = 0, n = 1, fails = 0;
const RUN = new Date().toISOString().slice(11, 19).replace(/:/g, '');   // unique per run: never overwrite earlier chunks
while (i < rest.length) {
  const q = await quota();
  const size = Math.min(48, Math.floor(q.rem / 2) - 1, rest.length - i);
  say(`quota: ${q.rem} left, reset in ${q.reset}s → chunk size ${size}`);
  if (size < 6 && rest.length - i > size) { say(`waiting ${q.reset + 30}s for the window to reset`); await sleep((q.reset + 30) * 1000); continue; }
  const dir = join(WORK, `run${RUN}_chunk${n}`); mkdirSync(dir, { recursive: true });
  const rows = rest.slice(i, i + size);
  writeFileSync(join(dir, 'rows.json'), JSON.stringify(rows));
  say(`chunk ${n}: ${rows[0].id}..${rows.at(-1).id} (${rows.length})`);
  const code = await new Promise(res => spawn(process.execPath, [join(WORK, 'gen.mjs'), join(dir, 'rows.json'), '0', String(rows.length), dir], { stdio: 'inherit' }).on('exit', res));
  const zip = existsSync(join(dir, 'voiceovers_batch.zip'));
  say(`chunk ${n} exit ${code}, zip ${zip}`);
  if (zip) { i += size; n++; fails = 0; }
  else if (++fails >= 3) { say('giving up after 3 failed attempts'); break; }
  else await sleep(60000);
}
say('ALL DONE');
