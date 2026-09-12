# Playbooks

Ordinary coding ends with the result and relevant checks. PR work starts only on request. Local commits follow the user's or repository's workflow; a playbook does not require them merely to finish a task.

Choose the task-specific procedure that helps achieve the requested result. A small task can stay direct. Read the selected playbook, not the whole catalog. Its steps are guidance unless they protect a concrete ordering, evidence, or authorization requirement.

- [`investigation`](investigation.md) handles read-only questions.
- [`bug-fix`](bug-fix.md) reproduces, diagnoses, fixes, and verifies a defect.
- [`perf-issue`](perf-issue.md) measures a one-off performance problem against a baseline.
- [`hillclimb`](hillclimb.md) iterates on one metric with one measured change at a time.
- [`runtime-forensics`](runtime-forensics.md) diagnoses a live runtime symptom without fixing it.
- [`trace-forensics`](trace-forensics.md) diagnoses a supplied profiling artifact without rerunning it.
- [`feature`](feature.md) adds or changes behavior from a named data shape.
- [`refactoring`](refactoring.md) changes structure while preserving behavior.
- [`prototype`](prototype.md) answers a design or empirical question with throwaway work.
- [`visual-parity`](visual-parity.md) proves pixel equivalence against an untouched baseline.
- [`authoring-a-skill`](authoring-a-skill.md) creates or edits a skill under the current skill mechanics.
- [`eval`](eval.md) tests a skill or prompt variant with blind candidates and a judge.
- [`babysit`](babysit.md) drives a PR or stack to merge-ready and stops there.
- [`shipping`](shipping.md) independently verifies and lands only an authorized contiguous run.
- [`autonomous-run`](autonomous-run.md) drives one task to a stated exit predicate.
- [`orchestrate`](orchestrate.md) coordinates a continuing program.
- [`autopilot-full`](autopilot-full.md) drives authorized independent PRs through verified merge.
- [`autopilot-stack`](autopilot-stack.md) builds a verified linear stack for operator review and landing.
- [`session-pickup`](session-pickup.md) resumes prior work from durable evidence.
- [`pause-safely`](pause-safely.md) leaves a cold-start resume point without crossing an irreversible line.
- [`multi-phase-plan`](multi-phase-plan.md) writes a plan without implementing it.
- [`worktree-cleanup`](worktree-cleanup.md) audits and removes confirmed unused worktrees and other local build state.
- [`opening-a-pr`](opening-a-pr.md) handles PR preparation or creation only when the user asks.
