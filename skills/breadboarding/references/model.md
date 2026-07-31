# Breadboard Model

Load this reference before creating or revising affordance tables.

## Places

A **Place** is a bounded context in which an actor has a particular set of available affordances. Use the blocking test for human interfaces: if the actor must dismiss, submit, or navigate before interacting with the prior context, model a new Place. A route, blocking modal, or screen-wide mode commonly qualifies; a tooltip or locally expanded section usually remains in its current Place.

For APIs, workers, and multi-application flows, a Place can represent the boundary in which a caller or runtime actor gains a new set of callable affordances. Label the system in the Place name.

| Pattern | Use |
| --- | --- |
| `P1: Records index` | Page or route |
| `P2: Record editor (edit mode)` | Whole-context mode |
| `P3: Confirm archive modal` | Blocking overlay |
| `P4: Records API (backend)` | Service boundary |
| `P1.1: Filters panel` | Subplace within P1 |

A subplace groups a meaningful region without implying navigation. A detached nested Place may be represented in its parent by a UI affordance whose name begins with `_`; that affordance wires to the detached Place.

## Elements

| ID | Element | Qualification |
| --- | --- | --- |
| `P…` | Place | Context with a bounded affordance set |
| `U…` | UI/boundary affordance | Something a human or caller can observe or act on |
| `N…` | Code affordance | Named handler, query, subscription, operation, or contract with meaningful identity |
| `S…` | Store | State written at one time or boundary and read at another |

A visual wrapper, one-off transform, or framework call is part of its owner unless exposing it explains a distinct trigger, effect, or state transition. Config can be an `N` when another affordance consumes it as an input. External state such as a URL, queue, clipboard, object store, or remote database is an `S` at the relevant boundary.

## Authoritative tables

### Places

| # | Place | Description |
| --- | --- | --- |
| P1 | Records index | Find and select records |
| P2 | Record detail | Inspect one record |
| P4 | Records API (backend) | Search persisted records |

### UI and boundary affordances

| ID | Place | Owner | UI affordance | Trigger | Wires Out | Returns To |
| --- | --- | --- | --- | --- | --- | --- |
| U1 | P1 | search form | query input | type | → N1 | — |
| U2 | P1 | results | result list | render | — | — |
| U3 | P1 | results | result row | select | → P2 | — |

### Code affordances

| ID | Place | Owner | Code affordance | Trigger | Wires Out | Returns To |
| --- | --- | --- | --- | --- | --- | --- |
| N1 | P1 | search form | `setQuery()` | call | → S1, N2 | — |
| N2 | P1 | records client | `searchRecords()` | call | → N3 | → S3 |
| N3 | P4 | records API | `GET /records` | request | → S2 | → N2 |

### Stores

| # | Place | Store | Description | Wires Out | Returns To |
| --- | --- | --- | --- | --- | --- |
| S1 | P1 | active query | Current query text | — | → N2 |
| S2 | P4 | records table | Searchable records | — | → N3 |
| S3 | P1 | result set | Latest matching records | — | → U2, U3 |

`Place` records containment. `Wires Out` records control: trigger, call, write, publish, or navigation. `Returns To` records data flowing from the row to its consumers. Keep direction consistent even when the visual diagram uses different line styles.

## Wiring rules

- Wire navigation to a Place (`N4 → P2`), because arrival makes the destination affordances available.
- Give every displayed or returned datum an incoming data edge from an `N` or `S`.
- Represent side effects by their destination store or boundary affordance; an operation that changes a URL wires to the URL store.
- Place a store with the context whose readers use it to enable behavior. Put it in a shared boundary only when multiple Places read it.
- Keep containment and wiring separate: membership in `P1` never implies an edge.
- Preserve control and data as separate traces even when one call carries both.

## Compression

Use a **chunk** when a subsystem has a clear entry, a clear result, and internals that obscure the main trace. Keep the chunk's internal tables separately and expose its boundary wires in the parent breadboard. A placeholder may acknowledge out-of-scope context but cannot satisfy a required edge.

## Verification matrix

| Subject | Required proof |
| --- | --- |
| Every `U` that displays data | An incoming return/read edge identifies its source |
| Every actionable `U` | Its control edge reaches a handler, contract, or destination Place |
| Every `N` | Wires Out, Returns To, or an explicitly modeled terminal boundary effect |
| Every `S` | A writer and a reader, or a documented external source/sink role |
| Every navigation edge | Destination is a `P` |
| Every affordance | Exactly one containing Place and one stable identifier |
| Existing-system rows | Concrete source, runtime, schema, or contract evidence |
| Complete workflow | Both the actor trace and data trace reach the declared outcome |
