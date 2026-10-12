# Fix root causes

**Read when:** debugging a reproducible failure, fixing recurring incidents, or after two fixes based on the same assumption fail the same check.

- Reproduce first: if you cannot reproduce it, you cannot verify the fix.
- Ask why until you reach the root cause. Trace the first contract divergence; a guard that silences the symptom is not a fix.
- A workaround that needs a paragraph to justify it is a symptom fix: fix the code, not the comment.
- Check for the pattern, not just the instance; fix all instances within scope.
- When stuck, instrument instead of guessing: read the actual error, add logging.
- On restart failures, suspect stale state before code: config, caches, locks, and serialized state change between runs; code does not.
- After two fixes on one assumption fail the same check, stop patching. Find which actors actually hold the problematic state or effect, test the shared assumption, and revise the model before the next fix.

**Limits:** designing fresh under a new constraint is [redesign-from-first-principles](redesign-from-first-principles.md); restart reconciliation of work is [recovery-and-idempotency](recovery-and-idempotency.md).
