# State ownership

**Read when:** a change adds mutable state, lifecycle transitions, caches, cleanup, or concurrent writers.

- Name the authoritative value and the owner allowed to change it. Derive other values instead of synchronizing duplicate state when practical.
- Separate independent write targets before adding coordination. When sharing is necessary, enforce serialization structurally — a lock, transaction, atomic compare-and-swap, exclusive owner, or sequential phase. Instructions and conventions are not concurrency control.
- Give cleanup and cancellation an owner. A worker may remove only state it owns or has proved obsolete.
- Check freshness at the point of use. A cached value, stale handle, or earlier validation may no longer describe the current state.

**Limits:** the structure that models the state is [model-the-domain](model-the-domain.md); failure and restart behavior of state is [recovery-and-idempotency](recovery-and-idempotency.md).