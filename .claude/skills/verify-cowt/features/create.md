# Create

`cowt create` makes a seeded worktree, optionally carrying uncommitted work, and prints only its path so scripts and agents can `cd "$(cowt create)"`.

## Behaviors

- CREATE-1: stdout is exactly the new path (default `../.worktrees/<repo>/<name>`).
- CREATE-2: `--carry` brings staged (still staged), unstaged, and untracked changes.
- CREATE-3: the new worktree is seeded.
- CREATE-4: `--branch B` checks out an existing branch.
- CREATE-5: a failing `hook.precreate` creates no worktree and no branch.

## User entry points

`cowt create [--name N] [--branch B] [--from REF] [--into DIR] [--carry] [--no-hooks]`. `--from`, `--into` and `--no-hooks` have no check yet.

## Drive

`proof.sh --only CREATE`. It stages a change, adds an unstaged change and an untracked file in `app`, then runs `cowt create --name feat --carry`.

## Proof

Captured stdout compared to the expected path, file contents and `git diff --cached` in the new worktree, `git branch --show-current`, and `git show-ref` for the absent branch.

## Gotchas

- `--carry` reads the source's working state when it runs. Reset the source afterwards, or later checks see the leftover edits.
