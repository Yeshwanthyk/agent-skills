# skilleval

Checks whether agents actually pick and follow the right skills in this
collection. It runs real harnesses headlessly against a small fixture repo and
grades what they did.

This is a local tool. It lives outside `skills/`, so it is never installed with
the skills. The skills do not depend on it.

## Run

From `eval/`, with Python 3.11+ and the harness CLI on `PATH`:

```bash
python3 -m skilleval lint
```

```bash
python3 -m skilleval run --tier route
```

```bash
python3 -m skilleval run --harness pi --file routing
```

```bash
python3 -m skilleval report
```

```bash
python3 -m skilleval compare <base-run> <head-run>
```

| Command | What it does |
| --- | --- |
| `lint` | Runs static checks with no model calls: the router structure checker, frontmatter, description length, portability (install paths, host config paths, Jev/gitgud), and catalog methods that no case covers. |
| `run` | Runs cases. Selectors: `--only ID…`, `--file routing playbooks`, `--tag …`, `--tier route\|task`. |
| `report` | Summarizes a run, the latest by default. Trials that died on an account limit or outage show as `INFRA`, are left out of the totals, and are listed with a ready `--only` rerun. |
| `compare` | Lists cases that flipped between two runs. |
| `regrade` | Re-grades a saved run with the current parsers, checks, and case expectations. It makes no model calls, so use it after editing a grader or an `expect`. |
| `list` | Lists the cases. |

Useful `run` flags:

| Flag | Effect |
| --- | --- |
| `--harness claude\|pi` | The default is `claude` with `claude-opus-5-5`. For pi, the default is pi's own default model. |
| `--model`, `--effort` | Passed through to the harness: `--effort` for Claude, `--thinking` for pi. |
| `--activation plain\|router` | Overrides every case's activation. Use it to A/B test the router. |
| `--skills PATH` | Tests another skills directory, for example an installed copy, to check drift. |
| `--repeat N` | Runs N trials per case. Single trials are noisy, so use this before trusting a flip. |
| `-j N` | Number of parallel cases. |
| `--keep-ws` | Keeps the workspaces for inspection. |

Results go to `eval/results/<run>/`, which is gitignored:

- `meta.json` holds the harness, model, skills content hash, git revision, and dirty flag.
- Each case gets `transcript.jsonl` and `result.json`.

## Isolation

Each case gets a fresh temp workspace outside this repo:

- The fixture repo (`fixtures/<name>/setup.sh`).
- A copy of the skills in `.claude/skills/`.

User skills, settings, MCP servers, extensions, and context files are
excluded. Claude runs with `--setting-sources project --strict-mcp-config`; pi
runs with `--no-skills --no-context-files --no-extensions --skill <each>`.

A result therefore reflects the skill text alone, whatever is installed
wherever. Claude Code's built-in skills (such as `debug`, `verify`, and `run`)
stay visible. That is deliberate, because real use competes with them too.

## Add a case

Append this to a file in `cases/`:

```toml
[[case]]
id = "why-retry-cap"            # unique
activation = "router"           # router: prompt gets "Use yesh-router. " and the router must load
tier = "route"                  # route: selection only, capped turns; task: run to completion
prompt = "Why is MAX_ATTEMPTS in retry.py 3?"
expect = { methods = ["why"], not_methods = ["how"], no_edits = true }
notes = "optional"
```

Write prompts the way you actually talk. In particular, describe the outcome
you want without naming the method. The point is to find out whether the right
method is reached when you don't know its name.

### Expectation keys

A method is a skill or a router playbook. The expectations below apply to both.

| Key | Passes when |
| --- | --- |
| `methods = [...]` | Every listed method was used: its skill was loaded, or its playbook file was read. |
| `any_method = [...]` | At least one of the listed methods was used. |
| `not_methods = [...]` | None of the listed methods were used. |
| `no_methods = true` | Nothing besides the router was used. Use this for trivial requests. |
| `no_edits = true` | The workspace is unchanged. Changes are detected from `git status`, so shell edits count. |
| `edits_any = [...]` | Some changed path contains one of the listed substrings. |
| `reads = [...]` | Some skill file read contains each listed substring, for example `references/principles/prove-it-works.md`. |
| `answer = [...]` | Each regex matches the final answer. Case-insensitive. |
| `max_skill_files = N` | At most N skill files were read. This is a cost and overhead check. |

To add a check, write one function in `skilleval/grade.py` and register it in
`CHECKS`. To add a fixture, add `fixtures/<name>/setup.sh` that builds a repo in
`$1`, then set `fixture = "<name>"` on the case.

Skill use is detected from what the agent did, in any harness:

- a skill tool call
- a read of `skills/<name>/SKILL.md`, through a read tool or a shell command
- a delegation brief that names that file

## Improvement loop

1. **Baseline.** Run `run --tier route --repeat 3` and note the run name.
2. **Find the failures.** In `report`, read the failing cases' `transcript.jsonl`. Classify each failure:
   - the right method was never considered (description or catalog wording)
   - the wrong method won (tie-break)
   - the method loaded but was not followed (skill body)
3. **Change one thing** in `skills/`.
4. **Re-run** the same selection and `compare` the base run with the head run. Keep the change only if it fixes cases without breaking others across repeats.
5. **Add a case** whenever a real session goes wrong, using the prompt as you actually typed it. The suite grows from real misses.

`lint` lists the catalog methods that no case covers. Treat that list as the
coverage to-do.
