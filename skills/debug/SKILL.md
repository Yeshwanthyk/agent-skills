---
name: debug
description: Diagnose a reproducible failure, a live runtime symptom, or a supplied trace or profile; fix and verify the cause when requested.
---

# Debug

Build a tight red-to-green loop. Reproduce the symptom on the matching surface, follow evidence to the first divergence, make the smallest coherent correction, and prove it there.

## Reproduce

Pick the starting point first:

- A supplied trace, profile, or dump: follow [trace forensics](references/trace-forensics.md); the artifact replaces a live reproduction.
- A live runtime symptom to diagnose without a fix: follow [runtime forensics](references/runtime-forensics.md).
- Otherwise, reproduce here. When the failure reproduces, read [fix-root-causes](../yesh-router/references/principles/fix-root-causes.md) before tracing it.

State the observed symptom and expected contract. Drive the relevant browser, UI, CLI, API, test, or runtime surface yourself. Capture a repeatable red signal. If the surface is inaccessible, record the limitation and the strongest substitute; do not call it a reproduction.

## Find the divergence

Trace the failing path through callers, contracts, transformations, state owners, persistence, external effects, and failure propagation. Treat caches, configuration, locks, serialized data, restart behavior, and concurrent writers as suspects when they can change the result. When the correction adds or changes a cache, cleanup, or a concurrent writer, read [state-ownership](../yesh-router/references/principles/state-ownership.md). Form competing hypotheses and choose probes that remove uncertainty. Use focused logging or instrumentation when needed, then remove probes that did not support the surviving explanation.

Compare expected and observed values at meaningful boundaries. Find the first divergence rather than the last visible symptom. Check sibling callers or equivalent state paths only when evidence suggests the mechanism is shared. [`how`](../how/SKILL.md) for current mechanics and how's [History](../how/SKILL.md#history) view for regression history are optional aids.

One mechanism must explain how the symptom occurs. A plausible story without a confirming probe remains inconclusive.

## Correct

A diagnosis-only request ends with the cause and evidence. When a fix is requested, change the first evidenced divergence. Consult [`architect`](../architect/SKILL.md) when the target shape is unsettled. When a cheap local test can pin the red signal, write it before the fix and run it: it must fail for the intended reason, not a setup or unrelated error. Prefer no new test over a bad one: a test of mocks, implementation details, timing, or expensive infrastructure for a small fix. Then use the closest executable check instead (a script, reproduction command, or browser drive). Never edit or weaken a test to match a wrong implementation. Keep validation at boundaries and migrate evidenced sibling callers within scope. Do not add speculative guards, retries, or compatibility branches. When a second fix built on the same assumption fails the same check, stop patching and follow the repeated-fix branch of [fix-root-causes](../yesh-router/references/principles/fix-root-causes.md).

Delegation is optional. If useful, follow the [shared delegation contract](../yesh-router/references/delegation.md), assign a precise read-only diagnosis or disjoint edit, then inspect the actual diff and proof yourself.

## Prove and hand off

Before calling the fix done, read [prove-it-works](../yesh-router/references/principles/prove-it-works.md). Rerun the original red signal on the same boundary. Add focused sibling, edge, retry/replay, restart, or failure checks when they are part of the mechanism. Inspect the changed diff and remove temporary probes. If the original surface cannot be exercised, report the result as inconclusive.

Report the root cause first: red signal, first divergence, causal chain, correction, failing-then-passing evidence, checks run, and remaining uncertainty. Do not imply broader coverage or publication than occurred.

## Completion

Diagnosis is complete when the cause and evidence limits are clear. A requested fix also needs a correction at the first divergence and proof on the original boundary plus relevant mechanism-specific checks.
