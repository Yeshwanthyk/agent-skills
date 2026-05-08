---
name: interactive-system-explainer
description: Generate polished self-contained HTML explainers for technical systems with tabs, multi-lane sequence players, state machines, history DAGs, resource meters, scenario simulators, comparison matrices, source citations, and invariant checks. Use when the user asks for a visual architecture explainer, interactive system walkthrough, multi-section technical explainer, scenario simulator, shareable HTML artifact, or wants to deeply understand how a non-trivial system works.
---

# Interactive System Explainer

Build shareable, self-contained HTML pages that make non-trivial technical systems understandable through interaction. Reach for this skill when one long scrollable page would not be enough — when the system has multiple distinct concerns (boundary, state, lifecycle, algorithm, deployment) that each deserve their own pane and their own interaction model.

This skill is for **visualizing and explaining** an existing system, grounded in real source. It is not for designing systems from scratch. If lifecycle behavior is unclear, model it first (see `stateful-systems`), then return here to visualize.

## When to use

Reach for this skill when the user asks for:

- visual architecture explainer or interactive HTML walkthrough
- multi-section technical explainer (more than ~6 distinct concepts)
- scenario simulator
- state-machine, data-flow, or sequence visualization
- system map for engineers/PMs/stakeholders to share
- exportable `/tmp/<name>-explainer.html` or `~/Downloads/<name>-explainer.html`

Strong signals that a one-tab scroll page is **not** enough and you should reach for tabs:

- 8+ distinct concepts to cover
- multiple specialised diagrams (state machine + sequence + DAG + matrix)
- multiple scenarios that all need the same surrounding context
- need to compare two side-by-side systems
- a "deploy" / "ops" view that is structurally different from the conceptual view

## When not to use

- marketing / landing pages
- generic dashboards without explanatory purpose
- pure docs where prose is sufficient
- system design where the lifecycle is not yet pinned down (model first)
- a single diagram — that's `visual-explainer` territory

## Core principles

```text
1. Source-of-truth state and derived state must be visually separated.
2. Every interactive control must reveal or mutate meaningful state.
3. Scenarios are data, never hard-coded UI branches.
4. Every claim about behavior cites a real file:line.
5. Both light and dark themes ship in the same file. Neither is optional.
6. Validate before declaring done — node --check on extracted JS, brace/paren balance, curl on the served file, and visual check in both themes.
```

If a control does not mutate state, surface a citation, or filter a view — delete it.

## Themes (mandatory dual-mode)

Explainers ship as shareable artefacts. They land on every kind of OS, every kind of monitor, every kind of ambient light. **Light AND dark are non-negotiable.** Not light "for safety". Not dark "because tools look cool". Both, in the same file, equally polished.

### Default orientation: light-first

Light values live in `:root`. Dark values live in `[data-theme="dark"]` and the `prefers-color-scheme: dark` media query. Light-first reads as "engineering reference" — closer to a printed technical document. That is the right default for source-cited explainers.

The **default aesthetic is Engineering Manual** (next section). It is light-first by design. Deviate only when the system itself dictates a different feel (terminal CLI in Catppuccin, observability dashboard at 2am in deep slate) and you can write the one-sentence physical scene that forces the answer. "Observability dashboard" does not force it. "SRE glancing at incident severity on a 27-inch monitor at 2am in a dim room" does. Run the sentence, not the category.

## Engineering Manual (default aesthetic)

A reference-book look in the lineage of Tufte, Ableton's *Learning Music*, Bartosz Ciechanowski, *The Art of Electronics*, the Whole Earth Catalog, and Dan Hollick's makingsoftware.com. Built for source-cited technical documents that should feel **printed**, not webapp.

Every explainer ships in this aesthetic by default. The full token block, font stack, and component patterns live in `references/patterns.md` under "Engineering Manual tokens — light and dark" and the seven Engineering Manual component patterns below it.

### The physical scene

> *An engineer reads this on a high-DPI laptop in a quiet office, leaning back. The page should feel like an opened reference book. The reader should be able to print it and have it still look right.*

If your one-sentence scene doesn't fit this, you have grounds to pick a different aesthetic from the escape hatch below. Otherwise, use this.

### Palette — three colors total

