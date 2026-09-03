# Autopilot full

Use this playbook for a queue of independent PRs that the user has authorized the owner to merge. One owner carries each PR from build to merge. The root independently verifies every merge-ready head.

1. Mark operator-owned items. They stop at merge-ready. State the protocol and wait for explicit permission before execution when the user asks for a plan.
2. Resolve the repository's forge once. Give each PR one owner, one branch, a standalone brief, and a decision trail. The brief names scope, acceptance, proof, time bound, and forbidden actions.
3. Run independent owners in parallel. Give dependent work the required parent state. Give every writer a distinct branch or worktree. Serialize shared files and topology changes.
4. Require each owner to build, verify the real changed behavior, clean prose, remove nonessential comments, rebase onto current trunk, and report the exact head SHA. Triage review automation comments with [`bugbot-triage.md`](../references/bugbot-triage.md). Do not let an owner merge before the root verdict.
5. At each merge-ready head, run one `swarm` pass. Re-run the gates at that SHA. Exercise the changed behavior on its real surface. Audit the diff and evidence. Run the regression scenario against current trunk when the surface supports it. A verdict without live proof is not clean.
6. Accept a verdict only for the exact current head. If trunk moves, compare the stable patch identity. Re-verify when the patch changed. Re-run mergeability and checks after any rewritten push.
7. On a clean verdict and existing merge authorization, the owner merges through the resolved forge. The owner then takes the next independent queue item. Operator-owned items remain waiting for the user's action.
8. Run a durable audit tick for long queues. Re-read this playbook and the standing objective. Probe each owner through the managed runtime. Count commits, pushes, PR changes, check changes, and stored reports as progress. Replace a stuck lane instead of waiting for a polite response.
9. Stop all owners on the user's hold or stand-down. Treat the order as zero writes until the user releases it.

## Completion

Every authorized queue item has a clean current-head verdict and is merged. Operator-owned items remain at merge-ready. Every worker has a terminal report.

**Reply:** queue, owner, state, head SHA, verdict, merged items, next items, open authorization gates, and decision-trail paths.
