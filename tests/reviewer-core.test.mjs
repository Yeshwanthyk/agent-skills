import assert from "node:assert/strict";
import test from "node:test";

import {
  formatFeedback,
  formatLineRange,
  lineExcerpt,
  parseDraft,
  summarizeAnchor,
} from "../skills/review-last/assets/core.mjs";

const timestamp = "2026-07-26T12:00:00.000Z";

function annotation(id, anchor, comment) {
  return { id, anchor, comment, createdAt: timestamp, updatedAt: timestamp };
}

test("formats text and diff annotations as deterministic paste-ready Markdown", () => {
  const feedback = formatFeedback([
    annotation(
      "text-1",
      {
        kind: "text",
        start: 10,
        end: 28,
        quote: "Preserve this exact contract.",
        section: "State ownership",
        before: "",
        after: "",
      },
      "Name the authoritative writer and the stale-read behavior.",
    ),
    annotation(
      "diff-1",
      {
        kind: "diff",
        file: "src/state.ts",
        side: "additions",
        start: 42,
        end: 43,
        excerpt: ["+const owner = primary;", "+return owner;"],
      },
      "This bypasses the lease check.",
    ),
  ]);

  assert.equal(feedback, `## Review feedback

### Assistant response

1. **Selected text — State ownership**
   > Preserve this exact contract.

   Name the authoritative writer and the stale-read behavior.

### \`src/state.ts\`

1. **Lines +42–+43**

   \`\`\`diff
   +const owner = primary;
   +return owner;
   \`\`\`

   This bypasses the lease check.
`);
});

test("escapes hostile file names and diff fences", () => {
  const feedback = formatFeedback([
    annotation(
      "diff-1",
      {
        kind: "diff",
        file: "docs/`draft`\n.md",
        side: "deletions",
        start: 7,
        end: 7,
        excerpt: ["-```", "-obsolete"],
      },
      "Remove the stale claim.",
    ),
  ]);

  assert.match(feedback, /### ``docs\/`draft`\\u\{0a\}\.md``/);
  assert.match(feedback, /\n   ````diff\n   -```\n   -obsolete\n   ````\n/);
  assert.equal(formatLineRange({ kind: "diff", file: "x", side: "deletions", start: 7, end: 7, excerpt: [] }), "−7");
});

test("parses only valid versioned draft annotations", () => {
  const valid = annotation(
    "text-1",
    { kind: "text", start: 0, end: 4, quote: "text", before: "", after: "" },
    "comment",
  );
  const draft = parseDraft(JSON.stringify({
    version: 1,
    annotations: [valid, { id: "bad", anchor: { kind: "text" } }],
  }));
  assert.deepEqual(draft.annotations, [valid]);
  assert.deepEqual(parseDraft("not-json").annotations, []);
  assert.deepEqual(parseDraft(JSON.stringify({ version: 2, annotations: [valid] })).annotations, []);
  assert.deepEqual(parseDraft(JSON.stringify({
    version: 1,
    annotations: [{ ...valid, comment: "x".repeat(10_001) }],
  })).annotations, []);
});

test("summarizes anchors and bounds diff excerpts", () => {
  assert.equal(
    summarizeAnchor({ kind: "diff", file: "src/app.ts", side: "additions", start: 4, end: 8, excerpt: [] }),
    "src/app.ts:+4–+8",
  );
  const lines = new Map([[4, "four"], [5, "five"], [6, "six"]]);
  assert.deepEqual(lineExcerpt(lines, "additions", 4, 6, 2), ["+four", "+five", "… 1 more selected lines"]);
});
