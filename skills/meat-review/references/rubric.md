# Reading rubric

You are preparing a reading view of a code review for a busy human. Agents wrote
most of this code. The human does not need to review style, imports, nil
checks, renames, or formatting: models handle those. They need to review
concepts, algorithm choices, data shapes, boundaries, and architecture.

Your job is to choose what is worth reading, say why, and draw the shape of
the change. The renderer draws the lines you keep from the real files in git,
so never paraphrase code; point at it by line range.

The diff below is the review. When a judgment depends on code outside it (a
setting, a caller, a definition), read that code before you claim it is
missing or wrong; if you could not check, say so instead of asserting it.

Every patch line carries its file line numbers in a gutter:
`  old   new | <diff line>`. Take `start`, `end` and folds straight from the
gutter: `new` for added and context lines, `old` for removed lines. A blank
column means the line does not exist on that side.

This file is the single rubric for meat-review: `meat_review.py prompt` and
kvim's `bin/review reading prompt` both embed it. Edit it to tune what gets
kept. The principles are adapted from meat's rubric
(https://github.com/boldsoftware/meat, Apache-2.0, see `meat-LICENSE`),
rewritten for a keep/fold format.

## Essence first

The reader should understand the change from the summary and the first file
alone, and every kept line must earn its place.

- `summary`: one sentence for what changed and why, one for the thing to
  check. Name what you dropped wholesale ("plus 40 renamed call sites and a
  regenerated schema").
- For each kept range, ask what behavior or decision this line shows. If the
  answer is "context" or "for completeness", drop or fold it.
- A note says why it matters or what could go wrong, never what the code
  says. "Rounds half up now, so .5-cent amounts move" beats "Calls
  amount_as_cents with currency".
- `check` reports how many changed lines stay visible. Above about 45% on a
  change of 40+ lines it reports high pressure: make one more pass over
  repeated edits, setup and tables, keeping every distinct contract,
  condition, effect, stimulus and outcome.
- Files marked `looks generated` in their header are `generated` unless the
  diff shows a hand edit; the prompt also lists detected exact moves.

## Principles

1. Keep lines where everything matters: a changed argument, a new condition,
   a different function called, a changed return path, anything that alters
   behavior or data flow.
2. Collapse mechanical repetition. Keep the line that names the operation and
   fold the repeated members, calls, cases or setup. For the same edit at many
   call sites, keep one representative site and say "same change at N sites"
   in its note.
3. Trust error messages. Keep the control flow and the fact that a branch
   errors, logs or raises; fold the message construction.
4. Drop changes that are obvious, forced and behavior-neutral: a zero value
   added because a new return value appeared, formatting, renames already
   explained elsewhere.
5. Drop generated code, lockfiles, snapshots and build output entirely
   (`generated`), and mention regeneration in the summary.
6. Imports are hidden automatically when a reading is drawn (the reader can
   show them), so never keep a range only for imports. Dependency manifests
   (package.json, pyproject.toml, go.mod) are not imports: keep a new or
   upgraded dependency there.
7. Treat moves symmetrically. If code moved, keep or fold both sides the
   same way, or keep one side and say "moved from X" in the note.
8. Always keep security and trust boundaries even when small: auth,
   permissions, input validation, secrets, shell or network calls, file
   writes, data sent elsewhere. Keep deletions of behavior (a removed check,
   fallback or branch).
9. Reason across the whole change: a line that looks like noise in one file
   is often explained by a change in another. If unsure whether something
   matters, keep it.

## Keep ranges and folds

- A `keep` range is what the reader sees; everything else is skipped.
  Prefer one range around a function to several tiny ones, then `fold` the
  boring interior: `fold` hides a run of at least two lines inside the range
  as `⋯ N lines`, so the reader sees the shape (signature, the changed
  lines, the return) without the bulk.
- Folds use the range's side and must lie inside it. Never fold the changed
  line the note is about.
- Default diff context is not valuable. Start a range at the first line that
  orients the reader (the `def`, the `if`), not three lines above it.

Example: a 30-line handler where only the guard and the return changed:

```json
{ "side": "new", "start": 40, "end": 69, "note": "Rejects expired tokens before refresh",
  "fold": [{ "start": 43, "end": 55 }, { "start": 58, "end": 66 }] }
```

## Worked examples

Parametrized table and its test:

```
   220 | +CASES = [
   221 | +    ("empty", "", None),
   222 | +    ("simple", "a", "a"),
   223 | +    ("escaped", "a\\nb", "a\nb"),
   224 | +    ("unicode", "π", "π"),
   225 | +]
   227 | +@pytest.mark.parametrize("name, raw, expected", CASES)
   228 | +def test_parse(name, raw, expected):
   229 | +    assert parse(raw) == expected
```

Keep 220-229 and fold 222-224: the table's opener, one distinctive row, its
closer, the decorator and the assertion stay; the repetitive middle folds.
Never drop the table while keeping a test that reads it.

Multiline call: keep the opener and the closer, keep any argument whose
value is the behavior, fold the routine middle arguments. Never leave a
call without its closer.

A test collapsed for reading still looks like code: keep the signature, the
stimulus and the assertion; fold setup.

An error branch: keep the condition and the raise or return; fold a
multi-line message build.

An exact move the prompt reports (`-601..603 ↔ +711..713`): keep both sides,
fold both, or keep the new side with "moved from X" in the note. Never show
one side as a plain deletion or addition.

## Python: keep the skeleton

For Python, keep the smallest connected path that shows:

1. Contract: the changed function, method, fixture, class, decorator or
   option.
2. The condition that decides when behavior applies: guards, exception
   boundaries, precedence, async or lifecycle points.
3. The transformation: the non-obvious computation, lookup, mutation or
   dispatch.
4. The observable effect: return, yield, raise, emitted response, state
   mutation, external call.
5. In tests: the scenario, the distinctive input and the expected result.

Fold everything else around those anchors. Decorators stay with the
definition they govern; keep decorators whose arguments define behavior
(routes, pytest marks and parameters, fixture scope). Keep both the opener
and the closer of a multiline call, signature or literal and fold the
middle. Keep parametrize values that define cases; fold repetitive middle
cases. Keep `async`/`await` boundaries and exception types.

## Kinds

Classify every file in the review exactly once:

- `core`: the behavior change a reviewer must understand.
- `supporting`: wiring or plumbing needed by core changes.
- `tests`: tests for the change.
- `config`: settings, build, CI, or dependency manifests.
- `docs`: prose only.
- `mechanical`: renames, moves, formatting, fan-out (nothing to keep).
- `generated`: lockfiles, snapshots, generated code.

## Output

Reply with only one JSON object, no prose:

```json
{
  "summary": "One sentence: what this change does and the one thing to check.",
  "outline": [
    { "title": "Shape of the change", "kind": "mermaid", "body": "flowchart LR\n  A[client] -->|refresh| B[session]" },
    { "title": "Files", "kind": "markdown", "body": "src/auth/\n├── session.ts  # owns refresh\n└── store.ts    # persists tokens" }
  ],
  "files": [
    {
      "path": "src/auth/session.ts",
      "kind": "core",
      "reason": "Refreshes tokens 60s before expiry",
      "keep": [
        { "side": "new", "start": 40, "end": 58, "note": "Refresh window and retry policy",
          "fold": [{ "start": 45, "end": 52 }] }
      ]
    }
  ],
  "findings": [
    { "id": "refresh-race", "file": "src/auth/session.ts", "side": "new", "line": 47,
      "severity": "risk", "area": "bug", "text": "Two tabs can refresh at once; the second overwrites the first token." }
  ],
  "tests": [
    { "file": "src/auth/session.test.ts", "line": 88, "name": "refreshes before expiry",
      "proves": "token renewed 60s early", "verdict": "real",
      "why": "Uses the real clock seam and asserts the new token." },
    { "file": "src/auth/session.test.ts", "line": 120, "name": "handles refresh failure",
      "proves": "nothing about the retry", "verdict": "fake",
      "why": "Patches refresh() itself, then asserts the patched value." }
  ]
}
```

- `outline`: one to three views, smallest that shows the shape. Use a
  Mermaid flowchart or sequenceDiagram for interaction, a `tree` card for a
  changed call path, a markdown text tree for responsibilities, pseudocode
  for logic, a before/after `diff` block for a changed flow. Mermaid supports
  flowchart, sequenceDiagram, stateDiagram, classDiagram and erDiagram; keep
  flowcharts to about eight nodes so they fit a terminal.
- `tree` cards: one node per line, two spaces per level, an optional marker
  in column 0 (`+` added, `-` removed, `~` changed, `!` fails, `?` not
  verified), then `label @path:line # note`. Give every node a real
  `@path:line` from the review so the reader can jump to it:

  ```text
    submitForm @routes/submit.ts:12
  ~   createSession @sessions/create.ts:8 # returns a handle now
  -     persistPrompt @sessions/persist.ts:4
  +     queuePrompt @sessions/queue.ts:9
  ```

  The renderer already adds the calldiff call tree for core and supporting files,
  so draw a tree only for a path calldiff cannot see (dynamic dispatch,
  events, queues) or to tell the story in fewer nodes.
- `reason`: at most one short line, the why, not the what.
- `keep`: line ranges in the new file (`side: "new"`), or in the old file
  for removed code (`side: "old"`), taken from the diff's hunk headers.
  Fold the interior of long ranges rather than splitting them into many
  small ones; after folds, a range should show under about 30 lines. Order
  ranges in the order a reader should see them.
- Put files in reading order: the file that explains the change first.
- `findings` (optional): concrete risks, questions or notes a reviewer should
  act on, each on one real line (`line`, optional `endLine`, `side` as for
  `keep`). `severity` is `risk`, `question` or `note`; `area` is `bug`,
  `quality`, `structure` or `tests`, so the reviewer's taste rules (the Taste
  section after this rubric) land as `quality`/`structure` findings. State the
  trigger and the consequence; leave findings out rather than restate what the
  code does.
- `tests`: one entry per test case the change adds or changes, in file order:
  `file`, `line` of the test's definition (new side), `name`, `proves` (what
  it establishes, under ten words), `verdict` (`real`, `weak` or `fake`, as
  the Taste section defines) and `why` (one line). Judge each one from the
  code it exercises: read the fixtures, mocks and the function under test,
  and ask whether the assertion would fail if the change were reverted. A
  `weak` or `fake` test that matters also gets a `tests` finding.
