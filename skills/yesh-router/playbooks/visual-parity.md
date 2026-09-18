# Visual parity

Use when the user requests exact visual equivalence or a behavior-preserving UI port.

Capture the baseline before changing the implementation. Keep the reference images and comparison settings fixed. Cover the relevant states at matching viewport, font, scale, and rendering conditions.

Migrate a component or coherent group, then compare through image diff. Investigate differences rather than changing the baseline or weakening the comparison to make it pass. Establish any tolerance with the user before using it; exact parity means zero difference under the agreed conditions.

If the environment cannot produce comparable captures, report that blocker and the work already completed. Do not substitute visual judgment for an exact parity claim.

Finish with results for the requested states and artifact locations. Production behavior outside the images still needs its relevant checks.
