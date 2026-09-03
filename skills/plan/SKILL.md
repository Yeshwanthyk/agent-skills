---
name: plan
description: Turn a settled approach into a plain-language, implementation-ready plan with contracts, ownership, ordered vertical chunks, verification, migration, rollout, risks, and open decisions. Use when a change needs an execution packet or when Poteto routes planning work here.
---

# Plan

Own the plan, not the code. Explain the settled approach before listing work. The plan is a checklist an executor can run and a reviewer can audit from evidence.

## Settle the shape

1. Confirm that the approach is settled. If the decision seam is still open, route to [`architect`](../architect/SKILL.md) or use the repository's `prototype` playbook for an empirical question before planning.
2. If the change is one or two files with an obvious approach, say that a formal plan is not needed and stop. Keep this exception out of plans where the user explicitly requires an execution packet.
3. Read the current implementation and relevant tests when the plan changes an existing system. Use [`how`](../how/SKILL.md) for live contracts and execution paths. Use [`why`](../why/SKILL.md) when history or rationale constrains the work.
4. Record the user or system outcome, the settled scope, constraints, contracts, state owners, failure behavior, target production and test paths, and proof boundary.
5. Choose the change shape. Use [`references/change-shape.md`](references/change-shape.md) for feature and refactoring branches.
6. If the work spans phases or stacked changes, use [`references/program-template.md`](references/program-template.md). Keep one independently verifiable change per phase or PR.
7. For a complex plan, load the shared [agent-routing contract](../../references/agent-routing.md) and delegate distinct read-only explorations when that reduces risk. Request file pointers, conventions, test commands, and entry points, then reconcile the reports against the source.

Completion means the approach, scope, contracts, ownership, failure behavior, paths, and proof boundary are settled or each remaining decision is named as a gate.

## Write the orientation

Begin in plain language.

1. Say what changes and who benefits.
2. Say why the approach fits the current system.
3. Explain how the major pieces work together.
4. Name the tradeoffs that shaped the choice.

Keep this explanation short enough to orient a new executor before the checklist begins.

Completion means a reader can explain the target outcome and the reason for the chosen shape without opening implementation details.

## Build the execution packet

1. State the settled decisions and explicit exclusions.
2. Name the files and symbols that carry each change. Use current repository paths, not guessed paths.
3. Break work into ordered vertical chunks. Put preparatory structural work before behavior that depends on it.
4. For every chunk, state the behavior delivered, files and symbols, execution path, state transition or boundary touched, dependencies, verification, and risk.
5. Keep shared mutable state under one owner. Parallelize only disjoint files, services, or layers. Record blocking first steps, independent workstreams, shared-state decisions, and the smallest safe decomposition.
6. Describe migration, rollout, compatibility removal, observability, recovery, and rollback when they affect delivery.
7. Keep one source of truth for each invariant. Name derived state separately from persisted, external, cached, or displayed state.
8. End with open decisions and the chunks or rollout gates they block.
9. Run the repository's documented plan validator when one exists. Discover its current command from the repository rather than caching an environment-specific path.

Completion means an executor can start every chunk from the named decisions, locations, dependencies, boundary changes, and proof.

## Build the verification matrix

Tests alone are not sufficient verification. Choose the proof that matches the changed behavior.

- **Unit or contract.** Name the test, harness, characterization pin, or static check and its pass predicate.
- **Live.** Exercise the matching production surface when behavior changes. Name the control method, scenario, observable end state, and pass predicate. Record an explicit limitation when the surface cannot be driven.
- **Integration.** Use this when multiple modules, processes, services, persistence authorities, or external systems interact. Name the communication path and failure cases.
- **Performance.** Use this when latency, throughput, resource use, or a hot path changes. Name the metric, baseline, interleaved probe, and absolute failure budget. Mark it not applicable with a reason when no performance-sensitive behavior changes.
- **Migration and recovery.** Check old and new state, retries, restart, rollback, and partial failure when the plan changes them.

Every verification block has a concrete scenario, command or driving procedure, artifact or output, and pass predicate. Prefer a deterministic script or replay when one can prove the comparison.

Completion means every changed contract has at least one direct proof, live behavior is covered when applicable, performance is covered or explicitly not applicable, and recovery or migration risks have checks.

## Handoff

Present the plan in this order.

1. Orientation
2. Settled decisions
3. Scope and exclusions
4. Target flow
5. Implementation chunks
6. Verification matrix
7. Migration and rollout
8. Risks and mitigations
9. Open decisions

For a multi-phase plan, state the execution playbook, dependency order, merge or handoff rule, and the condition that starts execution. Do not claim that a plan was executed. Do not require a model, IDE, path convention, or command that the current repository does not expose.

## Completion

The plan is complete only when the orientation, settled scope, contracts, state ownership, failure behavior, files and symbols, ordered vertical chunks, dependencies, verification matrix, migration, rollout, risks, and open decisions are present. Every verification item must name evidence and a pass predicate. The final packet must be usable directly or when routed by Poteto.
