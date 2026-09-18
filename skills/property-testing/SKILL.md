---
name: property-testing
description: Build and run property-based tests for contracts spanning many inputs or operation sequences, with shrinking and replayable failures.
---

# Property testing

Turn a specific contract into generated attempts to disprove it. Use existing project tests and generators before adding a framework. Planning or review requests end with a test design or findings; implement tests when the request authorizes it.

## Select the boundary

Name the invariant, real implementation entry point, generated domain, and expected behavior. Use the handoff from [stateful-systems](../stateful-systems/SKILL.md) when one exists; pure functions and input boundaries can start here directly. Derive expected behavior from requirements or an independent reference model, rather than copying implementation logic.

Read only the matching reference: [TypeScript and Effect](references/typescript-effect.md), [Python](references/python.md), or [Rust](references/rust.md). Inspect installed versions before using version-specific APIs; preserve a suitable existing framework.

## Build and exercise

Generate boundary values, valid combinations, and explicit invalid-input cases where rejection is part of the contract. Prefer constructive generators over broad filtering. Check that meaningful cases reach the target instead of being skipped or rejected by setup.

For stateful contracts, generate operations against the real system and check invariants after meaningful transitions. Reset state for each example. Control clocks and external services where necessary; sequential operation generation does not establish race safety. Concurrent claims need controlled interleavings or other concurrency evidence.

Choose an explicit example budget appropriate to the change. Run the smallest relevant test command. When useful, demonstrate that the property detects a known regression or temporary defect in an isolated copy. A round-trip alone can miss a bug shared by both directions; use independent expectations where that risk matters.

Shrink failures, classify whether the contract, generator, harness, or implementation is wrong, and preserve the concrete counterexample as a regression case. Keep the seed/path and tool version for replay, but retain the failing values or operations too. Correct production code only within the requested scope; preserve the intended assertion and input domain.

## Evidence

Report the property, real boundary, command, version, budget, outcome, and replay artifact. Distinguish successful exploration from exhausted filtering, flaky setup, or a missing runtime. A bounded pass is not universal proof. Use the project's existing test gate; adding CI configuration or a long-running campaign requires that work to be in scope.
