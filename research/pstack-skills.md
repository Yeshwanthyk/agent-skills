# Research: Cursor pstack skills

> **Status:** This is the original source audit, not the active routing contract. The implemented portfolio is listed in [`README.md`](../README.md). Poteto now uses the current harness by default, inherits unspecified model and effort settings, and uses Scotty or another cloud runtime only when the user explicitly requests it. Canonical `how`, `debug`, `architect`, and `plan` now contain the useful local and pstack behavior; the superseded `yesh-*` paths cited below were removed.

**Source snapshot:** [cursor/plugins `efa2a531985e0a8084d36ff3cf87233be8a9f34b](https://github.com/cursor/plugins/tree/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack)`  
**Retrieved:** 2026-09-02  
**Scope:** the complete upstream `pstack/skills/` tree plus the pstack README, plugin manifest, and license. Imported source is under [`incoming/pstack/`](../incoming/pstack/). Existing local skills were not changed.

## Bottom line

pstack is a large, opinionated Cursor-native operating system for agent work, not just a collection of how/why/debug skills. Its strongest reusable ideas are: separate explanation from critique; investigate a complex question through independent angles before synthesis; treat historical evidence and null results explicitly; search for the first contract divergence; use an auditable decision trail; generate project-local verification capabilities; and encode recurring lessons in durable structure.

There is a substantial unification seam with this repository, but not a safe copy-and-merge seam. Local `yesh-how`, `yesh-debug`, `yesh-architect`, `yesh-plan`, `yesh-structure-review`, `stateful-systems`, `shaping`, and `breadboarding` already provide more explicit contract, ownership, state, boundary, completion, and provider-neutral guidance. pstack supplies orchestration patterns and a broader portfolio of specialized leaf skills. The likely direction is to retain the local skills as the semantic core, adapt selected pstack mechanisms behind them, and keep Cursor/Cloud/Task/model-specific execution in a replaceable adapter.

The main consolidation hazard is runtime coupling. pstack assumes Cursor's `Task`, `generalPurpose`, `poteto-agent`, Cursor MCPs, Cursor transcript locations, Cursor model slugs, Cursor control surfaces, and (in several playbooks) cloud workers. For this repository, the proposed portable rule is: **Scotty is the default when delegated/cloud execution is needed; an explicitly named runtime/provider wins for that workflow step; never invent a Scotty invocation contract.** The Scotty invocation, workspace/branch semantics, permissions, result channel, timeout/retry behavior, and cancellation/recovery contract remain unknown and must be supplied before a provider-dependent step can run.

## Snapshot and inspection scope

The imported snapshot contains 45 skill directories, 45 `SKILL.md` files, and 122 files below `incoming/pstack/skills/`. The pstack-level files retained are [`README.md`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/README.md), [`.cursor-plugin/plugin.json`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/.cursor-plugin/plugin.json), and [`LICENSE`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/LICENSE). The upstream agents, assets, automations, and guide docs were intentionally not imported; the exact scope is recorded in [`incoming/pstack/SOURCE.md`](../incoming/pstack/SOURCE.md).

I read every imported `SKILL.md` and the directly referenced material needed to understand behavior, including:

- `how`: explorer, explainer, critic prompts, and critique rubric.
- `why`: epistemics, investigator and synthesizer prompts, source playbook, all source-category playbooks, and incident-postmortem guidance.
- `architect`, `arena`, `interrogate`, and `reflect`: their design, reviewer, rubric, and synthesis references.
- `poteto-mode`: all listed playbooks; its bootstrap, plan checker, orchestration store/CLI/tests, PR watcher/types/tests, and worktree-audit helper.
- `create-verification-skill`, `show-me-your-work`, and TypeScript best practices: feature-map example, TSV logging helper, and TypeScript patterns.

I also read this repository's `README.md`, `config/AGENTS.md`, every existing local `skills/*/SKILL.md` that is present in the worktree, and the local references needed for overlap analysis. `skills/isometric/SKILL.md` is an unrelated pre-existing deletion and was not restored or inspected by recreating it.

## Complete pstack skill inventory

**Dependency shorthand:** `Cursor` means Cursor-native skill/Task/MCP/transcript behavior; `Models` means pstack's configurable model-role rule; `Playbooks` means `poteto-mode/playbooks/**`; `Principles` means the 21 principle leaf skills; `Forge` means `git` plus GitHub `gh`/optional Origin/Graphite tooling; `Verify` means generated project-local verification skills; `Trail` means `show-me-your-work` and its TSV helper.

| Skill | Trigger | Procedure | Output / completion | Dependencies |
|---|---|---|---|---|
| [`architect`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/architect/SKILL.md) | Cross-cutting or nontrivial architecture/design | Ground problem; run `how` and `why`; use Arena; sketch multiple candidates; screen red flags; choose and implement against a sketch; scrap a wrong architecture | Usage/type sketch, module map, rationale, implementation; completion is implied by a coherent sketch and implementation verification | `how`, `why`, `arena`, `Principles`, `Models`, Cursor |
| [`arena`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/arena/SKILL.md) | Several plausible approaches or a contested decomposition | Frame rubric; fan out independent candidates; cross-judge; pick a base; graft useful pieces; verify | Candidate artifacts plus synthesis/selection and verification | Cursor Task, `Models`, worktrees, `Principles` |
| [`automate-me`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/automate-me/SKILL.md) | User wants a personalized mode from prior work | Mine workspace agent transcripts; ask the user about the draft; create a mode skill; run unslop | A generated `<name>-mode` skill; no independent correctness predicate beyond review/unslop | Cursor transcript store, `create-skill`, `unslop`, `poteto-mode` |
| [`blast-radius`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/blast-radius/SKILL.md) | Before a risky or wide change | Isolate one safety fact; inspect real code/config; prove it rather than enumerate speculative risk | Fact, changed surface, risks, cleared risks, and before-merge check | `how`, `why`, `Principles`, live repo evidence |
| [`bro`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/bro/SKILL.md) | Plain-English explanation or response | Explain directly in conversational language | Plain-English answer; no explicit completion section | None stated; overlaps local `bro` |
| [`create-verification-skill`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/create-verification-skill/SKILL.md) | Project has no scripted way to prove app behavior | Interview repo surface (run/drive/observe/isolate); write `.cursor/skills/verify-<app>/`; seed feature map; run once; offer maintenance | A project-local verification skill with launch, doctor, drive, evidence, cleanup, and feature map, proven once | Cursor skill location; repo commands; real app/device/auth; optional `maintain-verification-skill` |
| [`figure-it-out`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/figure-it-out/SKILL.md) | Large/cross-cutting work, autonomous work, or work reviewed later | Frame scope/done predicate; design a hypothesis/audit workflow; run a scoped loop; log decisions and units; verify and hand back | Countable done predicate, hypotheses, evidence trail, units, final verification | `Playbooks`, `Trail`, `Principles`, optional Cursor `/loop` |
| [`how`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/how/SKILL.md) | “How does X work?”, walkthrough, ownership/placement/layering question, or architectural critique | Explain mode: assess simple/complex; explore complex questions in parallel; synthesize; present. Critique mode: explain first, then run critics and lead judgment | Overview, concepts, flow, locations, gotchas; critique adds Act on/Consider/Noted/Dismissed | Cursor Task, `Models`, referenced prompts/rubric; source line range [16–135](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/how/SKILL.md#L16-L135) |
| [`interrogate`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/interrogate/SKILL.md) | User wants several models to break a diff/design | State intent; run configured reviewers in parallel; synthesize; lead judgment; classify findings | Intent, reviewer findings, Act on/Consider/Noted/Dismissed, agreement map | Cursor Task, `Models`, `Principles` |
| [`maintain-verification-skill`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/maintain-verification-skill/SKILL.md) | Existing generated/project-local verification skill may be stale | Source wave plus live pass; edit only target verify skill; exercise every feature | Clean, Changed, or Blocked outcome; no invention when target is missing | `create-verification-skill`, `Verify`, real app/runtime |
| [`make-bot-ui`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/make-bot-ui/SKILL.md) | Build a page whose buttons wake a Grok Bot | Create webhook routine; obtain URL/key via Cursor UI; host local server; bind tailnet; call webhook; log failures; handle wake | Reachable bot UI with sender-key handoff, local log, webhook routine, and wake handler | Cursor `update_state`/`SendToUser`, Grok Bot, Tailscale, local server, `control-ui`-style runtime |
| [`no-comments`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/no-comments/SKILL.md) | Remove unnecessary comments or run comment review | Invoke Comment Sicko; remove only comments that fail its rubric; use deslop/formatting as directed | Cleaned diff or review result; no standalone completion predicate | Cursor Comment Sicko subagent (definition is outside imported scope), `Principles` |
| [`poteto-mode`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/poteto-mode/SKILL.md) | Default entry for nontrivial/multi-step work; sticky mode | Start todo with Principles; classify into a playbook; route to skills; use background Task calls; own/review results; follow reply rules | Work completed through the selected playbook, with a principled user-facing summary; no universal artifact | Cursor, `Playbooks`, `Principles`, `Models`, `poteto-agent`; source rules [13–93](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/poteto-mode/SKILL.md#L13-L93) |
| [`recall`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/recall/SKILL.md) | Resume prior agent work or recover context/history | Search workspace transcript records; inspect live git/PR/cloud URL; reconcile branch and current state | Reconstructed context, current state, and next action; no explicit formal predicate | Cursor transcript paths; `git`; `gh`; cloud URL/pushed branch |
| [`reflect`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/reflect/SKILL.md) | Reflect on a completed task/session or improve a skill | Locate transcript; run three reviewers; synthesize Accepted/Rejected/Backlog; structural check; apply only approved edits | Review plus applied skill improvements, or a backlog; refs and process [21–70](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/reflect/SKILL.md#L21-L70) | Cursor transcripts, Task with MCP access, `create-skill`, `Models` |
| [`setup-pstack`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/setup-pstack/SKILL.md) | Install/configure pstack model roles | Detect valid Task model slugs; load current config; map/confirm roles; validate; write `~/.cursor/rules/pstack-models.mdc`; confirm | Durable role-to-model configuration and optional offer of a verification skill | Cursor Task/model registry, AskQuestion, user home path; source [10–65](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/setup-pstack/SKILL.md#L10-L65) |
| [`show-me-your-work`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/show-me-your-work/SKILL.md) | Long, autonomous, multi-phase, or later-reviewed work | Maintain a TSV decision trail; log decisions/checkpoints; audit against transcript; cross-model review; commit when stakes warrant | Auditable TSV plus audit/review; helper protects spreadsheet formula cells [34–76](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/show-me-your-work/SKILL.md#L34-L76) | `Trail`, Cursor Task/models, optional git commit |
| [`swarm`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/swarm/SKILL.md) | N-way parallel workers, races, or separate slices | Frame; fan out all N workers; aggregate; report PASS/ISSUES/BLOCKED | One aggregated worker report with statuses; source [20–46](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/swarm/SKILL.md#L20-L46) | Cursor Task, default cloud environment, `Models`, pushed branch/cloud base when needed |
| [`tdd`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/tdd/SKILL.md) | Explicit TDD/failing-test request or cheap local test path | Write red test; run it; implement smallest green change; rerun; then broader verification | Failing test before fix and green proof after fix | Local test runner; `Principles`; optional bug-fix playbook |
| [`teach`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/teach/SKILL.md) | User wants to learn a subsystem or decision | Run `how` and `why` in parallel; explain plainly with diagrams/examples as useful | Plain-language teaching answer; no formal completion predicate | `how`, `why`, `bro`, Cursor Task/Models |
| [`technical-writing`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/technical-writing/SKILL.md) | Any technical prose/documentation surface | Choose Diátaxis mode; use short reader-centered sentences, STE/Global English; review against checklist | Revised technical prose; checklist is guidance rather than a machine-checkable gate | `unslop`; pstack writing rules |
| [`typescript-best-practices`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/typescript-best-practices/SKILL.md) | Editing `*.ts`/`*.tsx` | Apply type-system discipline and referenced patterns | Type-safe TypeScript diff; no independent output schema | `principle-type-system-discipline`, TypeScript patterns |
| [`unslop`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/unslop/SKILL.md) | AI-sounding prose, filler, clichés, or low-signal communication | Detect content/language/style/filler/jargon patterns; rewrite with specificity and voice | Cleaner prose; no formal completion predicate | `technical-writing`, `bro` |
| [`why`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/why/SKILL.md) | Design rationale, historical motivation, edge cases, product/business/operational constraints | Anchor in code/blame/log; discover evidence MCPs; fan out seven evidence categories; treat nulls as findings; synthesize confidence tiers and gaps | Directly supported, inferred, speculative, and unknown claims with sources consulted and gaps; process [49–230](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/why/SKILL.md#L49-L230) | Cursor MCPs, `git`, `gh`, `Models`, source-category playbooks |
| [`principle-boundary-discipline`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-boundary-discipline/SKILL.md) | Any boundary/API/input/output decision | Validate and normalize at boundaries; keep internals trusted | Apply principle; no standalone artifact | `Principles`, relevant code contract |
| [`principle-build-the-lever`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-build-the-lever/SKILL.md) | Repeated manual work or recurring correction | Build a reusable tool/automation rather than repeat the work | Durable lever/automation when justified; no formal gate | `Principles`, relevant scripts |
| [`principle-encode-lessons-in-structure`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-encode-lessons-in-structure/SKILL.md) | A mistake or correction is likely to recur | Put the lesson in a test, rule, schema, script, or durable artifact | Structural guard against recurrence; no formal gate | `Principles`, repo conventions |
| [`principle-exhaust-the-design-space`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-exhaust-the-design-space/SKILL.md) | Architecture/design choice with meaningful alternatives | Enumerate and compare candidates before committing | Decision with alternatives and tradeoffs; no formal gate | `arena`, `architect` |
| [`principle-experience-first`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-experience-first/SKILL.md) | Product/UI behavior or user-visible quality choice | Prefer user delight and polish over implementation convenience | User-centered choice; no formal gate | `prototype`, UI/runtime verification |
| [`principle-fix-root-causes`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-fix-root-causes/SKILL.md) | Bug or repeated symptom | Find and correct the mechanism, not the visible symptom | Root-cause correction; no formal gate | `how`, `why`, bug-fix playbook |
| [`principle-foundational-thinking`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-foundational-thinking/SKILL.md) | Ambiguous or inherited design | Re-derive from goals, constraints, and observed reality | First-principles rationale; no formal gate | `architect`, `why` |
| [`principle-guard-the-context-window`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-guard-the-context-window/SKILL.md) | Any multi-agent or large-context task | Keep briefs/artifacts compact; use pointers and summaries at boundaries | Lower reader/agent load; no formal gate | `poteto-mode`, `orchestrate` |
| [`principle-laziness-protocol`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-laziness-protocol/SKILL.md) | Any task where an observation/probe can replace a question or guess | Observe/run a cheap probe before asking or doing broad work | Evidence-driven next step; no formal gate | `prototype`, `how`, `why` |
| [`principle-make-operations-idempotent`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-make-operations-idempotent/SKILL.md) | Retryable or resumed operation | Make repeat execution safe and converge on one result | Idempotent operation; no formal gate | `orchestrate`, `show-me-your-work`, stateful storage |
| [`principle-migrate-callers-then-delete-legacy-apis`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md) | API replacement/removal | Migrate all callers; verify; delete legacy surface last | No stale callers/legacy API; no formal gate | `blast-radius`, `typescript-best-practices` |
| [`principle-minimize-reader-load`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-minimize-reader-load/SKILL.md) | Code/prose/brief design | Prefer locality, small interfaces, and concise artifacts | Easier-to-read result; no formal gate | `technical-writing`, `poteto-mode` |
| [`principle-model-the-domain`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-model-the-domain/SKILL.md) | Domain or state modeling | Name domain concepts and encode them in structure | Domain-shaped model; no formal gate | `architect`, local `stateful-systems` |
| [`principle-never-block-on-the-human`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-never-block-on-the-human/SKILL.md) | An agent encounters a decision that can be tested or safely defaulted | Prototype/observe; proceed on reversible work; ask only for preference/product gates | Progress without unnecessary question; no formal gate | `prototype`, `figure-it-out` |
| [`principle-outcome-oriented-execution`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-outcome-oriented-execution/SKILL.md) | Planning or execution | State result and proof, not activity | Outcome plus evidence; no formal gate | All playbooks |
| [`principle-prove-it-works`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-prove-it-works/SKILL.md) | Any implementation or handoff | Exercise the real surface at the relevant boundary | Verification evidence; no formal gate | `Verify`, `blast-radius`, `Trail` |
| [`principle-redesign-from-first-principles`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-redesign-from-first-principles/SKILL.md) | Existing architecture is strained or copied by habit | Re-derive desired shape before patching locally | New target shape and rationale; no formal gate | `architect`, `arena` |
| [`principle-separate-before-serializing-shared-state`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md) | Parallel work shares mutable state | Partition ownership/worktrees; serialize only the true shared boundary | Conflict-free ownership plan; no formal gate | `arena`, `swarm`, `orchestrate` |
| [`principle-sequence-verifiable-units`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-sequence-verifiable-units/SKILL.md) | Large change or delegation | Split into units that can each be verified and landed | Verified unit sequence; no formal gate | `figure-it-out`, `orchestrate`, `Verify` |
| [`principle-subtract-before-you-add`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-subtract-before-you-add/SKILL.md) | Proposed feature/abstraction/config addition | Remove obsolete surface first; add only what remains necessary | Smaller change surface; no formal gate | `architect`, `blast-radius` |
| [`principle-type-system-discipline`](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/principle-type-system-discipline/SKILL.md) | TypeScript or typed-boundary change | Model states and validate boundaries; avoid casts/`any` escape hatches | Type-safe boundary and compiler proof; no formal gate | `typescript-best-practices` |

### pstack playbooks behind `poteto-mode`

The mode routes into bug-fix, feature, refactoring, performance issue, runtime forensics, trace forensics, prototype, visual parity, eval, babysit, shipping, autonomous run, autopilot-full, autopilot-stack, session pickup, pause safely, multi-phase plan, opening a PR, worktree cleanup, hillclimb, orchestrate, authoring a skill, and bugbot triage. These are not additional `SKILL.md` entries, but they are essential dependencies of the default mode. Their shared shape is: frame a done predicate, investigate/design, make small verifiable units, delegate where useful, inspect receipts/diffs, and hand back with explicit status.

## Intended end-to-end workflow

The README starts with `/setup-pstack`, then recommends `/poteto-mode` as the default entry point. The mode first reads the principles, classifies the task into a playbook, and routes specialist work. A typical path is:

1. **Configure:** detect available Cursor Task model slugs and write role overrides with `/setup-pstack`.
2. **Frame:** state scope, constraints, a countable done predicate, verification surface, and any human gate.
3. **Understand:** use `how` for the current execution model and `why` for historical/product/operational rationale.
4. **Choose:** use `architect`/`arena` for cross-boundary design, or a focused playbook for bug, feature, refactor, performance, prototype, or parity work.
5. **Slice:** turn the approach into verifiable units; separate worktrees/ownership before fan-out.
6. **Execute:** use local coordinator state and cloud workers where the playbook calls for them; keep a `show-me-your-work` trail for long/autonomous work.
7. **Verify:** exercise the real boundary, preferably with a project-local verification skill; use independent review/interrogation where stakes warrant it.
8. **Land/close:** inspect current diffs and receipts, land through the selected forge workflow, reconcile spawned work, summarize evidence and remaining risk.

```mermaid
flowchart TD
    U[User request] --> S[/setup-pstack\nrole configuration]
    S --> M[/poteto-mode\nprinciples + classification]
    M --> F[Frame scope and done predicate]
    F --> Q{Question shape}
    Q -->|Current behavior| H[how\nexplore and explain]
    Q -->|Rationale/history| W[why\nevidence categories]
    Q -->|Design choice| A[architect + arena]
    Q -->|Bug/regression| B[bug-fix playbook\nrepro and root cause]
    Q -->|Large/autonomous| X[figure-it-out / orchestrate]
    H --> D[Design or execution plan]
    W --> D
    A --> D
    B --> D
    X --> D
    D --> T[Verifiable units\nownership + trail]
    T --> E[Local or delegated execution]
    E --> V[Real-surface verification\ninterrogate/reflect as needed]
    V --> G{Proof passes?}
    G -->|No| B
    G -->|Yes| L[Land, reconcile, report]
```

This workflow is coherent as an operating philosophy, but the execution nodes are not portable as written: they assume Cursor's Task schema, model aliases, cloud agent behavior, and Cursor-specific control/transcript surfaces.

## Overlap and unification matrix

| pstack concept | Local counterpart | Overlap | Unification seam / recommendation |
|---|---|---:|---|
| `how` | [`yesh-how`](../skills/yesh-how/SKILL.md) | High | Use `yesh-how`'s execution-path, state-owner, boundary, contract, and proof model as the canonical semantic core. Preserve pstack's simple/complex split, explorer angles, explainer format, and optional critique as provider-neutral execution strategies. Avoid two competing `/how` descriptions. |
| `why` | No direct local skill; adjacent `yesh-how`, `yesh-architect`, `yesh-structure-review` | Medium/high | Add a rationale/evidence branch to a future portfolio or a separate provider-neutral `why`; preserve pstack's code anchor, seven evidence categories, null-as-finding, confidence classes, and source gaps. Do not make Cursor MCP discovery a prerequisite. |
| pstack bug-fix playbook and root-cause principle | [`yesh-debug`](../skills/yesh-debug/SKILL.md) | High | Keep local red-capable feedback loop and first contract divergence as the canonical diagnosis gate. Add pstack's surface repro, binary-search hypothesis loop, how/why preflight, instrumentation, commit-story, and optional PR delivery as stages after the local gate. |
| `architect` | [`yesh-architect`](../skills/yesh-architect/SKILL.md) | High | Local contracts, ownership, dependency direction, failure behavior, migration, production/test wiring should be the target shape. pstack Arena becomes an optional candidate-generation/judgment mechanism, not a second architecture contract. |
| `interrogate` / `reflect` | [`yesh-structure-review`](../skills/yesh-structure-review/SKILL.md) | Medium/high | Keep local evidence-first structural review and action ranking. Use pstack's independent reviewers, intent statement, agreement map, and Accepted/Rejected/Backlog as a review protocol adapter. |
| `figure-it-out`, multi-phase plan | [`yesh-plan`](../skills/yesh-plan/SKILL.md), [`shaping`](../skills/shaping/SKILL.md) | High | Local plan packets and shaping's negotiated requirements/fit checks should own the settled approach. pstack's hypothesis loop, quantified scope, unit trail, and autonomous handback add execution discipline. |
| Work decomposition and affordances | [`breadboarding`](../skills/breadboarding/SKILL.md) | Medium/high | Breadboard Places, UI/code/store affordances, and explicit control/data wiring first; map pstack units onto those affordances. Avoid treating a cloud worker split as the architecture. |
| State/concurrency principles and `orch` | [`stateful-systems`](../skills/stateful-systems/SKILL.md) | Medium/high | Preserve the local authoritative-state/lifecycle/replay/recovery vocabulary. Selectively retain pstack's idempotent writes, locks, ledger keyed by PR+SHA, atomic inbox drain, and computed frontier as implementation patterns, after removing Graphite/Cursor assumptions. |
| `swarm` / `arena` / `orchestrate` | local [`orchestrate`](../skills/orchestrate/SKILL.md) | High, but runtime-specific | Keep a provider-neutral delegation contract and fail-closed behavior. Local orchestrate currently pins exact OpenAI model IDs; pstack pins Cursor model roles and `environment: cloud`. Both should become adapters over the same role, scope, permissions, receipt, retry, and cancellation contract. |
| `show-me-your-work` | local `yesh-plan`, `yesh-debug`, `yesh-structure-review` | Medium | Preserve the TSV decision/checkpoint trail and spreadsheet-injection protection as an optional evidence artifact. Local skills already require proof; do not force a trail for every small task. |
| `create-verification-skill` / `maintain-verification-skill` | [`interactive-explainer`](../skills/interactive-explainer/SKILL.md), `show-me` | Low/medium | Keep generated real-surface verification as a distinct capability. It can supply proof to local debug/architecture/structure review; it is not the same as an interactive explainer. |
| `teach` / pstack `bro` | local [`show-me`](../skills/show-me/SKILL.md), [`bro`](../skills/bro/SKILL.md) | Medium | Use local visual explanation and plain-English skills; preserve `teach`'s parallel how+why composition as a routing recipe. Resolve duplicate `bro` names explicitly before any install. |
| pstack `prototype` / visual parity | [`frontend-grilling`](../skills/frontend-grilling/SKILL.md), local `prototype` dependency | Medium | Keep concrete variant comparison and one-question-at-a-time convergence. Route execution through the existing frontend/prototype skills. |
| technical writing / unslop / TypeScript | local `bro`, type discipline in local skills | Low/medium | `technical-writing` and `unslop` are useful cross-cutting leaf policies; adopt selectively. Do not let style rules override repository or user requirements. |
| Cursor verification/control UI | No local counterpart | Low semantic, high operational | Treat `make-bot-ui`, `control-ui`, `control-cli`, and Cursor webhook routines as a separate Cursor adapter or leave unportable. |
| GitHub shipping/watch/worktree automation | Local repo conventions and `yesh-plan` | Medium operational | Retain type-safe status parsing, immutable-head checks, and explicit merge gates; isolate `gh`, Origin, Graphite, and Cursor dashboard code behind forge/runtime adapters. |

## Unique mechanisms worth preserving

1. **Two-mode `how`.** Explain first, then critique only when requested. The complex path fans out explorers by angle, synthesizes once, and presents a stable onboarding format. This is a useful execution strategy around the stronger local contract/boundary model.
2. **Evidence coverage in `why`.** Seven categories—code archaeology, issue tracker, long-form docs, chat, observability, error tracking, and analytics—are explicitly mapped. An unavailable or empty source is recorded instead of silently omitted. Claims are separated into directly supported, inferred, speculative, and unknown.
3. **First-divergence debugging.** pstack's bug-fix flow adds runtime repro, binary-search hypotheses, instrumentation, and history to the local `yesh-debug` rule. The local first contract divergence remains the sharper completion criterion.
4. **Candidate competition with grafting.** Arena does not merely vote: independent candidates are cross-judged, one base is selected, useful pieces are grafted, and the result is verified. This is more useful than a generic “brainstorm alternatives” instruction.
5. **Verification as a generated capability.** `create-verification-skill` turns the real run/drive/observe/isolate surface into a reusable project-local skill, with feature coverage and cleanup. `maintain-verification-skill` updates it from source and live behavior.
6. **Auditable execution.** `show-me-your-work` uses a compact TSV rather than a narrative journal, logs decisions rather than every action, audits against the transcript, and protects spreadsheet cells beginning with `=`, `+`, `-`, or `@`.
7. **Durable orchestration state.** The imported `orch` implementation uses typed plain-file records, atomic writes, PID-aware locking, idempotency, an inbox, a ledger keyed by PR and head SHA, and a computed frontier. These are strong stateful-system patterns even though the current frontier implementation is Graphite-specific.
8. **Unit-level proof and independent verification.** The playbooks distinguish cheap inline verification from a separate verifier for expensive, judgment-heavy, or high-blast-radius work, and require a verifier from a different model family when applicable.
9. **Principle encoding.** The 21 principles give names to recurring engineering choices: model the domain, separate shared state before parallelizing, sequence verifiable units, migrate callers before deleting APIs, and fix roots. Many overlap local skills but could serve as a vocabulary/index rather than repeated prose.
10. **Concrete prototype loops.** The prototype/visual-parity guidance uses real variants, switchers, screenshots or live surfaces, and a focused question instead of abstract preference debate.

## Instruction-quality review

### Triggers and routing

- The central routing idea is clear: `/poteto-mode` is the default for nontrivial work and playbooks own common shapes ([README lines 21–36](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/README.md#L21-L36), [mode triggers](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/poteto-mode/SKILL.md#L13-L35)).
- Several descriptions are too broad or overlap by design: `bro`, `teach`, `how`, `why`, `reflect`, `interrogate`, `figure-it-out`, `architect`, and the mode can all plausibly trigger on the same request. A future portfolio needs precedence and a single owner for each trigger.
- Some important skills are explicitly not model-invocable (`poteto-mode`), which is appropriate for a sticky entry mode but means description-based discovery cannot be relied on. The plugin also describes agents that were not included in this scoped import.
- `no-comments` depends on a Comment Sicko agent outside this copy. `make-bot-ui` is a specialized operational workflow rather than a broadly discoverable skill.

### Steps and completion criteria

- `how` has a useful output format, and `why` has unusually strong epistemic output and gap reporting. Most leaf principles, `bro`, `teach`, `technical-writing`, `unslop`, and `typescript-best-practices` prescribe behavior without an explicit completion predicate.
- `poteto-mode` requires a todo and named principles, but the universal reply convention is not the same as proof that the task is complete. It delegates completion to each playbook, which is sensible but not consistently specified.
- Some playbooks are excellent operational checklists but too large for progressive disclosure. Requirements are repeated between `poteto-mode`, individual playbooks, README, and leaf principles. A future unified portfolio should put trigger + contract + completion in the skill, and link detailed procedures only when selected.
- The autonomy rule “never block on the human” is productive for reversible work, but must not bypass an actual product decision, permission gate, or user-requested no-agent constraint. The current instructions distinguish those cases, but the boundary is spread across several files.
- `architect` has an opt-in agreement phase whose default can proceed, so it is not a reliable human gate. `why` says to inspect MCP availability at runtime, but no portable MCP registry or fallback contract is supplied.

### Duplication and contradictions

- The principles are repeated inline in `poteto-mode` and as 21 separate skills. This improves local discoverability but creates drift risk.
- The README says “never require Graphite (`gt`)” in the shipping playbook, while the orchestration implementation computes its authoritative frontier through `gt`; the orchestrate playbook also requires a stacker to run `gt` ([shipping lines 7–15](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/poteto-mode/playbooks/shipping.md#L7-L15), [orchestrate lines 79–84](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/poteto-mode/playbooks/orchestrate.md#L79-L84), [implementation frontier](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/poteto-mode/scripts/orch/orch.ts#L470-L520)).
- Model defaults occur in the README, `poteto-mode`, each routed skill, and `/setup-pstack`. That is a lot of duplicated configuration surface.
- The verification, worktree, PR, and cloud-agent rules are repeated across playbooks. They should be reusable contracts or adapters rather than copied prose.

### Stale or tightly coupled provider/model assumptions

- Defaults include model slugs such as `grok-4.6-fast-xhigh`, `claude-fable-5-1-thinking-max`, `claude-opus-5`, and references to `gpt-5.6`. They may be valid in the source environment, but are not portable facts. `/setup-pstack` correctly says to detect valid slugs, yet the fallback tables and plan checker still encode concrete names.
- The plan checker has a hard-coded “Ten lanes on grok-4.6-fast-xhigh” expectation and requires ten live lanes. That is an environmental policy disguised as validation, not a provider-neutral invariant.
- `Task`, `subagent_type`, `generalPurpose`, `run_in_background`, `environment`, Cursor `/loop`, `/goal`, `AskQuestion`, `update_state`, `SendToUser`, Cursor dashboard, and Cursor transcript paths are execution contracts, not general instructions.
- `gh`, GitHub, optional `origin`, and Graphite `gt` are forge/stack contracts. `watch-pr` is type-safe and useful, but its implementation is GitHub GraphQL-specific. The source's `Origin when available` behavior is an explicit runtime/forge branch, not a universal default.
- `make-bot-ui` names a Grok Bot, Tailscale, a webhook API, and a local `0.0.0.0` server. That should remain an explicitly selected integration workflow, not part of the base portfolio.

### No-ops and missing contracts

- A skill can be well-written but operationally inert if its named agent or tool is not installed: `poteto-agent`, Comment Sicko, Cursor MCPs, Cursor control surfaces, and some built-in commands are not contained in this scoped import.
- Cloud workers cannot read the local orchestration store, so the playbooks require inlined briefs or repo pointers. That is an important contract, but it assumes the Cursor cloud worker can resolve those pointers and return a durable receipt.
- The source does not define a provider-neutral contract for spawning, resuming, cancellation, workspace isolation, permissions, timeouts, retries, or result delivery. It specifies Cursor's mechanism instead.
- `reflect` requires non-readonly reviewers for MCP access while prohibiting file writes through prompts; this is a policy convention, not an enforced capability boundary.
- `architect` sketches “not implemented” boundaries but does not specify where the sketch is persisted or how every design decision is checked against it. `technical-writing` and `unslop` have useful checklists but no machine-checkable completion.
- `orch` is a promising state machine/store implementation, but its actual Graphite call is a portability blocker and conflicts with the “never require Graphite” prose. The implementation should not be adopted without resolving that contract.

## Cloud-agent, runtime, and provider references

The table classifies the complete operational families of references found in the imported skills, playbooks, README, and directly referenced scripts. “Required” means required by the pstack procedure as written in its native environment, not required by a future unified design.

| Reference family | Classification in pstack | Evidence / paths | Portability conclusion |
|---|---|---|---|
| Cursor plugin/skill runtime, `Task`, `subagent_type`, `generalPurpose`, `run_in_background` | **Required** for native delegated procedures | `how`, `why`, `arena`, `interrogate`, `reflect`, `swarm`, `poteto-mode` | Replace with a provider-neutral delegation contract. |
| `poteto-agent` and Comment Sicko subagent types | **Required** for the workflows that invoke them | `poteto-mode`, `no-comments`, README lines 186–192 | Their definitions are not in this scoped copy; treat as missing dependencies, not invented local interfaces. |
| Cursor MCP discovery and MCP evidence servers | **Required** for `why`'s full evidence pass and `reflect`'s context lookups | `why` lines 95–113; source playbooks; `reflect` lines 35–49 | Make each evidence source optional with explicit “unavailable/not searched” output. |
| `environment: "cloud"` | **Default** for `swarm` workers and most orchestrated workers/verifiers | `swarm` lines 28–32; orchestrate lines 17–19 | For this repository, route delegated work to Scotty by default, but do not translate this into an invented Scotty environment name. |
| `environment: "local"` | **Explicit override** when the task needs the user's machine, local transcripts, simulators, IDE state, local auth, `control-ui`, or `control-cli` | orchestrate lines 17–19; swarm lines 28–32 | Preserve as a semantic “local capability required” flag, not as a provider literal. |
| Model role slugs (`grok`, Fable, Sol, Opus; concrete slugs in defaults) | **Default** fallback values | README lines 11, 30; `poteto-mode` lines 87–93; `how`/`why` | Never carry concrete defaults into a provider-neutral portfolio. Use roles and runtime-supplied capabilities. |
| `/setup-pstack` role values, detected model list, `inherit-parent`, `auto` | **Explicit override** or parent-runtime selection | `setup-pstack` lines 10–65 | Retain the idea of role overrides; replace model-slug config with a runtime capability contract. |
| Cursor `/loop`, `/goal`, dashboard, workspace `agent-transcripts`, `~/.cursor/rules/pstack-models.mdc` | **Required** for their named native workflows; no portable equivalent supplied | `autonomous-run`, `figure-it-out`, `recall`, `setup-pstack`, `poteto-mode` | Adapter-only. A future implementation must state the local transcript/state locations independently. |
| `gh` / GitHub | **Default** forge and source-control path | `why` lines 62–90; shipping; watch-pr; recall | Keep a forge interface; GitHub may be the default only where repository policy says so. |
| Origin CLI | **Explicit override** when installed and able to resolve the repository | shipping line 7 and lines 10–14 | Good example of explicit runtime/forge selection. |
| Graphite `gt` | **Required by the imported `orch` frontier implementation and orchestrate stack safety**, despite shipping saying it is never required | `orch.ts` lines 470–520; orchestrate lines 79–84 | Must be isolated or removed in any unified design; this is an unresolved source contradiction. |
| `control-ui` / `control-cli` from `cursor-team-kit` | **Required** for the playbooks' real-surface verification exceptions | shipping line 7; orchestrate lines 17–19 | Not bundled by this import and not a generic app-driving contract. |
| Grok Bot webhook, Tailscale, local `0.0.0.0` server | **Required** only for `make-bot-ui` | `make-bot-ui` lines 13–57, 73–105 | Keep as an explicitly selected integration skill; do not generalize. |
| URLs such as `api2.cursor.sh`, cloud-agent URLs, pushed branches | **Example or workflow-specific reference**, depending on the skill | `make-bot-ui`, `recall`, session-pickup, source playbooks | Treat as examples of receipt/endpoint shapes, not a universal API. |
| Datadog, Sentry, Slack, Notion, Linear, Databricks, incident systems, analytics warehouses | **Example/provider category**, with a runtime-dependent search | `why` source playbooks and investigator roster | Model these as optional evidence-provider capabilities and report unavailable categories. |
| `origin`, `gh`, `gt`, local git, simulators, IDE/auth | **Explicit capability selection** in different playbooks | playbooks and scripts | Keep capabilities in the task contract; do not silently assume installation. |

### Provider-neutral routing rule for future consolidation

Use this rule as the candidate adapter contract:

> **Provider/runtime routing.** Route work to **Scotty by default** whenever a cloud or delegated agent is needed. If the workflow explicitly names another provider or runtime, use that named runtime for that step. Do not infer or invent a Scotty CLI, API, environment string, model syntax, workspace behavior, branch behavior, permission model, receipt channel, timeout, retry policy, cancellation mechanism, or recovery semantics. Before dispatch, the selected runtime must supply those fields. If it does not, report **provider contract unknown**, stop only the provider-dependent step, and continue local/provider-neutral analysis where possible.

The **unknown Scotty invocation contract** is intentionally explicit here. This research does not claim that Scotty accepts Cursor's `Task`, `generalPurpose`, `environment: "cloud"`, model names, or cloud-base-branch fields. An eventual adapter must define at least:

- invocation and authentication;
- workspace, branch, and isolation semantics;
- read/write permissions and local-vs-cloud capability access;
- model/role selection, if any;
- result, log, and evidence receipt format;
- timeout, retry, cancellation, and zombie/recovery behavior;
- concurrency limits and cost/authorization gates.

## Possible unified portfolio shapes

These are discussion options only. No local skill has been deleted, renamed, overwritten, or consolidated.

### Shape A — Local semantic core plus adapters (recommended)

Keep `yesh-how`, `yesh-debug`, `yesh-architect`, `yesh-plan`, `yesh-structure-review`, `stateful-systems`, `shaping`, and `breadboarding` as the canonical skills. Add provider-neutral optional procedures for pstack's `why`, Arena review, audit trails, generated verification, and multi-agent execution. Put Cursor/Scotty/GitHub/Origin/Graphite implementations behind adapters. This minimizes semantic churn and uses the local skills' stronger completion criteria.

### Shape B — One lifecycle portfolio with composable lenses

Create a single lifecycle router with stages `frame -> understand -> shape -> execute -> verify -> hand back`, and make how, why, debug, architecture, state, verification, review, and trail composable lenses. pstack principles become a vocabulary/index referenced by stages. This is the cleanest user experience but requires careful trigger precedence and a migration plan so the existing local skills remain discoverable.

### Shape C — Preserve both portfolios with an explicit bridge

Keep pstack as an incoming/Cursor compatibility portfolio and local yesh skills as the repository-native portfolio. Add only a small bridge document that maps concepts, chooses local canonical behavior, and applies the Scotty routing rule. This is lowest-risk and easiest for discussion, but leaves duplicate names such as `bro` and parallel how/debug entry points until a later decision.

## Pinned source links for the key seams

- [pstack README](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/README.md#L21-L36) and [skill catalog](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/README.md#L95-L137)
- [pstack mode routing and defaults](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/poteto-mode/SKILL.md#L13-L93)
- [pstack how](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/how/SKILL.md#L16-L135) vs local [`yesh-how`](../skills/yesh-how/SKILL.md#L8-L29)
- [pstack why](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/why/SKILL.md#L49-L230)
- pstack [bug-fix playbook](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/poteto-mode/playbooks/bug-fix.md#L1-L17) vs local [`yesh-debug`](../skills/yesh-debug/SKILL.md#L8-L27)
- pstack [architect](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/architect/SKILL.md#L21-L83) vs local [`yesh-architect`](../skills/yesh-architect/SKILL.md#L8-L26)
- [Arena](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/arena/SKILL.md#L22-L71), [verification generation](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/create-verification-skill/SKILL.md#L9-L44), and [decision trail](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/show-me-your-work/SKILL.md#L34-L76)
- pstack [swarm cloud contract](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/swarm/SKILL.md#L20-L32) and [orchestrate worker exceptions](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/poteto-mode/playbooks/orchestrate.md#L15-L19)
- pstack [shipping forge choice](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/poteto-mode/playbooks/shipping.md#L7-L15) and [Graphite implementation](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/skills/poteto-mode/scripts/orch/orch.ts#L470-L520)
- [pstack plugin manifest](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/.cursor-plugin/plugin.json#L1-L31) and [MIT license](https://github.com/cursor/plugins/blob/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack/LICENSE#L1-L21)
