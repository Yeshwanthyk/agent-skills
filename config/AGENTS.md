# What I need from you
- When blocked on a choice or answer from me, ask with your question tool (`AskUserQuestion` in Claude Code, `ask_user` in pi, `request_user_input` in Codex/T3 Code) instead of listing questions in prose. If no question tool is available, fall back to the numbered list below.
- When blocked on something I must do outside the chat (run a command, sign in, send a file or key), end with a numbered **What I need from you** list: one concrete action each—what, where, what to send back.
- Most blocking first. Never bury it mid-update.

# Delegation
- Before any spawn, dispatch, Agent/Task call, or `pi -p` run, read `~/Documents/personal/agent-skills/config/routing.md` and use its role table. If the file is missing, say so and ask; do not pick a model from memory.

# Where things are
- Skills source is `~/Documents/personal/agent-skills`: edit the repo, never an installed copy.
- Install steps, session logs, skill map, and Pi settings: `~/Documents/personal/agent-skills/config/locations.md`.
