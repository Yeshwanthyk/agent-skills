# Make a visual explanation that teaches

Use this workflow across subjects. The topic determines the visual model; a supplied reference determines the requested visual language. Neither an animation library nor an attractive illustration supplies the explanation.

## Storyboard before drawing

Write a small storyboard in the research notes. For each state, record:

| Reader question | Visible change | Meaning and evidence | Reader check |
| --- | --- | --- | --- |
| What should the reader understand now? | What appears, moves, or changes? | Why does that change follow, and what supports it? | What can the reader predict, compare, or explain? |

Start with the smallest useful concrete case. Introduce a term beside the thing it names. Add one conceptual burden at a time, keeping previously learned objects in place. Label units and distinguish a possible outcome from an observed one. Use a comparison, boundary, or failure case when it tests the central idea; do not manufacture one merely to fill a template.

Each state's caption should say what happened and why it matters. “A required service is now available, so no dependency remains to supply” teaches more than “Dependency injection.” A prediction question should expose a plausible misunderstanding, and its answer should explain the mechanism. Avoid trivia, unexplained jargon, and controls that only produce cosmetic changes.

If an analogy is useful, record what maps to the subject and where it stops. Do not draw an arrow, queue, physical motion, or timing interval that implies an unsupported mechanism. Reading time between frames is not the system's execution time.

## Establish the illustration language

Translate the reference into a short art brief: composition, perspective, contours, stroke weight, fill treatment, texture, typography, object scale, and negative space. Record the brief beside the storyboard. For example, a printed drafting illustration may use fine blue contours, consistent three-quarter objects, pale fills, a faint grid, and restrained serif captions. Those are choices for that reference, not defaults for every article.

Choose the method deliberately:

- Use native SVG or CSS geometry for relationships, charts, precise shapes, live values, and labels.
- Reuse a suitable illustration family when its quality, license, and perspective match the brief.
- Use an image-generation capability for tangible or organic subjects when code-drawn icons cannot reach the requested illustration quality. Supply the reference when available, ask for coherent perspective and usable negative space, and request real transparency for cutouts. Preserve the prompt and asset provenance. Inspect the resulting asset before placing it.

Keep numbers and teaching labels separate from generated pixels as real text. Typeset them beside an object or on a reserved writing area with a coherent baseline; do not force large text into an awkward perspective. Do not ask a bitmap to contain changing program values. Separate decorative assets from the semantic frame so both can be revised. Draw a reusable object once and retain it across states; independent redraws introduce distracting shifts in proportions, lighting, and perspective.

Make one complete representative state first, at the final reading width. Compare its silhouette, balance, line weight, and object detail with the reference. Fix that state before extending the sequence. A plausible object at full image size may become an awkward blob or a nearly empty prop when scaled into the article.

## Give motion a job

Use motion to reveal order, transfer, transformation, accumulation, or a change in responsibility. Preserve anchors and highlight the meaningful difference. Avoid moving the entire layout when only one relationship changes. A brief transition can help track a state change; it does not itself explain the cause.

Default to a still first state and manual navigation. Playback must be explicitly started, pauseable, finite, and replayable. Leave enough time to read the busiest state; readers must be able to stop and inspect it. Pause while an answer or transcript is opened, while interactive content receives focus, and when the document becomes hidden. Reduced-motion readers retain every state and control with decorative transitions disabled. Include captions, useful alternative text, and an ordered transcript that remains available without JavaScript and in print.

The bundled sequence renderer handles these controls. Author static frames and the accompanying state JSON described in [the content contract](content.md); do not copy a one-off player into every article. For smoother movement within a frame, use the interactive-explainer workflow rather than injecting custom scripts into article JSON.

## Inspect, repair, and report

Check the whole explanation at desktop reading width and a narrow viewport. Inspect the opening state, the densest state, and any alternate outcome. Read every label without zooming. For a wide technical sheet, provide a readable scroll region and an accompanying text explanation instead of shrinking labels until they disappear.

Compare against the art brief, not merely a palette checklist. Repair distorted perspective, mismatched object scales, inconsistent contours, accidental overlaps, oversized text, rough edges, and unexplained blank props. Check that live labels, captions, code, and visible outcomes agree in every state.

Exercise navigation, pause, replay, the final stop, question and transcript pauses, hidden-tab behavior, and reduced motion. Check that every stage can be understood from the static transcript. Verify executable examples independently; illustrated outcomes are authored explanations unless connected to a verified execution.

Report which evidence exists: content validation, interaction checks, rendered visual inspection, and reader feedback. Do not call an explanation comprehensible merely because its controls work. When browser inspection is unavailable, inspect a rendered frame where possible and explicitly leave page layout and live interaction unverified.
