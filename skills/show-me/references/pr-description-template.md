# PR body template

Fill each section, then delete the bracketed guidance. Where the repository has its own template, map these sections into its headings instead of adding a second set. A worked example of this shape is core-backend #36059.

## Why

[One or two sentences: what this PR does and the outcome it enables. Name the product or system once in full before using its short name.]

**Stack:** [Where this PR sits: what it leaves for the PR stacked on it, and what an earlier PR already did. Name each PR by number. Omit this line for a PR with no stack.]

## Reviewers

[At most four bullets, one point each, in this order when they apply:]

- [Where to start reading: the file or symbol first, then the rest in order.]
- [How a migration runs: concurrent index, `NOT VALID` then `VALIDATE`, a backfill.]
- [An assumption the change depends on, and why it holds today.]
- [A gap left on purpose, and which PR or component covers it.]

## Risk

**Door: [one-way or two-way].**

[For a one-way door, one bullet per operation a revert cannot undo. For a two-way door, write "A revert undoes all of it." and no list.]

- [Migration 0002 drops the `<name>` constraint.]
- [Migration 0005 drops the `<name>` table.]

**Blast radius:**

[One bullet per item. Name the boundary, never a severity word.]

- [Which app or service changes.]
- [Each import that crosses an app boundary, by symbol: `NAME` from `module.path`.]
- [Who reads or writes the changed tables, endpoints, or messages. "No other app reads these tables yet" is an answer.]

## What changes

![<what the schema card shows>](./schema-diff.png)

![<what the data-model graph shows>](./data-model.png)

```text
[Text tree of the changed structure. Mark each node new, changed, deprecated, or deleted, with the migration or PR that does it.]
```

### [One sub-section per new or changed type, headed with what the type does]

![<what the type card and JSON example show>](./<type>.png)

![<how the type's fields flow into the columns or calls that use them>](./<type>-flow.png)

[One or two sentences on what the type is for, with its file linked at the head SHA.]

```text
[Text tree of the type's fields, with their constraints.]
```

[A reading table when several values combine into one meaning, one row per case:]

| [field] | [field] | Meaning |
|---|---|---|
| [value] | [value] | [what it means] |

[One sentence saying what to notice, with a link to the lines at the head SHA, then a short excerpt:]

```python
[10 to 25 lines of the code that makes the point]
```

## Checks

- [Each command that ran, exactly as run, with its result: "35 tests pass", "clean".]
- [What this PR has not verified yet, said plainly: "The migrations haven't run forward and back on a scratch database yet."]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

[A branch-stack block a tool maintains (`<!-- branch-stack -->`) goes here, below the footer.]
