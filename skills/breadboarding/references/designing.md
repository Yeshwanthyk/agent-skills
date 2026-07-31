# Designing from a Shape

Use this branch after a shape has been selected but before implementation slicing.

## Input contract

Collect:

- the requirement or outcome the selected shape must deliver;
- the selected shape and its mechanism parts;
- known Places and affordances in the current system; and
- flagged unknowns that can affect wiring.

Breadboard the existing and proposed affordances together when the mechanisms must interoperate.

## Translation procedure

1. List every selected shape part and the requirement cells it supports.
2. For each part, name the operator-visible controls or outputs (`U`), executable behavior (`N`), and durable or bridging state (`S`) required to make the mechanism real.
3. Assign each affordance to an existing or new Place. Apply the blocking test rather than mirroring the component tree.
4. Wire the intended control path from entry to outcome.
5. Wire every displayed or returned value from its source to its consumer.
6. Add the current-system affordances and contracts that the new mechanism calls, reads, writes, replaces, or navigates into.
7. Trace error, empty, loading, retry, and authorization behavior when those states change what the actor can observe or do.
8. Run the model verification matrix and map every shape part to at least one concrete row or edge.

## Feedback to shaping

A missing or speculative edge is evidence about the shape. Update the shaping artifacts when breadboarding reveals:

- a mechanism that cannot yet be named;
- a newly required store, contract, Place, or shared operation;
- a requirement the shape does not satisfy;
- duplicated behavior that should become one shared shape part; or
- a materially different scope than the selected part described.

Keep the uncertainty flagged until evidence supports the mechanism, then rerun affected fit cells.

## Completion

Detailing is complete when every selected part is represented by concrete affordances and wiring, every required outcome can be traced through the board, and all shape-changing discoveries have rippled back to the shaping documents.
