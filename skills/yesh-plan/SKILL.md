---
name: yesh-plan
description: Turn a settled approach into a human-readable, implementation-ready packet.
---

# Yesh Plan

Create an **implementation packet** that explains the idea before detailing the work.

## Process

1. Begin with a plain-language orientation: what changes, why the approach fits, how the major pieces work together, and which tradeoffs shaped the decision.
2. Capture the settled scope, constraints, contracts, state ownership, failure behavior, and target production and test paths.
3. Name the files and symbols that carry each change.
4. Break the work into ordered chunks sized for focused implementation.
5. For each chunk, state the behavior delivered, files and symbols, execution path, state transition or boundary touched, dependencies, verification, and risk.
6. Place preparatory structural work before the behavior that depends on it.
7. Describe migration, rollout, observability, and residual risk where they shape delivery.
8. End with the decisions that remain open and the work they gate.

## Output

Present orientation, settled decisions, scope, target flow, implementation chunks, verification matrix, rollout, risks, and open decisions in that order.

## Completion

Complete the packet when an executor can begin every chunk from the stated decisions, locations, dependencies, boundary changes, and proof.
