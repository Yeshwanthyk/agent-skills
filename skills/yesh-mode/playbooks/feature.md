# Feature

Use for new or changed behavior.

Establish the observable result and inspect the affected contracts and callers. Resolve routine choices from the repository. Use [architect](../../architect/SKILL.md) when an unsettled design choice has a material cost, not simply because code crosses a function boundary.

Implement a coherent slice through the real execution path. Consult [types and boundaries](../principles/types-and-boundaries.md) or [state ownership](../principles/state-ownership.md) when the change depends on those decisions. Delegate independent work when it helps; keep shared writes under one owner.

Exercise the changed behavior and complete relevant repository checks. Fix failures caused by the change and repeat affected checks. Finish the requested result rather than stopping after the first draft. Report the behavior, evidence, and remaining limits.
