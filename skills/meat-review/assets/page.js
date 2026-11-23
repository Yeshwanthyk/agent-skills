// meat-review reading page: the flow first, then the change as a walk of numbered steps, each with the code it
// covers (rows from git, upgraded to Pierre diffs when that loads). One file, so a T3 page can load it from the CDN.
// The page supplies the reading as JSON in <script id="data">; viz.js loads after this script and draws the flow.
const PIERRE = 'https://esm.sh/@pierre/diffs@1.6.2';
const D = JSON.parse(document.getElementById('data').textContent);
const T3 = D.host === 't3';
// Rows arrive as [old, new, mark, text, side?]; expand them once into the shape the page reads.
for (const st of D.steps) for (const g of st.ranges) for (const b of g.blocks) b.rows = b.rows.map(([o, n, m, t, s]) => {
  s ??= m === '-' ? 'old' : m === '+' ? 'new' : b.side;
  return {o, n, m, t, s};
});
// The published T3 frame is sandboxed without same-origin access, so localStorage throws there.
const store = (() => {
  try { localStorage.getItem('meat-review:probe'); return localStorage; }
  catch { const m = new Map(); return {getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v))}; }
})();
const html = document.documentElement;
html.dataset.host = D.host;
const darkOS = () => matchMedia('(prefers-color-scheme: dark)').matches;
function lum(color) {
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = '#808080'; c.fillStyle = color; c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return 0.3 * r + 0.59 * g + 0.11 * b;
}
// The standalone page owns its theme; inside T3 the host's --background decides.
function mode() {
  if (T3) {
    const bg = getComputedStyle(html).getPropertyValue('--background').trim();
    html.dataset.mode = (bg ? lum(bg) < 128 : darkOS()) ? 'dark' : 'light';
  } else {
    const pick = store.getItem('meat-review:theme') || 'auto';
    html.dataset.pick = pick;
    html.dataset.mode = pick === 'dark' || (pick === 'auto' && darkOS()) ? 'dark' : 'light';
  }
}
mode();

