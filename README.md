# agent-skills

Installable Agent Skills for Claude Code, Codex, and Pi.

## Install With gitgud

Track this repo, select the skills you want, then materialize and sync them into agent-specific skill directories.

```sh
gitgud add https://github.com/Yeshwanthyk/agent-skills
gitgud select github:Yeshwanthyk/agent-skills
gitgud apply
```

`gitgud apply` writes selected skills to `~/.gitgud/skills` and syncs managed symlinks into Claude, Codex, Pi, Droid, and Amp skill dirs.

Useful checks:

```sh
gitgud status
gitgud list
gitgud sync --dry-run
```

## Manual Install

Clone the repo, choose a target skills directory, then copy either one skill or all skills.

```sh
git clone https://github.com/Yeshwanthyk/agent-skills.git
cd agent-skills

mkdir -p "$HOME/.codex/skills"
cp -R skills/stateful-systems "$HOME/.codex/skills/"
```

Each installable skill is a directory under `skills/` containing `SKILL.md`. Some skills also include supporting agents, scripts, references, templates, or fonts; copy the whole skill directory.

## Yesh Workflows

| Situation | Flow |
| --- | --- |
| Current-system understanding | `/how` |
| Bug, regression, runtime symptom | `/status` -> `/debug` -> `/ship` -> `/commit` |
| Architecture before implementation | `/how` -> `/architect` -> `/plan` -> `/ship` -> `/commit` |
| Finalized work plan | `/plan` -> `/ship` -> `/commit` |
| Post-feature cleanup pass | `/structure` after behavior works |

Removed older slate skills are folded into the current flow:

- `/interrogate` review behavior lives in `yesh-ship` blocker-first review.
- `/show-work` reconstruction is handled by explicit reporting in `/ship` and `/commit`.
- `/arena` is no longer an active skill.

## Skills

| Skill | Use |
| --- | --- |
| [`interactive-system-explainer`](./skills/interactive-system-explainer) | Generate polished self-contained HTML explainers for technical systems with tabs, scenario simulators, diagrams, source citations, and invariant checks. |
| [`orchestrator-core`](./skills/orchestrator-core) | Coordinate workers, threads, decisions, and a central task ledger across active workstreams. |
| [`review-export`](./skills/review-export) | Generate shareable HTML code review documents from git diffs. |
| [`stateful-systems`](./skills/stateful-systems) | Model and build stateful systems with lifecycle states, transitions, events, projections, read models, jobs, backfills, and freshness contracts. |
| [`yesh-architect`](./skills/yesh-architect) | Shape architecture before implementation with boundary inputs, failure channels, state transitions, dependency seams, and call graphs. |
| [`yesh-commit`](./skills/yesh-commit) | Group shipped changes into logical commits with PR summaries, dirty-tree review, and practical pre-commit verification. |
| [`yesh-debug`](./skills/yesh-debug) | Debug symptoms, regressions, logs, screenshots, or failing tests from evidence to root cause and minimal fix path. |
| [`yesh-how`](./skills/yesh-how) | Explain how an existing subsystem works: source of truth, boundaries, production/test flows, conventions, and gotchas. |
| [`yesh-plan`](./skills/yesh-plan) | Convert finalized discussion into an implementation-shaped plan with locked decisions, contracts, files, chunks, and verification. |
| [`yesh-ship`](./skills/yesh-ship) | Implement already-shaped work through scoped edits, real-seam verification, blocker review, fixes, and second-pass validation. |
| [`yesh-status`](./skills/yesh-status) | Check live repo, runtime, process, port, log, browser, and test state before reporting status or claiming work is done. |
| [`yesh-structure-review`](./skills/yesh-structure-review) | Post-feature structure review: state machines, typed objects, registries, reducers - act-now/defer/leave findings after behavior works. |

## License

MIT
