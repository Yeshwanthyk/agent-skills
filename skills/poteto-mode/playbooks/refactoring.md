# Refactoring

Use this playbook for behavior-preserving renames, extracts, inlines, deduplication, moves, and structural reshapes. New behavior routes to `feature`. A large migration routes to `figure-it-out`.

1. Pin the current behavior. Use `how` to trace the affected path. Add the smallest characterization test, snapshot, or equivalence check before moving structure.
2. Name the missing structure with `model-the-domain`. Choose a state machine, registry, typed model, reducer, or plain local code only when it removes branches, invalid states, or reader load.
3. Describe the target shape as if the code were built today. Use `architect` when the change crosses a function boundary or changes ownership.
4. Subtract dead code, redundant checks, wrappers, and orphan references before adding the new shape. Keep the diff to the smallest change that reaches the target.
5. Move one behavior-preserving unit at a time. Migrate every caller and delete the old internal API in the same wave. Do not keep a compatibility layer without an external contract that requires it.
6. Delegate mechanical edits only when they save context or reduce error. Give the worker exclusive paths and the pinned behavior. Review the actual diff yourself.
7. Prove equivalence on the real artifact. Run the characterization check, adjacent tests, type checks, and the matching UI, CLI, API, or library path when available.
8. Confirm lower reader load. Count fewer layers, less hidden state, or fewer duplicated decisions. Revert a reshape that adds indirection without a concrete reduction.
9. Rebase into small ordered commits. Run `opening-a-pr` after the code is verified.

## Completion

The pinned behavior remains unchanged, the target structure lowers reader load, and the equivalence proof passes.

**Reply:** structure changed, behavior pin, equivalence evidence, reader-load change, shipped units, and reverted ideas.