const STYLE = String.raw`
html[data-host=page][data-mode=light]{--background:#fbfaf7;--foreground:#1c1b18;--muted-foreground:#77736a;--border:#e6e2d9;--card:#f3f0e9;--primary:#2f5d9b;--destructive:#b8432f;--warning:#9a6510;--success:#3d7a4a;color-scheme:light}
html[data-host=page][data-mode=dark]{--background:#111110;--foreground:#e8e4d9;--muted-foreground:#8f8b80;--border:#2a2925;--card:#181816;--primary:#9db8e0;--destructive:#e0736a;--warning:#e6b04f;--success:#9cc48a;color-scheme:dark}
html{--bg:var(--background,#fbfaf7);--fg:var(--foreground,#1c1b18);--mut:var(--muted-foreground,#77736a);--line:var(--border,#e6e2d9);--card:var(--card,#f3f0e9);
  --acc:var(--primary,#2f5d9b);--risk:var(--destructive,#b8432f);--q:var(--warning,#9a6510);--ok:var(--success,#3d7a4a);
  --add:color-mix(in srgb,var(--ok) 12%,transparent);--del:color-mix(in srgb,var(--risk) 10%,transparent);--soft:color-mix(in srgb,var(--fg) 4.5%,transparent);
  --code:"Berkeley Mono","BerkeleyMono",ui-monospace,SFMono-Regular,Menlo,monospace;--sans:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;
  --diffs-font-family:var(--code);--diffs-font-size:13px;--diffs-line-height:21px;--diffs-bg:var(--bg)}
*{box-sizing:border-box}
html[data-host=page],html[data-host=page] body{margin:0;background:var(--bg)}
html[data-host=t3] body{margin:0}
body{color:var(--fg);font:15px/1.6 var(--sans);-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
code{font-family:var(--code);font-size:.88em;background:var(--soft);border-radius:4px;padding:1px 4px}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.wrap{max-width:1040px;margin:0 auto;padding:56px 32px 140px}
html[data-host=t3] .wrap{max-width:none;padding:0 0 32px}
.mono{font-family:var(--code)}

/* hero */
.hero{display:flex;flex-direction:column;gap:10px;margin-bottom:36px}
.eyebrow{display:flex;gap:10px;align-items:center;font:12px var(--code);color:var(--mut);letter-spacing:.02em}
.tier{font:600 11px var(--code);border:1px solid var(--line);border-radius:5px;padding:1px 6px;color:var(--fg)}
.hero h1{font-size:30px;line-height:1.2;letter-spacing:-.02em;margin:0;font-weight:650}
html[data-host=t3] .hero h1{font-size:24px}
.hero .sum{font-size:16.5px;line-height:1.6;max-width:70ch;margin:0}
.facts{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12.5px;color:var(--mut)}
.facts b{color:var(--fg);font-weight:600}
.facts .r b{color:var(--risk)}.facts .q b{color:var(--q)}
.sp{flex:1}
.theme{display:flex;gap:2px}.theme button{font:11px var(--code);color:var(--mut);padding:1px 6px;border-radius:4px}.theme button.on{color:var(--fg);background:var(--soft)}

/* flow */
.flow{margin:0 0 20px}
.flow-cap{display:flex;align-items:baseline;gap:10px;margin:0 0 10px}
.kick{font:600 11px var(--code);letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
.flow-cap .hint{font-size:12.5px;color:var(--mut)}.flow-cap .hint a{color:var(--acc)}

/* step index */
.index{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin:0 0 56px;padding:0;list-style:none}
.index a{display:flex;gap:10px;align-items:baseline;padding:10px 12px;border:1px solid var(--line);border-radius:10px;transition:border-color .15s,background .15s}
.index a:hover,.index a.vz-linked{border-color:color-mix(in srgb,var(--fg) 35%,transparent);background:var(--soft)}
.index .n{font:600 12px var(--code);color:var(--mut)}
.index .t{font-weight:550;font-size:14px}
.index .d{margin-left:auto;font-size:11px;color:var(--risk)}

/* steps */
.step{margin:0 0 72px;scroll-margin-top:24px}
.step>header{display:grid;grid-template-columns:76px minmax(0,1fr);column-gap:8px;margin-bottom:18px;border-radius:10px;transition:background .15s}
.step>header.vz-linked{background:var(--soft)}
.step .num{font:600 13px/2.3 var(--code);color:var(--mut);grid-row:span 3;white-space:nowrap}
.step .num i{font-style:normal;opacity:.55}
.step h2{font-size:22px;letter-spacing:-.015em;line-height:1.3;margin:0 0 6px;font-weight:650}
.step .why{margin:0 0 12px;max-width:72ch}
.check{display:flex;gap:10px;align-items:baseline;padding:10px 14px;border-radius:9px;background:var(--soft);max-width:78ch;font-size:14px}
.check b{font:600 10.5px var(--code);letter-spacing:.12em;text-transform:uppercase;color:var(--acc);flex:none}
.loose{display:flex;flex-direction:column;gap:8px;margin:0 0 16px 84px}
.range{margin:0 0 18px 84px;border:1px solid var(--line);border-radius:10px;overflow:hidden}
html[data-host=t3] .loose,html[data-host=t3] .range{margin-left:0}
.rh{display:flex;gap:10px;align-items:baseline;padding:9px 14px;border-bottom:1px solid var(--line);font-size:13px;flex-wrap:wrap}
.rh .path{font-family:var(--code);font-size:12.5px;color:var(--mut);min-width:0;overflow-wrap:anywhere}.rh .path b{color:var(--fg);font-weight:600}
.rh .kind{font-size:11px;color:var(--mut)}
.id{font:600 11px var(--code);color:var(--acc);border:1px solid color-mix(in srgb,var(--acc) 35%,transparent);border-radius:5px;padding:0 5px}
.id:hover{background:color-mix(in srgb,var(--acc) 12%,transparent)}
.rnote{padding:8px 14px;font-size:13.5px;color:var(--mut);border-bottom:1px solid var(--line)}
.next{display:inline-flex;gap:8px;margin-left:84px;font-size:13px;color:var(--mut)}.next:hover{color:var(--fg)}
html[data-host=t3] .next{margin-left:0}

/* code */
table.rows{border-collapse:collapse;width:100%;font:13px/21px var(--code);tab-size:4}
table.rows td{padding:0;vertical-align:top}
table.rows td.n{width:1%;min-width:44px;padding:0 10px 0 12px;text-align:right;color:var(--mut);opacity:.7;user-select:none;white-space:nowrap}
table.rows td.m{width:14px;color:var(--mut);user-select:none}
table.rows td.t{white-space:pre-wrap;word-break:break-word;padding-right:14px}
table.rows tr.add{background:var(--add)}table.rows tr.del{background:var(--del)}
table.rows tr.add td.m{color:var(--ok)}table.rows tr.del td.m{color:var(--risk)}
tr.ann td{padding:6px 12px 8px 56px}
.seg.up>table.rows{display:none}
.fold{display:block;width:100%;text-align:left;font:12px var(--code);color:var(--mut);padding:4px 14px 4px 56px;background:var(--soft)}
.fold:hover{color:var(--fg)}

/* findings */
.fd{border-left:2px solid var(--mut);padding:6px 12px;border-radius:0 8px 8px 0;background:var(--soft);font:14px/1.55 var(--sans);max-width:80ch}
.fd.risk{border-color:var(--risk)}.fd.question{border-color:var(--q)}
.fd .hd{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.sev{font:600 10.5px var(--code);letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}
.fd.risk .sev{color:var(--risk)}.fd.question .sev{color:var(--q)}
.fd .ti{font-weight:600}.fd .loc{font:11.5px var(--code);color:var(--mut)}
.fd .tx{color:color-mix(in srgb,var(--fg) 82%,transparent);margin-top:2px}

/* end matter */
.end{border-top:1px solid var(--line);padding-top:28px;display:flex;flex-direction:column;gap:28px}
.end h3{margin:0 0 10px}
.end ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:13.5px}
.end li .mono{font-size:12.5px}
.end .mut{color:var(--mut)}
details>summary{cursor:pointer;list-style:none}details>summary::-webkit-details-marker{display:none}
details>summary .kick::after{content:" +";}details[open]>summary .kick::after{content:" −"}
.toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);display:flex;gap:10px;align-items:center;background:var(--fg);color:var(--bg);padding:8px 12px;border-radius:9px;font-size:13px;z-index:9;box-shadow:0 6px 24px rgba(0,0,0,.18)}
.toast input{font:600 13px var(--code);background:transparent;color:inherit;border:0;outline:0;width:16ch}

/* your feedback */
table.rows td.n{position:relative;padding-left:24px}
.gu{position:absolute;left:4px;top:2px;width:16px;height:16px;line-height:14px;border-radius:5px;font:600 13px var(--sans);opacity:0;background:var(--acc);color:var(--bg);transition:opacity .1s}
tr:hover .gu,.gu:focus-visible{opacity:1}
table.rows col.cn{width:52px}
table.rows tr.sp2 td.n{min-width:0}
table.rows tr.sp2 td.add{background:var(--add)}table.rows tr.sp2 td.del{background:var(--del)}
table.rows tr.sp2 td.gap{background:var(--soft)}
table.rows tr.sp2 td.t+td.n{border-left:1px solid var(--line)}
.step h2{display:flex;align-items:baseline;gap:12px}
.say{font:500 12px var(--sans);color:var(--mut);opacity:0;transition:opacity .15s;margin-left:auto}
.step>header:hover .say,.say:focus-visible{opacity:1}.say:hover{color:var(--acc)}
.notes:empty{display:none}
.acts{display:flex;gap:12px;margin-top:6px;font-size:12px}
.acts button{color:var(--mut)}.acts button:hover{color:var(--fg)}.acts button.on{color:var(--acc);font-weight:600}
.cm{margin-top:6px}
.cm textarea{display:block;width:100%;font:14px/1.5 var(--sans);color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:7px 10px;resize:vertical;field-sizing:content;min-height:36px;outline:0}
.cm textarea:focus{border-color:color-mix(in srgb,var(--acc) 60%,transparent)}
.cm.mine{border-left:2px solid var(--acc);padding:6px 12px 8px;border-radius:0 8px 8px 0;background:color-mix(in srgb,var(--acc) 6%,transparent);max-width:80ch;margin:0}
.cm .who{display:flex;gap:8px;align-items:baseline;font-size:12px;color:var(--mut);margin-bottom:4px}.cm .who>span:first-child{font-weight:600;color:var(--acc)}
.cm .who .mono{font-size:11.5px}
.x{font-size:16px;line-height:1;color:var(--mut);padding:0 2px}.x:hover{color:var(--risk)}
.pz-ann{padding:6px 12px 8px 12px;font-family:var(--sans);white-space:normal}
.dock{position:fixed;right:18px;bottom:18px;display:flex;gap:8px;align-items:center;z-index:8;font-size:12.5px}
.dock>*{background:var(--bg);border:1px solid var(--line);border-radius:9px;box-shadow:0 4px 18px rgba(0,0,0,.08)}
.seg2{display:flex;padding:2px}.seg2 button{padding:3px 9px;border-radius:7px;color:var(--mut)}.seg2 button.on{background:var(--soft);color:var(--fg);font-weight:600}
.fb{padding:5px 12px;font-weight:600;display:flex;gap:7px;align-items:center}
.fb .cnt:empty{display:none}.fb .cnt{font:600 11px var(--code);background:var(--acc);color:var(--bg);border-radius:9px;padding:0 6px}
.fb.has{border-color:color-mix(in srgb,var(--acc) 45%,transparent)}
.sheet{position:fixed;right:18px;bottom:62px;width:min(560px,calc(100vw - 36px));background:var(--bg);border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.18);z-index:9;display:flex;flex-direction:column}
.sheet[hidden]{display:none}
.sh-h,.sh-f{display:flex;gap:10px;align-items:center;padding:9px 14px;font-size:12.5px}.sh-h b{font-size:13.5px}
.sheet .mut{color:var(--mut)}
.sheet textarea{margin:0 14px;height:240px;font:12.5px/1.55 var(--code);color:var(--fg);background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:10px;resize:vertical;outline:0}
.pri{background:var(--fg);color:var(--bg);border-radius:7px;padding:4px 12px;font-weight:600}
.wrap{padding-bottom:180px}
html[data-host=t3] .dock{position:static;justify-content:flex-end;margin:0 0 14px}
html[data-host=t3] .dock>*{box-shadow:none}
html[data-host=t3] .sheet{position:static;width:auto;margin:0 0 24px;box-shadow:none}
html[data-host=t3] main+.dock,html[data-host=t3] footer.end+.dock{margin-top:28px}
@media (max-width:720px){.wrap{padding:28px 16px 80px}.step>header{grid-template-columns:1fr}.step .num{grid-row:auto;line-height:1.6}.loose,.range,.next{margin-left:0}}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${STYLE}</style>`);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
// Inline markdown for prose: `code` and **bold**, nothing else.
const mi = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const base = p => p.split('/').pop();
const pathHtml = p => { const i = p.lastIndexOf('/'); return `${esc(p.slice(0, i + 1))}<b>${esc(p.slice(i + 1))}</b>`; };
const SEV = {risk: 'Risk', question: 'Question', note: 'Note'};
const N = D.steps.length;
const pad = n => String(n).padStart(2, '0');

