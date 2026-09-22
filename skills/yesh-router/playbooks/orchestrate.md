# Orchestrate

Use for a continuing program with dependent units, shared integration, or multiple owners. One bounded task can use [autonomous run](autonomous-run.md).

Use the shared [delegation contract](../../references/delegation.md) for ownership, results, and host-configured role defaults. Reviews use a different agent from the implementation author. When an unresolved question blocks progress, use [architect](../../architect/SKILL.md) for an unsettled design boundary, [blast-radius](../../blast-radius/SKILL.md) for downstream consequences, or [interrogate](../../interrogate/SKILL.md) for a requested or warranted independent challenge. Select the method for that question, then resume coordination.

Coordinate through the current host harness's native subagent tools and supported dispatch, messaging, inspection, steering, waiting, and cancellation capabilities. Use the delegation contract for worker context, parent–child questions and results, runtime choice, and unavailable capabilities. Discover what this harness supports rather than building a parallel coordination mechanism.

For staged output, cursor movement, or metadata-driven replay, apply [forward implementation first](../../references/principles/forward-implementation-first.md) to publication ownership, dependency consumption, and relevant proof. Existing approval and review requirements still apply.

## Coordinate

Define the requested outcome and units with their dependencies and proof. Scout independent unknowns before committing to a costly design. A known path does not need a scout pass.

Keep a short checkpoint when work needs recovery across sessions. Reuse the repository's store or an existing record for unit state, owners, completed results, evidence, and pending decisions.

Dispatch independent units together. Give dependent units the actual completed inputs, not merely an ordering label. Each mutable path has one active writer. Pilot an unfamiliar workflow before scaling it.

Reconcile each completed unit against its artifacts. Review using the shared role defaults, integrate under one owner, and run the relevant integrated checks. A changed patch invalidates evidence that depended on its old behavior. Record failed and blocked units without counting them as delivered.

On restart, reconcile the record with live work and [session evidence](../../references/session-records.md). Settle or cancel an old writer before replacing it. Preserve unrelated work and partial results.

Finish when the requested units are integrated and verified, or identify the exact external blocker. Account for every worker. PR creation and publication require a user request; orchestration itself does not request them.

For requested PR work, follow the repository’s delivery workflow. A user hold stops new mutations and is relayed to every owner.
