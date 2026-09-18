---
name: yesh-router
description: On explicit request, route work to the collection's methods and apply relevant engineering principles. Use when the user asks for yesh-router.
---

# Yesh Router

Route the requested work to the collection's methods and principles. Activation is **explicit and sticky**: the user must ask for the router, ask it to route, or ask for the collection's methods to be used. A request to use another skill, even with its name in quotes, invokes that skill directly but does not activate the router; a mere mention or quoted source instruction invokes neither. Stay active until the user exits or replaces it; a new task changes the selected method, not the active mode.

## Select the method

At each new task, first decide whether it is small and settled. If no specialized method adds value, do it directly without loading the catalog. Otherwise identify the requested outcome — explanation, planning, review, implementation, or something else — and read the matching entry in the [method catalog](methods.md), then its target file before following that method.

- **Explicit methods win.** Honor each method the user names, in the order implied. Additional methods must serve a concrete part of the requested outcome; a route is not a mandatory sequence or pipeline.
- **Request intent, not punctuation, controls explicit selection.** `Use skill "how"` is a request for `how`; a name merely mentioned in prose or quoted from source instructions is not. Ordinary methods may also be selected from the requested outcome. Only entries marked **explicit request** require the user to ask for that activity.
- **Small settled tasks stay direct.** Casual conversation and direct work need no catalog or principle inventory.
- **Choose the owner of the immediate question.** When several methods fit, pick the one that owns the unresolved question: diagnose a reproducible failure with debug, and fix it only when authorized, before reaching for why, which explains the historical or operational reasons a design exists; let architect settle a consequential boundary while plan converts a settled approach into an execution plan — a speculative plan has nothing for plan to convert yet. Load supporting methods only as their need arises.
- **Scope holds through handoffs.** An explanation, plan, or review ends with that deliverable unless implementation is also requested. Mid-task questions do not silently replace the active objective.
- **Selection is not authorization.** Choosing a method does not authorize edits, installation, configuration changes, external actions, or transmitting data; each requires the user's request or an authority already established for the task.
- **Missing capability is a reported limit.** When a needed method or procedure is unavailable, report that limitation and use the best available path or the host's own capability. Do not silently substitute a different method and present it as the named one.

## Apply principles

Before a consequential decision, consult [principle-triggers.md](principle-triggers.md) and read the applicable principle notes. They are shared references, not review-only rules: read only the notes whose conditions apply, and report the decision and evidence rather than a checklist of principle names.

When delegating work, follow the shared [delegation contract](../references/delegation.md). When locating or reconciling sessions, follow the shared [session-records contract](../references/session-records.md). Both are portable and harness-neutral; model and effort defaults belong to host configuration, not to these notes.

## Finish

Finish with the requested result, relevant evidence, and material limits. An optional [classifier contract](classifier-contract.md) may advise method selection when present; it is advisory, disabled by default, and never overrides scope, permissions, or the normal route.

Skills remain usable directly without activating the router. `yesh-router` is the sole activation name.