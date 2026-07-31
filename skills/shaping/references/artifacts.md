# Shaping Artifacts

Load this reference before creating or editing shaping documents.

## Artifact roles

| Artifact | Authority |
| --- | --- |
| Frame | Source material, problem, and desired outcome |
| Shaping document | Requirements, shapes, parts, selection, and fit checks |
| Slices document | Slice boundaries, per-slice affordances, wiring, and demos |
| Slice plan | File- and symbol-level implementation detail for one slice |

Every shaping artifact uses:

```yaml
---
shaping: true
---
```

## Frame

A frame contains:

1. **Source** — stakeholder requests, quotations, messages, and scenarios, preserved verbatim.
2. **Problem** — the pain or failure distilled from the source.
3. **Outcome** — observable success without prescribing a mechanism.

Append newly supplied source material to `Source` before revising its interpretation.

## Ripple discipline

Documents are views at different resolution. A decision changed at one level can invalidate the others.

For every edit:

1. Name the artifact whose authority is changing.
2. Find higher-level summaries and lower-level elaborations that depend on it.
3. Update all affected tables, diagrams, demos, and plans in the same operation.
4. Re-read identifiers and cross-references across the artifact set.

Typical ripples:

- A changed shape part updates its breadboard, slice membership, and affected slice plans.
- A slice-plan discovery updates the slice's affordances and any shaping part whose mechanism changed.
- A new requirement updates every current fit check.
- Breadboard feedback changes affordance tables first; diagrams are regenerated from those tables.

## Rendering current state

The shaping document is the active negotiation surface. Keep complete tables in it. Once a shape is selected, lead a resumed session with:

1. a complete-row `R × selected shape` projection with only the selected shape column;
2. undecided requirements and failed cells; and
3. flagged mechanisms or open spikes.

Retain the complete multi-shape comparison as decision history; keep it out of the resumed-session projection once selection has narrowed the active work.

The slices document begins only after the selected shape has a complete breadboard. Individual slice plans begin only after their slice boundaries and demos are stable enough to plan.

## Completion

An artifact edit is complete when identifiers resolve, replicated summaries agree with their authority, derived diagrams match their tables, and no dependent artifact still describes the superseded decision.
