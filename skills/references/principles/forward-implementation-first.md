# Forward implementation first

**Read when:** sequencing staged delivery or migrations, or work is blocked or replayed because progress metadata is missing.

- Classify a step by its actual effect: **implementation** creates capability; **validation** establishes correctness; **bookkeeping** records progress. If the effect is uncertain, investigate before omitting it. Split mixed steps when their obligations differ.
- Prioritize implementation and relevant validation. Omit bookkeeping only when neither the user nor the product or delivery contract requires it.
- A missing progress marker does not invalidate working output. Replay for changed inputs, dependencies, incompatible output, or an observed defect; reuse current, verified results otherwise. Consume completed dependencies without waiting for unrelated work.
- Before removing an administrative gate, establish what it protects. Checksums, locks, receipts, and revision IDs may enforce real guarantees. Preserve those guarantees and required reviews; this principle grants no additional authority.
- Report delivered behavior, evidence, and actual blockers before status infrastructure.

For proof selection, follow [evidence discipline](evidence-discipline.md); for reuse after changes or restart, [evidence lifecycle](evidence-lifecycle.md). When publication or cursor state is shared, apply [state ownership](state-ownership.md); when retrying a partial stage, [recovery and idempotency](recovery-and-idempotency.md).

## Optional action classification

When many proposed steps need triage, Jev may advise using the separate [action-classifier contract](../action-classifier-contract.md). Local judgment is the default; classification adds no required call or completion gate. Method selection remains a separate router concern.

## Source

Concepts informed by [Vuk97/forward-implementation-first](https://github.com/Vuk97/forward-implementation-first/blob/main/SKILL.md). This local policy preserves substantive locks, integrity gates, explicit reviews, and publication permissions rather than adopting unconditional bypass rules.
