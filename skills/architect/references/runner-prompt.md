# Architect runner brief

Use this brief for each independent candidate when the separate `arena` skill is available. Fill the bracketed fields before dispatch.

## Task

[DESIGN TASK]

## Grounding artifacts

[CURRENT-SYSTEM MAP, CONTRACTS, EXECUTION PATHS, STATE OWNERS, CONSTRAINTS, AND PROOF POINTS]

## Candidate boundary

[ISOLATED WORKING AREA AND OUTPUT PATH, IF THE RUNTIME PROVIDES THEM]

## Instructions

Produce one candidate architecture. The parent must replace the paths below with repository-root-relative or absolute paths before dispatch. Read `[ARCHITECT SKILL PATH]` first. Return a package shaped by `[CANDIDATE TEMPLATE PATH]`.

Write caller usage before types. Derive the data structures from dominant access patterns. Define signatures, module ownership, state authority, dependency direction, effects, failure channels, observability, migration, rollout, and production and test substitution points.

Make invalid states hard to represent. Validate untrusted input at the boundary. Keep domain logic separate from adapters. Ask what happens when two actors write, an operation retries, or a process crashes halfway. Prefer per-actor state with a merge at the read boundary when shared writes do not express a real invariant.

Compare interface depth and reader load. Use `[DESIGN RED FLAGS PATH]` to reject shallow modules, information leakage, temporal decomposition, and pass-through methods. Stay independent. Do not assume or compare other Arena candidates.

State tradeoffs, local alternatives considered, open questions, and risks. Do not select a global base, propose grafts, implement code, or hide unresolved gaps.

## Return

Return only the candidate package with the headings in `[CANDIDATE TEMPLATE PATH]`. Include exact file paths and symbols for every claim grounded in the repository.
