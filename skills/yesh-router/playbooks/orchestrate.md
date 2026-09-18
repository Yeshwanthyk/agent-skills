# Orchestrate

Use for a continuing program with dependent units, shared integration, or multiple owners. One bounded task can use [autonomous run](autonomous-run.md).

Use the shared [delegation contract](../../references/delegation.md) for ownership, results, and host-configured role defaults. Reviews use a different agent from the implementation author. Escalate to a high-level audit when requested or when an unresolved architectural or cross-cutting question needs it.

## Coordinate

Define the requested outcome and units with their dependencies and proof. Scout independent unknowns before committing to a costly design. A known path does not need a scout pass.

Keep one durable program record when work needs recovery across sessions. Use the repository's store if present; otherwise a short local record can hold unit state, owners, consumed handoffs, evidence, and pending decisions.

Dispatch independent units together. Give dependent units the actual completed inputs, not merely an ordering label. Each mutable path has one active writer. Pilot an unfamiliar workflow before scaling it.

Reconcile each completed unit against its artifacts. Review using the shared role defaults, integrate under one owner, and run the relevant integrated checks. A changed patch invalidates evidence that depended on its old behavior. Record failed and blocked units without counting them as delivered.

On restart, reconcile the record with live work and [session evidence](../../references/session-records.md). Settle or cancel an old writer before replacing it. Preserve unrelated work and partial results.

Finish when the requested units are integrated and verified, or identify the exact external blocker. Account for every worker. PR creation and publication require a user request; orchestration itself does not request them.

## PR delivery branches

Use these branches only for requested PR work. Planning-only requests end with the plan. Follow the repository’s workflow for the authorized external stages. A user hold stops new mutations and is relayed to every owner.

- **Independent queue:** record each item's authorized endpoint, including operator-owned items that stop at merge-ready. Attach review verdicts to head, base, and patch identity; refresh affected evidence after changes. Finish with completed items and explicit unfinished work.
- **Linear stack:** one coordinator owns topology. Give each writer its exact parent state and append a PR only after the parent exists and the unit has a supported verdict. Record parent, base, head, and patch identity. Apply authorized topology changes bottom-up using the configured forge and safe leases for rewritten pushes. Recheck affected behavior after patch or dependency changes, and mergeability and required checks after rewrites. Report topology conflicts to the coordinator. A request to build a stack ends with the ordered stack and verdicts; landing or automatic merge requires separate authority.
