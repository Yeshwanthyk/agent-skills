# Patterns

Copy-paste-ready snippets for the components named in `SKILL.md`. Adjust palette and tag names per system. None require build steps or external scripts.

## Engineering Manual tokens — light and dark

This is the **default token block** for every explainer (see `SKILL.md` → Engineering Manual). Drop it in first; every other component reads its colors through these tokens. Light-first: cream paper + charcoal ink + cobalt accent. Dark variant: deep navy paper + cream ink + lifted cobalt. **One accent only** — layer roles vary lightness and dash style, never hue.

### Font stack

Load these in `<head>` before the token block. Departure Mono is the display face; Source Serif 4 is the body; IBM Plex Mono is the UI / label face. Press Start 2P is the no-CDN fallback.

```html
<!-- Departure Mono (display) — self-hosted via @font-face below.
     For true self-containment, base64-inline the WOFF2 from
     https://departuremono.com/DepartureMono-Regular.woff2 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,300..700&family=IBM+Plex+Mono:wght@400;500;600&family=Press+Start+2P&display=swap">
```

```css
@font-face {
  font-family: 'Departure Mono';
  src: url('https://departuremono.com/DepartureMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}

:root {
  --font-display: 'Departure Mono', 'Press Start 2P', ui-monospace, Menlo, monospace;
  --font-body:    'Source Serif 4', 'Iowan Old Style', 'Georgia', serif;
  --font-mono:    'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace;
}
```

### CSS token block

