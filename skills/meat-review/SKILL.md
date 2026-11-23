---
name: meat-review
description: "Review a diff, commit, branch, PR, or uncommitted change as an abridged reading of what to read, why, and the risks, in chat, a T3 page, or kvim. Also supplies visual PR excerpts."
---

# Meat review

A **reading** walks a reviewer through a change: first the flow it runs through, drawn interactive by [viz](../viz/SKILL.md), then a few numbered steps, each one idea with the question to answer and the line ranges that show it, folds closed and findings on their lines. You choose the depth, the steps and the ranges; [`scripts/meat_review.py`](scripts/meat_review.py) numbers the diff for you, checks your answer against git, and draws the kept code from the real files, so shown code is never yours. The approach and rubric come from [meat](https://github.com/boldsoftware/meat) (Apache-2.0).

Run every command from inside the repository. `<mr>` is this skill's directory.

## 1. Pick the comparison

| The user means | Scope flags |
| --- | --- |
| uncommitted work (default) | none (HEAD → working tree, untracked included) |
| one commit | `--ref SHA^!` |
| a branch or PR | `--ref main...HEAD` (or the PR's base/head) |
| one file of any of these | add `--file PATH` |

Use the same flags for every command below.

## 2. Triage: pick the depth

```bash
python3 <mr>/scripts/meat_review.py triage [scope]
```

It prints a small digest: each file's status and size, the functions its hunks touch, the seams its path suggests (schema, API, auth, config, concurrency, deps), and totals. Read it and choose the tier yourself; the path tags are hints, not the decision.

| Tier | When | What you produce | Where it shows |
| --- | --- | --- | --- |
| **S** | one idea: a fix in one function, a config or docs change, a rename | summary, kept ranges, findings, tests; no flow | chat only |
| **M** | a few moving parts in one area | a flow and 3–6 steps | T3 page or chat |
| **L** | crosses a boundary: schema or wire format, auth, concurrency, many callers | as M, plus the blast radius | T3 page or chat |

For **L**, look past the diff before reading: find the callers and consumers of what changed (the callers of a changed function, readers of a changed table or message, users of a changed flag), with `rg` or the project's LSP. Put the ones that matter in the flow, and turn each assumption they make into a step's `check` or a finding. Never put the blast radius on an S or M change.

## 3. Read the change

```bash
python3 <mr>/scripts/meat_review.py prompt [scope] -o /tmp/meat-review/prompt.md
```

Read the whole file: it is [the rubric](references/rubric.md), then the reviewer's taste (the shipped [taste](references/taste.md) plus their own and the repository's rules), then any detected moves, then every patch, each line prefixed with its old and new file line (`  old   new | +code`). A patch over the size budget is replaced by the `git diff` command to read it; run it. When a judgment depends on code outside the diff, read that code before you claim it.

Write the JSON the rubric's Output section describes to `/tmp/meat-review/reading.json`, with the tier from step 2. Every file gets a kind and a verdict; every kept range names its step. Two passes go beyond reading:

- **Taste**: apply every taste section to the new code and report what it introduces or worsens as `quality` or `structure` findings, including code that copies a weak local pattern.
- **Tests**: list every added or changed test case in `tests` with a `real`, `weak` or `fake` verdict, judged from the fixtures, mocks and code under test you read.

Reach for a deterministic tool only when a claim turns on it: run the touched tests (with coverage of the changed lines) when a verdict is in doubt, run the project's type checker or linter on a file when a finding depends on what it would report. Name the command and its result in the finding; never cite a tool you did not run.

## 4. Check it

```bash
python3 <mr>/scripts/meat_review.py check /tmp/meat-review/reading.json [scope]
```

It checks the ranges against git, the steps against the ranges, and parses the flow with viz. Fix every error it prints and rerun until it says `ok`. Cover any file it lists as not covered. `flow refs:` lines are advisory (a removed node's ref points at the old file). When it reports high retention pressure or a move shown on one side only, make one more pass, then accept what remains.

## 5. Show it where the user is

Pick the host from the tool list ([T3 Code](../yesh-router/references/hosts/t3.md), [pi](../yesh-router/references/hosts/pi.md)); everything else with a terminal chat (Claude Code, Codex) takes the chat branch. An **S** reading always takes the chat branch, in every host.

**T3 Code**, M and L (`html_render` is available): build the page, preview it, then publish it above your reply.

```bash
python3 <mr>/scripts/meat_review.py render /tmp/meat-review/reading.json [scope] --t3 -o /tmp/meat-review/reading.t3.html
```

The page is the summary, the flow (press play to walk it; hovering a box names its step, hovering a step lights its box), a step index, then each step: its question, its findings, and its ranges as diffs with folds that open. L adds the call changes as a second tab of the flow. Tests to look at, ranges past the code budget and skimmed files sit at the end. Every range and finding carries a clickable id (`s2.1`, `refresh-race`) to say in chat. The user can also comment on any line (the + by its number, drag for several), on a step, or agree, disagree or reply on a finding; **Feedback** collects it all into one block to paste back. **Unified / Split** switches every diff (keys: `s`, `f` for feedback, `j`/`k` between steps).

`--t3` takes T3's theme variables, sets no page background or padding, keeps state in memory, and loads the page script from the pinned CDN copy (inlining it, with a stderr note, when the local script differs from the pin). Pass the file's contents to `html_preview`, read the console for `viz:` or script errors and fix the reading if any appear, then pass the same page to `html_render`; after editing the reading, render and preview again before publishing. The preview screenshots at the page's load event, so a diagram missing from it is a real fault, not a slow CDN. Diffs use `@pierre/diffs` from esm.sh where the frame can reach it; otherwise the plain rows from git stay, and the console shows a `meat-review: kept plain rows` warning, which is not an error. Your reply below it is the summary in two sentences, the findings as one line each, and the step to read first.

**Chat** (Claude Code, Codex, pi, and every S reading):

```bash
python3 <mr>/scripts/meat_review.py render /tmp/meat-review/reading.json [scope] --md
```

Your reply is that output, pasted as printed, after at most two sentences of your own: the summary, then each step with its question, findings and kept ranges as `diff` blocks with `⋯ N lines` folds, then tests to look at and skimmed files. Code in the reply comes only from this output. Ranges past the code budget are listed by id; show one on request with `--only s2.1`. Offer the standalone page with `--html --open` for an M or L reading: the same layout with a light/dark switch, working offline (in pi, open it in glimpse when installed).

**kvim** (when `~/.config/nvim/bin/review` exists), in addition to the branch above:

```bash
python3 <mr>/scripts/meat_review.py publish /tmp/meat-review/reading.json [scope] --kvim --author <your agent name>
```

Each kept range arrives as a kvim excerpt whose note starts with its step's title. Tell the user the command it prints (`:ReviewOpen <ref>` or `,gv`, then `gR`).

## 6. Take feedback

Every step has an id (`s2`), every kept range one (`s2.1`), every finding its own. When the user replies with ids, typed or as the pasted **Feedback** block (`Feedback on the reading of …` then one `- id …: text` line each) ("s2.1: why not reuse the helper?", "refresh-race is fine", "show s3.2"), answer, then edit `reading.json`: drop resolved findings, add ranges or findings they asked for, adjust notes or steps. Rerun `check` and the step 5 render for the same host. Code changes the user asks for are separate work; after them, rebuild the reading from step 2 for the new comparison.

## Learn the reviewer's taste

When feedback states a preference that should hold next time ("I don't care about X", "always flag Y", a disagree with a reason that generalizes), ask once whether to keep it, then record it in the right section:

```bash
python3 <mr>/scripts/meat_review.py taste add --section Quality --text "Flag Y because Z"            # the reviewer's own file
python3 <mr>/scripts/meat_review.py taste add --section Tests --text "..." --repo                    # this repository only
```

Sections are free-form (`Quality`, `Structure`, `Tests`, `Learned`, or a new one); `taste show` prints what the next reading will apply. A rule worth shipping to everyone belongs in `references/taste.md` in agent-skills.

## PR descriptions

The [visual PR workflow](../show-me/references/visual-pr.md) takes its abridged excerpts from a reading of the PR's base...head: render chosen ranges with `--md --only <range id>` (`s1.2`) and follow that workflow's excerpt limits.

## Completion

Done when the tier was chosen from `triage`, `check` prints `ok` with no uncovered files, the reading is shown in the user's host (the T3 page rendered without errors, the markdown in the reply, or the kvim command given when kvim is present), and every claim in a finding or note was checked against code you read.
