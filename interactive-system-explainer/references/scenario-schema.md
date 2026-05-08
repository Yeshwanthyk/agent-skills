# Scenario schema

The scenario simulator is the keystone interactive component. Its power comes from being **purely data-driven** — every scenario is one object, the renderer never branches on scenario id.

## State shape

The simulator owns a single `state` object. Reset on scenario change. Keep keys flat-but-grouped so dotted-path patches stay readable.

```js
const initialState = () => ({
  // identity / configuration ─ single dotted-path "agent.id"
  agent: {
    id:       '—',
    sandbox:  'empty',
    model:    '—',
    role:     null,
    providers: 0,
    tools:    0,
    commands: 0
  },
  cwd: '/workspace',

  // session resolution ─ "session.role_eff", "session.depth"
  session: {
    id:        'default',
    leafId:    null,
    role:      null,
    role_eff:  null,
    model_eff: null,
    depth:     0
  },

  // append-only history mirror (entry array)
  entries: [],
  contextTokens: 0,

  // derived / live signals
  activeStage:        null,
  taskActive:         null,
  apiResponse:        null,
  resultRetries:      0,
  overflowRecoveries: 0
});
```

Add new fields per system. Anything that should flash when changed must live in this object — that's how `applyPatch` produces the `changed` Set that drives the row-flash animation.

## Scenario shape

```js
const scenarios = [
  {
    id:    'overflow',
    title: 'Overflow recovery (retry)',
    desc:  'Provider rejects → remove leaf → incremental compaction → retry',
    steps: [
      // ── step ──────────────────────────────────────────────────────────
      {
        stage: 'external',          // pipeline box to highlight (see below)
        expl:  'Long-lived session, 84 entries already in history.',
        ev:    ['sys', 'request', 'POST /agents/support/u-99'],
        patch: {
          'agent.id':      'support',
          'session.id':    'u-99',
          'contextTokens': 188000
        },
        history: { fill: 84 }       // optional: fill | add | pop | compact
      },
      // …
    ]
  }
];
```

### Field rules

- **`stage`** — one of `external | init | session | loop | persist | response`. Maps to a fixed pipeline of stage boxes at the top of the simulator. A scenario can repeat the same stage across consecutive steps (e.g., several `loop` steps for stream → tool → continue).
- **`expl`** — one sentence. Shown in the "step explanation" pane. This is the teaching surface; every word matters.
- **`ev`** — `[kind, type, message]`. `kind` selects the log row colour:
  - `sys` — neutral system event
  - `text` — assistant text streaming
  - `tool` — tool call boundary
  - `comp` — compaction event
  - `task` — child task event
  - `end` — turn end / response
  - `err` — error / overflow / denied
- **`patch`** — flat object with dotted-path keys, applied via `applyPatch`. Returns a `Set<string>` of paths that changed; the renderer flashes `<span class="v changed">` for ~1.5s.
- **`history`** — optional, one of:
  - `{ fill: N }` — replace entries with a fake N-entry alternating user/assistant array (for "load existing session")
  - `{ add: { type, source, role } }` — push one entry; renderer assigns a sequential id
  - `{ pop: true }` — remove the leaf (used for `removeLeafMessage` on overflow)
  - `{ compact: true }` — replace entries with `[CompactionEntry, ...last 12]`

## Pipeline stages

The standard six-stage pipeline maps almost any agent / request system. Adapt names per system but keep the count to 5–7 so the highlighting stays scannable.

```text
external → init → session → loop → persist → response
HTTP       resolve  load     stream  store     reply
```

## Logging

```js
function pushEvent(kind, type, msg) {
  const t = new Date().toLocaleTimeString('en-US', { hour12:false });
  const div = document.createElement('div');
  div.className = 'entry evt-' + kind;
  div.innerHTML =
    `<span class="t">${t}</span>
     <span class="e">${type}</span>
     <span class="m">${escapeHtml(msg)}</span>`;
  const log = document.getElementById('eventLog');
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}
```

Don't strip the timestamps — they make the log feel like a real trace.

## Renderer pipeline

```text
selectScenario(s)            → state = initialState(); stepIdx = 0; render(true)
nextStep()                   → applyPatch · applyHistory · pushEvent · renderAll
prevStep()                   → reset and replay (cheaper than reverse-patches)
startPlay() / stopPlay()     → setInterval(nextStep, 1100)
```

`prevStep` does **not** try to invert patches. It resets state and re-applies steps `0..target-1`. This sidesteps reversibility bugs entirely and is fast enough for any human-scale scenario.

## Choosing scenarios

For any non-trivial system, ship **at least one scenario per category**:

| Category    | What it teaches                                           |
|-------------|-----------------------------------------------------------|
| Happy path  | Baseline shape: init → run → respond                      |
| Composition | Skill / sub-agent / role overlay / per-call override      |
| Long-lived  | History accumulation, loading existing state              |
| Algorithm   | The interesting algorithm fires (compaction, retry, etc.) |
| Recovery    | Something fails and the system heals                       |
| Integration | External moving part (MCP server, webhook, scheduler)     |

The recovery scenarios are where the explainer earns its keep. Don't ship without at least one.

## Anti-pattern

Resist the urge to put scenario-specific behavior in the renderer. If you find yourself writing `if (currentScn.id === 'overflow') …`, pull that distinction back into the data — usually as another field on the step or another value in `state`.
