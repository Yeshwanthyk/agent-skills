# Forward implementation first

Use for staged pipelines, migrations, long-running delivery, or a run blocked or replayed because status metadata is missing. Prioritize working output and relevant proof over administrative completion. This is a supporting principle, not another mandatory workflow stage.

## Classify by purpose

For a proposed step, establish its actual effect from contracts and code:

- **Implementation:** creates or connects capability, producers, consumers, schemas, or output.
- **Validation:** checks affected behavior or the downstream dependencies whose results may change (the dependency cone).
- **Bookkeeping:** records progress without changing capability or establishing correctness.
- **Uncertain:** the purpose or consequence is not established; investigate before omitting it.

Prioritize implementation and validation. Omit bookkeeping unless requested or required by the product or delivery contract. Split mixed steps when their obligations differ. A filename is not a classification: checksums, locks, receipts, and revision IDs can enforce integrity, concurrency, recovery, or correct target selection. Preserve those obligations, authorization boundaries, and required reviews.

## Advance on evidence

For staged work, name the publication and cursor owner, the affected dependency cone, and the reason for replay. Changed inputs or revisions, observed defects, incompatible output, or changed dependencies can require replay. A missing progress marker alone does not establish that valid output is wrong.

Choose checks that establish the changed contract: runtime behavior, schema, counts, conservation, consistency, nontruncation, or resource budgets as applicable. Artifact presence and a worker's report alone are not proof. A substantive execution record ties a command and input to its result and expected outcome; missing evidence limits that claim rather than invalidating unrelated work.

If an administrative gate blocks progress, first prove what it protects. Remove or downgrade an admin-only dependency only within authorized scope. A manual stage run must preserve required preconditions, concurrency controls, validation, and safe publication; this principle never authorizes bypassing a gate merely because it looks administrative.

Keep one authoritative owner for publication, cursor movement, and acceptance of each shared result. Consume verified completed dependencies when needed; unrelated workers need not delay them. The host owns scheduling and approval. Report delivered behavior, measured evidence, and literal blockers before status infrastructure.

## Optional action classification

When many proposed steps need triage, Jev may advise using the separate [action-classifier contract](../action-classifier-contract.md). Local judgment is the default; classification adds no required call or completion gate. Method selection remains a separate router concern.

## Source

Concepts informed by [Vuk97/forward-implementation-first](https://github.com/Vuk97/forward-implementation-first/blob/main/SKILL.md). This local policy preserves substantive locks, integrity gates, explicit reviews, and publication permissions rather than adopting unconditional bypass rules.
