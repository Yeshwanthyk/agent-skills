# Patterns

Copy-paste-ready snippets for the components named in `SKILL.md`. Adjust palette and tag names per system. None require build steps or external scripts.

## Theme tokens — light and dark

Dual-mode is non-negotiable (see `SKILL.md` → Themes). Drop this block in first; every other component reads its colors through these tokens. Light-first orientation: light values in `:root`, dark values in `[data-theme="dark"]` and the `prefers-color-scheme: dark` media query. The three-state toggle writes `data-theme` on `<html>` and persists to `localStorage`.

### CSS token block

```css
/* ── Light (default) ────────────────────────────────────────────── */
:root {
  /* structure */
  --bg:            oklch(98.5% 0.004 260);
  --bg-alt:        oklch(96.5% 0.005 260);
  --surface:       oklch(99.5% 0.003 260);
  --surface-elev:  oklch(100%  0      0  );
  --border:        oklch(90%   0.006 260);
  --border-strong: oklch(82%   0.008 260);

  /* text */
  --ink:       oklch(20% 0.015 260);
  --ink-dim:   oklch(42% 0.012 260);
  --ink-faint: oklch(60% 0.010 260);

  /* layer accents (keep hue, vary lightness/chroma per theme) */
  --c-external:   oklch(62% 0.155  55);  /* orange  */
  --c-command:    oklch(55% 0.165 250);  /* blue    */
  --c-source:     oklch(55% 0.135 150);  /* green   */
  --c-events:     oklch(55% 0.165 305);  /* purple  */
  --c-projection: oklch(58% 0.115 200);  /* teal    */
  --c-api:        oklch(68% 0.145  85);  /* yellow  */
  --c-error:      oklch(58% 0.180  25);  /* red     */
  --c-skill:      oklch(63% 0.165 350);  /* pink    */

  /* low-chroma backgrounds for active/hover state of layered cards */
  --c-external-bg:   oklch(95.5% 0.045  55);
  --c-command-bg:    oklch(95.5% 0.045 250);
  --c-source-bg:     oklch(95.5% 0.045 150);
  --c-events-bg:     oklch(95.5% 0.045 305);
  --c-projection-bg: oklch(95.5% 0.045 200);
  --c-api-bg:        oklch(95.5% 0.045  85);
  --c-error-bg:      oklch(95.5% 0.055  25);
  --c-skill-bg:      oklch(95.5% 0.045 350);

  /* status */
  --ok:   oklch(52% 0.150 150);
  --warn: oklch(60% 0.150  70);
  --bad:  oklch(55% 0.180  25);

  /* motion */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 120ms;
  --dur-base: 240ms;
  --dur-slow: 480ms;

  color-scheme: light;
}

/* ── Dark ──────────────────────────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg:            oklch(15% 0.008 260);
    --bg-alt:        oklch(18% 0.008 260);
    --surface:       oklch(20% 0.008 260);
    --surface-elev:  oklch(24% 0.008 260);
    --border:        oklch(28% 0.010 260);
    --border-strong: oklch(36% 0.012 260);

    --ink:       oklch(94% 0.008 260);
    --ink-dim:   oklch(72% 0.010 260);
    --ink-faint: oklch(54% 0.010 260);

    /* desaturated 10–20%, lifted lightness so accents read on dark surface */
    --c-external:   oklch(72% 0.140  55);
    --c-command:    oklch(70% 0.140 250);
    --c-source:     oklch(70% 0.115 150);
    --c-events:     oklch(70% 0.140 305);
    --c-projection: oklch(72% 0.100 200);
    --c-api:        oklch(78% 0.130  85);
    --c-error:      oklch(70% 0.155  25);
    --c-skill:      oklch(74% 0.140 350);

    --c-external-bg:   oklch(28% 0.060  55);
    --c-command-bg:    oklch(28% 0.060 250);
    --c-source-bg:     oklch(28% 0.050 150);
    --c-events-bg:     oklch(28% 0.060 305);
    --c-projection-bg: oklch(28% 0.045 200);
    --c-api-bg:        oklch(28% 0.060  85);
    --c-error-bg:      oklch(28% 0.070  25);
    --c-skill-bg:      oklch(28% 0.060 350);

    --ok:   oklch(70% 0.140 150);
    --warn: oklch(74% 0.140  70);
    --bad:  oklch(68% 0.155  25);

    color-scheme: dark;
  }
}

/* ── Explicit overrides (toggle wins over OS) ──────────────────── */
[data-theme="dark"] {
  --bg:            oklch(15% 0.008 260);
  --bg-alt:        oklch(18% 0.008 260);
  --surface:       oklch(20% 0.008 260);
  --surface-elev:  oklch(24% 0.008 260);
  --border:        oklch(28% 0.010 260);
  --border-strong: oklch(36% 0.012 260);
  --ink:       oklch(94% 0.008 260);
  --ink-dim:   oklch(72% 0.010 260);
  --ink-faint: oklch(54% 0.010 260);
  --c-external:   oklch(72% 0.140  55);
  --c-command:    oklch(70% 0.140 250);
  --c-source:     oklch(70% 0.115 150);
  --c-events:     oklch(70% 0.140 305);
  --c-projection: oklch(72% 0.100 200);
  --c-api:        oklch(78% 0.130  85);
  --c-error:      oklch(70% 0.155  25);
  --c-skill:      oklch(74% 0.140 350);
  --c-external-bg:   oklch(28% 0.060  55);
  --c-command-bg:    oklch(28% 0.060 250);
  --c-source-bg:     oklch(28% 0.050 150);
  --c-events-bg:     oklch(28% 0.060 305);
  --c-projection-bg: oklch(28% 0.045 200);
  --c-api-bg:        oklch(28% 0.060  85);
  --c-error-bg:      oklch(28% 0.070  25);
  --c-skill-bg:      oklch(28% 0.060 350);
  --ok:   oklch(70% 0.140 150);
  --warn: oklch(74% 0.140  70);
  --bad:  oklch(68% 0.155  25);
  color-scheme: dark;
}

/* dark-mode body weight + tracking compensation */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) body {
    font-weight: 380;
    letter-spacing: 0.012em;
    line-height: 1.62;
  }
}
[data-theme="dark"] body {
  font-weight: 380;
  letter-spacing: 0.012em;
  line-height: 1.62;
}

/* honour reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Notes:

- The explicit `[data-theme="dark"]` block is duplicated from the media query so the toggle wins over OS preference. Worth the repetition; conditional CSS via `@media` cannot be overridden by a class at the same specificity without `:where()` gymnastics.
- Hue is held constant per layer (orange = 55, blue = 250, etc.) across both themes. Only lightness and chroma move. This keeps the explainer feeling like the same document in either mode.
- `color-scheme` is set so native form controls and scrollbars match.
- Add `--bg-grid` if the page uses a subtle grid background; lower its alpha in dark mode by ~30%.

### Three-state toggle UI

```html
<div class="theme-toggle" role="radiogroup" aria-label="Theme">
  <button data-theme-set="auto"  aria-pressed="true"  title="Follow system">auto</button>
  <button data-theme-set="light" aria-pressed="false" title="Light">light</button>
  <button data-theme-set="dark"  aria-pressed="false" title="Dark">dark</button>
