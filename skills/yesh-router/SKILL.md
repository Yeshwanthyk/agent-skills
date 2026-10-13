---
name: yesh-router
description: When the user activates yesh-router, match each task to a method by its triggers, run that method's steps, and apply the engineering principles that change a decision.
---

# Yesh Router

Activation is explicit and sticky. The router runs when the user asks for it, or for this collection's methods, and stays active until they leave it; a new task changes the method, not the mode. Asking for one skill by name runs that skill without activating the router. Intent decides, not punctuation: `Use skill "how"` is a request; a name mentioned in prose or quoted from source instructions is not. `yesh-router` is the only activation name.

## Triggers

Match the situation to a row, open its file, and follow it. Pick one main method, plus supporting methods for concrete parts of the work. Methods the user names win, in the order they imply. Settled work with no matching row stays direct; a tiny edit needs no method. Rows marked *on request* run only when the user asks for that activity. On reversible work (code, notes, plans), make the reasonable call, proceed, and name the choice in the reply. Ask only for product direction, a missing goal or constraint, or a choice that is consequential or hard to reverse.

**Every PR description takes the visual PR route.** When authorized work creates a PR or edits its description, during any method and for any change type, read [show-me](../show-me/SKILL.md) and follow its [visual PR workflow](../show-me/references/visual-pr.md). A request to draft a description ends with the draft; publish only when the task authorizes it.

**Understand and diagnose**
- How code works now, an execution path, or the path to establish before a consequential change → [how](../how/SKILL.md). Why it was built or decided this way → its History view.
- A bug, or a failing or crashing behavior, to reproduce, diagnose, and fix when asked; a live runtime symptom; a captured trace or profile → [diagnose](../diagnose/SKILL.md).
- Resuming earlier work from sessions and the repo → [resume](playbooks/resume.md).
- Facts from outside the repo (docs, specs, APIs) → [research](../research/SKILL.md).

**Shape and plan**
- An unsettled architectural boundary → [architect](../architect/SKILL.md).
- Authoritative state, transitions, concurrency, or recovery; a contract over many generated inputs or operation sequences; a parser or untrusted-input boundary to fuzz → [invariants](../invariants/SKILL.md).
- A settled approach that needs an execution plan → [plan](../plan/SKILL.md). A speculative plan is not settled: run architect first.
- A design question you can settle by running a throwaway sketch, rather than asking → [prototype](playbooks/prototype.md).

**Measure**
- A one-off performance problem → [perf-issue](playbooks/perf-issue.md). Sustained improvement of one metric toward a target → [hillclimb](playbooks/hillclimb.md).
- Any number you measured, before you report or act on it → [benchmark-checklist](../benchmark-checklist/SKILL.md).

**Review and verify**
- Ownership, contract, and maintainability problems → [structure-review](../structure-review/SKILL.md).
- What a change could break beyond its diff → [blast-radius](../blast-radius/SKILL.md).
- Independent reviewers to challenge a design or change → [interrogate](../interrogate/SKILL.md).
- Create, audit, or repair a project-local verifier that drives a real application surface → [verification-skill](../verification-skill/SKILL.md).
- Whether a skill or prompt change improves agent behavior → [eval](playbooks/eval.md).

**Coordinate**
- Parallel coverage, a solution race, or comparing complete candidates and grafting the best → [swarm](../swarm/SKILL.md).
- Substantial bespoke work that no playbook fits → [figure-it-out](playbooks/figure-it-out.md).
- A continuing program with dependent units or several owners → [orchestrate](playbooks/orchestrate.md).
- Alongside the main method, never instead of it: the user asks for a decision trail, or a long or unattended run will be reviewed later → keep a [decision trail](references/decision-trail.md).
- *On request:* stop and leave a safe resume point → [pause-safely](playbooks/pause-safely.md).
- *On request:* catch up on this chat since the user's last message, with the decisions only they can make → [recap](playbooks/recap.md).

**Explain and write**
- A diagram or code sketch of the current topic → [show-me](../show-me/SKILL.md). An interactive HTML model → [interactive-explainer](../interactive-explainer/SKILL.md). A narrated explainer or video → [motion-explainer](../motion-explainer/SKILL.md). A long-form HTML article → [deep-dive-explainer](../deep-dive-explainer/SKILL.md).
- Prose, docs, PR bodies, or commits that should read clearly on first pass → [unslop](../unslop/SKILL.md). *On request* ("bro", "unslop", plain talk): plain English for the rest of the conversation → its plain mode.

**Improve the method** (*on request*)
- Lessons from a session, or a personal mode built from working preferences → [reflect](../reflect/SKILL.md).
- Agents keep repeating a mistake in this repo → [correct](../correct/SKILL.md).
- Creating or editing a skill, `AGENTS.md`, or `CLAUDE.md` → [writing-for-agents](../writing-for-agents/SKILL.md). Editing a skill authorizes that edit only.

