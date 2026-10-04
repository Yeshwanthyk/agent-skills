# Explain the number

**Read when:** you are about to trust, report, or act on a measured number: a speedup, regression, throughput, latency, or eval result.

- A run that went wrong still prints a plausible number. Failed requests, skipped or cached work, code that never ran, a side left on defaults, and noise all look fine. If you cannot say why the number is not twice as good, you do not know what you measured.
- Ask "why not double?" Name the resource or code path that bounds the result (a core, a lock, the disk, the network, the load generator) from a profile or system counters taken during a run, then map it to source. A guess from reading code is not a limiter.
- List what else the number could be measuring and rule out each with evidence: errors, skipped or cached work, an untuned side, noise, a piece too small to matter end to end.
- Keep the run count, spread, and limiter with the number, in notes or a linked artifact, so a reader can check it.
- For a performance number, run the [benchmark checklist](../../../benchmark-checklist/SKILL.md). For an eval result, ask the same of the trials: did every run do the task, does the gap hold across trials and models, does the scenario matter.

You skipped this when a number has no run count, no spread, or no named limiter, or when the time saved exceeds the time the changed piece took.

**Limits:** checking that an output is real, not that a number means what you say, is [prove-it-works](prove-it-works.md).
