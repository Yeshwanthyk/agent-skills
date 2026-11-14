---
name: structure-review
description: Review code structure for concrete ownership, contract, and maintainability problems.
disable-model-invocation: true
---

# Structure review

Assess whether the structure supports the intended behavior without unnecessary coordination or complexity. A review request produces findings. Apply corrections only when implementation is also requested; to restructure a whole area, use [untangle](../untangle/SKILL.md).

Trace enough of the production path and its checks to understand the affected boundary. Inspect failures or adjacent paths when they can change the conclusion.

Use the relevant shared principles to examine a real design choice:

- [Simplicity](../yesh-router/references/principles/simplicity.md): does a layer hide useful complexity or merely pass it on?
- [Boundary discipline](../yesh-router/references/principles/boundary-discipline.md): what prevents invalid input or state at the boundary?
- [Type-system discipline](../yesh-router/references/principles/type-system-discipline.md): do the types make invalid combinations unrepresentable?
- [State ownership](../yesh-router/references/principles/state-ownership.md): who owns each value, transition, and cleanup?
- [Recovery and idempotency](../yesh-router/references/principles/recovery-and-idempotency.md): what happens after interruption or repeated delivery?
- [Prove it works](../yesh-router/references/principles/prove-it-works.md): what evidence supports the behavior claim?

Read only the notes that help assess the change. Consider other quality concerns when the code and task make them relevant.

Report findings in order of consequence. Each finding needs a code location, a concrete failure or maintenance cost, the smallest useful correction, and a check that would establish it. Distinguish observed problems from plausible risks. Name the condition for revisiting a deferred issue.

Preserve boundaries that serve a real contract. Do not propose a rewrite, abstraction, or style change solely to satisfy a principle. No findings is a valid result; a review need not inventory every sound area.

**Slop gate.** When the agent-inbox vault (`$AGENT_INBOX`, default `~/agent-inbox`) has `repos/<repo>/slop-gate.md` for this repository, run `harrow audit . --new-since <base>`, then check the diff against each entry there and the code entries in the vault's `mistakes.md`. Report pass or fail per entry with `file:line`; a fail is fixed before the push or kept on the user's say-so.

For a deeper design dispute or source attribution, consult [references.md](references.md).
