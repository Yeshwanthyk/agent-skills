# Status words

One state always reads the same word, in a reply and on a board. In a reply write the word in bold (`**Needs you**`); on an emphasis board write it as a pill (`[[Needs you]]`). A known word may carry short detail: `Passed 12/12`, `Failed: 3 tests`, `In progress 40%`.

| Tone | Means | Words |
| --- | --- | --- |
| error | something is wrong | Failed, Blocked, Broken, Unsafe, Rejected, Down |
| warning | look here | Needs you, Decision, Unverified, Partial, Skipped, In progress, Pending, At risk, Review, Todo, Stale, Draft |
| success | settled | Done, Passed, Observed, Fixed, Live, Recommended, Keep, Ready, Merged, Safe, Verified, Shipped, Approved, Healthy |
| danger | consequence, marked before acting | Costs money, Destructive, Irreversible |
| mode | the kind of work you understood | Brainstorm, Investigate, Preview, Implement, Qualify |
| owner | a change outside the task's own files | Owned, Shared, Foreign |
| context | how a claim is known, or a plain tag | Inferred, New, Changed, Optional |

- **Evidence.** Each claim carries **Observed** (seen on the real system), **Inferred** (reasoned from other signals, say from what), or **Unverified** (not checked). When you can run the check, run it and report the result instead of writing Unverified.
- **Asks.** **Needs you** is a step only the user can take; **Decision** is a call only the user makes. Repeat every one at the end of a long reply.
- **Ownership.** **Shared** marks a change others also pick up (global config, a shared hook); **Foreign** marks something that belongs to someone else.

## Every attention word carries its action

Follow every error, warning, and danger word, and Inferred, with the one fact the user needs, opened by a bold lead-in ending in a colon: **Check:**, **Do:**, **Next:**, **Unblock:**, **Left:**, **Run:**, **Guard:**, **Undo:**, **See:**.

| Word | Its action says |
| --- | --- |
| Unverified | the fastest check and who can run it. **Check:** reload and look at the first pill. |
| Needs you | the exact step and what it unblocks. **Do:** sign in to staging; then I can read the deploy log. |
| Decision | the options, your pick, what you do meanwhile. **Next:** I'll prepare it as a dry run. |
| Failed, Broken | the cause and the fix underway. **Next:** preparing a backfill. |
| Blocked | the smallest unblock. **Unblock:** read access to the billing repo. |
| Partial, In progress | what remains. **Left:** pricing and checkout. |
| Skipped | why, and how to run it anyway. **Run:** `bun run load` |
| At risk, Unsafe | what would break it and the guard. **Guard:** keep both columns for one release. |
| Costs money | the amount, before acting. |
| Destructive, Irreversible | what is lost and how to get it back. **Undo:** none; export first. |
| Done, Fixed, Live | optional: where to see it. **See:** the URL, file, or command. |

Keep status words out of paths, commands, code, and machine-readable output, and drop them when the user asks for plain text or an exact format.
