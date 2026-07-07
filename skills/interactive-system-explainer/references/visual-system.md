# Visual System

Default aesthetic: **Engineering Manual**. It should feel like a printed, source-cited technical reference, not a webapp dashboard.

Physical scene: an engineer reads this on a high-DPI laptop in a quiet office, leaning back; the page should feel like an opened reference book and still look right when printed.

## Theme Mandate

- Ship `auto · light · dark` in the same file. Light values live in `:root`; dark values live in `[data-theme="dark"]` plus `prefers-color-scheme: dark`.
- Light-first is the default because source-cited explainers read like engineering references.
- The toggle persists to `localStorage` under a stable `<system-name>-theme` key; `auto` follows OS.
- Use the token block and boot script in `patterns.md` before writing components.

## Engineering Manual Doctrine

Lineage: Tufte, Ableton's *Learning Music*, Bartosz Ciechanowski, *The Art of Electronics*, Whole Earth Catalog, and makingsoftware.com.

Palette is three colors total:

```text
paper  cream     oklch(97.5% 0.012  80)
ink    charcoal  oklch(20%   0.015 270)
accent cobalt    oklch(50%   0.220 263)
```

Layer roles map to cobalt shades; vary lightness, stroke style, label weight, italics, and ALL-CAPS instead of hue. The single exception is desaturated brick red for true errors: `oklch(45% 0.140 25)`.

Dark variant: deep navy paper `oklch(15% 0.025 263)`, cream-white ink `oklch(94% 0.010 80)`, lifted/desaturated cobalt `oklch(70% 0.180 263)`. Dark depth comes from a 15/20/25 lightness ladder, never shadows.

## Typography

- Display: Departure Mono, title only, ALL-CAPS, cobalt, 48-64px, no negative tracking.
- Body: Source Serif 4, justified, hyphenated, 65-75ch measure, drop cap on first paragraph of each section, `text-wrap: pretty`.
- UI: IBM Plex Mono for tabs, citations, FIG numbers, metadata, tables, code, logs; ALL-CAPS labels at 11px with 5-10% letter-spacing.
- Fallback display: Press Start 2P when Departure Mono is unavailable.
- One family per role; three families max.
- Use a 5-size scale (`xs/sm/base/lg/xl`), `font-variant-numeric: tabular-nums`, `text-wrap: balance` on H1-H3, and `font-optical-sizing: auto` where supported.
- Forbidden body fonts: Inter, Roboto, Arial, Helvetica, `system-ui` alone.

## Diagram And Layout Vocabulary

- 1.5px cobalt strokes; solid for primary geometry, dashed `4 3` for hidden/projection/leader lines.
- Cobalt-tint fills only; graph-paper SVG backgrounds only inside diagram frames.
- Dashed leader lines with tiny arrowhead markers and ALL-CAPS mono labels.
- Vertical FIG marginalia (`FIG.001`) and bracket metadata in margins/corners.
- Use exploded axonometric views for composite/layered systems.
- Quiet 1px horizontal rules with a short cobalt lead-in; no dense ornaments.
- Sticky tabs are primary navigation. Optional compact section lists must stay under ~180px and not duplicate a full-viewport TOC.
- Running head in the top-right (`PROGRESS · SOURCE`, `V1.0`); generous book-page margins around 80px desktop.

## Discipline Rules

Match and refuse:

- No `box-shadow`.
- No `border-radius` greater than `0`.
- No gradients on text, backgrounds, or borders.
- No emoji; icons only as inline SVG in the same 1.5px cobalt vocabulary.
- No extra accent hues except brick red for true errors.
- No font families beyond display/body/ui.
- No glow, pulse, looping keyframes, or generic dashboard palette.

## Color Rules

- Use OKLCH for every color token; never hardcode `#000` or `#fff`.
- Avoid scattered alpha; define explicit `--surface-elev`, `--accent-bg`, and low-chroma `-bg` tokens. Reserve alpha for focus rings and `.changed` flash.
- Contrast minimums: body text 4.5:1, secondary text 4.5:1, UI/accent components 3:1, errors 4.5:1.
- Dark mode is not inverted light mode: lighter surfaces create depth, body weight drops to 350-450, accents desaturate 10-20%, line-height increases by 0.05-0.1, and borders become ~8% lighter than surfaces.

## Layer Meanings

```text
--c-external    external boundary: HTTP, webhooks, schedulers
--c-command     write seam / command / intent
--c-source      source-of-truth storage
--c-events      append-only events / history
--c-projection  read model / projection / cache
--c-api         API / UI surface
--c-error       error / denied / overflow
--c-skill       domain-specific accent
```

## Escape Hatches

Only deviate after writing the one-sentence physical scene that forces the choice.

- **Terminal Native** — deep navy-black paper, amber + green accents, monospace everywhere. For CLI tools, REPLs, debuggers.
- **Editorial Light** — warm white, terracotta + sage, transitional serif. For workflow/business systems where prose dominates.
- **Lab Notebook** — graph paper background, handwriting-adjacent serif for annotations, pencil greys. For experimental/scientific systems.

Do not invent a new aesthetic per explainer; pick this default or one listed escape hatch.
