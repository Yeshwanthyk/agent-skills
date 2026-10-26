---
name: verify-cowt
description: Verify the cowt CLI (skills/yesh-router/bin/cowt), the copy-on-write git worktree tool, by driving it in isolated scratch repos and scoring each behavior PASS/FAIL. Use after editing cowt, before committing a cowt change, and as the score for planning or hillclimbing new cowt features.
---

# Verify cowt

The surface is the `cowt` CLI and the `post-checkout` trigger it installs, so any tool's `git worktree add` (T3 Code, Claude Code, an agent) gets seeded. The tool and its docs are `skills/yesh-router/bin/cowt` and `skills/yesh-router/references/cowt.md`.

## Launch

Nothing stays running. Each proof run creates `${TMPDIR}verify-cowt-XXXXXX/`, builds scratch repos under `scratch/` inside it, and points `HOME`, `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_NOSYSTEM` and `SHELL=/bin/sh` at scratch state. Because the scratch HOME has no `~/.local/bin/cowt`, the trigger block calls the cowt under test, not the installed one. Prerequisites: macOS on APFS (or Linux with reflinks), git with `--path-format`, and `/usr/bin/python3`.

## Doctor

```sh
.claude/skills/verify-cowt/scripts/doctor.sh [--bin PATH]
```

Read-only. It FAILs on a cowt that isn't executable or doesn't parse (`sh -n`), a git without `--path-format`, a non-APFS volume, python3 unable to call clonefile, or less than 5 GB free. It warns, without blocking, on shellcheck warnings, a `~/.local/bin/cowt` that points somewhere else, and old `verify-cowt-*` dirs. Stop on any `FAIL`.

## Drive

```sh
.claude/skills/verify-cowt/scripts/proof.sh                      # every behavior, scratch repos only
.claude/skills/verify-cowt/scripts/proof.sh --only SEED          # one feature, by behavior-ID prefix
.claude/skills/verify-cowt/scripts/proof.sh --real ~/code/personal/scotty   # plus one real repo
.claude/skills/verify-cowt/scripts/proof.sh --bin /path/to/candidate/cowt   # a candidate build
```

It prints one `PASS <ID> <behavior>` or `FAIL <ID> <behavior>` line per behavior and ends with `score <pass>/<total>`. Exit 0 only when every selected check passes. Worktrees are created the way real tools create them: `git -c checkout.workers=N worktree add -b <branch> <path> HEAD` is exactly T3 Code's call, and `cowt create` is the CLI path. Behavior IDs and what each one drives are in the feature files.

`--real REPO` adds a branch `verify-cowt-<pid>` and a worktree inside the scratch dir, seeds it with hooks off, prints `METRIC real_seed_seconds` and `METRIC real_disk_mb`, then removes the worktree and the branch and runs `gc`. It never runs the repo's own hooks or install. The baseline on scotty (1.4 GB, 80k-file node_modules) is about 1.5–2.5 s and under 50 MB.

For hillclimbing, the score line is the metric: a candidate must keep every existing ID passing and add IDs for the new behavior. Write the new checks into `proof.sh` before the implementation, so they FAIL first.

## Evidence

`${TMPDIR}verify-cowt-XXXXXX/log.txt` has every command and its output. `results.tsv` has one `PASS|FAIL<TAB>ID<TAB>behavior` row per check, plus `METRIC` rows for `--real`. Side effects are checked through a second view, not cowt's own report: file contents in the new worktree, `git worktree list`, `git show-ref`, `git status --porcelain`, `cmp` against the original hook.

## Cleanup

The run deletes `scratch/` unless `--keep` is passed, and `--real` removes its worktree and branch from the real repo. `log.txt` and `results.tsv` stay. Delete old evidence with `rm -rf "${TMPDIR}"verify-cowt-*` once it's no longer needed. A run killed partway can leave a `verify-cowt-*` branch in the `--real` repo: `git -C REPO branch -D verify-cowt-<pid>` and `git -C REPO worktree prune`.

## Features

The index and the per-feature recipes are in [features/README.md](features/README.md).
