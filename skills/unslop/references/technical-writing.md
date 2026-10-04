# Technical writing

Four layers, one question each: what kind of document is this, how do sentences address the reader, how much does each sentence carry, and can any sentence be read two ways.

## Pick the mode first

One document, one mode. Does the content inform action or understanding, and does it serve learning or work?

- **Tutorial** (action, learning). You own the learner's success. Open with what they will build. Every step produces a visible result; say what they should see. Cut explanation to a clause and a link. Write as "we", in commands.
- **How-to** (action, work). Solve a problem a person has. Assume competence, skip teaching and background, allow forks ("If you want x, do y"). Name it by the task: "How to rotate the signing key".
- **Reference** (understanding, work). Describe, only describe. Dry, complete, sure. Mirror the structure of the thing described; generate from code where possible.
- **Explanation** (understanding, learning). One bounded topic anchored on a real "why". Give design decisions, history, constraints, alternatives. Opinion belongs here and nowhere else.

Do not mix modes. Split and link instead.

## Address the reader

- "You", present tense. Name who does what. Write instructions as commands; never "should be done".
- Condition before instruction: "To delete the document, click Delete." Common case first.
- Never "simply", "easy", or "quickly" in a procedure. No pre-announcing.
- Link text says where the link goes. Never "click here".
- Headings carry the point ("Pick the mode first", not "Modes"), sentence case, no skipped levels. Task headings are verb phrases.
- Numbered lists for sequences, bullets otherwise. Introduce lists with a full sentence; keep items parallel. Code in code font.

## Load one statement at a time

- One instruction per sentence; one thought per sentence elsewhere. Split instructions past about 20 words and other sentences past about 25.
- Warnings before the step they guard.
- Keep "the" and "a": "Remove backup file" reads two ways.
- One word per action and one meaning per word, kept throughout.

## Leave no second reading

- Keep "only" and "not" beside the word they change.
- Break long noun strings: "the proto import budget check script" → "the script that checks the proto-import budget".
- Every "it", "they", and "this" points at one obvious thing; repeat the noun when in doubt.
- Do not drop verbs in parallel clauses. Keep the small words ("that") that make a sentence parse one way.
- Use "both…and", "either…or" when a grouping is ambiguous. No slashes, no "(s)" plurals, no Latin abbreviations or idioms.
- Call each thing by one name everywhere.

## Example

Before:

> Configuration of the proto import ratchet budget script parameters is performed via budget.json. Note that it's important to remember that running with --write, which updates the committed budget to reflect the current count, should only be done when lowering it. If exceeded, CI fails.

After:

> `budget.mjs` reads the committed budget from `budget.json` and counts the files that import protos. If the count exceeds the budget, CI fails. Run `budget.mjs --write` only to lower the budget.
