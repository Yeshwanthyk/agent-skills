# Runtime forensics

Use to diagnose a live runtime symptom. A supplied recording uses [trace forensics](trace-forensics.md).

Capture the symptom with the relevant profiler, logs, state inspection, or user-facing surface. Reduce large outputs to the causal path and retain a pointer to the original evidence.

Connect the observation to current source and runtime state. Distinguish the triggering event, the costly or invalid behavior, and the first divergence from the intended contract. Use bounded probes to separate competing causes. When the symptom reproduces on demand, read [fix-root-causes](../../yesh-router/references/principles/fix-root-causes.md) before choosing the probes.

Report the cause, evidence, uncertainty, and the next useful check or correction. Before stating the cause as established, read [prove-it-works](../../yesh-router/references/principles/prove-it-works.md) to judge whether the evidence carries it. Diagnosis does not authorize implementation. If the request includes a fix, continue with [diagnose's Correct step](../SKILL.md#correct).
