---
shaping: true
---

# Embedded Review Workspace — Slices

## V1: Review-last annotation loop

**Demo:** invoke `review-last` in Pi, select rendered Markdown text, add/edit/delete a comment, press `y`, and paste structured feedback.

| Affordances | Scope |
| --- | --- |
| N1, N2, N3 | Pi active-branch input, browser surface, local tokenized server |
| U1, U2, U3, U5, U6, U7, U8, U9 | Markdown reader, text anchors, comments, keyboard loop, copy and close |
| N4, N5, N6, N7, N8 | Draft state, formatter, clipboard fallback, bundled assets |

## V2: Review-diff annotation loop

**Demo:** invoke `review-diff` in a dirty repository, switch files, select a Pierre line range, comment, and copy file/line-addressed feedback.

| Affordances | Scope |
| --- | --- |
| N1 | Read-only local Git and PR/MR patch adapters |
| U4, U5, U6, U7, U10 | File navigation, Pierre rendering, line-range anchors, responsive rail |
| N4, N5, N6 | Diff annotation state and formatting |

## V3: Native Pi surface and portability

**Demo:** the same built skills open in Glimpse when detected, fall back to a browser when absent, and accept explicit last-response input outside Pi.

| Affordances | Scope |
| --- | --- |
| N2 | Optional Glimpse module discovery and native lifecycle |
| N1 | Explicit file/stdin fallback for non-Pi harnesses |
| N8 | Identical self-contained runtime in both skill directories |

## V4: Production hardening

**Demo:** keyboard-only use, 200% zoom, narrow layout, empty/error/large input states, and no-network runtime verification all pass.

| Affordances | Scope |
| --- | --- |
| U1–U10 | Focus, state coverage, reduced motion, responsive behavior, copy clarity |
| N1–N8 | Input limits, CSP/host checks, cleanup, unit/integration tests, license notices |

## Slice Wiring

```mermaid
flowchart LR
  V1["V1 · Markdown annotate + copy"] --> V2["V2 · Pierre diff review"]
  V2 --> V3["V3 · Glimpse + portability"]
  V3 --> V4["V4 · Hardening"]
```
