# Interaction Rules

## Motion

- Duration ladder: 100/300/500ms. Micro-feedback at 100-150ms, state changes at 200-300ms, layout reflows at 300-500ms.
- Default easing: `cubic-bezier(0.16, 1, 0.3, 1)`. No `ease`, bounce, or elastic.
- Animate only `transform`, `opacity`, and `filter`; never animate layout properties.
- `prefers-reduced-motion: reduce` collapses durations to `0.01ms`.
- The canonical useful animation is the `.changed` row flash: a ~1500ms tinted background on fields that just mutated.
- No animated glow, pulse, gradient text, or looping keyframes.

## Cognitive Load Gate Per Tab

- Four or fewer primary affordances in the active pane; move overflow into secondary groups, collapsibles, or another tab.
- One primary action per scenario step. `next` is loud; `play`, `reset`, and `prev` are quieter.
- Co-locate decision information: scenario picker, current state, history, log, and invariants should share the simulator pane when they inform one decision.
- Put raw JSON, full file lists, and exhaustive matrices behind `<details>` or click-to-expand.
- Squint test: one element must clearly read as primary. If everything has equal weight, demote secondary material.
- No memory bridge: a reader on tab 09 should not need to remember a value from tab 04; repeat the relevant context inline with a citation when needed.

## Affordance Rules

- Controls either mutate state, reveal a citation, filter a view, or navigate to a named tab.
- Scenario steps should visibly affect pipeline stage, state rows, history, log, or invariants.
- Side panels update from selected nodes/states/events; avoid static card grids when a clickable relation would teach the boundary better.
