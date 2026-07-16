# agent-skills

Installable Agent Skills for Claude Code, Codex, and Pi.

The portfolio focuses on reusable reasoning that changes agent behavior. Routine execution, status checks, commits, and coordination stay with the agent's built-in capabilities.

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

Copy the complete skill directory so its agents, scripts, references, and assets travel together.

## Model-Invoked Disciplines

- [`interactive-system-explainer`](./skills/interactive-system-explainer) — Build source-grounded interactive HTML explainers as inspectable models.
- [`stateful-systems`](./skills/stateful-systems) — Model authoritative state, lifecycle transitions, invariants, concurrency, freshness, replay, and recovery.
- [`yesh-debug`](./skills/yesh-debug) — Diagnose failures through a red-capable loop and the first contract divergence.
- [`yesh-how`](./skills/yesh-how) — Explain current systems through execution paths, state ownership, boundaries, and proof.

## Explicit Workflows

- [`yesh-architect`](./skills/yesh-architect) — Design a concrete target architecture from live contracts and constraints.
- [`yesh-plan`](./skills/yesh-plan) — Turn a settled approach into a human-readable implementation packet.
- [`yesh-structure-review`](./skills/yesh-structure-review) — Produce a clean engineering audit with evidence-backed corrections.

## License

MIT
