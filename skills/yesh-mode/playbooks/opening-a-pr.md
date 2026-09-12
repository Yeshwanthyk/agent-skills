# Opening a PR

Use only when the user asks to prepare or open a PR. A preparation-only request ends with reviewable local material.

Inspect the intended diff and base. Preserve unrelated edits and existing commit history. Create or organize commits as needed for the requested PR; do not rewrite history merely to impose a story.

Check the change with relevant repository gates. Reuse valid results for unchanged code. Use additional review when requested or when a concrete risk needs it.

Prepare a concise title and description that explain the problem, final behavior, and validation. Include tradeoffs or rollout constraints when they matter. Follow the repository's template.

Use the configured forge and current supported commands. Confirm the intended branch, base, and diff before an authorized push or PR creation. After creation, confirm the resulting PR state and return its link.

Opening a PR does not start an unattended monitor, merge it, or authorize deployment. Use [babysit](babysit.md) or [shipping](shipping.md) when the user requests that next action.
