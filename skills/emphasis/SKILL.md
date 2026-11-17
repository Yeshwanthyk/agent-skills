---
name: emphasis
description: "Draw a status board in big type: each result, failure, ask and unchecked claim as a colored pill beside the action it calls for, with a score line and the user's open calls pinned on top. Use for emphasis, a status board, a scoreboard, an end-of-task or handoff report, or a long reply the user must scan."
---

# Emphasis

One fixed renderer, [`assets/emphasis.js`](assets/emphasis.js), draws the board. You write only a few lines of text, so the board costs about what the same report would in Markdown. The words and the action each one requires are in [words](references/words.md); read it before writing the first board in a session. Plain replies use the same words in bold, so a state reads the same on a board and in text.

## Write the board

Save it as `/tmp/emphasis/<name>.emph`:

```
# Billing v2 rollout
sub: staging deploy, Nov 17
mode: Investigate

## Result
[[Done]] Migration ran on staging in 4m. **See:** the staging deploy log
[[Failed: 3 tests]] Checkout e2e, from a stale fixture. **Next:** refreshing it and rerunning
[[Unverified]] p99 back under 200ms. **Check:** the billing p99 panel

## Before prod
[[Needs you]] Approve the prod deploy. **Do:** press Approve in Argo; that unblocks the rollout
[[Decision]] Backfill the empty rows, or make the column optional? I'd backfill. **Next:** a dry run meanwhile
```

- **Items.** One line each: `[[Word detail]]`, the subject, then the bold lead-in and its action. Each item draws as an outlined pill in a 100px column, the subject beside it, and the action dimmed on the line below. Keep the subject short enough to fit about one line.
- **Free for you.** The score line counts every result, failure and ask, failures first; **Needs you** and **Decision** items are drawn only in the "Waiting on you" box at the top. Write each item once, where it belongs; do not add your own "Waiting on you" section.
- **Other lines.** `##` section labels, `- ` bullets, `├──`/`└──` tree rows, plain paragraphs, `**bold**`, `` `code` ``, and ✓ ✗ →. A pill inside a sentence works too.
- **Ground it.** A number comes from a run, log or query you read; anything you did not check is **Unverified** with its **Check:**, not **Done**.

## Show it

Lint and build: `python3 <emphasis>/scripts/emphasis.py html /tmp/emphasis/<name>.emph --t3`, where `<emphasis>` is this skill's directory. It fails, naming the line, on an unknown word, an attention word with no action, or a pill in a heading; fix the line and rerun.

- **T3 Code** (`html_render` is in the tool list): `html_preview` with the page's path, then `html_render` with the same path and the preview's `contentHeight`. The `--t3` page takes the thread's theme and background.
- **Anywhere else**: build without `--t3` and add `--open`; report the path. In pi with glimpse installed, open the page there.

## Reply

The board carries the status. The reply adds what it can't show, in one or two lines, and repeats any **Needs you** in words for a reader who skips the page.

## Completion

Done when the build passes its lint, every item's number or claim is grounded or marked **Unverified**, and you have seen the board where the reader will look: the T3 preview image, or a screenshot of the opened page.
