# Feature map

Create `features/README.md` as the verification index and one Markdown file per user-facing feature.

## Index

Record:

- baseline launch and isolation preconditions;
- doctor and driving conventions;
- evidence and cleanup rules;
- every feature recipe and the user-visible behavior it covers.

Derive the initial feature set from registered routes, commands, menus, public APIs, and user documentation. Start with the primary three to five features when the surface is large. Record uncovered features rather than implying complete coverage.

## Feature recipe

Each feature file contains:

1. A title and one-sentence user-visible outcome.
2. **Behaviors**, with stable IDs for the states or actions covered.
3. **User entry points**, including every materially distinct way the user reaches the feature.
4. **Drive**, with preconditions, exact controls or commands, and the observable result of each action.
5. **Proof**, naming the artifacts and side effects that establish success.
6. **Gotchas**, limited to traps that can invalidate or waste a run.

Use user language in the map. Keep implementation locations in the verification skill or supporting notes unless the driver needs them.

## Coverage rules

- Driving one convenient entry point does not prove another listed entry point.
- Capture the initiating action and resulting state, not only the final screen.
- Verify persisted or external side effects through a read-only second view when practical.
- Record an unreachable path with the route attempted and unmet prerequisite.
- Preserve proof artifacts through teardown.
