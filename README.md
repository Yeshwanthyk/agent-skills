# Agent Skills

Use [`yesh-router`](./skills/yesh-router/SKILL.md) when you want one entry point to select methods and apply engineering principles. Every skill also works directly. Its [Triggers](./skills/yesh-router/SKILL.md#triggers) section covers the complete collection; its groups are navigation, not mandatory stages. `yesh-router` is the sole router activation name.

Delegation follows the portable [delegation contract](skills/yesh-router/references/delegation.md). Model and reasoning defaults are host preferences, kept in the host configuration template ([`config/AGENTS.md`](./config/AGENTS.md)) rather than the portable docs.

## Active skills

| Skill | What it does |
| --- | --- |
| [`architect`](./skills/architect) | Chooses a target architecture from live contracts, execution paths, state ownership, and constraints. |
| [`benchmark-checklist`](./skills/benchmark-checklist) | Vets a performance number (limiter, tuning, limits, errors, repeatability, relevance, whether the work ran) before it is reported or acted on. |
| [`blast-radius`](./skills/blast-radius) | Finds what a change could break beyond grep and proves the main safety facts. |
| [`correct`](./skills/correct) | Finds mistakes agents keep repeating in a repo and makes each impossible through architecture, types, checks, or tests. |
| [`debug`](./skills/debug) | Reproduces failures, diagnoses live runtime symptoms or captured traces, and applies and proves the smallest coherent fix when requested. |
| [`deep-dive-explainer`](./skills/deep-dive-explainer) | Researches mechanisms, evidence, alternatives, and limits, then renders a connected long-form article with a reusable offline layout. |
| [`how`](./skills/how) | Explains current systems through execution paths, ownership, inventories, contrasts, critique, and decision history from records. |
| [`interactive-explainer`](./skills/interactive-explainer) | Builds source-grounded interactive HTML models of behavior, state, sequences, and comparisons. |
| [`interrogate`](./skills/interrogate) | Runs independent adversarial reviews and returns one evidence-checked judgment. |
| [`invariants`](./skills/invariants) | Models authoritative state and transitions, then breaks invariants with property tests or fuzzing and keeps replayable failures. |
| [`motion-explainer`](./skills/motion-explainer) | Builds narrated, timeline-driven systems explainers as playable HTML, optionally rendered to MP4 with a local voice. |
| [`plan`](./skills/plan) | Turns a settled approach into an implementation-ready packet with chunks, dependencies, risks, and proof. |
| [`reflect`](./skills/reflect) | Extracts reusable lessons from a session, or builds a personal mode from stated preferences; applies only approved changes. |
| [`show-me`](./skills/show-me) | Explains a topic visually with diagrams, code-shape sketches, calldiff views, and focused HTML; owns the visual PR description. |
| [`structure-review`](./skills/structure-review) | Audits implementation structure and proposes evidence-backed corrections. |
| [`swarm`](./skills/swarm) | Runs one bounded parallel coverage pass, a solution race, or a best-of comparison that grafts one verified result. |
| [`unslop`](./skills/unslop) | Writes and cleans prose, docs, PR bodies, and commits so they read clearly on first pass; on request, plain mode for the rest of the chat. |
| [`verification-skill`](./skills/verification-skill) | Creates, audits, or repairs a project-local skill that drives and proves one real application surface. |
| [`yesh-router`](./skills/yesh-router) | Routes tasks across the collection and applies relevant engineering principles on explicit activation. |

Routing is opt-in and sticky. The router's [Triggers](./skills/yesh-router/SKILL.md#triggers) select skills and playbooks; [orchestration](./skills/yesh-router/playbooks/orchestrate.md) owns dependent work and integration through the host harness’s subagent tools. PR work starts only on request.

Shared references live in [`skills/yesh-router/references/`](./skills/yesh-router/references): [engineering principles](./skills/yesh-router/references/principles), [delegation](./skills/yesh-router/references/delegation.md), [session records](./skills/yesh-router/references/session-records.md), and the [decision trail](./skills/yesh-router/references/decision-trail.md). The router's [principle table](./skills/yesh-router/SKILL.md#apply-principles) maps decisions to principle notes, and each skill points at its principles at the step where they apply. Method-specific references, such as [review comment triage](./skills/interrogate/references/bugbot-triage.md), stay with their owning skill. Shared references ship inside the router folder, so installing yesh-router installs them; reading a reference does not activate the router.

## Using the collection

After installing the reviewed collection, name a skill directly or ask for the router with the outcome:

- `Use yesh-router to diagnose duplicate deliveries. Do not edit yet.`
- `Use yesh-router to implement this settled change and verify it.`
- `Use invariants to check the retry invariants.`
- `Exit yesh-router.`

Skills with `disable-model-invocation: true` stay out of the host's skill list, so a request in prose will not find them. Reach them through the router, or with `/name` in Claude Code and `/skill:name` in pi. Only how, debug, invariants, plan, show-me, interactive-explainer and the router are listed by default.

Activate once, then describe outcomes in ordinary language. The router reads its Triggers and considers the host's installed skill descriptions, including project-local skills. It selects a main workflow and the supporting skills needed for the work, reads their instructions, and follows their completion criteria. It reconsiders selection as the task develops; small settled work stays direct when specialized guidance adds no value. The collection does not exclude other installed skills.

Workflows link to supporting skills at the step where their guidance is needed; the router can also select other relevant skills from their descriptions. You need not name those skills individually. A mid-task question preserves the active objective unless you replace it. Plain mode, reflection, mode authoring, and pausing still require the corresponding explicit request. `Use skill "how"` requests `how`; a mere mention or a quoted source instruction does not.

Playbooks are linked Markdown instructions, not executable hooks. The retired `yesh-mode` name and path are unsupported; activate `yesh-router` explicitly. A repository edit alone does not update a separately installed copy. Validate the installed names, entrypoint contents, and linked references after synchronizing through the chosen skill manager. Keep installation verification separate from document validation and routing trials.

Run `python3 scripts/check-skill-routing.py` to check local links, Triggers coverage of every skill and playbook, and that each principle row matches its note's Read when line and is linked from some skill or playbook. This checks routing structure; representative agent trials are still needed to assess selection behavior.

After changing a skill, run `node tools/skill-map/build.mjs` to rebuild the skill map, and `node tools/skill-map/build.mjs --check` to confirm the page matches the files. The map's changes view compares with the last commit. When you retire a skill, playbook or principle, add it to `scripts/retired-names.json` with where it went and why. The map shows that entry, and the routing check rejects links to the old name.

## CLI prerequisites used by skills

These are the command-line tools named by the skill instructions. Roles are optional unless the workflow below is selected.

| Tool | Install/source | Role and prerequisites |
| --- | --- | --- |
| Git | [git-scm.com/downloads](https://git-scm.com/downloads) | Required for repository state, diffs, revisions, and the routing checks. |
| Python 3 | [python.org/downloads](https://www.python.org/downloads/) | Required for `python3 scripts/check-skill-routing.py`. |
| GitHub CLI (`gh`) | [cli.github.com](https://cli.github.com/) | Optional; needed for the GitHub PR identity, create, edit, and readback commands in `show-me`'s PR workflow. GitHub access/authentication is required for those operations. |
| `calldiff` | [github.com/tanishqkancharla/calldiff](https://github.com/tanishqkancharla/calldiff); `npm install -g calldiff` | Optional; used only for changed call-tree/stack views. Requires Node.js 22 or newer. If unavailable or unable to parse the project, `show-me` uses a source-grounded manual call tree and reports the limitation. |
| Meat | [github.com/boldsoftware/meat](https://github.com/boldsoftware/meat); upstream install: `go install meat.dev/cmd/meat@latest` | Optional; used for substantial/noisy PRs when a structural outline plus a reading diff improves review. Requires Go to install and a configured provider: an OpenAI or Anthropic API key/base URL, or the upstream exe.dev managed gateway. It sends the diff to that provider, so explicit data-sharing permission is required; otherwise use the authoritative full diff and report the fallback. |

Meat is never authoritative: its reading diff can omit imports and security-relevant context. The `show-me` PR workflow requires explicit full-diff coverage for meaningful import, dependency, authentication/authorization, secrets, or other security changes. Mermaid diagrams still require actual GitHub render validation; if GitHub rendering cannot be verified, use the required text or diff fallback.

## Acknowledgments

The router and the adapted playbook, principle, review, and verification workflows draw on the MIT-licensed [Cursor pstack plugin](https://github.com/cursor/plugins/tree/main/pstack). The portable instructions are harness-neutral; model preferences live in the host configuration. The upstream source and license remain at that repository.

The [forward implementation first principle](skills/yesh-router/references/principles/forward-implementation-first.md) draws on concepts from [Vuk97/forward-implementation-first](https://github.com/Vuk97/forward-implementation-first). The local policy preserves required integrity, concurrency, review, and authorization controls.
