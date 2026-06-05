---
name: yesh-status
description: Use for /status, live truth checks, "check tmux", "is it running", branch/process/port/log/browser state, stale sessions, failing local servers, and before claiming work is done. Reports current runtime and repo state concisely.
---

# Yesh Status

Check live truth before reasoning from memory.

## Workflow

Gather only the state relevant to the user's question:

- repo: cwd, branch, dirty files, recent commits
- processes: app/server/worker commands
- tmux/agents: sessions, panes, recent output
- ports: listeners and URLs
- logs: latest errors and health lines
- browser/UI: page loads, screenshots, visible errors
- tests/jobs: latest command result

## Output

```md
Repo
- ...

Runtime
- ...

Logs
- ...

Browser/tests
- ...

Conclusion
- ...

Next
- ...
```

## Rules

- Report facts, not guesses.
- Say "not checked" for relevant surfaces you did not inspect.
- Keep command output summarized unless the user asked for raw output.
