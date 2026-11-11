# Visual PR descriptions

Every new PR and every description refresh includes a visual explanation of the change, regardless of language or change type. Follow the steps below when PR work is authorized. Selecting this workflow does not itself authorize committing, pushing, or publishing.

## 1. Establish the comparison

Inspect the current branch, working tree, intended target branch, and branch commits. Look for an existing PR before creating another. With GitHub, `gh pr view --json url,number,title,state,baseRefName,headRefName` supplies the current PR identity and comparison branches.

Read the complete base-to-head diff, the repository's PR template, relevant issue or plan, and surrounding implementation needed to explain behavior. Separate unpublished working-tree changes from the published comparison. Commit and push only task-related changes under the user's authorization and repository rules. Ask which PR to use only when neither an existing branch PR nor the requested work identifies a safe target.

Proceed when the PR's identity, comparison, purpose, and changed responsibilities are known.

### Reading-diff coverage

The complete base-to-head diff is authoritative. Use the smallest visual that answers the review question, but do not let a condensed view replace source inspection:

- For a small, low-noise PR, a focused source diff may be the visual. Still inspect the complete diff and state any intentionally omitted paths or hunks.
- For a substantial or noisy PR, combine a structural outline (file tree, responsibility view, or call/flow view) with a reading from [meat-review](../../meat-review/SKILL.md) of the PR's `base...head`: you choose the ranges and folds, and its script draws them from git. Keep the reading JSON and the rendered page as review evidence.
- A reading is an aid, never the source of truth: it hides imports and folds detail. Inspect the complete diff explicitly for meaningful import/dependency, authentication/authorization, secrets, or other security changes, and show those changes in the structural or source view even when the reading omits them.
- Mark every material omission: omitted files or hunks, unavailable commands/provider, denied data sharing, and any unverified explanation. The reviewer should be able to distinguish “not shown” from “not changed.”

### Present selected evidence, not a raw patch

Keep the complete reading as a separate review artifact. In the PR body, select one to three short excerpts that explain distinct behavior or design decisions; target 10–25 lines per excerpt and at most 60 code lines total. These are presentation limits, not quotas for deleting meaningful code. When a coherent excerpt exceeds them, link to the source or artifact instead. A collapsed block is not a substitute for editing down the reading burden.

For each excerpt, put a behavior-focused heading, a linked file/symbol at the compared revision, and one sentence explaining what the reviewer should notice above the code. Use `diff` for meaningful old/new comparisons and a language-tagged block for entirely new code. Omit Git transport metadata (`diff --git`, `index`, `---`, `+++`, and `@@`) from these explicitly labeled excerpts; file links provide navigation. Move CLI summaries and retention counts out of code blocks and into the artifact description, not the main explanation.

Render each excerpt with `meat_review.py render --md --only <range id>` and preserve its source lines and `⋯` fold markers. Separate noncontiguous excerpts rather than silently stitching them together; label them as selected, abridged evidence and link to the full comparison. Choose excerpts whose important expressions fit GitHub's normal content width. If a long line is essential, link to it and explain it with separately labeled pseudocode rather than rewriting source and presenting it as an exact excerpt.

Avoid repeating the structural outline in code form unless the excerpt adds a concrete implementation decision. Link the complete reading diff only when an accessible artifact exists; otherwise report its local path as local, not as a reviewer-accessible link. Recompute after the compared commits change, and verify retained excerpts against that exact full diff.

Check the rendered PR for a readable heading-to-explanation-to-excerpt sequence, bounded code blocks, and no horizontal scrolling needed to understand the key change. If the rendered view cannot be inspected, keep excerpts conservatively short and report that visual check as unverified.

## 2. Build the reviewer view

Read [visual forms](visual-forms.md). Default to fenced diffs, text trees, pseudocode, schemas, and type blocks: these remain readable directly on GitHub without a diagram renderer. Select views by the actual change, not a fixed checklist:

| Change | Useful view | Include |
| --- | --- | --- |
| Persistence or API | Schema or request/response sketch | Important columns, relationships, endpoint inputs and outputs |
| Domain representation | Type or data-shape block | Fields and invariants that explain the implementation |
| Decision logic | Pseudocode | Changed branches, ordering, and effects |
| Responsibility movement | Shallow directory tree | What each relevant module owns |
| UI composition | Component tree | Important hooks, state owners, shared-package boundaries |
| Execution | Call tree, or a numbered sequence | Relevant calls, control flow, data movement, and external boundaries |
| Status or lifecycle | Transition table | Each state, the moves out of it, and which code makes each move |
| Documentation or configuration | Structure or decision-flow sketch | Where instructions or settings live and how their behavior changes |

