# Astra skill rewrite

## Result

Reviewed all 27 active skill entrypoints and their supporting instructions. Renamed `poteto-mode` to `yesh-mode` and `yesh-structure-review` to `structure-review`. Retained 23 task playbooks and reduced the shared principles to five focused notes. The pinned `incoming/pstack` source snapshot was not changed.

The [official Astra guide](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra) informed the rewrite: define the requested outcome, give bounded authority to finish it, keep instructions contextual, and make verification proportional. This collection keeps reusable workflow knowledge without making every task run a fixed sequence of skills, reviews, or tests.

The [shared routing contract](../skills/yesh-mode/references/agent-routing.md) applies across workflows:

| Role | Model | Reasoning |
| --- | --- | --- |
| Scout | openai-codex/gpt-5.6-luna | max |
| Implementation | openai-codex/gpt-6-astra | medium |
| Review | openai-codex/gpt-6-astra | medium |
| High-level audit | openai-codex/gpt-6-astra | high |

Runtime-specific dispatch recipes were removed. A harness may require a documented identifier mapping, but must not silently substitute models. PR work requires an explicit request. Persistence does not authorize unrelated edits, commits, publishing, or merging.

## Verification

- All 27 skill schemas passed the skill-creator validator.
- Local Markdown links resolved; `git diff --check` passed.
- Two isolated Astra-medium coding probes passed: zero-delay parsing and idempotent credit application. Independent semantic checks also passed.
- An independent Astra-high collection audit found scope and review defects, which were corrected: architecture-only and diagnosis-only requests stop at findings; verifier audits need not edit; changed callers can cause regressions in unchanged code; standalone delegation uses shared defaults.
- The audit also reproduced explainer-validator false positives and missing relative-asset checks. Seven focused regression tests and the starter HTML validation passed after correction.

These are structural checks and small behavior probes, not an A/B benchmark or proof that every workflow performs better. The HTML validator is a static heuristic, not a network sandbox. No installation, commit, or PR was performed.
