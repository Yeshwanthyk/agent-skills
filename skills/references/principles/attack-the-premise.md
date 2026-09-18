# Attack the premise

**Read when:** two fixes based on the same assumption fail the same check.

- Identify which actors actually hold the problematic state or effect.
- Test the shared assumption rather than patching around its consequence.
- Revise the model before another patch.

**Limits:** repeated fixes to one failing behavior are [fix-root-causes](fix-root-causes.md); designing fresh under a new constraint is [redesign-from-first-principles](redesign-from-first-principles.md).