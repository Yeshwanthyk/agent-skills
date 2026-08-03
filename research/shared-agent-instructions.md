# Shared persistent instructions for Codex, Claude Code, and Pi

Research date: 2026-08-02. Scope: public, primary sources only. This report does not use local configuration, private sessions, correction history, memories, or task content. Pi source was checked at commit `4c01c709380621c5ff2719162cd7a7973dcb2799` in the current `earendil-works/pi` repository; older `badlogic/pi-mono` URLs redirect there.

## Bottom line

Use one concise root `AGENTS.md` as the shared canonical file, plus a tiny root `CLAUDE.md` containing `@AGENTS.md`. Codex and Pi read `AGENTS.md` directly; Claude Code officially documents the import shim because it reads `CLAUDE.md`, not `AGENTS.md`. Put only facts and behavioral defaults needed in nearly every task in that shared file. Put multi-step, task-specific, or resource-heavy workflows in skills, where all three harnesses support on-demand loading.

Write rules as concrete, verifiable actions. Prefer stating the desired behavior over listing prohibitions, while keeping direct negative boundaries for genuinely unsafe, destructive, external, or out-of-scope actions. State each rule once, avoid contradictions, and place specialized rules at the narrowest scope that all intended harnesses will actually load.

## Model-name status

The two names in the question are not undocumented local-only names as of the research date:

- `gpt-5.6-sol` is an official OpenAI model ID. OpenAI says the `gpt-5.6` alias routes to it and publishes GPT-5.6-family prompting guidance. Source: https://developers.openai.com/api/docs/models/gpt-5.6-sol and https://developers.openai.com/api/docs/guides/latest-model
- Anthropic publishes model-specific guidance for **Claude Fable 5**. A local selector labeled only `Claude Fable` may still be a harness alias, so do not infer its exact version without checking the harness mapping. Source: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5

The shared-file recommendations below come primarily from the owning harnesses because file discovery, precedence, skills, and context loading are harness behavior. Model-specific advice is used only where it bears directly on instruction design.

## What belongs in always-on instructions

The common denominator is stable project context and operating constraints that should shape almost every task:

- repository map and authoritative locations;
- exact build, test, lint, and verification commands;
- durable engineering, review, and naming conventions;
- action and approval boundaries;
- a compact definition of done;
- rare, high-impact safety constraints and known project gotchas.

OpenAI calls `AGENTS.md` the place for durable repository guidance and recommends layout, run commands, checks, conventions, constraints, and verification. It also cautions: “A short, accurate `AGENTS.md` is more useful than a long file full of vague rules.” Source: https://learn.chatgpt.com/guides/best-practices and https://learn.chatgpt.com/docs/agent-configuration/agents-md

Anthropic similarly says `CLAUDE.md` should hold facts Claude needs every session, including build commands, conventions, layout, and always-do rules. It says: “Specific, concise, well-structured instructions work best.” Source: https://code.claude.com/docs/en/memory

Pi documents context files for project instructions, conventions, common commands, safety rules, and preferences. Source: https://pi.dev/docs/latest/usage#context-files and https://pi.dev/docs/latest/quickstart#context-files

Do not use an instruction file as hard enforcement. Anthropic explicitly describes `CLAUDE.md` as context rather than enforced configuration and recommends hooks or settings for true blocking. Codex likewise has separate configuration, sandbox, approval, rules, and hooks surfaces. Cross-harness shared prose should guide behavior; CI, permissions, hooks, and policy should enforce invariants.

## What belongs in opt-in skills

Move a rule set out of the always-on file when it is a multi-step procedure, applies only to a recognizable task, needs substantial examples or reference material, bundles scripts/templates, or would otherwise consume context on unrelated work.

OpenAI says skills package repeatable workflows and load their complete instructions when the request matches or the user invokes them. Source: https://developers.openai.com/plugins/concepts/skills and https://learn.chatgpt.com/docs/build-skills

Anthropic says multi-step procedures belong in a skill or path-scoped rule, and task-specific instructions that do not need constant context should use skills. Source: https://code.claude.com/docs/en/memory and https://code.claude.com/docs/en/skills

Pi calls skills “self-contained capability packages that the agent loads on-demand.” At startup it exposes metadata; the full `SKILL.md` is read when relevant or explicitly invoked. Its documentation describes this as progressive disclosure. Source: https://pi.dev/docs/latest/skills and implementation: https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/skills.ts

This makes the clean boundary: always-on files define stable environment and behavior; skills define methods for particular jobs.

## Phrasing rules positively

Anthropic’s general prompting guidance is explicit: “Tell Claude what to do instead of what not to do.” It recommends concrete desired output and constraints, with ordered steps only where order or completeness matters. Source: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

For shared rules, prefer an executable positive target:

- Prefer `Run the package-level test command after changing package code` over `Do not forget tests`.
- Prefer `Use existing repository abstractions unless the task requires a new one` over a long blacklist of unwanted patterns.
- Prefer `Report findings and stop for review-only requests` over several overlapping mutation prohibitions.

