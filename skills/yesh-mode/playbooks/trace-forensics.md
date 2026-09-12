# Trace forensics

Use to explain a supplied recording, profile, dump, or trace.

Identify the format, capture conditions, and available source version. Analyze the original artifact without altering it. Locate the relevant hot path, retaining chain, scheduling pattern, or event sequence, and preserve timestamps or offsets needed to reproduce the finding.

Separate what the recording directly shows from hypotheses about source or runtime behavior. A recording from an older build may not describe the current implementation.

Return the finding, artifact locations, and limits. Request a new capture only when a missing observation prevents the answer; do not rerun a supplied artifact's workload by default.
