# Embedded Review Workspace — Design System

## Intent

A reader-first local annotation tool closely aligned with Plannotator’s compact review workspace: restrained chrome, precise selection, contextual commenting, and paste-ready feedback.

## Visual Language

Use Plannotator’s navy/purple foundation and orange annotation semantics, adapted to a dependency-free vanilla TypeScript shell.

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--background` | `oklch(0.15 0.02 260)` | `oklch(0.97 0.005 260)` | Reader canvas |
| `--card` | `oklch(0.205 0.02 260)` | `oklch(1 0 0)` | Rails and top chrome |
| `--popover` | `oklch(0.255 0.025 260)` | `oklch(1 0 0)` | Comment composer |
| `--foreground` | `oklch(0.90 0.01 260)` | `oklch(0.18 0.02 260)` | Primary text |
| `--muted-foreground` | `oklch(0.69 0.02 260)` | `oklch(0.43 0.02 260)` | Metadata |
| `--border` | `oklch(0.35 0.02 260)` | `oklch(0.86 0.01 260)` | Panel separators |
| `--primary` | `oklch(0.75 0.18 280)` | `oklch(0.50 0.25 280)` | Primary action and active selection |
| `--annotation` | `oklch(0.70 0.20 60)` | `oklch(0.58 0.21 50)` | Saved comments |

Diff addition/deletion colors remain owned by pinned `@pierre/diffs` 1.2.8.

## Layout

- 48px global header: source identity left; Close, Copy feedback, annotation toggle, and shortcuts right.
- 192–240px Contents/Files rail.
- Flexible reader using a maximum 832px prose measure; diffs use the full center pane.
- 256–288px Annotations rail, collapsible and rendered as an overlay below 1088px.
- 40px reader toolbar aligned with the source and annotation panel headers.
- At narrow widths, rails leave the document flow and the reader becomes single-column.

The reviewed material remains the largest and highest-contrast surface. Empty rails stay visually quiet.

## Typography

- UI: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Code, paths, and anchors: `ui-monospace, SFMono-Regular, Consolas, monospace`.
- Prose: 16px / 1.65; diff: 13px / 1.55.
- Compact chrome: 10–13px with weight and contrast used deliberately.
- Disable code ligatures; use tabular numerals for line numbers and counts.
- Truncate only source paths and anchors; comments and inline annotations wrap fully.

## Annotation Loop

1. Select Markdown text or one-side Pierre diff lines.
2. Open a compact 384px composer anchored to the selection.
3. Add with Mod+Enter or the explicit Add Comment button.
4. Read the comment inline and in the annotations rail.
5. Edit, delete/undo, navigate, then copy deterministic Markdown.

The composer never becomes a bottom-wide modal on desktop. It remains inside the reader bounds and flips above the anchor when needed.

## Interaction

- Pointer selection and full keyboard operation are equivalent.
- Vi movement outside editable controls: `j/k`, `gg/G`, `h/l`, `n/N`, `a`, `e`, `d`, `y`, `?`, `Esc`.
- Standard Tab, arrows, Enter, Space, Escape, and Mod+Enter remain available.
- Never intercept shortcuts from editable controls.
- Selection always has a non-color outline or inset edge.
- Delete provides immediate Undo instead of confirmation.

## Motion and Accessibility

Use 150–180ms opacity/transform transitions only for transient surfaces. Respect reduced motion, coarse pointers, browser zoom, semantic controls, visible focus, and live status messages. Remote Markdown images and links remain inert inside the local workspace.

## Provenance

Visual and interaction patterns were adapted from `backnotprop/plannotator` at commit `0eda139cbec8a5187ee23c3c62df0fc1c8c18f70`, under MIT OR Apache-2.0. Bundled skills include the corresponding notice and license texts.