// ---- your feedback: line comments, step comments, and verdicts or replies on findings. Kept per reading; inside T3's
// sandboxed frame that is memory only, so the way out is Copy feedback.
const KEY = 'meat-review:fb:' + D.title + '|' + D.manifest;
const S = Object.assign({mine: [], verdict: {}, reply: {}, split: false}, (() => { try { return JSON.parse(store.getItem(KEY) || '{}'); } catch { return {}; } })());
const persist = () => store.setItem(KEY, JSON.stringify(S));
let cmN = S.mine.reduce((m, c) => Math.max(m, +String(c.id).slice(1) || 0), 0);

// ---- code: each run of shown rows is one segment, drawn plain from git and upgraded to Pierre when it scrolls in.
const SEGS = {};
let segN = 0;
const onRow = (r, side, line) => side === 'old' ? r.m !== '+' && r.o === line : r.m !== '-' && r.n === line;
const placed = new Set();
function seg(path, block, step, label) {
  const id = 'g' + (++segN), fs = [];
  // A finding of this step sits on the first shown row that holds its line.
  for (const r of block.rows) for (const f of D.findings) {
    if (f.step === step && f.file === path && !placed.has(f.id) && onRow(r, f.side || 'new', f.line)) { placed.add(f.id); fs.push({r, f}); }
  }
  SEGS[id] = {id, path, label, rows: block.rows, hunk: block.hunk, fs};
  return `<div class="seg" id="${id}"><table class="rows">${rowsHtml(SEGS[id])}</table><div class="pz"></div></div>`;
}
// Findings and your comments on a segment's rows, in row order.
function annsOf(sg) {
  const out = sg.fs.map(({r, f}) => ({r, side: f.side || 'new', line: f.line, meta: {f: f.id}}));
  for (const c of S.mine) if (!c.step && segFor(c) === sg) {
    const r = sg.rows.find(r => onRow(r, c.side, c.line));
    if (r) out.push({r, side: c.side, line: c.line, meta: {c: c.id}});
  }
  return out;
}
// The segment a comment sits in: the one it was made in, else the first drawn one holding its line (after a reload).
const holds = (sg, c) => sg.path === c.path && sg.rows.some(r => onRow(r, c.side, c.line));
const segFor = c => SEGS[c.seg] && holds(SEGS[c.seg], c) ? SEGS[c.seg] : Object.values(SEGS).find(sg => holds(sg, c));
const annHtml = m => m.f ? findingHtml(D.findings.find(x => x.id === m.f), true) : commentHtml(S.mine.find(c => c.id === m.c));
const gu = (sg, side, line) => line == null ? '' : `<button class="gu" data-gu="${sg.id}|${side}|${line}" title="Comment on this line" tabindex="-1">+</button>`;
function rowsHtml(sg) {
  const anns = annsOf(sg);
  const after = (rs, span) => anns.filter(a => rs.includes(a.r)).map(a => `<tr class="ann"><td colspan="${span}">${annHtml(a.meta)}</td></tr>`).join('');
  if (S.split) {
    // Pair each run of removed rows with the added run after it, line for line.
    const pairs = [];
    for (let i = 0; i < sg.rows.length;) {
      if (sg.rows[i].m === ' ') { pairs.push([sg.rows[i], sg.rows[i]]); i++; continue; }
      const del = [], add = [];
      while (i < sg.rows.length && sg.rows[i].m === '-') del.push(sg.rows[i++]);
      while (i < sg.rows.length && sg.rows[i].m === '+') add.push(sg.rows[i++]);
      for (let k = 0; k < Math.max(del.length, add.length); k++) pairs.push([del[k], add[k]]);
    }
    const cell = (r, side) => {
      if (!r) return `<td class="n gap"></td><td class="t gap"></td>`;
      const ln = side === 'old' ? r.o : r.n, cls = r.m === '-' ? 'del' : r.m === '+' ? 'add' : '';
      return `<td class="n ${cls}">${gu(sg, side, ln)}${ln ?? ''}</td><td class="t ${cls}">${esc(r.t)}</td>`;
    };
    return `<colgroup><col class="cn"><col><col class="cn"><col></colgroup>` +
      pairs.map(([o, n]) => `<tr class="sp2">${cell(o, 'old')}${cell(n, 'new')}</tr>` + after([o, n].filter((r, k, a) => r && a.indexOf(r) === k), 4)).join('');
  }
  return sg.rows.map(r => {
    const ln = r.m === '-' ? r.o : r.n, side = r.m === '-' ? 'old' : 'new';
    return `<tr class="${r.m === '+' ? 'add' : r.m === '-' ? 'del' : ''}"><td class="n">${gu(sg, side, ln)}${ln ?? ''}</td><td class="m">${r.m === ' ' ? '' : r.m}</td><td class="t">${esc(r.t)}</td></tr>` + after([r], 3);
  }).join('');
}
function findingHtml(f, inline) {
  const title = f.title || f.text.split(/(?<=[.!?])\s/)[0];
  const body = f.title ? f.text : f.text.slice(title.length).trim();
  const v = S.verdict[f.id], r = S.reply[f.id];
  return `<div class="fd ${esc(f.severity)}" data-f="${esc(f.id)}"><div class="hd"><span class="sev">${SEV[f.severity] || 'Note'}</span><span class="ti">${mi(title)}</span>
    ${inline ? '' : `<span class="loc">${esc(base(f.file))}:${f.line}${f.side === 'old' ? ' (old)' : ''}</span>`}<button class="id" data-copy="${esc(f.id)}" title="Copy, then say it in chat">${esc(f.id)}</button></div>
    ${body ? `<div class="tx">${mi(body)}</div>` : ''}
    <div class="acts"><button data-v="agree" class="${v === 'agree' ? 'on' : ''}">Agree</button><button data-v="disagree" class="${v === 'disagree' ? 'on' : ''}">Disagree</button><button data-v="reply" class="${r != null ? 'on' : ''}">Reply</button></div>
    ${r != null ? `<div class="cm" data-reply="${esc(f.id)}"><textarea rows="1" placeholder="Reply to ${esc(f.id)}. Empty to discard.">${esc(r)}</textarea></div>` : ''}</div>`;
}
function where(c) {
  if (c.step) return D.steps.find(s => s.id === c.step)?.title || c.step;
  const lines = c.end && c.end !== c.line ? `${Math.min(c.line, c.end)}–${Math.max(c.line, c.end)}` : c.line;
  return `${base(c.path)}:${lines}${c.side === 'old' ? ' (old)' : ''}`;
}
function commentHtml(c) {
  if (!c) return '';
  return `<div class="cm mine" data-c="${c.id}"><div class="who"><span>You</span>${c.label ? `<span class="id">${esc(c.label)}</span>` : ''}<span class="mono">${esc(where(c))}</span><span class="sp"></span><button class="x" data-drop="${c.id}" title="Delete comment">×</button></div>
    <textarea rows="1" placeholder="Comment on ${esc(where(c))}. Empty to discard.">${esc(c.text)}</textarea></div>`;
}
const FOLDS = {};
function blocksHtml(g, step) {
  return g.blocks.map((b, i) => {
    if (!b.hidden) return seg(g.path, b, step, g.label);
    const key = `${g.id}:${i}`;
    FOLDS[key] = {path: g.path, b, step, label: g.label};
    return `<button class="fold" data-fold="${key}">${esc(b.label)}</button>`;
  }).join('');
}
function rangeHtml(g, step) {
  const lines = g.start === g.end ? `${g.start}` : `${g.start}–${g.end}`;
  const code = blocksHtml(g, step);
  return `<div class="range" id="r-${esc(g.id)}"><div class="rh"><button class="id" data-copy="${esc(g.label)}" title="Copy, then say “show ${esc(g.label)}” or comment on it in chat">${esc(g.label)}</button>
    <span class="path">${pathHtml(g.path)}<span>:${lines}${g.side === 'old' ? ' (old)' : ''}</span></span><span class="sp"></span><span class="kind">${esc(g.kind)}</span></div>
    ${g.note ? `<div class="rnote">${mi(g.note)}</div>` : ''}<div class="code">${code}</div></div>`;
}
function stepHtml(st, i) {
  const ranges = st.ranges.map(g => rangeHtml(g, st.n)).join('');
  // Findings of this step that no shown row holds stand under its header.
  const loose = D.findings.filter(f => f.step === st.n && !placed.has(f.id));
  loose.forEach(f => placed.add(f.id));
  const next = D.steps[i + 1];
  return `<section class="step" id="${esc(st.id)}"><header ${st.viz ? `data-viz-id="${esc(st.viz)}"` : ''}>
      <div class="num">${pad(st.n)} <i>/ ${pad(N)}</i></div><h2>${mi(st.title)}<button class="say" data-say="${esc(st.id)}" title="Comment on this step">Comment</button></h2>
      ${st.why ? `<p class="why">${mi(st.why)}</p>` : '<span></span>'}
      ${st.check ? `<div class="check"><b>Check</b><span>${mi(st.check)}</span></div>` : ''}</header>
    ${loose.length ? `<div class="loose">${loose.map(f => findingHtml(f)).join('')}</div>` : ''}
    <div class="loose notes" data-notes="${esc(st.id)}">${stepNotes(st.id)}</div>
    ${ranges}
    ${next ? `<a class="next" href="#${esc(next.id)}">Next · ${esc(next.title)} →</a>` : ''}</section>`;
}
function heroHtml() {
  const count = s => D.findings.filter(f => f.severity === s).length;
  const risk = count('risk'), q = count('question');
  return `<header class="hero"><div class="eyebrow"><span class="tier" title="Review depth">${esc(D.tier)}</span><span>${esc(D.label)}</span><span class="sp"></span>
      ${T3 ? '' : `<span class="theme">${['auto', 'light', 'dark'].map(t => `<button data-theme="${t}" class="${html.dataset.pick === t ? 'on' : ''}">${t}</button>`).join('')}</span>`}</div>
    <h1>${esc(D.title)}</h1>
    ${D.summary ? `<p class="sum">${mi(D.summary)}</p>` : ''}
    <div class="facts"><span><b>${N}</b> step${N === 1 ? '' : 's'}</span>${risk ? `<span class="r"><b>${risk}</b> risk${risk === 1 ? '' : 's'}</span>` : ''}${q ? `<span class="q"><b>${q}</b> question${q === 1 ? '' : 's'}</span>` : ''}
      ${D.tests.bad.length ? `<span><b>${D.tests.bad.length}</b> test${D.tests.bad.length === 1 ? '' : 's'} to look at</span>` : ''}<span>${esc(D.manifest)}</span></div></header>`;
}
function indexHtml() {
  if (N < 2) return '';
  return `<ol class="index">${D.steps.map(st => {
    const r = D.findings.filter(f => f.step === st.n && f.severity === 'risk').length;
    return `<li><a href="#${esc(st.id)}" ${st.viz ? `data-viz-id="${esc(st.viz)}"` : ''}><span class="n">${pad(st.n)}</span><span class="t">${mi(st.title)}</span>${r ? `<span class="d">●</span>` : ''}</a></li>`;
  }).join('')}</ol>`;
}
function endHtml() {
  const other = D.findings.filter(f => !f.step || !placed.has(f.id));
  const parts = [];
  if (other.length) parts.push(`<div><h3 class="kick">Other findings</h3><div class="loose" style="margin:0">${other.map(f => findingHtml(f)).join('')}</div></div>`);
  if (D.tests.bad.length) parts.push(`<div><h3 class="kick">Tests to look at</h3><ul>${D.tests.bad.map(t => `<li><span class="mono">${esc(base(t.file))}:${t.line}</span> <b>${esc(t.name)}</b> <span class="mut">${esc(t.verdict)}: ${mi(t.why)}</span></li>`).join('')}</ul>
    ${D.tests.real ? `<p class="mut" style="font-size:13px;margin:8px 0 0">${D.tests.real} more test${D.tests.real === 1 ? '' : 's'} would fail if the change broke.</p>` : ''}</div>`);
  if (D.later.length) parts.push(`<div><h3 class="kick">Not shown here</h3><ul>${D.later.map(l => `<li><button class="id" data-copy="show ${esc(l.label)}">${esc(l.label)}</button> <span class="mono">${esc(l.path)}:${l.start}–${l.end}</span> <span class="mut">${mi(l.note)}</span></li>`).join('')}</ul>
    <p class="mut" style="font-size:13px;margin:8px 0 0">Say “show ${esc(D.later[0].label)}” in chat${D.full ? `, or open the full page: <span class="mono">${esc(D.full)}</span>` : ''}.</p></div>`);
  if (D.skimmed.length) parts.push(`<details><summary><span class="kick">Skimmed · ${D.skimmed.length} file${D.skimmed.length === 1 ? '' : 's'}</span></summary><ul style="margin-top:10px">${D.skimmed.map(s => `<li><span class="mono">${pathHtml(s.path)}</span> <span class="mut">${esc(s.reason)}</span></li>`).join('')}</ul></details>`);
  return parts.length ? `<footer class="end">${parts.join('')}</footer>` : '';
}

