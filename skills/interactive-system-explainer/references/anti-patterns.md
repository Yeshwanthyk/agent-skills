# Anti-patterns

Each entry: bad pattern → why it fails → cure.

## Decorative controls

- **Bad:** A "theme toggle" button that switches no real state. A "filter" dropdown whose options all show identical data.
- **Why:** Trains the user to ignore controls. Erodes trust in everything else.
- **Cure:** Delete it. Or rebind it to a real filter (active stage, scenario step range, log-event kind).

## One scrolling page when there are 6+ concepts

- **Bad:** A 5000-line single page with 12 H2 sections.
- **Why:** Loses the reader; impossible to deep-link; nothing fits on screen.
- **Cure:** Tabs at the top, one `section.tab` per concept. Sticky tab nav. Switch resets scroll.

## Hard-coded scenario branches

- **Bad:** `if (currentScn.id === 'overflow') { state.contextTokens = 188000; }` inside `nextStep()`.
- **Why:** Adding a scenario means touching the renderer. The simulator stops being declarative.
- **Cure:** Pull every scenario-specific value into the scenario's `step.patch` or step-level fields. Renderer only knows about the schema, never the ids.

## Mixing source-of-truth with derived state

- **Bad:** A single panel labeled "session" showing both `entries[]` and the projected LLM context.
- **Why:** The whole point of the explainer is teaching the reader that derived state is *derived*. Conflating them defeats the lesson.
- **Cure:** Two distinct panels: "history entries (SessionData)" and "projected context". Clicking an entry highlights its projection rule.

## Mutating events / history

- **Bad:** A button that "edits" an event in the log.
- **Why:** Events are append-only by definition. Edit-in-place teaches the wrong mental model.
- **Cure:** Append a corrective event. Or, if the system actually rewinds (e.g., `removeLeafMessage` on overflow), implement that as a real `history.pop` step in the relevant scenario — and explicitly call out that this is the only place rewind happens.

## Inventing transitions / fields

- **Bad:** Adding "ok / approved / rejected" states to a state machine because it "feels right" — without finding them in source.
- **Why:** Users will trust the diagram and look for the named state in code. When it's not there, they lose trust in everything.
- **Cure:** Read code first. Cite every transition. If a state is unclear, mark it "(inferred)" or stop and ask. Never paper over uncertainty.

## Claims without citations

- **Bad:** "After the third retry, the session enters degraded mode."
- **Why:** Unverifiable. Could be wrong. Reader can't check.
- **Cure:** `<a class="cite">session.ts:735–849</a>` after every behavioral claim. Even one citation per paragraph is enough to ground the prose.

## Skipping validation

- **Bad:** Author the page, eyeball it, declare done.
- **Why:** Mismatched braces silently break interactions. Off-by-one tab counts hide whole sections. Missing `</script>` tags mangle everything below.
- **Cure:** The four-step ritual in `validation.md`. Always.

## One giant Mermaid diagram

- **Bad:** 22-node `graph TD` covering the entire architecture in one Mermaid block.
- **Why:** Renders microscopic. Even with zoom controls the labels are unreadable and edges crisscross.
- **Cure:** Either a custom CSS-grid card layout with hand-routed flow arrows, or a hybrid (small Mermaid overview + detailed cards beneath). For 15+ entities, never single-Mermaid.

## Emoji icons in section headers

- **Bad:** `## 🚀 Deployment` `## ⚙️ Configuration`.
- **Why:** Inconsistent rendering across platforms. AI-template signal. Ages badly.
- **Cure:** Numbered sections (`## 03 Deployment`), or styled monospace labels with semantic colored dots. Custom SVG icons if a glyph really helps.

## Placeholder copy

- **Bad:** "Lorem ipsum", "TODO: explain this", "etc.", "and more".
- **Why:** Either explain or omit.
- **Cure:** If you don't know enough to write a sentence, the section shouldn't exist yet.

## Glow / pulse / gradient text

- **Bad:** `background: linear-gradient(...); -webkit-background-clip: text;` on every heading. Animated `box-shadow` glow on cards.
- **Why:** Top of the AI-slop visual signal list. Looks like a generic dashboard, not a deliberate technical document.
- **Cure:** Solid colored ink for headings. Static borders for cards. Use motion only when state actually changed (the `.changed` flash on a row that just updated).

