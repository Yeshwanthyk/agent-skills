---
name: how
description: Explain current code through execution paths, ownership, inventories, or comparisons.
---

# How

Explain the system that exists now. Build the smallest useful model for the question, grounded in implementation and relevant tests.

## Choose the view

- **Explain** is the default. **Critique** adds an architectural review when the user asks what is weak or should change.
- **Map** covers components, ownership, boundaries, and representative paths.
- **Trace** follows one trigger through calls, events, state changes, and effects.
- **Inventory** enumerates a surface from a named registry, route table, factory, export set, or other source of truth.
- **Contrast** compares two live paths using the same dimensions.

State the interpretation, scope, and completeness boundary when the request could be read more than one way. Keep the work direct for a narrow subject. Delegate independent exploration only when it will reduce risk or time; if you delegate, give each worker a distinct slice and reconcile its artifacts against the code.

## Investigate

1. Locate the entry point, callers, core types, registrations, state owners, persistence or external authorities, and relevant test seams.
2. Follow the path far enough to explain each meaningful boundary: caller and callee, input/output contract, transformation, state authority, side effect, failure or retry behavior, and a concrete proof point.
3. Use the requested view's source of truth. An inventory is complete only within the named mechanical boundary; a sample is not a complete inventory. For a contrast, hold the comparison dimensions constant.
4. Distinguish direct evidence, inference, and unresolved gaps where a reader could mistake interpretation for fact. Reconcile delegated reports and contradictions by reading the implementation.

Use the [agent-routing contract](../yesh-mode/references/agent-routing.md) for delegated roles. The [explorer brief](references/explorer-prompt.md), [explainer brief](references/explainer-prompt.md), [critique rubric](references/critique-rubric.md), and [critic brief](references/critic-prompt.md) are optional aids for their respective tasks.

## Critique

Explain the current design before judging it. Review boundaries, ownership, data model, evolution, complexity, and consistency. Keep findings tied to concrete evidence and consequence. Classify them as action, consideration, observation, or unsupported; an empty critique is valid. Do not propose a rewrite without an evidenced problem.

## Output

Lead with the answer. Include only sections that help:

- scope and completeness boundary;
- overview and key concepts/owners;
- the flow or requested map, trace, inventory, or contrast;
- files and symbols to open next;
- gotchas, evidence status, and unresolved gaps.

Use a small Mermaid or ASCII diagram only when movement across components is hard to follow. Cite exact paths and symbols, with line numbers when available. In Critique mode, append a verdict with severity, evidence, impact, and confidence for each surviving finding.

## Completion

The explanation is complete when it answers the selected view within its stated boundary, names the relevant owners and contracts, traces the material effects and failures, and makes evidence limits clear. A critique is complete when its findings have been checked against the implementation and the verdict distinguishes supported concerns from open questions. Stop when this evidence exists; do not expand into unrelated architecture or history.