```text
paper       cream       oklch(97.5% 0.012  80)   /* slightly warm */
ink         charcoal    oklch(20%   0.015 270)   /* slightly cool */
accent      cobalt      oklch(50%   0.220 263)   /* electric blue */
ink-dim                 oklch(42%   0.012 270)
ink-faint               oklch(60%   0.010 270)
accent-tint             oklch(85%   0.080 263)   /* diagram fills */
accent-bg               oklch(95.5% 0.045 263)   /* active states */
```

No other accent colors. Layer roles (`--c-external`, `--c-command`, etc.) all map to **shades of the cobalt accent** — vary lightness, hold hue. The discipline of one-accent-only is what makes the aesthetic look expensive. Resist the urge to add green for "source" or red for "error". Use ink weight, italics, ALL-CAPS, and dashed-vs-solid strokes for differentiation instead. The only exception: `--bad` may use a desaturated brick red (`oklch(45% 0.140 25)`) for true error states.

### Dark variant — deep navy paper

```text
paper       navy        oklch(15% 0.025 263)
ink         cream-white oklch(94% 0.010  80)
accent      cobalt      oklch(70% 0.180 263)   /* lifted lightness, slight desat */
accent-tint             oklch(40% 0.120 263)
accent-bg               oklch(28% 0.080 263)
```

Keeps the document feel by tinting paper toward the cobalt hue rather than going neutral black. Cobalt accent stays — only its lightness shifts.

### Typography

```text
display  Departure Mono   (pixel/bitmap, OFL, departuremono.com)
body     Source Serif 4   (transitional serif, OFL, Google Fonts)
ui       IBM Plex Mono    (monospace UI labels, OFL, Google Fonts)
fallback Press Start 2P   (display fallback if Departure Mono unavailable)
```

Load order: Departure Mono via `@font-face` (CDN or base64-inlined for true self-containment), Source Serif 4 + IBM Plex Mono via Google Fonts `<link>`. Press Start 2P is the Google-Fonts-only fallback for stricter no-CDN scenarios.

Use:

- **Display** for the title only. ALL-CAPS. Cobalt. ~48–64px. Letter-spacing flat (pixel fonts already have built-in spacing).
- **Body** for prose. Justified, hyphenated, 65–75ch measure. **Drop cap** on the first paragraph of each section. `text-wrap: pretty` on long paragraphs.
- **UI** for tab labels, citations, FIG numbers, metadata, table headers, code, log entries. ALL-CAPS at 11px with 5–10% letter-spacing for labels; mixed case for code and citations.
- One family per role. No deviation. Three families is the cap.

### Diagram conventions

Every diagram in the explainer follows the engineering-illustration vocabulary:

- **1.5px cobalt strokes**, no thicker. Solid for primary geometry, dashed (`stroke-dasharray: 4 3`) for hidden / projection / leader lines.
- **30%-tint cobalt fills** for shaded areas (`var(--c-tint)`). Never a different hue.
- **Square graph-paper background** inside diagram frames — SVG `<pattern>` with two overlaid grids (10px minor, 50px major), opacity ~12%. See `patterns.md`.
- **Dashed leader lines with tiny arrowhead markers** connecting labels to features. ALL-CAPS mono labels in cobalt. See `patterns.md`.
- **FIG numbering in vertical marginalia** — `FIG.001`, `FIG.002` rotated 90° in the diagram's left margin (`writing-mode: vertical-rl`).
- **Bracket metadata** in the right margin or corner — `[ 3.5" FLOPPY DISK ]`, `© 2026`, also rotated.
- **Exploded axonometric** when explaining composite or layered systems. Layers separated by faint dashed connectors.
- **No shadows. No gradients. No rounded corners.** Sharp corners on every container, every card, every diagram frame.

### Layout conventions

- **Hatched/tessellated horizontal rule** under the title and between major sections — not `<hr>`. Repeating SVG pattern. See `patterns.md`.
- **TOC with dot-leader rows** — chapter title on the left, ellipsis fill in the middle (`border-bottom: 1px dotted`), word count or page reference on the right in muted mono. See `patterns.md`.
- **Three-column TOC grid** for non-trivial scope — chapter number in mono, chapter title in serif caps, articles bulleted underneath.
- **Running head** in the top-right corner — e.g. `PROGRESS · SOURCE` or `V1.0`, like a print book.
- **Generous margins**. Book-page rhythm, not webapp-cramped. Aim for ~80px page padding on desktop.
- **Justified body text** with hyphenation (`hyphens: auto`).

### Discipline rules — absolute

Match-and-refuse. If you write any of these, rewrite.

