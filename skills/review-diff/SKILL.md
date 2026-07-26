---
name: review-diff
description: Open Plannotator's browser-based code review for the current worktree or a supplied pull request or merge request URL. Use when the user explicitly asks to review a diff with Plannotator.
compatibility: Requires the plannotator executable on PATH and a supported VCS or pull request URL.
---

# Review Diff

Open the requested code diff in Plannotator.

## Run

For current worktree changes, run in the foreground from the repository being reviewed:

```bash
plannotator review
```

If the user supplied a GitHub pull request or GitLab merge request URL, pass only that URL:

```bash
plannotator review <pr-or-mr-url>
```

Wait for the process to exit. Do not install Plannotator, add hooks, or create an asynchronous feedback path. If the command fails, report the exact error.

The user may copy and paste annotation feedback back as a normal message.
