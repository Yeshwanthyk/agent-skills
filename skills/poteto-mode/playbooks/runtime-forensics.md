### Runtime forensics

**You own the diagnosis. Instrument the live process, don't theorize from source.** For "why is X leaking / spinning / slow at runtime", heap snapshots, idle-but-busy processes, intermittent glitches. The deliverable is a cited diagnosis, not a fix.

1. Capture the live signal through the matching project verifier or current harness profiling, browser, UI, CLI, or API tools. Use a CPU profile for a spinning process, a heap snapshot for a leak, or a trace for a visual glitch. If no available tool can capture the signal, report the missing capability and stop this route.
2. Reduce the artifact to the smoking gun: the function on the hot path, the retainer chain from the leaked object to a GC root, or the loop firing without input. Follow [`guard-the-context-window`](../principles/guard-the-context-window.md) when delegating large-artifact parsing and keep only the reduced finding in the main thread.
3. Prove the mechanism before believing it. Inject instrumentation via CDP eval on the running process, or hotfix the live code without reloading, to confirm the hypothesis cheaply. A plausible-but-unconfirmed cause can be wrong while the real one sits one layer over.
4. Map the finding back to source: file, symbol, the line that allocates or schedules.
5. Throughput checkpoint stays one line: `throughput checkpoint: n/a, read-only forensics`.

## Completion

The live artifact supports a source-attributed diagnosis and no unrequested fix is included.

**Reply:** the signal captured, the reduced finding, how you proved the mechanism, the source location, and artifact paths. Do not fix unless asked. Hand back to [Bug fix](bug-fix.md) or [Perf issue](perf-issue.md) once the cause is known.
