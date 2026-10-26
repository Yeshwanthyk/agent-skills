# List and status

`cowt list` shows a repo's worktrees and which are seeded. `cowt status` shows where the trigger lives and what a seed would clone.

## Behaviors

- LIST-1: each worktree appears as `<path><TAB><branch> seeded` once seeded.
- STATUS-1: status names the trigger file and lists nested clone targets.

## User entry points

`cowt list`, `cowt status`, run inside the repo or one of its worktrees.

## Drive

`proof.sh --only LIST` and `proof.sh --only STATUS`. Run them after the SEED checks, which create the worktrees they list. On their own they still pass because setup always runs.

## Proof

grep on the command output for the exact path and trigger file.

## Gotchas

