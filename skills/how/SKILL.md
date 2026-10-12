---
name: how
description: Explain how code works or why it was built this way: execution paths, ownership, inventories, comparisons, design critique, or decision history from commits, PRs, issues, and docs.
---

# How

Explain the system that exists now, or the record of how it got that way. Build the smallest useful model for the question, grounded in implementation and relevant tests, or for History, in the written record.

## Choose the view

- **Explain** is the default. **Critique** adds an architectural review when the user asks what is weak or should change.
- **Map** covers components, ownership, boundaries, and representative paths.
- **Trace** follows one trigger through calls, events, state changes, and effects.
- **Inventory** enumerates a surface from a named registry, route table, factory, export set, or other source of truth.
- **Contrast** compares two live paths using the same dimensions.
- **History** answers "why is it built this way" or "why was this decided": the requirements, incidents, tradeoffs, rejected alternatives, regressions, or thresholds that shaped it. Follow [History](#history) instead of Investigate. When the question asks both how it works and why, run Investigate first, then History.

State the interpretation, scope, and completeness boundary when the request could be read more than one way. Keep the work direct for a narrow subject. Delegate independent exploration only when it will reduce risk or time; if you delegate, give each worker a distinct slice and reconcile its artifacts against the code.

## Investigate

1. Locate the entry point, callers, core types, registrations, state owners, persistence or external authorities, and relevant test seams.
2. Follow the path far enough to explain each meaningful boundary: caller and callee, input/output contract, transformation, state authority, side effect, failure or retry behavior, and a concrete proof point.
3. Use the requested view's source of truth. An inventory is complete only within the named mechanical boundary; a sample is not a complete inventory. For a contrast, hold the comparison dimensions constant.
4. Distinguish direct evidence, inference, and unresolved gaps where a reader could mistake interpretation for fact. Reconcile delegated reports and contradictions by reading the implementation. When judging whether a delegated report or a behavior claim is actually proven, read [prove-it-works](../yesh-router/references/principles/prove-it-works.md).

Use the [delegation contract](../yesh-router/references/delegation.md) for delegated roles. The [explorer brief](references/explorer-prompt.md), [explainer brief](references/explainer-prompt.md), [critique rubric](references/critique-rubric.md), and [critic brief](references/critic-prompt.md) are optional aids for their respective tasks.

## History

Code establishes what exists, not why. Take rationale only from records: commits, PRs, issues, docs, chat, incidents. Treat the record as incomplete and make confidence visible.

1. **Anchor the question.** Identify the target files, symbols, feature or decision, timeframe, and any hypothesis. Read enough current code to locate the decision and its callers, then gather the historical seed: recent commits, rename history, blame, linked IDs, and nearby tests or docs. State the boundary and snapshot being investigated.
2. **Choose evidence.** Search the sources most likely to answer this question. Source control is usually the starting point; add issue tracking, long-form documents, team chat, observability, error tracking, or analytics when the decision calls for them and the current harness exposes them. Discover the actual provider, schema, project, channel, table, and authentication state before using one. Record searches that were unavailable or returned nothing useful. The [source playbook](references/history/source-playbook.md) and its category guides are optional adapters, not a required itinerary.
3. **Delegate or investigate directly.** Delegate a bounded source search when it improves coverage or time: give each investigator one distinct source or question, the code anchor, available tool scope, and the [investigator brief](references/history/investigator-prompt.md). Follow material cross-source leads when they are cheap and relevant; leave inaccessible leads as explicit gaps.
4. **Judge the record.** Use [epistemics](references/history/epistemics.md) for confidence language, and label each claim as one of:
   - direct statement of rationale;
   - supported conclusion where independent clues converge;
   - inference, with its evidence chain;
   - speculative alternative;
   - unknown, null result, contradiction, or access or retention limit.

   Intent comes from what someone wrote, never from code style, a test's existence, or a correlated date. Keep evidence about a neighboring feature labeled as such. Spot-check citations against the underlying artifact before relying on them; when judging an investigator's findings, read [prove-it-works](../yesh-router/references/principles/prove-it-works.md). Use the [synthesizer brief](references/history/synthesizer-prompt.md) when combining delegated findings or producing a substantial written read.

## Critique

Explain the current design before judging it. Review boundaries, ownership, data model, evolution, complexity, and consistency. When judging complexity or whether an abstraction earns its place, read [simplicity](../yesh-router/references/principles/simplicity.md). Keep findings tied to concrete evidence and consequence. Classify them as action, consideration, observation, or unsupported; an empty critique is valid. Propose a rewrite only for an evidenced problem.

## Output

Lead with the answer. Include only sections that help:

- scope and completeness boundary;
- overview and key concepts/owners;
- the flow or requested map, trace, inventory, or contrast;
- files and symbols to open next;
- gotchas, evidence status, and unresolved gaps.

Use a small Mermaid or ASCII diagram only when movement across components is hard to follow. Cite exact paths and symbols, with line numbers when available. In Critique mode, append a verdict with severity, evidence, impact, and confidence for each surviving finding.

For History, lead with the answer and its confidence. Include the question and code anchor, direct and supported evidence with precise citations, reasonable inferences, competing hypotheses when needed, gaps and contradictions, and the sources actually consulted. When the investigation precedes implementation, add a separate Preserve / Change / Avoid / Risk constraint set. Keep provider names as examples only.

## Completion

The explanation is complete when it answers the selected view within its stated boundary, names the relevant owners and contracts, traces the material effects and failures, and makes evidence limits clear. A critique is complete when its findings have been checked against the implementation and the verdict distinguishes supported concerns from open questions. A history is complete when the target and boundary are clear, the relevant sources have been searched or their absence is explained, each material claim has a calibrated label and a checkable citation, and unresolved history remains visible. Stop when this evidence exists; stay within the question's system and boundary.
