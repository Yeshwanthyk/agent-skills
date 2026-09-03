---
name: arena
description: Run a same-task candidate bakeoff for a non-trivial design or artifact, then cross-judge, choose a base, graft useful work, and verify the synthesis. Use for /skill:arena or when several plausible approaches exist.
---

# Arena

Fan out N parallel attempts at the same task. Read every candidate end to end. Pick the strongest as the base. Graft the best ideas from the others into it. Verify the synthesized result.

Arena is a candidate bakeoff. It is distinct from [`swarm`](../swarm/SKILL.md), which partitions coverage or runs a bounded solution race and synthesizes evidence. Arena owns base selection and coherent grafting.

## Delegation contract

Load and follow the shared [agent-routing contract](../../references/agent-routing.md). Request parallel execution for candidates and a read-only judge when the runtime supports those capabilities. If a capability is unavailable, continue with the closest supported execution and record the limitation. The parent owns selection, grafting, and final verification.

## Start

Use the harness task list when one exists. Otherwise keep this numbered phase checklist in the working response or decision trail.

1. Frame
2. Fan out
3. Cross-judge
4. Pick
5. Graft
6. Verify

## Phase A: Frame

The N candidates will receive the same prompt, so the prompt is the contract. Get it right before launching anything.

1. State the artifact each candidate is producing.
2. Derive the rubric. State what success looks like for this task, then turn it into 3 to 6 concrete gradeable criteria. Concrete criteria name observable behavior, such as `Adds a --dry-run flag that skips writes`. Vague criteria such as `code is correct` do not help the picker. The rubric is the picker's tool. Candidates only see the task.
3. Set N from the number of genuine design directions. Follow the shared routing contract for runtime selection. Repeating one configured worker is valid when the work is generation-bound rather than judgment-sensitive.
4. Assign output ownership. Give each candidate its own worktree, branch, or task-scoped directory. Never let concurrent candidates write the same mutable target. Give each candidate a path to shared grounding instead of copying large payloads into every brief.

**Phase A is complete when** the artifact, rubric, candidate count, and output ownership are written down.

## Phase B: Fan out

Launch all N candidates in one parallel dispatch through the managed runtime. Give each candidate the task, the path to shared grounding, its owned output location, and instructions to produce both the artifact and a short rationale.

The rationale is mandatory. Without it, the parent cannot tell whether a candidate's structure is principled or accidental, which makes grafting unreliable. Each rationale names the alternatives the candidate considered and what it rejected.

If a candidate fails to produce output, proceed with N minus one and note the dropout in the synthesis record. Never treat a missing or partial artifact as a successful candidate.

**Phase B is complete when** every launched candidate has returned a complete artifact and rationale, or its dropout is recorded.

## Phase C: Cross-judge

After all Phase B candidates complete, launch one read-only judge through the managed runtime. Request a different model family from the parent when the runtime exposes that capability. If it cannot, use the routing contract's fallback and record the limitation.

The judge sees the rubric and candidates by path label. It scores each criterion and recommends a base with rationale. Launch it only after all candidates finish so it cannot mistake a partial or empty output for a dropout. The parent may read candidates while the judge runs, but the judge never replaces the parent's end-to-end review.

**Phase C is complete when** the cross-judge has returned, or its capability limitation and the fallback judgment are recorded.

## Phase D: Pick a base

Read every candidate end to end before picking. Score each candidate against the rubric criterion by criterion, then compare the result with the cross-judge. Read every rationale before deciding.

Pick the base that a future maintainer can extend most easily without breaking invariants. Prefer the cleaner boundary or smaller surface area when two candidates tie, per the Laziness Protocol.

Record the pick and the reason in a short synthesis note alongside the base artifact. Include the cross-judge's verdict, the candidate scores, and any runtime limitation.

**Phase D is complete when** the parent has read every candidate and recorded the base, criterion scores, rationale, and cross-judge comparison.

## Phase E: Graft

Walk each losing candidate once more and identify what is worth porting into the base. The signal is usually one or two things per candidate, not most of it.

Fold each graft in by hand, per the redesign-from-first-principles principle. Do not paste mechanically. The result must remain coherent under one mental model.

Record what was grafted, its source candidate, and what was rejected and why. Rejection notes are high-signal because they show which alternatives were considered and dropped.

When N candidates converge on the same shape, note the convergence and ship the consensus shape. No graft is needed. When candidates diverge wildly, Phase A was under-specified. Reframe and rerun rather than averaging the divergence.

**Phase E is complete when** the base is coherent after grafting, and every graft, rejection, convergence signal, or reframe is recorded.

## Phase F: Verify

Verify the synthesized artifact with the same scrutiny as any other output, per the Prove It Works principle. Inspect the actual artifact and exercise the relevant real boundary. Do not accept candidate self-reports as proof.

If verification surfaces a problem the arena missed, either Phase A was wrong and must be reframed, or a candidate caught it and the missed graft must be recovered. Do not paper over the failure.

**Phase F is complete when** the synthesized artifact has real verification evidence, or the run has been stopped with the failed predicate and next reframe recorded.

## Outputs

Return one synthesized artifact, one short synthesis note, and verification evidence. The synthesis note names the base, candidate scores, grafts with source candidates, rejected alternatives, dropouts, runtime limitations, and verification result.

## Completion

Complete the arena only when every completed candidate was read, the cross-judge returned or its limitation was recorded, the base and graft decisions are recorded, and the synthesized artifact has real verification evidence.
