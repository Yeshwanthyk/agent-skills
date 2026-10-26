# Seed on any worktree add

Any tool that runs `git worktree add` in an initialized repo gets a worktree that already has node_modules and the configured paths, without a reinstall.

## Behaviors

- SEED-1: root and nested `node_modules` are cloned.
- SEED-2: symlinks inside them stay symlinks.
- SEED-3: `copy.path` entries such as `.env` are cloned.
- SEED-4: `hook.postcreate` runs in the new worktree with `COWT_NAME`, `COWT_BRANCH`, `COWT_SOURCE` set.
- SEED-5: a second `cowt seed` is a no-op ("already seeded").
- SEED-6: the seeded worktree has a clean `git status`.
- SEED-7: a failing postcreate never fails `git worktree add`, and the clones are still there.
- SEED-8: `cowt seed <path>` fills a worktree made with `--no-checkout`.
- REAL-1, REAL-2 (`--real`): a real repo seeds, with seconds and disk MB recorded, and leaves no worktree or branch behind.

## User entry points

- `git -c checkout.workers=N worktree add -b B PATH REF` (T3 Code's exact call; SEED-1..6).
- Plain `git worktree add` (SEED-7).
- `cowt seed PATH` (SEED-5, SEED-8).

## Drive

`proof.sh --only SEED`, and `proof.sh --only REAL --real REPO` for the real repo. The scratch repo `app` has a `.cowt` with `copy.name=node_modules`, `copy.path=.env`, and a postcreate that writes `.cowt-ran`.

## Proof

File contents read from the new worktree, `test -L` on the symlink, `git status --porcelain` empty, git's exit code for SEED-7, and the `METRIC` rows in `results.tsv`.

## Gotchas

- A postcreate that writes into the worktree dirties `git status` unless the file is ignored. The scratch repo ignores `.cowt-ran` for this reason.
- The global `core.fsmonitor=true` prints "could not read IPC response" in temp repos. The scratch git config turns it off. Seeing it means isolation leaked.
- macOS reports `/var/...` temp paths as `/private/var/...`. Compare paths after `pwd -P`.
