# agent-skills

A small collection of [Agent Skills](https://docs.anthropic.com/en/docs/claude-code/skills) you can drop into Claude Code, Codex, or Pi.

## Skills

### [`stateful-systems`](./stateful-systems)

Model and build stateful software systems with lifecycle states, transitions, commands, events, projections, read models, idempotent jobs, backfills, freshness contracts, boundary tests, and optional formal verification with Quint or machine specs.

Use when designing workflows, approvals, onboarding, access systems, payment/invoice lifecycles, webhook-driven flows, queue processors, orchestration, or any feature with state transitions and derived reads.

### [`interactive-system-explainer`](./interactive-system-explainer)

Generate polished self-contained HTML explainers for technical systems with tabs, multi-lane sequence players, state machines, history DAGs, resource meters, scenario simulators, comparison matrices, source citations, and invariant checks.

Use when you want a visual architecture explainer, interactive system walkthrough, scenario simulator, or shareable HTML artifact for a non-trivial system.

## Install

Clone the repo and copy the skill folders into your skills directory:

```sh
git clone https://github.com/Yeshwanthyk/agent-skills.git
cp -r agent-skills/stateful-systems ~/.claude/skills/
cp -r agent-skills/interactive-system-explainer ~/.claude/skills/
```

Each skill is a folder containing a `SKILL.md` (and optional `references/`). Claude Code, Codex, and Pi all load skills from their respective skills directories.

## Layout

```
.
├── stateful-systems/
│   └── SKILL.md
└── interactive-system-explainer/
    ├── SKILL.md
    └── references/
```

## License

MIT
