---
name: interactive-system-explainer
description: Build source-grounded, self-contained interactive HTML explainers as inspectable models. Use when the requested deliverable is an interactive explainer, simulator, state or sequence walkthrough, interactive comparison, or visual review surface.
---

# Interactive System Explainer

Build an **inspectable model**: every interaction should reveal behavior grounded in the live implementation.

## Process

1. Trace the implementation, tests, runtime evidence, and source-of-truth state behind the behavior being explained.
2. Name the question the reader should answer through interaction.
3. Choose the smallest interaction that exposes the answer: scenario stepper, state transition, execution path, comparison, or selectable diagram.
4. Model entities, transitions, and scenarios as data consumed by a shared renderer.
5. Show source state and derived state as distinct concepts. Mark boundary crossings with their contract, owner, state change, failure behavior, and proof point.
6. Cite behavioral claims with file paths and line numbers.
7. Use neutral charcoal surfaces, restrained blue accents, system sans for prose, and Berkeley Mono with system monospace fallbacks for code, paths, hashes, and diffs.
8. Keep the HTML self-contained and preserve semantic controls, keyboard access, readable contrast, and reduced-motion behavior.
9. Save the artifact at the requested or clearly named workspace path, run the validator, open the page, and exercise its primary interaction.

## Supporting Files

- Use [`assets/starter.html`](assets/starter.html) as the base for scenario-driven explainers and as the visual-token reference for other forms.
- Run `python3 scripts/validate_explainer.py <path-to-html>` before delivery.

## Completion

Complete the explainer when its primary interaction faithfully exposes the target behavior from source truth, every behavioral claim is traceable, the validator passes, the interaction works in the rendered page, and the saved path is reported.
