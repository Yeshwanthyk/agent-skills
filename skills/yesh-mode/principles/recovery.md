# Retries and recovery

Use for persistent changes, external effects, restart behavior, and migrations.

- Define what happens after partial completion and repeated delivery. Use a durable identity or reconciliation step when repeating an operation could duplicate its effect.
- A lost response does not prove an external action failed. Inspect authoritative state before retrying when the outcome is unknown.
- Distinguish live work from abandoned state using ownership and lifecycle evidence. Age or a PID alone may not prove that cleanup is safe.
- Preserve compatibility for active consumers and stored data. Remove transitional paths only after the relevant callers or data have moved.
- Keep intermediate breakage within an agreed, isolated migration boundary. Do not expose it to live consumers.
- Exercise the interruption and retry points that threaten the changed invariant.

In review, name the partial state, the next attempt, and the duplicate effect or data loss it could cause.
