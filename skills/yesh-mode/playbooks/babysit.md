# Babysit a PR

Use for PR status, review handling, or driving a PR to merge-ready.

Match the request. A status question is one read-only check. A monitoring request owns the wait. A request to fix blockers authorizes relevant code work, but posting replies, resolving threads, pushing, and merging need the corresponding user authority. A request for status alone supplies none of it.

Read the current head, base, checks, review state, and mergeability from the configured forge. For a stack, focus mutations on the lowest blocked unit and keep topology under one owner. Avoid competing writers.

Treat review comments as claims to investigate. Use [review triage](../references/bugbot-triage.md) to separate real faults from unsupported suggestions. Make in-scope corrections and verify them. If replies are authorized, cite the actual correction or evidence before resolving a thread.

Classify a failing check before retrying. An unchanged failure needs diagnosis; an infrastructure retry needs evidence and a bounded attempt. Re-read state after a push.

Use the available watcher for pending checks when monitoring is requested. Report a runtime limit rather than promising a future wake-up.

Stop at the requested status or merge-ready state. This playbook does not merge or change stack topology. Report blockers, completed actions, and the current forge state.