</div>
```

```css
.theme-toggle {
  display: inline-flex; gap: 0;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
}
.theme-toggle button {
  appearance: none;
  background: transparent;
  border: 0;
  padding: 4px 10px;
  font: 500 11px var(--mono, ui-monospace, monospace);
  color: var(--ink-faint);
  cursor: pointer;
  border-radius: 4px;
  transition: background var(--dur-fast) var(--ease-out),
              color var(--dur-fast) var(--ease-out);
}
.theme-toggle button:hover { color: var(--ink-dim); }
.theme-toggle button[aria-pressed="true"] {
  background: var(--bg-alt);
  color: var(--ink);
}
```

### JS — read at boot, write on click

Put this **inline in `<head>`** (above the `<body>`) so the theme is applied before first paint and there's no flash.

```html
<script>
(() => {
  const KEY = 'flue-explainer-theme'; // change per system
  const root = document.documentElement;
  const apply = (mode) => {
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
  };
  apply(localStorage.getItem(KEY) || 'auto');

  // attach the toggle once the DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.querySelector('.theme-toggle');
    if (!wrap) return;
    const current = localStorage.getItem(KEY) || 'auto';
    wrap.querySelectorAll('button').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.themeSet === current)));
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-theme-set]');
      if (!btn) return;
      const mode = btn.dataset.themeSet;
      localStorage.setItem(KEY, mode);
      apply(mode);
      wrap.querySelectorAll('button').forEach(b =>
        b.setAttribute('aria-pressed', String(b.dataset.themeSet === mode)));
    });
  });
})();
</script>
```

### Visual sanity check

After writing, open the file in all three states and scan for:

- white-on-white or black-on-black anywhere
- invisible borders (border same lightness as surface)
- accent-on-accent-bg pairs that fail contrast
- log entries unreadable in the opposite mode
- chart/SVG strokes that disappear (set them to a token, not a hex)
- the `.changed` flash readable in both modes (use accent + alpha, not a hex)

## Tab navigation

```html
<nav class="tabs" id="tabs">
  <button data-tab="overview"  class="active">01 overview</button>
  <button data-tab="models">02 models</button>
  <button data-tab="state">03 state</button>
  <!-- … one per section -->