const stepNotes = id => S.mine.filter(c => c.step === id).map(commentHtml).join('');
// One bar for the whole page: how the diffs read, and the way your feedback leaves. A T3 frame grows to fit its
// content, so nothing fixed stays on screen there: the bar sits at the top and the end, and the sheet opens under it.
const dockHtml = () => `<div class="dock"><div class="seg2" role="group" aria-label="Diff layout"><button data-style="unified" class="${S.split ? '' : 'on'}">Unified</button><button data-style="split" class="${S.split ? 'on' : ''}">Split</button></div>
  <button class="fb" data-sheet>Feedback<span class="cnt"></span></button></div>`;
const sheetHtml = () => `<div class="sheet" id="sheet" hidden><div class="sh-h"><b>Feedback</b><span class="mut" id="sheet-msg"></span><span class="sp"></span><button data-sheet-x title="Close">×</button></div>
  <textarea id="sheet-t" spellcheck="false"></textarea><div class="sh-f"><button class="pri" data-copyfb>Copy</button><span class="mut">Paste it to the agent. Edit here first if you like.</span><span class="sp"></span><button class="mut" data-clear>Clear all</button></div></div>`;

// ---- draw
const HINT = 'Press play to walk it. Hover a box to find its step.';
document.title = 'Reading · ' + D.title;
const steps = D.steps.map(stepHtml).join('');  // places findings, so it runs before the end matter
document.body.insertAdjacentHTML('afterbegin', `<div class="wrap">${heroHtml()}
  ${D.flow ? `<section class="flow"><div class="flow-cap"><span class="kick">Flow</span><span class="hint">${esc(HINT)}</span></div><div id="flow"></div></section>` : ''}
  ${T3 ? dockHtml() : ''}${indexHtml()}<main>${steps}</main>${endHtml()}${T3 ? dockHtml() : ''}</div>${T3 ? '' : dockHtml()}${sheetHtml()}`);
