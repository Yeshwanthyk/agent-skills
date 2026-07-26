---
name: review-last
description: Open the previous assistant response in a local annotation workspace. Use when the user asks to review or annotate the last response, then copy structured feedback back into chat.
compatibility: Requires Node.js 18+. Uses Glimpse when already installed in Pi; otherwise opens the system browser. No installation or network access is required.
---

# Review Last

Open the previous assistant response from the active Pi branch in the bundled review workspace.

## Run

Do not send a status or commentary message before starting the command.

Resolve `scripts/review-workspace.mjs` relative to this `SKILL.md`, then run it in the foreground without a short timeout:

```bash
node "/absolute/path/to/review-last/scripts/review-workspace.mjs" last
```

The launcher follows `PI_SESSION_FILE`'s active parent chain, crosses the current skill invocation, and selects the preceding assistant message containing text. It fails closed rather than choosing another transcript or file.

Outside Pi, pass an exact source explicitly only when the host can provide it:

```bash
node "/absolute/path/to/review-last/scripts/review-workspace.mjs" last --file /path/to/response.md
# or
node "/absolute/path/to/review-last/scripts/review-workspace.mjs" last --stdin
```

The workspace is local and self-contained. It renders Markdown, supports text selection, comments, edit/delete/undo, keyboard navigation, and deterministic `Copy feedback`. It never installs Plannotator, injects feedback asynchronously, or posts data anywhere.

Wait for the foreground command to exit. If source identification or launch fails, report the exact error without guessing. The user copies the generated Markdown and pastes it back as a normal message.
