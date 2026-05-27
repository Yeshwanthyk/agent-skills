---
name: context-explorer
description: Generate interactive HTML context explorers, ledgers, and flamegraphs from Pi, Claude Code, and Codex session transcripts. Use when inspecting token/context usage, session JSONL files, tool-call bloat, prompt/cache/output split, ~/.pi/agent/sessions, ~/.claude/projects or sessions, ~/.codex/sessions or archived_sessions, or when the user asks where context went.
---

# Context Explorer

Generate a self-contained HTML profiler for agent session context usage. Treat the output as a **trace viewer / context ledger**, not a generic dashboard.

## Use when

- User asks “where did context go?”, “how much context did this use?”, “show token split”, “inspect this session”, “context explorer”, “context flamegraph”.
- User provides a session path, screenshot, JSONL, or asks to inspect current/previous agent sessions.
- User mentions Pi, Claude Code, Codex, `~/.pi/agent/sessions`, `~/.claude/projects`, `~/.claude/sessions`, `~/.codex/sessions`, or `~/.codex/archived_sessions`.
- You need to identify tool-call bloat, large tool results, prompt/cache/output splits, or context-heavy phases.

## Output contract

Create a single HTML file, usually in `/tmp`, unless the user asks for another path:

```text
/tmp/context-explorer.html
/tmp/context-explorer-<agent-or-session>.html
```

The HTML must be self-contained: inline CSS, inline JS, embedded normalized session data as JSON. No network assets.

## Core UX: Context Ledger

Do **not** lead with a giant table. The primary interface must answer “where did context go?” first.

Required layout:

1. **Answer strip**
   - last provider prompt/context total if available
   - visible slice estimated tokens
   - largest contributing phase/tool
   - notable domain slice when relevant (e.g. Linear MCP, bash output, web search)
2. **Phase sidebar**
   - phase cards sorted by token weight
   - click phase to filter everything
3. **Context flamegraph**
   - phase → role/tool → individual message
   - rectangle width proportional to estimated tokens
   - clicking any segment opens inspector
4. **Timeline**
   - chronological bars, colored by phase
   - click bar to inspect source event
5. **Inspector drawer**
   - role, timestamp, phase, bucket, tool, token estimate
   - provider usage if present
   - raw content / truncated content with clear note
   - “why classified this way” when practical
6. **Audit table**
   - secondary, below the visual analysis
   - compact rows
   - hidden metadata by default

Required toggles/filters:

- search content/tool/phase
- hide metadata (on by default)
- tool results only
- sort chronological / largest first
- phase filter

## Visual direction

Use a profiler / trace viewer metaphor:

- dark, crisp, dense
- mono or tabular numerals for all counts
- thin dividers, compact pills, sticky labels
- flamegraph first, table second
- selected slice uses outline/border, not glow
- one phase color per phase; bucket colors only inside flamegraph if helpful
- avoid generic “dashboard card soup”
- explicitly label estimates as approximate

Follow UI polish principles:

- headings use balanced wrapping
- body text uses pretty wrapping
- controls have visible focus rings
- buttons have `touch-action: manipulation`
- interaction transitions specify exact properties, never `transition: all`
- clickable targets are at least ~40px tall where possible
- numeric columns use tabular numbers
- preserve horizontal data via scroll containers rather than clipping

## Adapter pipeline

Always normalize raw session JSONL into this shape before rendering:

```ts
type NormalizedEvent = {
  id: string | number
  sourceAgent: 'pi' | 'claude' | 'codex' | 'unknown'
  sourcePath: string
  timestamp?: string
  role: 'system' | 'developer' | 'user' | 'assistant' | 'tool' | 'metadata' | 'unknown'
  eventType: string
  content: string
  summary: string
  toolName?: string
  usage?: {
    input?: number
    output?: number
    cacheRead?: number
    cacheWrite?: number
    total?: number
  }
  estimatedTokens: number
  bucket: 'System Prompt' | 'System Tools' | 'User' | 'Assistant' | 'Tool Call' | 'Tool Result' | 'Metadata' | 'Other'
  phase: string
  isMetadata: boolean
}
```

