# Orchestrate

Use for a continuing program with dependent units, shared integration, or multiple owners. One bounded task can use [autonomous run](autonomous-run.md).

Use the shared [delegation contract](../references/delegation.md) for ownership, results, and host-configured role defaults. Reviews use a different agent from the implementation author. When an unresolved question blocks progress, use [architect](../../architect/SKILL.md) for an unsettled design boundary, [blast-radius](../../blast-radius/SKILL.md) for downstream consequences, or [interrogate](../../interrogate/SKILL.md) for a requested or warranted independent challenge. Select the method for that question, then resume coordination.

Coordinate through the current host harness's native subagent tools and supported dispatch, messaging, inspection, steering, waiting, and cancellation capabilities. Use the delegation contract for worker context, parent–child questions and results, runtime choice, and unavailable capabilities. Discover what this harness supports rather than building a parallel coordination mechanism.

This playbook names actions, not tools: **spawn**, **drain**, **continue**, **cancel**, **isolate**, **wake**, **tick**, **probe**. Resolve them through the matching host table in [`references/hosts/`](../references/hosts/). A gap listed there is a reported limit; work within it.

For staged output, cursor movement, or metadata-driven replay, apply [forward implementation first](../references/principles/forward-implementation-first.md) to publication ownership, dependency consumption, and relevant proof. Existing approval and review requirements still apply.

## Coordinate

Define the requested outcome and units with their dependencies and proof. Scout independent unknowns before committing to a costly design. A known path does not need a scout pass.

Keep a short checkpoint when work needs recovery across sessions. Reuse the repository's store or an existing record for unit state, owners, completed results, evidence, and pending decisions.

Dispatch independent units together. Give dependent units the actual completed inputs, not merely an ordering label. Each mutable path has one active writer. Pilot an unfamiliar workflow before scaling it.

Reconcile each completed unit against its artifacts. Review using the shared role defaults, integrate under one owner, and run the relevant integrated checks. A changed patch invalidates evidence that depended on its old behavior. Record failed and blocked units without counting them as delivered.

On restart, reconcile the record with live work and [session evidence](../references/session-records.md). Settle or cancel an old writer before replacing it. Preserve unrelated work and partial results.

Finish when the requested units are integrated and verified, or identify the exact external blocker. Account for every worker. PR creation and publication require a user request; orchestration itself does not request them.

For requested PR work, follow the repository’s delivery workflow. A user hold stops new mutations and is relayed to every owner.

## Store

When the program outlives one session, create `orchestrate/<slug>/` in the project. The coordinator is the sole writer and updates files at drain points. The store holds facts; it spawns and wakes nothing.

- `orders.md`: numbered standing orders, one constraint per line (verification bar, forbidden paths, stack owner, escalation). Paste it verbatim into every assignment and every continuation. The second time you restate an instruction, append it here first.
- `units.tsv`: `id  track  state  owner  branch  pr  head_sha  brief`. Update rows in place.
- `ledger.tsv`: one verdict per `pr + head_sha`: `live-verified | test-verified | type-check-only | blocked | failed`. A new head SHA voids the row. CI green is evidence for a verdict, not the verdict. `blocked` is not a pass; respawn when the environment heals. `failed` gets a fix unit.
- `frontier.json`: recomputed from `gh` after every merge or restack: ordered PRs, branches, head SHAs, lowest unmerged PR. Report a PR missing from `gh` as missing.
- `inbox/`: completion pointers. `gates.md`: parked human decisions (question, options, default).
- `status.md`: regenerated from `units.tsv` and `ledger.tsv` at each drain.

When one session can finish the work, use [autonomous run](autonomous-run.md) and skip the store.

## Assignment

Each assignment stands alone. An unfillable field means the unit is not scoped yet; scope it before spawning. Collapse the template to a paragraph for a one-command unit.

```
GOAL        one sentence a stranger could execute
SCOPE       paths it may write, paths it may not, its isolated worktree or branch
CONTEXT     file and PR pointers; upstream results pasted in full
ACCEPTANCE  checkable criteria, one per line
VERIFY      exact commands or UI path, known gotchas
TIMEBOX     cap; on expiry return partial findings and stop
FORBIDDEN   rebase, force-push, edits outside SCOPE, plus unit-specific bans
REPORT      status, branch, head SHA, PR, what ran, deviations
ORDERS      <orders.md verbatim>
```

A dependency is a context relay, not only an ordering: paste the upstream result into the downstream assignment.

## Drain

- A completion is a queue event. Append a pointer to `inbox/` and return to the current step. A result that needs review becomes a verifier unit; diffs are reviewed by verifiers, outside the drain.
- Drain at four points: after a critical section (writing an assignment, a stack operation, a ledger write), at a track rollup, on a **wake**, and before reporting to the user. Arrivals during a drain wait for the next one.
- Each drain classifies every pointer (landed, needs-verify, failed, zombie, noise), writes the rows, regenerates `status.md`, and **spawns** the next refill in one message.
- Keep a rolling window of about ten in flight, refilled after each drain.
- When the program runs unattended, arm an hourly **tick** as the heartbeat fallback. Delete it at close.

## Liveness and landing

- **Probe** read-only: the ledger, `units.tsv`, `gh`, pushed branches, the host's status call. **Continue** an agent only to give it new work.
- Retry by failure mode: cap hit or OOM, respawn with smaller scope; network drop, retry as-is; tool error, retry on another model; unknown, retry once. After two failures, abandon the unit and replan around it.
- Reconcile a late zombie against the current frontier and ledger before accepting anything from it.
- Land continuously from the first verified unit. At about 70% of the time budget, stop spawning and land what is verified.
- One stacker per stack owns rebases and retargets; workers push only their own branches.
