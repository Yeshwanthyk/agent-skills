# Slop patterns

Detect each pattern, then rewrite. A pattern that serves the text can stay.

## Content

- **Superficial -ing phrases.** "highlighting…", "ensuring…", "reflecting…", "showcasing…". Delete, or expand into a real claim with its source.
- **Vague attribution.** "Experts believe", "industry reports suggest". Name the source or delete.
- **Generic conclusions.** "The future looks bright." State the specific plan or fact.
- **Feelings instead of mechanisms.** "SQL you can read", "types that follow your schema". Name the mechanism or a number: "`.toSQL()` returns the exact string sent to the database", "a column rename fails the build". If the sentence could appear unchanged in another project's docs, it says nothing about this one.

## Language

- **AI vocabulary.** Additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape, pivotal, showcase, tapestry, testament, underscore, vibrant. Use plain words.
- **Fancy "is".** "serves as", "stands as", "boasts", "features". Say "is" or "has".
- **"Not just X, but Y"** and mirror sentences ("A without B, or B without A"). State the point.
- **Forced threes.** Use the natural number of items.
- **Synonym cycling.** One name per concept, repeated.
- **False ranges.** "from X to Y" where X and Y share no scale. List the items.
- **Fancy words.** utilize → use, leverage → use, facilitate → help, numerous → many, in the event that → if.
- **Adverb props.** "runs quickly" → the number. "significantly improves" → the measured delta.
- **Passive voice** that hides the actor. "queries are validated" → "the compiler validates queries". Fine when the actor is unknown or irrelevant.

## Jargon and mannered prose

- **Abstract metaphor nouns.** substrate, wedge, vector, locus, nexus, primitive (noun), harness (metaphor), surface (as in "API surface"), bedrock, scaffolding (metaphor), paradigm, gold-plating, ratchet (metaphor), evacuate (moving code), endgame, north star, flywheel. Use the concrete word: base, add, way, more than the job needs, a limit that only tightens, move out, the last phase.
- **Flourish.** Aphorisms ("wire it or delete it"), rhetorical fragments, personified code ("the plan holds it"), figurative verbs ("rides along"), tidy closers ("the rest follows"). Say the literal thing.
- **Framing labels.** "the key insight", "at its core", "TL;DR", "here's where it gets interesting". Just say it.

## Density

- **Over-dense sentences.** If a reader must backtrack, split it or drop clauses.
- **Over-compression.** Dropped articles, verbless fragments, arrows, and abbreviations. "Parser rejects bad date → exit 2, no write" → "The parser rejects a bad date, exits with code 2, and writes nothing."
- **Filler and hedging.** "due to the fact that" → because. "could potentially possibly" → may.

## Style

- **Em dashes and connector colons.** Prefer periods or commas. Colons are fine before a list or example.
- **Bold overuse and inline-header lists.** A bold label that restates its line ("**Performance:** Performance improved…") becomes prose. A bold lead-in followed by genuinely new detail is fine.
- **Title Case headings, decorative emoji, curly quotes.** Use sentence case, no emoji, straight quotes.

## Chat artifacts

- "I hope this helps!", "Let me know if…", "Certainly!", "Great question!", "You're absolutely right!", "Found the smoking gun!". Delete; respond directly.
