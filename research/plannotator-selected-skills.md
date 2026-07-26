# Plannotator `last` / `review` skill research

- Research date: 2026-07-26
- Upstream: [`backnotprop/plannotator`](https://github.com/backnotprop/plannotator)
- Release baseline: [`v0.24.2` (`9bf46e11…`)](https://github.com/backnotprop/plannotator/tree/9bf46e11f30755b60c0eb392362fce3eaaa1966c)
- Current upstream inspected: [`0eda139c…`](https://github.com/backnotprop/plannotator/tree/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70), 10 commits after `v0.24.2`

## Conclusion

Use two minimal, model-visible Agent Skills:

1. `review-diff` runs `plannotator review [optional-pr-url]`.
2. `review-last` runs `plannotator last`.
3. Both rely on a separately managed `plannotator` binary already on `PATH`.
4. Add no helper scripts, transcript parsing, command stubs, hooks, extension package, installer behavior, or asynchronous feedback integration.
5. The user annotates in Plannotator and copy/pastes feedback back as a normal user message.
6. Distribution happens later through `gitgud sync`.

The only adaptation from upstream is to make the skills model-visible by omitting `disable-model-invocation: true`. Harness-specific `last` lookup remains Plannotator’s responsibility; if it cannot identify the current session, the skill reports that failure without guessing.

## Current machine state

No installation was performed during this research.

| Component | Observed state | Consequence |
|---|---|---|
| Standalone binary | `~/.local/bin/plannotator`, SHA-256 `15c01948…`, matching the [`v0.18.0` darwin-arm64 checksum](https://github.com/backnotprop/plannotator/releases/download/v0.18.0/plannotator-darwin-arm64.sha256) | It already supports `plannotator review` and `plannotator last`, so the minimal wrappers can delegate to it. |
| Pi extension | `@plannotator/pi-extension` `v0.24.2` is present in `~/.pi/agent/settings.json` | It currently registers `/plannotator`, `/plannotator-review`, `/plannotator-annotate`, and `/plannotator-last`. That existing local package is outside the portable skill change; removing it would be a separate user decision. See [registrations](https://github.com/backnotprop/plannotator/blob/9bf46e11f30755b60c0eb392362fce3eaaa1966c/apps/pi-extension/index.ts#L429-L436) and [`last`](https://github.com/backnotprop/plannotator/blob/9bf46e11f30755b60c0eb392362fce3eaaa1966c/apps/pi-extension/index.ts#L693-L755). |
| Selected skills | No `review-last` or `review-diff` skill found in the repository, `~/.gitgud/skills`, `~/.pi/agent/skills`, or `~/.agents/skills` | No name collision today. |
| Plannotator config | `~/.plannotator/config.json` only contains `diffOptions`; no privacy overrides are set | Sharing uses its default unless each invocation or config explicitly disables it. |
| Persisted state | Existing `~/.plannotator/{drafts,sessions,history}` directories | Plannotator has already persisted local review state from prior use. |

The binary/extension versions are independent. Adding skill wrappers would execute the older standalone binary, not the embedded `v0.24.2` Pi extension implementation.

## What upstream actually ships

The names are **`plannotator-last`** and **`plannotator-review`**. `plannator` is not the upstream spelling.

Both upstream core skills are tiny prompt wrappers around an external executable:

- [`plannotator-last/SKILL.md`](https://github.com/backnotprop/plannotator/blob/9bf46e11f30755b60c0eb392362fce3eaaa1966c/apps/skills/core/plannotator-last/SKILL.md#L1-L28) runs `plannotator last`.
- [`plannotator-review/SKILL.md`](https://github.com/backnotprop/plannotator/blob/9bf46e11f30755b60c0eb392362fce3eaaa1966c/apps/skills/core/plannotator-review/SKILL.md#L1-L24) runs `plannotator review [optional-pr-url]`.

They contain no browser assets or server code. The compiled binary supplies the UI, local server, VCS integration, persistence, and feedback output.

Both files also set:

```yaml
disable-model-invocation: true
```

In Pi this hides the skill from the model and requires `/skill:name`; it is the opposite of the requested model-invoked behavior. Pi documents that behavior in [`docs/skills.md`](file:///Users/yesh/.nvm/versions/node/v22.22.2/lib/node_modules/@earendil-works/pi-coding-agent/docs/skills.md#L137-L149). The adapted skills must omit this field and use narrow descriptions so ordinary “review this code” requests do not unexpectedly open a browser.

### Pi slash-command distinction

There are two separate command surfaces:

1. **Plannotator extension commands** such as `/plannotator-review`. These disappear only if the Pi extension is removed or changed not to register them.
2. **Pi skill commands** such as `/skill:review-diff`. Pi can expose these for every skill when `enableSkillCommands` is enabled; the documented switch is global, not per skill ([Pi skill commands](file:///Users/yesh/.nvm/versions/node/v22.22.2/lib/node_modules/@earendil-works/pi-coding-agent/docs/skills.md#L73-L90)).

A skills-only package can avoid the first surface. Avoiding the second requires globally disabling Pi skill commands, affecting all skills.

## Feature semantics

### `plannotator-last`

“Last” means the latest eligible rendered **assistant text message**, not the latest plan or saved artifact.

Current CLI behavior:

- `last` is an alias of `annotate-last` ([CLI contract](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/apps/hook/server/cli.ts#L90-L102)).
- `--stdin` bypasses transcript discovery and reviews piped text ([implementation](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/apps/hook/server/index.ts#L1100-L1122)).
- Native transcript discovery supports Codex, Droid, and Claude paths, but not `PI_SESSION_FILE` ([selection logic](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/apps/hook/server/index.ts#L1123-L1227)).
- It may offer up to 25 recent messages when its native transcript parser has them ([picker setup](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/apps/hook/server/index.ts#L1233-L1247)).
- It opens an annotation server, waits for the browser decision, and prints approval, dismissal, or feedback ([output matrix](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/apps/hook/server/index.ts#L194-L241)).

The upstream Pi extension is reliable because it reads the active Pi branch through `ctx.sessionManager.getBranch()`, skips tool-only messages, and joins rendered text blocks ([Pi extraction](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/apps/pi-extension/assistant-message.ts#L50-L115)). A standalone `plannotator last` call from Pi does not use that code and can fail or select an unrelated Claude transcript.

A Pi-specific helper could close that gap, but it is intentionally out of scope. The selected skill simply delegates to `plannotator last`; if the binary cannot identify the session, it reports the failure and the user can use another supported Plannotator flow.

`review-last` must not emit a status message before invoking the binary; upstream explicitly warns that a preamble can become the message being annotated ([skill warning](https://github.com/backnotprop/plannotator/blob/9bf46e11f30755b60c0eb392362fce3eaaa1966c/apps/skills/core/plannotator-last/SKILL.md#L9-L18)).

### `plannotator-review`

The standalone CLI is already a suitable skill boundary.

Local mode:

- Detects Git, JJ, GitButler, or nested repositories.
- Opens even when the selected diff is empty; being outside any current or nested repository is an error.
- Current default is `since-base`: committed branch changes plus staged, unstaged, and untracked work compared with the merge base. This is broader than the root README’s shorthand “uncommitted changes.” See [local flow](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/apps/hook/server/index.ts#L797-L859) and [default diff](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/packages/shared/review-core.ts#L1031-L1061).

PR/MR mode:

- Accepts GitHub PR and GitLab MR URLs.
- Requires authenticated `gh` or `glab`.
- Defaults to a local checkout/worktree for full-file features; `--no-local` limits it to the platform diff.
- May fetch, clone, checkout, create/remove worktrees, or post review actions to the hosting platform. See [PR setup](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/apps/hook/server/index.ts#L555-L753) and [PR actions](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/packages/server/review.ts#L2752-L2805).

The CLI blocks until the browser closes or submits a result, then prints feedback to stdout ([completion path](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/apps/hook/server/index.ts#L870-L895)). No asynchronous handoff is needed; the user can copy/paste feedback back into the conversation normally.

## Selected implementation

| Skill | Command | Extra behavior |
|---|---|---|
| `review-diff` | `plannotator review [optional-pr-url]` | None |
| `review-last` | `plannotator last` | None |

## Security and operational boundary

Plannotator is not strictly a read-only viewer.

Verified behavior:

- Local sessions bind to `127.0.0.1`; detected SSH/remote sessions bind to `0.0.0.0` ([binding](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/packages/server/remote.ts#L145-L151)).
- Sharing defaults enabled. In remote mode, review patches or assistant messages are automatically encoded into a hosted share URL; raw HTML uses an encrypted paste service ([review share](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/apps/hook/server/index.ts#L852-L857), [last share](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/apps/hook/server/index.ts#L1253-L1258), [share implementation](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/packages/server/share-url.ts#L20-L77)).
- Review endpoints support staging/unstaging, file reads, agent jobs, and PR actions; the surface is mutable.
- Draft annotations are plaintext JSON under `~/.plannotator/drafts`, keyed by a content hash ([draft storage](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/packages/shared/draft.ts#L1-L35)).
- `annotate-last` does not write per-file version history because that is limited to mode `annotate`, but its draft/session state can persist ([history eligibility](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/packages/server/annotate.ts#L162-L183)).
- No recognizable analytics/telemetry client was found in audited runtime paths. Network use still exists for PRs, sharing, AI features, and installers.

Adoption guardrails:

```bash
PLANNOTATOR_REMOTE=0 \
PLANNOTATOR_SHARE=disabled \
plannotator ...
```

Current upstream HEAD additionally supports `PLANNOTATOR_AI=disabled`, but that change is after `v0.24.2`; verify the chosen release before relying on it. Prefer a pinned release asset with SHA-256 and GitHub attestation verification. Do not have either skill run `curl | bash` or auto-update the binary.

## Licensing

Upstream is `MIT OR Apache-2.0` ([package declaration](https://github.com/backnotprop/plannotator/blob/0eda139cbec8a5187ee23c3c62df0fc1c8c18f70/package.json#L1-L15)). If adapting upstream skill prose, retain the selected license and copyright notice. Vendoring only adapted prompt text is substantially simpler than vendoring the server/UI dependency graph.

## Settled scope

- Add regular, cross-harness Agent Skills to this repository; do not install them during research.
- Add no custom slash-command files, hooks, settings changes, or extension package.
- Pi’s generic `/skill:review-last` and `/skill:review-diff` entries are acceptable.
- Distribution will happen later through `gitgud sync`.
- Add exactly two prompt-only skill packages; no helper scripts.
- Foreground blocking is acceptable, but no asynchronous feedback delivery is required.
- The user may copy/paste annotation feedback back as an ordinary user message.
- `review-last` delegates session discovery to the binary and fails clearly if discovery is unavailable; it must not reconstruct or guess the previous response.
- Local review preserves Plannotator’s configured/default diff selection.
