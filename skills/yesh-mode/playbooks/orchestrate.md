# Orchestrate

Use for a continuing program with dependent units, shared integration, or multiple owners. One bounded task can use [autonomous run](autonomous-run.md).

Use the shared [agent-routing contract](../references/agent-routing.md) for model defaults, ownership, and results. Reviews use a different agent from the implementation author. Escalate to a high-level audit when requested or when an unresolved architectural or cross-cutting question needs it.

## Coordinate

Define the requested outcome and units with their dependencies and proof. Scout independent unknowns before committing to a costly design. A known path does not need a scout pass.

Keep one durable program record when work needs recovery across sessions. Use the repository's store if present; otherwise a short local record can hold unit state, owners, consumed handoffs, evidence, and pending decisions.

Dispatch independent units together. Give dependent units the actual completed inputs, not merely an ordering label. Each mutable path has one active writer. Pilot an unfamiliar workflow before scaling it.

Reconcile each completed unit against its artifacts. Review using the shared role defaults, integrate under one owner, and run the relevant integrated checks. A changed patch invalidates evidence that depended on its old behavior. Record failed and blocked units without counting them as delivered.

On restart, reconcile the record with live work and [session evidence](../references/session-records.md). Settle or cancel an old writer before replacing it. Preserve unrelated work and partial results.

Finish when the requested units are integrated and verified, or identify the exact external blocker. Account for every worker. PR creation and publication require a user request; orchestration itself does not request them.
