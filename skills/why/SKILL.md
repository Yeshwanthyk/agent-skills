---
name: why
description: "Investigate why existing code or a shipped technical, product, or operational decision has its current shape, including rationale, history, tradeoffs, regressions, postmortems, and data-backed thresholds. Anchors in code, searches every available evidence category, and returns cited confidence-calibrated findings. Use how for current mechanics."
---

# Why

Investigate the motivation and intent behind code. Answer what forces led to its shape: product or business constraints, operational incidents, edge cases, rejected alternatives, historical context, regressions, and data-backed thresholds.

This is the companion to [`how`](../how/SKILL.md): **how** explains current mechanics and execution; **why** explains historical, product, or operational rationale. A request can use both, but do not substitute mechanics for motivation.

## Operating posture

Use an evidence-first archaeological posture:

- Build the code anchor before seeking narrative.
- Search broadly before reading deeply; default to coverage across every available category.
- Cite claims so a reader can verify them quickly.
- Separate direct support, supported convergence, inference, speculation, and unknowns.
- Treat null results, contradictions, source gaps, and timeline uncertainty as findings.
- Prefer precise quotes and calibrated language over a smooth story. Code explains what exists, not why it exists.

Read [`references/epistemics.md`](references/epistemics.md) when weighing evidence or writing the synthesis.

## Route and scope

1. Restate the question and identify the target: file paths, line ranges, symbols, feature or pattern, and any embedded hypothesis.
2. Select the investigation boundary from the request. For a narrow target, trace the target and its origin; for a broad history question, include renames, related commits, linked work, and the relevant ship or incident window. State the boundary and interpretation.
3. Default to all seven evidence categories below. Give each category one bounded primary investigation using its available tools and playbook. Do not skip a category because it seems unlikely to contain the answer.
4. A category may be recorded as **searched**, **unavailable**, or **out of scope with a written, provable reason**. “Probably irrelevant” is not a reason. An unavailable category is a gap, not a null result.

The categories are:

1. **Source control history** — commits, blame, diffs, PRs, review discussion, repository comments, tests, repository-contained ADRs, and release notes.
2. **Issue or ticket tracking** — tickets, parents, projects, comments, labels, attachments, and linked work.
3. **Long-form documentation** — PRDs, RFCs, external ADRs, meeting notes, runbooks, postmortems, and team pages stored in document systems.
4. **Real-time team chat** — channels, threads, incident discussions, and messages around the ship date.
5. **Infrastructure observability** — metrics, logs, monitors, traces, dashboards, and formal incidents.
6. **Error or exception tracking** — issues, events, stack traces, releases, replays, and resolution notes.
7. **Product analytics or warehouse** — product events, usage and billing, experiments or flags, query history, lineage, and warehouse telemetry.

Provider names such as Linear, Slack, Notion, Datadog, Sentry, or Databricks are optional adapter examples only. Discover the tools available in the current harness at run time, map them to these categories, and adapt the relevant playbook. Never assume a provider, schema, project slug, channel, table, or authentication state.

## Ordered investigation

### 1. Establish the code anchor first

Read enough live code to identify the target and its callers, then collect the historical seed. At minimum capture:

- target paths and line ranges;
- key functions, classes, constants, flags, error strings, and tests;
- recent commits touching the target, including rename history where relevant;
- blame for the relevant lines;
- PR numbers, ticket IDs, incident IDs, and linked work found in commit messages or PR metadata.

Use the repository's normal tools. Typical commands are:

```bash
git blame -L <start>,<end> <file>
git log --follow -p -- <file>
git log --oneline -20 -- <file>
git log -1 --format=%B <commit>
```

Use an available hosted-repository tool for full PR bodies, reviews, comments, and linked issues when one exists. If it is unavailable, record that source-control subcategory gap and continue. Do not infer intent from the code's shape, symbol names, or the fact that a test exists.

**Anchor completion:** the target, symbols, relevant history, and discovered identifiers are recorded, or each missing item has a named reason.

### 2. Discover evidence tools and make the coverage map

Inspect the current harness's managed tool catalog or MCP discovery surface. For each available evidence tool, record its categories and the bounded query plan for each distinct evidence surface. One tool may serve several categories; keep their searches and results separate.

The coverage map must name all seven categories and one of:

- tool(s) selected and search scope;
- unavailable, with the discovery or access failure;
- out of scope, with a provable reason tied to the target and explicit user scope.

Include the map in the final Sources Consulted section. Tool discovery is dynamic: do not rely on a fixed configuration path or a provider-specific tool name.

**Coverage completion:** every category has a selected bounded search, an explicit unavailable result, or a written out-of-scope reason before investigators are dispatched.

### 3. Investigate categories in parallel

When the managed subagent runtime is available, dispatch one investigator per category that can be searched. Request read-only execution when the runtime supports it; otherwise put the read-only, no-external-state-change constraint in the prompt. Give each investigator:

1. [`references/investigator-prompt.md`](references/investigator-prompt.md);
2. the one matching category playbook from [`references/source-playbook.md`](references/source-playbook.md);
3. the code anchor, identifiers, timeline, and original question;
4. [`references/sources/incident-postmortem.md`](references/sources/incident-postmortem.md) when the target is defensive (for example, a null guard, retry, timeout, rate limit, feature flag, egress guard, or OOM handler);
5. the exact tool or category scope discovered at run time.

Each investigator owns one category and one bounded investigation. It must report what it searched, what it opened, direct and indirect evidence, contradictions, gaps, and additional leads without synthesizing the final story. Search broad terms first, then follow relevant links within that category and read candidate records fully.

Load and follow the shared [agent-routing contract](../poteto-mode/references/agent-routing.md). If delegation is unavailable, perform the same category investigations locally, preserve the one-category boundary, and report the limitation.

**Investigation completion:** every searched category returns findings or a documented null result, every unavailable or out-of-scope category has its reason in the coverage map, and every material cross-category lead is ready for closure.

### 4. Close cross-category leads

Collect the Additional Leads from every investigator. Route each material lead to its owning category for one bounded follow-up, or record the access, retention, scope, or relevance reason that prevents checking it. Add follow-up searches and results to the coverage map.

**Lead completion:** every material lead has a result or a named gap before synthesis.

### 5. Synthesize only after evidence returns

After all category results are available, reconcile them against the code anchor and timeline. If delegation is useful, send one synthesizer the investigator findings, coverage map, question, anchor, and [`references/epistemics.md`](references/epistemics.md) plus [`references/synthesizer-prompt.md`](references/synthesizer-prompt.md). The synthesizer may spot-check citations with read-only tools but must not modify files or external state.

Apply [`references/epistemics.md`](references/epistemics.md) as the sole confidence authority. Surface contradictions, distinguish motivation from evidence of impact, and check ship dates, neighboring changes, and retention before relying on temporal correlation.

**Synthesis completion:** every material claim is assigned a confidence tier, every direct or supported claim has a precise citation, every inference is hedged with its evidence chain, and contradictions and gaps are explicit.

### 6. Present the read

Read and follow the output contract in [`references/synthesizer-prompt.md`](references/synthesizer-prompt.md), whether synthesis is delegated or direct. Keep its confidence language intact. If the question precedes implementation, include the contract's separate **Preserve / Change / Avoid / Risk** constraint set.

**Presentation completion:** the response follows that contract, accounts for all seven categories and material leads, passes the epistemic calibration, and states exactly what remains unsearched.
