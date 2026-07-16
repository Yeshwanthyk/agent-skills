---
name: yesh-structure-review
description: Audit an implementation's engineering structure and propose evidence-backed corrections.
---

# Yesh Structure Review

Produce a **clean audit** of the structure carrying the behavior.

## Process

1. Establish the system purpose, review surface, and representative proof that exercises its behavior.
2. Trace representative production and test execution paths through the implementation.
3. Audit contracts and invariants, ownership and state flow, dependency direction, cohesion, locality, failure behavior, and verification.
4. Select the quality attributes that materially shape the implementation: module depth, observability, performance, security, concurrency, accessibility, compatibility, data evolution, and operational behavior.
5. Record strengths and concrete structural strain with file, symbol, evidence, and consequence.
6. Classify each reviewed area as `keep`, `act-now`, or `defer` according to evidence, present pressure, and correction cost.
7. Propose the smallest coherent correction, target shape, and proof for each actionable finding.
8. Apply accepted `act-now` corrections and rerun their proof when implementation is part of the request.

## Output

Lead with the conclusion. Present evidence-backed strengths, ranked actionable findings, target shapes, action order, and verification.

## Completion

Complete the audit when every reviewed area has evidence and consequence, every actionable finding has a correction shape and verification, and each sound area has an evidence-backed `keep` decision.
