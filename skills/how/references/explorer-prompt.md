# Explorer brief

Use this brief for each parallel exploration angle. Replace the bracketed fields.

## Question

> [ORIGINAL QUESTION]

## Scope and angle

- **Selected view:** [MAP | TRACE | INVENTORY | CONTRAST]
- **Completeness boundary:** [WHAT THIS EXPLORER MUST COVER]
- **Angle:** [ONE DISTINCT SLICE]

You are gathering implementation facts for a separate explainer. Stay inside the angle, but follow its path far enough to remove hand-waving. Read actual files and symbols. Start broad with directory/file discovery and symbol searches, then follow callers and callees from an entry point. Read type definitions, registrations, tests, and boundary adapters that affect the slice. Ask what state is authoritative and what each transformation or side effect does.

Cover, where relevant:

1. entry trigger and exit/effect;
2. production execution path;
3. corresponding test path or test seam;
4. core types and state owners;
5. caller/callee contracts and transformations;
6. persistence, queues, external systems, retries, fallbacks, and failures;
7. mechanical registrations and call sites needed for inventory coverage;
8. proof points and anything a newcomer would get wrong.

Do not edit files. Do not infer from names when the implementation can be read. If a connection cannot be traced, report the gap rather than filling it in. Mark claims as **direct evidence**, **inference**, or **unresolved gap** when needed.

## Return

### Components found
Name, path, and one-sentence responsibility for each important component.

### Flow
Numbered steps with function or method, path, input/output data, state transformation, next call, effect, and failure behavior.

### Boundaries and ownership
Each meaningful caller/callee or system boundary, its contract, state owner, and proof point.

### Inventory evidence
The registration or source-of-truth mechanism inspected, the items found, and why the coverage is complete within the stated boundary. Say when completeness could not be established.

### Files read
Every file read, including tests and registration/configuration sources.

### Non-obvious behavior
Surprises, historical-looking artifacts, hidden coupling, or newcomer traps.

### Open gaps
Anything not fully traced, with the exact point where evidence stops.
