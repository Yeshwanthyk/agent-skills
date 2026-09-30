# Fix root causes

**Read when:** debugging a reproducible failure, or fixing recurring incidents.

- Reproduce first: if you cannot reproduce it, you cannot verify the fix.
- Ask why until you reach the root cause. Trace the first contract divergence; do not paper over symptoms with guards or workarounds.
- A workaround that needs a paragraph to justify it is a symptom fix: fix the code, not the comment.
- Check for the pattern, not just the instance; fix all instances within scope.
- When stuck, instrument instead of guessing: read the actual error, add logging.
- On restart failures, suspect stale state before code: config, caches, locks, and serialized state change between runs; code does not.

**Limits:** when the failing assumption itself is wrong, [attack-the-premise](attack-the-premise.md); restart reconciliation of work is [recovery-and-idempotency](recovery-and-idempotency.md).