Token estimate fallback:

```text
estimatedTokens = ceil(character_count / 4)
```

If provider usage is available, show it separately. Do not overwrite semantic buckets unless you implement a clear normalization step and label it.

## Session discovery

If the user says “current session”, prefer the active agent’s current session if detectable. Otherwise use newest modified JSONL under known paths and state the source path.

Search paths:

```bash
# Pi
~/.pi/agent/sessions/**/*.jsonl

# Claude Code
~/.claude/projects/**/*.jsonl
~/.claude/sessions/**/*.jsonl

# Codex
~/.codex/sessions/**/*.jsonl
~/.codex/archived_sessions/**/*.jsonl
```

Prefer newest by mtime, but avoid selecting obvious cache/config JSON. For Codex, `archived_sessions/rollout-*.jsonl` are valid session transcripts.

## Format adapters

### Pi adapter

Observed path:

```text
~/.pi/agent/sessions/<encoded-cwd>/*.jsonl
```

Observed shapes:

```json
{"type":"message","timestamp":"...","message":{"role":"assistant","content":[{"type":"toolCall","name":"run","arguments":{...}}],"usage":{"input":585,"output":24,"cacheRead":18432,"cacheWrite":0,"totalTokens":19041}}}
```

```json
{"type":"message","timestamp":"...","message":{"role":"toolResult","toolName":"run","content":[{"type":"text","text":"..."}]}}
```

Mapping:

- `message.role` → role
- `message.content[].type == text` → content
- `message.content[].type == toolCall` → Tool Call, `toolName = name`, content includes arguments
- `message.role == toolResult` → Tool Result, `toolName = message.toolName`
- usage:
  - `input` → input
  - `output` → output
  - `cacheRead` → cacheRead
  - `cacheWrite` → cacheWrite
  - `totalTokens` → total

### Claude Code adapter

Observed paths:

```text
~/.claude/projects/<encoded-cwd>/*.jsonl
~/.claude/projects/<encoded-cwd>/<session>/subagents/*.jsonl
```

Observed user message:

```json
{"type":"user","message":{"role":"user","content":"..."},"timestamp":"...","cwd":"...","sessionId":"..."}
```

Observed assistant message with usage:

```json
{"message":{"model":"claude-opus-4-7","role":"assistant","content":[{"type":"thinking","thinking":"..."}],"usage":{"input_tokens":6,"cache_creation_input_tokens":21553,"cache_read_input_tokens":0,"output_tokens":176}}}
```

Observed tool use:

```json
{"message":{"role":"assistant","content":[{"type":"tool_use","id":"toolu_...","name":"Bash","input":{"command":"..."}}]}}
```

Observed tool result is stored as a user message:

```json
{"type":"user","message":{"role":"user","content":[{"tool_use_id":"toolu_...","type":"tool_result","content":"stdout...","is_error":false}]},"toolUseResult":{"stdout":"...","stderr":"..."}}
```

Mapping:

- top-level `type == file-history-snapshot` → Metadata
- `message.role == assistant` with `content[].type == tool_use` → Tool Call, `toolName = content[].name`
- `message.role == user` with `content[].type == tool_result` → Tool Result, content from `content` and/or `toolUseResult`
- `content[].type == thinking` → Assistant; mark as metadata/hidden by default unless user wants thinking included
- usage:
  - `usage.input_tokens` → input
  - `usage.output_tokens` → output
  - `usage.cache_read_input_tokens` → cacheRead
  - `usage.cache_creation_input_tokens` → cacheWrite
  - `usage.cache_creation.ephemeral_1h_input_tokens` and `ephemeral_5m_input_tokens` may appear; preserve in raw usage notes

### Codex adapter

Observed paths:

```text
~/.codex/sessions/**/*.jsonl
~/.codex/archived_sessions/rollout-*.jsonl
```

Observed session metadata:

```json
{"timestamp":"...","type":"session_meta","payload":{"id":"...","cwd":"...","model_provider":"openai","base_instructions":{"text":"..."}}}
```

Observed turn / context events:

