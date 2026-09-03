---
name: how
description: Explain how code works, walk through production or test execution paths, map ownership and layering, inventory registered surfaces, contrast live paths, or critique current architecture. Use for ordinary “how does X work?” questions and code walkthroughs before changes. Use why for historical, product, or operational rationale.
---

# How

Explain the current system from live implementation evidence. Build a working mental model for a senior engineer; do not produce annotated source code or historical rationale.

## Route the request

Choose the mode first:

- **Explain** (default): answer how something works.
- **Critique**: explain first, then independently review the architecture when the user asks for problems, architectural issues, weaknesses, or improvements.

Choose the view that best fits the request:

- **Map**: subsystem shape, owners, boundaries, and representative production and test paths.
- **Trace**: one trigger through calls, events, queues, state changes, and effects.
- **Inventory**: the complete registered or callable surface within an explicit mechanical boundary.
- **Contrast**: compare two live paths across the same dimensions.

A request may combine a mode and view, such as “trace checkout and critique the design.” If the scope is ambiguous, state the best-guess interpretation and proceed; let the user redirect it.

## Delegate without coupling to a provider

Load and follow the shared [agent-routing contract](../poteto-mode/references/agent-routing.md) when delegation is useful. Request read-only execution when the runtime supports it. Keep delegation optional. If it is unavailable, do the same work directly and report the limitation.

- **Simple** means one module, utility, symbol, or narrow path. Use one explainer in a single pass, or perform that pass directly.
- **Complex** means a subsystem spanning multiple files or services, a cross-cutting feature, or a broad map, inventory, or contrast. Split the work into 2–4 distinct exploration angles and run them in parallel when possible, then give all findings to one explainer for synthesis.

For delegated work, use [the explorer brief](references/explorer-prompt.md) and [the explainer brief](references/explainer-prompt.md). Keep each angle distinct: useful splits include data and state, production request path, asynchronous or external effects, configuration and test seams. Explorers may overlap, but the explainer owns reconciliation and must check contradictions against the code.

## Explain

1. **Frame the scope.** Name the subject, selected view, included entry points and variants, and an explicit completeness boundary. For an inventory, name the registration mechanism, source paths, and what “complete” means. State exclusions and the code snapshot being described when they matter.
2. **Find the system.** Locate entry points, core types, state owners, persistence and external systems, registrations, callers, and test seams from live artifacts. Follow actual implementations, not filenames or assumptions.
3. **Trace representative paths.** Cover at least one production path and its relevant test path when they exist. For a trace, follow the requested trigger end to end. At every meaningful caller/callee or system boundary, record:
   - caller and callee;
   - input/output contract;
   - data or state transformation;
   - state owner and persistence authority;
   - side effects and external interactions;
   - failure, retry, fallback, and propagation behavior;
   - a proof point: file, symbol, registration, test, log, or other artifact.
4. **Cover the requested view.** Enumerate inventories mechanically from registrations, route tables, factories, exported symbols, call sites, or another named source of truth; do not call a sample complete. For contrasts, hold the dimensions constant. Label every material statement as **direct evidence**, **inference**, or **unresolved gap** when its status is not obvious.
5. **Synthesize.** Reconcile overlapping or conflicting findings by reading the implementation. Prefer the smallest explanation that accounts for the paths, ownership, boundaries, transformations, effects, failures, and proof points.

## Critique

Run the complete Explain flow before reviewing architecture. Then fan out one read-only critic per configured critic slot through the managed subagent runtime when available; if no critic configuration is exposed, use at least two independent critics when capacity permits. Each critic receives the explanation, relevant file paths, and [the critique rubric](references/critique-rubric.md), then reads the code to form an independent judgment rather than merely accepting the explanation. Use [the critic brief](references/critic-prompt.md); do not hard-code providers, model names, configuration paths, or transcript locations.

Act as the lead after the critics return. Reconcile duplicate findings and disagreements against the code, then classify each surviving point:

- **Act on** — an architectural problem worth fixing now;
- **Consider** — a real concern whose cost or timing is unclear;
- **Noted** — a valid, low-priority observation;
- **Dismissed** — wrong, unsupported, or an intentional tradeoff with adequate benefit.

Critique architecture, boundaries, data models, evolution, complexity, and consistency—not line-level bugs or taste. An empty critique is valid. Do not propose a rewrite without evidence of a problem and a concrete consequence.

## Output contract

Lead with the human explanation, then the requested view. Adapt or omit sections that do not apply:

1. **Scope and completeness boundary** — what was covered, what was not, and how coverage was established.
2. **Overview** — one or two paragraphs explaining what the system does and why it matters to the path.
3. **Key concepts and ownership** — important types, services, modules, state owners, and authorities.
4. **How it works** — the flow in prose, with a Mermaid or ASCII diagram only when it clarifies multi-component movement.
5. **Requested view** — compact map, trace, mechanically complete inventory, or like-for-like contrast.
6. **Where things live** — only the files and symbols a reader needs to continue.
7. **Gotchas and evidence status** — non-obvious behavior, direct evidence, inferences, and unresolved gaps.

Reference exact file paths and symbols, with line numbers when available. For each inventory item include identity, symbol, contract, location, behavior, and callers when those dimensions exist. For traces and maps, make the proof points followable rather than attaching unsupported citations.

In Critique mode, put the explanation first and then add **Critique verdict** with categorized findings. Each non-dismissed finding includes severity, components, architectural finding, concrete evidence, and impact; include dismissed points with the reason only when doing so resolves a meaningful disagreement.

## Completion

**Explain is complete** only when the stated boundary is covered: the selected view is answered; representative production and relevant test paths are traced where available; state ownership and meaningful boundaries name contracts, transformations, effects, failures, and proof points; inventories are mechanically exhaustive within their named source of truth; and direct evidence, inference, and unresolved gaps are separated.

**Critique is complete** only when Explain is complete, every planned independent critic has returned or its unavailability is recorded, findings have been checked against the implementation and reconciled by the lead, and the final verdict classifies actionable, uncertain, low-priority, and unsupported points. Do not imply architectural confidence beyond the evidence boundary.
