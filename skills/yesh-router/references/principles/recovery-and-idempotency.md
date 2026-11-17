# Recovery and idempotency

**Read when:** retries, persistent changes, external effects, restart behavior, or migrations.

- Define what happens after partial completion and repeated delivery. Use a durable identity or reconciliation step when repeating an operation could duplicate its effect.
- A lost response does not prove an external action failed. Inspect authoritative state before retrying when the outcome is unknown.
- Design operations to converge on the same end state however often they run: ask what happens if this runs twice, or if the previous run crashed halfway.
- Distinguish live work from abandoned state using ownership and lifecycle evidence. Age or a PID alone may not prove that cleanup is safe.
- Preserve compatibility for active consumers and stored data while they move; when to delete the old path is [migrate-callers](migrate-callers.md).
- Keep intermediate breakage within an agreed, isolated migration boundary. Do not expose it to live consumers.
- On restart, settle or cancel an old writer before replacing it; reconciling the record is [evidence-lifecycle](evidence-lifecycle.md).
- Before removing a gate that blocks progress, establish what it protects: checksums, locks, receipts, and revision IDs often enforce real guarantees. Keep those guarantees and any required review.
- Exercise the interruption and retry points that threaten the changed invariant.

**Limits:** reconciling *evidence and records* on restart is [evidence-lifecycle](evidence-lifecycle.md); removing the old API once callers move is [migrate-callers](migrate-callers.md).