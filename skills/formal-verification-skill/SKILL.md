---
name: formal-verification-skill
description: Build, audit, or repair a rerunnable formal check for a high-risk code path.
disable-model-invocation: true
---

# Formal verification skill

A project-local `verify-formal-<area>/` skill ties each verified promise to the code that makes it. Use [formal-modeling](../invariants/references/formal-modeling.md) to choose a verifier and interpret its results. To launch and drive an application instead, use [verification-skill](../verification-skill/SKILL.md).

## Branches and outcomes

- **Create** when no formal verify skill covers the property: Choose the target, Generate, Prove the skill, Hand off. Writes only the new skill directory.
- **Audit** when the user asks whether an existing formal check is still true to the code. Reports and edits nothing.
- **Repair** when the user asks to bring one back in line. Edits only the selected skill directory.

Return exactly one: **created** (the new skill caught a scratch break and returned to baseline), **clean**, **findings**, **changed**, or **blocked** (name the missing tool, prerequisite, or failed proof). Audit and repair roll per-check outcomes into these as described below. Report product defects; change product source only when the user also asked for product repair.

**Create is done** when every inventoried rule catches a scratch break in real code and returns to baseline after restoration. Otherwise report `blocked` and name the unproven rule.

## Choose the target

Answer from the codebase; ask the user only what you cannot observe. Start from the area or bug the user named, if any.

Choose an area where a broken promise harms users and tests rarely reach the breaking case: concurrent writers, retries and recovery, state machines, parsers of untrusted input, unsafe or arithmetic-heavy code. Rank candidates by harm times how poorly current tests reach them, and choose the strongest, not the easiest to verify. Build the packet for it with step 1 of [invariants](../invariants/SKILL.md). When users see the flow, that includes the statechart (`chart.viz`). Then pick the tool from the decision table in formal-modeling; for a state machine or race, write the spec in TLA+ and run it with EveryState. Tell the user why this target and this tool.

Before writing checks, inventory every invariant in that area from the code, tests, and intended behavior. Walk each writer and transition, including errors, retries, and recovery. Ask what must remain true before and after it, who may act, and what must eventually happen. Keep progress obligations separate from safety invariants. A chart story or one representative property is not the inventory.

## Generate

Write the skill in the repository's configured skill location, with a `verify-formal-<area>` name matching its directory and a description naming the area and the paths whose changes should trigger it. Use this repo's commands, paths, and nouns, with no placeholders. Include these sections:

- **Scope**: the coverage record. For each check, the files and symbols it models, and the sync commit: the last commit at which you confirmed that the verification describes that code. A change touching them, or new code writing the state a check guards, means the verification needs another look. Move the sync commit forward only after confirming the verification describes the code at the new commit.
- **Property**: keep one row per inventoried obligation: promise and harm, code symbols, named executable rule, bounds and assumptions. For EveryState, map each row to an enabled `INVARIANT` or `PROPERTY` in the TLA+ config. Record the verdict and scratch-break evidence per row; a missing rule or verdict blocks a coverage claim.
- **Run**: ship one script with pinned tools, setup instructions and expected runtime. For TLA+, copy [`tla_chart.py`](../invariants/scripts/tla_chart.py) into the skill and record its `--version`. Run it with `--require-rule NAME` for each inventory row, taking names from the inventory rather than the config. Add `--viz` for a chart and `--fix` for a comparison. See [model-checkers](../invariants/references/model-checkers.md) for setup and verdicts.
- **Chart**: when the flow has a statechart, keep `chart.viz` (the intended stories, drawn before modeling) in the skill, and say where the run writes `chart.checked.viz`. That file is the result: each story marked works, `!` bug found, `+` fixed, or `?` unreached, plus each step or arrow where model and chart disagree, per formal-modeling's "Report on the statechart".
- **Read the result**: what a pass covers, how to turn a counterexample into code steps (each trace step names the action, which cites a code symbol) and replay it, and how to tell a product defect (the replay fails on the code) from a modeling error (it does not).
- **Linked tests**: the property or fuzz tests wired from each property per formal-modeling's "Feed generated tests", with their commands. For TLA+, that includes the integration test whose JSON-lines log `tla_chart.py conform` checks against the spec, and the generated `<area>.types.ts` the code's logging and state switches compile against; the run script regenerates it with `tla_chart.py types` and fails on a diff.
- **Update**: when an intended change alters verified behavior, update the model or proof in the same change, show each property red on a broken variant again, and rerun the linked tests. For TLA+, regenerate the types file and let the compiler list each call site the spec change reaches.
- **Known findings**: counterexamples the current code exhibits, each with its replay.

