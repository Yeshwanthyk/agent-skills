# Translating Whiteboard Breadboards

Use this branch when the input is a hand-drawn board, screenshot, or spatial diagram.

## Read the visual grammar

Common marks include:

| Visual mark | Interpret as |
| --- | --- |
| Header above a vertical stack | Place |
| Cards beneath the header | Affordances contained by that Place |
| Code card between stacks | Cross-Place operation or service affordance |
| Card near a Place's upper edge | Loader or initializer for that Place |
| Solid arrow | Control flow / Wires Out |
| Dashed arrow | Data flow / Returns To |
| Indented or differently colored card | Conditional branch or local mode |
| `_name` card | Reference to a detached Place |
| `?`, `~`, dashed border | Tentative or unresolved item |
| Large enclosing boundary | System or responsibility boundary |

Confirm the board's legend when it contradicts these defaults.

## Translation procedure

1. Identify enclosing system boundaries and Place headers.
2. Read each Place stack in its visual order and assign stable `P`, `U`, `N`, and `S` identifiers.
3. Record stack membership in the Place column rather than inferring containment from arrows.
4. Convert solid and dashed arrows into Wires Out and Returns To.
5. Turn loaders into code affordances and connect their returned data to the affordances they populate.
6. Preserve tentative marks as explicit unknowns; do not silently promote them to known mechanisms.
7. Run the breadboard model verification matrix and list unreadable or ambiguous marks as focused questions.

The resulting tables become authoritative. Subsequent feedback changes the tables, and any visual board or Mermaid view is updated from them.
