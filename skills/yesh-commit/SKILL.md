---
name: yesh-commit
description: Use for /commit, commit-ready flow, logical commits, git status review, PR summaries, "commit in logical blocks", and "commit and push". Runs the final yesh-ship gate when needed, groups only relevant shipped changes, avoids unrelated user work, and verifies before committing when practical.
---

# Yesh Commit

Turn finished work into clean git history.

## Workflow

1. Inspect `git status`, the diff, and recent verification.
2. If the work is not clearly shipped, run the final `yesh-ship` gate first: scoped diff, relevant verification, blocker review, and dirty-tree classification.
3. Separate shipped changes from unrelated/user changes.
4. Group commits by logical behavior, not by file type.
5. Decide logical commit blocks from the diff. Use multiple commits when changes represent separate behavior, tests, docs, or tooling.
6. Stage only the files/hunks for the current block.
7. Use Conventional Commit messages: `type(scope): summary`.
8. Run or cite relevant verification if not already done.
9. Commit each block.
10. Push or open/update PR only when the user asked.

## Output

```md
Committed
- sha `type(scope): summary`
  files:
  - ...

Verification
- ...

Ship gate
- shipped | ran final gate | blocked:
- blockers:

Left alone
- unrelated/user changes:

PR
- title/body/link if created

Notes
- ...
```

## Rules

- Use Conventional Commits unless the repo has a stronger local convention.
- Valid default types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.
- Never rewrite history unless explicitly requested and confirmed.
- Never include debug artifacts unless they are intended deliverables.
- Do not commit unshipped work. Fix or report remaining blockers first.
- If grouping is ambiguous, choose the smaller safe grouping and state it.
- Do not squash distinct logical changes into one commit just for brevity.
- Do not split one atomic behavior across commits.
- Use `git add --patch` or explicit paths when needed to avoid unrelated hunks.
