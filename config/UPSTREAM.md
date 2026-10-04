# Upstream: pstack

This collection forked from [pstack](https://github.com/cursor/plugins/tree/main/pstack) and has since been reshaped around `yesh-router`. Port ideas, not files: skills here must stay harness-neutral (Claude Code, Codex, pi), with no Cursor-only agents, rules files, or model names.

Last reviewed: `e43c7ee` (pstack 0.15.9, 2026-10-04). Run `scripts/upstream-diff.sh` to list upstream commits since then, review them, then update this line and the table.

| Upstream | Decision | Here |
| --- | --- | --- |
| correct | ported | `skills/correct` |
| architect (#495 agent-contributor red flags) | ported | `skills/architect` |
| benchmark-checklist | adapted | `skills/benchmark-checklist` |
| principle-explain-the-number | adapted | `references/principles/explain-the-number.md` |
| perf-issue, hillclimb playbooks | adapted | mantras, harness vetting, stop predicate, plateau rules |
| principle-separate-before-serializing-shared-state | merged | `references/principles/state-ownership.md` |
| tdd | merged | `skills/debug` (Correct section) |
| technical-writing | merged | `skills/unslop/references/technical-writing.md` |
| unslop pattern catalog | adapted | `skills/unslop/references/patterns.md` |
| teach | adapted | `skills/teach`, escalates to show-me and the explainer skills |
| principle-subtract-before-you-add, laziness-protocol, minimize-reader-load | merged | `references/principles/simplicity.md` |
| other `principle-*` skills | merged | `references/principles/` notes loaded via `principle-triggers.md` |
| poteto-mode, setup-pstack | skipped | `yesh-router` fills this role |
| poteto-mode PR/stack playbooks (babysit, shipping, autopilot-*, worktree-cleanup, opening-a-pr) | skipped | Cursor/forge-specific workflow |
| no-comments, comment-sicko agent | skipped | depends on a Cursor agent type |
| make-bot-ui, typescript-best-practices | skipped | not needed |
