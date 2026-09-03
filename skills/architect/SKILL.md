---
name: architect
description: Choose a target architecture at an unsettled boundary from live contracts, execution paths, state ownership, and constraints. Use before non-trivial implementation, migration, or refactoring when the shape could lock in the wrong design, and when Poteto routes an architecture task here.
---

# Architect

Design before implementation. Start with the caller's usage, derive the types and signatures from it, and keep the implementation against the chosen sketch. If implementation exposes repeated friction, redesign instead of bolting on exceptions.

## Start

Use the harness task list when one exists. Otherwise keep this numbered checklist in the working response or decision trail.

1. Ground
2. Sketch
3. Agree
4. Implement
5. Scrap

## Ground the problem

Build a live model of every system the target touches.

1. Run [`how`](../how/SKILL.md) over the relevant subsystem. Cover representative production and test execution paths, state owners, boundaries, registrations, and failure behavior.
2. Run [`why`](../why/SKILL.md) when history, a regression, an operational constraint, or an existing rationale could shape the design.
3. Locate the decision seam. Name the callers, current contracts, ownership boundaries, dependency direction, persistence and external authorities, and constraints that cannot move.
4. Record unknowns as unresolved gaps. Do not turn filenames, conventions, or inferred intent into facts.

Skip only the parts that do not apply. State the reason in the active checklist.

Completion means the decision seam has a traced current model with production and test paths, ownership, constraints, and evidence status.

## Sketch the target

Use the caller's view as the spec.

1. Write the README-style usage and two or three realistic call sites first. Show imports, calls, inputs, outputs, and failure handling.
2. Derive the data structures from those access patterns. Encode invariants in types where possible. Parse external, storage, and framework data at the boundary into domain types.
3. Define function signatures, module responsibilities, dependency direction, state ownership, side effects, observability, and failure channels.
4. Describe each meaningful boundary as caller, contract, owner, data or state change, effect, failure behavior, and proof point.
5. Draw the target production and test call graphs. Mark substitution points and the state or adapter each test controls.
6. Compare candidates on interface depth. Prefer the smallest public surface that hides the most policy and complexity. Reject shallow modules, information leakage, temporal decomposition, and pass-through methods using [`references/design-red-flags.md`](references/design-red-flags.md).
7. When the design needs competing whole-shape alternatives, use the separate `arena` skill. Give each runner [`references/runner-prompt.md`](references/runner-prompt.md) and [`references/candidate-template.md`](references/candidate-template.md), with every referenced path resolved for that worker. Do not embed arena's procedure here.
8. Record the selected shape, adaptations, rejected alternatives, tradeoffs, open questions, and risks in a rationale shaped by [`references/rationale-template.md`](references/rationale-template.md).

Completion means the usage, type sketch, signatures, module map, boundary records, call graphs, rationale, and alternative decision agree with one another.

## Agree when requested

Proceed to implementation by default. Pause only when the user explicitly asks for a checkpoint or sign-off. Surface the synthesized sketch and the unresolved decisions, then wait. A pushback is new grounding evidence. Re-ground and resketch before writing more code.

Completion means either the default implementation handoff is made or the requested checkpoint has a clear sign-off state.

## Implement against the sketch

Replace `not implemented` bodies with code and pseudocode with logic. Treat the synthesized sketch as the contract.

1. Surface every deviation. Ask whether the sketch was wrong, a requirement was missed, or the implementation overreaches.
2. Keep validation at system boundaries. Trust internal types and keep domain logic as pure as the surrounding design allows.
3. Make state transitions idempotent where retries or crashes can repeat them. Derive state instead of synchronizing duplicate representations.
4. Keep call chains short. If a reader must cross more than three files to understand one operation, reconsider the boundary.
5. Verify production and test wiring at the substitution points named in the sketch.

Completion means the implementation follows the sketch or every deviation has an explicit design decision and proof.

## Scrap a wrong architecture

Repeated friction is a redesign signal.

- The same workaround appears across unrelated code.
- Independent edge cases need the same special branch.
- Types require casts, escape hatches, or optional fields that are always set in practice.
- Callers must know internal rules to use the abstraction.
- Two or more deviations share the same shape.

When the pattern appears:

1. Run [`how`](../how/SKILL.md) over what now exists.
2. Treat implementation lessons as new constraints.
3. Subtract dead weight and reduce the new sketch before adding capability.
4. Return to Sketch and choose a target as if the new constraints existed from the start.

Completion means the repeated friction is either removed by the new shape or recorded as a deliberate unresolved constraint with evidence.

## Output

Lead with a plain-language target shape and why it fits. Then provide caller usage, types and signatures, module map, state ownership, boundary records, production and test call graphs, migration and rollout shape, verification points, tradeoffs, risks, and open decisions. Ship the rationale beside the sketch for larger changes.

## Completion

Architecture is complete when a developer can implement the target from live contracts, execution paths, ownership, dependency direction, failure behavior, observability, migration, rollout, production and test wiring, proof points, and explicit open decisions. The design must also state which alternatives lost and why.
