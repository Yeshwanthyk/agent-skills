# Research brief

The prompt template for the agents that write `modules.json`. Fill the `{…}` slots, send one brief per agent, and give each agent its own output path. The schema it references is [`atlas-schema.md`](atlas-schema.md#research-file-modulesjson); paste that section into the brief so the agent needs nothing else.

---

Read-only. The repository is `{root}` at `{commit}`. {One or two sentences on what it is and how its layers depend on each other.} Read `{AGENTS.md or CLAUDE.md}` first; its rules are the standard you review against.

Your files: {the layer, directory or list this agent owns}. Write ONE JSON file to `{output path}` in the shape below. {For the agent that owns areas and flows: also write `areas` and `flows`.}

{paste the modules.json schema}

**Every file you own gets an entry.** Open each file and read it; a name tells you nothing about what the code does.

- `purpose`: one plain sentence, at most 20 words, on what the file does for the system.
- `notes`: one sentence on the file's overall shape when something stands out (too big, mixed concerns, wrong layer). Put specific defects in `issues`.
- `symbols`: the 3–8 exports or functions a reader needs to navigate the file, in file order.
- `excerpts`: 1–3 passages a reviewer should read to understand the file: the core algorithm, the entry point, the tricky part. `why` says what to notice in the passage.
- `issues`: what a careful senior reviewer would flag in a pull request that added this file today.

**Anchors.** Every symbol, excerpt, issue and flow step points at code with `anchor`: an exact substring copied from the first line it refers to, unique within the file, like `export const makeRuntime =` or `catch (error) {`. Copy it from the file; the build rejects anchors it cannot find and warns on anchors that match twice. Excerpts end at the close of the anchor's block; set `lines` for a passage that is not a block.

**Issues are evidence.** Each issue names a concrete defect at a specific line and says what goes wrong because of it: the input, state or change that makes it fail or hurts the next reader. Record an issue only when you can point at the line and state the consequence. Severity:

- `high`: a bug, data loss, a security hole, or a broken architecture rule another file will copy.
- `medium`: fragile code that breaks on a plausible change, an error path that loses information, a layer crossing, a real duplication.
- `low`: style drift from the repository's own conventions, naming, dead code, a missing narrow type.

Categories: `bug`, `layering`, `error-handling`, `concurrency`, `size`, `duplication`, `dead-code`, `types`, `style-drift`, `security`, `performance`. `suggestion` is the concrete change: what to extract, move, rename or replace, and with what. Most files have zero to two issues; an empty list is the honest answer for clean code.

**Areas** (if you own them): {8–14} feature areas cutting across layers, each with a two-sentence summary and every file that belongs to it.

**Flows** (if you own them): {6–9} control flows, each traced in call order through 6–12 steps, every step with `file`, `symbol`, `anchor` and a one-sentence `what`. The flows: {list the entry points that matter: commands, requests, jobs}.

Write plain sentences with the tone of a code review. When done, reply with the output path and counts: files, symbols, excerpts, issues by severity.
