### Visual parity

**You own pixel-exact equivalence. The baseline is the spec; you do not touch it.** For "make X match Y exactly", styling-system migrations, porting a UI across frameworks. Equivalence is verified by image diff, not by eye.

1. Establish the baseline first, before any migration: a visual regression harness that screenshots the current component across its states, plus the target when matching two implementations. No baseline, no parity claim. A blocking prerequisite, not a follow-up.
2. Anti-shortcut clauses, stated and held: no harness modifications, no baseline tampering, no component restructuring to make a diff pass. If the baseline looks wrong, stop and ask, don't edit it.
3. Migrate one component at a time. Each is an independent artifact, so follow [`separate-before-serializing-shared-state`](../principles/separate-before-serializing-shared-state.md) and use one owner per component. Shared primitives migrate first as a blocking phase.
4. Verify each component against its baseline with image diff through the project verifier or current harness browser or UI tools. A nonzero diff is a fail. Investigate the pixel delta and repeat bounded edit-and-check iterations until it reaches zero. If no available tool can capture comparable images, report the missing capability and do not claim parity.
5. Run [Opening a PR](opening-a-pr.md) per component or safe batch.

## Completion

Each migrated component has a zero-diff result against its untouched baseline.

**Reply:** components migrated, the diff result for each, the baseline harness location, what's left.
