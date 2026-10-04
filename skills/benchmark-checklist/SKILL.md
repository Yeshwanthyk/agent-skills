---
name: benchmark-checklist
description: Vet a performance number before reporting or acting on it. Use when you benchmark, claim a speedup or regression, build a perf harness, or choose between options by speed.
---

# Benchmark checklist

Use before you report or act on a performance number: a before/after, a regression claim, a hillclimb harness, or a library or configuration choice. The [explain-the-number principle](../yesh-router/references/principles/explain-the-number.md) says why. Answer each question with evidence from a run, not a guess from reading code.

For a quick ballpark the user asked for, one run is enough. Still check questions 4 and 7 and say it is one run. A choice between options is never a ballpark.

## Before running

- Write the claim you expect to make, in the words you would ship: "export is 30% faster at p50 on the 60k-row dataset." The questions test that sentence.
- Read the measurement script. Note what it times, what it counts, and what it ignores.
- Check load and cores: `uptime`, then `nproc` (Linux) or `sysctl -n hw.ncpu` (macOS). If the machine is busy, find out what is running. If you cannot stop it, interleave the sides so both see the same noise, and say so.

## The questions

1. **Why not double?** Name the limiter. Profile in a run you do not report, because profilers slow the work. Use per-process CPU (`top`, `pidstat`), a runtime profiler (`node --cpu-prof`, `py-spy`, `perf`, Instruments or `sample` on macOS), I/O wait, and syscall counts (`strace -c` on Linux, `dtruss` on macOS). Map the hot spot to source. Watch the load generator too: if it saturates first, you measured the load generator. If a change did not move the number, the limiter explains why; find it before calling the change useless.
2. **Was it tuned?** Run every side the way production runs it: release builds, production flags and env, batching and transaction settings, connection pools, cache warmth, same versions and data. If one side runs on defaults, you compared configurations, not implementations. A limiter that is a setting (a commit per row, a debug build, a missing index) means that side is untuned. Tune it and measure again before picking a winner.
3. **Did it break limits?** Do the arithmetic. Compare bytes per second with disk and network bandwidth, and operations per second times cost per operation with available cores. Compare time saved with the time the changed piece took: removing a piece that takes 10% of the run can make it at most about 11% faster. A result past a limit measured something other than the work, such as a cache, a no-op, or a bug.
4. **Did it error?** Count failures and non-success responses, and check outputs are correct, not just present. Rejections are often fast; timeouts and retries are slow. If the script does not count errors, add the count.
5. **Does it reproduce?** Run each side at least 5 times, alternating A, B, A, B so warmup, lazy initialization, caches, and drift do not favor one side. Report median and range. A gap smaller than run-to-run variation is no measurable difference. When the call is close, use a rank-sum test or the harness's own statistics.
6. **Does it matter?** Beside any micro result, measure the end-to-end path a user waits on, with realistic data sizes and concurrency. Report the micro result as a share of the whole. A helper taking 1% of a request can make the request at most 1% faster.
7. **Did it even happen?** Confirm the work ran inside the timed region: the request reached the server, the rows were written, the bytes were read, the result was used. Generators nobody iterates, promises nobody awaits, results the JIT discards, and timeouts all produce numbers for work that never happened.

## Report

- Lead with the verdict: faster, slower, no measurable difference, or inconclusive.
- Give the number with unit, run count, range, and limiter: "p50 41 ms → 33 ms, median of 7 runs per side, range 32–35 ms after, bound by JSON parsing on one core."
- Call it inconclusive when you claim a difference but cannot name the limiter, a side ran untuned, or questions 4 and 7 went unchecked. Name the gap.
- Keep a PR body to one primary number. Put runs, range, and limiter evidence in a linked artifact or notes file.

## Where it fits

The [perf-issue](../yesh-router/playbooks/perf-issue.md) playbook finds and fixes slowness; this skill vets its baseline and every later number. The [hillclimb](../yesh-router/playbooks/hillclimb.md) playbook loops on one metric; this skill vets its harness before it is frozen.

## Completion

Done when the claim has a verdict, a number with unit, run count, range, and named limiter, and every question either answered with run evidence or named as the gap that makes the verdict inconclusive.
