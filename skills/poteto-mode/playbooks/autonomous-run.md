### Autonomous run

**You own the exit condition. Define done, then drive as far as the available runtime can sustain.** Use this for "going to bed" or "run until done" requests. Never promise unattended continuation when the harness cannot resume or notify this session.

1. State the exit condition as a checkable predicate before the first iteration (tests green, repro fixed, all N PRs merged, pixel-diff zero). A vague goal stalls; a predicate lets you stop.
2. Pick the wake mechanism from live harness capabilities. Use a managed background watcher for an event such as CI, a merge, or a ref advancing. Use a bounded background terminal or explicit check interval when no event watcher exists. If the harness cannot resume unattended work, run only the bounded iterations it can complete and report the limitation instead of promising a future wake-up.
3. Each iteration makes the smallest change the evidence justifies, verifies it against the predicate, commits if it advanced, discards changes that didn't help. Belt-and-suspenders that "might help" gets reverted, not left to ride.
   Follow [`sequence-verifiable-units`](../principles/sequence-verifiable-units.md), verifying each unit before the next instead of batching checks at the end.
4. Mid-run discoveries are yours. Address broken skills, related bugs, flaky verifiers, review noise, tooling failures, orphaned follow-ups, and fixable drift yourself via poteto-mode. Put out-of-band fixes in their own PR. Do not park reversible work for the human. Ask only about irreversible actions, genuine product or preference calls no experiment can settle, or a real dead end. Keep the predicate as the main drive, and return to it after each side fix.
5. Checkpoint every iteration via the **show-me-your-work** skill, a row for what changed and whether the predicate moved. A run with no trail can't be audited or resumed.
6. Stop when the predicate is met. A plateau is not a stop, so keep going and pivot your approach to push past it. Surface a genuine dead end rather than spinning, and never relax the predicate to declare victory.

## Completion

The stated exit predicate is met, every iteration has evidence, and the final state is reported.

**Reply:** the exit condition, iterations run, what landed, what was discarded, final predicate state.
