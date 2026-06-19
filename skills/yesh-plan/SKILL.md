---
name: yesh-plan
description: Use for /plan, converting finalized discussion into a concise implementation plan. Captures locked decisions, constraints, contract/failure/boundary changes, state changes, adapter audit results, call graph, chunks, files, and verification without reopening the design.
---

# Yesh Plan

Turn what was already discussed and finalized into an implementation-shaped plan.

## Workflow

1. Read the current conversation and any referenced notes/artifacts.
2. Extract decisions, constraints, rejected options, and unresolved questions.
3. Use prior `yesh-how` and `yesh-architect` outputs as inputs when available.
4. Run the handoff gate. If public API, persistence/schema migration, adapter/service shape, expected failure channel, or state ownership is not decided, say what is missing and return to `yesh-architect`.
5. Lay out only what will actually be added or changed.
6. Include code-shaped contract sketches where useful: boundary inputs, domain values, failure channels, state transitions, and dependency seams.
7. If prefactors were chosen during architecture, put them before behavior changes.
8. Keep chunks few and concrete, usually 3-5. Each chunk must name files/symbols, verification, and what not to touch.
9. Keep it complete enough to implement, not elaborate for its own sake.

## Output

````md
Decided
- ...

Handoff gate
- accepted architecture:
- decisions locked:
- unresolved gaps:
- return to architect if:

Out of scope
- ...

Repo conventions to preserve
- failures:
- boundary parsing:
- dependency seams / adapters:
- tests:

Contract changes
```txt
boundary input -> domain value -> result/failure
caller -> seam -> dependency
```

Adapter / service audit
- candidates checked:
- reuse / extend / new:
- ADR needed:

Boundaries
- entrypoint / caller:
- domain:
- state / persistence:
- runtime / external:
- tests:

State
- changes:
- unchanged:

Final call graph
Production:
...

Tests:
...

Implementation chunks
1. files/symbols:
   change:
   contract touched:
   boundary/schema touched:
   expected failures:
   state/persistence impact:
   verify:
   do-not-change:
   risk:

Verification matrix
- static:
- behavior:
- runtime:

Open risks / blockers
- ...
````

## Rules

- Do not restart research unless the plan has a real gap.
- Do not reopen architecture; only plan the chosen direction.
- If prefactors were chosen during architecture, place them before behavior changes.
- Each chunk must name files/symbols and verification.
- Do not add speculative nice-to-haves.
- Preserve the user's chosen shape even if another option is tempting; mention major risk tersely.
- Use one recommended sequence unless the user asked for options.
- Do not fill template slots with generic prose; write `unchanged`, `not applicable`, or omit optional sections.
- Every substantive bullet should name a file, symbol, boundary, invariant, type, command, or say `unknown`.
- Plan tests through real seams where possible. Avoid module mocks/spies unless the repo already uses them.
