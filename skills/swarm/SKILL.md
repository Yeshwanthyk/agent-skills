---
name: swarm
description: Run a bounded parallel investigation or solution race and reconcile the results.
---

# Swarm

Fan out independent workers for one bounded question, then return one judged result. In an active routing mode, use the [`orchestrate` playbook](../yesh-router/playbooks/orchestrate.md) instead when the work has dependent implementation stages or requires continuing integration.

## Frame

1. State the done predicate and final artifact or report.
2. Choose a shape:
   - **partition** assigns non-overlapping coverage slices;
   - **race** gives the same brief to several workers;
   - **mixed** partitions the work and races only uncertain slices.
3. For a race, declare `first-pass`, `rank-all`, or `best-of` before launch.
4. Set the worker count from the independent slices or the user's request. Each worker must add distinct evidence or judgment.
5. Give every writer a separate owned path, worktree, or branch.

## Route

Use the [shared delegation contract](../references/delegation.md) when dispatching. Every brief names its exact slice or race arm. Require `PASS`, `ISSUES`, or `BLOCKED` with evidence. Use Jev here when needed

## Fan out and aggregate

1. Launch independent workers together. Let the selected runtime own its capacity.
2. Gather every required result. Record dropouts and blocked slices instead of hiding them.
3. Verify consequential claims against the repository or runtime.
4. For partitions, require coverage for every slice. For races, apply the declared selection rule.
5. Deduplicate findings and resolve overlap under one authoritative slice.
6. Reconcile every launched worker through the selected runtime.

## Completion

Complete the swarm when every selected slice has a result or explicit gap and every worker is reconciled. Return a compact synthesis with evidence-backed issues and coverage gaps; use a table when it improves comparison.
