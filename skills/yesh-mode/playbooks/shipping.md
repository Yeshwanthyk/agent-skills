# Shipping

Use when the user asks to land or merge specified work. Merge-ready status alone does not activate this playbook.

Confirm the authorized PRs, target branch, and configured forge. For a stack, establish the bottom-to-top order. Review and verification must cover the relevant changed behavior; use an independent reviewer with the [shared role defaults](../references/agent-routing.md) for consequential implementation changes. A missing required check is a blocker. Documentation does not require an unrelated live application test.

Attach verdicts to the head, base, and changed patch. Recheck affected evidence when the patch or its dependencies change. A rewrite with an unchanged patch still needs current mergeability and required checks.

Land only the lowest ready PR in a contiguous verified stack. Prepare or retarget its branch only within the granted authority. Use safe leases for authorized rewritten pushes. Merge through the forge, then confirm the merge on the target branch before advancing.

Enable automatic merge only when requested. Stop at the first failed or unverified dependency. Diagnose ambiguous results before repeating an external action.

Report what landed, the supporting verdicts, and the next blocker. Merge authority does not include deployment or unrelated PRs.
