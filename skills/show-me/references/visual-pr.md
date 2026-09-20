# Visual PR descriptions

Every new PR and every description refresh includes a visual explanation of the change, regardless of language or change type. Follow the steps below when PR work is authorized. Selecting this workflow does not itself authorize committing, pushing, or publishing.

## 1. Establish the comparison

Inspect the current branch, working tree, intended target branch, and branch commits. Look for an existing PR before creating another. With GitHub, `gh pr view --json url,number,title,state,baseRefName,headRefName` supplies the current PR identity and comparison branches.

Read the complete base-to-head diff, the repository's PR template, relevant issue or plan, and surrounding implementation needed to explain behavior. Separate unpublished working-tree changes from the published comparison. Commit and push only task-related changes under the user's authorization and repository rules. Ask which PR to use only when neither an existing branch PR nor the requested work identifies a safe target.

Proceed when the PR's identity, comparison, purpose, and changed responsibilities are known.

## 2. Build the reviewer view

Read [visual forms](visual-forms.md). Default to fenced diffs, text trees, pseudocode, schemas, and type blocks: these remain readable directly on GitHub without a diagram renderer. Select views by the actual change, not a fixed checklist:

| Change | Useful view | Include |
| --- | --- | --- |
| Persistence or API | Schema or request/response sketch | Important columns, relationships, endpoint inputs and outputs |
| Domain representation | Type or data-shape block | Fields and invariants that explain the implementation |
| Decision logic | Pseudocode | Changed branches, ordering, and effects |
| Responsibility movement | Shallow directory tree | What each relevant module owns |
| UI composition | Component tree | Important hooks, state owners, shared-package boundaries |
| Execution | Call tree or sequence | Relevant calls, control flow, data movement, and external boundaries |
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

### Mermaid exception

Use Mermaid only when it clarifies relationships that the default formats cannot show clearly and its rendering can be verified on GitHub. Otherwise use a text sequence, tree, or diff.

- Use a fenced `mermaid` block with conservative syntax supported by GitHub. Keep participant or node identifiers simple and distinct from display labels.
- In sequence diagrams, put each declaration or message on its own line. Use commas or short separate messages instead of raw semicolons in message labels: semicolons can terminate a statement. For example, use `Config->>Cache: Stream bytes, verify checksum`, not a semicolon between the clauses.
- Quote flowchart display labels containing punctuation; follow the selected diagram type's escaping rules rather than assuming prose is safe syntax.
- Render-check locally when a compatible validator is available, then inspect the actual rendered PR body on GitHub. A local parser, Markdown source readback, or API response alone does not prove GitHub rendering.
- Verify every diagram displays its expected nodes and relationships, readable labels, and no parse-error panel. If GitHub rendering is inaccessible or a diagram cannot be repaired and verified, replace it with a fenced text or diff view before declaring the description complete.

For complex visual UI changes, a focused HTML comparison may supplement the PR. Match the actual product, use representative labels and data, and cover desktop and mobile. The PR body still needs a readable structural outline; a local HTML path alone is insufficient.

## 3. Assemble the description

Read [the body template](pr-description-template.md) and fill its relevant sections. Preserve repository-required headings, checklists, and useful existing author content; map the template's information into that structure instead of duplicating it.

The purpose is exactly one sentence. Reviewer caveats use one to three bullets, or `None.` when there are none. The outline contains at least one structural visual; a filename inventory alone is insufficient. Omit irrelevant visual categories and avoid a prose changelog alongside an equivalent diagram. Use plain language and include only real issue, plan, or artifact links.

Record checks that actually ran, their results, and relevant missing checks. Visual explanation is not evidence that the implementation works. Keep the description limited to the template and repository-required information.

## 4. Save, publish, and confirm

Save the body as `pr-description.md` in the existing task-artifact directory, or a temporary Markdown file when none exists. Inspect the saved content. Use the host's PR tools to create or update the intended PR; GitHub accepts `gh pr create --body-file <path>` and `gh pr edit <number> --body-file <path>`. Follow repository requirements for base, title, and draft state.

Read the published body back. Confirm the comparison is correct, the structural view and required sections survived, and verification claims match the checks. For Mermaid, also open the PR on GitHub and inspect every rendered diagram under the Mermaid exception above; repair or replace broken diagrams, publish again, and repeat verification. If publishing is blocked, retain the prepared description and report the exact blocker. Never report a draft file as a successfully published PR.

## 5. Hand back the result

Return these compact groups:

- **Status:** linked PR number and title, saved description path (or a real accessible permalink), and issue link when known.
- **Summary:** two or three sentences covering the outcome and important implementation choices.
- **Changed files:** relevant paths with short responsibility or behavior changes.
- **Next step:** publication confirmation, remaining reviewer action, or the blocker.

Use only links that actually exist. Completion requires a saved body, confirmed publication or an explicit blocker, and an accessible result for the user.
