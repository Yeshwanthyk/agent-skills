---
name: yesh-plan
description: Use for /plan, converting finalized discussion into a concise implementation plan. Captures decided contract changes, boundaries, state changes, call graph, chunks, files, and verification without reopening the whole design debate.
---

# Yesh Plan

Turn what was already discussed and finalized into an implementation-shaped plan.

## Workflow

1. Read the current conversation and any referenced notes/artifacts.
2. Extract decisions, constraints, rejected options, and unresolved questions.
3. Use prior `yesh-how` and `yesh-architect` outputs as inputs when available.
4. If the architecture is not decided, say what is missing and return to `yesh-architect`.
5. Lay out only what will actually be added or changed.
6. Include code-shaped contract sketches where useful.
7. If prefactors were chosen during architecture, put them before behavior changes.
8. Keep it complete enough to implement, not elaborate for its own sake.

## Output

````md
Decided
- ...

Inputs
- how:
- architect:
- user decisions:

Out of scope
- ...

Contract changes
```ts
type ...
interface ...
```

Boundaries
- entrypoint / caller:
- domain:
- state / persistence:
- runtime / external:
- tests:

File / symbol plan
- file: symbols / actual addition or change

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
   verify:
   risk:

Verification matrix
- unit:
- integration:
- manual/runtime:

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
