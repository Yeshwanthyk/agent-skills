---
name: yesh-how
description: Use for /how, "how does this work", subsystem walkthroughs, ownership/layering questions, current mechanics, and pre-change understanding of existing code. Produces a terse current-system map with evidence, repo conventions, source-of-truth state, boundaries, and production/test call graphs. Use yesh-architect for future design.
---

# Yesh How

Explain the existing system. Stay read-only unless the user separately asks for changes.

## Workflow

1. Scope the subsystem from the user's words, recent context, files, screenshots, or logs. Assume and proceed; note the interpretation.
2. Inspect local conventions only as needed: errors, boundary parsing, dependency seams, module layout, tests, observability, and dependency style.
3. Find entrypoints, core types, state owners, storage/external boundaries, and test seams.
4. For broad systems, use subagents for distinct research lanes when available: entrypoints/current flow, state/source of truth, runtime/external boundaries, and tests/change surface. If unavailable, run the same lanes locally.
5. Trace real calls and data movement from trigger to effect. Prefer code paths over folder guesses.
6. Return a clean explanation, not an implementation plan.

## Output

```md
Summary
- ...

Evidence
- direct:
- inference:
- not found:

Map
- entrypoints:
- core:
- state / storage:
- boundaries:
- tests:
- conventions:

Flow
1. ...

Call graph
Production:
...

Tests:
...

State / invariants
- source of truth:
- lifecycle:
- invariants:

Gotchas / unknowns
- ...
```

Omit empty sections.

## Rules

- Answer "how it works now", not "what to build next".
- Include file paths and symbol names where useful.
- Keep prose tight. Favor maps, flows, and call graphs.
- Synthesize subagent findings; do not paste raw research logs.
- Name source-of-truth and lifecycle state explicitly.
- Distinguish evidence from inference when intent is unclear.
- Every substantive bullet should name a file, symbol, boundary, invariant, type, command, or say `unknown`.
- Do not add speculative platforms, fallback architectures, extra commands, adjacent cleanup, or design options.
- Report existing language/framework idioms; do not prescribe migrations unless asked.
- Do not propose target architecture, prefactors, likely changes, or implementation chunks; use `yesh-architect` or `yesh-plan`.
