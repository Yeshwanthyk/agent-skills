---
name: architect
description: Choose an architecture when a consequential design boundary is unsettled.
disable-model-invocation: true
---

# Architect

Settle a consequential design choice before implementation depends on it. Start from how callers use the capability, then derive types, ownership, dependencies, and failure behavior. Use the smallest design that preserves real invariants and leaves room for known change.

## Ground

Read the relevant implementation and tests. Use [`how`](../how/SKILL.md) for current mechanics and how's [History](../how/SKILL.md#history) view when history or an operational constraint can change the choice. Name the decision seam, callers, current contracts, state and external authorities, fixed constraints, and unresolved gaps. Do not treat filenames or conventions as intent. When the change enters an existing design and bolting it on would distort that design, read [redesign-from-first-principles](../yesh-router/references/principles/redesign-from-first-principles.md) before sketching.

## Sketch

Write caller-facing usage before the type sketch; read [design-from-usage](../yesh-router/references/principles/design-from-usage.md) before writing it. Show the dominant calls, inputs, outputs, and failure handling; two or three examples are useful when they expose different contracts, but use fewer for a narrow case. Derive data structures from those access patterns; when they represent domain states, read [type-system-discipline](../yesh-router/references/principles/type-system-discipline.md). Parse external, storage, or framework data at the boundary; when the sketch parses that data or changes a data contract, read [boundary-discipline](../yesh-router/references/principles/boundary-discipline.md).

Describe module responsibilities, dependency direction, state transitions, side effects, observability, migration, rollout, and production/test substitution points. When the design holds stateful logic, or the current code repeats a shape assumption across files, read [model-the-domain](../yesh-router/references/principles/model-the-domain.md). For a novel choice with no established precedent and several viable approaches, read [exhaust-the-design-space](../yesh-router/references/principles/exhaust-the-design-space.md) before selecting a shape. Prefer a small public surface that hides real policy. When comparing candidates, read [simplicity](../yesh-router/references/principles/simplicity.md) and screen each against [`design-red-flags.md`](references/design-red-flags.md). Judge candidates as an agent contributor would change them: it sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Prefer the design where a change that looks right from one file is right for the whole repo. Use the candidate and rationale templates for a design that will be handed to others. Run swarm's [best-of](../swarm/SKILL.md#best-of) branch only when competing whole-shape alternatives would materially improve the decision.

Record the selected shape, rejected alternatives, tradeoffs, risks, and open questions. Keep the rationale beside the sketch for larger changes.

When the decision seam concerns sequencing staged delivery, replay, or progress-metadata gates, consult [forward implementation first](../yesh-router/references/principles/forward-implementation-first.md). Use it within the current design decision, not as another architecture phase.

## Implement or hand off

An architecture-only request ends with the selected design and its rationale. If implementation is already requested, continue without adding a new approval checkpoint. If implementation reveals a mismatch, determine whether the sketch, requirement, or implementation was wrong and update the design before adding exceptions. Verify the wiring that matters to the changed contract.

Delegation is optional. When useful, follow [delegation](../yesh-router/references/delegation.md), use [`runner-prompt.md`](references/runner-prompt.md), and review the actual candidate artifacts; do not delegate a shared mutable write target.

## Redesign signal

Return to the sketch when repeated workarounds, casts, always-present optionals, caller knowledge of internals, or multiple deviations expose the same boundary problem. Subtract dead weight and choose again with the new constraint. Leave a deliberate unresolved constraint visible when it cannot yet be removed.

## Output

Lead with the target shape and why it fits. Include caller usage, types/signatures, module and ownership map, boundary contracts, production/test wiring, migration and rollout, verification points, tradeoffs, risks, rejected alternatives, and open decisions as applicable.

## Completion

Architecture is complete when an executor can implement the selected shape from live contracts, ownership, dependency direction, invariants, failure behavior, migration/rollout, and proof points, with material alternatives and unknowns made explicit. Do not turn a settled mechanical choice into an architecture exercise.