- No `box-shadow` anywhere. Depth comes from rule lines and lightness shifts, not blur.
- No `border-radius` greater than `0`. Sharp corners only.
- No gradient on text. No gradient on backgrounds. No gradient on borders.
- No emoji. No icons except inline SVG drawn in the same 1.5px cobalt vocabulary.
- No more than one accent color (cobalt). Plus the desaturated brick red for true errors.
- No font-family beyond the three named (display + body + ui).
- No `border-radius` on diagrams. No drop shadows on cards. No glow. No pulse.

### Escape hatch

If the system genuinely demands a different aesthetic — terminal CLI tool, dark-first observability dashboard, children's-product oriented system — write the one-sentence physical scene first, then pick from this short list:

- **Terminal Native** — deep navy-black paper, amber + green accents, monospace everywhere. For CLI tools, REPLs, debuggers.
- **Editorial Light** — warm white, terracotta + sage, transitional serif. For workflow / business systems where prose dominates.
- **Lab Notebook** — graph paper background, handwriting-adjacent serif (Caveat for annotations), pencil greys. For experimental / scientific systems.

Do not invent a fresh aesthetic per explainer. Pick from this set or use Engineering Manual.

### Three-state toggle in the header

A small segmented control: `auto · light · dark`. Persists to `localStorage` under a stable key (`<system-name>-theme`). `auto` follows OS via `prefers-color-scheme`; the explicit choices override it. The page must be valid in all three states.

```html
<div class="theme-toggle" role="radiogroup" aria-label="Theme">
  <button data-theme-set="auto"  aria-pressed="true">auto</button>
  <button data-theme-set="light" aria-pressed="false">light</button>
  <button data-theme-set="dark"  aria-pressed="false">dark</button>
</div>
```

Full token block + JS toggle + the `data-theme` swap pattern live in `references/patterns.md` under "Theme tokens — light and dark". Drop-in.

### Color rules (apply in both modes)

- **OKLCH for every color.** Hex only for CSS variable definitions inside theme blocks. Never hardcode `#xxx` outside a theme block.
- **Never `#000` or `#fff`.** Tint every neutral toward a brand or accent hue with chroma `0.005–0.015`. Pure gray feels lifeless next to colored layers.
- **No accent reaches WCAG-failing contrast.** 4.5:1 minimum for body text, 3:1 for large text and UI components. Spot-check the three commonest pairings: body on bg, ink-dim on surface, accent on surface. The dark mode is where this fails most often.
- **Alpha is a smell.** Heavy `rgba(...)` use means an incomplete palette. Define explicit `--surface-elev`, `--accent-bg` tokens. Reserve alpha for focus rings and the `.changed` flash.

### Dark mode is not inverted light mode

Different design rules apply. Get all of these right:

| Light mode | Dark mode |
|---|---|
| Shadows for depth | Lighter surfaces for depth (no shadows) |
| Body weight 400–500 | Body weight 350–450 (light text on dark reads heavier) |
| Vibrant accents at full chroma | Desaturate accents 10–20% (chroma `0.15` → `0.12`) |
| White-ish backgrounds (`oklch(98% 0.005 <hue>)`) | Dark gray, never pure black (`oklch(15% 0.005 <hue>)` minimum) |
| Default line-height | +0.05–0.1 line-height, +0.01–0.02em letter-spacing on body |
| Borders ≈ 8% darker than surface | Borders ≈ 8% lighter than surface |

Depth in dark mode comes from a 3-step lightness ladder (15% / 20% / 25%) at the same hue/chroma, not from shadow.

### Required token set

Define these semantically, twice (light + dark). The renderer should never read raw hex — always through tokens.

```text
structure   --bg, --bg-alt, --surface, --surface-elev, --border, --border-strong
text        --ink, --ink-dim, --ink-faint
layers      --c-external, --c-command, --c-source, --c-events,
            --c-projection, --c-api, --c-error, --c-skill
status      --ok, --warn, --bad
backgrounds --c-external-bg, --c-command-bg, ... (low-chroma tints for active/hover states)
motion      --ease-out  (cubic-bezier(0.16, 1, 0.3, 1) by default)
            --dur-fast (120ms), --dur-base (240ms), --dur-slow (480ms)
```

Each layer accent gets a `-bg` variant: a low-chroma background tint used for active state of pipeline boxes, scenario picker hover, log entry stripes. This is what lets the same scenario simulator look right in both themes.

## Typography

