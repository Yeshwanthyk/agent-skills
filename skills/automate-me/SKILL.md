---
name: automate-me
description: Turn repeated working preferences into a reviewed personal mode skill, or update an existing mode skill from new evidence. Use for explicit requests to automate a working style or create, update, or refresh a mode skill.
---

# Automate me

Turn repeated working conventions into one user-invoked `-mode` skill. The skill must describe observed behavior, not a flattering guess.

Mode generation and mode changes require review. Do not create or edit a mode skill before the user approves the evidence summary and proposed change.

## 0. Find the target

Use the current harness's skill discovery rules to look for a matching `*-mode/SKILL.md` in the project and user skill locations. In Pi, this includes project `.pi/skills/` and `.agents/skills/`, global `~/.pi/agent/skills/` and `~/.agents/skills/`, configured skill directories, and package-provided skill directories.

If a matching skill exists, update it by default when the user already asked to update, refresh, or capture new preferences. Otherwise present two choices:

- update the existing mode;
- start fresh, with a reason for replacing it.

Preserve sections the new evidence does not contradict. For a fresh mode, record why the existing one was not suitable.

## 1. Gather evidence

Use `recall` to reconstruct the relevant current-project session history. Set a bounded time window. For an update, start after the target skill's last edit when repository history exposes that timestamp.

Use `reflect` for corrections, reusable lessons, and costly dead ends in the selected sessions. Keep Reflect's explicit approval gate. Do not treat a single preference or one unusual turn as a durable rule.

If Recall, Reflect, or the session history is unavailable, report the gap and mark affected preferences as unconfirmed. Do not silently convert inference into a mode rule.

Look for repeated signals in at least two independent sessions when possible:

- response length, tone, and format;
- autonomy and approval boundaries;
- delegation and parallel work;
- verification and definition of done;
- code and prose discipline;
- process and version-control conventions;
- skill-routing and preference for fixing skills.

## 2. Ask focused questions

Show the evidence summary before drafting. Ask only about conflicts, low-confidence preferences, or choices the transcript cannot settle. Use the current harness's structured question facility when it exposes one. Otherwise ask in the conversation.

Ask no more than two focused rounds and one open question. Do not ask the user to restate evidence already recovered.

## 3. Propose the change

Present:

- the target path and whether this is an update or a new skill;
- the observed evidence and confidence for each rule;
- the sections to add, revise, preserve, or remove;
- unresolved gaps and user decisions;
- the exact review gate before writing.

Wait for explicit approval. Approval to investigate is not approval to edit a mode skill. External tracker writes, commits, pushes, and review requests need the user's stated authorization.

## 4. Draft or update

Use the current harness's skill-authoring capability if it exposes one. Otherwise edit the target directly under `writing-for-agents` and its skill mechanics.

A mode skill should:

- use valid lowercase hyphenated frontmatter;
- keep `disable-model-invocation: true` unless the user explicitly wants automatic invocation;
- describe the user's style without naming the author;
- use short sections for only the rules supported by evidence;
- point to other skills instead of copying their instructions;
- state approval, safety, and verification gates only when they differ from the defaults.

Use `unslop` before presenting the draft. Keep one source of truth. Remove generic advice, restated repository facts, stale commands, and rules that a mechanism already enforces.

## 5. Review and close

Show the complete draft and the evidence-to-rule mapping. Wait for user review and apply requested revisions. Then validate frontmatter, relative references, and skill discovery with the current harness when possible.

Do not commit or open a review automatically. Do so only when the user authorizes it. Report the target path, evidence window, review decisions, validation result, and any unconfirmed preference.

## Completion

Automate Me is complete when an existing target was correctly classified or a new target was approved, Recall and Reflect evidence was considered with gaps visible, the user reviewed the proposed change before any mode edit, the draft passed writing-for-agents and unslop checks, and validation or its limitation was reported.
