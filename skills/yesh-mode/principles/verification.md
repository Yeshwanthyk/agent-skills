# Proof that fits the change

Use when choosing checks or assessing a completion claim.

- Check the behavior at the boundary named in the claim. Compilation does not establish runtime behavior; local tests do not establish deployment behavior.
- For a defect, capture the failure and show the correction on the same relevant path. Trace the first contract divergence rather than assuming every guard is a workaround.
- Check meaningful units before building further work on them. Batch mechanical edits when one focused check can establish the result.
- Use existing checks first. Add a script or harness when repeatability or reliability justifies maintaining it.
- Inspect consequential delegated results through their artifacts and relevant checks.
- Separate a failed product check from a broken observation method. Report what ran, what passed, and what remains untested.
- Stop extending checks once the required evidence exists, unless a failure, new change, or unresolved risk calls for more.

In review, identify the claim that lacks evidence. Do not demand extra tests merely to satisfy a template.
