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

## Diagrams

Use ASCII in a `code` block for short linear flows. For branching, lifetimes, or responsibility boundaries, use a Mermaid diagram block:

```json
{"mermaid":"diagrams/call.mmd","svg":"diagrams/call.svg","caption":"Where the call is checked.","alt":"Describe the flow and the meaningful branch outcomes."}
```

Keep `.mmd` as the authoritative diagram source. Render it to SVG with Mermaid CLI at authoring time, then regenerate the article. Both paths are relative to the article JSON and must stay within its directory. The renderer embeds the SVG as an image and includes collapsible Mermaid source, so the delivered HTML works offline without Mermaid JavaScript. SVG is displayed in an image context, not injected as page markup. A diagram edit requires regenerating its SVG; the renderer does not check that the two match.

Example with an installed Mermaid CLI: `mmdc -i diagrams/call.mmd -o diagrams/call.svg -t dark -b transparent`. Configure the CLI browser path if needed. This optional authoring tool is needed only when making or changing Mermaid diagrams; ordinary article rendering still requires only Python. Inspect labels at the final article width, use short labels and a vertical flow on narrow pages, and split a dense diagram rather than shrinking its text.
