---
name: teach
description: Teach a body of work so a person actually understands it, combining how and why and escalating to diagrams, interactive models, or narrated explainers when they land faster.
---

# Teach

Explain what a thing is, how it works, and why it is built that way, at the person's pace. The goal is understanding, not changes to the code.

## Decide what should land

Pick the few things the person should walk away understanding. Infer them from why they are asking (about to change it, reviewing, debugging, new to it) and what they already know, read from the conversation rather than quizzed out of them. Put depth where their question is.

## Gather, do not redo

Read enough code to get oriented. Then run [`how`](../how/SKILL.md) for mechanics and [`why`](../why/SKILL.md) for reasons, in parallel when both apply. One may be enough for a small change. Keep `why` narrow by default by scoping the question itself; widen it only when the reasons are the point. Keep `why`'s confidence language intact: its hedges are findings, not style.

## Explain in layers

Start with a plain definition, the way a senior engineer would say it out loud, with its common name if it has one. Then tie it to this case ("here, we use it to…") and build: how it works, the reasons, the edge cases. For each part, give the problem it solves and the concrete mechanism. Walking through what happens as the person does the thing often lands it best. Listing functions and constants is reference, not teaching.

Give the smallest complete answer first, a sentence or two, then stop and let them steer. Add layers when asked. No quizzes, no "say it back", no announcing that a part is important or tricky. Running one-shot with no live person, deliver it cleanly and put the offer to go deeper at the end.

## Pick the medium

Match the medium to the idea, and escalate only when it lands faster than words:

| The idea is | Use |
| --- | --- |
| One point, a definition, a short reason | Plain prose |
| A flow, call path, structure, or before/after | [`show-me`](../show-me/SKILL.md), as a series of diagrams that each redraw the last and add one part, not one all-at-once diagram |
| Behavior or state the person should poke at (toggles, scenarios, state transitions) | [`interactive-explainer`](../interactive-explainer/SKILL.md) |
| A process that unfolds over time (requests moving through components, a protocol exchange, a pipeline) | [`motion-explainer`](../motion-explainer/SKILL.md), narrated beat by beat |
| A whole topic worth a durable long-form read | [`deep-dive-explainer`](../deep-dive-explainer/SKILL.md) |

Offer a heavier artifact before building it unless the person asked for one; keep teaching in conversation while it builds. Pass the artifact the few points from the first step, so it teaches those, not everything `how` found. After the person uses it, come back to conversation and answer what it raised.

## Voice

Write through [`unslop`](../unslop/SKILL.md): plain spoken English, tight not terse, the concrete mechanism instead of a metaphor or a preview. One name per concept. Do not print framing labels ("the key insight", "TL;DR") or echo these steps as headers.

## Completion

Done when the person's stated question is answered in layers they asked for, every claim traces to `how`, `why`, or code read directly, any artifact is opened or linked and grounded in the same evidence, and the threads worth chasing next are named.
