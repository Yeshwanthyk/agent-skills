---
name: blast-radius
description: Investigate what a change could break beyond its diff and grep results, then prove one or two safety facts with real code. Use for /skill:blast-radius, risky changes, or untrusted small diffs.
---

# Blast radius

Find what a change breaks somewhere else before it ships. Use this for a blast-radius request, a question about what a change could break, or a small diff you do not trust yet.

Companion to [`how`](../how/SKILL.md) and [`why`](../why/SKILL.md). How tells you what the code does. Why tells you why it is shaped that way. Blast radius tells you what it breaks somewhere else.

The job is not to list callers. Grep can do that. The job is to find the breakage grep will not show you and prove the facts that matter.

## Do not trust the writeup

A blast-radius writeup that sounds right is worthless. It reads as convincing whether or not it is true, and that is the trap. Find the one or two facts the conclusion depends on and prove them by running code. Words are where you start. Evidence is what you hand back.

## How sure are you

For each safety fact, get it as far down this list as is cheap and say where it stopped.

1. You said so. Worthless on its own.
2. You pointed at the line. Cite a real `file:line` or the library's own source.
3. You showed the bad case cannot happen. Walk the failure step by step and show that it does not reach the changed boundary.
4. You ran it. Use a script or test that calls the real code and fails loudly if the fact is wrong.
5. You reproduced it in the running app.

Any safety fact that stops before step 4 is unproven. Say so. Step 4 is usually one small script that imports the same library the app ships and calls the exact function under question.

## Steps

1. Read the change. Inspect the diff, the symbols it adds, changes, and deletes, and what it now does differently. Include behavior the diff does not spell out. Use the second step of [`why`](../why/SKILL.md) to pull the relevant history when it matters.
2. Find the one or two facts it is safe because of. Most changes that look scary are safe because of a small number of facts, such as a call that only drops already-dead cache entries and does nothing else. Find those facts. If they hold, most scary cases die at once. Spend time here instead of writing a long list of maybes.
3. Look where grep stops. Read the source of the library you call. Check its pinned version and any local patch. Work out when things run, including microtasks, mount and teardown, and framework lifecycle behavior. Follow what a symbol search misses, such as the JSON an API returns, a database column, a wire format, another language reading the same bytes, a feature flag, or code several hops downstream.
4. Be honest about each risk. Give it a real chance of happening and a real cost if it does. Keep confirmed risks. List checked and cleared risks separately. Cite a real `file:line`. A search that finds nothing is still an answer. Never make up a caller or an API.
5. Prove the one or two safety facts. Write a script or test that runs the real code, run it, and preserve what happened. If you cannot prove a fact cheaply, mark it unproven. Do not round up.
6. For a big or wide change, run it through [`arena`](../arena/SKILL.md). Ask several candidates the same question and merge the answers. Different perspectives can catch different real bugs. Keep Arena's base selection and grafting contract.

## What to hand back

- **What it does.** What changed, including the part that is not obvious.
- **The safety facts.** State each fact, say which step it reached, and show the proof. Mark any fact that stopped before step 4 as unproven.
- **Risks.** Include only real risks. For each one, name how it breaks, the `file:line`, how likely and how bad it is, and how to check it. Paste the proof for risks that matter.
- **Cleared.** State what you checked and why it is fine.
- **Before you merge.** Give the cheapest test or repro that catches the real bug, including any script you wrote.

Write plainly. Strip private material before sharing the report. Keep claims calibrated to the evidence and leave unresolved facts open.

## Completion

The investigation is complete when the changed behavior and beyond-grep paths are traced, every material risk is classified as real or cleared, each safety fact has an evidence rung, and the report includes executable proof or an explicit unproven result.

**Reply:** the writeup above, with each safety fact either proven or marked unproven.
