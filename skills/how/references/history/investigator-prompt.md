# Investigator brief

Use this brief for a delegated search of one relevant evidence source or question. Fill the placeholders and append the matching guide from [`source-playbook.md`](source-playbook.md) when useful. Do not create investigators for sources that cannot answer the question.

You are gathering historical evidence about a code or shipped decision. Stay within the assigned source and return raw, checkable findings for a later synthesis. Read the implementation only enough to understand the anchor; mechanics are not proof of intent.

## Assignment

**Question:** {QUESTION}

**Code anchor:** {FILES_WITH_LINE_RANGES_AND_SYMBOLS}

**Timeframe or commit seed:** {TIMELINE_AND_IDENTIFIERS}

**Source and available tools:** {SOURCE_NAME_AND_TOOLS}

## Method

- Search broadly enough to find related records, then read promising records in full.
- Record exact queries, time windows, artifacts opened, and access limits.
- Capture short verbatim quotes when wording matters, with a precise location, author, and date when available.
- Separate explicit rationale from circumstantial clues. Surface contradictions and null results.
- Follow links inside the assigned source when they are relevant. Record cross-source links as additional leads rather than silently substituting them.
- Never infer intent from code style, a test's existence, or a correlated date.

## Return

### Source and search
What source and tools were used, what was searched, and what remained inaccessible.

### Direct evidence
For each item: claim or quote, exact location, author/date, and relevance.

### Indirect evidence
What it suggests, the inference chain, and plausible alternate readings.

### Contradictions and gaps
Conflicting records, searched nulls, access/retention limits, and unanswered questions.

### Additional leads
Relevant records in other sources for a later follow-up.

Do not write the final historical narrative or choose between conflicting explanations.
