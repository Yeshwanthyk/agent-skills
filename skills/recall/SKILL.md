---
name: recall
description: Reconstruct project history and current state to answer a history question or resume work.
---

# Recall

Rebuild the current project's working context before starting or resuming work. Return a short brief, not a transcript dump.

## Route the request

Use Recall to reconstruct activity across recent sessions or one named prior run. Continue the remaining work when resumption is requested; a summary request ends with the summary.

If the user supplied a complete state capsule with the relevant paths, branch, change, and next step, verify only live state and skip history mining.

## Set the boundary

Before searching, state:

- the active project and workspace;
- the topic, if one was named;
- the time window, defaulting to the last 7 days;
- the sources you will inspect.

"All" means all only when the user says all. Do not silently replace it with a recent window. Keep the search inside the active project.

## Reconcile the records

1. **Session history.** Load the shared [session-records contract](../references/session-records.md). Locate the active project's saved sessions, then read the header, active branch, and relevant compaction or branch-summary entries.
2. **Search.** Order candidate sessions by their actual modification time. Search the topic first. Read only matching sessions and the relevant message regions. For one or two candidates, search them directly. If the harness cannot expose session files or history, report that gap.
3. **Live state.** Check the current branch, worktree status, recent commits, relevant diffs, and any branches or review records found in the session history. Use the repository's configured forge integration or an installed command discovered from the environment. Do not assume a forge, command, branch naming scheme, or PR provider.
4. **Cloud receipts.** Inspect cloud-agent receipts only when the session history or live state shows that cloud agents participated. Reconcile every referenced receipt, session, branch, or URL against its current state. If a receipt is missing or inaccessible, report the gap instead of treating a summary as proof.
5. **Privacy.** Remove secrets and private context that the requested brief does not need before presenting it.

Use a managed worker runtime for parallel history mining only when the corpus warrants it. Load and follow the shared [delegation contract](../references/delegation.md). If delegation is unavailable, continue locally and report the gap.

## Output

Write a short brief. Use this shape when it helps:

- **Capsule.** A few bullets covering the work and its overall state.
- **Threads.** One line per relevant thread with its current state.
- **Problems.** Recurring problems, when relevant.
- **Next move.** One concrete next action.

Cite session findings by session ID or path when the harness exposes one. Cite repository and review findings by the artifact that supports them. Mark unsupported claims as gaps. Keep adjacent work out unless it blocks the named topic.

## Completion

Recall is complete when the requested history is reconciled with relevant live state and the brief identifies the resume point or answers the history question. State material evidence gaps.
