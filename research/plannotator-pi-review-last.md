# Reliable `review-last` targeting in Pi

- Research date: 2026-07-26
- Upstream: [`backnotprop/plannotator`](https://github.com/backnotprop/plannotator)
- Compared: `v0.18.0`, `v0.24.2`, and [`0eda139c…`](https://github.com/backnotprop/plannotator/tree/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70)

## Root cause of the wrong-message behavior

Standalone `plannotator last` is not Pi-aware. The CLI and `apps/pi-extension` use different message-discovery paths.

The standalone CLI recognizes native Codex/Droid/Claude transcript sources and does not inspect `PI_SESSION_FILE`, `PI_SESSION_ID`, or Pi’s active parent chain. From Pi, a bare `plannotator last` can therefore select an unrelated but plausible Codex or Claude response. Setting only `PLANNOTATOR_ORIGIN=pi` changes origin labeling, not transcript selection.

Current upstream’s Pi extension is reliable because it obtains `ctx.sessionManager.getBranch()`, walks the active branch, keeps assistant text blocks, and can offer recent active-branch messages. It does not solve the requested integration because it registers extension command surfaces and delivers submitted feedback asynchronously as a follow-up.

## Upstream evidence

- CLI origin detection and annotate-last dispatch contain no Pi session branch: `apps/hook/server/index.ts`.
- `last --stdin` bypasses transcript discovery in `v0.24.2` and current main, but `v0.18.0` has no stdin mode.
- The Pi extension’s active-branch extraction is in `apps/pi-extension/assistant-message.ts`.
- Its automatic follow-up path is in `apps/pi-extension/index.ts`.
- A repository-wide search at all inspected revisions found no standalone `PI_SESSION_FILE` support.

## Selected solution

`review-last` does not call Plannotator. The skill carries a self-contained local annotation workspace and a Pi-aware Node launcher.

The launcher:

1. Opens the exact path in `PI_SESSION_FILE` and validates a Pi v3 session header.
2. Compares the header ID with `PI_SESSION_ID` when present.
3. Rejects duplicate IDs, malformed parents, missing parents, cycles, invalid JSON, oversized files, and files changing during the read.
4. Starts at the current persisted leaf, proves that the active chain contains the current assistant tool call, crosses the current user invocation, and selects the preceding assistant message containing text.
5. Never falls back to Codex, Claude, or “most recent file” discovery.

Outside Pi, the caller must provide exact content explicitly:

```bash
node <skill>/scripts/review-workspace.mjs last --file response.md
node <skill>/scripts/review-workspace.mjs last --stdin
```

## UI and completion model

The captured Markdown is rendered in the bundled Plannotator-style workspace. The user selects text, attaches comments, edits/deletes/undoes them, and copies deterministic Markdown. The launcher stays in the foreground and never injects a follow-up message; the user pastes feedback back normally.

Glimpse is used only when already installed in Pi. Otherwise the same tokenized `127.0.0.1` workspace opens in the system browser. Neither path installs Plannotator or adds slash commands, hooks, or settings.

## Rejected approaches

- Bare `plannotator last`: not Pi-aware.
- `PLANNOTATOR_ORIGIN=pi plannotator last`: label-only; still wrong discovery path.
- Newest-line JSONL selection: append-only sessions can contain inactive branches.
- Upstream Pi extension command: correct target, wrong slash-command/async-handoff boundary.
- `v0.18.0`: no stdin escape hatch and weaker branch handling.
- A globally downloaded Plannotator runtime: unnecessary for a two-skill local annotate/copy workflow and not attached to each portable skill.
