# Formal verification skill

A formal verify skill is a project-local `verify-formal-<area>/` skill that lets a cold agent, mid-change, tell whether the change touches verified code, rerun the check, tell a real bug from a modeling error, and update the verification when the change is intended. The model, the tool choice, and the rules for honest results come from [formal-modeling](../../invariants/references/formal-modeling.md); this file covers target choice, the generated skill, its proof, and its upkeep.

## Choose the target

Answer from the codebase; ask the user only what you cannot observe. Start from the area or bug the user named, if any.

A strong target is a promise the code makes, where a break harms users and tests rarely reach the breaking case: concurrent writers, retries and recovery, state machines, parsers of untrusted input, unsafe or arithmetic-heavy code. Rank candidates by harm times how poorly current tests reach them, and choose the strongest, not the easiest to verify. Build the packet for it with step 1 of [invariants](../../invariants/SKILL.md), then pick the tool there. Tell the user why this target and this tool.

## Generate

Write the skill in the repository's configured skill location, with a `verify-formal-<area>` name matching its directory and a description naming the area and the paths whose changes should trigger it. Use this repo's commands, paths, and nouns, with no placeholders. Include these sections:

- **Scope**: the verified paths and symbols, as the drift trigger. A change touching them means the verification needs another look.
- **Property**: each property and its harm, one plain sentence each, and the reach and assumptions of a pass.
- **Run**: one command with pinned tool versions (`lean-toolchain`, a pinned jar or CLI version), its expected runtime, and how to install the tool. Ship the command as a script inside the skill; read [build-the-lever](../../yesh-router/references/principles/build-the-lever.md).
- **Read the result**: what a pass covers, how to turn a counterexample into code steps and replay it, and how to tell a product defect (the replay fails on the code) from a modeling error (it does not).
- **Linked tests**: the property or fuzz tests wired from each property per formal-modeling's "Feed generated tests", with their commands.
- **Update**: when an intended change alters verified behavior, update the model or proof in the same change, show each property red on a broken variant again, and rerun the linked tests.
- **Known findings**: counterexamples the current code exhibits, each with its replay.

## Prove the skill

Read [prove-it-works](../../yesh-router/references/principles/prove-it-works.md). Then follow the generated skill once, cold, as the next agent would:

1. Make a scratch change in the real code that breaks a property (remove a guard, reorder a write).
2. Run the skill's command. It must go red, and its counterexample must replay on the scratch code.
3. Drop the scratch change and rerun. The check returns to its baseline: passing, or failing only on known findings.

When the skill misses the break or a step does not run, fix the skill or the verification, not the scratch change. A verify skill that has never caught a break is a draft.

## Audit and repair

These follow the main Audit and repair steps, with these substitutions:

- **Index**: reconcile Scope with the code. List commits touching the scoped paths since the model last changed; read [evidence-lifecycle](../../yesh-router/references/principles/evidence-lifecycle.md).
- **Source review**: confirm each cited symbol still exists and keeps the atomicity the model assumes.
- **Live pass**: run the command, then the scratch-break proof above.
- **Triage**: a stale model or harness is a verifier defect; a replayed counterexample is a product defect.

## Hand off

Report what was verified, the tool and why, the bounds and assumptions, the findings in plain words with their replays, the run command, the linked tests, and what is not covered. Suggest a second target only when a close one turned up.
