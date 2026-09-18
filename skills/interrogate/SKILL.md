---
name: interrogate
description: Use independent reviewers to challenge a design or change and return an evidence-checked judgment.
---

# Interrogate

Run independent adversarial reviews of the same intent and artifacts. The coordinator's evidence-based judgment decides the outcome; agreement alone is not proof.

Identify the requested diff or design and its intended behavior. Use the [delegation contract](../references/delegation.md) for reviewer roles, isolation, and result accounting. Choose review count from useful independent coverage and available capacity. Label a single-review fallback honestly.

Give reviewers the same intent, relevant artifacts, and read-only scope using the [reviewer brief](references/reviewer-prompt.md). Select the relevant [risk rubric](references/rubric.md) and [code-quality lens](references/code-quality-review.md). Reviewers can inspect surrounding code to test a claim.

Reconcile findings against the implementation and its contracts using the [lead-judgment guidance](references/lead-judgment.md). Deduplicate equivalent claims, retain strong lone findings, and reject unsupported consensus.

Report actionable findings with locations, consequences, and correction shapes. Distinguish issues to fix, decisions to consider, and dismissed claims where their rejection matters. Name the review scope, achieved independence, and gaps.

A review-only request ends with findings. If the user also requested corrections, apply supported in-scope fixes and check them. Do not turn an explicit fix request into another planning-only handoff.
