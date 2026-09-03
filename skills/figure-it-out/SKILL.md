---
name: figure-it-out
description: Design and run an auditable playbook for a large or cross-cutting task when no focused playbook fits, especially work reviewed after the agent steps away. Use for /skill:figure-it-out or an explicit “figure it out” request.
---

# Figure it out

When the task matches no playbook, design one. The deliverable before code is the workflow itself. It is a sequence of phases that scales rigor to the task, runs the scientific method, and leaves a decision trail a human can audit after stepping away. Bias toward more rigor. The cost of building the wrong thing dwarfs the cost of being careful.

Do not reinvent a playbook that already fits. A focused task routes to its known playbook, such as Bug fix, Perf, Feature, Visual parity, or Eval. A settled multi-phase checklist routes to the Multi-phase plan playbook. A large or cross-cutting version of one, such as a migration across many call sites or an ambitious multi-part change, belongs here when it needs a bespoke workflow. Work a human reviews after stepping away belongs here when it needs a bespoke audit trail.

This is one bounded run. In Poteto Mode, use the [`orchestrate` playbook](../poteto-mode/playbooks/orchestrate.md) for a continuing project with dependencies, shared integration, many stacked changes, or repeated coordination across sessions. Use [`swarm`](../swarm/SKILL.md) for one bounded parallel coverage or solution-race pass. Use [`arena`](../arena/SKILL.md) for competing candidates with base selection and grafting. Figure It Out owns the custom workflow, hypothesis loop, audit trail, and whole-result proof.

## Delegation contract

Load and follow the shared [agent-routing contract](../../references/agent-routing.md). Request isolated ownership for parallel work and read-only execution for investigation or judging when the runtime supports those capabilities. If a capability is unavailable, continue directly or record the limitation. The parent owns the workflow, audits delegated artifacts, and performs final verification.

## Start

Read the active [`poteto-mode`](../poteto-mode/SKILL.md) skill first. Read its Principles section in full. Use the harness task list when one exists. Otherwise keep the phases below as a numbered checklist in the working response or decision trail.

## Phase A: Frame

Ground first, then commit. Do not start the run until you can state all three items.

- The definition of done as a falsifiable predicate, per the Prove It Works principle. “Done well” must be checkable.
- Scope, quantified as rough units and effort, plus the blockers grounding surfaced. Raise blockers before spending hours, not after fifty doomed commits.
- The rigor level, biased high. One-way doors and high blast radius get more rigor. Reversible low-stakes steps get less. Rigor is gates and artifacts, not “try harder”.

Present the framing and tradeoffs before committing to a long run. Reversible work proceeds under the Never Block on the Human principle, but a multi-hour run earns one checkpoint. Respect explicit user constraints and permission gates.

**Phase A is complete when** the falsifiable predicate, quantified scope, blockers, rigor level, and checkpoint are written down.

## Phase B: Design the workflow

Decompose into atomic, independently landable units. Sequence the riskiest unknown first so option value stays high. Scaffold and verification come before features, per the Foundational Thinking principle.

- Build the verification harness before the work, with the baseline captured from the pre-change state. The check must read as old value versus new value.
- For a one-way-door design decision, use [`architect`](../architect/SKILL.md). It may use Arena with diverse, isolated candidates and a read-only judge on a different model family. Skip architecture exploration for mechanical work whose shape is already concrete, and record the skip reason. A second arena over a settled design is over-engineering, per the Laziness Protocol.
- Decide what fans out. Parallelize only across genuine seams. Give each worker its own worktree, branch, or task-scoped directory. Do not make concurrent workers share a mutable write target.
- Write the designed phase list down. That list is what the human reviews.

Then put the design into motion. Add the designed steps to the active checklist between Phases C and D. Run each under the Phase C loop discipline. Log each step as it lands rather than saving the trail for the end.

**Phase B is complete when** the ordered units, baseline verification, fan-out ownership, and written phase list are ready to run.

## Phase C: Run the loop

Each unit is an experiment. State the hypothesis, make the smallest change, measure against the predicate on the real artifact, keep it if it advanced, and revert it if it did not.

Apply the Sequence Work into Verifiable Units principle. Verify each unit before starting the next instead of batching checks at the end.

- Verify by inspecting the artifact, never a self-report. When something passes too easily, suspect the observation method before the system. A blank screenshot passes a lazy gate.
- Pair delegated work with a judge and audit delegated artifacts yourself before trusting them. If a worker games the gate, reset and harden the contract. If the gate is wrong, fix the gate in its own change rather than routing around it.
- A verdict is `VERIFIED`, `NOT VERIFIED`, or `INCONCLUSIVE`. Inconclusive is not a pass. Do not hide a negative.

**Phase C is complete when** every unit has a verdict and evidence, and no next unit began before the current unit was verified.

## Phase D: Keep the audit trail

Load and follow [`show-me-your-work`](../show-me-your-work/SKILL.md). It is the sole contract for the trail format, append rules, audit, and independent review.

**Phase D is complete when** that skill's completion criterion is met for this run.

## Phase E: Verify and hand back

Check the whole against the Phase A predicate on the real product or artifact, not only the harness. Encode any recurring correction as a gate, lint rule, check, or script, per the Encode Lessons in Structure principle, so the win cannot silently regress.

**Phase E is complete when** the whole result has a real verdict against the Phase A predicate and recurring corrections have been encoded or explicitly left open.

## Outputs

Return the playbook you designed, the rigor level and why, the decision-trail path, the verdict for each unit, what is verified against the whole-run predicate, and what remains open.

## Completion

Complete the run only when the custom phase list was recorded, every unit has a verdict and evidence, the audit trail matches the work, and the whole result was checked against the falsifiable predicate.