- **One font family in multiple weights** beats two competing typefaces. Only pair when there's a real structural contrast (display + body, serif + mono).
- **5-size scale, no more.** `xs / sm / base / lg / xl` with ≥1.25 ratio between steps. More sizes = muddy hierarchy.
- **Forbidden body fonts:** Inter, Roboto, Arial, Helvetica, system-ui alone. AI-slop signals. Use a deliberate pairing (DM Sans + Fira Code, IBM Plex Sans + IBM Plex Mono, Bricolage Grotesque + JetBrains Mono, Plus Jakarta Sans + Azeret Mono, Instrument Serif + JetBrains Mono).
- **`font-variant-numeric: tabular-nums`** on every numeric column, log timestamp, token count, citation line range. Numbers must not jitter as they update.
- **`text-wrap: balance`** on H1–H3. **`text-wrap: pretty`** on long-form paragraphs.
- **`font-optical-sizing: auto`** on body when using a variable font.
- **5–12% letter-spacing on ALL-CAPS labels** (eyebrows, section labels, table headers). Capitals at default tracking sit too tight.
- **Cap measure at 65–75ch.** Long lines kill scanability.

## Motion

- **Duration ladder 100 / 300 / 500.** Micro-feedback at 100–150ms, state changes at 200–300ms, layout reflows at 300–500ms. Anything longer is showing off.
- **Default ease `cubic-bezier(0.16, 1, 0.3, 1)`** (ease-out-quart). No `ease`, no bounce, no elastic. Real objects decelerate; they don't bounce.
- **Transform + opacity + filter only.** Never animate `width`, `height`, `top`, `left`, `margin` — they trigger layout.
- **`prefers-reduced-motion: reduce`** must collapse all durations to `0.01ms`. Vestibular disorders affect ~35% of adults over 40.
- **The `.changed` row-flash is the canonical "animation earns its place".** A 1500ms tinted background on a row that just mutated. Every other animation in the explainer must justify itself the same way.
- **No animated glow, no pulse, no gradient text, no @keyframes that loop.** Top of the AI-slop list.

## Cognitive load gate (per tab)

Apply this checklist before declaring a tab done. Each pane / tab must pass.

- [ ] **≤4 primary affordances** in the active pane. Anything beyond goes into a secondary group, a collapsible, or a different tab.
- [ ] **One primary action per scenario step.** `next ▶` is the visually loud button. `play`, `reset`, `prev` are quieter. Don't make all four equally weighted.
- [ ] **Co-located information.** Everything needed for one decision lives in one viewport — scenario picker, current state, history, log, invariants share the simulator pane on purpose. No tab-switching mid-decision.
- [ ] **Progressive disclosure.** Raw JSON dumps, full file lists, and exhaustive matrices go behind `<details>` or a click-to-expand. The default view shows the teaching surface, not the data dump.
- [ ] **Visual hierarchy.** Squint test — one element should clearly read as primary on each pane. If everything has the same weight, push the secondary stuff down a tier.
- [ ] **No memory bridge.** A reader on tab 09 should not have to remember a value from tab 04 to understand the current step. Repeat the relevant context inline (cite or restate).

## Workflow

1. **Discover** — read the actual source (files, tests, docs, traces). Capture the discovery checklist below. If a question can only be answered by guessing, either inspect more code or fork a subagent to research that area first. Never invent lifecycle.
2. **Outline tabs** — group concepts into tabs (overview, models, state machine, turn anatomy, history, algorithm deep-dive, scenarios, deploy, comparison, source map). Aim for 6–12 tabs for non-trivial systems.
3. **Breadboard affordances** — for every tab list the UI affordances and the underlying data shape they read/mutate. Reject any control that does neither.
4. **Confirm aesthetic** — Engineering Manual by default. Only deviate via the escape hatch with a written one-sentence physical scene. Avoid generic AI dashboard at all costs.
5. **Write one self-contained `.html`** — inline HTML/CSS/JS, no bundler, no npm, no CDN unless approved. Open directly in a browser.
6. **Validate** — extract `<script>` block, run `node --check`, verify brace and paren balance, count tabs/sections, serve and `curl` for HTTP 200, copy to `~/Downloads` if requested.
7. **Report** — file path, served URL, tabs included, scenarios included, assumptions, validation evidence.

## Discovery checklist

Capture these before any HTML is written:

