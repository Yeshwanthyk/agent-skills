---
name: yesh-structure-review
description: Audit an implementation's engineering structure and propose evidence-backed corrections.
---

# Yesh Structure Review

Produce a **clean audit** of the structure carrying the behavior.

## Process

1. Establish the system purpose, review surface, and representative proof that exercises its behavior.
2. Trace representative production and test execution paths through the implementation.
3. Audit contracts and invariants, ownership and state flow, dependency direction, cohesion, locality, clarity, failure behavior, and verification.
4. Select the quality attributes that materially shape the implementation: module depth, observability, performance, security, concurrency, accessibility, compatibility, data evolution, and operational behavior.
5. Record strengths and concrete structural strain with file, symbol, evidence, and consequence.
6. Classify each reviewed area as `keep`, `act-now`, or `defer` according to evidence, present pressure, and correction cost.
7. Propose the smallest coherent correction, target shape, and proof for each actionable finding.
8. Apply accepted `act-now` corrections and rerun their proof when implementation is part of the request.

## Clarity checks

- Use one stable term for each concept and one meaning for each term. Cut words that the surrounding scope already supplies.
- Keep comments that explain a non-obvious constraint, decision, or side effect. Remove comments that restate code or narrate change history.
- Lead files with their significant behavior and keep supporting details close to what they support when language conventions allow it.
- Derive values from authoritative state instead of passing or storing duplicate state.
- Reuse an existing abstraction when it already owns the concept. Combine overlapping concepts instead of adding parallel names or paths.
- Remove compatibility paths for forms that existed only in the current unshipped branch.
- Rewrite names and comments that require conversation or review history to make sense.

## Output

Lead with the conclusion. Present evidence-backed strengths, ranked actionable findings, target shapes, action order, and verification.

## Completion

Complete the audit when every reviewed area has evidence and consequence, every actionable finding has a correction shape and verification, each clarity issue is grounded in the codebase's vocabulary, and each sound area has an evidence-backed `keep` decision.
