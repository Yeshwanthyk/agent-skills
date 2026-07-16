---
name: yesh-architect
description: Design a concrete target architecture from live contracts, execution paths, state ownership, and constraints.
---

# Yesh Architect

Define the **target shape** before implementation.

## Process

1. Ground the decision in the current contracts, representative production and test execution paths, state ownership, and repository conventions.
2. Locate the decision seam and the constraints that shape it.
3. Define the target types, interfaces, dependency direction, state ownership, failure channels, and observability.
4. Describe each meaningful boundary as caller, contract, owner, data or state change, side effect, failure behavior, and proof point.
5. Draw the target production and test call graphs with their substitution points.
6. Name the migration boundary, rollout shape, representative verification, and implementation risks.
7. Recommend one coherent architecture and surface the decisions that remain open.

## Output

Lead with a plain-language explanation of the target shape and why it fits. Follow with contract sketches, state ownership, boundary records, production and test call graphs, migration shape, risks, and open decisions.

## Completion

Complete the architecture when contracts, ownership, dependency direction, failure behavior, migration, and production and test wiring are resolved enough to guide implementation.
