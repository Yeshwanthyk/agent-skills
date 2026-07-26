---
name: review-diff
description: Open current worktree changes or a supplied GitHub pull request or GitLab merge request in a local annotation workspace. Use when the user asks to review a diff and copy structured feedback back into chat.
compatibility: Requires Node.js 18+ and Git for local reviews. Remote URLs require the existing authenticated gh or glab CLI. Uses Glimpse when already installed in Pi; otherwise opens the system browser.
---

# Review Diff

Open a code diff in the bundled, read-only review workspace.

## Run

Resolve `scripts/review-workspace.mjs` relative to this `SKILL.md`.

For current worktree changes, run from the repository being reviewed in the foreground without a short timeout:

```bash
node "/absolute/path/to/review-diff/scripts/review-workspace.mjs" diff
```

This captures tracked changes against `HEAD` plus untracked files without staging, committing, checking out, fetching, or modifying the worktree.

For a supplied GitHub pull request or GitLab merge request, pass only the full HTTPS URL:

```bash
node "/absolute/path/to/review-diff/scripts/review-workspace.mjs" diff <pr-or-mr-url>
```

Remote acquisition uses the existing authenticated `gh` or `glab` CLI. It never clones, checks out, posts a review, or mutates remote state.

The workspace is local and self-contained. It uses bundled `@pierre/diffs` 1.2.8, supports line-range comments, edit/delete/undo, file and comment navigation, keyboard review, and deterministic `Copy feedback`. It never installs Plannotator or creates an asynchronous feedback path.

Wait for the foreground command to exit. Report exact errors. The user copies the generated Markdown and pastes it back as a normal message.
