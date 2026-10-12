---
name: unslop
description: 'Write or clean padded or AI-sounding prose so a tired engineer gets it on first read: docs, PR bodies, commits, reports, skill text. On request ("bro"), plain English for later replies.'
disable-model-invocation: true
---

# Unslop

Make writing a tired engineer understands on the first read, without flattening its voice. This is a prose pass, not code contribution proof or a substitute for testing and review.

Three rules sit above everything else:

- **Cut every word that does no work.** "In order to" is "to". "It is important to note that" is nothing.
- **Use the short, everyday word**, and the codebase's own names: the real symbol, file, flag, or command, not a synonym or a description of it.
- **When a rule makes a sentence worse, fix it another way or leave it alone.** A sentence that follows every rule and sounds machine-written has failed.

Don't invent jargon. Use the words a developer would say out loud: "move", "delete", "a budget that only decreases", not "evacuate", "ratchet", or "endgame". A named pattern is fine when the text says what it means the first time.

## Plain mode (explicit request)

When the user asks for plain English for the rest of the conversation ("bro", "talk plain"), write every later reply this way until they end it:

- Short active sentences and common words.
- One term per concept.
- Lists for sequences.
- A one-line definition for any technical term that must stay.

Keep facts, conditions, warnings, voice, and creative intent. Earlier messages stay as they are unless the user asks for a rewrite. Plain mode runs on this section and the three rules; apply the rest only when a reply is itself a document. The rules are ASD-STE100-inspired, not a compliance claim.

A request to write or clean a text is a one-shot pass through the Process and leaves plain mode off.

## Process