## Run

Reading a method starts its work; its completion criteria end it. For multi-step work, track the method's steps and their proof in the host's todo list, and mark a skipped step `skip: <reason>`. An explanation, plan, or review ends with that deliverable unless implementation was also requested. Revisit Triggers when the question changes, and keep completed work and evidence.

Edits, installs, configuration changes, and external actions need the user's request or authority already given for the task; choosing a method grants none. When a named method is unavailable, say so and use the best available path.

For settled implementation, read [change shape](../plan/references/change-shape.md) when adding behavior versus preserving it changes the work or its proof. Delegate under the [delegation contract](references/delegation.md); model and effort per role come from the routing file the host instructions name. Locate and reconcile sessions under the [session-records contract](references/session-records.md). After a context gap, recover the active method, its current step, and outstanding proof from the todo list and those records.

## Apply principles

Each skill points at its principles where the decision happens. For direct work, or a decision no skill covers, read the notes whose rows apply, and only those. In the reply, name each principle that changed a decision and the choice it changed. Cite only notes you read this session.

<!-- principle-table:start -->
| Read when | Note |
| --- | --- |
| Changing data contracts, parsing external input, or organizing validation and error handling | [boundary-discipline](references/principles/boundary-discipline.md) |
| Choosing how to perform or prove non-trivial work — a sweep of edits, a migration, an analysis, or a check — not only at final verification | [build-the-lever](references/principles/build-the-lever.md) |
| Designing an interface, data shape, or workflow that real callers or tasks will drive | [design-from-usage](references/principles/design-from-usage.md) |
| Improving a workflow is in scope, a recurring instruction repeats, or a failure pattern needs a durable guardrail | [encode-lessons-in-structure](references/principles/encode-lessons-in-structure.md) |
| Resuming prior work, using session records or prior summaries, or reconciling a plan against live state | [evidence-lifecycle](references/principles/evidence-lifecycle.md) |
| A novel interaction or architectural choice has no established precedent and several viable approaches exist | [exhaust-the-design-space](references/principles/exhaust-the-design-space.md) |
| Product, UX, or feature-scope tradeoffs come up | [experience-first](references/principles/experience-first.md) |
| You are about to trust, report, or act on a measured number: a speedup, regression, throughput, latency, or eval result | [explain-the-number](references/principles/explain-the-number.md) |
| Debugging a reproducible failure, fixing recurring incidents, or after two fixes based on the same assumption fail the same check | [fix-root-causes](references/principles/fix-root-causes.md) |
| Sequencing staged delivery or migrations, or work is blocked or replayed because progress metadata is missing | [forward-implementation-first](references/principles/forward-implementation-first.md) |
| Work could overflow the session's working context, or when large payloads are in play | [guard-the-context-window](references/principles/guard-the-context-window.md) |
| Work resumes after a restart, an agent is replaced, or a new receiver lacks the working context | [handoffs](references/principles/handoffs.md) |
| Removing an API, format, or behavior, or changing a persistent form | [migrate-callers](references/principles/migrate-callers.md) |
| Writing stateful logic, or when code branches a lot or repeats a shape assumption across files | [model-the-domain](references/principles/model-the-domain.md) |
| Choosing how to prove a claim, claiming completion of non-trivial work, verifying a fix or change, or judging someone else's evidence, including a delegated result | [prove-it-works](references/principles/prove-it-works.md) |
| Retries, persistent changes, external effects, restart behavior, or migrations | [recovery-and-idempotency](references/principles/recovery-and-idempotency.md) |
| Integrating a change into an existing design, where bolting the change on would distort the design | [redesign-from-first-principles](references/principles/redesign-from-first-principles.md) |
| A sweep, migration, or run of similar edits; delivering a stack or multi-step result | [sequence-verifiable-units](references/principles/sequence-verifiable-units.md) |
| Adding or reshaping code, choosing an abstraction, or comparing designs | [simplicity](references/principles/simplicity.md) |
| A change adds mutable state, lifecycle transitions, caches, cleanup, or concurrent writers | [state-ownership](references/principles/state-ownership.md) |
| Choosing what a test or check should assert | [test-behavior](references/principles/test-behavior.md) |
| Representing domain states, choosing types, or where assertions, casts, or repeated null checks appear | [type-system-discipline](references/principles/type-system-discipline.md) |
<!-- principle-table:end -->

## Reply

Lead with the result. Give each claim its evidence or its label (measured, inferred, or guess) in the same sentence. Link only artifacts you produced or read. End with material limits.
