---
name: interactive-slides
description: Turn a document or discussion into a clean, interactive HTML slide deck using the saved Ziggy presentation style. Use for browser presentations with keyboard navigation, selectable explanations, and small simulations; not PowerPoint export or long-form articles.
---

# Interactive slides

Make a browser deck with one useful idea per slide. This skill captures the Ziggy deck's neutral design, short copy, and stable interactions. Adapt the subject and narrative; the reference's eight-slide count and Ziggy concepts are examples.

## Start from the captured deck

- Inspect [the Ziggy reference](assets/ziggy-reference.html) for the finished visual direction: white canvas, black sans-serif type, generous spacing, quiet controls, and expressive artwork contained within images. Its technical statements are a historical example, not evidence for a new deck.
- Copy [starter.html](assets/starter.html) into the requested output location. It provides navigation, overview, URL hashes, printing, mobile stacking, and a selection panel that reserves space for every state.
- Use the new subject's imagery. The embedded prism artwork belongs to the Ziggy reference; reuse it only when appropriate to the request. Preserve image proportions and set `height: auto` when width is responsive.

## Edit the story before styling

Outline the point of each slide. Combine repeated ideas: a capability named in an overview may earn a later example, but not another slide restating the same claim. Choose the slide count from the material.

Write concrete headings and short explanations. Remove repeated “I want” lists, promotional conclusions, vague words such as “capabilities” when a specific noun works, and body text that merely repeats its heading. Keep the author's real motives and examples. Preserve conditions that change the meaning, such as what must keep running or which settings are inherited.

For claims about software, check the current implementation. Distinguish interfaces from independent runtimes, source packages from published SDKs, configured selection from automatic routing, and simulated outcomes from live execution. Put concise file-and-line evidence in a Notes panel when useful; keep implementation detail off the main slide unless it explains the point.

## Compose the deck

Use the reference's white/black palette and alpha-black supporting text unless the user specifies another direction. Keep body text readable, with restrained sans-serif headings, left alignment, and one dominant visual or interaction per slide. Build hierarchy with spacing and type before adding containers. An explorer or simulation earns a panel; ordinary prose usually does not.

Use viewport-height slides on desktop and natural vertical scrolling on narrow screens. Keep navigation reachable without covering the content. Derive counts, overview entries, accessible slide labels, and progress from the actual slide elements. Removing a slide must not leave stale totals.

## Keep interactions still

A selection should change its explanation, not move the controls, heading, image, or whole slide.

For finite alternatives, use the starter's overlapping CSS-grid panels: every panel contributes to the shared height, while inactive panels use `visibility: hidden`, `inert`, and `aria-hidden`. Do not use `display: none` on these inactive alternatives. Keep all slides except the current one hidden normally.

When content must be rendered one state at a time, measure every state at the current width, reserve the largest height rounded upward, and restore the selection. Recompute on entry, resize, and font readiness. A guessed `min-height` is not enough; the reference needed fixes when descriptions wrapped differently.

Use semantic controls with selected state, visible focus, keyboard navigation, and reduced-motion support. Arrow shortcuts must not steal input from fields or open dialogs. Mark simulations explicitly and keep their transition rules tied to the source behavior.

## Verify and deliver

Read the whole deck once for repetition and source accuracy. Open the result and check:

- Previous/next, Home/End, overview selection, hash navigation, and dialog dismissal.
- Every state of each interaction. Confirm that the selection actually changed before comparing panel height and document position.
- Desktop and mobile layouts, including the longest explanation and responsive artwork. Fix clipping, horizontal overflow, and unwanted layout shifts.
- Print output includes all slides; labels and overview reflect the final count.

For a self-contained result, embed artwork and keep CSS/JavaScript inline. The reference uses no external libraries. If this collection's interactive-explainer validator is available, run `python3 ../interactive-explainer/scripts/validate_explainer.py <output.html>` from this skill directory. Browser checks remain necessary.

Deliver the HTML path and working preview URL when available. Preserve the original document when converting an existing page. State any verification that could not run.