</nav>

<section class="tab active" id="tab-overview"> … </section>
<section class="tab"        id="tab-models">   … </section>
<!-- … -->
```

```css
nav.tabs { display:flex; gap:6px; flex-wrap:wrap; padding:14px 20px;
           border-bottom:1px solid var(--border); position:sticky; top:0;
           background:var(--bg); z-index:10; }
nav.tabs button { background:transparent; border:1px solid transparent;
                  border-radius:6px; padding:7px 12px; font:500 12.5px var(--ui);
                  color:var(--ink-dim); cursor:pointer;
                  transition: background 120ms, color 120ms, border-color 120ms; }
nav.tabs button:hover { color:var(--ink); border-color:var(--border); }
nav.tabs button.active { background:var(--surface); color:var(--ink);
                         border-color:var(--border); }
section.tab { display:none; padding:30px 40px; max-width:1200px; }
section.tab.active { display:block; }
```

```js
const tabsEl = document.getElementById('tabs');
tabsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (!btn) return;
  document.querySelectorAll('nav.tabs button').forEach(b =>
    b.classList.toggle('active', b === btn));
  document.querySelectorAll('section.tab').forEach(s =>
    s.classList.toggle('active', s.id === 'tab-' + btn.dataset.tab));
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
```

## Composition flow with clickable nodes

```html
<div class="flow" id="flow">
  <div class="node" data-key="ctx">    <b>FlueContext</b><span>HTTP boundary</span></div>
  <div class="arrow">→</div>
  <div class="node" data-key="init">   <b>init()</b>   <span>resolves sandbox</span></div>
  <div class="arrow">→</div>
  <div class="node" data-key="agent">  <b>FlueAgent</b><span>runtime handle</span></div>
  <!-- … -->
</div>
<div class="flow-info" id="flowinfo"><!-- swapped on click --></div>
```

```js
const flowDetails = {
  ctx: {
    title: 'FlueContext',
    cite:  'types.ts:175–183',
    body:  'The request context handed to every handler …',
    code:  '<span class="k">interface</span> FlueContext { … }'
  },
  /* … */
};
function setFlowActive(key) {
  document.querySelectorAll('#flow .node').forEach(n =>
    n.classList.toggle('active', n.dataset.key === key));
  const d = flowDetails[key]; if (!d) return;
  document.getElementById('flowinfo').innerHTML =
    `<div class="hd"><div class="title">${d.title}</div>
     <div class="sub">${d.cite}</div></div>
     <p>${d.body}</p><pre class="code">${d.code}</pre>`;
}
document.getElementById('flow').addEventListener('click', (e) => {
  const node = e.target.closest('.node[data-key]');
  if (node) setFlowActive(node.dataset.key);
});
setFlowActive(Object.keys(flowDetails)[0]);
```

## Multi-lane sequence player

```html
<div class="lanes">
  <div class="lane"><h5>HTTP</h5>      <div class="lane-events" id="lane-http"></div></div>
  <div class="lane"><h5>server</h5>    <div class="lane-events" id="lane-srv"></div></div>
  <div class="lane"><h5>framework</h5> <div class="lane-events" id="lane-flue"></div></div>
  <div class="lane"><h5>core loop</h5> <div class="lane-events" id="lane-core"></div></div>
  <div class="lane"><h5>AI sdk</h5>    <div class="lane-events" id="lane-ai"></div></div>
  <div class="lane"><h5>provider</h5>  <div class="lane-events" id="lane-llm"></div></div>
