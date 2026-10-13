# Guard the context window

**Read when:** work could overflow the session's working context, or when large payloads are in play.

- The context window is finite and non-renewable within a session; every token that enters should earn its place.
- Isolate large payloads: route verbose outputs, screenshots, and large documents away from the main line of reasoning; keep summaries in context and raw data outside it.
- Read only what you will use. Material every run of a skill needs belongs inline in the skill file; material only some branches reach goes behind a pointer. Keep reference you already read in mind instead of re-reading it.
- Account for context cost when sizing phases, choosing what to read, and deciding what to report.

**Limits:** this governs the agent's own context; keeping a code reader's load low is [simplicity](simplicity.md).