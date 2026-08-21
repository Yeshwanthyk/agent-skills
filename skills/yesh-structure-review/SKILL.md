---
name: yesh-structure-review
description: Audit an implementation's engineering structure and propose evidence-backed corrections.
---

# Yesh Structure Review

Produce a **clean audit** of the structure carrying the behavior.

## Process

1. Establish the intended user or system outcome, review surface, and representative proof that exercises the behavior.
2. Trace the normal production path end to end; keep the happy path visible before inspecting its mechanics.
3. Trace the corresponding test or proof path through stable behavioral boundaries.
4. Then inspect edge cases, failures, and exceptional paths.
5. Audit contracts and invariants, ownership and state flow, dependency direction, cohesion, locality, clarity, failure behavior, and verification.
6. Select the quality attributes that materially shape the implementation: module depth, observability, performance, security, concurrency, accessibility, compatibility, data evolution, and operational behavior.
7. Record strengths and concrete structural strain with file, symbol, evidence, and consequence.
8. Classify each reviewed area as `keep`, `act-now`, or `defer` according to evidence, present pressure, and correction cost.
9. Propose the smallest coherent correction, target shape, affected owner or boundary, and proof for each actionable finding.
10. Apply accepted `act-now` corrections and rerun their proof when implementation is part of the request.

## Clarity checks

- Use one stable term for each concept and one meaning for each term. Cut words that the surrounding scope already supplies.
- Keep comments that explain a non-obvious constraint, decision, or side effect. Remove comments that restate code or narrate change history.
- Lead files with their significant behavior and keep supporting details close to what they support when language conventions allow it.
- Derive values from authoritative state instead of passing or storing duplicate state.
- Reuse an existing abstraction when it already owns the concept. Combine overlapping concepts instead of adding parallel names or paths.
- Prefer the standard library, a native platform feature, or an installed dependency over hand-rolled equivalents; flag reimplementations of what already ships.
- Prefer types that make important invariants explicit and make invalid states difficult to represent.
- Check that state, transitions, cleanup, and recovery have clear owners rather than being coordinated through broad abstractions.
- Keep the valid path flat with guard clauses when that makes the main behavior easier to follow.
- Prefer tests at stable behavioral boundaries over tests coupled to incidental implementation details.
- Keep domain decisions separate from infrastructure mechanics when that boundary materially improves ownership or verification; do not impose it as a universal architecture rule.
- Remove compatibility paths for forms that existed only in the current unshipped branch.
- Rewrite names and comments that require conversation or review history to make sense.

## Evidence before complexity

Do not recommend an abstraction, layer, generalization, or structural rewrite merely because it seems theoretically cleaner. Tie every recommendation to concrete code evidence, present pressure, and a specific consequence. Deep modules, deliberate interfaces, type-driven invariants, and boundary isolation are review heuristics—not architecture requirements.

## Output

Lead with the conclusion. Present evidence-backed strengths, ranked actionable findings, target shapes, action order, and verification.

## Completion

Complete the audit when the normal path is explained before exceptions, every reviewed area has evidence and consequence, every actionable finding has a correction shape, affected owner or boundary, and verification, each clarity issue is grounded in the codebase's vocabulary, every deferred finding names the condition that reopens it, speculative risks are separated from observed strain, and each sound area has an evidence-backed `keep` decision.

For deeper design questions or source attribution, load `references.md`. Do not load it for a normal audit unless a finding requires additional design context.
