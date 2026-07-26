# Plannotator `last` / `review` research and selected skills

- Research date: 2026-07-26
- Upstream: [`backnotprop/plannotator`](https://github.com/backnotprop/plannotator)
- Upstream inspected: [`0eda139c…`](https://github.com/backnotprop/plannotator/tree/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70)
- Selected skill names: `review-last`, `review-diff`

## Decision

Ship two ordinary, model-invocable Agent Skills with an identical embedded local review workspace.

- No custom slash-command files, Pi hooks, extension package, settings changes, or global installation.
- No Plannotator executable download or dependency.
- No staging, posting, AI actions, sharing, telemetry, or asynchronous feedback delivery.
- The user reads, annotates, copies deterministic Markdown, and pastes it back normally.
- Each skill directory is independently runnable with its own launcher, browser assets, renderer, and license notices.

The workspace adapts Plannotator’s reader-first UI and annotation loop, but does not bundle or execute the Plannotator application. It pins the same `@pierre/diffs` renderer used by upstream at version 1.2.8.

## Why not invoke `plannotator last`

Standalone Plannotator is not Pi-session-aware. Its CLI supports native Codex/Droid/Claude discovery and `--stdin`, but does not inspect `PI_SESSION_FILE`. From Pi it can therefore select a plausible unrelated Codex or Claude transcript.

Upstream’s Pi extension avoids that by reading `ctx.sessionManager.getBranch()`, but it also registers slash commands and supports an asynchronous automatic feedback handoff. Those are outside the requested skills-only, manual-copy workflow.

The selected `review-last` launcher instead reads the active `PI_SESSION_FILE` parent chain, crosses the current skill invocation, and selects the preceding assistant text message. Malformed, changing, mismatched, or ambiguous session data fails closed. Outside Pi, exact input must be supplied with `--file` or `--stdin`; the launcher never scans unrelated transcript directories.

## Why not invoke `plannotator review`

Upstream’s complete review runtime includes useful capabilities but has a broader mutation and network boundary than requested. Depending on mode and configuration it can fetch/clone/check out, create worktrees, stage files, run agent jobs, share sessions, or submit remote review actions.

The selected `review-diff` boundary is deliberately narrower:

- Local mode reads tracked changes against `HEAD` plus untracked files.
- It invokes Git directly with fixed arguments and does not stage, commit, check out, fetch, or mutate files.
- A GitHub PR URL uses the existing authenticated `gh pr diff` command.
- A GitLab MR URL uses the existing authenticated `glab mr diff` command.
- Remote acquisition is the only network-capable phase; the review workspace itself serves bundled local assets.

## Embedded workspace

### Stack

- Vanilla TypeScript and esbuild.
- `markdown-it` 14.3.0 for safe Markdown rendering with raw HTML disabled.
- `@pierre/diffs` 1.2.8 for multi-file unified diffs, line selection, syntax highlighting, and inline annotations.
- One tokenized HTTP server bound to `127.0.0.1` on an ephemeral port.
- Existing Glimpse is used inside Pi when found; otherwise the system browser opens the same local URL.

No worker bundle is used initially. Pierre runs with `shiki-js` on the main thread because that is the most portable vanilla baseline; the generated asset is intentionally self-contained.

### Review behavior

- Markdown: rendered headings, lists, tables, code, selection anchoring, and a Contents rail.
- Diff: file rail, one active `FileDiff`, one-side line ranges, syntax highlighting, and inline comments.
- Shared: anchored comment popover, edit/delete/undo, comment navigation, full keyboard/vi flow, annotation rail, clipboard fallback, and deterministic paste-ready Markdown.
- Remote Markdown images and links are inert in the local workspace.

### Visual adaptation

The shell follows upstream Plannotator’s compact composition:

- 48px global header.
- Aligned compact panel headers.
- Left Contents/Files rail.
- Reader-first center pane.
- 288px collapsible Annotations rail.
- Selection-anchored comment popover rather than a detached bottom composer.
- Plannotator-derived navy/purple surfaces and orange annotation semantics.

The copied skills include `PLANNOTATOR_NOTICE.md`, `LICENSE-MIT`, and `LICENSE-APACHE` for the adapted visual and interaction patterns. Runtime package licenses are generated into `THIRD_PARTY_NOTICES.md`.

## Skill commands

```bash
node <review-last-skill>/scripts/review-workspace.mjs last
node <review-last-skill>/scripts/review-workspace.mjs last --file response.md
node <review-last-skill>/scripts/review-workspace.mjs last --stdin

node <review-diff-skill>/scripts/review-workspace.mjs diff
node <review-diff-skill>/scripts/review-workspace.mjs diff https://github.com/owner/repo/pull/123
node <review-diff-skill>/scripts/review-workspace.mjs diff https://gitlab.example.com/group/repo/-/merge_requests/123
```

## Operational boundary

- Requires Node.js 18+.
- Local diff requires Git.
- Remote GitHub/GitLab diffs require an already installed and authenticated `gh`/`glab` CLI.
- Glimpse is optional and is never installed by either skill.
- The process stays in the foreground until explicit Close, native-window close, or heartbeat expiry.
- No feedback is delivered back to the agent automatically.

## Pi slash-command distinction

These packages add no Plannotator extension commands. Pi may still expose generic `/skill:review-last` and `/skill:review-diff` when its global `enableSkillCommands` setting is enabled; that behavior applies to all Pi skills and is not registered by this repository.
