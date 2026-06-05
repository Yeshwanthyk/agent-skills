---
name: yesh-how
description: Use for /how, "how does this work", subsystem walkthroughs, ownership/layering questions, and pre-change understanding of existing code. Produces a concise current-system map with key files, flow, boundaries, and production/test call graphs when useful. Use yesh-architect for future design.
---

# Yesh How

Explain the existing system. Stay read-only unless the user separately asks for changes.

## Workflow

1. Scope the subsystem from the user's words, recent context, files, screenshots, or logs. Assume and proceed; note the interpretation.
2. Find entrypoints, core types, state owners, storage/external boundaries, and test seams.
3. For broad systems, use subagents for distinct research lanes when available: entrypoints/current flow, state/source of truth, runtime/external boundaries, and tests/change surface. If unavailable, run the same lanes locally.
4. Trace real calls and data movement from trigger to effect. Prefer code paths over folder guesses.
5. Return a clean explanation, not an implementation plan.

## Output

Use only sections that help.

```md
Summary
- ...

Code / file map
- entrypoints:
- core files:
- state / storage:
- runtime / external:
- tests / fixtures:

Current flow
1. ...

Call stacks
Production:
entrypoint
  -> service
    -> dependency

Tests:
test
  -> seam / fake
    -> unit under test

State
- source of truth:
- stored:
- derived:
- transient:
- unchanged:

Boundaries
- UI/API:
- domain:
- storage:
- external/runtime:

Test seams
- ...

Gotchas
- ...

Unknowns
- ...
```

## Rules

- Answer "how it works now", not "what to build next".
- Include file paths and symbol names where useful.
- Keep prose tight. Favor maps, flows, and call graphs.
- Synthesize subagent findings; do not paste raw research logs.
- Name source-of-truth and lifecycle state explicitly.
- Distinguish evidence from inference when intent is unclear.
- Do not propose target architecture, prefactors, likely changes, or implementation chunks; use `yesh-architect` or `yesh-plan`.
- If the user asks "why", switch to rationale/evidence mode instead of inferring intent from code shape.
