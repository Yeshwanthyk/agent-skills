# Mapping an Existing System

Use this branch to explain how a concrete effect happens now.

## Input contract

Start with one actor-shaped workflow, for example:

> An operator opens the records index, searches by email, selects a row, and sees the record detail.

For a non-UI system, name the caller, request or trigger, and observable response or side effect. Include all participating repositories or services in one board unless the user explicitly narrows the boundary.

## Trace procedure

1. Locate the real entry point: route, control handler, endpoint, command, message consumer, or scheduled trigger.
2. Walk the execution path and record each Place crossed.
3. Enumerate observable controls and outputs as `U` rows.
4. Resolve each control to its real handler or contract, then follow calls, publications, writes, and returns as `N` and `S` rows.
5. Scan call sites and incoming edges when tracing backward; account for every in-scope producer rather than following the familiar path from memory.
6. Add state that bridges time, boundaries, callbacks, rendering, retries, or later reads.
7. Record framework behavior only when it owns a meaningful edge that would otherwise be unexplained.
8. Attach concise file/symbol, schema, contract, trace, or runtime evidence to non-obvious rows and edges.
9. Run the model verification matrix, then reread the implementation along both the actor and data traces.

## Precision

Use implementation names such as `recordsRepo.search()` or `GET /records`; broad labels such as “database” or “service layer” hide the affordance that carries the behavior. Collapse private transforms into their caller when no independent actor, contract, state, or result can address them.

When the workflow crosses systems, label Place names with their system and retain transport affordances that explain the boundary. Treat externally visible messages, files, callbacks, and API responses as `U` rows even when no graphical interface exists.

## Completion

Mapping is complete when every row and edge needed for the declared effect resolves to evidence, alternate in-scope producers are accounted for, and a reader can trace both the actor path and each output's data provenance without guessing.
