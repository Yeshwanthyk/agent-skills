---
name: shaping
description: Shape unsettled product or system work through negotiated requirements, competing solution shapes, fit checks, and a selected mechanism. Use when the user wants to define a problem and explore approaches together, or when a proposed approach still has unresolved needs or mechanisms.
---

# Shaping

Shape the **problem and solution together**. Keep requirements independent from mechanisms so either side can correct the other.

## Process

1. **Recover the current state.** When the work will read, create, or edit a frame, shaping document, slices document, or slice plan, load [`references/artifacts.md`](references/artifacts.md). Identify any current requirements, shapes, selection, open decisions, and document ripple surface.
2. **Choose the entry point.** Start from requirements when the user brings pain, constraints, or outcomes. Start from a shape when the user brings a mechanism. When neither is clear, offer those two entry points.
3. **Negotiate requirements and shapes.** Maintain the R/S decision model in [`references/decision-model.md`](references/decision-model.md). Requirements state needed outcomes; shape parts state concrete mechanisms. Capture one side only as far as the conversation supports, then use it to expose gaps in the other.
4. **Run fit checks.** Compare each live shape against every requirement. Turn implicit objections into standalone requirements, and turn unsupported claims into flagged unknowns.
5. **Resolve consequential unknowns.** When repository evidence can settle a mechanism, investigate it. For a bounded investigation artifact, use [`references/spikes.md`](references/spikes.md). Feed discoveries back into requirements, shapes, and fit checks in the same change.
6. **Select and detail.** Select a shape when its required outcomes pass and its critical mechanisms are understood. Invoke `breadboarding` to turn the selected shape into Places, affordances, stores, and wiring.
7. **Prepare delivery only when requested.** Once the selected shape has a complete breadboard, use breadboarding's slicing branch to derive demonstrable vertical increments.

## Collaboration

- Render complete requirement and shape tables. During comparison, render every live shape in the fit check.
- Mark added or changed table cells with `🟡` on each rerender so the user can scan the delta.
- When resuming after selection, project every requirement against only the selected shape, then show unresolved requirements first. Preserve the full comparison in the artifact history.
- Preserve R/S identifiers across revisions so decisions retain an audit trail.
- Keep the user as the decision owner. Propose requirements and mechanisms explicitly for acceptance or correction.

## Completion

A shaping cycle is ready to hand off when:

- every requirement is standalone and has a negotiated status;
- the selected shape describes mechanisms rather than restating requirements;
- every required fit is explicit and every failure has a short reason;
- critical unknowns are resolved before selection; any unresolved spike remains an explicit selection blocker;
- the selected shape has a breadboard before slicing begins; and
- every affected artifact agrees with the current decision state.

If the user pauses before selection, return the full current tables plus the smallest unresolved decision that would move shaping forward.
