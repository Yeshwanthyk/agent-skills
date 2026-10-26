# Remove and gc

`cowt remove` gets a worktree out of the way instantly and safely. `cowt gc` deletes what was trashed.

## Behaviors

- REMOVE-1: uncommitted changes block removal without `-f`.
- REMOVE-2: `-f` moves the worktree to `.cowt-trash/`, prunes git's record, keeps the branch, and prints the main checkout.
- REMOVE-3: a locked worktree is refused even with `-f`.
- GC-1: `cowt gc` empties `.cowt-trash/`.

## User entry points

`cowt remove [path] [-f] [--no-hooks]`, `cowt rm`, `cowt gc`. The preremove/postremove hooks have no check yet.

## Drive

`proof.sh --only REMOVE` then `proof.sh --only GC`, or both in one full run.

## Proof

The directory's presence before and after, `git worktree list`, `git show-ref refs/heads/feat`, captured stdout, and `ls -A .cowt-trash`.

## Gotchas

- Don't drive `cowt remove` against a T3 Code worktree in a real repo. T3 keeps its own records of its worktrees.
