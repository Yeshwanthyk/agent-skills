# Slicing a Breadboard

Use this branch only after the full breadboard and selected shape are coherent.

A **vertical slice** is the smallest coherent set of affordances that produces a demonstrable boundary effect. Prefer visible UI; for APIs, workers, or automation, use an observable response, emitted artifact, or verifiable side effect available to the relevant actor. A schema-only, infrastructure-only, or layer-only increment is not vertical.

## Procedure

1. Name the smallest demonstration of the core mechanism.
2. Trace backward from that outcome through its required `U`, `N`, and `S` rows to the entry affordance. Assign that connected set to `V1`.
3. Add later capabilities as connected demonstrations, ordered by risk and learning value rather than architectural layer.
4. Assign each remaining affordance to the first slice whose demonstration needs it.
5. Keep edges to later slices in the full breadboard. Mark them as stubs or unavailable behavior in earlier slice views.
6. Produce a summary and an added-affordances table for each slice.
7. Check every slice against the selected shape and update shaping artifacts when the ordering exposes a missing mechanism or changed scope.

Keep at most nine slices in one shaped cycle. If more are needed, combine tightly coupled demonstrations or return to shaping and reduce the cycle.

## Summary

```markdown
| # | Slice | Shape parts | Affordances added | Demo |
| --- | --- | --- | --- | --- |
| V1 | Results from live data | B1, B3 | U2, N2, N3, S2, S3 | Search request returns and renders matching records |
| V2 | Editable query | B2 | U1, N1, S1 | Changing the query refreshes the result list |
```

For each slice, include only the rows introduced by that slice, while preserving original identifiers. The complete breadboard remains authoritative.

## Slice checks

Each slice must:

- have a reachable entry and an observable outcome;
- cut through every layer needed for that outcome;
- demonstrate meaningful progress against named shape parts;
- identify dependencies on prior slices and stubs for future slices;
- be internally coherent enough to verify independently; and
- introduce each assigned affordance exactly once.

The slice set is complete when all in-scope affordances are assigned, every selected shape part appears in one or more demonstrations, ordering dependencies are explicit, and each demo has a concrete verification path.
