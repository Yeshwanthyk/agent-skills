# Runtime forensics

Use to diagnose a live runtime symptom. A supplied recording uses [trace forensics](trace-forensics.md).

Capture the symptom with the relevant profiler, logs, state inspection, or user-facing surface. Reduce large outputs to the causal path and retain a pointer to the original evidence.

Connect the observation to current source and runtime state. Distinguish the triggering event, the costly or invalid behavior, and the first divergence from the intended contract. Use bounded probes to separate competing causes.

Report the cause, evidence, uncertainty, and the next useful check or correction. Diagnosis does not authorize implementation. If the request includes a fix, continue with [debug](../../debug/SKILL.md).
