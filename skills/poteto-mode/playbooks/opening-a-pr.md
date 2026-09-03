# Opening a PR

Run this playbook after coding work. It prepares a reviewable change. It does not publish without existing user authorization.

1. Inspect the worktree. Separate unrelated edits. Use a clean worktree when the current one contains unrelated work.
2. Rebase into small ordered commits. Each commit must stand alone and explain one coherent change. Use `type(scope): subject` with a short imperative subject and no final period.
3. Clean prose with `unslop`. Remove comments that restate code. Keep comments only when they record a non-obvious constraint, decision, or side effect.
4. Review the diff with `blast-radius` when the change looks small but can affect callers, state, persistence, or external systems. Run `interrogate` when the change is contested or high risk.
5. Run repository lint, type checks, focused tests, and the real-surface verifier that owns the changed behavior. Inspect the actual diff and receipts.
6. Resolve the repository's forge once from its configuration and available CLI. Use one supported forge consistently for create, edit, view, checks, and merge. Read current CLI help before each unfamiliar operation. Do not assume a forge or stack tool.
7. Prepare the PR title and description with these sections when they contain content. `## Why`, `## Scope`, `## Tradeoffs`, `## Blast Radius`, and `## Verification`. Name real paths, symbols, checks, and outcomes.
8. Publish only when the user already authorized the push or PR action. Otherwise leave the commits and prepared text locally and report the authorization gate.
9. Do not start babysitting because a PR opened. Route later PR-status work to `babysit`. Route landing work to `shipping`.

## Completion

The change has ordered commits, clean prose, a checked diff, recorded verification, and a publication decision within the authorization boundary.

**Reply:** changed paths, commit order, verification evidence, forge choice if used, PR link if one exists, and the next authorization gate.