On **every use**, check the inventory against current writers and promises. Reconcile it with the enabled rules, run the script and linked tests, and report a verdict for every row, including known failures and unchecked rules.

## Prove the skill

Read [prove-it-works](../yesh-router/references/principles/prove-it-works.md). Then follow the generated skill once, cold, as the next agent would:

For EveryState, first exercise the coverage guard with scratch configs: remove all named rules, omit an inventoried rule, then omit a baseline rule from the fix. Each run must reject the config before model checking. Restore the configs before testing behavior.

1. For each inventory row in turn, make a scratch change in the real code that breaks its promise (remove a guard, reorder a write).
2. Run the skill's command. It must go red, its counterexample must replay on the scratch code, and on a charted flow the checked chart must show a `!` path ending at the harm node.
3. Drop the scratch change and rerun. The check returns to its baseline: passing, or failing only on known findings, with the chart's stories back to their baseline marks.

When the skill misses the break or a step does not run, fix the skill or the verification, not the scratch change. A verify skill that has never caught a break is a draft.

## Audit and repair

Locate the skill by what it does: a project-local skill that runs a model checker, prover, or code-level verifier against named code; its name may not start with `verify-formal-`. Ask when several qualify; switch to Create when none exists and the user wants one.

A check that keeps passing after the code changed can describe code that no longer exists. That pass looks like a proof, so it is the dangerous case. Audit stops before editing.

1. **Collect.** For each check, read the property, the code it covers, the bounds and assumptions, the command, and the sync commit. When the skill records no sync commit, use the last commit that changed the verification files, and say so.
2. **Run it as it is.** Run each check once before changing anything, and record the result. Rebuild the inventory from current code and compare it to the recorded rows and executed rules; report omissions as findings in audit, and close them in repair. A pass says only that the old description still holds; a failure can be drift or a bug, so do not judge it yet.
3. **Read every change to covered code.** Diff the covered files from the sync commit to `HEAD` and read each commit message; read [evidence-lifecycle](../yesh-router/references/principles/evidence-lifecycle.md). Follow covered symbols that moved, were renamed, or split, and look for new code that writes the guarded state. Classify each change against the model, not the commit message:
   - **No effect**: nothing the verification describes changed.
   - **Shape changed**: an atomic step is now two, a branch or check moved, a new path reaches the guarded state, or a value's range changed. The model or harness must change.
   - **Promise changed on purpose**: a doc comment, test, changelog, or commit message says the new behavior is intended. The property changes, and the report cites that evidence with the old and new wording.
   - **Promise may be broken**: the code changed and nothing says the promise did. A failure that follows is a bug candidate.
4. **Update from the code, not the result (Repair).** Rewrite each changed part from the code before rerunning, so each step again cites code a reviewer can open and stays as atomic as the code. Keep the bounds unless the change makes them wrong, and report any bound you lower.
5. **Rerun and judge.** On a pass, break the new code the way the property guards against (the scratch-break proof in "Prove the skill") and confirm the check catches it. On a failure, replay the counterexample on the real code step by step: a step the code cannot take means the verification is wrong, so fix it and say what was wrong; a full replay is a product defect, so name the commit that introduced it and give the steps in the code's words. A cheap test or repro against the real code that shows the bug goes in the report as evidence; never commit it to product code.
6. **Record (Repair).** Update the coverage record, commands, bounds, and assumptions, and move the sync commit to the commit you checked. A blocked check keeps its old sync commit. Then follow the skill once as the next agent would.

Each check ends **in sync** (no relevant change, passes), **updated** (now describes the new code, passes, seen red on a break), **bug** (describes the code, and the code breaks the property), or **blocked** (could not be brought in line or run, with the reason). A check can be both updated and bug. These roll up into the skill's outcome: all in sync is `clean`, any bug or unrepaired drift in an audit is `findings`, any update is `changed`. A check that passed before the update and fails after it was passing on a stale description; say so. Keep verification updates in a change of their own, apart from any product fix.

## Hand off

For a charted flow, lead with the checked chart rendered by [viz](../viz/SKILL.md). Give the run command, covered promises, bounds and assumptions, linked tests, findings with replays, and coverage gaps.
