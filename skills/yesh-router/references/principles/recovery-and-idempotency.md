# Recovery and idempotency

**Read when:** retries, persistent changes, external effects, restart behavior, or migrations.

- Define what happens after partial completion and repeated delivery. Use a durable identity or reconciliation step when repeating an operation could duplicate its effect.
- A lost response does not prove an external action failed. Inspect authoritative state before retrying when the outcome is unknown.
- Design operations to converge on the same end state however often they run: ask what happens if this runs twice, or if the previous run crashed halfway.
- Distinguish live work from abandoned state using ownership and lifecycle evidence. Age or a PID alone may not prove that cleanup is safe.
- Preserve compatibility for active consumers and stored data. Remove transitional paths only after the relevant callers or data have moved.
- Keep intermediate breakage within an agreed, isolated migration boundary. Do not expose it to live consumers.
- On restart, reconcile the record with live work before proceeding; settle or cancel an old writer before replacing it.
- Exercise the interruption and retry points that threaten the changed invariant.

**Limits:** reconciling *evidence and records* on restart is [evidence-lifecycle](evidence-lifecycle.md); removing the old API once callers move is [migrate-callers](migrate-callers.md).