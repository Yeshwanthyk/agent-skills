# Reader-first quality bar

An explainer works when someone new to the system follows it without a guide. Correct data is not enough. Check every item before delivery.

## 1. Every element earns its place

For each header line, chip, counter and intro, say what the reader does with it. If you cannot, delete it. Typical cuts: a kicker such as "start here", a meta row restating audience, sources and legend, and a lede that repeats the title.

## 2. Header

- A title that answers a question: "How Float reviews card transactions today".
- A lede of at most 2 lines: what the page shows, and where its scope stops ("Current code only. The options live on the wave 2 pages.").
- Chips only for facts the reader cannot infer, such as the code version read.
- Numbered jump links in one row that never wraps.

## 3. Numbers connect

A counter or count links to the list it counts. A status legend sits beside the numbers it explains, not in a separate block.

## 4. Primer before the first diagram

- 4–8 ideas above the diagram that uses them. Each is a bold name, one plain sentence, and an optional faint example.
  - Good: "**Celery chain**: tasks linked in order. Each starts only when the one before returns. If one fails, the rest never run."
  - Bad: a paragraph, or a definition that needs three more unknown words.
- Every other domain word links to the glossary.

## 5. Section intros

One or two sentences: how to read it, in reader actions ("click a box to open its page, or its coral number for its issues"), then the one non-obvious thing ("the dashed box does not exist yet; most gaps sit on it"). Leave out what the diagram already shows.

## 6. Stories drive all motion

- Every map and state machine gets at least one story. Name it by its outcome: "$40 dinner → no review", "task 6 crashes → review lost".
- Put the caption above the diagram, next to the controls, with the code ref under it. Each step changes one thing and says why it matters. `<em>` marks the one word that matters.
- A state machine's story follows one field through its life.
- Load animation stays under 0.5 s and must not look like data moving.

## 7. A key drawn from samples

Draw a small sample of each box kind, line kind, mark and colour the diagram uses, each with one line of meaning, grouped as boxes · lines · marks and colours. Make it collapsible and open by default.

## 8. Form follows content

| Content | Form |
|---|---|
| Ordered process (pipeline, decision steps) | Numbered cards: name, tags (queue, retry), "does", "if it fails", code ref. Colour the card by risk. |
| Concepts a newcomer needs | Primer grid |
| Lookup data (tables, log strings, endpoints) | Table with ≤ 5 short columns |
| Behaviour across components | Map with stories |
| Lifecycle of one field | State machine with stories |

File paths dim the directory and brighten `file.py:line`. Dense tables show only `file.py:line`, with the full path in a tooltip and click to copy.

## 9. Prose

Run [unslop](../../unslop/SKILL.md) on every string. State the outcome first, then the mechanism, then the code. Say why a gap matters to the reader's task ("so the review is never made").

## 10. Check like the reader

- Render at the reader's real width (ask, or read it from their screenshot; a side panel is often 860–900 px), plus a narrow and a wide width, in every theme.
- Drive real input events: step every story to the end and back, open boxes, wires and markers, focus a glossary term. Fail on any console error or warning.
- Look at the screenshots yourself for clipped tabs, overlapping chips, labels that repeat the title, and walls of text. When a map scrolls sideways, show a "scroll →" cue.
