# Real-time Team Chat Playbook (Slack adapter example)

## What this source contains

- Real-time discussions of problems and decisions
- Incident channels where fire-drill decisions were made
- Design discussion threads where tradeoffs were debated
- Questions answered by senior engineers that didn't make it into docs
- Post-merge discussions that explain why something was revisited
- DMs (usually not searchable, scope accordingly)

Real-time team chat is frequently where decisions were made, especially for changes that did not warrant a document. It is also ephemeral: threads can be deleted, channels archived, and search quality degraded. Slack is one adapter example.

## How to search it

Chat tools vary. Identify the available chat adapter and inspect its tool schema first. If authentication or access fails, stop that category investigation and report the gap; do not invent findings.

1. **Author-bounded search.** Messages from the PR author around the PR merge date. Limits scope dramatically and often hits gold.
2. **Keyword search for the feature name and key symbols.** Include misspellings and casual phrasings.
3. **PR URL search.** Slack often links PRs when they're reviewed or discussed. Search for the PR URL (or just `/pull/<number>`).
4. **Error string search.** If the code handles a specific error, search for the error string. Incident threads often surface.
5. **Channel-scoped search.** Narrow to likely channels:
   - `#eng-*`. Engineering discussions
   - `#proj-*`. Project channels
   - `#incident-*` / `#sev-*`. Incident channels
   - Team-specific channels for the owning team
   - Design review channels
6. **Thread traversal.** When you find a relevant message, fetch the whole thread. The decision often lives in the replies.

## What good evidence looks like here

- A thread where tradeoffs were explicitly debated ("I was going to use A but B is better because...")
- An incident channel message describing the bug the code prevents
- A question from a reviewer and an authoritative answer from the author or lead
- A reference to a meeting where a decision was made
- A message from a product manager or customer-facing engineer explaining a customer ask

## Common pitfalls

- **Channel archaeology limits.** Very old messages may be gone due to retention policies. If you can't find anything before a certain date, note the retention cliff.
- **Unsearched DMs.** Many decisions happen in DMs that aren't searchable. You'll miss them; that's a known limitation.
- **Speculative jokes as "decisions."** Slack is casual. "Lol just do the thing" isn't a decision, even if it preceded the commit. Look for considered discussion.
- **Context collapse in single messages.** Without the thread, a single message often reads differently than in context. Always fetch threads.
- **Access failures.** If the chat adapter is not authenticated or permitted, stop that category investigation. Do not make up findings; report that chat was unavailable and why.

## What to return

For each relevant thread:
- Channel name
- Permalink or thread ID
- Participants
- Date range of the discussion
- The key quotes (verbatim) with attribution
- Context: what thread/incident/discussion this was part of
