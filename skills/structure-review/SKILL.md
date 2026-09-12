---
name: structure-review
description: Review code structure for concrete ownership, contract, and maintainability problems.
---

# Structure review

Assess whether the structure supports the intended behavior without unnecessary coordination or complexity. A review request produces findings. Apply corrections only when implementation is also requested.

Trace enough of the production path and its checks to understand the affected boundary. Inspect failures or adjacent paths when they can change the conclusion.

Use the relevant shared principles to examine a real design choice:

- [Simplicity](../yesh-mode/principles/simplicity.md): does a layer hide useful complexity or merely pass it on?
- [Types and boundaries](../yesh-mode/principles/types-and-boundaries.md): what prevents invalid input or state?
- [State ownership](../yesh-mode/principles/state-ownership.md): who owns each value, transition, and cleanup?
- [Retries and recovery](../yesh-mode/principles/recovery.md): what happens after interruption or repeated delivery?
- [Verification](../yesh-mode/principles/verification.md): what evidence supports the behavior claim?

Read only the notes that help assess the change. Consider other quality concerns when the code and task make them relevant.

Report findings in order of consequence. Each finding needs a code location, a concrete failure or maintenance cost, the smallest useful correction, and a check that would establish it. Distinguish observed problems from plausible risks. Name the condition for revisiting a deferred issue.

Preserve boundaries that serve a real contract. Do not propose a rewrite, abstraction, or style change solely to satisfy a principle. No findings is a valid result; a review need not inventory every sound area.

For a deeper design dispute or source attribution, consult [references.md](references.md).
