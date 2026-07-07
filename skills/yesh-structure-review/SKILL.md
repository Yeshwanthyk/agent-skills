---
name: yesh-structure-review
description: Use for /structure, "structure pass", "cleanup pass", post-feature structure review after behavior already works. Reviews recently completed work for stronger underlying structures — state machines over scattered booleans, typed objects over loose parameters, registries/lookup tables, reducers/command-event models, queues/caches/indexes/graphs/trees — and produces act-now/defer/leave findings. Behavior-preserving only; never during initial implementation.
---

# Yesh Structure Review

The feature works; now the shape is visible. Find where a stronger structure would make the next change safer. Do not over-architect: only propose structures the current code is already straining toward.

## Workflow

1. Establish the review surface: recent diff, branch, or named files/subsystem. Confirm behavior is verified (tests/harness/manual). If behavior is unverified, stop and say so — this pass assumes working code.
2. Read the changed code plus its immediate callers/callees. Note existing repo idioms; a structure that fights local convention is a downgrade.
3. Scan for structural strain signals:
   - scattered booleans / flag combinations that encode implicit states → state machine or discriminated union
   - loose positional/optional parameters threaded through layers → typed object/command
   - repeated if/else or switch dispatch on the same key → lookup table / registry
   - mutation scattered across handlers → reducer or command-event model
   - hand-rolled scans, recomputes, or ad-hoc ordering → queue, cache, index, graph, tree, or proper collection
   - the same predicate/rule written twice in different renderers (SQL + code, UI + validator) → single registry with per-target renderers
4. For each candidate, weigh: churn history of the file, whether tests cover the behavior, and real future-change pressure. No pressure, no finding.
5. Classify every finding: `act-now` (small, behavior-preserving, tests exist or trivial to add), `defer` (worth it, needs its own slice), `leave` (structure would be speculative).
6. For `act-now` items, sketch the target shape as terse pseudocode/types, not prose.
7. Stop. Hand `act-now` items to `yesh-ship` (or the user) for implementation; do not edit unless asked.

## Output

```md
Surface
- diff/files reviewed:
- behavior verified by:

Findings
1. file:line — strain signal → proposed structure
   class: act-now | defer | leave
   pressure: why the next change gets harder without it
   tests: existing | needed
   shape:
   ```txt
   type/state sketch
   ```

Not worth structuring
- file: why left alone

Next
- act-now slices in suggested order
```

## Rules

- Behavior-preserving only. If a proposal changes observable behavior, it is out of scope.
- Only propose structures with named, current pressure — no speculative platforms, no "while we're here".
- Respect repo idioms; reuse existing registries/reducers/state types before inventing new ones.
- Every finding names file:line and the concrete strain signal, or it is cut.
- Prefer one strong finding over five weak ones. `No findings` is a valid result.
- Do not run during initial implementation; this pass exists because the shape was unknowable upfront.
- Do not edit files unless the user asks after seeing findings.
