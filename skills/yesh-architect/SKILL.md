---
name: yesh-architect
description: Use for /architect, architecture before implementation, crossing function/module/service boundaries, type/interface design, state ownership, contract changes, and future code shape. Produces concise pseudocode made of types, interfaces, composition boundaries, and final production/test call graphs.
---

# Yesh Architect

Shape future code before implementation. The plan should look like code-adjacent pseudocode, not prose-first project management.

## Workflow

1. Ground only as much as needed. Stay read-only unless the user separately asks for implementation.
2. For non-trivial existing systems, use subagents when available. Split research into focused lanes such as entrypoints/current flow, state/source of truth, runtime/external boundaries, and tests/change surface. If subagents are unavailable, run the same lanes locally.
3. Inspect current repo state and recent diffs when the architecture depends on active code, branch behavior, or recent changes.
4. Identify the boundary being crossed: UI/API, domain, storage, runtime, external service, worker, CLI, test harness.
5. Sketch the contracts first:
   - types
   - interfaces/ports
   - commands/events/results
   - state/source of truth
   - dependency composition
6. Add final call graphs for production and tests. Show the substitution points.
7. Before implementation, look for small prefactors that would make the change easier. Keep them optional unless the main change is risky without them.
8. Keep the change surface minimal and derived from the contracts.

## Output

````md
Goal
- ...

Code / file map
- read:
- likely change:
- likely new:
- tests / fixtures:
- risky boundaries:

Types / contracts
```ts
type ...
interface ...
```

Boundaries
- caller:
- domain:
- persistence:
- runtime/external:
- tests:

State
- stored:
- derived:
- unchanged:

Current vs target
- current source of truth:
- target source of truth:
- behavior affected:

Prefactor opportunities
- option:
  - makes easier:
  - cost:
  - risk:
  - worth it if:
- skip if:

Final call graph
Production:
HTTP handler / job / command
  -> Service
    -> DomainCoordinator
      -> Store
      -> ExternalPort

Tests:
HTTP handler / job / command
  -> Service.memoryLayer
    -> DomainCoordinator
      -> Store.memory
      -> ExternalPort.fake

Candidate change surface
1. files/symbols:
   change:
   reason:

Verification
- ...

Discussion points
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
- Stop before coding unless the user asks to implement.
