---
name: swarm
description: Run a bounded parallel investigation or solution race, or compare candidates best-of-N and synthesize one verified result.
disable-model-invocation: true
---

# Swarm

Fan out independent workers for one bounded question, then return one judged result. In an active routing mode, use the [`orchestrate` playbook](../yesh-router/playbooks/orchestrate.md) instead when the work has dependent implementation stages or requires continuing integration.

## Frame

1. State the done predicate and final artifact or report.
2. Choose a shape:
   - **partition** assigns non-overlapping coverage slices;
   - **race** gives the same brief to several workers;
   - **mixed** partitions the work and races only uncertain slices.
3. For a race, declare `first-pass`, `rank-all`, or `best-of` before launch. `best-of` compares complete candidates and synthesizes one result; follow [Best-of](#best-of) for it. Use it for a requested bakeoff or a consequential choice between viable designs; a settled mechanical task needs one implementation.
4. Set the worker count from the independent slices, the useful design alternatives, or the user's request. Each worker must add distinct evidence or judgment. When worker output could overflow your context, read [guard-the-context-window](../yesh-router/references/principles/guard-the-context-window.md), so worker output reaches the lead as compact results and the bulk stays with the workers.
5. Give every writer a separate owned path, worktree, or branch. When partitioning puts mutable files or state in more than one slice, read [state-ownership](../yesh-router/references/principles/state-ownership.md) and assign exactly one writer per mutable path.

## Route

Use the [shared delegation contract](../yesh-router/references/delegation.md) when dispatching. Every brief names its exact slice or race arm. Race arms get the same task and raw inputs. Require `PASS`, `ISSUES`, or `BLOCKED` with evidence.

## Fan out and aggregate

1. Launch independent workers together. Let the selected runtime own its capacity.
2. Gather every required result. Record dropouts, failed runs, and blocked slices instead of hiding them.
3. Verify consequential claims against the repository or runtime; [prove-it-works](../yesh-router/references/principles/prove-it-works.md) covers judging a delegated result.
4. For partitions, require coverage for every slice. For races, apply the declared selection rule.
5. Deduplicate findings and resolve overlap under one authoritative slice.
6. Reconcile every launched worker through the selected runtime.

## Best-of

Before launch, define the artifact and observable selection criteria. When the candidates embody a novel interaction or architectural choice with no established precedent, read [exhaust-the-design-space](../yesh-router/references/principles/exhaust-the-design-space.md) before choosing the arms. Ask each candidate for a brief design rationale when the differences will not be evident in the artifacts.

1. **Complete.** Each candidate delivers a whole artifact in its own write target. Keep failed or incomplete candidates visible.
2. **Cross-judge.** After candidate work settles, a separate read-only reviewer scores every output against the criteria and recommends a base. Prefer a model family different from yours; when only the same family or no independent reviewer is available, state the limitation.
3. **Choose a base.** Read every candidate end to end and score each criterion, not overall feel, then compare with the judge. When the judge disagrees, read both rationales before deciding. Pick the base a future maintainer can extend without breaking invariants; between near-ties, take the cleaner boundary or smaller API.
4. **Graft** usually one or two parts per losing candidate, folded in by hand so the result keeps one design. Candidates that converge on one shape are strong agreement: ship that shape with no grafts. Candidates that diverge wildly mean the frame was under-specified: reframe and re-run rather than averaging them.
5. **Verify the synthesis** at its relevant boundary, and fix demonstrated failures within the requested task. When verification finds a miss, decide whether the frame was wrong (reframe and re-run) or a candidate caught it and the graft was missed (graft it). Candidate success does not establish that the combined result works; read [prove-it-works](../yesh-router/references/principles/prove-it-works.md) before claiming it does.

Deliver the artifact, the reason for the selection, the grafts, and the verification. A comparison that produced only one candidate is not evidence that it beat alternatives; say so.

## Completion

Complete the swarm when every selected slice has a result or explicit gap and every worker is reconciled. Return a compact synthesis with evidence-backed issues and coverage gaps; use a table when it improves comparison. A `best-of` race is complete when the synthesized result is verified at its boundary.
