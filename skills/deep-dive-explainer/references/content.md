# Article content contract

Author JSON, not HTML. No packages or setup are required. The renderer supplies all page structure and derives nested navigation from sections. Save research notes separately; readers see the article, not the drafting ledger.

Root keys: `title`, `summary`, `date` (YYYY-MM-DD), optional `author`, `intro` (blocks), `sections` (nonempty list). Each section has `heading`, `blocks`, and optional `children` (one subsection level). IDs are generated; internal links use `#section-1`, `#section-1-1`, etc.

A block is one of:

- A string: one paragraph.
- `{"list": ["Item", "Item"], "ordered": false}`
- `{"code": "literal code\n", "language": "sh"}`
- `{"quote": "A short attributed quotation or original principle."}`
- `{"table": {"headers": ["Option", "Tradeoff"], "rows": [["A", "B"]]}}`
- `{"sequence": "figures/walkthrough.json", "caption": "Follow the same example as one relationship changes."}`

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

## Explanatory sequences

Read [the visual explanation workflow](visual-explanations.md) before storyboarding or making assets. A sequence is a finite, authored explanation, not a live computation. Its JSON path is relative to the article JSON. Image paths are relative to the sequence JSON. All files, including linked raster assets inside SVG frames, must stay within the article directory; absolute paths and escaping symlinks are rejected.

Example `figures/walkthrough.json`:

```json
{
  "interval_ms": 9000,
  "states": [
    {
      "title": "Two builds share an output path",
      "image": "shared.svg",
      "alt": "Build A and build B both write to output.zip.",
      "explanation": "Either build can replace the other's file in this illustrative design.",
      "changed": "The destination is shared.",
      "question": {
        "prompt": "Does a different process imply a different output file?",
        "answer": "No. Both processes use the same path in this example."
      }
    },
    {
      "title": "Give each run its own destination",
      "image": "separate.svg",
      "alt": "Build A writes to run-a/output.zip; build B writes to run-b/output.zip.",
      "explanation": "Distinct paths separate these outputs. Shared inputs and publication still need their own rules.",
      "code": "builds/run-a/output.zip\nbuilds/run-b/output.zip",
      "language": "text"
    }
  ]
}
```

Each state requires nonempty `title`, `image`, `alt`, and `explanation`. Optional fields are `changed`, `question` with `prompt` and `answer`, `code`, `language` (requires code), and `source` (an HTTP(S) URL). Prose fields accept the article's inline syntax; titles and alternative text are plain text. Code is literal. Use `source` beside stages making source-backed claims; this illustrative example does not claim measured behavior.

Use at least two states. `interval_ms` is optional and defaults to 9000; valid integers range from 3000 to 30000. Choose a reading interval that fits the captions and code. Playback starts only when requested and stops at the end. Manual Back/Next and a stage slider remain available. Opening a question or transcript, focusing stage content, hiding the document, or changing reduced-motion preference pauses playback. Decorative transitions are disabled under reduced motion.

For a wide technical frame whose labels become too small on mobile, set optional `min_width` on the sequence to an integer from 320 to 1600 pixels. The figure then supplies a focusable horizontal scroll region; captions remain outside it. Omit it when frames can scale comfortably to narrow widths. Inspect the choice at reading size.

Frames may be SVG, PNG, JPEG, or WebP. Use static SVG with the SVG namespace; scripts, event handlers, embedded HTML, and SVG animation are rejected. Local raster `<image href="...">` assets are embedded automatically. Fragment references such as `url(#arrow)` are allowed; external image and stylesheet dependencies are not. Prefer consistent frame dimensions. Keep prose and changing values in authored text rather than generated bitmap lettering.

The renderer embeds frames, captions, questions, code, and its player into the offline HTML. All stages have an ordered transcript, shown by default without JavaScript and expanded for print. The controls and current-stage panel enhance that content when JavaScript is available. Content checks validate this format and its assets; they do not establish illustration quality, factual support, or learner understanding.

For a runnable format example, render [the build-path article](../examples/sequence/article.json) with the ordinary renderer command. Its two frames demonstrate stable anchors and a meaningful comparison. Adapt the storyboard, art brief, and state count to the new subject.
