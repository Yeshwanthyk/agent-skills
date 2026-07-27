import assert from "node:assert/strict";
import test from "node:test";

import {
  formatFeedback,
  formatLineRange,
  lineExcerpt,
  parseDraft,
  summarizeAnchor,
  validateTextAnchor,
} from "../skills/review-annotate/assets/core.mjs";

const timestamp = "2026-07-26T12:00:00.000Z";

function annotation(id, anchor, comment) {
  return { id, anchor, comment, createdAt: timestamp, updatedAt: timestamp };
}

test("formats document and diff annotations as deterministic paste-ready Markdown", () => {
  const feedback = formatFeedback([
    annotation("text-1", {
      kind: "text", documentId: "assistant", start: 10, end: 28,
      quote: "Preserve this exact contract.", section: "State ownership", before: "", after: "",
    }, "Name the authoritative writer and the stale-read behavior."),
    annotation("diff-1", {
      kind: "diff", file: "src/state.ts", side: "additions", start: 42, end: 43,
      excerpt: ["+const owner = primary;", "+return owner;"],
    }, "This bypasses the lease check."),
  ], [{ id: "assistant", relativePath: "Assistant response", kind: "markdown", size: 100 }]);

  assert.equal(feedback, `## Review feedback

### Assistant response

1. **Selected text** — section \`State ownership\`
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

test("escapes hostile section names in document feedback", () => {
  const feedback = formatFeedback([
    annotation("text-hostile", {
      kind: "text", documentId: "doc", start: 0, end: 4, quote: "text",
      section: "Heading **break**\n### forged", before: "", after: "",
    }, "Keep the section contextual."),
  ], [{ id: "doc", relativePath: "notes.md", kind: "markdown", size: 10 }]);
  assert.match(feedback, /section `Heading \*\*break\*\* ### forged`/);
  assert.equal((feedback.match(/^### /gm) ?? []).length, 1);
});

test("groups document feedback in manifest order and escapes hostile names", () => {
  const documents = [
    { id: "html", relativePath: "pages/`unsafe`\n.html", kind: "html", size: 10 },
    { id: "text", relativePath: "notes.txt", kind: "text", size: 10 },
  ];
  const feedback = formatFeedback([
    annotation("text-1", { kind: "text", documentId: "text", start: 0, end: 4, quote: "note", before: "", after: "" }, "Second file."),
    annotation("html-1", { kind: "html", documentId: "html", domPath: "main>p:nth-of-type(1)", start: 0, end: 5, quote: "Hello", before: "", after: "" }, "First file."),
  ], documents);
  assert.ok(feedback.indexOf("pages/") < feedback.indexOf("notes.txt"));
  assert.match(feedback, /### ``pages\/`unsafe`\\u\{0a\}\.html``/);
  assert.match(feedback, /Selected HTML text/);
});

test("escapes hostile diff names and fences", () => {
  const feedback = formatFeedback([
    annotation("diff-1", {
      kind: "diff", file: "docs/`draft`\n.md", side: "deletions", start: 7, end: 7,
      excerpt: ["-```", "-obsolete"],
    }, "Remove the stale claim."),
  ]);
  assert.match(feedback, /### ``docs\/`draft`\\u\{0a\}\.md``/);
  assert.match(feedback, /\n   ````diff\n   -```\n   -obsolete\n   ````\n/);
  assert.equal(formatLineRange({ kind: "diff", file: "x", side: "deletions", start: 7, end: 7, excerpt: [] }), "−7");
});

test("accepts only valid v2 document-aware drafts", () => {
  const valid = annotation("text-1", {
    kind: "text", documentId: "doc", start: 0, end: 4, quote: "text", before: "", after: "",
  }, "comment");
  const draft = parseDraft(JSON.stringify({ version: 2, annotations: [valid, { id: "bad", anchor: { kind: "text" } }] }));
  assert.deepEqual(draft.annotations, [valid]);
  assert.deepEqual(parseDraft("not-json").annotations, []);
  assert.deepEqual(parseDraft(JSON.stringify({ version: 1, annotations: [valid] })).annotations, []);
  assert.deepEqual(parseDraft(JSON.stringify({ version: 2, annotations: [{ ...valid, comment: "x".repeat(10_001) }] })).annotations, []);
});

test("validates text anchors fail-closed and summarizes bounded excerpts", () => {
  const anchor = { kind: "text", documentId: "doc", start: 5, end: 9, quote: "text", before: "lead ", after: " tail" };
  assert.equal(validateTextAnchor("lead text tail", anchor), true);
  assert.equal(validateTextAnchor("lead best tail", anchor), false);
  assert.equal(summarizeAnchor({ kind: "diff", file: "src/app.ts", side: "additions", start: 4, end: 8, excerpt: [] }), "src/app.ts:+4–+8");
  const lines = new Map([[4, "four"], [5, "five"], [6, "six"]]);
  assert.deepEqual(lineExcerpt(lines, "additions", 4, 6, 2), ["+four", "+five", "… 1 more selected lines"]);
});
