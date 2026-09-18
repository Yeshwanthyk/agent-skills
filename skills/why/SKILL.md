---
name: why
description: Investigate the evidence behind an existing design or past decision.
---

# Why

Explain what forces shaped a decision: requirements, incidents, tradeoffs, rejected alternatives, regressions, or thresholds. Code establishes what exists, not why. Treat the record as incomplete and make confidence visible.

## Anchor the question

Identify the target files, symbols, feature or decision, timeframe, and any hypothesis. Read enough current code to locate the decision and its callers, then gather the historical seed: recent commits, rename history, blame, linked IDs, and nearby tests or docs. State the boundary and snapshot being investigated.

## Choose evidence

Search the sources most likely to answer this question. Source control is usually the starting point; add issue tracking, long-form documents, team chat, observability, error tracking, or analytics when the decision or question calls for them and the current harness exposes them. Do not assume a provider, schema, project, channel, table, or authentication state. Record searches that were unavailable or returned no useful result. The [source playbook index](references/source-playbook.md) and category guides under [sources](references/sources/) are optional adapters, not a required seven-source itinerary.

Delegate a bounded source search when it improves coverage or time, using the [delegation contract](../references/delegation.md). Give each worker one distinct source or question, the code anchor, available tool scope, and the [investigator template](references/investigator-prompt.md). Otherwise investigate directly. Follow material cross-source leads when they are cheap and relevant; leave inaccessible leads as explicit gaps.

## Judge the record

Use [`epistemics.md`](references/epistemics.md) for confidence language. Separate:

- direct statements of rationale;
- supported conclusions where independent clues converge;
- inferences with their evidence chain;
- speculative alternatives;
- unknowns, null results, contradictions, and access or retention limits.

Do not infer intent from code style, a test's existence, or a correlated date. Do not silently substitute evidence about a neighboring feature. Spot-check citations against the underlying artifact before relying on them. Use [`synthesizer-prompt.md`](references/synthesizer-prompt.md) when combining delegated findings or producing a substantial written read.

## Output

Lead with the answer and confidence. Include the question/code anchor, direct and supported evidence with precise citations, reasonable inferences, competing hypotheses when needed, gaps and contradictions, and sources actually consulted. If the investigation precedes implementation, add a separate Preserve / Change / Avoid / Risk constraint set. Keep provider names as examples only.

## Completion

The investigation is complete when the target and boundary are clear, the relevant evidence has been searched or its absence is explained, each material claim has calibrated support and a checkable citation, and unresolved history remains visible. Stop when the question is answered within that boundary; do not search unrelated systems for ceremony.
