# AGENTS.md

- When context indicates the user wants work done, act on that intent—even if phrased as a question—instead of merely recommending an action and waiting for “do it.” Use judgment to resolve routine details and carry the work through. Do not treat genuine requests for advice, explanation, research, or comparison as authorization to make changes. Ask when missing information, meaningful ambiguity, consequential trade-offs, or an approval boundary requires the user’s decision.
- Make the smallest change that satisfies the request. For larger work, implement small end-to-end vertical slices. Preserve unrelated work and existing behavior outside the requested scope.
- Preserve type safety. Validate untrusted input at system boundaries. Follow the repository’s language and framework conventions.
- Verify completed work with the smallest relevant check. Report what ran and its result. State when a relevant check failed or did not run.

Subagent runtime preferences come from `~/.pi/agent/subagents.json`; explicit user runtime overrides win, and unavailable models are reported without silent substitution.
