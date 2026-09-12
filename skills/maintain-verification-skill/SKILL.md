---
name: maintain-verification-skill
description: Audit or repair a project-local verification skill against the real application.
---

# Maintain Verification Skill

Keep one project-local `verify-*` skill and its feature map aligned with the current application.

## Scope and outcomes

An audit-only request returns findings without edits. When repair is requested, edit only the selected verification skill directory. Report product defects without changing product source unless the user also requested product repair. The correction steps below apply only within that authority.

Return exactly one outcome:

- **clean** means every feature in the stated scope received source and live coverage, or a `verified-unreachable` result with the attempted route and unmet prerequisite, with no useful correction.
- **changed** means the verification instructions, harness, or feature map contain proven local corrections.
- **findings** means a completed audit found drift or defects that were reported without applying corrections.
- **blocked** means coverage could not finish; name the missing prerequisite or failed proof.

## Pass

1. **Locate.** Find the project-local skill with launch, doctor, drive, cleanup, and feature-map instructions. Ask the user to select when several qualify. Point to `create-verification-skill` when none exists.
2. **Index.** Reconcile `features/README.md` with its feature files. Remove dead entries and add only features supported by a concrete registered surface.
3. **Source review.** Account for each selected feature recipe against current entry points and implementation. Use [`references/agent-routing.md`](../yesh-mode/references/agent-routing.md) when delegation earns its overhead. Require concise source evidence and a proposed live recipe per feature.
4. **Reconcile.** Verify suspected drift and combine overlapping live recipes into the fewest safe application states.
5. **Live pass.** Run doctor, then exercise the mapped features in scope. Record `verified-unreachable` only with the attempted route and concrete unmet prerequisite; otherwise incomplete coverage is `blocked`. After a surprising or failed drive, restore a known state and run doctor again. Preserve evidence through cleanup.
6. **Triage.** Correct documentation drift and harness gaps inside the selected skill. Report broken application behavior as a product defect. Re-drive every harness correction.
7. **Close.** Tear down owned processes and scratch state. Confirm evidence remains. Open a PR only when the user requests it.

## Completion

Complete the pass when the requested coverage is accounted for, corrections are re-driven when authorized, product gaps are separated from skill drift, workers are reconciled, and owned runtime state is cleaned up. Return the applicable outcome above. Report partial corrections under a blocked result. A verified-unreachable feature has evidence of its unmet prerequisite, not proof that its behavior works.
