---
name: deep-dive-explainer
description: Research a topic and write a connected, long-form explainer with a reusable standalone HTML reading layout. Use for deep dives into technology, science, history, institutions, or practical processes; interactive simulations belong elsewhere.
---

# Deep Dive Explainer

Produce an original, source-grounded article that teaches how the pieces connect and what those connections mean in practice. Default reader: a curious, capable adult new to this topic; adapt technical prerequisites to the subject. Default delivery: article JSON plus standalone HTML. Honor requested formats and scope.

## Research into an explanation

1. Establish the reader's question and the subject's defining mechanism. Use supplied context; ask only when ambiguity changes the research direction. Choose an output directory in the requested workspace.
2. Read [the research method](references/research.md). Build a question map, follow mechanisms and dependencies, seek counterevidence, and reconcile contradictions using evidence appropriate to the subject. This is the core workflow for every new topic, not optional background. Supplied style examples are not technical authority.
3. Keep the working model, evidence ledger, and unresolved questions in `research.md` as specified there. Reach its research completion criteria before drafting. If available evidence or the user's budget limits depth, narrow the conclusion and disclose the material gaps.
4. Outline in reader dependency order. Define the central primitive before its machinery. For each important relationship, ask: what enters, what happens, who owns it, what leaves, and what consequence follows? For stateful systems, also trace persistence, acknowledgment, recovery, and authority. Include only questions relevant to this subject.
5. Draft using the language and section guidance below. Each section answers a different reader question. Give a mechanism its full explanation in one home; later sections link back and add a new consequence or application. The opening promises the explanation; the ending gives a judgment rather than repeating the article.
6. Review the draft in reader order: define core terms before the mechanisms that depend on them, and remove caveats that merely repeat an earlier explanation. Audit adoption-changing claims and exact runtime guarantees against the notes; check broad words such as “always,” “bounded,” and “in order” against failure and concurrency paths. Put descriptive source links beside supported claims. Distinguish provider claims, measured results, proposals, and deductions in ordinary prose. Resolve contradictory sources or name the exact uncertainty. Cite benchmarks with workload and environment; compare costs with assumptions and operator costs.
7. For HTML, read [the content contract](references/content.md), write `article.json`, then execute the bundled renderer. Do not read or regenerate the renderer or stylesheet during ordinary authoring. They own layout, escaping, navigation, and print styles. Revise content and rerender; alter the shared assets only when explicitly asked to change the reusable design.

## Language and composition

- Lead with a concrete definition and the useful consequence. Then explain the problem that makes the subject worth understanding.
- Use familiar verbs and precise nouns. Introduce a term with a small example before relying on it. Prefer two to four sentences per paragraph, with occasional single-sentence emphasis; avoid a whole article of isolated one-liners.
- Connect sentences causally: mechanism → consequence → example → boundary. Vary that order where the reader already knows part of it. Explain why a feature matters instead of listing features indefinitely.
- Use question headings for reader questions and declarative headings for useful conclusions. Prefer specific titles such as “Where the request goes” over generic “Architecture overview.” Let the topic determine section count and length.
- Move between abstraction and a running example. A named room, tenant, job, or VM can make ownership and routing concrete. Keep the example stable as new layers appear.
- Use bullets for parallel capabilities or criteria, numbered lists for actual sequences, tables for comparable dimensions, and small code blocks for executable or explicitly illustrative examples. Use Mermaid for branching or lifecycle relationships and ASCII for short flows; follow the diagram contract in references/content.md. Explain what a snippet demonstrates and its expected result. Verify commands from current primary sources; mark unexecuted examples as such.
- Explain a caveat beside the mechanism it qualifies. Reserve a final limits section for unresolved or cross-cutting adoption constraints. Avoid repeating the same warning in every section.
- Use first person only for supported user experience or an explicitly framed recommendation. Never invent deployments, benchmarks, subscriptions, personal projects, screenshots, or hands-on use. Hypothetical applications stay conditional.
- Write in an original voice using these general editorial traits. Do not imitate an author's distinctive phrases, personal anecdotes, or promotional links.

## Choose the narrative spine

These are optional paths, not a mandatory heading checklist. For other subjects, derive the spine from the question map and explanatory model:

- **Architecture:** motivating coordination problem → primitive → components and their relationships → one request/write/recovery path → economics → small example → compatibility → workload fit → practical experiment → judgment.
- **Product:** concrete promise → what the user gets and pays for → first useful operation → underlying mechanism → linked workflows and trust boundaries → representative deployment → alternatives and limits → judgment.

Background belongs only where it explains a design choice. Applications should show a real mapping: existing need → proposed unit or workflow → benefit → missing machinery. Use verified user project context when available; otherwise use a clearly hypothetical example. Include a poor-fit case when it clarifies the decision. A useful deep dive can be long; depth comes from new relationships, not a word quota or an exhaustive feature catalog.

## Build and finish

```sh
python3 <skill-dir>/scripts/render.py <output-dir>/article.json --output <output-dir>/article.html
```

The renderer needs only Python's standard library. Its HTML has no external runtime dependencies or fonts. Bundled reading assets provide the larger type scale, current-section TOC tracking, optional Vim navigation, and paragraph annotations with local saving and JSON export; keep those mechanics out of article content. Read [the editorial reference](references/editorial.md) only when calibrating a new article, diagnosing a flat draft, or explaining the method to the user.

Before delivery: check factual support, remove repeated explanations, and verify all renderer errors are resolved. Open the HTML at desktop and narrow widths when a browser is available; check a contents link, code/table overflow, and reading comfort. Report structural checks separately if visual inspection is unavailable. Deliver the HTML and editable source links with a brief research/verification boundary. Creating an article does not authorize running its deployment commands or publishing it.

When handling reader annotations, read the quoted passage and question, research and revise the article, then use that note's Resolve button in the reader and verify its resolved state. Notes live in the browser, so editing article files alone does not resolve them. Reopen reverses resolution; exports retain status and resolution time. If browser access is unavailable, report which notes were addressed without claiming their saved status changed.
