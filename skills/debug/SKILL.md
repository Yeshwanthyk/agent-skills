---
name: debug
description: Diagnose and fix reproducible failures by finding the first contract divergence and proving the correction on the original boundary. Use for broken, inconsistent, slow, throwing, or failing behavior, and when Poteto routes a debugging task here.
---

# Debug

Own the diagnosis, correction, review, and proof. Build a red-capable loop, then follow it to the first contract divergence. The smallest evidence-backed correction ships.

## Start

Use the harness task list when one exists. Otherwise keep this numbered checklist in the working response or decision trail.

1. Reproduce
2. Narrow
3. Confirm
4. Correct
5. Prove
6. Hand off

## Reproduce on the real surface

1. State the exact symptom and the expected contract it violates.
2. Drive the matching surface yourself. Use a project-local verifier or the current harness's browser, UI, CLI, API, or terminal tools. If none can reach the surface, report the limitation instead of inventing a control skill.
3. Build the tightest repeatable red signal available. Prefer a focused test, command, request, trace replay, runtime probe, or measured scenario.
4. If the first attempt is green, force the trigger by tightening its conditions, synthesizing the input, or adding temporary instrumentation. Ask the user only when the available surface cannot reach the target after you have driven it as far as possible.

Completion means the exact symptom has a repeatable red signal on the matching boundary, or the access limitation and the strongest available substitute are recorded.

## Narrow to the first divergence

1. Trace the failing path from trigger to effect. Record caller, callee, input and output contract, transformation, state owner, persistence authority, side effect, failure propagation, and proof point at each meaningful boundary.
2. Map relevant state transitions. Treat persistent state, caches, locks, configuration, and serialized data as suspects when behavior changes across restarts.
3. Form competing hypotheses. Choose the next probe that removes the largest part of the remaining search space.
4. Binary-search the cause with runtime evidence. Add focused logging or instrumentation when state is unclear, then remove instrumentation that did not support the surviving explanation.
5. Compare observed behavior with the expected contract at every boundary. Find the first divergence, not the last visible symptom.
6. Seed the investigation with [`how`](../how/SKILL.md) for current mechanics and [`why`](../why/SKILL.md) for regression history when they reduce uncertainty. Use their evidence boundary and label direct evidence, inference, and unresolved gaps.
7. Check sibling callers and equivalent state paths for the same causal pattern. Do not widen the patch without evidence that the pattern is shared.

Completion means one mechanism survives the hypothesis loop and runtime evidence shows how that mechanism produces the symptom. A plausible story without a confirmed mechanism is not enough.

## Correct coherently

1. If the correction crosses a function or module boundary, run [`architect`](../architect/SKILL.md) before changing the boundary.
2. Choose the smallest coherent correction at the first divergence. Fix the root cause instead of silencing the symptom with a guard, fallback, or retry that leaves the bad contract intact.
3. Model repeated shape assumptions with a typed model, state machine, registry, reducer, or boundary object when that structure removes branches or invalid states. Keep local boring code when it already expresses the domain clearly.
4. Preserve the red signal before the correction when a cheap local test can pin it. Skip a failing test only when the test path is expensive, integration-heavy, or unclear, and record why.
5. If delegation is useful, load the shared [agent-routing contract](../poteto-mode/references/agent-routing.md), give the worker a precise file and symbol scope, and review the actual diff yourself. If delegation is unavailable, do the work directly.
6. Inspect sibling call sites after the correction. Migrate every affected caller together and remove obsolete paths rather than leaving a compatibility branch without a proven need.

Completion means the diff changes the first evidenced divergence, preserves unrelated behavior, covers evidenced siblings, and contains no speculative safeguard.

## Prove the original boundary

1. Rerun the original red signal on the same surface. It must pass.
2. Rerun representative boundary tests and sibling paths. Include edge inputs, retry or replay behavior, restart behavior, and failure propagation when they are part of the mechanism.
3. Check the full chain from input to output. A passing unit branch is not proof that the real boundary works.
4. Inspect the changed files and diff. Confirm that every shipped line is supported by the diagnosis and that temporary probes are gone.
5. Capture failing-then-passing output verbatim. If the original surface cannot be exercised, label the result inconclusive instead of calling it a pass.

Completion means the original boundary passes, the relevant sibling and edge checks pass, the artifact matches the intended correction, and any remaining uncertainty is explicit.

## Delivery handoff

Report the root cause first. Include the red signal, direct evidence, first contract divergence, causal chain, correction, failing-then-passing repro output, checks run, and remaining uncertainty. If the repository has a publication workflow, hand off at that workflow's boundary without claiming publication that did not occur.

When the repository uses ordered commits, land the failing repro before the correction so the history tells the proof sequence. Keep publication or merge as a handoff unless the user explicitly asks for it.

## Completion

Debugging is complete only when the exact symptom has a repeatable signal, the first contract divergence is evidenced, the causal chain explains the behavior, the smallest coherent correction is reviewed, the original boundary proves the fix, sibling and edge checks are accounted for, and the handoff states residual uncertainty.
