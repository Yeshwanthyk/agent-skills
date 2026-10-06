# T3 Code

Tool names come from p3-stack's `AGENTS.md` (2026-10). Confirm them against the running build's tool list before relying on them.

| Action | Tool |
| --- | --- |
| spawn | `delegate_task` with `mode: "async"`; models from `orchestrator_capabilities` |
| drain | `task_status` |
| continue | `t3_thread_send` |
| cancel | `task_cancel`; `t3_thread_interrupt` for a launched thread |
| isolate | `t3_thread_launch` with `workspaceStrategy: {type: "worktree", baseRef, branch}`; await with `t3_thread_wait` |
| wake | `watch_pull_request` (checks finish, comment, conflict); `unwatch_pull_request` at merge-ready |
| tick | `schedule_task` with `{type: "interval", everyMs: 3600000}`; `delete_scheduled_task` at close |
| probe | `task_status`, `t3_thread_read`, `t3_thread_search`, `list_thread_pull_requests` |
| prove UI | `preview_*`, `preview_recording_start`/`stop`, `device_screenshot` |
| ask | `request_user_input` |

## Notes

- Child tasks receive only the assignment, so use the full Assignment template.
- Call `link_pull_request` for each stack layer as it opens. `list_thread_pull_requests` returns the stack bottom to top and feeds `frontier.json` alongside `gh`.
- `orchestrator_capabilities` exposes other providers; run each verifier on a different model family from its worker.
