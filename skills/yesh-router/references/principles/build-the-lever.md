# Build the lever

**Read when:** choosing how to perform or prove non-trivial work — a sweep of edits, a migration, an analysis, or a check — not only at final verification.

- Produce or reuse a rerunnable codemod, script, generator, query, or check that does or proves the job. A one-off still qualifies when the tool makes the result independently checkable.
- Start with one representative unit, prove the tool against it, and make reruns safe.
- Prefer one deterministic pass over delegates applying the same mechanical recipe.
- Applying this principle produces a file: if the work was non-trivial and no tool or script appeared, it was not applied. Keep the smallest useful tool and its invocation available with the result; a couple of obvious edits can stay direct.

**Limits:** making a recurring instruction into a durable guardrail is [encode-lessons-in-structure](encode-lessons-in-structure.md); verifying what the lever produces is [prove-it-works](prove-it-works.md).