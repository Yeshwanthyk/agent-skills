# Test Matrix

Select boundary tests relevant to the lifecycle.

```text
State/transition:
- allowed transitions
- invalid transitions
- terminal states
- derived states

Command:
- happy path
- invariant violation
- actor/tenant violation
- duplicate/idempotent intent

Event/history:
- typed parse/dump
- missing required fields
- stream/version ordering
- idempotency key
- source/actor requirements

Projection/read model:
- source state -> output rows
- stale row pruning
- non-projectable source state
- versioned behavior
- rerun idempotency

Freshness:
- cache invalidation after commit
- read-after-write behavior
- stale read fallback if applicable

Task/job:
- no-op
- qualifies
- no longer qualifies after lock
- already-handled skip
- rerun
- concurrent run if relevant
- per-row failure isolation

Backfill:
- dry-run no persistence
- apply persists through domain command
- targeted run
- existing-state skip
- invalid args/config

API/UI:
- exposes intentional domain contract
- denial/hidden states behave intentionally
- next actions/effective dates/previews are correct
```
