# Init and uninit

`cowt init` installs the trigger into whichever post-checkout hook the repo's git actually runs, and `cowt uninit` undoes it exactly.

## Behaviors

- INIT-1: running init again keeps exactly one block.
- INIT-2: an existing hook that ends in `exec` still runs, and seeding runs too.
- INIT-3: uninit restores an existing hook byte for byte.
- INIT-4: in a husky or vite-hooks repo (`core.hooksPath=<dir>/_`), the trigger goes beside the `_` runner and `git status` stays clean.
- INIT-5: a husky repo seeds new worktrees.
- INIT-6: after uninit, new worktrees are not seeded, and a hook file that init created is gone.

## User entry points

`cowt init [repo…]`, `cowt uninit [repo…]`.

## Drive

`proof.sh --only INIT`. It builds the scratch repos `ex` (a pre-existing hook) and `hu` (a husky v9 layout).

## Proof

`grep -c` on the block marker, a log line written by the original hook, `cmp` against a saved copy of the hook, `git status --porcelain`, and file presence in new worktrees.

## Gotchas

- A repo whose `core.hooksPath` points into another repo's `.git/hooks` (merlin) shares its hooks with that repo. Don't init it blindly.
