---
name: plan
description: Turn a settled approach into an implementation plan with dependencies and relevant proof.
---

# Plan

Own the plan, not the code. Orient the executor in plain language, name the settled contract and boundaries, then give only the work and proof needed for the requested outcome.

## Settle and orient

Confirm that the approach is settled. If the decision seam is open, route to [`architect`](../architect/SKILL.md) or an empirical prototype; do not hide an architecture decision inside a checklist. For a tiny change with an obvious shape, say that a formal plan adds no value unless the user asks for one.

Read the current implementation and relevant tests when changing an existing system. Use [`how`](../how/SKILL.md) for live paths and [`why`](../why/SKILL.md) for history when they reduce uncertainty. Record the outcome, scope, constraints, contracts, state owners, failure behavior, affected paths, and proof boundary.

Start with what changes, who benefits, why the shape fits, and the tradeoffs that matter. Keep this orientation short.

## Build the packet

1. State settled decisions and explicit exclusions.
2. Name current files and symbols for each change. Do not invent paths.
3. Order work into independently verifiable vertical chunks. Put a real prerequisite before its dependent behavior; keep disjoint work parallel only when it helps.
4. For each chunk, give the behavior, files/symbols, path or state transition touched, dependencies, risk, and proof.
5. Name the owner of shared mutable state and distinguish persisted, external, cached, derived, and displayed values.
6. Describe migration, compatibility, rollout, observability, recovery, and rollback only where they affect delivery.
7. End with open decisions and the chunks or gates they block.

Use [`change-shape.md`](references/change-shape.md) for feature/refactoring guidance. Use [`program-template.md`](references/program-template.md) when the work spans phases, stacked changes, or multiple owners. Delegate distinct read-only exploration through the [shared delegation contract](../references/delegation.md) when it reduces risk; reconcile reports against the source.

## Verification matrix

For broad input/transition contracts or malformed-input boundaries, consult the [evidence-discipline principle](../references/principles/evidence-discipline.md) to select property or fuzz testing. Specify the invariant, generator or target, budget, and replay plan within the applicable lane; planning alone does not execute it.

Match checks to changed behavior. Name a concrete scenario, command or driving procedure, artifact/output, and pass predicate for each applicable lane:

- unit or contract;
- live surface, when runtime behavior changes;
- integration, when boundaries interact;
- performance, when a hot path or budget changes;
- migration/recovery, when state or lifecycle changes.

Use existing checks first. Add a harness only when repeatability or reliability justifies it. Do not repeat equivalent checks or require an inapplicable lane; record its reason when useful. Discover a repository plan validator from the repository if one exists.

## Handoff and completion

Lead with the approach, then give the work, proof, and open decisions needed to execute it. The plan is complete when an executor can start each chunk and tell success from failure. A planning-only request ends there without claiming execution. If implementation is also requested, continue with the settled work instead of adding a new approval gate.
