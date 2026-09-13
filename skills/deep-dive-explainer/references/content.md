# Article content contract

Author JSON, not HTML. No packages or setup are required. The renderer supplies all page structure and derives nested navigation from sections. Save research notes separately; readers see the article, not the drafting ledger.

Root keys: `title`, `summary`, `date` (YYYY-MM-DD), optional `author`, `intro` (blocks), `sections` (nonempty list). Each section has `heading`, `blocks`, and optional `children` (one subsection level). IDs are generated; internal links use `#section-1`, `#section-1-1`, etc.

A block is one of:

- A string: one paragraph.
- `{"list": ["Item", "Item"], "ordered": false}`
- `{"code": "literal code\n", "language": "sh"}`
- `{"quote": "A short attributed quotation or original principle."}`
- `{"table": {"headers": ["Option", "Tradeoff"], "rows": [["A", "B"]]}}`

Prose fields support inline backtick code, `**strong**`, and `[descriptive label](https://source.example/page)`. Links accept HTTP(S) URLs or generated section fragments. For a source URL containing parentheses, percent-encode those characters. Other Markdown constructs are plain text. Code blocks are literal. Raw HTML is escaped. Metadata is plain text.

Minimal example:

```json
{
  "title": "How build directories keep outputs separate",
  "summary": "Follow two builds from temporary files to published output, and see where process isolation still matters.",
  "date": "2026-09-12",
  "intro": ["A build directory gives one run a place to write its files."],
  "sections": [
    {"heading": "Where does a build write?", "blocks": [
      "Each run writes to its own directory. This is an illustrative design.",
      {"code": "builds/run-42/output.zip", "language": "text"}
    ]}
  ]
}
```

Render with the command in SKILL.md. To check without writing a file, use `--check`. Validation checks structure, URLs, dates, and fragment targets, not factual truth or whether source pages exist. Editing the JSON and rerendering preserves the design; the generated HTML can be shared as one offline file.