1. **Clean.** Scan for the [slop patterns](#slop-patterns) and rewrite. Preserve meaning, facts, conditions, warnings, and intended voice. Replace feelings with mechanisms or numbers.
2. **Structure, for documentation.** When writing or restructuring a doc, RFC, README, PR description, or commit message, also apply [technical writing](#technical-writing). PR bodies and commits skip the mode step.
3. **Vary the rhythm.** Mix sentence lengths on purpose: short sentences land a point, longer ones carry a fact with its condition or consequence. Split a sentence that carries two thoughts; keep a long one that carries one. Have a view where the mode allows it: explanation weighs trade-offs, so say what you make of them instead of listing pros and cons. Be specific: not "schema changes can cause issues" but "a column rename fails the build".
4. **Read once more.** Check that nothing in the source's meaning or evidence was lost, every count or tree claim is true, and any evidence gap is stated directly. Do not churn sentences whose content did not change.

## Slop patterns

Detect each pattern, then rewrite. A pattern that serves the text can stay.

### Content

- **Superficial -ing phrases.** "highlighting…", "ensuring…", "reflecting…", "showcasing…", "fostering…". Delete, or expand into a real claim with its source.
- **Vague attribution.** "Experts believe", "industry reports suggest", "some critics argue". Name the source or delete.
- **Generic conclusions.** "The future looks bright." State the specific plan or fact.
- **Feelings instead of mechanisms.** "the database stays close at hand", "SQL you can read". Name the mechanism or a number: "`.toSQL()` returns the exact string sent to the database", "a column rename fails the build". Ask what the sentence tells the reader to do or know, then write that. If the sentence could appear unchanged in another project's docs, it says nothing about this one; cut it.

### Language

- **AI vocabulary.** Additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape, pivotal, showcase, tapestry, testament, underscore, vibrant. Use plain words.
- **Fancy "is".** "serves as", "stands as", "boasts", "features". Say "is" or "has".
- **"Not just X, but Y"** and mirror sentences ("A without B, or B without A"). State the point.
- **Forced threes.** Use the natural number of items.
- **Synonym cycling.** One name per concept, repeated.
- **False ranges.** "from X to Y" where X and Y share no scale. List the items.
- **Fancy words.** utilize → use, leverage → use, facilitate → help, perform → do, numerous → many, in the event that → if. A long word has to buy its length with precision.
- **Adverb props.** "runs quickly" → the number. "significantly improves" → the measured delta. An adverb propping up a weak verb means the verb is wrong.
- **Passive voice** that hides the actor. "queries are validated" → "the compiler validates queries". Fine when the actor is unknown or irrelevant.

### Jargon and mannered prose

- **Abstract metaphor nouns.** substrate, wedge, vector, locus, vantage, nexus, modality, primitive (noun), harness (metaphor), surface (as in "API surface"), bedrock, scaffolding (metaphor), paradigm, gold-plating, ratchet (metaphor), evacuate (moving code), endgame, north star, flywheel. Use the concrete word: base, add, way, more than the job needs, a limit that only tightens, move out, the last phase.
- **Flourish.** Aphorisms ("wire it or delete it"), rhetorical fragments, personified code ("the plan holds it"), figurative verbs ("rides along", "stands on"), tidy closers ("the rest follows"). Say the literal thing: "a dial worth turning" → "a parameter worth varying".
- **Framing labels.** "the key insight", "at its core", "TL;DR", "here's where it gets interesting". Just say it.

### Density

- **Over-dense sentences.** If a reader must backtrack, split it or drop clauses.
- **Over-compression.** Dropped articles, verbless fragments, arrows, symbol-speak, and abbreviations. "Parser rejects bad date → exit 2, no write" → "The parser rejects a bad date, exits with code 2, and writes nothing."
- **Filler and hedging.** "due to the fact that" → because. "could potentially possibly be argued that it might" → may.

### Style

- **Em dashes and connector colons.** Use periods or commas. Colons are fine before a list or example, not as mid-sentence connectors.
- **Bold overuse and inline-header lists.** A bold label that restates its line ("**Performance:** Performance improved…") becomes prose. A bold lead-in that ends in a period and is followed by genuinely new detail is fine.
- **Title Case headings, decorative emoji, curly quotes.** Use sentence case, no emoji, straight quotes.

### Chat artifacts

- "I hope this helps!", "Let me know if…", "Of course!", "Certainly!", "Great question!", "You're absolutely right!", "Found the smoking gun!". Delete; respond directly.

## Technical writing

Four layers, one question each: what kind of document is this, how do sentences address the reader, how much does each sentence carry, and can any sentence be read two ways.

### Pick the mode first (Diátaxis)

One document, one mode. Two questions pick it: does the content inform action or understanding, and does it serve learning or work? Use the same compass on a whole document or on one sentence.

- **Tutorial** (action, learning). You own the learner's success. Open with what they will build, not what they will "learn". Every step produces a visible result, early and often; say what they should see: the output, the prompt change, the log line. Cut explanation to one clause and a link. Write as "we", in commands: "First, do x. Now, do y."
- **How-to** (action, work). Solve a problem a person has, not an operation the machine can perform. Assume competence; skip teaching, background, and completeness for its own sake, and link those instead. Allow forks: "If you want x, do y." Name it by the task: "How to rotate the signing key", not "Signing key rotation".
- **Reference** (understanding, work). Describe, only describe: no instruction, persuasion, or opinion. Dry, complete, and sure about facts, options, limits, and errors. Mirror the structure of the thing described so code and docs navigate together. Generate from code where possible.
- **Explanation** (understanding, learning). One bounded topic, readable away from the product; each title tolerates an implicit "About…". Anchor on a real "why". Give design decisions, history, constraints, and alternatives. Opinion belongs here and nowhere else.

Do not mix modes: no reference tables inside a tutorial, no hand-holding inside reference, no arguing inside a how-to. Split and link instead.

### Address the reader (Google developer style)

- "You", present tense; "will" only for things that genuinely happen later. Name who does what.
- Write instructions as commands: "Click **Submit**." Never "should be done". No "please" in instructions.
- Condition before instruction: "To delete the document, click **Delete**." Common case first, exceptions after.
- Never "simply", "easy", or "quickly" in a procedure. If it were simple, the reader would not be here.
- Don't pre-announce ("we will soon support…") and don't start consecutive sentences with the same phrase.
- Link text says where the link goes: the page title or a short description. Never "click here". Prefer a sentence of context on the page over a link off it.
- Headings carry the point ("Pick the mode first", not "Modes"), in sentence case. Task headings are bare verb phrases; concept headings are noun phrases. One h1 per page, no skipped levels.
- Numbered lists for sequences, bullets otherwise. Introduce a list with a complete sentence and keep items parallel.
- Code in code font, UI elements in bold. Use serial commas. Drop "etc." and say up front that a list is partial.

### Load one statement at a time (STE)

- One instruction per sentence; one thought per sentence elsewhere. Split instructions past about 20 words and other sentences past about 25.
- Put the warning or condition before the step it guards.
- Keep "the" and "a": "Remove backup file" reads two ways. "Remove the backup file" reads one.
- Give each word one meaning and each action one word, and keep them: "start", not "start" here and "initiate" there.
- Write procedures as direct commands, never narration or passive: "Install the component", not "the component must be installed".
- Avoid "-ing" words where you can.

### Leave no second reading (Global English)

- Keep "only" and "not" next to the word they change: "only fails on growth" and "fails only on growth" say different things.
- Break long noun strings: "the proto import budget check script" → "the script that checks the proto-import budget".
- Make every "it", "they", and "this" point at one obvious thing; repeat the noun when in doubt. Never use "this" or "which" to point at a whole clause.
- Don't drop verbs: "Phase 1 moves the converters and Phase 2 the runtime" leaves Phase 2 without one.
- Keep the small words that show structure, such as "that" in "Ensure that the switch is off".
- Repeat the article in a series when it prevents a misread: "the client and the host" when they are two things.
- Use "both…and", "either…or", and "if…then" when a sentence can group two ways.
- Use periods, not semicolons, in documentation. Replace an em dash with a new sentence.
- Make text in parentheses a full grammatical unit or its own sentence. Never form plurals with "(s)".
- No slashes: write "a, b, or both" instead of "a/b" or "and/or".
- Call each thing by one name everywhere. A doc that says "the gate", "the ratchet", and "the budget check" for one thing teaches three things.
- Skip idioms, colloquialisms, Latin abbreviations, and metaphors.

### Repo specifics

- PR descriptions and commit messages are writing too. Every layer except the mode applies. A PR body is a briefing a reviewer reads in under a minute: link swarm logs, SHA lists, and metric tables rather than pasting them.
- Product UI strings are not documentation; use the product's copy guidelines.
- Write real paths. Make every count or tree claim true at the commit that lands it, and include the command that regenerates it.

### Example

Before:

> Configuration of the proto import ratchet budget script parameters is performed via budget.json. Note that it's important to remember that running with --write, which updates the committed budget to reflect the current count, should only be done when lowering it. If exceeded, CI fails.

After:

> `budget.mjs` reads the committed budget from `budget.json` and counts the files that import protos. If the count exceeds the budget, CI fails. Run `budget.mjs --write` only to lower the budget.

## Completion

The prose is clean when it preserves the source's meaning and evidence, matches its intended voice, passes one final read without the listed patterns, and, for documentation, holds one mode with sentences that parse one way.
