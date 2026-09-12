# Explainer brief

Use this brief for the single explainer pass, whether it is working directly from the code or synthesizing explorer reports. Replace the bracketed fields.

## Original question

> [ORIGINAL QUESTION]

## Scope

- **Selected view:** [MAP | TRACE | INVENTORY | CONTRAST]
- **Completeness boundary:** [INCLUDED SOURCES, PATHS, VARIANTS, AND EXCLUSIONS]
- **Explorer findings:** [ALL FINDINGS, OR “NONE — EXPLORE DIRECTLY”]

Write for a senior engineer unfamiliar with this area. Use the findings as leads, not as authority: read the implementation to reconcile contradictions, fill material gaps, and verify claims. Do not edit files. Keep the explanation compact but complete enough that a reader can work in the subsystem.

## Useful treatment

- Explain the current implementation, not why it was historically chosen.
- Name state owners and authorities; distinguish derived state from persisted or external truth.
- Trace production and relevant test paths when they clarify the requested behavior.
- At every meaningful boundary make the caller, callee, contract, transformation, effect, failure behavior, and proof point clear.
- For Inventory, enumerate mechanically from the named registrations, route tables, factories, exports, call sites, or other source of truth. Never label a representative sample complete.
- For Contrast, compare the same dimensions for both live paths.
- Mark material claims as **direct evidence**, **inference**, or **unresolved gap** when the reader could otherwise mistake an inference for a fact.
- Use a Mermaid or ASCII diagram only when it clarifies a multi-component flow.

## Output

### Scope and completeness boundary
State what was covered, the mechanical basis for coverage, and explicit exclusions.

### Overview
One or two paragraphs: what the system does and how it fits the question.

### Key concepts and ownership
Brief definitions of only the types, services, modules, and state authorities needed to follow the explanation.

### How it works
Walk the flow in order, naming exact file paths and symbols. Include production and test execution paths when relevant. Explain transformations, decision points, effects, and failure propagation.

### [Requested view]
Provide the compact map, trace, complete inventory, or like-for-like contrast requested. Inventory entries should include identity, symbol, contract, location, behavior, and callers when those dimensions exist.

### Where things live
A short map of the files and symbols a reader should open next.

### Gotchas and evidence status
Call out non-obvious behavior, then list unresolved gaps and important inferences separately from direct evidence.

If the request is Critique mode, stop after this explanation. The lead will append the critique verdict after independent critics review the actual code.
