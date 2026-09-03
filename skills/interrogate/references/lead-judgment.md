# Lead judgment

Filter reviewer aggression through the full repository context and stated intent.

- A hypothetical issue is not a finding until the caller or execution path makes it reachable.
- A preference is not a blocker without a concrete correctness, security, or maintenance consequence.
- Treat consensus as a signal, not proof. Verify it against the code.
- Be careful with security and correctness findings even when one reviewer raises them.
- Dismiss points that concern unchanged code, known intentional tradeoffs, or missing context.
- Keep `Act on` short enough to be useful. If it grows beyond five items, filter harder.
- Show rejected findings and reasons so the user can override the judgment.
