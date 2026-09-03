---
name: recall
description: Reconstruct recent work from the current project's session history and live repository state. Use for catching up, resuming work, or finding where a task stopped.
---

# Recall

Rebuild the current project's working context before starting or resuming work. Return a short brief, not a transcript dump.

## Route the request

Use Recall for activity recall across recent sessions. Use the session-pickup workflow when the user names one prior agent run, cloud receipt, or pushed branch to continue. Use a human-readable summary when the user asks for a summary rather than current working context.

If the user supplied a complete state capsule with the relevant paths, branch, change, and next step, verify only live state and skip history mining.

## Set the boundary

Before searching, state:

- the active project and workspace;
- the topic, if one was named;
- the time window, defaulting to the last 7 days;
- the sources you will inspect.

"All" means all only when the user says all. Do not silently replace it with a recent window. Keep the search inside the active project.

## Reconcile the records

1. **Session history.** Load the shared [session-records contract](../../references/session-records.md). Locate the active project's saved sessions, then read the header, active branch, and relevant compaction or branch-summary entries.
2. **Search.** Order candidate sessions by their actual modification time. Search the topic first. Read only matching sessions and the relevant message regions. For one or two candidates, search them directly. If the harness cannot expose session files or history, report that gap.
3. **Live state.** Check the current branch, worktree status, recent commits, relevant diffs, and any branches or review records found in the session history. Use the repository's configured forge integration or an installed command discovered from the environment. Do not assume a forge, command, branch naming scheme, or PR provider.
4. **Cloud receipts.** Inspect cloud-agent receipts only when the session history or live state shows that cloud agents participated. Reconcile every referenced receipt, session, branch, or URL against its current state. If a receipt is missing or inaccessible, report the gap instead of treating a summary as proof.
5. **Privacy.** Remove secrets and private context that the requested brief does not need before presenting it.

Use a managed worker runtime for parallel history mining only when the corpus warrants it. Load and follow the shared [agent-routing contract](../../references/agent-routing.md). If delegation is unavailable, continue locally and report the gap.

## Output

Write the brief through `unslop` when that skill is available. Use this contract:

- **Capsule.** At most 5 bullets covering the work and its overall state.
- **Threads.** One line per thread. Prefix each with exactly one of `[merged #N]`, `[open PR #N]`, `[in flight <branch>]`, `[verified, uncommitted]`, `[reverted #N]`, or `[planned, not started]`.
- **Problems.** At most 5 recurring problems. Include user symptoms and fixes that shipped and were later reverted.
- **Next move.** One concrete next action.

Cite session findings by session ID or path when the harness exposes one. Cite repository and review findings by the artifact that supports them. Mark unsupported claims as gaps. Keep adjacent work out unless it blocks the named topic.

## Completion

Recall is complete when the stated project, topic, and time boundary is covered; matching session history is reconciled with live repository and review state; cloud receipts were checked when participation is evidenced; every missing source is named; and the brief contains the four required sections with followable evidence.
