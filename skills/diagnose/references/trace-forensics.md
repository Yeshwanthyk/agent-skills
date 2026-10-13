# Trace forensics

Use to explain a supplied recording, profile, dump, or trace. The supplied artifact is the evidence: start from it, not from a live reproduction.

Identify the format, capture conditions, and available source version. Analyze the original artifact without altering it. Locate the relevant hot path, retaining chain, scheduling pattern, or event sequence, and preserve timestamps or offsets needed to reproduce the finding. Before reporting a duration, count, or share of time from the trace, read [explain-the-number](../../yesh-router/references/principles/explain-the-number.md).

Separate what the recording directly shows from hypotheses about source or runtime behavior. Compare the capture's build version with the current source; a recording from an older build may not describe the current implementation, so name the drift. When the trace pins a failure you can also reproduce, read [fix-root-causes](../../yesh-router/references/principles/fix-root-causes.md) before naming its cause.

Return the finding, artifact locations, and limits. Request a new capture only when a missing observation prevents the answer; leave a supplied artifact's workload unrun by default.