```css
/* ── Light (default) — Engineering Manual ─────────────────────── */
:root {
  /* structure */
  --bg:            oklch(97.5% 0.012  80);   /* cream paper, slightly warm */
  --bg-alt:        oklch(96%   0.014  80);
  --surface:       oklch(98.5% 0.010  80);
  --surface-elev:  oklch(99.5% 0.006  80);
  --border:        oklch(85%   0.014 263);
  --border-strong: oklch(72%   0.020 263);

  /* text */
  --ink:       oklch(20% 0.015 270);          /* charcoal, slightly cool */
  --ink-dim:   oklch(42% 0.012 270);
  --ink-faint: oklch(60% 0.010 270);

  /* one accent — cobalt — and its tints */
  --accent:        oklch(50%   0.220 263);    /* electric cobalt */
  --accent-dim:    oklch(60%   0.180 263);
  --accent-tint:   oklch(85%   0.080 263);    /* diagram fills */
  --accent-bg:     oklch(95.5% 0.045 263);    /* active / hover */
  --accent-faint:  oklch(92%   0.025 263);    /* graph paper grid */

  /* layer roles — all map to cobalt; differentiate by stroke + label */
  --c-external:   var(--accent);
  --c-command:    var(--accent);
  --c-source:     var(--accent);
  --c-events:     var(--accent);
  --c-projection: var(--accent);
  --c-api:        var(--accent);
  --c-error:      oklch(45% 0.140  25);       /* desaturated brick red */
  --c-skill:      var(--accent);

  --c-external-bg:   var(--accent-bg);
  --c-command-bg:    var(--accent-bg);
  --c-source-bg:     var(--accent-bg);
  --c-events-bg:     var(--accent-bg);
  --c-projection-bg: var(--accent-bg);
  --c-api-bg:        var(--accent-bg);
  --c-error-bg:      oklch(94% 0.030  25);
  --c-skill-bg:      var(--accent-bg);

  /* status */
  --ok:   var(--accent);
  --warn: oklch(55% 0.160  70);                /* mustard, used sparingly */
  --bad:  oklch(45% 0.140  25);

  /* motion */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 120ms;
  --dur-base: 240ms;
  --dur-slow: 480ms;

  color-scheme: light;
}

/* ── Dark — deep navy paper ───────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg:            oklch(15% 0.025 263);     /* deep navy paper */
    --bg-alt:        oklch(18% 0.028 263);
    --surface:       oklch(20% 0.030 263);
    --surface-elev:  oklch(23% 0.032 263);
    --border:        oklch(35% 0.045 263);
    --border-strong: oklch(50% 0.080 263);

    --ink:       oklch(94% 0.010  80);          /* cream-white */
    --ink-dim:   oklch(75% 0.012  80);
    --ink-faint: oklch(58% 0.014  80);

    --accent:        oklch(70%   0.180 263);    /* lifted, slight desat */
    --accent-dim:    oklch(60%   0.150 263);
    --accent-tint:   oklch(40%   0.120 263);
    --accent-bg:     oklch(28%   0.080 263);
    --accent-faint:  oklch(24%   0.050 263);

    --c-error:      oklch(65% 0.160  25);
    --c-error-bg:   oklch(30% 0.080  25);

    --warn: oklch(72% 0.155  70);
    --bad:  oklch(65% 0.160  25);

    color-scheme: dark;
  }
}

/* ── Explicit override — toggle wins over OS ──────────────────── */
[data-theme="dark"] {
  --bg:            oklch(15% 0.025 263);
  --bg-alt:        oklch(18% 0.028 263);
  --surface:       oklch(20% 0.030 263);
  --surface-elev:  oklch(23% 0.032 263);
  --border:        oklch(35% 0.045 263);
  --border-strong: oklch(50% 0.080 263);
  --ink:       oklch(94% 0.010  80);
  --ink-dim:   oklch(75% 0.012  80);
  --ink-faint: oklch(58% 0.014  80);
  --accent:        oklch(70%   0.180 263);
  --accent-dim:    oklch(60%   0.150 263);
  --accent-tint:   oklch(40%   0.120 263);
  --accent-bg:     oklch(28%   0.080 263);
  --accent-faint:  oklch(24%   0.050 263);
  --c-error:      oklch(65% 0.160  25);
  --c-error-bg:   oklch(30% 0.080  25);
  --warn: oklch(72% 0.155  70);
  --bad:  oklch(65% 0.160  25);
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

/* base body styling — Engineering Manual */
body {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.55;
  color: var(--ink);
  background: var(--bg);
  hyphens: auto;
  text-rendering: optimizeLegibility;
  font-feature-settings: "kern", "liga", "onum";
}

h1, h2, h3 {
  font-family: var(--font-display);
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 400;
  letter-spacing: 0;
}
h1 { font-size: clamp(40px, 6vw, 64px); line-height: 1; margin: 0 0 .4em; }
h2 { font-size: 22px; margin: 2em 0 .6em; }
h3 { font-size: 14px; letter-spacing: 0.06em; color: var(--ink-dim); }

.label, .eyebrow, .cite, .meta, code, pre, th, td.num {
  font-family: var(--font-mono);
  font-feature-settings: "tnum";
}
.label, .eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 11px;
  color: var(--accent);
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

- All eight layer roles map to `--accent` (cobalt). Differentiation is through stroke style (solid vs dashed), label weight, and ALL-CAPS UI. Resist the urge to vary hue — the discipline is what makes the aesthetic work.
- The single exception is `--c-error` and `--bad`, which use a desaturated brick red `oklch(45% 0.140 25)`. Reserve these for true error states only.
- `border-radius` is implicitly `0` everywhere. Do not set it.
- `box-shadow` is forbidden globally. Depth comes from rule lines and lightness shifts. See anti-patterns.
- Hue is held at 263 across the whole palette. Cream paper has its own hue (80, warm). Charcoal ink has a slight cool cast (270). This three-hue restraint is the visual signature.

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

## Engineering Manual components

These seven patterns are the visual signature of the aesthetic. Use them anywhere a diagram, frame, list, or section break appears. Each is independent and copy-paste ready. They also work outside Engineering Manual — the cobalt token simply becomes whatever the active accent is.

### 1. Dashed leader line with arrowhead marker (SVG)

For any diagram where labels point to features. Solid for primary geometry, dashed for leaders.

```html
<svg viewBox="0 0 600 360" class="diagram">
  <defs>
    <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4"
            markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--accent)" />
    </marker>
  </defs>

  <!-- primary geometry: solid 1.5px cobalt -->
  <rect x="180" y="80" width="240" height="140"
        fill="none" stroke="var(--accent)" stroke-width="1.5" />

  <!-- leader: dashed, ends with arrowhead pointing at the feature -->
  <path d="M 470 60 L 420 60 L 380 90"
        fill="none" stroke="var(--accent)" stroke-width="1.5"
        stroke-dasharray="4 3" marker-end="url(#arrow)" />

  <!-- ALL-CAPS mono label -->
  <text x="475" y="64" class="diagram-label">TOP SHELL</text>
</svg>
```

```css
.diagram { width: 100%; height: auto; display: block; }
.diagram-label {
  font-family: var(--font-mono);
  font-size: 10px;
  fill: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
```

Rules: leader paths have at most one bend. Arrowhead points **at the feature**, never away. Label is set 4–6px past the leader's start. One marker `<defs>` block serves the whole document.

### 2. Graph-paper background pattern (SVG)

Drop inside a diagram frame. Two overlaid grids, 10px minor + 50px major, ~12% opacity.

```html
<svg viewBox="0 0 600 360" class="diagram">
  <defs>
    <pattern id="grid-minor" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none"
            stroke="var(--accent-faint)" stroke-width="0.5" />
    </pattern>
    <pattern id="grid-major" width="50" height="50" patternUnits="userSpaceOnUse">
      <rect width="50" height="50" fill="url(#grid-minor)" />
      <path d="M 50 0 L 0 0 0 50" fill="none"
            stroke="var(--accent-tint)" stroke-width="0.7" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid-major)" />
  <!-- diagram content layered on top -->
