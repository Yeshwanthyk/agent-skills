---
name: yesh-router
description: When the user activates yesh-router, select workflows and supporting skills from their goals and apply relevant engineering principles throughout the task.
---

# Yesh Router

Route the requested work to the collection's methods and principles. Activation is **explicit and sticky**: the user must ask for the router, ask it to route, or ask for the collection's methods to be used. A request to use another skill, even with its name in quotes, invokes that skill directly but does not activate the router; a mere mention or quoted source instruction invokes neither. Stay active until the user exits or replaces it; a new task changes the selected method, not the active mode.

## Select the method

**PR descriptions always take the visual route.** Whenever authorized work reaches PR creation or a PR description update, including during another method, read [show-me](../show-me/SKILL.md) and follow its [visual PR workflow](../show-me/references/visual-pr.md). Apply this even when the rest of the task is direct, for every change type. Publish a structural change outline in the PR body and verify it by reading the body back. This route does not authorize PR creation or publication on its own.

On activation, read the [method catalog](methods.md) and consider the host's available skill names and descriptions, including project-local skills. The catalog owns this collection's selection criteria; the host catalog supplies other installed capabilities. Reuse that inventory while it remains current. Read only the entrypoints and references selected for the work.

At each task, infer the desired outcome and immediate unresolved question from the user's request and current evidence. Select a main workflow when one fits, plus supporting skills for concrete parts of the work. Users need not name ordinary methods or supporting skills. State the selected workflow and why briefly; ask only when a missing goal, constraint, or consequential choice would change the work.

- **Explicit methods win.** Honor each method the user names, in the order implied. Additional methods must serve a concrete part of the requested outcome; a route is not a mandatory sequence or pipeline.
- **Request intent, not punctuation, controls explicit selection.** `Use skill "how"` is a request for `how`; a name merely mentioned in prose or quoted from source instructions is not. Ordinary methods may also be selected from the requested outcome. Only entries marked **explicit request** require the user to ask for that activity.
- **Direct work remains an option.** After considering the available descriptions, do settled work directly when no specialized guidance adds value. Task size alone does not rule out a skill. Casual conversation needs no routing ceremony.
- **Compose only what the work needs.** Use the catalog's criteria to choose the owner of the immediate question. Supporting skills may come from this collection or the host's installed catalog; this collection is not an allowlist. Follow each skill's invocation constraints. When a workflow owns a procedure, follow it before adding another method for the same work.
- **Scope holds through handoffs.** An explanation, plan, or review ends with that deliverable unless implementation is also requested. Mid-task questions do not silently replace the active objective.
- **Selection is not authorization.** Choosing a method does not authorize edits, installation, configuration changes, external actions, or transmitting data; each requires the user's request or an authority already established for the task.
- **Missing capability is a reported limit.** When a needed method or procedure is unavailable, report that limitation and use the best available path or the host's own capability. Do not silently substitute a different method and present it as the named one.

## Run the selected method

Follow the selected document's steps and completion criteria. For multi-step work, track the applicable steps and their proof in the host's plan or a concise checklist, reusing an existing one. Explain a skipped step when it changes the promised outcome or proof. Selecting or reading a method is the start of its work, not its completion.

For settled implementation, read [change shape](../plan/references/change-shape.md) when adding behavior versus preserving it affects the work or proof. Use the relevant contract before editing; this is direct implementation, not a separate planning assignment.

Revisit the catalog and available skill descriptions when inspection changes the next question or work reaches a new stage. Select additional guidance by its stated conditions, read it, and resume the active objective with completed work and valid evidence intact. Reuse instructions already in context. New facts can also trigger a principle without changing the method.

After a context gap or handoff, recover router activation, the selected workflow and supporting skills, the current step, and outstanding proof alongside the objective and authorization. Reconcile completed evidence before continuing. A stage change does not restart the whole workflow.

## Apply principles

Before a consequential decision, consult [principle-triggers.md](principle-triggers.md) and read the applicable principle notes. They are shared references, not review-only rules: read only the notes whose conditions apply, and report the decision and evidence rather than a checklist of principle names.

When delegating work, follow the shared [delegation contract](../references/delegation.md). When locating or reconciling sessions, follow the shared [session-records contract](../references/session-records.md). Both are portable and harness-neutral; model and effort defaults belong to host configuration, not to these notes.

## Finish

Finish with the requested result, relevant evidence, and material limits. An optional [classifier contract](classifier-contract.md) may advise method selection when present; it is advisory, disabled by default, and never overrides scope, permissions, or the normal route.

Skills remain usable directly without activating the router. `yesh-router` is the sole activation name.
