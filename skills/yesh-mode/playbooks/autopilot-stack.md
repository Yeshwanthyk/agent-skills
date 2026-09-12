# Autopilot for a linear stack

Use when the user requests an ordered PR stack for review. Landing is a separate request.

Use [orchestrate](orchestrate.md) for role defaults, unit ownership, and results. One coordinator owns stack topology. Writers use separate paths or worktrees and receive their exact dependency state.

Build and verify each unit against its intended parent. A separate reviewer assesses the current patch and relevant behavior. Append a PR only after the parent result exists and the unit has a supported verdict.

Record parent, base, head, and patch identity. Apply authorized topology changes from the bottom upward. Recheck affected behavior after patch or dependency changes; recheck mergeability and required checks after rewritten pushes.

Use the repository's configured forge and safe lease mechanism for authorized history rewrites. Report a topology conflict rather than having multiple owners repair it.

Finish with the ordered stack, verdicts, and unresolved gaps. Do not merge or enable automatic merge from this playbook.
