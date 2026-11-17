# Sequence work into verifiable units

**Read when:** a sweep, migration, or run of similar edits; delivering a stack or multi-step result; staged delivery, replay, or work blocked on missing progress metadata.

- Order work into small units, each ending in a checkable state, and do not advance until the current unit is green. Each unit is a known-good start, one change, a check, then proceed.
- Never batch every edit and verify once at the end: a break caught at the unit that caused it is cheap to localize; a break caught after a batch is buried under later edits.
- Give each unit a completion criterion its executor can distinguish from incomplete: a state to reach, a check to pass, an artifact to produce.
- Spend effort on implementation and its validation before bookkeeping (progress markers, status files, dashboards); add bookkeeping only when the user or the delivery contract needs it.
- A missing progress marker does not invalidate working output. Replay a unit for changed inputs or dependencies, incompatible output, or an observed defect; otherwise reuse its verified result, and consume completed dependencies without waiting for unrelated work.
- Deliver in an order that proves the work: failing test first, then the fix; baseline capture before treatment; scaffold before feature.

**Limits:** keeping each unit's check real is [prove-it-works](prove-it-works.md); making the per-unit check cheap is [build-the-lever](build-the-lever.md).