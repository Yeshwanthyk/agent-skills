# Resume

Use to pick up prior work or say what happened in earlier sessions; why the code is built this way belongs to how's [History](../../how/SKILL.md#history) view. The complement of [pause-safely](pause-safely.md), which writes the record this playbook reads.

Return a short brief, not a transcript dump. A resume request continues the remaining work after the brief; a question about earlier sessions ends with it.

1. **Check for a capsule.** When the user supplied a complete pause capsule (relevant paths, branch, change, and next step), verify only live state (step 4) and skip history mining. When resuming from a capsule, a decision trail, or prior summaries, read [evidence-lifecycle](../references/principles/evidence-lifecycle.md) before trusting them; when you are a receiver without the working context, read [handoffs](../references/principles/handoffs.md).
2. **Set the boundary.** Before searching, state the active project and workspace, the topic if named, the time window (default: last 7 days), and the sources you will inspect. "All" means all only when the user says all. Keep the search inside the active project.
3. **Search the sessions.** Follow the [session-records contract](../references/session-records.md). Order candidate sessions by modification time, search the topic first, and read only matching sessions and the relevant message regions. Read the header, active branch, and relevant compaction or branch-summary entries. When the harness exposes no session history, report that gap. For a large corpus, parallel history mining can follow the [delegation contract](../references/delegation.md); when delegation is unavailable, continue locally and report the gap.
4. **Reconcile live state.** Check the current branch, worktree status, recent commits, relevant diffs, and any branches or review records the history names. Use the repository's configured forge integration or an installed command found in the environment; discover the forge, commands, and branch naming rather than assuming them. When a [decision trail](../references/decision-trail.md) exists, resume from its last rows.
5. **Reconcile cloud receipts** only when history or live state shows cloud agents took part. Check every referenced receipt, session, branch, or URL against its current state. A missing or inaccessible receipt is a reported gap; a summary is a lead, not proof.
6. **Brief.** Strip secrets and private context the brief does not need. Use this shape when it helps:
   - **Capsule.** A few bullets on the work and its overall state.
   - **Threads.** One line per relevant thread with its current state.
   - **Problems.** Recurring problems, when relevant.
   - **Next move.** One concrete next action.

   Cite session findings by session ID or path when exposed, and repository or review findings by their artifact. Mark unsupported claims as gaps. Leave adjacent work out unless it blocks the named topic.

Done when the requested history is reconciled with relevant live state, the brief names the resume point or answers the question, and material evidence gaps are stated.