</div>
<div class="controls">
  <button id="turnReset">⟲ reset</button>
  <button id="turnNext">next ▶</button>
  <button id="turnPlay">▶ autoplay</button>
  <span class="pill" id="turnStepLabel">step 0 / 0</span>
</div>
<div class="panes">
  <div class="pane"><h4>Session state</h4><div id="turnState"></div></div>
  <div class="pane"><h4>Framework events</h4><div class="log" id="turnLog"></div></div>
  <div class="pane"><h4>Step explanation</h4><p id="turnExpl">—</p></div>
</div>
```

```js
const turnEvents = [
  { lane:'http', dir:'down', label:'POST /agents/x/y',
    desc:'Request hits server …',
    framework:null /* or 'text_delta' to push into the log */ },
  { lane:'core', dir:'up',   label:'agent_start',
    desc:'core loop begins', framework:'agent_start' },
  /* … */
];

function ensureLaneEvents() {
  ['http','srv','flue','core','ai','llm'].forEach(l =>
    document.getElementById('lane-'+l).innerHTML = '');
  turnEvents.forEach((ev, i) => {
    const lane = document.getElementById('lane-'+ev.lane);
    const span = document.createElement('div');
    span.className = 'lane-evt pending dir-'+ev.dir;
    span.id = 'turnev-'+i;
    span.innerHTML =
      `<span class="arrow">${ev.dir==='down'?'↓':'↑'}</span>
       <span>${escapeHtml(ev.label)}</span>`;
    lane.appendChild(span);
  });
}
```

`pending` cells are dim, `fired` cells are full color. `next` advances `turnIdx` and toggles classes; `autoplay` sets an interval.

## DAG history graph (SVG)

```html
<div class="hg-shell">
  <svg id="hgSvg" viewBox="0 0 1080 200"></svg>
</div>
<div class="hg-detail">
  <h4>Entry detail</h4>     <div id="hgInfo"></div>
  <h4>Projected context</h4><div id="hgContext"></div>
</div>
```

```js
const hgEntries = [
  { id:'a1', type:'message', kind:'user',      x:60,  y:80, parentId:null,
    label:'user',      text:'help me audit deps' },
  { id:'a2', type:'message', kind:'assistant', x:170, y:80, parentId:'a1',
    label:'assistant', text:'reading…' },
  { id:'c1', type:'compaction',                x:720, y:80, parentId:'a6',
    label:'compaction',text:'older 4 messages summarized' },
  /* … */
];

function renderHg() {
  const svg = document.getElementById('hgSvg');
  svg.innerHTML = '<defs>…arrow marker…</defs>';
  // edges
  hgEntries.forEach(n => {
    if (!n.parentId) return;
    const p = hgEntries.find(e => e.id === n.parentId);
    /* draw path from (p.x+78, p.y+22) → (n.x, n.y+22) */
  });
  // nodes
  hgEntries.forEach(n => {
    /* rect with class hg-node user|assistant|compaction; click → selectHg(id) */
  });
}

function selectHg(id) {
  /* update #hgInfo with raw fields, #hgContext with the projected view:
     - compaction summary as synthetic [Context Summary] user message
     - entries before compaction → marked "hidden by barrier"
     - entries after → included verbatim */
}
```

The teaching moment is that the right pane re-projects the entire history into "what the LLM actually sees". Clicking different entries highlights how each gets rewritten.

## Resource meter (token/budget)

```html
<div class="tok-shell">
  <div class="tok-meter" id="tokMeter">
    <div class="bar">
      <div class="seg used"    id="segUsed"></div>
      <div class="seg summary" id="segSummary"></div>
      <div class="seg recent"  id="segRecent"></div>
      <div class="seg reserve" id="segReserve"></div>
    </div>
  </div>
  <div class="tok-info" id="tokInfo">—</div>
  <div class="tok-controls">
    <button id="tokFill">+20k tokens</button>
    <button id="tokCompact">run compaction</button>
    <button id="tokReset">reset</button>
  </div>
