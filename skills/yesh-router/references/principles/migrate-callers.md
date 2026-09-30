# Migrate callers

**Read when:** removing an API, format, or behavior, or changing a persistent form.

- Remove an old internal API once its callers have migrated and no external contract needs it; do not keep compatibility layers alive only because internal callers remain.
- Inventory callers, migrate them, and delete the old path in the same refactor wave when the project can absorb it.
- Treat temporary adapters as exceptional and time-boxed, not default architecture.
- Update tests to assert the new contract; delete tests that only protect pre-refactor implementation details.

**Limits:** preserving compatibility through a transition is [recovery-and-idempotency](recovery-and-idempotency.md).