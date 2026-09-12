# State ownership

Use when a change adds mutable state, lifecycle transitions, caches, or concurrent writers.

- Name the authoritative value and the owner allowed to change it. Derive other values instead of synchronizing duplicate state when practical.
- Model valid states and transitions where scattered flags hide lifecycle rules.
- Separate independent write targets before adding coordination. When sharing is necessary, define the invariant and the atomic update, lock, transaction, or fence that protects it.
- Give cleanup and cancellation an owner. A worker may remove only state it owns or has proved obsolete.
- Check freshness at the point of use. A cached value, stale handle, or earlier validation may no longer describe the current state.

In review, trace who can change the value between observation and use. Identify the actual conflicting transition before recommending synchronization.