## Generic AI dashboard palette

- **Bad:** Inter font + indigo `#8b5cf6` + cyan `#06b6d4` + magenta `#d946ef` on dark.
- **Why:** Every Tailwind / Vercel template starter. Zero design intent.
- **Cure:** Pick a constrained aesthetic (Blueprint, Editorial, Paper/ink, Nord, Catppuccin, Solarized). Vary across explainers — light technical, dark editorial, paper-ink for next.

## Unstructured event log

- **Bad:** `console.log` style entries dumped as plain text, no timestamps, no categorisation.
- **Why:** Looks like debug output, reads like noise.
- **Cure:** Three columns — timestamp, type tag, message. Class-based colour by event kind (`evt-text`, `evt-tool`, `evt-comp`, `evt-end`, `evt-err`). The log becomes legible at a glance.

## State panel that doesn't flash on change

- **Bad:** A static `<pre>JSON.stringify(state)</pre>` that updates silently between steps.
- **Why:** The reader has to diff in their head. They miss small changes.
- **Cure:** Row-level rendering with a `.changed` class that flashes for ~1.5s after `applyPatch`. The user *sees* what each step did.

## Scenario simulator with no recovery scenarios

- **Bad:** Six happy paths and no failure / retry / overflow scenario.
- **Why:** Real systems are mostly defined by how they handle the unhappy path. If the explainer never shows recovery, it's a brochure.
- **Cure:** At least one scenario per category in `scenario-schema.md`. Recovery is the highest-value teaching moment.

## Comparison matrix without a "when to pick which" paragraph

- **Bad:** Big yes/no/partial table, end of section.
- **Why:** The table tells you the differences but not the decision.
- **Cure:** Close every comparison with a 2–3 bullet "when to use X vs Y" — the table is the evidence, the bullets are the call.

## Missing source map

- **Bad:** Page cites `session.ts:175` four times but never lists `session.ts` anywhere else.
- **Why:** No way to verify, no way to navigate, no map of what was inspected.
- **Cure:** Final tab: source map with every cited file and a one-line description. Grounds the whole document.

## Light-mode-only or dark-mode-only

- **Bad:** Page hardcodes a dark palette, looks fine on the author's monitor, lands as illegible black-on-black on a light-mode reader's machine. Or vice versa.
- **Why:** Explainers are shareable. The author has no idea what mode the reader is in. Shipping one mode is a 50% failure rate.
- **Cure:** Mandatory dual-mode tokens (see `patterns.md` → "Theme tokens"). Three-state `auto · light · dark` toggle in the header. Validate in all three states.

## Inverted-light dark mode

- **Bad:** Same shadows, same accent saturation, just "dark colors". Cards have black drop-shadows on dark backgrounds (invisible). Accents are the same OKLCH chroma as light mode and feel garish.
- **Why:** Dark mode requires different rules — depth via lightness ladder, accents desaturated 10–20%, body weight one notch lighter.
- **Cure:** Don't reuse the light tokens. Define a separate dark block. Lightness-based depth (15% / 20% / 25% surface scale). Drop body weight to ~380. Add 0.012em letter-spacing. Reduce accent chroma.

## Pure black or pure white surfaces

- **Bad:** `background: #000` or `#fff` anywhere.
- **Why:** No real surface is `#000`. Pure values look lifeless next to colored layers and sit wrong against tinted neutrals.
- **Cure:** `oklch(15% 0.005 <hue>)` minimum dark. `oklch(98.5% 0.005 <hue>)` light. Tint the neutral toward the dominant accent hue with chroma 0.005–0.015.

## Hardcoded hex outside the theme block

- **Bad:** `color: #4a90e2;` `stroke="#666"` scattered through the SVG.
- **Why:** Cannot theme. Cannot audit contrast. Vanishes in the opposite mode.
- **Cure:** Every color goes through a semantic token. SVG strokes use `stroke="var(--ink-dim)"` or `currentColor`. The only place hex appears is inside `:root` and `[data-theme="dark"]`.

