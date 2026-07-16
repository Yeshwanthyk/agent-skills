---
name: stateful-systems
description: Model authoritative state, lifecycle transitions, invariants, freshness, concurrency, replay, and recovery. Use when the task centers on correctness across persisted state, lifecycle transitions, or multiple actors.
---

# Stateful Systems

Build the system model around **authoritative state**.

## Process

1. Find the source of truth and its owner.
2. Classify stored, derived, cached, projected, and displayed state.
3. Map each meaningful transition with trigger, actor, precondition, write, publication, replay, and recovery.
4. Define invariants and place each enforcement point at the boundary that owns it.
5. Trace concurrent transitions, retries, ordering, freshness, and lifecycle restoration through representative scenarios.
6. Shape commands around intent and reads around explicit freshness semantics.
7. Derive boundary tests from transitions, invariants, races, replay, and recovery.
8. Use [`references/formal-modeling.md`](references/formal-modeling.md) when critical or concurrent behavior remains ambiguous after the transition model.

## Output

Return the authoritative state, transition graph, invariant set, boundary contracts, representative scenarios, and proof strategy. Include implementation and rollout shape when the request covers delivery.

## Completion

Complete the model when every relevant transition has an owner and proof, every invariant has an enforcement point, and concurrency, freshness, replay, and recovery have evidence-backed behavior.
