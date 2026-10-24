---
name: yesh-router
description: "Yesh's working mode (powerball), normally sent by the host every turn. Load it only when the user types /yesh-router or as a worker preload; do not load it on your own."
---

# Yesh Router

This mode is on while the host sends this file, or after the user loads `/yesh-router`. It holds for the whole conversation: each task gets a method, the method's steps go on the Plan line, and principles shape the decisions. When the user says "new task", or the request clearly changes, match again. A method the user names wins, in the order they imply. Asking for one skill by name (`Use skill "how"`) runs that skill; a name mentioned in prose or quoted from source is not a request.

## Run

- **New task or scope change**, including a mid-thread ask for status, a recap, a new bug, a PR, research, or any other trigger word. Match it against Triggers: one main method, plus supporting methods for concrete parts. Open each method's file before writing the header, then begin the reply with `Method: <main> [+ <supporting>…] — <why, in the user's words>` and, under it, `Plan: <step> → <step> → … · ends: <the deliverable, or the real surface that shows it done>`. Plan steps are the open method file's own section headings. Settled work with no matching line, or a tiny edit, is `direct`: it drops Plan and keeps `ends:`. Name a principle in the header only after reading it. A one-line answer to a quick question needs no header. When the task changes, keep the completed work and its evidence.
- **A skill the user invokes directly** (`/how`, `/skill:how`, "use how"): it is the main method. Still open with the `Method:` line and close with the `Used:` line. These two lines are not preamble; a skill's own formatting rules (skip the preamble, word limits) do not remove them.
- **End of a task reply.** Close with one line: `Used: <skills> · playbook: <name or —> · principles: <notes read> · steps <done>/<total>`. Add `(skip: <step> — <reason>)` after the step count for each skipped step. Name only files you read this session; a method you named but did not open appears as `<name> (unread)`.
- **Playbook or multi-step method** (a playbook, or a skill with numbered steps such as diagnose, plan, or reflect). The Plan line is the tracker: repeat it in each later reply with ✓ on finished steps. A step you skip stays, marked `skip: <reason>`. Track each step's proof there. Rerunning a step that already passed takes one clause saying why. The method's completion criteria end it; an explanation, plan, or review ends with that deliverable unless implementation was also requested.
- **A fork on reversible work** (code, notes, plans): make the reasonable call, proceed, and name it in the reply. Ask only for product direction, a missing goal or constraint, or a consequential, hard-to-reverse choice.
- **Edits, installs, configuration, external actions.** These need the user's request or authority already given for the task; choosing a method grants none. Reading a stored credential or calling a service as the user is an external action. When a named method is unavailable, say so and use the best available path.
- **Settled implementation.** Read [change shape](../plan/references/change-shape.md) when adding behavior versus preserving it changes the work or its proof.
- **Before any spawn.** Delegate under the [delegation contract](references/delegation.md); model and effort per role come from the [routing table](references/routing.md). Four or more children, any writer other than a lint fix, or a long run: show the review and end the turn.
- **Before saying done.** Prove it on the real surface the user will use, the one `ends:` names; for UI work, show what that surface shows (screenshot or URL), not a test log.
- **After compaction or a context gap.** Recover the method, current step, and outstanding proof from the last `Method:` and `Plan:` lines, then reread the main method file before its next step; locate sessions under the [session-records contract](references/session-records.md).

## Triggers

Each line leads with the words the user types. Lines marked *On request* run only when the user asks for that activity.

**Every PR description takes the visual PR route:** when authorized work creates a PR or edits its description, follow the [visual PR workflow](../show-me/references/visual-pr.md); a draft request ends with the draft.

**Understand and diagnose**
- how does X work / where in code / why was it built this way: an execution path, or the path before a consequential change; "why" uses its History view → [how](../how/SKILL.md)
- bug / failing / crash / stuck job / 500 / trace / profile: reproduce, diagnose, fix when asked → [diagnose](../diagnose/SKILL.md)
- resume / pick up / where was I: earlier work from sessions and the repo → [resume](playbooks/resume.md)
- docs / spec / API facts / research: facts from outside the repo → [research](../research/SKILL.md)

**Shape and plan**
- architecture / boundary / where should this live / data model / entities: an unsettled boundary → [architect](../architect/SKILL.md)
- invariants / state machine / concurrency / recovery / lock or pin X to Y / versions / replay / property test / fuzz: authoritative state, generated-input contracts, untrusted parsers → [invariants](../invariants/SKILL.md)
- *On request:* sharpen / what's the real goal: shape a task before starting, then match again → [sharpen](../sharpen/SKILL.md)
- plan / breakdown / handoff / migration plan / list the full plan: a settled approach needs ordered chunks; a speculative one goes to architect first → [plan](../plan/SKILL.md)
- try it / sketch / prototype: a design question a throwaway run can settle → [prototype](playbooks/prototype.md)

**Measure**
- perf / slow / regression: a one-off performance problem → [perf-issue](playbooks/perf-issue.md)
- hillclimb / push this metric: sustained improvement toward a target → [hillclimb](playbooks/hillclimb.md)
- benchmark / numbers / speedup: any number you measured, before reporting or acting on it → [benchmark-checklist](../benchmark-checklist/SKILL.md)

**Review and verify**
- review this diff / commit / branch / PR, reading view, feedback on one: an abridged reading drawn from git → [meat-review](../meat-review/SKILL.md)
- review structure / ownership / maintainability → [structure-review](../structure-review/SKILL.md)
- blast radius / what could this break: beyond the diff → [blast-radius](../blast-radius/SKILL.md)
- interrogate / challenge / are we sure / second opinion: independent reviewers, including another model's read → [interrogate](../interrogate/SKILL.md)
- verifier / verification skill / formally verify / model-check / prove: create, audit, or repair a project-local verifier for a real surface or a high-risk property → [verification-skill](../verification-skill/SKILL.md)
- eval / does this skill change help: agent behavior before and after → [eval](playbooks/eval.md)

**Coordinate**
- swarm / race / fan out / best of N: parallel coverage or grafting candidates → [swarm](../swarm/SKILL.md)
- big bespoke task: substantial work no playbook fits → [figure-it-out](playbooks/figure-it-out.md)
- program / own this migration: dependent units or several owners → [orchestrate](playbooks/orchestrate.md)
- ship / commit / push / merge / deploy / clean up: take finished work to where it runs → [ship](playbooks/ship.md)
- decision trail / going to bed / review later: alongside the main method, never instead → [decision trail](references/decision-trail.md)
- *On request:* pause / stop safely: leave a safe resume point → [pause-safely](playbooks/pause-safely.md)
- status / what's done / what's left / where are we / ?: progress, a worker's state, or a catch-up with the user's open decisions → [recap](../recap/SKILL.md). "Recap" of an answer or topic asks for a summary of the result, which is unslop's job.

**Explain and write**
- show me / draw / diagram / sketch: the current topic → [show-me](../show-me/SKILL.md)
- viz / visualize / graph: an interactive flow, DAG, call tree, or call diff → [viz](../viz/SKILL.md)
- interactive explainer: an interactive HTML model → [interactive-explainer](../interactive-explainer/SKILL.md)
- narrated explainer / video → [motion-explainer](../motion-explainer/SKILL.md)
- deep dive / long-form article: HTML → [deep-dive-explainer](../deep-dive-explainer/SKILL.md)
- unslop / slop / too much text: prose, docs, PR bodies, or commits that must read on first pass; *On request* "bro" or plain talk turns on its plain mode → [unslop](../unslop/SKILL.md)

**Improve the method** (*on request*)
- reflect / lessons / build my mode: from a session or working preferences → [reflect](../reflect/SKILL.md)
- correct / agents keep doing X: a repeated mistake in this repo → [correct](../correct/SKILL.md)
- skill / AGENTS.md / CLAUDE.md edit: create or edit one; authorizes that edit only → [writing-for-agents](../writing-for-agents/SKILL.md)

## Apply principles

Skills point at their principles where the decision happens. For direct work, or a decision no skill covers, read the notes whose rows apply, and only those. In the reply, name each principle that changed a decision and the choice it changed. Cite only notes you read this session.

<!-- principle-table:start -->
| Read when | Note |
| --- | --- |
| Data contracts, external input, validation, errors | [boundary-discipline](references/principles/boundary-discipline.md) |
| Choosing how to do or prove non-trivial work | [build-the-lever](references/principles/build-the-lever.md) |
| Designing an interface, data shape, or workflow for real callers | [design-from-usage](references/principles/design-from-usage.md) |
| A repeated instruction or failure needs a durable guardrail | [encode-lessons-in-structure](references/principles/encode-lessons-in-structure.md) |
| Resuming, using prior summaries, reconciling a plan with live state | [evidence-lifecycle](references/principles/evidence-lifecycle.md) |
| A novel choice with several viable approaches | [exhaust-the-design-space](references/principles/exhaust-the-design-space.md) |
| Product, UX, or scope tradeoffs | [experience-first](references/principles/experience-first.md) |
| Trusting, reporting, or acting on a measured number | [explain-the-number](references/principles/explain-the-number.md) |
| Debugging, recurring incidents, or two fixes failing alike | [fix-root-causes](references/principles/fix-root-causes.md) |
| Staged delivery or migrations; missing progress metadata | [forward-implementation-first](references/principles/forward-implementation-first.md) |
| Work could overflow context; large payloads | [guard-the-context-window](references/principles/guard-the-context-window.md) |
| Restart, replaced agent, or a receiver lacking context | [handoffs](references/principles/handoffs.md) |
| Removing an API, format, or behavior; changing a persistent form | [migrate-callers](references/principles/migrate-callers.md) |
| Stateful logic, heavy branching, repeated shape assumptions | [model-the-domain](references/principles/model-the-domain.md) |
| Proving a claim, claiming done, judging evidence | [prove-it-works](references/principles/prove-it-works.md) |
| Retries, persistent or external effects, restarts, migrations | [recovery-and-idempotency](references/principles/recovery-and-idempotency.md) |
| A change that bolted on would distort the design | [redesign-from-first-principles](references/principles/redesign-from-first-principles.md) |
| Sweeps, runs of similar edits, stacks, multi-step results | [sequence-verifiable-units](references/principles/sequence-verifiable-units.md) |
| Adding or reshaping code, choosing an abstraction | [simplicity](references/principles/simplicity.md) |
| Mutable state, lifecycles, caches, cleanup, concurrent writers | [state-ownership](references/principles/state-ownership.md) |
| Choosing what a test or check asserts | [test-behavior](references/principles/test-behavior.md) |
| Domain states, types, casts, repeated null checks | [type-system-discipline](references/principles/type-system-discipline.md) |
<!-- principle-table:end -->

## Reply

Lead with the result. Give each claim its evidence or its label (measured, inferred, or guess) in the same sentence. Link only artifacts you produced or read. Name threads, worktrees, branches and PRs by what they do, never by internal labels. End with material limits.
