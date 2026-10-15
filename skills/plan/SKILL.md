---
name: plan
description: Turn a settled approach into an implementation plan of ordered chunks, dependencies, risks, and proof. Use when the user asks for a plan, breakdown, or handoff packet before coding; an unsettled design goes to architect first.
---

# Plan

Own the plan, not the code. Orient the executor in plain language, name the settled contract and boundaries, then give only the work and proof needed for the requested outcome.

## Settle and orient

Confirm that the approach is settled. If the decision seam is open, route to [`architect`](../architect/SKILL.md) or an empirical prototype; do not hide an architecture decision inside a checklist. For a tiny change with an obvious shape, say that a formal plan adds no value unless the user asks for one.

Read the current implementation and relevant tests when changing an existing system. Use [`how`](../how/SKILL.md) for live paths and how's [History](../how/SKILL.md#history) view for history when they reduce uncertainty. Record the outcome, scope, constraints, contracts, state owners, failure behavior, affected paths, and proof boundary.

Start with what changes, who benefits, why the shape fits, and the tradeoffs that matter. Keep this orientation short.

For staged delivery, replay, or metadata gates, apply [forward implementation first](../yesh-router/references/principles/forward-implementation-first.md) when selecting work and proof. Name the affected dependency cone and replay conditions rather than making administrative completion a prerequisite.

## Build the packet

1. State settled decisions and explicit exclusions.
2. Name current files and symbols for each change. Do not invent paths.
3. Order work into independently verifiable vertical chunks; when the work is a sweep, migration, or stack, read [sequence-verifiable-units](../yesh-router/references/principles/sequence-verifiable-units.md) first. Put a real prerequisite before its dependent behavior; keep disjoint work parallel only when it helps.
4. For each chunk, give the behavior, files/symbols, path or state transition touched, dependencies, risk, and proof. Every number in the plan (a budget, cap, limit, or timeout) cites where it came from; a number with no source is left out, or marked as a placeholder for the user to set.
5. Name the owner of shared mutable state and distinguish persisted, external, cached, derived, and displayed values.
6. Describe migration, compatibility, rollout, observability, recovery, and rollback only where they affect delivery. When the plan removes or replaces an API, format, or behavior, or changes a persistent format, read [migrate-callers](../yesh-router/references/principles/migrate-callers.md).
7. End with open decisions and the chunks or gates they block.

Use [`change-shape.md`](references/change-shape.md) for feature/refactoring guidance. Use [`program-template.md`](references/program-template.md) when the work spans phases, stacked changes, or multiple owners. Delegate distinct read-only exploration through the [shared delegation contract](../yesh-router/references/delegation.md) when it reduces risk; reconcile reports against the source.

## Verification matrix

Read [prove-it-works](../yesh-router/references/principles/prove-it-works.md) before choosing checks, and plan property or fuzz work with [invariants](../invariants/SKILL.md); it also says when broad input/transition contracts or malformed-input boundaries call for property or fuzz testing. For those, specify the invariant, generator or target, budget, and replay plan within the applicable lane; planning alone does not execute it.

Match checks to changed behavior. Name a concrete scenario, command or driving procedure, artifact/output, and pass predicate for each applicable lane:

- unit or contract;
- live surface, when runtime behavior changes;
- integration, when boundaries interact;
- performance, when a hot path or budget changes;
- migration/recovery, when state or lifecycle changes.

Use existing checks first. Add a harness only when repeatability or reliability justifies it. Do not repeat equivalent checks or require an inapplicable lane; record its reason when useful. Discover a repository plan validator from the repository if one exists.

## Handoff and completion

Lead with the approach, then give the work, proof, and open decisions needed to execute it. The plan is complete when an executor can start each chunk and tell success from failure. A planning-only request ends there without claiming execution. If implementation is also requested, continue with the settled work instead of adding a new approval gate.
