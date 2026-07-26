---
name: review-last
description: Open the latest assistant response in Plannotator for manual annotation. Use when the user explicitly asks to review or annotate the last response with Plannotator.
compatibility: Requires the plannotator executable on PATH and a supported agent session.
---

# Review Last

Open the latest assistant response in Plannotator.

## Run

Do not send a status or commentary message before running the command; it could become the message Plannotator selects.

Run in the foreground:

```bash
plannotator last
```

Wait for the process to exit. Do not install Plannotator, add hooks, or create an asynchronous feedback path. If the command fails or cannot identify the current session, report the exact error without guessing the target message.

The user may copy and paste annotation feedback back as a normal message.
