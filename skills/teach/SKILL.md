---
name: teach
description: "Teach a subsystem, change, or idea so the person actually understands it: runs how for the mechanics and its History view for the reasons, then explains in plain layers with diagrams that build up."
disable-model-invocation: true
---

# Teach

Explain what a thing is, how it works, and why it is built that way, at the person's pace. The goal is understanding. Change no code.

## Decide what should land

Pick the two or three things the person should walk away understanding. Read them from the conversation: why they are asking (about to change it, reviewing it, debugging it, new to it) and what they already know. Skip what they plainly know, and put the depth where their question is.

## Gather through how

Read enough code to get oriented, then let [`how`](../how/SKILL.md) do the digging rather than redoing it:

- **Mechanics:** how's Investigate, in the view the question needs (Trace for one flow, Map for a subsystem).
- **Reasons:** how's [History](../how/SKILL.md#history) view. Keep it narrow by default: scope the question to the decision in front of them, start from git and a source or two, and record what you skipped. Widen it only when the reasons are the point.

A subsystem usually needs both; a small change may need one. When both are broad, run History in a background worker under the [delegation contract](../yesh-router/references/delegation.md) while you trace the mechanics. Reword how's findings freely for teaching, except History's confidence labels: those hedges are findings, so keep them.

## Explain in layers

Open with a plain definition, the way a senior engineer would say it out loud, with its common name if it has one. Then tie it to this case ("here, we use it to …") and build: how it works, the reasons, the edge cases. For each part, give the problem it solves and the concrete mechanism. Walking through what happens as the person does the thing (sends the request, scrolls up, retries) often lands it best. A list of functions and constants is reference, not teaching.

Give the smallest complete answer first, a sentence or two, then stop and let them steer. Add a layer when they ask for one. Keep it a conversation: when you would pause, stop and let them reply. With no live person (one-shot run), deliver the layers cleanly and put the offer to go deeper at the end.

## Show it building up

Open the code, the diff, or a running example when that lands faster than words. For anything with three or more moving parts, draw a short series where each diagram redraws the last and adds one part, so the person watches the system assemble. To teach A → B → C: draw A → B, then redraw with C, then redraw with the return edge. One all-at-once diagram is a reference card; save it for the end if at all.

| The idea is | Use |
| --- | --- |
| One point, a definition, a short reason | Plain prose |
| A flow, call path, structure, or before/after | [`show-me`](../show-me/SKILL.md), in the form its [Choose the form](../show-me/SKILL.md#choose-the-form) picks for the host |
| States they should click through, or a process that unfolds over time (a request through components, a protocol exchange) | [`viz`](../viz/SKILL.md): `view: states` or `view: seq` |

Offer a heavier artifact (a saved viz page) before building it unless they asked for one, and keep teaching in conversation while it builds. Hand the artifact the points from the first step, so it teaches those rather than everything how found.

## Voice

Write through [`unslop`](../unslop/SKILL.md): plain spoken English, tight but not terse, the concrete mechanism instead of a metaphor or a preview of what is coming. This is the target density: "Virtualization runs in two parts, one for rendering and one for loading from disk. When an item scrolls out past the buffer, both its DOM node and its in-memory data are evicted." One name per concept, kept throughout. Prefer short sentences. Say each part plainly, without flagging it as key, tricky, or the thing to hold onto, and without quizzing them or asking them to say it back. These section names are directions to you; keep them out of the reply.

## Completion

Done when the person's question is answered in the layers they asked for, every claim traces to how's findings or code you read, History claims keep their confidence labels, any artifact is opened or linked and built from the same evidence, and the threads worth chasing next are named.
