---
name: yesh-how
description: Use for /how, "how does this work", "map X end to end", "trace the flow/lifecycle", "list every registered X", inventory of an interface/command/tool surface, data-model dumps, subsystem walkthroughs, ownership/layering questions, and pre-change understanding. Produces a terse current-system map with evidence, call graphs, interface inventories, and optional Mermaid diagrams. Use yesh-architect for future design.
---

# Yesh How

Explain the existing system. Stay read-only unless the user separately asks for changes.

## Modes

- **map** (default): subsystem summary, boundaries, flow, call graph.
- **trace**: one trigger -> effect path in depth: ordered call stack with file:line, data shape at each hop, state writes, failure exits.
- **inventory**: enumerate a surface completely: every registered command/tool/bucket/handler/route/event; id, symbol, signature, file:line, what it computes, callers.
- **contrast**: two flows side by side, such as provider A vs B: same columns, divergences called out explicitly.

Pick from the user's words; state the chosen mode in the first line.

## Workflow

1. Scope the subsystem from the user's words, recent context, files, screenshots, or logs. Assume and proceed; note the interpretation.
2. Inspect local conventions only as needed: errors, boundary parsing, dependency seams, module layout, tests, observability, and dependency style.
3. Find entrypoints, core types, state owners, storage/external boundaries, and test seams.
4. Extract signatures and call sites mechanically before reading whole files:
   - `ast-grep --lang <lang> -p '<pattern>'` for definitions, call sites, exported interfaces, registry entries.
   - `rg -n` for strings, routes, and event names; LSP or compiler tooling (`tsc --noEmit --listFiles`-adjacent, `go doc`, `cargo doc --no-deps`) when signatures matter more than bodies.
   - Read full files only for the hops that carry logic.
5. For broad systems, use subagents for distinct research lanes when available: entrypoints/current flow, state/source of truth, runtime/external boundaries, and tests/change surface. If unavailable, run the same lanes locally.
6. For map, trace, and contrast modes, trace real calls and data movement from trigger to effect. For inventory mode, enumerate the registered surface mechanically. Prefer code paths over folder guesses.
7. Return a clean explanation, not an implementation plan.

## Output

````md
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

Trace
| # | symbol | file:line | in -> out | state touched | failure exit |
|---|---|---|---|---|---|
| 1 | ... | ... | ... | ... | ... |

Inventory
| id | symbol + signature | file:line | does | callers |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

Diagram
```mermaid
...
```

State / invariants
- source of truth:
- lifecycle:
- invariants:

Gotchas / unknowns
- ...
````

Omit empty sections. For map mode, keep the map, flow, and call graph compact. For trace mode, use the trace table per hop. For inventory mode, use the inventory table per entry. For contrast mode, use the same columns on both sides and call out divergences explicitly.

When the user says show, diagram, or nicely, add Mermaid: `sequenceDiagram` for traces, `flowchart` for maps. Only suggest `interactive-system-explainer` when the user asks for a shareable or interactive artifact.

## Rules

- Answer "how it works now", not "what to build next".
- Include file paths and symbol names where useful.
- Keep prose tight. Favor maps, flows, and call graphs.
- Synthesize subagent findings; do not paste raw research logs.
- Name source-of-truth and lifecycle state explicitly.
- Distinguish evidence from inference when intent is unclear.
- Every substantive bullet should name a file, symbol, boundary, invariant, type, command, or say `unknown`.
- Inventories are complete or say what was excluded and why. Never sample silently.
- Do not add speculative platforms, fallback architectures, extra commands, adjacent cleanup, or design options.
- Report existing language/framework idioms; do not prescribe migrations unless asked.
- Do not propose target architecture, prefactors, likely changes, or implementation chunks; use `yesh-architect` or `yesh-plan`.