Show old-to-new differences when most of the structure stays intact. Show the complete resulting structure when it is predominantly new or removing context would obscure ownership or sequence. For example:

```diff
 acceptUpload
-  storeBlob
+  validateMediaType
+  enforceSizeLimit
+  storeBlob
   publishReceipt
```

For a new subsystem, a responsibility view can be clearer:

```text
imports/
├── decode.ts    # converts bytes into candidate records
├── validate.ts  # checks record contracts
└── apply.ts     # writes accepted records in one transaction
```

Examples illustrate notation, not facts to reuse. Ground every actual node, path, and relationship in inspected evidence. Label pseudocode and uncertainty. Keep prose beside the visual it explains. Order views to teach the change: establish the contract or data model before the flow when the flow depends on it.

### No diagram languages

GitHub runs no script in a PR body, so every view is text. Trees, pseudocode, types, and diffs go in code fences with lines under 80 characters; a sequence is a numbered markdown list and a transition table is a markdown table, per [visual forms](visual-forms.md). Do not use Mermaid or any other diagram language. When a flow needs a picture, embed a viz image beside the text view (see [Images](#images)). For decision logic, the text tree plus the image is the view: leave out the code excerpt that repeats it.

### Images

Images sit beside the text views and never replace them. Pick them by what the PR does, one image per question a reviewer asks. A PR that does several of these gets the image for each part, and a PR that does none gets no image.

| The PR changes | Image | Built with |
|---|---|---|
| Tables or fields | schema-diff card, then a data-model graph | `pr_cards.py schema`; `== graph` with `view: states` |
| A type, payload, or config shape | type card, JSON example from the real factory or fixture, flow card from field to the column or call that uses it | `pr_cards.py card` |
| An API endpoint | request and response card from a real test fixture; a `view: seq` when it calls other services | `pr_cards.py card`; `== graph` |
| Decision logic | decision tree | `== graph` with `view: states` |
| How work moves between components or queues | flow, or sequence when the order and waits are the point | `== graph` with `view: flow` or `view: seq` |
| A status field or job lifecycle | state machine | `== graph` with `view: states` |
| A call tree (refactor, extracted function) | call diff | `viz.py calldiff <base> HEAD`, then `== diff` |
| Latency | where the time goes, old run under new | `== gantt` with `was`; `== hist` with `was:` for the tail |
| Concurrency, a race, or locking | overlap of the workers; who waits on whom | `== timing`; `== waits` |
| Retry or backoff policy | attempts over time to the give-up point | `== retries` |
| A traffic split, rollout, or funnel | volume by path | `== graph` with `view: sankey` |
| Queue depth, lag, or a pool | the quantity over time against its limits | `== stock` |
| A backfill or sharded job | shards by stage | `== board` |
| An incident fix | causes ruled in and out | `== causes` |
| Docs, copy, or a dependency bump | none | |

[viz](../../viz/SKILL.md) says what each view shows. The schema and type cards go where [the body template](pr-description-template.md) puts them; every other image goes under What changes, beside the text view it draws.

Every image follows these rules. The build scripts below enforce the ones marked *checked*.

- **One style, light, static.** Every card uses [`pr-cards.css`](../assets/pr-cards.css) and nothing else (*checked*: a card with `<script>`, `<style>`, `style=`, `<link>` or a remote URL fails). Graphs use viz's paper theme.
- **The picture only.** No title bar, tabs, "full size" button, "how to read it" or "hover a box" footer, story list, or inspector (*checked*: the build fails when the image's text carries any of them). A screenshot of a viz page is not a PR image.
- **Green means added on the PR's base branch.** Marks compare the head with `baseRefName` (usually `master`), never with an earlier round of this PR. The schema card computes its marks from the base and head field lists, so you never mark a row by hand (*checked*: `base_ref` is required and printed in the legend).
- **Every fact on an image comes from the code.** Read the base fields with `git show <base>:<model file>` and the head fields at the head SHA. Build a JSON example from a dump of the real factory, such as `build_rule_spec().model_dump(mode="json")` run in the repository's shell, and say which factory in the caption. A card fills `<pre data-json="dump.json">` from that file, so the JSON is never retyped. Check each note against a migration or a line of code.

Build each image into the task-artifact folder, then look at every PNG before using it:

- **Schema diff:** `python3 <show-me>/scripts/pr_cards.py schema schema.json -o schema-diff.png`. The script's docstring shows the `schema.json` format: per table, `base` and `head` fields, a `null` side for a new or deleted table, and optional `notes`.
- **Type card, JSON example, flow card:** write an HTML fragment with the classes in `pr-cards.css` (`.card .t .l .i1 .ty .tag` for a type tree, `table.flow` for field-to-column rows), then run `python3 <show-me>/scripts/pr_cards.py card type.html -o type.png`.
- **Every viz image:** write one section (a `== graph`, `== diff`, or chart) to a `.viz` file, then run `python3 <viz>/scripts/viz.py png <name>.viz -o <name>.png`. It drops any title, sets the paper theme, and crops to the drawing. Every number on a chart comes from a trace, log, query, or the code, like any other fact. For a data-model graph, use `view: states` (labelled edges, no hop numbers) and `# note` lines on boxes. For a decision tree, give each branch its own result box and keep labels to yes or no.

`<show-me>` and `<viz>` are those skills' directories. Both scripts drive the local Chrome over its debugging port with Node 22 or later, and need no npm packages.

Publishing attaches the images. Do it yourself and never ask the user to drag an image in. Reference each image as `![<caption>](./<name>.png)` in the body file, then from that folder run `gh pr edit <n> -R <owner/repo> --body-file <body> --attach "./<name>.png#<caption>"`, with one `--attach` per image. The same flag works on `gh pr create`. `gh` uploads each file and rewrites its reference to a `github.com/user-attachments` URL. Never link an image from a CDN or an HTML page.

For complex visual UI changes, a focused HTML comparison may supplement the PR. Match the actual product, use representative labels and data, and cover desktop and mobile. The PR body still needs a readable structural outline; a local HTML path alone is insufficient.

## 3. Assemble the description

Read [the body template](pr-description-template.md) and fill its relevant sections. Preserve repository-required headings, checklists, and useful existing author content; map the template's information into that structure instead of duplicating it.

Follow the template's shape and order: Why, Reviewers, Risk, What changes, a sub-section per type, Checks, then the footer. Omit a section's parts that do not apply, such as the schema and type images for a PR that changes neither, but keep the headings in that order. Use plain language and only real issue, plan, or artifact links. Link code at the head SHA, never a branch name.

Reviewers takes at most four bullets, one point per bullet: where to start reading, how a migration runs, an assumption the change depends on, a gap left on purpose. Write `None.` when there is nothing to flag.

Risk holds two lists. **Door** says whether a revert undoes the merge. A two-way door is undone by a revert. A one-way door is not, so list each irreversible operation as its own bullet, such as a dropped constraint, a dropped table, deleted or rewritten data, a published API, or a sent message. **Blast radius** names what breaks if the change is wrong, one item per bullet: the app that changes, each cross-app import by symbol, and who reads the changed tables or endpoints. Use [blast-radius](../../blast-radius/SKILL.md) when the diff does not answer it.

Checks lists only commands that ran, exactly as run, with their results, then what is not verified yet. Where a change has observable behavior, show the same check on the base and on this branch. Images and trees explain the change. They are not evidence that it works.

End the body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`, then any tool-maintained block below it. Commits end with `Co-Authored-By: Claude <noreply@anthropic.com>`.

## 4. Save, publish, and confirm

Save the body as `pr-description.md` in the existing task-artifact directory, or a temporary Markdown file when none exists. Inspect the saved content. Use the host's PR tools to create or update the intended PR; GitHub accepts `gh pr create --body-file <path>` and `gh pr edit <number> --body-file <path>`. Follow repository requirements for base, title, and draft state.

`--body-file` replaces the whole body. Before a refresh, copy any block a tool maintains, such as the Git Town stack list that starts at `<!-- branch-stack -->`, from the live body (`gh pr view <n> --json body -q .body`) to the end of the new body, after the footer, so it survives.

Read the published body back. Confirm the comparison is correct, the structural view, required sections, footer, stack block and every attached image survived (each image reference is a `github.com/user-attachments` URL), and verification claims match the checks. If publishing is blocked, retain the prepared description and report the exact blocker. Never report a draft file as a successfully published PR.

## 5. Hand back the result

Return these compact groups:

- **Status:** linked PR number and title, saved description path (or a real accessible permalink), and issue link when known.
- **Summary:** two or three sentences covering the outcome and important implementation choices.
- **Changed files:** relevant paths with short responsibility or behavior changes.
- **Next step:** publication confirmation, remaining reviewer action, or the blocker.

Use only links that actually exist. Completion requires a saved body, confirmed publication or an explicit blocker, and an accessible result for the user.
