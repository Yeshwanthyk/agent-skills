# Routing

Pick the worker for a spawn, `Agent`/`Task` call, or `pi -p` run from this table. Reasoning effort is medium unless a row says otherwise. Anthropic models run as the current harness's own subagents; OpenAI models run through Pi.

| role | model | run it in |
| --- | --- | --- |
| scout, lint fix | Haiku 5.5 | Claude Code subagent. A scout locates and extracts: it returns paths, quotes and raw rows, and the parent does the counting, verdicts and drafting. |
| scout, lint fix (from Pi or Codex) | GPT-6 Luna | Pi; in T3 Code, `delegate_task` on the pi provider |
| implementation | Opus 5.5 | Claude Code |
| verification, structure, slop-code and correction gates | Opus 5.5 | Claude Code |
| design challenge, high-feedback review (run both) | Fable 5.1 | Claude Code subagent |
| design challenge, high-feedback review (run both) | GPT-6 Astra | Pi; in T3 Code, `delegate_task` on the pi provider so it shows in the sidebar |

## Pi
Headless run: `command pi -p --model openai-codex/<model> --thinking medium --no-session "<task>"`. Pi's own models and defaults are in its `agent/settings.json`; if this file disagrees, settings.json wins.

## T3 Code
In T3 Code, run each row on the provider instance `orchestrator_capabilities` lists for that model, through native subagents when they support it and `delegate_task` otherwise.

## Bedrock (only on a machine with a `bedrock` AWS profile)
Kimi K3 and the `global.*` IDs come from here: prefix the Pi command with `AWS_PROFILE=bedrock AWS_REGION=us-east-1` and add `--provider amazon-bedrock --model global.<id>` (`global.anthropic.claude-haiku-5-5`, `global.anthropic.claude-opus-5-5`, `global.anthropic.claude-fable-5-1`, `global.openai.gpt-6-astra`, `global.moonshotai.kimi-k3`). Kimi K3 takes simple gates. Without the profile, skip this section, and skip Kimi rows and say so.

## When a worker can't start
If Pi fails on auth, run the same role on the nearest model the current harness has and name the substitute in the reply. Leave login and AWS setup to the user.
