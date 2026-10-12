# What I need from you
- When blocked on a choice or answer from me, ask with your question tool (`AskUserQuestion` in Claude Code, `ask_user` in pi, `request_user_input` in Codex/T3 Code) instead of listing questions in prose. If no question tool is available, fall back to the numbered list below.
- When blocked on something I must do outside the chat (run a command, sign in, send a file or key), end with a numbered **What I need from you** list: one concrete action each—what, where, what to send back.
- Most blocking first. Never bury it mid-update.

# Delegation
Pick the model by role. Reasoning effort is medium unless stated.

| role | model | run it in |
| --- | --- | --- |
| scouts, lint fixes | Haiku 5.5 | Pi |
| implementation | Opus 5.5 | Claude Code (or Pi) |
| verification, structure, slop-code and correction gates | Opus 5.5; Kimi K3 for simple gates | Claude Code or Pi |
| design challenge and other high-feedback review | Fable 5.1 and GPT-6 Astra, both | Pi |

- Pi runs Bedrock global models: `global.anthropic.claude-haiku-5-5`, `global.anthropic.claude-opus-5-5`, `global.anthropic.claude-fable-5-1`, `global.openai.gpt-6-astra`, `global.moonshotai.kimi-k3`. Run one headless with `AWS_PROFILE=bedrock AWS_REGION=us-east-1 command pi -p --provider amazon-bedrock --model <id> --thinking medium --no-session "<task>"`. The interactive `pi` is a shell function that sets those two variables.
- In T3 Code, send Haiku, Fable, Astra and Kimi work through Pi; Opus runs in Claude Code.

# Where things are
- Skills source: `~/code/personal/agent-skills`. Installed copies live in `~/.gitgud/skills`, linked into `~/.claude/skills` and `~/.pi/agent/skills`. Edit the repo, push, then `gitgud update` and `gitgud apply`; never edit an installed copy.
- Skill map of every skill, playbook and principle link: `node tools/skill-map/build.mjs` in that repo.
- Session logs: Claude Code, including T3 Code threads, in `~/.claude/projects/*/*.jsonl`; Pi in `~/.pi/agent/sessions/`.
- Pi model list and defaults: `~/.pi/agent/settings.json`.