```json
{"timestamp":"...","type":"event_msg","payload":{"type":"task_started","turn_id":"...","model_context_window":258400}}
```

```json
{"timestamp":"...","type":"turn_context","payload":{"turn_id":"...","cwd":"...","model":"gpt-5.3-codex","developer_instructions":"..."}}
```

Observed response item messages:

```json
{"timestamp":"...","type":"response_item","payload":{"type":"message","role":"developer","content":[{"type":"input_text","text":"..."}]}}
```

```json
{"timestamp":"...","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"hi"}]}}
```

Observed event messages:

```json
{"timestamp":"...","type":"event_msg","payload":{"type":"user_message","message":"hi"}}
```

```json
{"timestamp":"...","type":"event_msg","payload":{"type":"agent_message","message":"hi","phase":"final_answer"}}
```

Observed rate/token events:

```json
{"timestamp":"...","type":"event_msg","payload":{"type":"token_count","info":null,"rate_limits":{...}}}
```

Mapping:

- `type == session_meta` → Metadata / System Prompt; include `payload.base_instructions.text` as System Prompt if analyzing full loaded context
- `type == turn_context` → Metadata / System Tools or System Prompt depending fields; hide by default but count if user asks loaded-context view
- `type == response_item && payload.type == message` → role from `payload.role`
- content block types:
  - `input_text` → content text
  - `output_text` → content text
  - function/tool call blocks, if present, should map to Tool Call defensively by checking `type` contains `tool` or `function`
- `event_msg.payload.type == user_message` → User
- `event_msg.payload.type == agent_message` → Assistant
- `event_msg.payload.type == token_count` → Metadata; do not treat rate-limit percentages as token usage
- Codex provider token usage may be absent; estimate with chars÷4 unless explicit usage fields appear.

## Classification

### Buckets

- `System Prompt`: system/developer/base instructions, AGENTS.md injected content, collaboration mode instructions
- `System Tools`: tool schemas, tool availability, sandbox/permission/tool descriptions
- `User`: user-authored messages
- `Assistant`: assistant prose, plans, reasoning summaries if present
- `Tool Call`: tool/function invocation names and arguments
- `Tool Result`: stdout/stderr, MCP outputs, file reads, web/search results
- `Metadata`: session meta, model changes, snapshots, token_count/rate-limit events, task lifecycle plumbing
- `Other`: unknown but content-bearing events

Hide Metadata by default.

### Phase detection

Use explicit user/task labels if available; otherwise derive from content/tool names. Keep phase names action-oriented:

- `Linear fetch`, not `Linear`
- `Context accounting`
- `Static report`
- `Explorer build`
- `Scout subagent`
- `Code editing`
- `Tests / verification`
- `Web research`
- `File inspection`
- `Other`

Avoid overfitting: if unsure, classify as `Other` and allow search/filter to reveal it.

## Implementation guidance

A minimal generator can be a Python or Node script run by the agent. It should:

1. Resolve session path(s).
2. Parse JSONL defensively line by line.
3. Detect adapter:
   - Pi: top-level `message` with Pi `usage.input/cacheRead` fields or `message.role == toolResult`
   - Claude: top-level `uuid`, `parentUuid`, `sessionId`, `message.usage.input_tokens`
   - Codex: top-level `type` values like `session_meta`, `event_msg`, `response_item`, `turn_context`
4. Normalize events.
5. Estimate tokens.
6. Classify bucket and phase.
7. Embed normalized JSON into HTML.
8. Write and optionally open the HTML.

## Accuracy rules

- Never claim exact semantic token splits unless the source provides exact data.
- Clearly distinguish:
  - provider-reported usage
  - estimated per-message attribution
  - normalized estimates
- For screenshots/user corrections, update labels and caveats rather than defending prior estimates.
- If a tool result was manually identified by the user as a known token amount, allow overriding that slice and label it user-calibrated.

## Final response

Keep final terse:

```text
Changed:
- Created/updated /tmp/context-explorer.html
- Source: <session path>

Verified:
- Parsed <n> events from <agent>
- Opened/generated HTML

Notes:
- Semantic splits are estimated unless provider usage exists.
```
