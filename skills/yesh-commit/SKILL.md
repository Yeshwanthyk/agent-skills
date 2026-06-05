---
name: yesh-commit
description: Use for /commit, commit-ready flow, logical commits, git status review, PR summaries, "commit in logical blocks", and "commit and push". Groups only relevant changes, avoids unrelated user work, and verifies before committing when practical.
---

# Yesh Commit

Turn finished work into clean git history.

## Workflow

1. Inspect `git status` and the diff.
2. Separate own changes from unrelated/user changes.
3. Group commits by logical behavior, not by file type.
4. Decide logical commit blocks from the diff. Use multiple commits when changes represent separate behavior, tests, docs, or tooling.
5. Stage only the files/hunks for the current block.
6. Use Conventional Commit messages: `type(scope): summary`.
7. Run or cite relevant verification if not already done.
8. Commit each block.
9. Push or open/update PR only when the user asked.

## Output

```md
Committed
- sha `type(scope): summary`
  files:
  - ...

Verification
- ...

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
- If grouping is ambiguous, choose the smaller safe grouping and state it.
- Do not squash distinct logical changes into one commit just for brevity.
- Do not split one atomic behavior across commits.
- Use `git add --patch` or explicit paths when needed to avoid unrelated hunks.
