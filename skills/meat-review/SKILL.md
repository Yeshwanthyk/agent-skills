---
name: meat-review
description: "Review a diff, commit, branch, PR, or uncommitted change as an abridged reading of what to read, why, and the risks, in chat, a T3 page, or kvim. Also supplies visual PR excerpts."
---

# Meat review

A **reading** is a short, annotated pass over a change: a summary, the files in reading order, the line ranges worth reading with their boring interiors folded, and findings anchored to lines. You choose the ranges; [`scripts/meat_review.py`](scripts/meat_review.py) numbers the diff for you, checks your answer against git, and draws the kept code from the real files, so shown code is never yours. The approach and rubric come from [meat](https://github.com/boldsoftware/meat) (Apache-2.0).

Run every command from inside the repository. `<mr>` is this skill's directory.

## 1. Pick the comparison

| The user means | Scope flags |
| --- | --- |
| uncommitted work (default) | none (HEAD → working tree, untracked included) |
| one commit | `--ref SHA^!` |
| a branch or PR | `--ref main...HEAD` (or the PR's base/head) |
| one file of any of these | add `--file PATH` |

Use the same flags for every command below.

## 2. Read the change

```bash
python3 <mr>/scripts/meat_review.py prompt [scope] -o /tmp/meat-review/prompt.md
```

Read the whole file: it is [the rubric](references/rubric.md), then the reviewer's taste (the shipped [taste](references/taste.md) plus their own and the repository's rules), then any detected moves, then every patch, each line prefixed with its old and new file line (`  old   new | +code`). A patch over the size budget is replaced by the `git diff` command to read it; run it. When a judgment depends on code outside the diff, read that code before you claim it.

Write the JSON the rubric's Output section describes to `/tmp/meat-review/reading.json`. Every file in the change gets a kind; the ranges, folds and findings come from the gutter numbers. Two passes go beyond reading:

- **Taste**: apply every taste section to the new code and report what it introduces or worsens as `quality` or `structure` findings, including code that copies a weak local pattern.
- **Tests**: list every added or changed test case in `tests` with a `real`, `weak` or `fake` verdict, judged from the fixtures, mocks and code under test you read.

Reach for a deterministic tool only when a claim turns on it: run the touched tests (with coverage of the changed lines) when a verdict is in doubt, run the project's type checker or linter on a file when a finding depends on what it would report. Name the command and its result in the finding; never cite a tool you did not run.

## 3. Check it

```bash
python3 <mr>/scripts/meat_review.py check /tmp/meat-review/reading.json [scope]
```

Fix every error it prints and rerun until it says `ok`. Cover any file it lists as not covered. When it reports high retention pressure or a move shown on one side only, make one more pass, then accept what remains.

## 4. Show it where the user is

Pick the host from the tool list ([T3 Code](../yesh-router/references/hosts/t3.md), [pi](../yesh-router/references/hosts/pi.md)); everything else with a terminal chat (Claude Code, Codex) takes the chat branch.

**T3 Code** (`html_render` is available): build the page, preview it, then publish it above your reply.

```bash
python3 <mr>/scripts/meat_review.py render /tmp/meat-review/reading.json [scope] --html -o /tmp/meat-review/reading.html
```

Pass the file's contents to `html_preview`, read the console for `viz:`, `pele:` or script errors and fix the reading if any appear, then pass the same page to `html_render`; after editing the reading, render and preview again before publishing. The preview screenshots at the page's load event, so a diagram missing from it is a real fault, not a slow CDN. The published frame is sandboxed without same-origin access (storage throws) while the preview is not, so page code must not depend on `localStorage`. The page holds the findings, the outline (Mermaid cards drawn by Pele, `tree` cards by [viz](../viz/SKILL.md)), the calldiff call changes as an interactive viz diff, the reading order, and every kept range with folds that open. Your reply below it is the summary in two sentences, the findings as one line each, and the one file to read first.

**Chat** (Claude Code, Codex, pi):

```bash
python3 <mr>/scripts/meat_review.py render /tmp/meat-review/reading.json [scope] --md
```

Your reply is that output, pasted as printed, after at most two sentences of your own: summary and the line-count manifest, outline cards, findings, tests, call changes, reading order, then the kept ranges as `diff` blocks with `⋯ N lines` folds. Code in the reply comes only from this output. Ranges past the code budget are listed by id at the end; show one on request with `--only f2.1`. In pi, fit Mermaid cards to the pi note's width rules or turn them into a text tree before rendering. Offer the full page with `--html --open` (in pi, open it in glimpse when installed).

**kvim** (when `~/.config/nvim/bin/review` exists), in addition to the branch above:

```bash
python3 <mr>/scripts/meat_review.py publish /tmp/meat-review/reading.json [scope] --kvim --author <your agent name>
```

Tell the user the command it prints (`:ReviewOpen <ref>` or `,gv`, then `gR`).

## 5. Take feedback

Every reviewed file has an id (`f1`), every kept range one (`f1.2`), every finding its own. When the user replies with ids ("f1.2: why not reuse the helper?", "keyerror is fine", "show f3.1"), answer, then edit `reading.json`: drop resolved findings, add ranges or findings they asked for, adjust notes. Rerun `check` and the step 4 render for the same host. Code changes the user asks for are separate work; after them, rebuild the reading from step 2 for the new comparison.

## Learn the reviewer's taste

When feedback states a preference that should hold next time ("I don't care about X", "always flag Y", a disagree with a reason that generalizes), ask once whether to keep it, then record it in the right section:

```bash
python3 <mr>/scripts/meat_review.py taste add --section Quality --text "Flag Y because Z"            # the reviewer's own file
python3 <mr>/scripts/meat_review.py taste add --section Tests --text "..." --repo                    # this repository only
```

Sections are free-form (`Quality`, `Structure`, `Tests`, `Learned`, or a new one); `taste show` prints what the next reading will apply. A rule worth shipping to everyone belongs in `references/taste.md` in agent-skills.

## PR descriptions

The [visual PR workflow](../show-me/references/visual-pr.md) takes its abridged excerpts from a reading of the PR's base...head: render chosen ranges with `--md --only <id>` and follow that workflow's excerpt limits.

## Completion

Done when `check` prints `ok` with no uncovered files, the reading is shown in the user's host (the T3 page rendered without errors, the markdown in the reply, or the kvim command given when kvim is present), and every claim in a finding or note was checked against code you read.
