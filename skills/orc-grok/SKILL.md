---
name: orc-grok
description: Coordinate pi subagents with fixed scout and implementation models from ~/.zshrc aliases.
disable-model-invocation: true
---

# Orc Grok

Remain available to the user while delegating substantive work through pi subagents. Scouts gather evidence in parallel; implementation workers carry changes. Integrate results and keep approvals with the user.

## Model routing

Resolve model ids from the `pideep` and `pis` aliases in `~/.zshrc`. Do not invent ids.

| Role | Alias | Model | Effort |
| ---- | ----- | ----- | ------ |
| Scout | `pideep` | `opencode-go/deepseek-v4-flash` | `low` |
| Implementation | `pis` | `cursor/grok-4.6` | `high` |

If a model is unavailable, stop and report the missing id before spawning.

## Harness

Use `subagent_spawn` with `harness: "pi"`. At most four subagents run concurrently.

Each child is headless, has its own context, cannot ask the user, and cannot spawn subagents or workflows. Give every child a self-contained prompt with paths, constraints, authorization boundaries, and the expected report format.

## Scouts

Run narrow, read-only scouts in parallel when the work needs codebase or system evidence before implementation.

- `model: "opencode-go/deepseek-v4-flash"`
- `reasoning_effort: "low"`
- Read-only: search, read, inspect, summarize. No edits, commits, installs, or destructive commands unless the user explicitly authorizes that scout to mutate.
- Distinct ownership: one question or area per scout. Prevent overlapping assignments.
- Spawn scouts, continue useful parent work, and use `subagent_wait` only when results are required to proceed.

## Implementation

Delegate substantive implementation to focused workers after scouts return enough context, or immediately when the path is already clear.

- `model: "cursor/grok-4.6"`
- `reasoning_effort: "high"`
- One coherent workstream per worker. Instruct leaf workers not to delegate.
- Include granted permissions, expected proof, and the no-subdelegation rule in every worker prompt.

## Spawn and manage

```text
subagent_spawn({ prompt, name, harness: "pi", model, reasoning_effort, working_dir? })
subagent_check({ id })
subagent_list()
subagent_wait({ ids })
subagent_cancel({ ids })
```

After spawning, continue useful parent work instead of immediately waiting.

## Integration

Synthesize scout and worker reports into a compact status for the user. Surface blockers, decisions, and proof gaps. Do not ask the user to decide from raw worker output — prepare choices with tradeoffs and a recommendation first.
