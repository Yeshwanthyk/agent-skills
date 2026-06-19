---
name: yesh-architect
description: Use for /architect, architecture before implementation, crossing function/module/service boundaries, contract design, state ownership, adapter/service decisions, and future code shape. Produces terse pseudocode with boundary inputs, failure channels, state transitions, dependency seams, and final production/test call graphs.
---

# Yesh Architect

Shape future code before implementation. The plan should look like code-adjacent pseudocode, not prose-first project management.

## Workflow

1. Ground only as much as needed. Stay read-only unless the user separately asks for implementation.
2. For non-trivial existing systems, use subagents when available. Split research into focused lanes such as entrypoints/current flow, state/source of truth, runtime/external boundaries, and tests/change surface. If subagents are unavailable, run the same lanes locally.
3. Inspect current repo state and recent diffs when the architecture depends on active code, branch behavior, or recent changes.
4. Inspect local conventions before proposing new ones: errors, boundary parsing, dependency seams, adapters/services, tests, observability, dependency management, and framework idioms.
5. Identify the boundary being crossed: UI/API, domain, storage, runtime, external service, worker, CLI, test harness.
6. Audit existing adapters/services before creating new ones: reuse as-is through a narrow dependency shape, extend if cohesive, or create new only with a short rationale/ADR trigger.
7. Sketch the contracts first:
   - boundary inputs and domain values
   - interfaces/protocols/traits/ports
   - commands/events/results
   - expected failure channel
   - state/source of truth
   - lifecycle transitions and invariants
   - dependency composition
   - idempotency/concurrency when retries, queues, persistence, or shared state are involved
   - safe telemetry/redaction
8. Add final call graphs for production and tests. Show the substitution points.
9. Before implementation, look for small prefactors that would make the change easier. Keep them optional unless the main change is risky without them.
10. Keep the change surface minimal and derived from the contracts.

## Engineering Lens

- Preserve the repo's language/framework idioms.
- Model trust boundaries, domain values, expected failures, state transitions, and dependency seams explicitly.
- Make invalid states hard to represent in the local language.
- Prefer existing cohesive modules/adapters before adding abstractions.
- Verify real SDK/API/tool support before designing around it.
- Test through public behavior and real seams where practical.

## Output

````md
Goal
- ...

Code / file map
- read:
- risky boundaries:

Existing conventions / adapter audit
- errors:
- boundary parsing:
- dependency seams:
- tests:
- observability:
- adapters/services checked:
- reuse / extend / new:
- ADR needed:

Contracts
```txt
boundary input -> domain value -> result/failure
caller -> port/protocol/trait -> adapter
```

Contract completeness
- input boundary / parser:
- domain values:
- failure channel:
- state transitions / invariants:
- idempotency / concurrency:
- telemetry / redaction:

Boundaries
- caller:
- domain:
- persistence:
- runtime/external:
- tests:

State
- source of truth:
- changed:
- unchanged:

Final call graph
Production:
entrypoint
  -> service/domain
    -> dependency

Tests:
test
  -> seam/fake
    -> unit under test

Candidate change surface
1. files/symbols:
   change:
   reason:
   verify:

Risks / questions
- ...
````

## Rules

- Do not produce broad prose plans when a type/interface sketch would be clearer.
- Make illegal states hard to represent.
- Show prod/test wiring explicitly when dependencies are layered.
- If state does not change, say "state unchanged" instead of inventing state work.
- Synthesize subagent findings; do not paste raw research logs.
- Prefer affected files and source-of-truth changes over broad feature checklists.
- Prefer behavior-preserving prefactors: extract boundary, name state, isolate adapter, add type, split orchestration from IO.
- Do not propose broad cleanup. Only include prefactors that directly reduce implementation risk or complexity.
- Use one recommended path unless the user asked for alternatives.
- Every substantive bullet should name a file, symbol, boundary, invariant, type, command, or say `unknown`.
- Do not fill template slots with generic prose; write `unchanged`, `not applicable`, or omit optional sections.
- Verify real SDK/model/API support from docs/source/tool availability before designing around it.
- If a meaningful new adapter/service is proposed, include the reuse/extension audit and ADR trigger.
- Stop before coding unless the user asks to implement.
