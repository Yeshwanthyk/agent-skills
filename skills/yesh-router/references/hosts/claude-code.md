# Claude Code

| Action | Tool |
| --- | --- |
| spawn | `Agent` (runs in the background; completion arrives as a notification) |
| drain | the completion notification; `ListAgents` for what is running |
| continue | `SendMessage` to the agent's name or ID |
| cancel | `TaskStop` |
| isolate | `Agent` with `isolation: "worktree"`; `"remote"` for a cloud copy |
| wake | `Monitor` with an until-loop on `gh pr checks <n> --watch` or `gh pr view --json` |
| tick | `CronCreate` (ends with the session); a `/schedule` routine to outlive it |
| probe | `ListAgents`, `gh`, `git ls-remote`, session JSONL under `~/.claude/projects/` |
| prove UI | `computer-use` (`launch_browser`, `act_ui`, `read_ui`) |
| ask | `AskUserQuestion` |

## Gaps

- PR events arrive only through a `Monitor` you arm; re-arm it after every push.
- PR stack order comes from `gh` alone; `frontier.json` is the registry.
- Models span one provider family. For a cross-family verifier, use `codex-review` or `codex-implement`.
- Background agents and session crons end with the session. A program that must outlive it needs a `/schedule` routine plus the store.
