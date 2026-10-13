# Review rubric

Apply only the lenses that fit the change.

## Correctness

Check the happy and sad paths, empty and boundary inputs, error propagation, state ownership, stale references, retries, idempotency, and concurrent access. If a rerun or a crash halfway leaves the outcome depending on leftover state, a reconciliation step is missing. Concurrent access to shared state should be serialized by structure (locks, phases, exclusive ownership), not by convention. Trace the call chain before claiming a bug.

## Root cause

Check whether the change fixes the mechanism or masks the symptom. Question guards, retries, casts, and comments that hide a broken contract. Prefer types, tests, schemas, or runtime checks when they can make the wrong behavior impossible.

## Structural integrity

Check validation at boundaries, abstraction level, dependency direction, data-model fit, coupling, ownership, and whether new behavior is integrated rather than bolted on. When an internal API replaces another, migrate callers and remove the old path when no external consumer requires it.

## Verification

Check tests at stable behavior boundaries, a regression proof for bug fixes, integration proof for boundary changes, and real artifact verification for delegated or asynchronous work. Flag proxies and self-reported success when the real result was not checked.

For broad input/transition contracts or malformed-input boundaries, use the [prove-it-works principle](../../yesh-router/references/principles/prove-it-works.md) to assess whether property or fuzz testing with [invariants](../../invariants/SKILL.md) would address a concrete evidence gap. Check the oracle, explored domain, run budget, and replay evidence when those techniques are used.

## Complexity

Check for needless layers, one-call abstractions, configuration for nonexistent cases, dead code, duplicated helpers, and avoidable sequential orchestration. Every feature, control, and option should earn its place; a half-finished feature is worse than a missing one. Prefer the smallest structure that keeps behavior clear and correct.

## Security

Flag only traceable issues. Follow untrusted input to a dangerous sink, authentication or authorization gap, secret exposure, or time-of-check-time-of-use race. Explain the reachable path.