```text
System name:
Audience:
Source artifacts/files (with line ranges):
Primary entities/models:
Source-of-truth model:
Derived/read models:
Stored states:
Derived states:
Transitions:
Commands/intents:
Events/history:
Boundary contracts (HTTP, MCP, SSE, etc.):
Invariants:
Scheduled jobs/backfills:
Freshness/cache behavior:
API/UI outputs:
Algorithms with thresholds/budgets (e.g. compaction, retry, backoff):
Decision points / cut points the algorithm picks:
Deployment targets (local, edge, container, serverless):
Concurrency / locking model:
Scenarios to simulate (happy path + at least one recovery/error):
Edge cases to show:
```

If a row is unknown, fork a subagent on that subsystem rather than fabricating.

## Tab structure for non-trivial systems

For a rich system, this is a known-good tab layout. Add or remove based on the system, but the order matters — start broad, drill in, then deploy/compare.

```text
01 Overview            — composition flow, key vocabulary
02 Workspace / files    — project layout the user actually touches
03 Composition flow     — clickable nodes with per-node code and citation
04 Models               — entity cards, fields grouped by role
05 State machine        — clickable states, allowed transitions, what readers see
06 Turn / sequence      — multi-lane sequence player (HTTP → server → core → provider)
07 History / data graph — append-only DAG with projection rules
08 Algorithm deep-dive  — token/budget meter + decision-point timeline
09 Scenarios            — simulator with pipeline, state, history, log, invariants
10 Deploy & dev         — build pipeline, runtime topology, watcher state machine
11 Vs / matrix          — side-by-side comparison with semantic cells
12 Source map           — every cited file with one-line description
```

A footer with "scenarios are illustrative simulations of source-of-truth behavior — not live runs" is honest and worth including.

## Required component patterns

Each pattern below is reusable across explainers. Concrete copy-paste snippets live in `references/patterns.md`. Read it before writing the page.

### Tab navigation

A top-of-page tab bar that swaps `section.tab` blocks. One section visible at a time. Smooth scroll to top on switch. Active button is visually distinct (filled background, not just bolded text).

Use tabs whenever the page has 6+ distinct concepts. Anti-pattern: one infinitely scrolling page with 12 H2s.

### Composition flow with clickable nodes

A horizontal pipeline of named nodes (e.g. `FlueContext → init → FlueAgent → FlueSession → loop`). Clicking a node updates a side panel with:

- title + source citation (`file.ts:line-line`)
- one-paragraph description
- a small code block of the actual interface or call

This is far better than a static tree of cards because it teaches **how the pieces connect**, not just what each is.

### State machine (clickable)

SVG with named states, arrows for legal transitions, terminal state markers. Clicking a state updates a side panel with: meaning, allowed transitions, invariants, what API/readers see during that state, citation.

Use `stateDiagram-v2` only for trivial labels — for anything with `colons:`, `(parens)`, or `<br/>`, hand-roll SVG (or use Mermaid `flowchart TD` with rounded nodes).

### Multi-lane sequence player

Cross-boundary flows (HTTP → server → framework → core → AI SDK → provider) deserve a swim-lane sequence player, not a flat sequence diagram. Each lane gets a column. Each event is a card in its lane with a direction arrow (↓ down, ↑ up). User clicks **next** to fire the next event; cards transition from `pending` (dim) to `fired` (full color). A side log captures only the events that produce framework-visible side-effects (FlueEvents, emitted messages). A state panel shows what is in-flight (lock held, tools active, stream open). An explanation panel shows the current step's description.

This is the pattern that made the flue explainer's "turn anatomy" tab work. It teaches the loop in a way no static diagram can.

### History / data graph (DAG)

For systems with append-only history (event sourcing, agent message history, audit logs): render the entries as a horizontal DAG with `parentId` edges. Annotate special entries (compaction, branch, leaf) with markers. Click any node to see:

- raw fields (id, type, parentId, source, role, text)
- **how this entry projects into the read model / context window** — this is the key teaching moment

Show the projected context as a separate view so the user can see what gets dropped, what gets summarised, what gets included verbatim.

### Resource meter (token/quota/budget)

For any algorithm with a budget (context window, token limit, rate limit, queue depth): render a horizontal segmented bar with semantic colors (used / kept / summary / reserve). Buttons let the user fill, compact, reset. The bar mutates in real time. A status line says "healthy / approaching limit / would compact".

### Decision-point / cut-point timeline

