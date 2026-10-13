---
name: blast-radius
description: Investigate what a change could break beyond its diff and prove the important safety claims.
disable-model-invocation: true
---

# Blast radius

Find the breakage a diff or grep result can miss. Trace the changed behavior through runtime, data, lifecycle, and integration seams, then focus proof on the one or two facts the safety conclusion depends on.

## Investigate

1. Read the diff and changed/deleted symbols. Note behavior that is implicit in types, serialization, timing, flags, generated output, or downstream consumers.
2. Identify the small set of safety facts that make the change safe or unsafe. Look beyond callers: inspect dependency source/version, lifecycle ordering, wire and storage formats, other languages, feature flags, and multi-hop consumers when relevant. When the change removes or replaces an API, format, or behavior, read [migrate-callers](../yesh-router/references/principles/migrate-callers.md).
3. Classify risks by real likelihood and consequence. Separate confirmed risks, checked-and-cleared paths, and unresolved facts. Cite concrete paths/symbols and avoid invented callers.

## Prove

Read [prove-it-works](../yesh-router/references/principles/prove-it-works.md) before choosing proof. A writeup that sounds right reads as convincing whether or not it is true, so prove the facts rather than hand back the argument. Take each safety fact as far down this ladder as is cheap, and say where it stopped:

1. Asserted. Worthless on its own.
2. Cited: a real `file:line`, or the dependency's own source.
3. Reasoned: the failure walked step by step, and it does not reach.
4. Executed: a small script or test that imports the same library version the app ships, calls the exact function in question, and fails loud if the fact is wrong.
5. Reproduced in the running app.

Rung 4 is strong proof but not always cheap; mark facts that stop earlier as unproven. Use [`how`](../how/SKILL.md) or how's [History](../how/SKILL.md#history) view when current mechanics or history changes the risk assessment. Run swarm's [best-of](../swarm/SKILL.md#best-of) branch only for a genuinely wide change where competing reviews add value.

## Report

- **What changed**, including non-obvious behavior.
- **Safety facts**, each with its evidence rung and proof.
- **Risks**, only when a concrete break path exists, with likelihood, impact, location, and check.
- **Cleared and unproven**, so limits are visible.
- **Before merge**, the cheapest check that would catch the material bug.

Use plain language and redact private data. Do not expand into an unrelated review.

## Completion

The review is complete when changed and beyond-grep paths are traced, material risks are classified, key safety facts have executable proof or an explicit unproven status, and the report names the relevant next check.