Negative language is still appropriate when the prohibition itself is the contract: destructive actions, secret handling, external writes, irreversible operations, or commands known to damage the project. Pair it with the safe path when possible. OpenAI’s Codex review guidance similarly recommends concise rules that name both flagged behavior and a safe path or exception. Source: https://learn.chatgpt.com/docs/agent-configuration/agents-md

Claude Fable 5’s public guide adds a model-specific nuance: improved instruction following means a brief instruction can replace enumerating many manifestations of the same behavior. Source: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5

## Specificity, scope, and precedence

Make every rule observable: name commands, paths, triggers, deliverables, and stopping conditions. Anthropic contrasts `Run npm test before committing` with vague advice such as `Test your changes`; OpenAI recommends prompts and instructions with goal, context, constraints, and done conditions.

Scope differs enough that the shared design must not assume identical loading semantics:

- **Codex:** reads global guidance, then one applicable file per directory from project root to current directory; later, closer files override earlier guidance. Default combined project-instruction limit is 32 KiB. Source: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- **Claude Code:** loads ancestor `CLAUDE.md` files at launch, concatenated broad-to-specific; descendant files load when Claude reads within those directories. Anthropic warns contradictory rules may be chosen arbitrarily rather than defining conflicts as a reliable override mechanism. Source: https://code.claude.com/docs/en/memory
- **Pi:** chooses `AGENTS.md` before `CLAUDE.md` in each directory, loads a global file and ancestor files broad-to-specific, and concatenates them into the system prompt. Source: https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/resource-loader.ts and https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/system-prompt.ts
- **AGENTS.md specification:** standard Markdown has no required fields; nested files specialize subprojects, the closest file wins, and explicit chat prompts override file instructions. Quote: “explicit user chat prompts override everything.” Source: https://agents.md/

Therefore, use nesting to narrow applicability, not to maintain contradictory versions of the same rule. Keep the root baseline internally consistent. If a nested shared `AGENTS.md` matters to Claude Code, add a corresponding nested `CLAUDE.md` import; Claude does not natively discover nested `AGENTS.md` files.

## Instruction length

There is no useful universal character target, but every source favors less always-on material:

- Codex defaults to a 32 KiB combined project-document cap and recommends a short, accurate file; split task-specific guidance out when it grows.
- Claude Code recommends fewer than 200 lines per `CLAUDE.md`; longer files consume context and reduce adherence. Imports organize content but still consume startup context, so they are not a substitute for pruning.
- Pi documents no comparable context-file size target in the reviewed public docs/source. It still injects full context-file contents into the system prompt, so the same context-cost argument applies as an inference, not a documented Pi limit.

GPT-5.6 guidance strengthens the case for pruning: OpenAI reports that leaner system prompts improved its internal coding-agent evaluations while reducing tokens and cost, and advises: “State each instruction once.” Source: https://developers.openai.com/api/docs/guides/latest-model

Treat line and byte numbers as ceilings, not goals. Anthropic's pruning test is to keep broadly applicable material whose absence would predictably cause mistakes, rather than discoverable facts, tutorials, volatile information, or file inventories. Source: https://code.claude.com/docs/en/best-practices. Start with the smallest set of high-frequency, high-impact rules and add only evidence-backed gaps.

## Cross-harness compatibility pattern

Recommended minimal layout:

```text
AGENTS.md          # canonical shared instructions
CLAUDE.md          # contains: @AGENTS.md
.agents/skills/    # shared Agent Skills where practical
```

Why this works:

- Codex reads `AGENTS.md` and discovers shared skills.
- Claude Code officially documents `@AGENTS.md` as the compatibility bridge; a symlink also works where supported.
- Pi prefers `AGENTS.md` over `CLAUDE.md` in the same directory, avoiding duplicate loading, and supports `.agents/skills/`. Pi also documents importing Claude Code or Codex skill directories through settings.

Keep the canonical file plain Markdown with ordinary headings and bullets. Do not embed harness-specific syntax, tool names, or configuration unless all intended harnesses understand them. Put genuinely harness-specific additions below the import in `CLAUDE.md`, in Codex/Pi configuration, or in harness-specific skills; do not contaminate the shared baseline.

## Ranked candidate rule categories

1. Authorization and safety boundaries: what read-only, change, external, destructive, and scope-expanding requests authorize.
2. Verification and definition of done: exact checks, when to run them, and how to report skipped or failing checks.
3. Repository truth and navigation: authoritative directories, generated-versus-source boundaries, and the smallest useful project map.
4. Task-mode contract: distinguish answer/review/diagnosis/planning from implementation, with an explicit stopping condition.
5. Project-wide engineering invariants: only conventions that apply broadly and are not already mechanically enforced.
6. Communication contract: desired outcome-first structure, evidence and caveat requirements, and concise final reporting.
7. Change-scope discipline: preserve unrelated work, avoid unrequested expansion, and name the safe default action.
8. Dependency and environment conventions: package manager, approved commands, runtime assumptions, and setup facts.
9. Collaboration and version-control boundaries: commit/push/review rules only when they apply to nearly every task.
10. Skill-routing rule: move multi-step or task-specific workflows to skills and state the few trigger categories worth advertising globally.
