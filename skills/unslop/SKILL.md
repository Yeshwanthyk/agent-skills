---
name: unslop
description: 'Write or clean padded or AI-sounding prose so a tired engineer gets it on first read: docs, PR bodies, commits, reports, skill text. On request ("bro"), plain talk for later replies.'
disable-model-invocation: true
---

# Unslop

Make writing sound like an engineer talking to a colleague, and make it land on the first read without flattening its voice. This is a prose pass. It does not replace testing or review.

Three rules sit above everything else:

- **Cut every word that does no work.** "In order to" is "to". "It is important to note that" is nothing.
- **Use the short, everyday word**, and the codebase's own names: the real symbol, file, flag, or command, not a synonym or a description of it. Say "move", "delete", "a budget that only decreases", the words a developer says out loud. A named pattern is fine when the text says what it means the first time.
- **When a rule makes a sentence worse, fix it another way or leave it alone.** A sentence that follows every rule and still sounds machine-written has failed.

## Plain mode (explicit request)

When the user asks for plain talk for the rest of the conversation ("bro", "talk plain"), write every later reply like a colleague at the next desk until they end it:

- Lead with the answer, then the reason, then the next step.
- Short active sentences in full grammar. Plain is not terse: keep the articles and the verbs.
- Lists for sequences. A one-line definition for any technical term that must stay.
- Apply the [slop patterns](#slop-patterns) to every reply. Apply [technical writing](#technical-writing) only when a reply is itself a document.

Keep facts, conditions, warnings, and voice. Earlier messages stay as they are unless the user asks for a rewrite. A request to write or clean one text is a one-shot pass through the Process and leaves plain mode off.

## Process

1. **Clean.** Scan for the [slop patterns](#slop-patterns) and rewrite. Keep meaning, facts, conditions, warnings, and voice. Code blocks, commands, paths, flags, and quoted errors are payload: carry them over character for character.
2. **Structure, for documentation.** When writing or restructuring a doc, RFC, README, PR description, or commit message, also apply [technical writing](#technical-writing). PR bodies and commits skip the mode step.
3. **Vary the rhythm.** Short sentences land a point. Longer ones carry a fact with its condition or consequence. Split a sentence that carries two thoughts; keep a long one that carries one. Have a view where the mode allows it: say what you make of a trade-off instead of listing pros and cons.
4. **Read once more.** Check that every not, never, no, and only survived, that every count or tree claim is true, and that any evidence gap is stated directly. Leave sentences whose content did not change alone.

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
- **Synonym cycling.** One name per thing, every time. A doc that says "the gate", "the ratchet", and "the budget check" for one script teaches three things. Same for actions: "start" everywhere, not "start" here and "initiate" there.
- **False ranges.** "from X to Y" where X and Y share no scale. List the items.
- **Fancy words.** utilize → use, leverage → use, facilitate → help, perform → do, numerous → many, in the event that → if. A long word has to buy its length with precision.
- **Adverb props.** "runs quickly" → the number. "significantly improves" → the measured delta. An adverb propping up a verb means the verb is wrong.
- **Passive voice** that hides the actor. "queries are validated" → "the compiler validates queries". Fine when the actor is unknown or irrelevant.

### Jargon and mannered prose

- **Abstract metaphor nouns.** substrate, wedge, vector, locus, vantage, nexus, modality, primitive (noun), harness (metaphor), surface (as in "API surface"), bedrock, scaffolding (metaphor), paradigm, gold-plating, ratchet (metaphor), evacuate (moving code), endgame, north star, flywheel. Use the concrete word: base, add, way, more than the job needs, a limit that only tightens, move out, the last phase.
- **Flourish.** Aphorisms ("wire it or delete it"), rhetorical fragments, personified code ("the plan holds it"), figurative verbs ("rides along", "stands on"), tidy closers ("the rest follows"). Say the literal thing: "a dial worth turning" → "a parameter worth varying".
- **Framing labels.** "the key insight", "at its core", "TL;DR", "here's where it gets interesting". Just say it.

### Density

- **Over-dense sentences.** If a reader must backtrack, split it. Check any instruction past about 20 words and any other sentence past about 25.
- **Over-compression.** Dropped articles, verbless fragments, arrows, symbol-speak, invented abbreviations. "Parser rejects bad date → exit 2, no write" → "The parser rejects a bad date, exits with code 2, and writes nothing." "Remove backup file" reads two ways; "Remove the backup file" reads one.
- **Filler and hedging.** "due to the fact that" → because. "could potentially possibly be argued that it might" → may.

### Style

- **Em dashes, semicolons, and connector colons** in documentation. Use periods or commas. Colons are fine before a list or example.
- **Bold overuse and inline-header lists.** A bold label that restates its line ("**Performance:** Performance improved…") becomes prose. A bold lead-in followed by genuinely new detail is fine.
- **Title Case headings, decorative emoji, curly quotes.** Use sentence case, no emoji, straight quotes.

### Chat artifacts

- Openers that announce ("Sure!", "Great question!", "Let me…", "I'll now…"), closers that recap or offer ("I hope this helps!", "Let me know if…"), and performed agreement or discovery ("You're absolutely right!", "Found the smoking gun!"). Delete them and start with the answer.

## Technical writing

Four layers, one question each: what kind of document is this, how do sentences address the reader, can any sentence be read two ways, and what does this repo add.

### Pick the mode first (Diátaxis)

One document, one mode. Two questions pick it: does the content inform action or understanding, and does it serve learning or work?

- **Tutorial** (action, learning). You own the learner's success. Open with what they will build. Every step produces a visible result; say what they should see: the output, the prompt change, the log line. Cut explanation to one clause and a link. Write as "we", in commands: "First, do x. Now, do y."
- **How-to** (action, work). Solve a problem a person has, not an operation the machine can perform. Assume competence and link background instead of teaching it. Allow forks: "If you want x, do y." Name it by the task: "How to rotate the signing key", not "Signing key rotation".
- **Reference** (understanding, work). Describe only: facts, options, limits, and errors, dry and complete. Mirror the structure of the thing described so code and docs navigate together. Generate from code where possible.
- **Explanation** (understanding, learning). One bounded topic; each title tolerates an implicit "About…". Anchor on a real "why": design decisions, history, constraints, alternatives. Opinion belongs here and nowhere else.

Keep each mode pure: split and link rather than put a reference table in a tutorial or an argument in a how-to.

### Address the reader (Google developer style)

- "You", present tense; "will" only for things that happen later. Name who does what.
- Instructions are commands: "Click **Submit**." No "please", no "should be done".
- Condition before instruction: "To delete the document, click **Delete**." Common case first, exceptions after.
- Leave out "simply", "easy", and "quickly" in a procedure. If it were simple, the reader would not be here.
- Describe what exists now, not what is coming. Vary how consecutive sentences start.
- Link text names the destination. Prefer a sentence of context on the page over a link off it.
- Headings carry the point ("Pick the mode first", not "Modes"), in sentence case. Task headings are verb phrases; concept headings are noun phrases. One h1 per page, no skipped levels.
- Numbered lists for sequences, bullets otherwise. Introduce a list with a full sentence and keep items parallel.
- Code in code font, UI elements in bold, serial commas. Say up front that a list is partial instead of ending it with "etc.".

### Leave no second reading (Global English)

- Keep "only" and "not" next to the word they change: "only fails on growth" and "fails only on growth" say different things.
- Break long noun strings: "the proto import budget check script" → "the script that checks the proto-import budget".
- Make every "it", "they", and "this" point at one obvious thing; repeat the noun when in doubt. "This" and "which" point at a noun, not a whole clause.
- Give every clause its verb: "Phase 1 moves the converters and Phase 2 the runtime" leaves Phase 2 without one.
- Keep the small words that show structure: "that" in "Ensure that the switch is off", the second article in "the client and the host".
- Use "both…and", "either…or", and "if…then" when a sentence can group two ways.
- Parenthetical text is a full grammatical unit or its own sentence. Write "file or files", not "file(s)"; "a, b, or both", not "a/b" or "and/or". Write "for example" and "that is", not "e.g." and "i.e.".

### Repo specifics

- A PR body is a briefing a reviewer reads in under a minute: link swarm logs, SHA lists, and metric tables rather than pasting them.
- Product UI strings follow the product's copy guidelines, not this section.
- A count or tree claim ships with the command that regenerates it.

### Example

Before:

> Configuration of the proto import ratchet budget script parameters is performed via budget.json. Note that it's important to remember that running with --write, which updates the committed budget to reflect the current count, should only be done when lowering it. If exceeded, CI fails.

After:

> `budget.mjs` reads the committed budget from `budget.json` and counts the files that import protos. If the count exceeds the budget, CI fails. Run `budget.mjs --write` only to lower the budget.

## Completion

The prose is clean when it keeps the source's meaning, evidence, and payload; sounds like a person talking; passes one final read without the listed patterns; and, for documentation, holds one mode with sentences that parse one way.
