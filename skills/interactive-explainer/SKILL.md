---
name: interactive-explainer
description: Build a source-grounded interactive HTML explanation of behavior or state. For a narrated, timeline-driven explainer or a video, use motion-explainer.
---

# Interactive Explainer

Build an **inspectable model**: every interaction should reveal behavior grounded in the live implementation.

## Process

1. Trace the implementation, tests, runtime evidence, and source-of-truth state behind the behavior being explained.
2. Name the reader, what they already know, and the question they should answer through interaction. Assume they do not know the domain words.
3. Choose the smallest interaction that exposes the answer: scenario stepper, state transition, execution path, comparison, or selectable diagram.
4. Model entities, transitions, and scenarios as data consumed by a shared renderer. Give every diagram, state machines included, at least one story named by its outcome.
5. Show source state and derived state as distinct concepts. Mark boundary crossings with their contract, owner, state change, failure behavior, and proof point. A component's inspector names its methods in call order with `file:line`, what it reads and writes, and what happens when it fails.
6. Cite behavioral claims with file paths and line numbers.
7. Use the requested visual direction when specified. Otherwise use the starter's systems look: near-black, monospace, hairline boxes joined by wires, amber for active, coral for failure, green for healthy, a packet labelled with its payload on each hop, and a callout on each derived or lagging state.
8. Keep the HTML self-contained and preserve semantic controls, keyboard access, readable contrast, and the interaction feel below.
9. Save the artifact at the requested or clearly named workspace path, run the validator, open the page, and exercise its primary interaction at the reader's real width plus a narrow and a wide one, in every theme.

Read [`references/reader-first.md`](references/reader-first.md) before building: it is the quality bar for headers, primers, stories, keys and layout. When the explainer is a multi-page site that grows over time, with shared issue and glossary registries, also read [`references/knowledge-base.md`](references/knowledge-base.md).

## Interaction feel

UI motion answers an input; story motion (a packet on a wire, a state change) is the explanation and keeps its own pace.

- Press: `:active { transform: scale(.97) }` on buttons and clickable cards.
- Hover: style it only inside `@media (hover: hover) and (pointer: fine)`; focus-visible gets the same cue.
- Transitions name exact properties (`transition: border-color 160ms, transform 160ms`), use a strong ease-out such as `cubic-bezier(.23, 1, .32, 1)`, and finish under 300 ms.
- Controls used in quick succession (step buttons, arrow keys, typing in a filter) get no transition of their own. The story step they trigger keeps its motion.
- `prefers-reduced-motion: reduce` lands every story step in its final state.

## Supporting Files

- Use [`assets/starter.html`](assets/starter.html) as the base for scenario-driven explainers and as the visual-token reference for other forms.
- When the explainer should play over time, with narration, a scrubber, or MP4 output, use [`../motion-explainer`](../motion-explainer/SKILL.md) instead. It shares this look and builds an HTML file you can edit.
- Run `python3 scripts/validate_explainer.py <path-to-html>` before delivery. Add `--allow-local-assets` for pages that share relative local CSS and JS.
- The validator catches common structural and dependency mistakes. It is not a complete network or accessibility check; exercise the rendered page too.

## Completion

Complete the explainer when its primary interaction faithfully exposes the target behavior from source truth, every behavioral claim is traceable, every reader-first item holds, the validator passes, the interaction works in the rendered page, and the saved path is reported.
