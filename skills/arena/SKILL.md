---
name: arena
description: Compare complete candidate solutions and combine the best work into one verified result.
---

# Arena

Use for a requested candidate bakeoff or a consequential choice between viable designs. A settled mechanical task does not need competing implementations.

Define the artifact and observable selection criteria. Give candidates the same task and raw inputs, with separate write targets. Use the [agent-routing contract](../yesh-mode/references/agent-routing.md) for implementation and review models. Set the number of candidates from the useful design alternatives and available capacity.

Run independent candidates in parallel when possible. Keep failed or incomplete runs visible. A brief design rationale helps when the differences are not evident in the artifacts.

After candidate work settles, use a separate read-only reviewer to assess the outputs against the criteria. Reviewers need not use a different model family. If independent review is unavailable, state the limitation.

Choose a base using the artifacts and review evidence. Integrate useful parts from the other candidates only when they fit the chosen design. Agreement can justify keeping the base unchanged; disagreement is a reason to inspect assumptions, not automatically rerun everything.

Verify the synthesized result at its relevant boundary. Fix demonstrated failures within the requested task. Candidate success does not prove that the combined result works.

Deliver the artifact, the reason for the selection, useful integrations, and verification. Account for dropouts and remaining uncertainty. A comparison that produces only one candidate is not evidence that it beat alternatives.
