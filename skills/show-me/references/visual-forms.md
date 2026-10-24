# Visual forms

Choose only the forms that reduce explanation time.

A code fence holds code-shaped text: pseudocode, trees, diffs, types, and code. Keep its lines under 80 characters so it reads without wrapping or sideways scrolling. Steps in order and states with their moves are prose-shaped, so they go in a markdown list or table, which wraps to the reader's width.

## Pseudocode

Use for logic or algorithms.

```text
on(save)
  if content is unchanged
    return cached result
  write new content
  return fresh result
```

## Call tree

Use for runtime control flow.

```text
submitForm
  createSession
    persistPrompt
    launchAgent
  navigateToSession
```

## Component tree

Include state and module boundaries that matter.

```tsx
<SessionPage> (apps/example/src/routes/session.tsx)
  useSessionEvents()
  <SessionToolbar>
    <RunSkillButton> (packages/ui)
```

## File tree

Use for responsibility or a broad refactor.

```text
src/
├── commands/       # parses user actions
├── sessions/       # owns session state
└── transport/      # sends API requests
```

## Sequence

Use for multi-component interactions or data flow. In chat and on GitHub, write a markdown numbered list: one hop per item, each a plain sentence saying who acts and what moves, with code formatting only on names. Give each separate flow its own bold lead-in. Where HTML or a page renders, draw it with [viz](../../viz/SKILL.md) `view: seq` instead.

**Running a command**
1. The user picks a command in the UI.
2. The UI sends the expanded prompt to the daemon with `POST /run`.
3. The daemon streams the result back, and `<ResultPane>` renders each chunk.

## Transition table

Use for states and the moves between them. In chat and on GitHub, write a markdown table with one row per state; where HTML renders, use viz `view: states`.

| From | Can move to |
| --- | --- |
| `draft` | `queued`, `cancelled` |
| `queued` | `running` |
| `running` | `done`, `failed` |

## Diff

Use when the point is what changes and the surrounding shape already exists. Match the diff shape to the topic.

```diff
 <SessionPage>
   useSessionEvents()
   <SessionToolbar>
+    <RunSkillButton />
   <SessionTimeline>
+    <SkillResultCard />
```

```diff
 src/
 ├── commands/
+│   └── show-me.ts       # expands the command
 ├── sessions/
-└── transport.ts
+└── transport/
+    ├── client.ts
+    └── stream.ts
```

```diff
 on(save)
-  write content
+  if content is unchanged
+    return cached result
+  write new content
+  invalidate cache
```

## Whole block

Show the whole block when most of it is new, omitted context would hide ownership or order, or the user needs a copyable target shape.

```ts
function expandSkill(command: string): string {
  const skillName = command.slice(1)
  return `use the ${skillName} skill`
}
```
