# Prove it works

**Read when:** choosing how to prove a claim, claiming completion of non-trivial work, verifying a fix or change, or judging someone else's evidence, including a delegated result.

- Check the behavior at the boundary named in the claim. Compilation does not establish runtime behavior; local tests do not establish deployment behavior.
- Choose the technique that fits the gap: generated inputs for a broad contract, fuzzing for a malformed-input boundary, a focused check for a defect.
- Check the real thing, not a proxy: process liveness directly, actual values rather than cached representations, the full chain from input to output. A fake backend, a self-test, or a headless page load does not prove a live-stack or on-screen claim, and agreement with a copy built from the same spec is consistency, not correctness. Label each claim as ran, read, or proxy.
- For a defect, capture the failure and show the correction on the same relevant path. Trace the first contract divergence rather than assuming every guard is a workaround.
- When verification fails, suspect the observation method before the system. Report what ran, what passed, and what remains untested. A count (tests passed, cases matched) comes with the command and path that produced it; when it differs from the last report, name the difference and why.
- Verify delegated work through its artifacts, not self-reports: inspect the actual diff, files, or runtime behavior.
- Stop adding checks once the required evidence exists, unless a failure, a new change, or an open risk calls for more.

**Limits:** what an assertion should say is [test-behavior](test-behavior.md); whether earlier evidence is still current is [evidence-lifecycle](evidence-lifecycle.md).
