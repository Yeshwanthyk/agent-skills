### Prototype

**You own the design decision, not the code. The prototype is a throwaway instrument; the real build follows [Feature](feature.md).** Use this for "prototype", "mock it up", "sketch this", "try this layout", or exploring a UI, interaction, or layout before committing. Also use it to settle an empirical fork by observing it run.

This is the one playbook where [`laziness-protocol`](../principles/laziness-protocol.md) inverts the usual implementation bar. Speed beats production polish because the artifact is disposable. The rigor is in answering the decision cheaply.

1. Scope the decision the prototype exists to make: which layout, interaction, density, behavior, timing, or approach. No decision means no prototype. Route to [Feature](feature.md).
2. Gather references when the design space is open. Search for prior art, summarize a moodboard of themes, palettes, and layouts, let the user pick directions before building. Skip when the direction is set.
3. Build throwaway in an isolated scratch dir, separate from production source. For a visual decision, vanilla HTML/CSS/JS or the lightest stack that renders the idea, CDN deps, a dev server with hot reload. For a behavioral or timing decision, the smallest script that exercises the question. No production framework, no tests, no abstractions.
4. When comparing alternatives, build them behind one switcher, with each variant labeled so the user can name it. This applies [`exhaust-the-design-space`](../principles/exhaust-the-design-space.md) cheaply.
5. Verify through the matching project verifier or current harness UI, browser, CLI, or API tools. For a visual decision, capture each variant and drive the interaction. For a behavioral or timing decision, log the timing, print the output, or observe the render. If the matching surface is unavailable, report the limitation and do not claim the decision is settled.
6. Present alternatives, tradeoffs, and a recommendation. The output is the decision plus the throwaway artifact, not shippable code. Hand the chosen direction to [Feature](feature.md), or `architect` for a structural decision.

## Completion

The throwaway artifact answers the stated decision with observed evidence and a recommendation.

**Reply:** the variants explored, the evidence (screenshots for a visual decision, the observed output or timing for a behavioral one), tradeoffs, your recommendation, and the scratch path. Say plainly that the prototype is throwaway.
