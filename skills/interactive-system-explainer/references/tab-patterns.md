# Tab Patterns

Known-good ordering for rich systems: start broad, drill into mechanics, then deploy/compare/source. Add/remove tabs only when the source warrants it.

```text
01 Overview            — composition flow, key vocabulary
02 Workspace / files    — project layout the user actually touches
03 Composition flow     — clickable nodes with per-node code and citation
04 Models               — entity cards, fields grouped by role
05 State machine        — clickable states, legal transitions, reader-visible state
06 Turn / sequence      — multi-lane sequence player (HTTP -> server -> core -> provider)
07 History / data graph — append-only DAG with projection rules
08 Algorithm deep-dive  — token/budget meter + decision-point timeline
09 Scenarios            — simulator with pipeline, state, history, log, invariants
10 Deploy & dev         — build pipeline, runtime topology, watcher state machine
11 Vs / matrix          — side-by-side comparison with semantic cells
12 Source map           — every cited file with one-line description
```

Include a footer when appropriate: "scenarios are illustrative simulations of source-of-truth behavior, not live runs."

Use tabs for 6+ concepts. Avoid one long scroll page with many H2s.
