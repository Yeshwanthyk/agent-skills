# run-new

Run the selected cases and get a graded pass or fail for each.

## Behaviors

- **R1** `skilleval run --only <ids>` runs exactly the selected cases and writes `eval/results/<run>/`.
- **R2** `meta.json` records `repo_dirty` and `skills_hash` for the skills that were tested.
- **R3** `report` lists pass or fail per case and check, with INFRA trials kept out of the totals.

## User entry points

- `--activation router`: the prompt gets the router prefix, so user-invoked skills are reachable.
- `--activation plain`: only model-invoked skills and their descriptions are reachable.

## Drive

```sh
cd eval
python3 -m skilleval run --only <ids> --activation router --repeat 1 --label smoke-router
python3 -m skilleval report
```

Each action's observable result: `run` prints one line per trial with pass or fail, `report` prints the per-check table, and `result.json` holds the checks.

## Proof

The run directory exists. `meta.json` has `repo_dirty: true` when grading uncommitted edits. Each selected id has a `result.json` whose `checks` list includes every key in the case's `expect`.

## Gotchas

- A route-tier case stops at 8 turns. A method reached late is graded as missing, so judge that against the transcript before blaming the skill.
- A single trial is noisy. Use `--repeat 3` before acting on a result.
