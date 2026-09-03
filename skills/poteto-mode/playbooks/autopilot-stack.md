# Autopilot stack

Use this playbook for a queue that must become one linear reviewed stack. Owners build and verify. The operator reviews and lands. Nothing merges automatically.

1. Resolve the repository's forge once. Give each PR one owner, one branch, a standalone brief, and a decision trail. The brief names scope, acceptance, proof, time bound, and forbidden actions.
2. Run independent owners in parallel. Give dependent work the required parent state. Give every writer a distinct branch or worktree. Keep topology changes with one root owner.
3. Require each owner to build, verify the real changed behavior, clean prose, remove nonessential comments, and report its base, intended parent, and exact head SHA. Triage review automation comments with [`bugbot-triage.md`](../references/bugbot-triage.md).
4. At `STACK-READY`, run one `swarm` pass. Re-run the gates at the exact head. Exercise the changed behavior on its real surface. Audit the diff and evidence. Run the regression scenario against current trunk when the surface supports it. A verdict without live proof is not clean.
5. Append a PR only after a clean current-head verdict. The root alone sets parent branches and stack order. Rebase a child onto its exact parent tip only when the topology owner is authorized to push that rewrite.
6. Absorb trunk drift from the bottom upward. Compare patch identity after each rewrite. Re-verify a changed patch. Re-run mergeability and checks after every rewritten push.
7. Hold the stack when the operator says stop. Do not merge, enable automatic merge, close PRs, or publish a topology change without existing authorization.
8. Deliver one bottom-to-top stack with a verdict attached to every current head. Leave landing to the operator or to a later authorized `shipping` run.

## Completion

The requested linear stack has current-head verdicts, ordered dependencies, review-ready PRs, and no automatic merge. The operator can review and land it.

**Reply:** stack root and tip, ordered PRs and SHAs, verdict per link, parked items, and the action that still needs the operator.