</div>
```

```js
const TOK_MAX = 200000, TOK_RESERVE = 16384, TOK_KEEP = 20000;
let tok = { used: 4000, summary: 0, recent: 0, status: 'idle' };

function tokRender() {
  const meter = document.getElementById('tokMeter');
  const total = meter.querySelector('.bar').clientWidth;
  const px = t => Math.round(total * (t / TOK_MAX));
  /* set widths and lefts of segments by tok.status */
  /* compute health pill: healthy / approaching / would compact */
}
```

Buttons just mutate `tok` and call `tokRender()`. Idle vs compacted differ by which segments are visible.

## Cut-point timeline (algorithm decision)

```html
<div class="cut-controls">
  <button data-cutscn="clean">clean cut</button>
  <button data-cutscn="split">split-turn</button>
  <button data-cutscn="big-turn">big final turn</button>
</div>
<div class="msg-timeline" id="msgTimeline"></div>
<p class="cut-expl" id="cutExpl">—</p>
```

```js
const cutScenarios = {
  clean: {
    expl: 'Budget hits at a USER boundary — clean cut.',
    msgs: [
      { kind:'user',      text:'fix bug',   summarized:true },
      { kind:'assistant', text:'reading…',  summarized:true },
      /* … */
      { kind:'user',      text:'now run tests', cut:true, kept:true },
      { kind:'assistant', text:'running…',                kept:true },
    ]
  },
  /* split, big-turn … */
};

function renderCut(name) {
  const scn = cutScenarios[name];
  document.getElementById('cutExpl').textContent = scn.expl;
  document.getElementById('msgTimeline').innerHTML = scn.msgs.map((m, i) => {
    let cls = 'msg ' + m.kind;
    if (m.cut)         cls += ' cut';
    if (m.summarized)  cls += ' summarized';
    if (m.splitPrefix) cls += ' split-prefix';
    if (m.kept)        cls += ' kept';
    return `<div class="${cls}">[${i}] ${m.kind}: ${escapeHtml(m.text)}</div>`;
  }).join('');
}
```

## Scenario simulator

See `scenario-schema.md` for the data shape. Renderer skeleton:

```js
let state = initialState();
let stepIdx = 0;
let currentScn = scenarios[0];

function nextStep() {
  if (stepIdx >= currentScn.steps.length) return;
  const step = currentScn.steps[stepIdx];
  setActiveStage(step.stage);                      // highlight pipeline box
  const changed = applyPatch(state, step.patch);   // mutate state
  applyHistory(state, step.history);               // mutate entries
  pushEvent(...step.ev);                           // append to log
  document.getElementById('stepExpl').textContent = step.expl;
  renderState(changed); renderHistory(); renderInvariants();
  stepIdx++; renderStepLabel();
  setTimeout(() =>
    document.querySelectorAll('#stateView .v.changed')
            .forEach(el => el.classList.remove('changed')), 1500);
}

function applyPatch(state, patch) {
  const changed = new Set();
  for (const [path, val] of Object.entries(patch || {})) {
    const segs = path.split('.');
    let o = state;
    for (let i = 0; i < segs.length - 1; i++) {
      o[segs[i]] ??= {};
      o = o[segs[i]];
    }
    o[segs.at(-1)] = val;
    changed.add(path);
  }
  return changed;
}

