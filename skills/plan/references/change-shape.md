# Change shape

Use the branch that matches the work. Keep the branch's proof and sequencing in the plan.

## Feature

A feature adds or changes behavior.

1. Ground the affected subsystem with [`how`](../../how/SKILL.md).
2. Resolve the target architecture with [`../../architect/SKILL.md`](../../architect/SKILL.md), or record why the current shape is already settled.
3. Record a throughput checkpoint with blocking first steps, independent workstreams, shared mutable state, and the smallest safe decomposition. Keep an item with `n/a` and a reason when a dimension does not apply.
4. Name the domain structure before logic. Choose a state machine over scattered lifecycle booleans, a table or registry over spread branching, a typed model over repeated shape assumptions, or a reducer over ad hoc mutation when that structure fits the invariant.
5. Slice implementation into small vertical units. Each unit delivers observable behavior, names its files and symbols, and ends in a check before the next unit starts.
6. Verify on the matching surface. Unit checks do not replace live proof when the feature changes a real interaction.

The feature plan is complete when the data shape, blocking work, vertical slices, affected callers, proof boundary, and rollout are explicit.

## Refactoring

A refactoring changes structure while preserving behavior.

1. Ground the current subsystem with [`how`](../../how/SKILL.md).
2. Pin current behavior with a characterization test, snapshot, equivalence harness, or recorded replay before moving structure. Type checking and linting do not pin behavior.
3. Name the missing domain structure and the target shape. If the target crosses a boundary, resolve it with [`../../architect/SKILL.md`](../../architect/SKILL.md).
4. Subtract dead weight before adding the new shape. Remove dead code, one-caller wrappers, redundant validators, and orphan references when evidence supports removal.
5. Migrate every caller and remove the legacy API in the same wave. Do not leave an unproven compatibility shim or parallel path.
6. Move in small behavior-preserving units. Keep the pin green after every unit.
7. Prove equivalence on the real artifact with a replay, output diff, or matching-surface smoke run. Confirm that reader load is lower.

The refactoring plan is complete when the pinned contract, target shape, caller migration, subtraction, ordered moves, equivalence proof, and reader-load improvement are explicit. Any behavior change becomes a separate feature or bug-fix plan.
