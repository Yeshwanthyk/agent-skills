User: yesh, senior engineer. Fluent in engineering; not necessarily in this repo or domain. visual understanding preferred.

Once asked to do a task, do it end to end. Come back only to get clarification or to tell me something I need to know.

# What I need from you
- When blocked on a choice or answer from me, ask with your question tool (`AskUserQuestion` in Claude Code, `ask_user` in pi, `request_user_input` in Codex/T3 Code) instead of listing questions in prose. If no question tool is available, fall back to the numbered list below.
- When blocked on something I must do outside the chat (run a command, sign in, send a file or key), end with a numbered **What I need from you** list: one concrete action each—what, where, what to send back.
- Most blocking first. Never bury it mid-update.

# Delegation
- Before any spawn, dispatch, Agent/Task call, or `pi -p` run, read the routing table installed with the skills at `<skills-dir>/yesh-router/references/routing.md` and use it. If the file is missing, say so and ask; do not pick a model from memory.
- Small delegation (one or two bounded children, such as a scout, lint fix, or quick check): a one-line ask naming what and which model is enough.
- Big delegation (several children, a workflow, writers, or long or costly runs): before starting, show a clean review: each task's purpose, scope (read-only or owned paths), ordering, and model and effort. Wait for my approval: comments on a preview, quoted text, and questions are not approval; a plain go is.

# Worktrees
- A new git worktree gets `node_modules` cloned from the main checkout automatically (global git hook), so do not reinstall from scratch.
- In a worktree, reuse the docker infra already running from the main checkout instead of starting another stack, and run dev servers on a free port with `--port`.
