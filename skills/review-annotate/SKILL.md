---
name: review-annotate
description: Open the previous assistant response or a supported local document/folder in a read-only annotation workspace. Use when the user asks to review or annotate prose or HTML, then copy structured feedback back into chat.
compatibility: Requires Node.js 18+. Uses Glimpse when already installed in Pi; otherwise opens the system browser. No installation or network access is required.
---

# Review Annotate

Open one exact source in the bundled local annotation workspace.

## Run

Do not send a status or commentary message before starting the command.

Resolve `scripts/review-workspace.mjs` relative to this `SKILL.md`, then run it in the foreground without a short timeout.

Previous assistant message from the active Pi branch or Codex thread:

```bash
node "/absolute/path/to/review-annotate/scripts/review-workspace.mjs" annotate last
```

One supported local file or a folder containing supported documents:

```bash
node "/absolute/path/to/review-annotate/scripts/review-workspace.mjs" annotate "/path/to/source"
```

In Pi, invoke this skill as `/skill:review-annotate last` or `/skill:review-annotate <path>`. In Codex, invoke it as `$review-annotate`. Pi skills do not provide a bare `/review-annotate` command; that alias requires a separate extension or prompt-command shim and is intentionally not included.

`last` uses authoritative state from the active harness and never picks the newest unrelated transcript. In Pi, it follows `PI_SESSION_FILE`'s active parent chain across the current skill invocation. In Codex, it resolves `CODEX_THREAD_ID` under `$CODEX_HOME/sessions` (default `~/.codex/sessions`), verifies the rollout's session identity, excludes the active invocation turn, and selects the preceding assistant `output_text`. Missing, ambiguous, malformed, oversized, or changing session state fails closed.

Supported files are `.md`, `.mdx`, `.txt`, `.html`, `.htm`, `.yaml`, `.yml`, `.json`, `.jsonc`, `.json5`, `.toml`, `.ini`, `.cfg`, `.conf`, `.properties`, `.csv`, `.tsv`, `.log`, `.xml`, and `.env.example`. `.env`, source code, binary files, symlinks, URLs, special files, and unsafe/oversized sources are rejected. Folder traversal is deterministic and bounded; generated, vendor, and cache directories are skipped, and only one document is loaded at a time.

HTML is displayed in a scriptless sandboxed iframe without same-origin permission. Local CSS, raster images, and fonts are available only through containment-checked token-scoped routes. A read-only text transcript beside the preview is the annotation surface; source HTML is never executed or edited.

The workspace remains local and self-contained. It supports comments, edit/delete/undo, keyboard navigation, per-document drafts, deterministic file-grouped `Copy feedback`, and manual clipboard fallback. It does not edit sources, fetch URLs, share data, add gates, invoke AI, inject feedback, or provide history/message picking.

Wait for the foreground command to exit. If source identification or launch fails, report the exact error without guessing. The user copies the generated Markdown and pastes it back as a normal message.