if (D.flow) {
  // viz.js loads after this script and draws every text/viz block at DOMContentLoaded.
  const s = document.createElement('script');
  s.type = 'text/viz';
  s.textContent = D.flow;
  $('#flow').append(s);
}

// ---- events
function toast(text) {
  $('.toast')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="toast"><span>Say in chat</span><input readonly value="${esc(text)}"></div>`);
  const t = $('.toast'), inp = $('input', t);
  inp.focus(); inp.select();
  setTimeout(() => t.remove(), 3500);
}
// ---- feedback actions
function refreshSeg(sg) {
  const t = $(`#${sg.id}>table.rows`);
  if (t) t.innerHTML = rowsHtml(sg);
  window.mrRefresh?.(sg);
}
const refreshNotes = id => { const el = $(`[data-notes="${CSS.escape(id)}"]`); if (el) el.innerHTML = stepNotes(id); };
// Pierre draws annotations a frame later, so the box may not exist yet.
function focusBox(sel, tries = 8) {
  const el = $$(sel).find(x => x.offsetParent);
  if (el) { el.focus(); grow(el); return; }
  if (tries) setTimeout(() => focusBox(sel, tries - 1), 50);
}
function grow(t) { if (!CSS.supports('field-sizing', 'content')) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; } }
function addComment(sg, side, line, end) {
  let c = S.mine.find(x => !x.step && x.path === sg.path && x.side === side && x.line === line);
  if (!c) { c = {id: 'c' + (++cmN), seg: sg.id, label: sg.label, path: sg.path, side, line, end, text: ''}; S.mine.push(c); persist(); refreshSeg(sg); }
  focusBox(`.cm[data-c="${c.id}"] textarea`);
}
function addStepComment(id) {
  let c = S.mine.find(x => x.step === id);
  if (!c) { c = {id: 'c' + (++cmN), step: id, label: id, text: ''}; S.mine.push(c); persist(); refreshNotes(id); }
  focusBox(`.cm[data-c="${c.id}"] textarea`);
}
function dropComment(id) {
  const c = S.mine.find(x => x.id === id);
  if (!c) return;
  const sg = c.step ? null : segFor(c);
  S.mine = S.mine.filter(x => x !== c); persist();
  if (c.step) refreshNotes(c.step); else if (sg) refreshSeg(sg);
  counts();
}
function refreshFinding(id) {
  const f = D.findings.find(x => x.id === id);
  $$(`.fd[data-f="${CSS.escape(id)}"]`).forEach(el => { el.outerHTML = findingHtml(f, !!el.closest('.ann, [data-pz-ann]')); });
  counts();
}
// The text that leaves the page: one line per thing you said, keyed by the ids the agent already knows.
function feedback() {
  const out = [];
  for (const st of D.steps) {
    for (const c of S.mine) if (c.step === st.id && c.text.trim()) out.push(`- ${st.id} (step: ${st.title}): ${c.text.trim()}`);
    for (const c of S.mine) if (!c.step && c.text.trim() && c.label?.startsWith(st.id + '.')) out.push(`- ${c.label} ${c.path}:${where(c).split(':').pop()}: ${c.text.trim()}`);
  }
  for (const c of S.mine) if (!c.step && c.text.trim() && !D.steps.some(st => c.label?.startsWith(st.id + '.'))) out.push(`- ${c.path}:${where(c).split(':').pop()}: ${c.text.trim()}`);
  for (const f of D.findings) {
    const v = S.verdict[f.id], r = (S.reply[f.id] || '').trim();
    if (v || r) out.push(`- ${f.id} (${base(f.file)}:${f.line}): ${v || 'reply'}${r ? ': ' + r : ''}`);
  }
  return out.length ? `Feedback on the reading of "${D.title}" (${D.label}):\n${out.join('\n')}` : '';
}
function counts() {
  const n = feedback().split('\n').filter(l => l.startsWith('- ')).length;
  $$('.dock .fb').forEach(b => { b.classList.toggle('has', n > 0); $('.cnt', b).textContent = n ? String(n) : ''; });
}
// T3's frame blocks the Clipboard API, so the feedback opens selected in a box where ⌘C works.
function openSheet(from) {
  // In T3 the sheet opens under the bar you used; on its own page it floats above the corner bar.
  if (T3) (from?.closest('.dock') || $('.dock')).after($('#sheet'));
  const t = feedback(), box = $('#sheet-t'), msg = $('#sheet-msg');
  box.value = t || 'Nothing yet. Hover a code line and press +, comment on a step, or answer a finding.';
  $('#sheet').hidden = false;
  msg.textContent = '';
  if (t) { box.focus(); box.select(); }
}
function copyFeedback() {
  const box = $('#sheet-t'), msg = $('#sheet-msg');
  box.focus(); box.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch {}
  msg.textContent = ok ? 'Copied' : 'Press ⌘C';
  if (!ok) navigator.clipboard?.writeText(box.value).then(() => { msg.textContent = 'Copied'; }, () => {});
}
function setStyle(split) {
  if (S.split === split) return;
  S.split = split; persist();
  $$('[data-style]').forEach(b => b.classList.toggle('on', (b.dataset.style === 'split') === split));
  html.dataset.split = split ? '1' : '';
  for (const sg of Object.values(SEGS)) { const t = $(`#${sg.id}>table.rows`); if (t) t.innerHTML = rowsHtml(sg); }
  window.mrRestyle?.();
}
html.dataset.split = S.split ? '1' : '';
counts();

