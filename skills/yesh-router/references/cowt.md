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

It needs macOS on APFS (a Linux filesystem with reflinks also works), plus `git` and `/usr/bin/python3`, which ship with the Xcode command line tools. If `python3` is missing, it falls back to `cp -c -R`, which is about 10x slower.

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
| `cowt status` | the trigger file, the config, what a seed would clone, and the hooks |

`--carry` brings staged and unstaged changes (`git stash create`, applied with `--index`) plus untracked, non-ignored files. Stdout carries only the path, and all logs go to stderr.

## Config

`.cowt` at the repo root (commit it) and `.git/cowt` (this machine only) are both git-config files, read in that order:

```ini
[copy]
	name = node_modules        # a directory name, cloned wherever it appears up to depth 4; the default
	path = .env                # a path or glob relative to the root
	path = apps/*/.env.local
[hook]
	precreate = pnpm run check                       # in the source; failure creates nothing (cowt create only)
	postcreate = pnpm install --offline --frozen-lockfile  # in the new worktree
	preremove = docker compose -p "wt-$COWT_NAME" down -v  # failure removes nothing
	postremove = echo "removed $COWT_DESTINATION"
```

Hooks run through `$SHELL -lc`, so they see your login PATH even inside a git hook. They receive `COWT_SOURCE` (the main checkout), `COWT_DESTINATION`, `COWT_NAME` and `COWT_BRANCH`. A failing `postcreate` leaves the worktree in place and prints the `cowt seed` command to rerun.

## Limits

- Cloned `node_modules` match the main checkout. If the branch changes dependencies, run the install (or set it as `postcreate`).
- `cowt remove` is for worktrees you own. Let T3 Code remove its own worktrees, so its records stay right.
- Directory names to clone are found up to depth 4. Deeper ones need a `copy.path` entry.
