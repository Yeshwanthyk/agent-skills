---
name: yesh-debug
description: Diagnose failures and regressions through a red-capable feedback loop and the first contract divergence. Use when behavior is broken, inconsistent, slow, throwing, failing tests, or reproducible through logs, traces, screenshots, or runtime state.
---

# Yesh Debug

Build a **red-capable loop**, then follow it to the first **contract divergence**.

## Process

1. Anchor the exact symptom and explain why it violates expected behavior.
2. Build the tightest repeatable signal available: focused test, command, request, trace replay, runtime probe, or measured scenario.
3. Follow the failing execution path and relevant state transitions from trigger to effect.
4. At each boundary, compare the observed contract, data, ownership, state change, failure behavior, and proof against the expected behavior.
5. Locate the first divergence and trace the smallest causal chain that explains the symptom.
6. Check sibling call sites and equivalent state paths for the same causal pattern.
7. Apply the smallest coherent correction when implementation is part of the request.
8. Rerun the original signal and the representative boundary tests.

## Output

Lead with the root cause. Show the red-capable signal, direct evidence, contract divergence, causal chain, correction, verification, and remaining uncertainty.

## Completion

Complete the diagnosis when the exact symptom has a repeatable signal, the first contract divergence is evidenced, the causal chain explains the behavior, and the correction is proven at the original boundary.
