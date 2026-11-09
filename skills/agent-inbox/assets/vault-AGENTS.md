# agent-inbox

Work tracking for projects. Agents write here only when the user asks.

## Where agents may write

| Path | Rule |
| --- | --- |
| `inbox/` | New files only. Each item names its project. |
| `daily/YYYY-MM-DD.md` | Append one line per logged session. Never edit earlier lines. |
| `projects/<p>/sessions/` | New dated session notes only. |
| `projects/<p>/overview.md`, `decisions.md` | Changed only by a triage move the user approved. |
| `archive/` | Off limits. Finished projects; the user moves them here. |

Personal notes, reading, and clips do not belong here.

## Note shapes

Inbox item, `inbox/YYYY-MM-DD-<slug>.md`:

```markdown
---
project: <slug>
kind: task | finding | decision | question
source: <thread or session link>
created: YYYY-MM-DD
---

<one to five lines: what it is and why it matters>
```

Session note, `projects/<p>/sessions/YYYY-MM-DD-<slug>.md`:

```markdown
---
project: <slug>
source: <thread or session link>
date: YYYY-MM-DD
---

## Did
## Decided
## Open
## Next
```

Daily line, appended to `daily/YYYY-MM-DD.md`:

```markdown
- <project>: <one line> → [[projects/<p>/sessions/YYYY-MM-DD-<slug>]]
```

Decision entry in `decisions.md`, newest first:

```markdown
## YYYY-MM-DD <decision>
Why: <reason>. Source: [[<session or inbox note>]]
```
