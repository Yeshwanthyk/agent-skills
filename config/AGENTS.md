# AGENTS.md

- Match the action to the request. Return findings for research, review, diagnosis, or planning. Make changes when the request asks for implementation. Ask before irreversible or external actions.
- Make the smallest change that satisfies the request. For larger work, implement small end-to-end vertical slices. Preserve unrelated work and existing behavior outside the requested scope.
- Preserve type safety. Validate untrusted input at system boundaries. Follow the repository’s language and framework conventions.
- Verify completed work with the smallest relevant check. Report what ran and its result. State when a relevant check failed or did not run.

## Host delegation preferences

These host defaults are separate from the portable skills. An explicit user override wins; report unavailable models rather than silently substituting one.

| Work | Model | Reasoning |
| --- | --- | --- |
| Scout paths, contracts, and open questions | openai-codex/gpt-5.6-luna | max |
| Implement | openai-codex/gpt-6-astra | medium |
| Review completed work | openai-codex/gpt-6-astra | medium |
| Audit architecture or cross-cutting risk | openai-codex/gpt-6-astra | high |
