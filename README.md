# agent-skills

Installable Agent Skills for Claude Code, Codex, and Pi.

## Install

Clone the repo, choose a target skills directory, then copy either one skill or all skills.

```sh
git clone https://github.com/Yeshwanthyk/agent-skills.git
cd agent-skills

# Claude Code
export SKILLS_DIR="$HOME/.claude/skills"

# Codex
# export SKILLS_DIR="$HOME/.codex/skills"

# Pi
# export SKILLS_DIR="$HOME/.pi/agent/skills"

mkdir -p "$SKILLS_DIR"
cp -R skills/stateful-systems "$SKILLS_DIR/"
```

Install every skill in this repo:

```sh
find skills -mindepth 2 -maxdepth 2 -name SKILL.md \
  -exec sh -c 'mkdir -p "$1"; cp -R "$(dirname "$2")" "$1/"' sh "$SKILLS_DIR" {} \;
```

Each installable skill is a directory under `skills/` containing `SKILL.md`. Some skills also include supporting agents, scripts, references, templates, or fonts; copy the whole skill directory.

## Skills

| Skill | Use |
| --- | --- |
| [`interactive-system-explainer`](./skills/interactive-system-explainer) | Generate polished self-contained HTML explainers for technical systems with tabs, scenario simulators, diagrams, source citations, and invariant checks. |
| [`review-export`](./skills/review-export) | Generate shareable HTML code review documents from git diffs. |
| [`stateful-systems`](./skills/stateful-systems) | Model and build stateful systems with lifecycle states, transitions, events, projections, read models, jobs, backfills, and freshness contracts. |
| [`yesh-architect`](./skills/yesh-architect) | Shape architecture before implementation with boundary inputs, failure channels, state transitions, dependency seams, and call graphs. |
| [`yesh-arena`](./skills/yesh-arena) | Run multiple approaches in parallel, compare alternatives against concrete criteria, and synthesize the best path. |
| [`yesh-commit`](./skills/yesh-commit) | Group shipped changes into logical commits with PR summaries, dirty-tree review, and practical pre-commit verification. |
| [`yesh-debug`](./skills/yesh-debug) | Debug symptoms, regressions, logs, screenshots, or failing tests from evidence to root cause and minimal fix path. |
| [`yesh-how`](./skills/yesh-how) | Explain how an existing subsystem works: source of truth, boundaries, production/test flows, conventions, and gotchas. |
| [`yesh-interrogate`](./skills/yesh-interrogate) | Adversarially review a plan, diff, design, PR, or artifact and synthesize blocker-first findings. |
| [`yesh-plan`](./skills/yesh-plan) | Convert finalized discussion into an implementation-shaped plan with locked decisions, contracts, files, chunks, and verification. |
| [`yesh-ship`](./skills/yesh-ship) | Implement already-shaped work through scoped edits, real-seam verification, blocker review, fixes, and second-pass validation. |
| [`yesh-show-work`](./skills/yesh-show-work) | Reconstruct realistic implementation history, decisions, verification, gaps, and handoff summaries from the session and diff. |
| [`yesh-status`](./skills/yesh-status) | Check live repo, runtime, process, port, log, browser, and test state before reporting status or claiming work is done. |

## License

MIT
