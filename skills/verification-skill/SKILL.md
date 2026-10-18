---
name: verification-skill
description: Create, audit, or repair a project-local verify-* skill that launches, drives, and proves a real application surface, or formally verifies a high-risk property of the code.
disable-model-invocation: true
---

# Verification Skill

A verification skill is a project-local `verify-<app>/` skill that lets a cold agent launch, inspect, drive, and prove one application surface. This skill owns its lifecycle: create one, audit one, or repair one.

**Formal.** When the request is to model-check, prove, or formally verify a property (a race, retry, state machine, parser, or unsafe code), the skill is a `verify-formal-<area>/` instead. Read [formal](references/formal.md): it replaces Create's discovery, generation, and proof, and adjusts Audit and repair. The branches, outcomes, and defect split below still apply.

## Branches

- **Create** when no verification skill covers the surface. Writes only the new skill directory.
- **Audit** when the user asks whether an existing skill still matches the application. Reports findings and edits nothing.
- **Repair** when the user asks to correct an existing skill. Edits only the selected skill directory.

Every branch separates two kinds of failure. A **verifier defect** is wrong launch, doctor, drive, or cleanup instructions, a harness gap, or a stale feature map. A **product defect** is the application misbehaving on a correct drive. Report product defects; change product source only when the user also requested product repair.

## Outcomes

Return exactly one:

- **created** means the new skill passed its proof (Create).
- **clean** means every feature in scope received source and live coverage, or a `verified-unreachable` result, and no correction was useful (Audit, Repair).
- **findings** means a completed audit found drift or defects and reported them without corrections (Audit).
- **changed** means the selected skill now holds proven local corrections (Repair).
- **blocked** means launch, doctor, coverage, or proof could not finish. Name the missing prerequisite or failed proof, and list any partial corrections.

A `verified-unreachable` feature carries the attempted route and the concrete unmet prerequisite. It is evidence of the prerequisite, not proof that the behavior works.

## Runtime rules

These hold in every branch.

- **Drive the real surface.** Use the launched application through its own controls, commands, or endpoints, and capture the initiating action, the observable result, and material side effects.
- **Clean up what the run owns.** Tear down the processes, ports, browser profiles, accounts, and scratch state the run created, after successful and failed attempts alike. Leave everything else in place. Preserve evidence through cleanup and confirm it remains afterwards. When deciding which of these the run owns and how concurrent runs stay apart, read [state-ownership](../yesh-router/references/principles/state-ownership.md).
- **Recover from surprises.** After a surprising or failed drive, restore a known state and run doctor again before the next drive.

## Create

### Discover the verification contract

Inspect the repository before asking the user:

1. **Surface.** Identify the independently driven surface the user touches: web UI, CLI or TUI, desktop app, API, mobile app, or library. Generate one skill per surface that needs distinct controls.
2. **Launch.** Find the authoritative start command, prerequisites, readiness signal, and teardown path. Launch reaches a usable state from an empty data directory, including migrations and seed data. Ready means usable, not that a process answers: a database health check can pass while its init scripts still run. For a short-lived CLI or TUI, launch builds once and each drive starts in its own isolated PTY or tmux session.
3. **Doctor.** Define one read-only check that confirms the intended build, process, endpoint, authentication, and isolated state are safe to drive.
4. **Drive.** Prefer an existing harness. Otherwise use stable semantic controls through the harness's browser or UI tools, exact CLI prompts through a PTY-capable harness, or HTTP requests for a service.
5. **Evidence.** Identify observable proof: actions and resulting UI state, terminal output and exit status, response bodies, logs, or persisted side effects. When the safe path is a dry-run or test mode, observe what it actually skips (files, network, git refs) rather than trusting its name. When choosing what each check asserts, read [test-behavior](../yesh-router/references/principles/test-behavior.md).
6. **Isolation.** Determine how runs separate ports, profiles, data directories, and accounts. State when concurrent driving is unsafe.

When launch or doctor cannot complete, return `blocked`.

### Generate

Write the skill in the repository's configured skill location, with a `verify-<app>` name matching its directory and a description naming the app, the surface, and when to invoke it. Include these sections:

- **Launch**: exact startup, readiness, and teardown.
- **Doctor**: the read-only preflight.
- **Drive**: real commands or stable controls from the repository.
- **Evidence**: the initiating action, observable result, and material side effects.
- **Cleanup**: the owned runtime state to remove and the evidence path to keep.
- **Features**: a pointer to `features/README.md` and its feature recipes, written per [feature-map](references/feature-map.md).

When a launch, doctor, or drive step is repeated or fragile, ship it as a rerunnable script inside the skill and document its invocation; read [build-the-lever](../yesh-router/references/principles/build-the-lever.md) before choosing between script and prose.

### Prove the skill

When proving the generated skill works, read [prove-it-works](../yesh-router/references/principles/prove-it-works.md).

1. Validate frontmatter and every relative reference.
2. Follow the generated launch and doctor instructions.
3. Drive one mapped feature through its real user path.
4. Capture the named evidence and verify material side effects.
5. Run cleanup.
6. Confirm the evidence remains.

When the seed data lacks a precondition a journey needs, the journey reports a failure and the reason goes in that feature's Gotchas; the journey keeps its full assertion. When the proof ran in a stand-in for the real target (a container for a fresh VM, a local stack for a remote one), list every setup step the stand-in did that the target will not; those stay unverified until a run on the real target covers them.

**Done** when a cold reader can follow the skill without placeholders, one mapped feature passes end to end, cleanup leaves no owned runtime residue, and the proof artifacts survive at the documented path. Report the skill path and the feature exercised.

## Audit and repair

Audit skips step 7 and reports `findings` or `clean`. Repair runs every step.

1. **Locate.** Find the project-local skill with launch, doctor, drive, cleanup, and feature-map instructions. Ask the user to choose when several qualify. Switch to Create when none exists and the user wants one.
2. **Index.** Reconcile `features/README.md` with its feature files. Mark dead entries, and propose only features backed by a concrete registered surface, per [feature-map](references/feature-map.md). When prior run summaries or session records must be reconciled against live behavior, read [evidence-lifecycle](../yesh-router/references/principles/evidence-lifecycle.md).
3. **Source review.** Account for each feature recipe in scope against current entry points and implementation, with concise source evidence and a proposed live recipe per feature. Use the [shared delegation contract](../yesh-router/references/delegation.md) when delegation earns its overhead.
4. **Reconcile.** Verify suspected drift and combine overlapping live recipes into the fewest safe application states.
5. **Live pass.** Run doctor, then drive the mapped features in scope. A doctor failure caused by skill drift is drift: in Repair, fix it and retry once before returning `blocked`. Record `verified-unreachable` only with its route and prerequisite; any other gap in coverage is `blocked`.
6. **Triage.** Classify each failure as a verifier defect or a product defect, and list both.
7. **Correct (Repair).** Fix documentation drift and harness gaps inside the selected skill, including the dead and missing index entries. Re-drive every harness correction on the real surface.
8. **Close.** Clean up owned runtime state and confirm evidence remains. Open a PR only when the user requests it.

**Done** when the requested coverage is accounted for, authorized corrections are re-driven, product defects are separated from verifier defects, delegated results are reconciled, and owned runtime state is cleaned up. Return the matching outcome.
