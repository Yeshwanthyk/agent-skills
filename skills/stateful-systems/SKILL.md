---
name: stateful-systems
description: Model authority, transitions, concurrency, and recovery for a stateful design.
---

# Stateful Systems

Build the system model around **authoritative state**.

## Process

1. Find the source of truth and its owner.
2. Classify stored, derived, cached, projected, and displayed state.
3. Map each meaningful transition with trigger, actor, precondition, write, publication, replay, and recovery.
4. Define invariants and place each enforcement point at the boundary that owns it.
5. Trace the relevant concurrent transitions, retries, ordering, freshness, and lifecycle restoration through representative scenarios.
6. Shape commands around intent and reads around explicit freshness semantics.
7. Derive proportionate boundary tests from the transitions, invariants, races, replay, and recovery in scope. Use the testing handoff below when generated exploration would strengthen a specific claim.
8. Use [`references/formal-modeling.md`](references/formal-modeling.md) when critical or concurrent behavior remains ambiguous after the transition model.

## Testing handoff

For each selected claim, identify the invariant, real implementation entry point, inputs or operation sequences to generate, expected result, and harness controls such as clock, scheduler, or failure injection. Record this in the existing plan or test description.

- Use property-based testing for contracts spanning many values or transition sequences. Check invariants after meaningful operations; derive expected behavior from the contract or an independent reference model.
- Use coverage-guided fuzzing for malformed-input and parser boundaries. Identify expected rejection behavior and the crashes, unexpected errors, timeouts, or invariant violations that count as failures.
- Generated sequential operations establish sequence behavior. Claims about races require controlled interleavings or other concurrency evidence.

For implementation work, reuse the project's runner and generators, bound the exploration, and retain minimized failures with replay commands as regression evidence. Report the boundary exercised, run budget, outcome, and remaining limits. For planning work, provide this handoff without claiming execution. Finite exploration establishes only what was observed within the run.

## Output

Return the authoritative state, transition graph, invariant set, boundary contracts, representative scenarios, and proof strategy. Include implementation and rollout shape when the request covers delivery.

## Completion

Complete the model when every relevant transition has an owner and proof, every invariant has an enforcement point, and concurrency, freshness, replay, and recovery have evidence-backed behavior.