document.addEventListener('click', e => {
  const at = s => e.target.closest(s);
  let el;
  if ((el = at('[data-gu]'))) { const [id, side, line] = el.dataset.gu.split('|'); return addComment(SEGS[id], side, +line); }
  if ((el = at('[data-say]'))) return addStepComment(el.dataset.say);
  if ((el = at('[data-drop]'))) return dropComment(el.dataset.drop);
  if ((el = at('.fd [data-v]'))) {
    const id = el.closest('.fd').dataset.f, v = el.dataset.v;
    if (v === 'reply') { if (S.reply[id] == null) S.reply[id] = ''; persist(); refreshFinding(id); return focusBox(`.fd[data-f="${CSS.escape(id)}"] .cm textarea`); }
    S.verdict[id] = S.verdict[id] === v ? undefined : v; persist(); return refreshFinding(id);
  }
  if ((el = at('[data-style]'))) return setStyle(el.dataset.style === 'split');
  if ((el = at('[data-sheet]'))) return $('#sheet').hidden || (T3 && el.closest('.dock').nextElementSibling !== $('#sheet')) ? openSheet(el) : ($('#sheet').hidden = true);
  if (at('[data-sheet-x]')) { $('#sheet').hidden = true; return; }
  if (at('[data-copyfb]')) return copyFeedback();
  if (at('[data-clear]')) {
    const segs = new Set(S.mine.map(c => !c.step && segFor(c)).filter(Boolean)), steps = S.mine.filter(c => c.step).map(c => c.step), fs = Object.keys({...S.verdict, ...S.reply});
    S.mine = []; S.verdict = {}; S.reply = {}; persist();
    segs.forEach(refreshSeg); steps.forEach(refreshNotes); fs.forEach(refreshFinding); counts();
    $('#sheet-t').value = ''; $('#sheet-msg').textContent = 'Cleared';
    return;
  }
  const c = e.target.closest('[data-copy]');
  if (c) {
    const text = c.dataset.copy;
    // T3's frame blocks the Clipboard API, so the id also shows selected where ⌘C works.
    navigator.clipboard?.writeText(text).catch(() => {});
    toast(text);
    return;
  }
  const f = e.target.closest('[data-fold]');
  if (f) {
    const {path, b, step, label} = FOLDS[f.dataset.fold];
    f.insertAdjacentHTML('afterend', seg(path, b, step, label));
    const el = f.nextElementSibling;
    f.remove();
    window.mrWatch?.(el);
    return;
  }
  const t = e.target.closest('[data-theme]');
  if (t) {
    store.setItem('meat-review:theme', t.dataset.theme);
    mode();
    $$('[data-theme]').forEach(b => b.classList.toggle('on', b === t));
    window.mrRetheme?.();
    return;
  }
  const a = e.target.closest('a[href^="#"]');
  if (a) { e.preventDefault(); document.getElementById(a.getAttribute('href').slice(1))?.scrollIntoView({behavior: 'smooth', block: 'start'}); }
});
document.addEventListener('input', e => {
  const cm = e.target.closest?.('.cm');
  if (!cm || e.target.tagName !== 'TEXTAREA') return;
  grow(e.target);
  if (cm.dataset.c) { const c = S.mine.find(x => x.id === cm.dataset.c); if (c) c.text = e.target.value; }
  if (cm.dataset.reply) S.reply[cm.dataset.reply] = e.target.value;
  persist(); counts();
});
// A box left empty goes away.
document.addEventListener('focusout', e => {
  const cm = e.target.closest?.('.cm');
  if (!cm || e.target.tagName !== 'TEXTAREA' || e.target.value.trim()) return;
  if (cm.dataset.c) setTimeout(() => { const c = S.mine.find(x => x.id === cm.dataset.c); if (c && !c.text.trim()) dropComment(c.id); }, 150);
  if (cm.dataset.reply) setTimeout(() => { const id = cm.dataset.reply; if (!(S.reply[id] || '').trim()) { delete S.reply[id]; persist(); refreshFinding(id); } }, 150);
});
// Keys: j/k walk the steps, f opens the feedback, Esc leaves a box or the sheet; ⌘↵ in a box finishes it.
document.addEventListener('keydown', e => {
  const typing = e.target.closest?.('textarea, input');
  if (typing) {
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); e.target.blur(); if (e.target.id === 'sheet-t') $('#sheet').hidden = true; }
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape') { $('#sheet').hidden = true; return; }
  if (e.key === 'f') { e.preventDefault(); return openSheet(); }
  if (e.key === 's') return setStyle(!S.split);
  if (e.key !== 'j' && e.key !== 'k') return;
  const secs = $$('.step'), y = 30;
  const cur = secs.findIndex(s => s.getBoundingClientRect().top > y + 4);
  const i = e.key === 'j' ? (cur < 0 ? secs.length - 1 : cur) : Math.max(0, (cur < 0 ? secs.length : cur) - 2);
  secs[i]?.scrollIntoView({behavior: 'smooth', block: 'start'});
});
// Hovering a box in the flow that a step names offers a jump to that step in the caption.
document.addEventListener('viz:hover', e => {
  const {id, from} = e.detail || {};
  const hint = $('.flow-cap .hint');
  if (!hint || from === 'page' || !id) return;
  const st = D.steps.find(s => s.viz === id);
  hint.innerHTML = st ? `<a href="#${esc(st.id)}">Step ${st.n} · ${esc(st.title)} ↓</a>` : esc(HINT);
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { mode(); window.mrRetheme?.(); });

(async () => {
  // Pierre upgrades each shown segment once it is near the screen: syntax highlighting and word-level diffs over the
  // same rows from git. If the import fails (offline, blocked), the plain rows stay.
  let P;
  try { P = window.MR_PIERRE || await import(PIERRE); } catch (err) { console.warn('meat-review: diff renderer unavailable, showing plain rows', err?.message || err); }
  if (!P) return;
  const dark = () => html.dataset.mode === 'dark';
  const SIDE = {old: 'deletions', new: 'additions'};
  const live = new Map();
  const patch = sg => {
    const [os, oc, ns, nc] = sg.hunk, p = sg.path;
    return `--- a/${p}\n+++ b/${p}\n@@ -${os},${oc} +${ns},${nc} @@\n` + sg.rows.map(r => r.m + r.t).join('\n') + '\n';
  };
  function upgrade(el) {
    const sg = SEGS[el.id];
    if (!sg || live.has(el.id)) return;
    try {
      const fileDiff = P.parsePatchFiles(patch(sg))[0].files[0];
      if (P.langOf) fileDiff.lang = P.langOf(sg.path);
      const box = $('.pz', el);
      const view = new P.FileDiff({
        theme: {dark: 'pierre-dark', light: 'pierre-light'}, themeType: dark() ? 'dark' : 'light',
        diffStyle: S.split ? 'split' : 'unified', disableFileHeader: true, overflow: 'wrap', hunkSeparators: 'simple', lineDiffType: 'word-alt',
        // The + beside a line number; drag it down the gutter to comment on several lines.
        enableGutterUtility: true,
        onGutterUtilityClick: r => {
          const side = (r.endSide || r.side) === 'deletions' ? 'old' : 'new';
          addComment(sg, side, Math.max(r.start, r.end), r.end !== r.start ? Math.min(r.start, r.end) : undefined);
        },
        renderAnnotation: a => { const d = document.createElement('div'); d.className = 'ann pz-ann'; d.innerHTML = annHtml(a.metadata); return d; },
      });
      view.render({fileDiff, containerWrapper: box, lineAnnotations: annList(sg)});
      live.set(el.id, view);
      el.classList.add('up');
    } catch (err) { console.warn('meat-review: kept plain rows for', sg.path, err?.message || err); }
  }
  const annList = sg => annsOf(sg).map(a => ({side: SIDE[a.side], lineNumber: a.line, metadata: a.meta}));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); upgrade(e.target); } }), {rootMargin: '600px 0px'});
  window.mrWatch = el => io.observe(el);
  $$('.seg').forEach(el => io.observe(el));
  window.mrRetheme = () => { for (const v of live.values()) v.setThemeType?.(dark() ? 'dark' : 'light'); };
  window.mrRefresh = sg => { const v = live.get(sg.id); if (!v) return; v.setLineAnnotations(annList(sg)); v.rerender(); };
  window.mrRestyle = () => {
    for (const v of live.values()) { v.setOptions({...v.options, diffStyle: S.split ? 'split' : 'unified'}); v.rerender(); }
  };
})();
