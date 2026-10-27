// Minimal Chrome DevTools Protocol driver (no Playwright install needed).
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launch({ port = 9444, profile, headless = true, args = [] } = {}) {
  mkdirSync(profile, { recursive: true });
  const proc = spawn(CHROME, [
    ...(headless ? ['--headless=new'] : []), ...(args.includes('--enable-gpu') ? [] : ['--disable-gpu']), `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`, '--window-size=1400,1000', '--autoplay-policy=no-user-gesture-required',
    ...args, 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.length) break; } catch { } await sleep(200); }
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); const handlers = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    const hs = handlers.get(m.method); if (hs) hs.forEach(h => h(m.params));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const on = (method, fn) => { if (!handlers.has(method)) handlers.set(method, []); handlers.get(method).push(fn); };
  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };
  return { proc, send, on, ev, close() { try { ws.close(); } catch { } proc.kill(); } };
}
