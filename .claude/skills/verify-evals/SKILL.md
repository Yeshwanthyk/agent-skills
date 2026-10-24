---
name: verify-evals
description: Verify skill changes in this repo through the skilleval CLI, running only the eval cases added or changed since a base ref and checking that they target the skills that changed. Use after editing skills/ or eval/cases, before committing or pushing a skill change.
---

# Verify evals

The surface is the `skilleval` CLI in `eval/`. It runs a real harness (Claude Code or pi) headlessly against a fixture repo and grades which skills the agent used. This skill runs only the newest cases and checks that they are the right ones. The harness docs are `eval/README.md`.

## Launch

Nothing stays running. Each case builds its own temp workspace from `eval/fixtures/<name>/setup.sh`, copies the working tree's `skills/` into it, runs the harness, and removes the workspace unless `--keep-ws` is passed. Prerequisites: Python 3.11+, and the `claude` CLI (or `pi`) on `PATH`, logged in.

## Doctor

```sh
.claude/skills/verify-evals/scripts/doctor.sh            # or: doctor.sh pi
```

It checks Python, the harness CLI, the fixtures, and that `skilleval lint` reports 0 errors, then prints how many `skills/` paths are dirty. Runs test the working tree, so uncommitted skill edits are what gets graded. Stop on any `FAIL`.

Two `warn` lines don't block a run. `install` warns when the gitgud lock (`GITGUD_LOCK`, default `~/.gitgud/gitgud.lock.json`) predates the last `skills/` commit: real sessions still load the old skills. A stale-workspace line counts `skilleval-*` temp dirs older than two hours, left by killed runs.

## Select

```sh
python3 .claude/skills/verify-evals/scripts/select_new.py [--base REF] [--strict]
```

The default base is `HEAD`, which selects cases added or changed in uncommitted work. To cover a committed change, pass the commit before it, for example `--base HEAD~1` or `--base origin/main`. Read every section before running:

- **SELECTED** is the run set. "none" means no case was added. Add one per `eval/README.md` → "Add a case" before going on.
- **COVERAGE** must show `ok` for every changed method. A `GAP` means a skill changed with no new case expecting it: add a case, or say why none applies. `--strict` turns a GAP into exit 1.
- **READS** lists changed reference files. `none` means no case checks the agent opened that file, so a pass proves routing, not that the new reference was followed. Add `reads = ["<skill>/references/<file>.md"]` to a case when following that file is the point of the change. Route-tier cases stop at 8 turns, so a reference deeper than the first hop needs `tier = "task"`.
- **WARN** marks a case that expects a user-invoked skill (`disable-model-invocation: true`) without `activation = "router"`. It fails under plain activation by design, so either judge only its router run or set `activation = "router"` on the case.

## Drive

From `eval/`, paste the printed commands. When scripting with `--ids` in zsh, expand with `${=ids}`, since a plain `$ids` stays one argument and selects nothing. Use `--repeat 3` before trusting a pass or a flip; a single trial is a smoke run.

```sh
python3 -m skilleval run --only <ids> --activation router --repeat 3 --label new-router
python3 -m skilleval run --only <ids> --activation plain  --repeat 3 --label new-plain
python3 -m skilleval report                      # latest run; pass a run name for another
```

To check whether a failure is caused by the change, run the same selection with `--skills <path-to-base-checkout>/skills` and use `python3 -m skilleval compare <base-run> <head-run>`.

## Ship

A passing run proves the working tree, not what sessions load. After the change is committed and pushed, install it from outside the repo, then rerun doctor until `install` shows `ok`:

```sh
cd ~ && gitgud update --global && gitgud apply --global && python3 <repo>/scripts/build-mode.py
```

Each machine has its own install, so every machine needs this step.

## Evidence

- `eval/results/<run>/meta.json`: harness, model, git revision, `repo_dirty`, and `skills_hash`. Confirm `repo_dirty: true` when grading uncommitted edits, or the run tested something else.
- `eval/results/<run>/<case>/result.json`: each check with pass or fail and its detail. `transcript.jsonl` shows which skill files the agent read.
- `report` output, where account-limit or outage trials show as `INFRA` and are left out of the totals. Rerun those with the `--only` line it prints.

When a case fails, read its transcript and classify the failure per `eval/README.md` → "Improvement loop" (never considered, wrong method won, loaded but not followed). A case whose expectation is wrong is a verifier defect: fix the case, then `python3 -m skilleval regrade <run>` with no model calls. A skill that routes or behaves wrongly is a product defect. Behavior rules also get checks, not only routing: `no_text_diagram = true` fails a case whose reply drew box art instead of using viz.

## Cleanup

Workspaces are removed automatically. After a `--keep-ws` run, remove the `skilleval-<case>-*` temp directories listed in each `result.json` `workspace` field. Keep `eval/results/<run>/`, which is gitignored, as the evidence.

## Features

See [features/README.md](features/README.md).
