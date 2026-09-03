---
name: maintain-verification-skill
description: Audit and repair a project-local verify-* Pi skill against current source and live behavior. Use when the user asks to maintain or audit a verification skill.
---

# Maintain Verification Skill

Keep one `.pi/skills/verify-*/` skill and its feature map aligned with the current application.

## Scope and outcomes

Edit only the selected verification skill directory. Report product defects without changing product source.

Return exactly one outcome:

- **clean** means every mapped feature received source and live coverage, or a `verified-unreachable` result with the attempted route and unmet prerequisite, with no useful correction.
- **changed** means the verification instructions, harness, or feature map contain proven local corrections.
- **blocked** means coverage could not finish; name the missing prerequisite or failed proof.

## Pass

1. **Locate.** Find the project-local skill with launch, doctor, drive, cleanup, and feature-map instructions. Ask the user to select when several qualify. Point to `create-verification-skill` when none exists.
2. **Index.** Reconcile `features/README.md` with its feature files. Remove dead entries and add only features supported by a concrete registered surface.
3. **Source review.** Account for every feature recipe against current entry points and implementation. Load and follow [`references/agent-routing.md`](../poteto-mode/references/agent-routing.md) when delegation earns its overhead. Require concise source evidence and one proposed live recipe per feature.
4. **Reconcile.** Verify suspected drift and combine overlapping live recipes into the fewest safe application states.
5. **Live pass.** Run the verification skill's doctor check, then exercise every mapped feature at least once. Record `verified-unreachable` only with the attempted route and concrete unmet prerequisite; otherwise incomplete coverage is `blocked`. After a surprising or failed drive, restore a known state and run doctor again. Preserve evidence through every cleanup.
6. **Triage.** Correct documentation drift and harness gaps inside the selected skill. Report broken application behavior as a product defect. Re-drive every harness correction.
7. **Close.** Tear down owned processes and scratch state. Confirm evidence remains. Open a PR only when the user requests it.

## Completion

Complete the pass when every mapped feature has source and live coverage or a `verified-unreachable` result, every correction has been re-driven, product gaps are separated from skill drift, delegated workers are reconciled, cleanup is complete, and the result is classified as `clean`, `changed`, or `blocked`.