function applyHistory(state, h) {
  if (!h) return;
  if (h.fill)    state.entries = Array.from({length:h.fill}, (_,i) =>
                   ({ type:'message', role: i%2 ? 'assistant' : 'user', id:'m'+i }));
  if (h.add)     state.entries.push({ ...h.add, id:'m'+state.entries.length });
  if (h.pop)     state.entries.pop();
  if (h.compact) {
    const keep = state.entries.slice(-12);
    state.entries = [
      { type:'compaction', summary:'older history compressed', id:'c'+state.entries.length },
      ...keep
    ];
  }
}
```

## Invariants panel

```js
const invariantList = [
  { key:'one-active',     label:'At most one active op per session' },
  { key:'role-overlay',   label:'Role text never appears in user history' },
  { key:'task-depth',     label:'Task depth ≤ MAX_TASK_DEPTH (4)' },
  { key:'overflow-once',  label:'Overflow recovery is one-shot per call' },
  { key:'cut-boundary',   label:'Cut points only at user/assistant boundaries' },
];

function evalInvariants(s) {
  return {
    'one-active':    !s.taskActive ? 'ok' : 'idle',
    'role-overlay':  'ok',
    'task-depth':    (s.session.depth ?? 0) <= 4 ? 'ok' : 'bad',
    'overflow-once': (s.overflowRecoveries ?? 0) <= 1 ? 'ok' : 'bad',
    'cut-boundary':  'ok',
  };
}

function renderInvariants() {
  const r = evalInvariants(state);
  document.getElementById('invList').innerHTML = invariantList.map(inv => {
    const status = r[inv.key] ?? 'idle';
    const sym = status === 'ok' ? '✓' : status === 'bad' ? '!' : '·';
    return `<div class="inv ${status}">
              <span class="ck">${sym}</span><span>${inv.label}</span>
            </div>`;
  }).join('');
}
```

```css
.inv         { display:flex; gap:8px; align-items:center; padding:5px 0;
               font-size:12.5px; color:var(--ink-dim); }
.inv.ok  .ck { color:var(--ok);   }
.inv.bad .ck { color:var(--bad);  }
.inv.idle.ck { color:var(--ink-faint); }
```

## Comparison matrix

```html
<table class="matrix">
  <thead><tr><th>Concern</th><th>System A</th><th>System B</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Streaming</td>
        <td class="yes">✓ built-in</td>
        <td class="partial">via plugin</td>
        <td>SSE everywhere vs opt-in.</td></tr>
    <tr><td>Cron triggers</td>
        <td class="no">—</td>
        <td class="yes">✓</td>
        <td>Schedulers are first-class on B.</td></tr>
  </tbody>
</table>
```

```css
.matrix             { width:100%; border-collapse:collapse; font-size:12.5px; }
.matrix th,.matrix td{ padding:8px 10px; border-bottom:1px solid var(--border);
                       text-align:left; vertical-align:top; }
.matrix th          { font:600 11px var(--mono); color:var(--ink-dim);
                      text-transform:uppercase; letter-spacing:0.04em; }
.matrix td.yes      { background:rgba(16,185,129,0.08); color:var(--ok);  }
.matrix td.partial  { background:rgba(245,158,11,0.08); color:var(--warn); }
.matrix td.no       { background:rgba(239,68,68,0.06);  color:var(--ink-faint); }
```

## Citation tag

```html
This is the boundary into the runtime. <a class="cite">client.ts:55–102</a>
```

```css
.cite { display:inline-block; padding:1px 6px; margin-left:4px;
        font:500 10.5px var(--mono); color:var(--ink-faint);
        background:var(--surface); border:1px solid var(--border);
        border-radius:3px; vertical-align:1px; cursor:default; }
.cite:hover { color:var(--ink-dim); }
```

## Source-map row

```html
<div class="srcmap">
  <div class="row"><div class="file">client.ts</div>
                   <div class="desc">init() — sandbox resolution, provider merge</div></div>
  <div class="row"><div class="file">session.ts</div>
                   <div class="desc">prompt/skill/task/shell verbs, runExclusive, eventing</div></div>
</div>
```

```css
.srcmap .row    { display:grid; grid-template-columns:220px 1fr; gap:14px;
                  padding:7px 0; border-bottom:1px dashed var(--border);
                  font-size:12.5px; }
.srcmap .file   { font:500 12px var(--mono); color:var(--ink); }
.srcmap .desc   { color:var(--ink-dim); }
```

## Helper

```js
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
```

Use it whenever scenario data is interpolated into HTML.
