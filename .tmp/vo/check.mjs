// Step 5: match logged Devanagari to lines, flag Hindi number words / translation, check pace.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const WORK = process.argv[2], ROOT = 'D:/angles learning section';
const script = JSON.parse(readFileSync(`${ROOT}/tools/vo_script.json`, 'utf8'));
const mapSrc = existsSync(`${ROOT}/js/vo_lines.js`) ? readFileSync(`${ROOT}/js/vo_lines.js`, 'utf8').match(/const VO_LINES = (\{[\s\S]*\});/) : null;
const map = mapSrc ? JSON.parse(mapSrc[1]) : {};
const secs = Object.fromEntries(Object.values(map).map(([id, s]) => [id, s]));

const logs = [];
for (const d of readdirSync(WORK)) {
  const f = join(WORK, d, 'log.json');
  if (existsSync(f)) for (const e of JSON.parse(readFileSync(f, 'utf8'))) logs.push({ ...e, dir: d });
}
logs.sort((a, b) => a.t - b.t);
const scriptCalls = logs.filter(l => l.kind === 'script' && l.text);
// the prompt carries "Input Text: <spoken form>"; match it exactly.
// latest Devanagari wins (a regenerated line replaces the old one)
const input = l => { const m = (l.req || '').match(/Input Text: ([\s\S]*?)\n\s*Source Language/); return m ? m[1].trim() : null; };
const deva = {};
for (const s of script) {
  const hit = scriptCalls.filter(l => input(l) === s.spoken.trim()).at(-1);
  if (hit) deva[s.id] = hit.text.trim();
}

const HINDI_NUM = /(^|[\s,।!?])(एक|दो|तीन|चार|पाँच|पांच|छह|छः|सात|आठ|नौ|दस|ग्यारह|बारह|तेरह|चौदह|पंद्रह|सोलह|सत्रह|अठारह|उन्नीस|बीस|तीस|पैंतीस|चालीस|पचास|पचपन|साठ|सत्तर|अस्सी|नब्बे|सौ|हज़ार|हजार|सैंतीस|सड़सठ|पचहत्तर|बावन|बासठ|अट्ठाईस|एक सौ)(?=$|[\s,।!?])/;
const DIGITS = /[0-9०-९]/;
const HINDI_WORDS = /(^|\s)(और|है|हैं|का|की|के|को|में|से|यह|वह|कोण|रेखा|बिंदु|किरण|शीर्ष|भुजा|समान|डिग्री)(?=$|[\s,।!?])/;
const report = [];
for (const s of script) {
  const d = deva[s.id], sec = secs[s.id];
  const flags = [];
  if (!d) flags.push('no Devanagari logged');
  else {
    if (HINDI_NUM.test(d)) flags.push('Hindi number word: ' + d.match(HINDI_NUM)[2]);
    if (DIGITS.test(d)) flags.push('digit left in script');
    if (HINDI_WORDS.test(d)) flags.push('translated (Hindi word: ' + d.match(HINDI_WORDS)[2] + ')');
  }
  let pace = null;
  if (sec) { pace = s.spoken.length / sec; if (pace < 6 || pace > 22) flags.push(`pace ${pace.toFixed(1)} chars/s`); }
  else flags.push('no clip');
  report.push({ id: s.id, line: s.line, spoken: s.spoken, deva: d || '', sec: sec || null, pace: pace && +pace.toFixed(1), flags });
}
writeFileSync(join(WORK, 'check.json'), JSON.stringify(report, null, 1));
const flagged = report.filter(r => r.flags.length && !(r.flags.length === 1 && r.flags[0] === 'no clip' && !r.deva));
for (const r of flagged) console.log(r.id, r.flags.join('; '), '|', r.spoken, '|', r.deva);
const failedReq = logs.filter(l => l.status !== 200);
console.log(`\n${report.filter(r => r.deva).length}/${script.length} with Devanagari · ${report.filter(r => r.sec).length} with clips · ${flagged.length} flagged · ${failedReq.length} non-200 requests`);
if (failedReq.length) console.log(failedReq.slice(0, 5).map(l => `${l.kind} ${l.status} ${l.body || ''}`).join('\n'));
