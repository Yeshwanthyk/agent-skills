---
name: figure-it-out
description: Design and run a custom workflow for a large task that has no suitable playbook.
---

# Figure it out

Create the smallest workflow that makes an unfamiliar, cross-cutting task tractable and reviewable. Use a focused playbook when one fits; use this skill for a genuinely bespoke run, not as a mandatory umbrella for ordinary work.

## Frame

Write a checkable outcome, scope and exclusions, known blockers, and a rigor level proportional to risk. Decide what evidence would make the result complete and whether a human checkpoint is needed for a material product, authority, or irreversible choice. Continue routine reversible work without waiting for approval.

## Shape the workflow

Break the task into meaningful units with a clear dependency order. Sequence the riskiest unknown early. Choose a baseline and a check that can distinguish old behavior from new behavior when applicable. Decide what can be delegated: parallelize only independent slices with explicit ownership; keep shared mutable state under one owner. Use [`architect`](../architect/SKILL.md) for an unsettled boundary, [`arena`](../arena/SKILL.md) for competing complete candidates, or [`swarm`](../swarm/SKILL.md) for one bounded coverage pass when those methods genuinely fit. These are options, not a chain.

Record the workflow in the task's existing checklist, plan, or decision trail. Read [`show-me-your-work`](../show-me-your-work/SKILL.md) when a long-running or unattended task needs its durable audit format.

For staged workflows or administrative blockers, apply [forward implementation first](../references/principles/forward-implementation-first.md) to select meaningful units and bound replay.

Consider Jev for disputed or repetitive action classification when it can replace a larger reasoning pass. Use bounded source-grounded evidence and the [action-classifier contract](../references/action-classifier-contract.md); invoke only when enabled and transmission is approved, and retain local judgment over scope and execution.

## Run and adapt

For each meaningful unit, state the hypothesis or intended observable result, make the smallest change, inspect the artifact, and run the relevant check before building on it. Use the [evidence-discipline principle](../references/principles/evidence-discipline.md) to match proof to the claim. A unit can be marked verified, not verified, or inconclusive; an observation-method failure is not a product pass. If a plan changes because evidence disagrees, record the decision and continue from the new constraint.

Use the [delegation contract](../references/delegation.md) for delegated roles and reconcile their artifacts. Remove temporary probes. Keep the task within its stated scope and stop when the outcome is proven or a concrete blocker requires a decision.

## Close

Check the whole result against the original outcome on the relevant product or artifact, not merely a proxy. Add a lasting check for a recurring failure only when it serves this task. Record migration, recovery, rollback, or residual uncertainty when relevant. Do not claim live or publication proof that did not occur.

## Output

Return the chosen workflow, scope and rigor, units and ownership, evidence for each meaningful unit, whole-result verdict, audit-trail location when one exists, and remaining limits. Keep the handoff concise enough for a cold restart.

## Completion

The run is complete when the bespoke workflow was recorded, its meaningful units have evidence or explicit blockers, the whole result has a verdict against the stated outcome, and a later reader can resume without reconstructing hidden context.
