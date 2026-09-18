# Prove it works

**Read when:** claiming completion of non-trivial work, verifying a fix or change, or evaluating a delegated result.

- Check the behavior at the boundary named in the claim. Compilation does not establish runtime behavior; local tests do not establish deployment behavior.
- Check the real thing, not a proxy: process liveness directly, actual values rather than cached representations, the full chain from input to output.
- For a defect, capture the failure and show the correction on the same relevant path. Trace the first contract divergence rather than assuming every guard is a workaround.
- When verification fails, suspect the observation method before suspecting the system.
- Verify delegated work through its artifacts, not self-reports: inspect the actual diff, files, or runtime behavior.

**Limits:** choosing the right check and stopping when evidence suffices is [evidence-discipline](evidence-discipline.md); what asserts should say is [test-behavior](test-behavior.md).