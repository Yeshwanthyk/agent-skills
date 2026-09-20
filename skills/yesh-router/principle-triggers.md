# Principle triggers

The loading map for the shared principle notes. Before a consequential decision, read the notes whose conditions apply — and only those. Each note states its own rules and limits; this map only decides which to load.

| When the decision concerns | Read |
| --- | --- |
| Adding or reshaping code, choosing an abstraction, or reader and maintainer load | [simplicity](../references/principles/simplicity.md) |
| Designing an interface, data shape, or workflow from how it is used | [design-from-usage](../references/principles/design-from-usage.md) |
| Stateful logic, or code that branches on repeating shape assumptions | [model-the-domain](../references/principles/model-the-domain.md) |
| A novel interaction or architecture with several viable approaches | [exhaust-the-design-space](../references/principles/exhaust-the-design-space.md) |
| Repeated fixes that fail on the same assumption | [attack-the-premise](../references/principles/attack-the-premise.md) |
| Integrating a change that an existing design must absorb holistically | [redesign-from-first-principles](../references/principles/redesign-from-first-principles.md) |
| Product, UX, or feature-scope tradeoffs | [experience-first](../references/principles/experience-first.md) |
| Parsing external data, or placing validation and error handling | [boundary-discipline](../references/principles/boundary-discipline.md) |
| Choosing types, or where assertions and casts appear | [type-system-discipline](../references/principles/type-system-discipline.md) |
| Mutable state, caches, cleanup, or concurrent writers | [state-ownership](../references/principles/state-ownership.md) |
| Retries, partial effects, restarts, or migrations | [recovery-and-idempotency](../references/principles/recovery-and-idempotency.md) |
| Removing an API or changing a persistent form | [migrate-callers](../references/principles/migrate-callers.md) |
| Choosing how to perform or prove non-trivial work, not only final verification | [build-the-lever](../references/principles/build-the-lever.md) |
| Sequencing a sweep, migration, or multi-step delivery | [sequence-verifiable-units](../references/principles/sequence-verifiable-units.md) |
| Staged pipelines, publication cursors, or work blocked/replayed because of administrative metadata | [forward-implementation-first](../references/principles/forward-implementation-first.md) |
| Work that could overflow the context window | [guard-the-context-window](../references/principles/guard-the-context-window.md) |
| Restarting work, replacing an agent, or transferring work to a receiver without its context | [handoffs](../references/principles/handoffs.md) |
| Claiming completion, or verifying a change or delegated result | [prove-it-works](../references/principles/prove-it-works.md) |
| Choosing what a test or check should assert | [test-behavior](../references/principles/test-behavior.md) |
| Debugging a reproducible failure or recurring incidents | [fix-root-causes](../references/principles/fix-root-causes.md) |
| Matching proof to a claim, or deciding when evidence is enough | [evidence-discipline](../references/principles/evidence-discipline.md) |
| Resuming prior work or trusting prior records | [evidence-lifecycle](../references/principles/evidence-lifecycle.md) |
| Improving a workflow where a recurring instruction repeats | [encode-lessons-in-structure](../references/principles/encode-lessons-in-structure.md) |

Delegation and sessions follow their own contracts, not principle notes: [delegation](../references/delegation.md) and [session-records](../references/session-records.md).