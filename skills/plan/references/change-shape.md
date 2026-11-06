# Change shape

Use the branch that matches the settled work. Keep only the guidance and proof lanes that affect the requested change.

## Feature

A feature adds or changes behavior. Identify the affected contract and domain structure, then order the work so real prerequisites precede dependent behavior. A state machine, registry, typed model, or reducer can be useful when it removes a concrete invalid state or duplicated decision; do not add one by rule. Slice work into observable units when that improves isolation, and verify the matching surface when a real interaction changes. Record callers, rollout, and recovery only when they are affected.

## Refactoring

A refactoring changes structure while preserving behavior. Pin behavior with a characterization test, snapshot, equivalence harness, or replay when the move could change it; type checking alone is not a behavior pin. Name the target shape, subtract dead weight when evidence supports removal, migrate callers within the affected boundary, and remove the old path once no active contract needs it. Use small moves and an output or matching-surface comparison when they reduce risk. Any intentional behavior change belongs in the feature or bug-fix portion of the plan.

For contested abstractions, consult the [simplicity principle](../../yesh-router/references/principles/simplicity.md). Before changing persistent forms, account for data migration and rollback. During implementation, migrate affected callers with the change and verify the resulting behavior or equivalence at the named boundary.

## Shape check

Before writing code, a writer replies with at most 15 lines:

- files: each path, new or edited
- precedent: each new piece → the file:line it copies
- new types: name, and the one reason it exists
- new imports: from → to (a model importing a service is a stop)
- calls: the product path this exercises end to end
- non-goals: what is deliberately left out

The coordinator approves or corrects it in one turn. A line with no precedent, or a type with no reason, gets cut here rather than in review.

## Plan test

The chosen branch is sufficient when it names the behavior or equivalence contract, affected locations and callers, dependency order, proof boundary, and rollout or recovery details that matter. Omit dimensions that do not apply rather than filling them with ceremony.
