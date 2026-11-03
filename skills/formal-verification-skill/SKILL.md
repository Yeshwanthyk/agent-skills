---
name: formal-verification-skill
description: Create, audit, or repair a project-local verify-formal-* skill that model-checks, proves, or formally verifies one high-risk property of the code and can be rerun on every change.
disable-model-invocation: true
---

# Formal verification skill

A formal verify skill is a project-local `verify-formal-<area>/` skill that lets a cold agent, mid-change, tell whether the change touches verified code, rerun the check, tell a real bug from a modeling error, and update the verification when the change is intended. The model, the tool choice, and the rules for honest results come from [formal-modeling](../invariants/references/formal-modeling.md); this skill covers target choice, the generated skill, its proof, and its upkeep. For a verifier that launches and drives an application surface, use [verification-skill](../verification-skill/SKILL.md).

## Branches and outcomes

- **Create** when no formal verify skill covers the property: Choose the target, Generate, Prove the skill, Hand off. Writes only the new skill directory.
- **Audit** when the user asks whether an existing formal check is still true to the code. Reports and edits nothing.
- **Repair** when the user asks to bring one back in line. Edits only the selected skill directory.

Return exactly one: **created** (the new skill caught a scratch break and returned to baseline), **clean**, **findings**, **changed**, or **blocked** (name the missing tool, prerequisite, or failed proof). Audit and repair roll per-check outcomes into these as described below. Report product defects; change product source only when the user also asked for product repair.

**Create is done** only when a check has been seen red on a scratch break in the real code and back at baseline after it, or the outcome is `blocked` with the reason. A written model, a planned check, or a statechart without a run is a draft, not an outcome. When users see the flow, the deliverable is the flow's checked statechart with each story marked works, bug found, fixed, or unreached.

## Choose the target

Answer from the codebase; ask the user only what you cannot observe. Start from the area or bug the user named, if any.

A strong target is a promise the code makes, where a break harms users and tests rarely reach the breaking case: concurrent writers, retries and recovery, state machines, parsers of untrusted input, unsafe or arithmetic-heavy code. Rank candidates by harm times how poorly current tests reach them, and choose the strongest, not the easiest to verify. Build the packet for it with step 1 of [invariants](../invariants/SKILL.md). When users see the flow, that includes the statechart (`chart.viz`). Then pick the tool from the decision table in formal-modeling; for a charted flow or a race the default is TLA+ with TLC. Tell the user why this target and this tool.

## Generate

Write the skill in the repository's configured skill location, with a `verify-formal-<area>` name matching its directory and a description naming the area and the paths whose changes should trigger it. Use this repo's commands, paths, and nouns, with no placeholders. Include these sections:

- **Scope**: the coverage record. For each check, the files and symbols it models, and the sync commit: the last commit at which you confirmed that the verification describes that code. A change touching them, or new code writing the state a check guards, means the verification needs another look. Move the sync commit forward only after confirming the verification describes the code at the new commit.
- **Property**: each property and its harm, one plain sentence each, and the reach and assumptions of a pass.
- **Run**: one command with pinned tool versions (`lean-toolchain`, a pinned jar or CLI version), its expected runtime, and how to install the tool. Ship the command as a script inside the skill; read [build-the-lever](../yesh-router/references/principles/build-the-lever.md). For TLA+, copy [`tlc_chart.py`](../invariants/scripts/tlc_chart.py) into the skill, which pins `tla2tools.jar` 1.7.4 by sha256, record the copy's `tlc_chart.py --version`, and make the run script one line: `tlc_chart.py run <Area>.tla --viz chart.viz [--fix <Area>Fixed.cfg]`. Its traces are the same on every run, and it gives every rule a verdict.
- **Chart**: when the flow has a statechart, keep `chart.viz` (the intended stories, drawn before modeling) in the skill, and say where the run writes `chart.checked.viz`. That file is the result: each story marked works, `!` bug found, `+` fixed, or `?` unreached, plus each step or arrow where model and chart disagree, per formal-modeling's "Report on the statechart".
- **Read the result**: what a pass covers, how to turn a counterexample into code steps (each trace step names the action, which cites a code symbol) and replay it, and how to tell a product defect (the replay fails on the code) from a modeling error (it does not).
- **Linked tests**: the property or fuzz tests wired from each property per formal-modeling's "Feed generated tests", with their commands.
- **Update**: when an intended change alters verified behavior, update the model or proof in the same change, show each property red on a broken variant again, and rerun the linked tests.
- **Known findings**: counterexamples the current code exhibits, each with its replay.

## Prove the skill

Read [prove-it-works](../yesh-router/references/principles/prove-it-works.md). Then follow the generated skill once, cold, as the next agent would:

1. Make a scratch change in the real code that breaks a property (remove a guard, reorder a write).
2. Run the skill's command. It must go red, its counterexample must replay on the scratch code, and on a charted flow the checked chart must show a `!` path ending at the harm node.
3. Drop the scratch change and rerun. The check returns to its baseline: passing, or failing only on known findings, with the chart's stories back to their baseline marks.

When the skill misses the break or a step does not run, fix the skill or the verification, not the scratch change. A verify skill that has never caught a break is a draft.

## Audit and repair

Locate the skill by what it does: a project-local skill that runs a model checker, prover, or code-level verifier against named code; its name may not start with `verify-formal-`. Ask when several qualify; switch to Create when none exists and the user wants one.

A check that keeps passing after the code changed can describe code that no longer exists. That pass looks like a proof, so it is the dangerous case. Audit stops before editing.

1. **Collect.** For each check, read the property, the code it covers, the bounds and assumptions, the command, and the sync commit. When the skill records no sync commit, use the last commit that changed the verification files, and say so.
2. **Run it as it is.** Run each check once before changing anything, and record the result. A pass says only that the old description still holds; a failure can be drift or a bug, so do not judge it yet.
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

Render the checked chart with [viz](../viz/SKILL.md) and lead the report with it. Then report what was verified, the tool and why, the bounds and assumptions, the findings in plain words with their replays, the run command, the linked tests, and what is not covered. Suggest a second target only when a close one turned up.
