---
name: interactive-system-explainer
description: Generate polished self-contained HTML explainers for technical systems with tabs, multi-lane sequence players, state machines, history DAGs, resource meters, scenario simulators, comparison matrices, source citations, invariant checks, visual architecture explainers, interactive walkthroughs, multi-section technical explainers, shareable HTML artifacts, and deep system understanding.
---

# Interactive System Explainer

Build shareable, self-contained HTML pages that explain non-trivial existing systems through interaction. Use this for visualizing source-grounded behavior across boundaries, state, lifecycle, algorithms, deployment, and scenarios. Do not design the system here; if lifecycle behavior is unclear, model it first with `stateful-systems`, then return here to render it.

## When to use

- Visual architecture explainer, interactive HTML walkthrough, or multi-section technical explainer.
- Scenario simulator; state-machine, data-flow, sequence, DAG, meter, matrix, invariant, or source-map visualization.
- Engineer/PM/stakeholder system map; exportable `/tmp/<name>-explainer.html` or `~/Downloads/<name>-explainer.html`.
- Tabs are warranted: 8+ concepts, multiple specialized diagrams, repeated scenarios with shared context, side-by-side systems, or structurally distinct ops/deploy views.

## When not to use

- Marketing pages, generic dashboards, prose-only docs, or a single diagram.
- Systems whose lifecycle/source behavior is not pinned down; model or inspect first.

## Hard rules

1. Source-of-truth state and derived state must be visually separated.
2. Every control must reveal or mutate meaningful state, cite/filter a view, or be deleted.
3. Scenarios are data, never hard-coded renderer branches.
4. Every behavior claim cites a real file:line.
5. Both light and dark themes ship in the same file; neither is optional.
6. Validate before done: extracted JS `node --check`, balance checks, served `curl`, and visual checks in both themes.

## Workflow

1. **Discover** — read source/tests/docs/traces. Read `references/discovery-packet.md`; fill only evidence-backed fields. Inspect more rather than guess.
2. **Outline tabs** — read `references/tab-patterns.md`; choose only matching tabs. Aim for 6-12 tabs.
3. **Breadboard affordances** — list each tab's controls and data read/mutated; reject decoration.
4. **Choose visual system** — Engineering Manual is light-first default. Read `references/visual-system.md`; deviate only with a forcing one-sentence scene.
5. **Implement one HTML file** — inline HTML/CSS/JS; no bundler/npm/CDN unless approved. Read `references/patterns.md`; for simulators also read `references/scenario-schema.md`.
6. **Polish interaction** — read `references/interaction-rules.md` for motion, affordance, cognitive-load, and reduced-motion gates.
7. **Validate** — read `references/validation.md`; run syntax, structure, HTTP, visual, and theme checks.
8. **Report** — path, URL, tabs, scenarios, assumptions, validation evidence.

## Page Skeleton

- `<!doctype html>` with metadata, theme boot script, and all CSS in `<head>`.
- `body`: header with title, summary, audience, legend, and `auto · light · dark` toggle.
- Sticky `nav.tabs`, one `section.tab` per concept, and a footer disclaimer when scenarios are illustrative simulations.
- Final source-map tab lists every cited file with a one-line description.

## Output

Default path: `/tmp/<system-name>-explainer.html`; copy to `~/Downloads/<system-name>-explainer.html` only when asked to share/export. Final report:

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

## References

| Read | Trigger |
|---|---|
| `references/discovery-packet.md` | During discovery, fill only source-supported fields. |
| `references/tab-patterns.md` | Before outlining tabs, choose only tabs that match the system. |
| `references/visual-system.md` | Before styling, read it; if using Engineering Manual, follow it unless a one-sentence physical scene justifies an allowed escape hatch. |
| `references/patterns.md` | Before implementing diagrams/simulators, read it for tabs, flows, state machines, sequences, DAGs, meters, matrices, citations, and source maps. |
| `references/scenario-schema.md` | Before building a simulator, read it; scenarios stay data-only and renderer branches only on schema. |
| `references/interaction-rules.md` | Before final UI polish, apply motion, affordance, cognitive-load, and reduced-motion gates. |
| `references/validation.md` | Before done, run syntax, structure, HTTP, visual, and theme checks. |
| `references/authoring-strategy.md` | If >~1000 lines or 6 tabs, build/validate in chunks. |
| `references/anti-patterns.md` | During review, remove any listed failure. |

## Companion skills

- `stateful-systems` — model lifecycle first when behavior is not pinned down.
- `visual-explainer` — use for single diagrams or simple one-page docs; use this skill for >=6 tabs or scenario simulators.
- `breadboard` / `breadboarding` — use for affordance enumeration before building.
