# Autonomous run

Use when the user asks to continue until an outcome is reached.

State a checkable completion condition and carry the authorized task through it. Resolve routine choices, fix failures caused by the work, and continue through relevant checks. Unrelated discoveries belong in the handoff.

Use the harness's actual wait or continuation mechanism for pending external work. Do not promise unattended execution if the runtime cannot resume the session. A stalled attempt calls for diagnosis or another justified approach, not blind repetition.

Keep a recoverable checkpoint when the work spans sessions or has meaningful partial state. Use [orchestrate](orchestrate.md) for dependent units and multiple owners.

Stop at the requested result, a user-defined limit, or a concrete blocker requiring new input or authority. Preserve partial work and explain the exact gap. Persistence does not authorize commits, PRs, merges, or unrelated fixes.
