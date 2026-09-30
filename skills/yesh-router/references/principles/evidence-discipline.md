# Evidence discipline

**Read when:** matching proof to a claim, choosing checks, reviewing someone's evidence, or deciding whether a check is justified.

- Match proof to the claim: check at the boundary the claim names, and choose the technique that fits the evidence gap — property testing for broad input contracts, fuzz testing for malformed-input boundaries, focused checks for a defect.
- Separate a failed product check from a broken observation method. Report what ran, what passed, and what remains untested.
- Inspect consequential delegated results through their artifacts and relevant checks.
- Stop extending checks once the required evidence exists, unless a failure, new change, or unresolved risk calls for more. Do not demand extra tests merely to satisfy a template.

**Limits:** keeping each check real is [prove-it-works](prove-it-works.md) and [test-behavior](test-behavior.md); whether evidence is still current is [evidence-lifecycle](evidence-lifecycle.md).