When an algorithm picks a cut point in a sequence (compaction cut, retry boundary, transaction split): render the sequence as a horizontal strip of typed cells (`user`, `assistant`, `toolCall`, `toolResult`). Tag each cell with its fate (`summarized`, `split-prefix`, `cut`, `kept`). Provide 2–3 scenario buttons (`clean cut`, `split-turn`, `huge final turn`) that swap the cells. Pair with a one-paragraph explanation of why the algorithm landed where it did.

### Scenario simulator

The keystone interactive component. A scenario is data:

```js
{
  id: 'overflow',
  title: 'Overflow recovery (retry)',
  desc: 'Provider rejects → remove failing leaf → incremental compaction → retry',
  steps: [
    {
      stage: 'external',                                    // pipeline stage to highlight
      expl: 'Existing long-lived session, 84 entries.',     // 1-line explanation panel
      ev: ['sys','request','POST /agents/support/u-99'],    // [kind, type, message] for log
      patch: { 'agent.id': 'support', 'contextTokens': 188000 },
      history: { fill: 84 }                                 // optional: fill | add | pop | compact
    },
    /* ... more steps */
  ]
}
```

The renderer is generic — given the scenario list it renders pickers, drives the state object, animates field changes, appends log entries, mutates the history view, evaluates invariants, and shows the active pipeline stage. Adding a new scenario is data-only, never code branching.

Per scenario, include at least one happy path and at least one recovery / error / retry path. The recovery scenarios are where the explainer earns its keep.

### Invariants panel

A live list of safety properties for the running scenario. Each invariant is `{ key, label }`; the renderer evaluates `evalInvariants(state) → { key: 'ok'|'bad'|'idle' }` and stamps a `✓`, `!`, or `·` next to each. Flash on change. Examples:

```text
At most one active op per session
Role text never appears in user message history
Custom tool names never collide with built-ins
Task delegation depth ≤ MAX_TASK_DEPTH (4)
History grows except on overflow recovery
Overflow recovery is one-shot per call
Cut points only at user/assistant boundaries
```

### Comparison matrix

For "X vs Y" tabs: a real `<table>` with first column being the concern and columns 2..N being each system. Cells use semantic classes (`yes` / `partial` / `no`) with colored backgrounds and `✓` / `partial` / `—` glyphs. Add a final paragraph explaining when to pick each — never just leave the table to speak alone.

### Source map

A two-column list of every cited file with a one-line description. This grounds the explainer in real code and makes it easy to verify any claim.

### Citation pattern

Inline citations are first-class. Use a small subdued tag right after the claim:

```html
<a class="cite">file.ts:104–166</a>
```

Style as monospace, small, dim. Don't link unless a stable URL exists. Citations earn trust — every behavior claim should have one.

## Page structure

```text
header (title, summary, audience, legend)
nav.tabs
section.tab (overview, models, state, turn, history, algorithm, scenarios, deploy, vs, sources)
footer (one-line honest disclaimer)
<style> all CSS
<script> all JS, data-driven scenarios at bottom
```

Header should include a legend mapping the seven layer colors to their meanings, so the user can decode any diagram.

## Layer color meanings

The semantic layer roles are stable across explainers. Under Engineering Manual they all map to **shades of the cobalt accent** — varied by lightness, dashed-vs-solid strokes, ink weight, and ALL-CAPS labels rather than by hue. Only outside Engineering Manual (i.e. via the escape hatch) do these become distinct hues.

```text
--c-external    external boundary (HTTP, webhooks, schedulers)
--c-command     write seam / command / intent
--c-source      source-of-truth storage
--c-events      append-only events / history
--c-projection  read model / projection / cache
--c-api         API / UI surface
--c-error       error / denied / overflow
--c-skill       domain-specific accent (skills, roles, plugins)
```

The full OKLCH token block for both themes lives in `references/patterns.md` under "Engineering Manual tokens — light and dark". Forbidden palettes (indigo `#8b5cf6` family, neon cyan/magenta, gradient text, glowing box-shadows) covered there and in `references/anti-patterns.md`.

## JavaScript architecture

Three layers:

```text
1. Static fixtures (scenarios, tree, flow nodes, state-machine details, comparison rows)
2. Renderer functions (renderState, renderHistory, renderInvariants, renderStepLabel)
3. Event handlers (tab clicks, node clicks, scenario picker, prev/next/play)
```

Single shared state object with explicit shape. Patches via dotted-path strings:

