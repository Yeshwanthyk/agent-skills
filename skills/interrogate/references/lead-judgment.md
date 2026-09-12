# Lead judgment

Filter reviewer aggression through the full repository context and stated intent.

- A hypothetical issue is not a finding until the caller or execution path makes it reachable.
- A preference is not a blocker without a concrete correctness, security, or maintenance consequence.
- Treat consensus as a signal, not proof. Verify it against the code.
- Be careful with security and correctness findings even when one reviewer raises them.
- Dismiss unrelated pre-existing issues. Keep a regression in unchanged code when the reviewed change invalidates its assumptions or makes the failure reachable. For whole-design reviews, the requested boundary defines the scope rather than a diff.
- Check missing context and intentional tradeoffs before judging a claim. Rank real issues by consequence; a fixed finding quota must not hide them.
- Show rejected findings and reasons so the user can override the judgment.
