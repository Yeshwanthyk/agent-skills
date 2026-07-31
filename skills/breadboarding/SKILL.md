---
name: breadboarding
description: Breadboard an operator workflow into Places, UI and code affordances, stores, and explicit wiring. Use when the user asks for a breadboard or affordance map, wants a shaped solution detailed into control/data wiring, provides a visual breadboard to translate, or wants a complete breadboard sliced into demonstrable increments.
---

# Breadboarding

Build a **breadboard**: a concrete model of what an operator can act on, what the system can act on, where state lives, and how effects travel. Affordance tables are authoritative; diagrams are derived views.

## Choose the branch

- **Map an existing system:** load [`references/mapping.md`](references/mapping.md) and trace one operator or caller workflow through live evidence.
- **Detail a shaped solution:** load [`references/designing.md`](references/designing.md) and translate selected shape parts into concrete affordances and wiring.
- **Translate a visual board:** load [`references/whiteboards.md`](references/whiteboards.md) before interpreting stacks, arrows, or tentative marks.
- **Slice for delivery:** confirm the complete breadboard passes [`references/model.md`](references/model.md), then load [`references/slicing.md`](references/slicing.md) and follow that procedure directly.

Mapping and designing may be combined when new mechanisms connect to an existing flow. Produce one end-to-end breadboard across the participating applications and label each boundary.

## Build or translate a breadboard

Use this process for mapping, designing, and visual-board translation. The slicing branch starts from the verified result.

1. **Bound the effect.** State the workflow from the actor's perspective: entry point, action, and observable outcome. Name included systems and explicit omissions.
2. **Build the data model.** Load [`references/model.md`](references/model.md). Identify Places, then enumerate UI affordances, code affordances, and stores using stable `P`, `U`, `N`, and `S` identifiers.
3. **Wire behavior.** Record containment in the Place column, control flow in Wires Out, and data flow in Returns To. Wire navigation to the destination Place.
4. **Trace both stories.** Follow the actor's navigation or call path end to end. Separately trace every displayed or returned value back to its source.
5. **Verify the tables.** Apply every invariant in the model reference. For existing systems, retain file/symbol evidence for each non-obvious row and edge.
6. **Render only as needed.** For a human visual, load [`references/visualization.md`](references/visualization.md) and derive Mermaid from the tables.

## Working rules

- Use concrete names. In an existing system, each affordance resolves to an actual control, symbol, contract, or state location.
- Treat an implementation detail as part of its owning affordance unless it has an independently meaningful trigger, result, or state identity.
- Represent user-visible and caller-visible outputs as boundary affordances.
- Change tables before changing diagrams.
- Feed mechanism discoveries back to the shaping artifacts when they alter a part, fit, requirement, or slice.

## Completion

A breadboard is complete when every in-scope Place and affordance has one stable identity, every edge has a known direction, every data-bearing output has a source, every store has a writer and reader or an explicit boundary role, every navigation/call path reaches its declared outcome, and the tables pass the branch-specific evidence checks.
