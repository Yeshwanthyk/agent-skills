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

Each installable skill is a directory under `skills/` containing `SKILL.md`.

## Skills

| Skill | Use |
| --- | --- |
| [`interactive-system-explainer`](./skills/interactive-system-explainer) | Generate self-contained interactive HTML explainers for technical systems. |
| [`review-export`](./skills/review-export) | Generate shareable HTML code review documents from git diffs. |
| [`stateful-systems`](./skills/stateful-systems) | Model and build lifecycle/state-machine-driven systems. |
| [`yesh-architect`](./skills/yesh-architect) | Design architecture before implementation: types, interfaces, boundaries, and call graphs. |
| [`yesh-arena`](./skills/yesh-arena) | Run multiple approaches in parallel, then select and synthesize the best path. |
| [`yesh-commit`](./skills/yesh-commit) | Group changes into logical commits with PR summaries and pre-commit verification. |
| [`yesh-debug`](./skills/yesh-debug) | Debug from evidence (logs, traces, failing tests) to root cause and minimal fix. |
| [`yesh-how`](./skills/yesh-how) | Map how an existing subsystem works: key files, flow, boundaries, and call graphs. |
| [`yesh-interrogate`](./skills/yesh-interrogate) | Adversarially stress-test a plan, diff, or design and synthesize blocker-first findings. |
| [`yesh-plan`](./skills/yesh-plan) | Convert a finalized discussion into a concise implementation plan. |
| [`yesh-ship`](./skills/yesh-ship) | Implement already-shaped work through verification and second-pass validation. |
| [`yesh-show-work`](./skills/yesh-show-work) | Reconstruct realistic, reviewable decision trails and handoff summaries. |
| [`yesh-status`](./skills/yesh-status) | Report live runtime and repo state before claiming work is done. |

## External Not Owned Skills

These skills live outside this repo and can be installed via [`gitgud`](https://github.com/yeshwanthyk/gitgud):

| Skill | Source | Install |
| --- | --- | --- |
| `breadboard` | [rjs/shaping-skills](https://github.com/rjs/shaping-skills) | `gitgud install breadboard --source rjs/shaping-skills` |
| `shaping` | [rjs/shaping-skills](https://github.com/rjs/shaping-skills) | `gitgud install shaping --source rjs/shaping-skills` |
| `framing-doc` | [rjs/shaping-skills](https://github.com/rjs/shaping-skills) | `gitgud install framing-doc --source rjs/shaping-skills` |
| `kickoff-doc` | [rjs/shaping-skills](https://github.com/rjs/shaping-skills) | `gitgud install kickoff-doc --source rjs/shaping-skills` |
| `impeccable` | [impeccable.style](https://impeccable.style/) | `gitgud install impeccable --source https://impeccable.style/` |
| `grill-with-docs` | [mattpocock/skills](https://github.com/mattpocock/skills) | `gitgud install grill-with-docs --source mattpocock/skills` |
| `improve-codebase-architecture` | [mattpocock/skills](https://github.com/mattpocock/skills) | `gitgud install improve-codebase-architecture --source mattpocock/skills` |
| `make-interfaces-feel-better` | [jakubkrehel/make-interfaces-feel-better](https://github.com/jakubkrehel/make-interfaces-feel-better) | `gitgud install make-interfaces-feel-better --source jakubkrehel/make-interfaces-feel-better` |

## License

MIT
