# Guard the context window

**Read when:** work could overflow the session's working context, or when large payloads are in play.

- The context window is finite and non-renewable within a session; every token that enters should earn its place.
- Isolate large payloads: route verbose outputs, screenshots, and large documents away from the main line of reasoning; keep summaries in context and raw data outside it.
- Do not read what you will not use. Read selectively on relevance; keep frequently used reference where it belongs instead of re-reading it.
- Account for context cost when sizing phases, choosing what to read, and deciding what to report.

**Limits:** this governs the agent's own context; keeping a code reader's load low is [simplicity](simplicity.md).