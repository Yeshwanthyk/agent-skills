#!/usr/bin/env node
// Screenshot one element of a local HTML page at 2x, light colour scheme, with Chrome over CDP. No npm packages:
// Node 22+ has WebSocket built in. Prints the element's visible text on stdout so the caller can check it for chrome.
//
//   node shot.mjs PAGE.html OUT.png SELECTOR [WIDTH]
//
// CHROME overrides the browser path.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [page, out, sel, width = '1200'] = process.argv.slice(2);
if (!page || !out || !sel) { console.error('usage: shot.mjs PAGE.html OUT.png SELECTOR [WIDTH]'); process.exit(2); }

const chrome = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chrome) { console.error('shot: no Chrome found; set CHROME'); process.exit(2); }

const prof = mkdtempSync(join(tmpdir(), 'shot-'));
const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--no-first-run',
  '--hide-scrollbars', '--force-color-profile=srgb', `--window-size=${width},900`, 'about:blank'], { stdio: 'ignore' });
const done = (code) => { proc.kill(); setTimeout(() => { rmSync(prof, { recursive: true, force: true }); process.exit(code); }, 200); };
const fail = (msg) => { console.error('shot: ' + msg); done(1); };
setTimeout(() => fail('timed out'), 30000).unref();

const portFile = join(prof, 'DevToolsActivePort');
for (let i = 0; i < 100 && !existsSync(portFile); i++) await new Promise((r) => setTimeout(r, 100));
if (!existsSync(portFile)) fail('Chrome did not start');
const port = readFileSync(portFile, 'utf8').split('\n')[0];
const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

let id = 0; const wait = new Map(), events = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && wait.has(d.id)) { const { r, j } = wait.get(d.id); wait.delete(d.id); d.error ? j(new Error(d.error.message)) : r(d.result); }
  else if (d.method) events.push(d);
};
const send = (method, params = {}) => new Promise((r, j) => { wait.set(++id, { r, j }); ws.send(JSON.stringify({ id, method, params })); });
const until = async (method) => { for (let i = 0; i < 300; i++) { if (events.some((e) => e.method === method)) return; await new Promise((r) => setTimeout(r, 50)); } fail(`no ${method}`); };

try {
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: +width, height: 900, deviceScaleFactor: 2, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(resolve(page)).href });
  await until('Page.loadEventFired');
  await new Promise((r) => setTimeout(r, 400)); // fonts and the renderer's first layout
  const errs = events.filter((e) => e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error').map((e) => e.params.args.map((a) => a.value ?? a.description).join(' '));
  if (errs.length) { fail('page errors:\n' + errs.join('\n')); }
  const { result } = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height, text: el.innerText };
  })()` });
  const r = result.value;
  if (!r) fail(`no element matches ${sel}`);
  else {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
    writeFileSync(out, Buffer.from(shot.data, 'base64'));
    process.stdout.write(r.text);
    done(0);
  }
} catch (e) { fail(e.message); }
