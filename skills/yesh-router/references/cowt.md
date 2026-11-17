# cowt: copy-on-write git worktrees

In a repo set up with `cowt init`, every new git worktree gets the main checkout's `node_modules` (and any paths you configure) as an APFS clone, then runs the repo's setup hooks. It doesn't matter what created the worktree: plain `git worktree add`, T3 Code, Claude Code, opencode, or an agent. A 1.4 GB, 80k-file `node_modules` (scotty) seeds in about 1s, and nothing extra goes on disk until a file changes.

It borrows from [anomalyco/rift](https://github.com/anomalyco/rift): instant copy-on-write, lifecycle hooks, the path on stdout, carrying your working state, trash plus `gc`, and shell `cd`. Rift itself doesn't fit here. It makes detached directory copies instead of git worktrees, it rejects linked worktrees, it skips `node_modules` unless you pass `--copy-all`, and its tool integration is an opencode plugin. cowt keeps real git worktrees and hooks into git, so any tool that uses git gets it.

## Install

cowt ships in this skill as `bin/cowt` and updates with the skills. Link the installed copy onto `PATH`, never a working checkout, so edits in progress never reach live repos:

```sh
mkdir -p ~/.local/bin
ln -sf <skills-dir>/yesh-router/bin/cowt ~/.local/bin/cowt
cowt init <repo>...   # each repo whose worktrees should be seeded
```

Repo hooks call `~/.local/bin/cowt`, so updating the skills updates every repo.

It needs macOS on APFS or Linux on a reflink filesystem (btrfs, XFS), plus `git` and `/usr/bin/python3`, which ship with the Xcode command line tools. If `python3` is missing on macOS, it falls back to `cp -c -R`, which is about 10x slower. On Linux, see [Linux](#linux-btrfs-and-xfs).

Optional: `eval "$(cowt shell-init zsh)"` in `.zshrc` makes `cowt create` and `cowt remove` cd for you.

## How the trigger works

`cowt init` adds one marked block, right after the shebang, to the `post-checkout` hook that the repo's git actually runs:

| Repo uses | Block goes in |
| --- | --- |
| default hooks | `.git/hooks/post-checkout` |
| husky or vite-hooks (`core.hooksPath = <dir>/_`) | `<dir>/post-checkout`, listed in `.git/info/exclude` so `git status` stays clean |
| another `core.hooksPath` | that directory's `post-checkout` |

An existing `post-checkout` is kept, and the block runs before any `exec` in it. The block calls `cowt hook post-checkout` only for a brand-new linked worktree (null previous HEAD), and it always exits 0, so a failed seed never fails `git worktree add`. `cowt uninit` puts the file back exactly as it was.

A tool that creates worktrees without a checkout (`--no-checkout`) can call `cowt seed <path>`. Seeding happens once per worktree; a stamp file in the worktree's git dir records it.

## Commands

| Command | Does |
| --- | --- |
| `cowt init [repo…]` / `cowt uninit [repo…]` | add or remove the trigger |
| `cowt create [--name N] [--branch B] [--from REF] [--into DIR] [--carry] [--no-hooks]` | `git worktree add`, carry changes, seed, print the path. Default location: `../.worktrees/<repo>/<name>` |
| `cowt seed [path] [--force]` | seed an existing worktree |
| `cowt list` | the repo's worktrees, marked when seeded |
| `cowt remove [path] [-f] [--no-hooks]` | move to `.cowt-trash/` beside it and prune git's record. Instant, even when deleting would take 10s. Refuses uncommitted changes without `-f`, and refuses locked worktrees. The branch is kept |
| `cowt gc` | delete this repo's trashed worktrees |
| `cowt status` | the trigger file, the config, what a seed would clone, and the hooks; on btrfs, marks directories that are subvolumes |
| `cowt subvol [path]` | Linux btrfs: make this checkout's seeded directories subvolumes, so seeds snapshot them. See [Linux](#linux-btrfs-and-xfs) |

`--carry` brings staged and unstaged changes (`git stash create`, applied with `--index`) plus untracked, non-ignored files. Stdout carries only the path, and all logs go to stderr.

## Config

`.cowt` at the repo root (commit it) and `.git/cowt` (this machine only) are both git-config files, read in that order:

```ini
[copy]
	name = node_modules        # a directory name, cloned wherever it appears up to depth 4; the default
	path = .env                # a path or glob relative to the root
	path = apps/*/.env.local
	cargo = false              # skip the Cargo target/ clone (on by default)
	cargowait = 5              # seconds to wait for a running cargo build to release target/ (default 5)
[hook]
	precreate = pnpm run check                       # in the source; failure creates nothing (cowt create only)
	drift = pnpm install --frozen-lockfile               # only when a cloned directory's lockfile matched no checkout
	postcreate = pnpm install --offline --frozen-lockfile  # in the new worktree
	preremove = docker compose -p "wt-$COWT_NAME" down -v  # failure removes nothing
	postremove = echo "removed $COWT_DESTINATION"
```

Hooks run through `$SHELL -lc`, so they see your login PATH even inside a git hook. They receive `COWT_SOURCE` (the main checkout), `COWT_DESTINATION`, `COWT_NAME` and `COWT_BRANCH`; `drift` and `postcreate` also get `COWT_DRIFT`, the cloned paths whose lockfile matched no checkout, one per line. `drift` runs before `postcreate`, and only when `COWT_DRIFT` is non-empty.

## Which checkout donates

Each cloned directory (`node_modules`, a Cargo `target/`, any `copy.name`) can come from the main checkout or any other worktree of the repo. For each one, cowt finds the nearest lockfile at or above it in the new worktree (`Cargo.lock` for `target/`; `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lock`, `uv.lock`, `poetry.lock`, `Gemfile.lock` and similar otherwise) and picks, in order:

1. a checkout whose copy of that lockfile is byte-identical, a btrfs subvolume first, then the most recent install or build (`.modules.yaml`, `.package-lock.json` or `.yarn-state.yml` for node; `target/*/deps` and `.fingerprint` for Cargo);
2. otherwise the main checkout, then the rest, most recent first. This is drift: cowt logs it and runs `hook.drift`.

A directory that exists only in another worktree, say a `target/` that main never built, is still cloned. `copy.path` entries always come from the main checkout. A failing `postcreate` leaves the worktree in place and prints the `cowt seed` command to rerun.

## Limits

- Without a lockfile in the new worktree there is no match to find, so the donor is main, as before. With drift, cloned `node_modules` are the nearest guess; set `hook.drift` to the install.
- `cowt remove` is for worktrees you own. Let T3 Code remove its own worktrees, so its records stay right.
- Directory names to clone are found up to depth 4. Deeper ones need a `copy.path` entry.
- Only the default `target/` beside a `Cargo.lock` is cloned. A `CARGO_TARGET_DIR` or `build.target-dir` elsewhere is not.

## Linux: btrfs and XFS

macOS clones a whole directory with one `clonefile` call. Linux has no such call, so a plain directory is copied with `cp --reflink`, one file at a time, across 8 parallel workers. On btrfs, a directory that is a subvolume clones with one `btrfs subvolume snapshot` instead.

Measured on scotty's `node_modules` (77k files, btrfs, 16 cores), 7 runs each:

| Seed | Time |
| --- | --- |
| one `cp --reflink` (before) | 1.78s |
| 8 parallel `cp --reflink` workers | 1.19s |
| snapshot of a subvolume | 0.15s |

To get snapshots, run `cowt subvol` once in the main checkout. It turns each directory a seed would clone into a subvolume with the same contents, and worktrees seeded from it are subvolumes too. Run it while nothing writes to those directories. Rerun it after a tool deletes and recreates one: `npm ci` does, while `pnpm install` updates in place. `cowt status` shows `(subvolume)` beside each converted directory.

Removal is not faster. Without root, `btrfs subvolume delete` needs the `user_subvol_rm_allowed` mount option, so `cowt gc` uses `rm -rf`, which removes a subvolume as fast as a plain directory (about 1.3s for scotty). XFS and other reflink filesystems use the parallel copy. ext4 has no reflinks, so seeding fails there.

## Rust: Cargo target directories

In a Rust repo, cowt also clones the `target/` beside each `Cargo.lock` (up to depth 4), so a new worktree starts with the main checkout's compiled dependencies. This is the "new-target seeding" idea from [kache](https://github.com/kunobi-ninja/kache), done with one directory clone instead of a compiler wrapper:

- Registry and git dependencies keep the same unit hash in every checkout, so Cargo reports them `Fresh` and skips them.
- The worktree's own crates rebuild, because checkout writes their sources after the cloned fingerprints were recorded. A cloned target cannot run a stale binary of your edited code.
- A `target/` that a running `cargo` build holds locked is never cloned half-written. cowt moves to the next idle donor; when only busy ones share the lockfile, it waits up to `copy.cargowait` seconds (default 5) for one to finish. With every donor still busy, it skips `target/` with a log line.
- A build script that records an absolute path (say `rerun-if-changed=$CARGO_MANIFEST_DIR/...`) still tracks the worktree's file, not main's: the worktree's build script is newer than its cloned fingerprint, so it reruns and records the worktree path. CARGO-6 checks this.
- Set `copy.cargo = false` to turn it off.

Measured on macOS APFS with cargo 1.98, one run each:

| Repo | Cold worktree build | Seeded worktree build | Units compiled when seeded |
| --- | --- | --- | --- |
| small serde/serde_json crate | 3.2s | 0.47s | 1 |
| kache workspace (13 members, 403 units) | 34.6s | 22.4s | 10 of 403 |

The seeded time is the workspace's own crates, which rebuild on every new checkout. Main must have been built with the same command and features: a `target/` built with `cargo build --workspace` gives a plain `cargo build` different feature sets and new unit hashes, so about 70 dependencies compiled again in that case.

The cloned `target/debug/incremental` gives little: 22.4s with it, 23.3s without, within run-to-run noise. It is kept because a clone costs no disk until written.

kache goes further: a content-addressed store shared by every checkout, hits after the branches diverge, remote caches, and C/C++. It needs no cowt support. If kache is installed, cowt's clone means kache's own seeding has nothing to do, and its artifact cache still serves the misses.
