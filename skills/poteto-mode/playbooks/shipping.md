# Shipping

Use this playbook after `babysit` reaches merge-ready, or when the user explicitly asks to land, ship, or enable merge when ready. It performs the irreversible publication step only under existing user authorization.

1. Resolve the repository's forge once. Read current help for view, checks, merge, and automatic-merge commands. Use one forge consistently.
2. Freeze the bottom-to-top PR list. Assign one read-only verifier to each PR. A verifier must not have written the code. Each verifier compares the changed path with its parent and exercises the real changed behavior.
3. Accept only `PASS` or `PASS+NOTES` with evidence. CI green is an input, not a behavioral verdict. A missing live check fails the PR.
4. Walk upward from the lowest unmerged PR. Stop at the first PR without an independent passing verdict. A passing PR above a gap is not landable.
5. Record each verdict head SHA, base SHA, and stable patch identity. Re-verify when the patch changes. Re-run mergeability and checks when only the head changed.
6. Prepare only the lowest verified PR. Fetch current trunk. Rebase it when authorized. Push the rewrite only with the repository's safe lease mechanism. Retarget only that PR to trunk. Recheck its verdict and checks.
7. Merge one PR at a time through the resolved forge. Arm automatic merge only when the user explicitly requested it. Wait for the merge before preparing the next PR.
8. After each merge, fetch trunk and confirm the merged commit is present. Drop that PR from the frozen list. Inspect the next PR's base, head, checks, and patch identity. Repeat the verification gate.
9. Watch the current frontier without changing queue topology. Diagnose a stall before changing anything. Stop at the first unverified or blocked PR.

## Completion

Only the contiguous independently verified run within user authorization is landed. The next gap, its proof requirement, and any unresolved risk are reported.

**Reply:** verified run and ceiling, verifier per PR, head and patch identity, merge actions, what landed, and what the next gap needs.