## Missing theme toggle

- **Bad:** Page respects `prefers-color-scheme` only. Users on a system stuck in one mode (corporate machines, e-readers, mismatched monitors) can never see the other.
- **Why:** The explainer is a document; a reader should be able to choose how to read it.
- **Cure:** Three-state segmented control (`auto · light · dark`) in the header. Persist to `localStorage`. Inline boot script in `<head>` to avoid flash of wrong theme.

## Ad-hoc aesthetic improvisation

- **Bad:** Inventing a fresh palette, font pairing, and visual language for every explainer. "This one feels Stripe-ish, this one feels Linear-ish, this one is sort of Notion."
- **Why:** The output ends up generic AI-dashboard regardless of intent. Strong opinions produce strong work; weak opinions produce slop.
- **Cure:** Engineering Manual is the default. Deviate only via the escape hatch (Terminal Native, Editorial Light, Lab Notebook) and only after writing the one-sentence physical scene that forces the change. Never blend two aesthetics.

## Default-blueprint without engineering-manual discipline

- **Bad:** "Blueprint" aesthetic implemented as `body { background: #0a1929; }` plus some teal lines and called done. Multiple accent hues, drop shadows, rounded cards, Inter for everything, no marginalia, no graph paper, no leader lines, no FIG numbers.
- **Why:** Looks like every other dark dashboard. Misses the entire point of the reference-book lineage — the **discipline** is the aesthetic, not the color choice.
- **Cure:** If you commit to Engineering Manual, ship the full vocabulary: cobalt-only accent, Departure Mono + Source Serif 4 + IBM Plex Mono, dashed leader lines on every diagram, FIG numbering in vertical marginalia, graph-paper backgrounds, dot-leader TOC, hatched dividers, drop caps. Half-doing it is worse than not doing it.

## Shadows or rounded corners on Engineering Manual

- **Bad:** `box-shadow: 0 4px 12px rgba(0,0,0,0.1)` on a card. `border-radius: 8px` on a diagram frame. `border-radius: 6px` on the tab buttons.
- **Why:** The aesthetic reads as **printed**. Print has no blur, no soft corners. The moment a shadow appears, the page becomes "webapp" again.
- **Cure:** Match-and-refuse. Search the file for `box-shadow` and `border-radius` before declaring done. Both should be zero matches outside maybe a 4px radius on the segmented theme toggle. Depth comes from rule lines and lightness shifts.

## Inter / Roboto / system-ui body on Engineering Manual

- **Bad:** `font-family: 'Inter', sans-serif` for the body. Or letting `system-ui` win because the load chain failed.
- **Why:** Inter, Roboto, and system-ui are AI-slop signals. They're invisible to the author but deeply familiar to readers — they read as "another dashboard".
- **Cure:** Source Serif 4 for body, IBM Plex Mono for UI labels, Departure Mono for the title. All three free and OFL. Validate by inspecting the rendered page; the body must read as a serif.

## More than one accent hue

- **Bad:** Cobalt for primary, plus orange for source-of-truth, plus green for OK, plus pink for skill, plus purple for events. Five hues across the palette.
- **Why:** The makingsoftware aesthetic survives on one-accent-only discipline. Multiple hues collapse it back into a generic palette.
- **Cure:** Use the cobalt accent everywhere. Differentiate layers by **stroke style** (solid vs dashed), **label weight**, **ALL-CAPS vs sentence case**, **lightness of accent tint**. The single permitted exception is `--bad` for true error states (desaturated brick red).

## Graph-paper background on a non-diagram surface

- **Bad:** Page-wide graph paper background, or graph paper behind body text.
- **Why:** Graph paper signals "diagram frame". Putting it everywhere kills the signal.
- **Cure:** Graph paper only inside `.fig` frames or explicit diagram containers. Body text sits on cream paper with no pattern.

## Server still running on exit

- **Bad:** `python3 -m http.server` left in foreground; the agent hangs.
- **Why:** Blocks the conversation.
- **Cure:** Background it (`&`) and reuse the same port if already serving the directory. Check with `lsof -i :PORT` first.
