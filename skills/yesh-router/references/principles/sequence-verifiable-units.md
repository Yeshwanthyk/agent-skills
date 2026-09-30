# Sequence work into verifiable units

**Read when:** a sweep, migration, or run of similar edits; delivering a stack or multi-step result.

- Order work into small units, each ending in a checkable state, and do not advance until the current unit is green. Each unit is a known-good start, one change, a check, then proceed.
- Never batch every edit and verify once at the end: a break caught at the unit that caused it is cheap to localize; a break caught after a batch is buried under later edits.
- Give each unit a completion criterion its executor can distinguish from incomplete: a state to reach, a check to pass, an artifact to produce.
- Deliver in an order that proves the work: failing test first, then the fix; baseline capture before treatment; scaffold before feature.

**Limits:** keeping each unit's check real is [prove-it-works](prove-it-works.md); making the per-unit check cheap is [build-the-lever](build-the-lever.md).