</svg>
```

Use the `--accent-faint` and `--accent-tint` tokens so the grid auto-adjusts in dark mode. Never hardcode a hex.

### 3. Vertical FIG marginalia

Rotated figure number on the left edge of every diagram frame, optional bracket metadata on the right.

```html
<figure class="fig">
  <span class="fig-num">FIG.001</span>
  <span class="fig-meta">[ 3.5" FLOPPY DISK ]</span>
  <svg class="diagram" viewBox="0 0 600 360"> ... </svg>
  <figcaption class="fig-cap">An exploded view of the floppy disk assembly.</figcaption>
</figure>
```

```css
.fig {
  position: relative;
  margin: 2.5rem 0;
  padding: 0 48px;       /* leave room for marginalia on both sides */
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.fig-num,
.fig-meta {
  position: absolute;
  top: 24px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--accent);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  text-transform: uppercase;
}
.fig-num  { left: 14px; }
.fig-meta { right: 14px; transform: rotate(180deg); }
.fig-cap {
  font-family: var(--font-body);
  font-style: italic;
  font-size: 13px;
  color: var(--ink-dim);
  margin: 12px 0 0;
}
```

Number FIGs sequentially across the document. Don't restart per section.

### 4. Dot-leader list rows (TOC)

The signature TOC row: title on the left, ellipsis fill in the middle, word count or page reference on the right.

```html
<ol class="toc">
  <li><a href="#screen">How does a screen work?</a><span class="wc">3.6K WORDS</span></li>
  <li><a href="#color">What is a color space?</a><span class="wc">6.2K WORDS</span></li>
  <li><a href="#contrast">Color contrast.</a><span class="wc"></span></li>
</ol>
```

```css
.toc { list-style: none; padding: 0; margin: 0; }
.toc li {
  display: flex; align-items: baseline;
  font-family: var(--font-body);
  font-size: 14px;
  margin: 0.4em 0;
}
.toc li::before {
  content: "•";
  color: var(--accent);
  margin-right: 0.6em;
  font-size: 11px;
}
.toc a {
  color: var(--ink);
  text-decoration: none;
  white-space: nowrap;
}
.toc a::after {
  content: "";
  flex: 1;
  margin: 0 6px;
  border-bottom: 1px dotted var(--border-strong);
  transform: translateY(-3px);
}
.toc .wc {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  white-space: nowrap;
}
.toc a:hover { color: var(--accent); }
```

The `flex: 1` pseudo-element with a dotted bottom-border is what produces the Edwardian dot-leader fill. Don't use repeated `.` characters — they don't reflow correctly.

### 5. Hatched / tessellated divider rule

Replace `<hr>` between major sections with a repeating SVG pattern. Reads as a printed-book typographic ornament.

```html
<div class="rule-hatch" role="separator"></div>
```

```css
.rule-hatch {
  height: 8px;
  margin: 2.5rem 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M0 4 L4 0 L8 4 L4 8 Z M6 4 L10 0' fill='none' stroke='%231d4ed8' stroke-width='0.8'/></svg>");
  background-repeat: repeat-x;
  background-position: center;
}
[data-theme="dark"] .rule-hatch,
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .rule-hatch {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M0 4 L4 0 L8 4 L4 8 Z M6 4 L10 0' fill='none' stroke='%237aa7ff' stroke-width='0.8'/></svg>");
  }
}
```

The encoded hex (`%231d4ed8`, `%237aa7ff`) is cobalt for light mode and lifted cobalt for dark. SVG `data:` URLs cannot read CSS variables, so this is the one place hex is permitted — keep it inside a single `.rule-hatch` rule.

### 6. Drop cap on first paragraph

Classic editorial drop cap on the first paragraph of each major section.

```html
<section class="chapter">
  <p class="lead">Have you ever wondered how a touch screen knows you are
    touching it? Well, it has these layers of transparent metal
    electrodes embedded in the display…</p>
  <p>Because the electrodes are laid out on a grid…</p>
</section>
```

```css
.chapter > p.lead {
  text-align: justify;
  hyphens: auto;
  text-wrap: pretty;
}
.chapter > p.lead::first-letter {
  font-family: var(--font-display);
  color: var(--ink);
  float: left;
  font-size: 3.4em;
  line-height: 0.9;
  padding: 4px 8px 0 0;
  margin-top: 4px;
}
```

Use the display (pixel) font for the cap so it reads as part of the engineering vocabulary, not as a stage prop. Lowercase opening letter is fine — the cap takes over.

### 7. Bracket metadata corners

Version stamp, copyright, or running head, anchored in a corner with bracket framing.

```html
<div class="corner-meta tl">V1.0</div>
<div class="corner-meta tr">PROGRESS · SOURCE</div>
<div class="corner-meta br">© 2026</div>
```

```css
.corner-meta {
  position: fixed;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-faint);
  pointer-events: none;
}
.corner-meta.tl { top: 18px; left: 24px; }
.corner-meta.tr { top: 18px; right: 24px; color: var(--accent); }
.corner-meta.br { bottom: 18px; right: 24px; }
.corner-meta::before { content: "[ "; color: var(--ink-faint); }
.corner-meta::after  { content: " ]"; color: var(--ink-faint); }
```

At most three corners populated. The top-right is the only one allowed to use the accent color — it earns attention because it usually marks live state ("PROGRESS", "V1.0", current chapter).

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
