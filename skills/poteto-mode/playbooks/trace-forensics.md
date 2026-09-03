### Trace forensics

**You own the diagnosis from the artifact. Load it, shape it, narrow to the cause, attribute to source.** For a dropped `.cpuprofile`, `Trace-*.json.gz`, `Spindump.txt`, or `.heapsnapshot` paired with "why is this slow / unresponsive / leaking / crashing".

Distinct from [Runtime forensics](runtime-forensics.md), which instruments the live process. Here the capture already exists. Treat the artifact as a fixed dataset and do not rerun it. Keep tooling generic so the playbook stays portable.

1. Identify the format and load it with the right tool. Follow [`guard-the-context-window`](../principles/guard-the-context-window.md) when delegating large-artifact parsing and keep only the reduced finding in the main thread.
2. Transform the raw artifact into a form you can query. Dump the trace or heap snapshot into sqlite, one row per sample, frame, or node. Reach the queryable shape before you read.
3. Narrow to the cause. Query for the frames that hold the most time and walk the call tree to the hot path. For a leak, follow the retainer chain from the leaked object to a GC root. For a spindump, find the thread stuck on-CPU or blocked and its wait reason.
4. Attribute to source. Map the hot frame to file, symbol, and line via the artifact's own symbols. A frame with no source mapping is not yet a diagnosis; resolve the symbols, or say plainly the artifact does not carry them.
5. Confirm against a paired capture when you have one. Diff a before and after artifact so the attribution is the real regression, not background noise. Without one, mark the finding as the strongest hypothesis the artifact supports, not a confirmed cause.
6. Hand back a cited diagnosis, with no fix unless asked. Route to [Bug fix](bug-fix.md) or [Perf issue](perf-issue.md) once the cause is known. Throughput checkpoint stays one line: `throughput checkpoint: n/a, read-only forensics`.

## Completion

The supplied artifact is parsed, the cause is source-attributed or marked unproven, and no unrequested fix is included.

**Reply:** the artifact and format, the reduced finding, the source location, the artifact paths, and whether a paired capture confirmed it.