```js
function applyPatch(state, patch) {
  const changed = new Set();
  for (const [path, val] of Object.entries(patch || {})) {
    const segs = path.split('.');
    let o = state;
    for (let i = 0; i < segs.length - 1; i++) { o[segs[i]] ??= {}; o = o[segs[i]]; }
    o[segs.at(-1)] = val;
    changed.add(path);
  }
  return changed;                     // used to flash changed rows
}
```

The `changed` Set drives a temporary `.changed` class that highlights mutated rows for ~1.5s — this is the single most effective teaching device in the simulator.

See `references/scenario-schema.md` for the full state and step shapes.

## Validation

Never declare done without:

```bash
# 1. JS syntax
python3 -c "
import re
html = open('/tmp/<name>-explainer.html').read()
m = re.search(r'<script>(.*?)</script>', html, re.DOTALL)
open('/tmp/check.js','w').write(m.group(1))
print('size:', len(html))
print('script tags:', html.count('<script>'), '/', html.count('</script>'))
print('style tags:', html.count('<style>'), '/', html.count('</style>'))
print('section.tab:', len(re.findall(r'<section class=\"tab', html)))
print('balanced braces:', html.count('{')==html.count('}'), html.count('{'))
print('balanced parens:', html.count('(')==html.count(')'), html.count('('))
"
node --check /tmp/check.js && echo "JS OK"

# 2. Serve and curl
python3 -m http.server <port> --directory /tmp >/tmp/srv.log 2>&1 &
curl -s -o /dev/null -w "%{http_code} %{size_download} bytes\n" \
  http://localhost:<port>/<name>-explainer.html

# 3. (Optional) copy to Downloads
cp /tmp/<name>-explainer.html ~/Downloads/
```

If braces/parens mismatch, find the nearest unbalanced region with `awk` or by re-extracting fragments. Do not ship an explainer with mismatched braces — even if the page renders.

See `references/validation.md` for the full ritual.

## Authoring strategy for very large explainers

A 1500–2000 line single-file explainer cannot be written in one shot. The proven flow:

1. Write the `<head>` + `<style>` + tab nav + 12 empty `<section>` shells first.
2. Append HTML for sections 01–04, then validate.
3. Append HTML for sections 05–08, validate.
4. Append HTML for sections 09–12, validate.
5. Append `<script>` in 3–4 chunks (state + tabs, sequence player, DAG + meter + cut-points, scenarios), validate after each.
6. Final validation pass: brace/paren balance, `node --check`, curl 200.

Use heredoc append (`cat >> file << 'EOF' ... EOF`) so each chunk is independent and any failure is localised.

## Anti-patterns

Reject:

- decorative controls that do not mutate state or filter a view
- scrolling-only layout when the page covers 6+ distinct concepts
- hard-coded scenario branches in renderer code
- mixing source-of-truth and derived state in the same panel
- presenting events/history as mutable
- inventing transitions, fields, or behavior not present in source
- claims without a citation
- shipping without `node --check` and brace balance verification
- one giant Mermaid diagram with 20+ nodes (will render unreadable)
- placeholder copy ("Lorem", "TODO", "etc")
- emoji icons in section headers (use semantic colored dots / numbered badges instead)

See `references/anti-patterns.md` for the expanded list with cures.

## Output

Default path: `/tmp/<system-name>-explainer.html`. If the user asks to share/export, also copy to `~/Downloads/<system-name>-explainer.html`.

Final report (concise):

```text
Changed:
- /tmp/<name>-explainer.html — N tabs, M scenarios

Verified:
- node --check: OK
- braces: A/A · parens: B/B · sections: T · scripts: 1 · styles: 1
- curl: 200 (S bytes) at http://localhost:<port>/<name>-explainer.html

Notes:
- assumptions or limitations only
```

## Reference files

- `references/patterns.md` — theme tokens (light + dark) and three-state toggle, plus tabs, sequence player, DAG, meter, cut-point timeline, scenario renderer, invariants, comparison matrix, citation, source map
- `references/scenario-schema.md` — full state and step data shapes
- `references/validation.md` — full validation ritual including dual-theme + contrast spot-check
- `references/anti-patterns.md` — slop list with cures, theme failures included

## Companion skills

- `stateful-systems` — model the lifecycle first if it isn't pinned down
- `visual-explainer` — for single diagrams, single-page docs, and AI-generated illustration; defer to this skill when the explainer needs ≥6 tabs or a scenario simulator
- `breadboard` / `breadboarding` — affordance enumeration before building
