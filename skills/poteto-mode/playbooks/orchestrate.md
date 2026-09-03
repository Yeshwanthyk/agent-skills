# Orchestrate

Use this playbook for a continuing program with dependent slices, shared integration, many work units, or work that outlives one session. Use `autonomous-run` for one task that ends at one predicate. Use `swarm` for one bounded parallel pass.

1. Frame a countable done predicate. Name the units, tracks, rough effort, wall-clock budget, shared write targets, dependencies, and the point where new work stops so verified work can land. Keep the work in the coordinator when one worker can finish it efficiently.
2. Scout independent read-only questions that reduce implementation risk. Finish scouting when the relevant paths, contracts, invariants, and proof are known.
3. Use the runtime policy already loaded by Poteto Mode. Install one durable program record before spawning workers. Reuse a repository-owned program store when one exists. Otherwise write `.audit/<program-slug>.md` with separate sections for the objective, unit queue and state, dependencies and consumed handoffs, path ownership, worker receipts, verification, authorization gates, and derived status. Give every mutable path one writer.
4. Pilot one unit through its full lifecycle. Give its owner a standalone brief with outcome, owned paths, dependencies, exact consumed results, proof, and authorization limits. Correct the brief or proof contract from that evidence before scaling.
5. Scale with a rolling window. Admit independent units together and dependent units only after their handoffs exist. Give each writer an exclusive branch, worktree, or file set. Require focused proof and a report of changed paths, results, and deviations.
6. Drain completions at defined points. Reconcile every report against its files, diff, proof, and current repository state. Record failed, blocked, abandoned, and late work. Replace a stuck unit only after recording the gap.
7. Integrate continuously under one coordinator. Resolve shared-file changes under one owner. Keep the lowest shared frontier green and re-verify every changed head. Assign failed checks to the original owner or one named repair owner, then reintegrate and verify again.
8. Use a fresh read-only verifier when integrated proof is expensive, judgment-heavy, or high risk. Give it the integrated diff, exact gates, and real behavior to exercise. Treat a missing or self-reported check as a gap.
9. Recover cold after a restart or handoff. Read the durable record and the shared [session-records contract](../references/session-records.md). Reconcile its unit states with live branches, worktrees, worker receipts, diffs, and verification artifacts. Mark stale or missing owners explicitly. Resume only units whose dependencies and last proof still hold.
10. Close the program by draining the final queue, reconciling every worker, checking the real predicate, and recording recurring corrections in the standing contract. Report delivered behavior, evidence, unresolved risk, and pending authorization gates.

## Completion

Every unit is integrated or explicitly closed, dependency handoffs are recorded, all workers have terminal states, the real integrated proof passes, and no delegated work remains ambiguous.

**Reply:** predicate and counts, tracks, integrated units, current frontier, verdicts, abandoned work, open gates, durable record path, and remaining risk.
