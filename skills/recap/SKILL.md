---
name: recap
description: "On request, catch the user up on this chat since their last message, read-only: what happened and what it means, in plain text with visuals, plus a brief for each decision only they can make."
disable-model-invocation: true
---

# Recap

Catch the user up on this chat since the last message they wrote. Earlier sessions belong to [resume](../yesh-router/playbooks/resume.md).

Keep the turn read-only. Change no code, start no job, and post nothing; the only things you make are visuals for the reply, built from what you already have.

## Gather

1. **Set the window.** Start from the last message the user wrote. Subagent results, task notifications, and hook output are not their messages. Assume they remember that message and nothing after it.
2. **Collect** your own work since then, subagent reports, and anyone else's messages in the chat. Check the live state of each PR, CI run, branch, or agent the chat touched, and note which are still running and which you could not check.
3. **Find action items.** An action item is a decision or step only the user can take: a product choice, an approval, an irreversible action, or access you lack. Include any still waiting from before their last message. Work you can still do yourself is not an action item.

## Write

Write in [unslop's plain mode](../unslop/SKILL.md#plain-mode-explicit-request). Name each PR, branch, or agent the way the user would, not by a label invented during the work.

- Open with one sentence giving the number of action items, or that there are none. When nothing happened and nothing waits, say so and stop.
- Then what happened, most important first: each result and what it means for the user. Skip steps that changed nothing. Name in one line any work left that you can do yourself.
- Then one short brief per action item: the decision, why it matters now, the options and what each costs, your recommendation, and what happens if the user does not answer. Say which parts you do not know. Write it so the user can decide without opening the linked detail.

## Show

Text explains; visuals show what text would make the user reconstruct. Use [show-me](../show-me/SKILL.md) for each:

- the state of what the chat touched (PRs, runs, branches, agents) as one table;
- each action item as a before and after side by side, or the current state beside each option;
- a diff, a table of measured numbers, or a diagram when a result is easier seen than read.

Build visuals only from artifacts that exist: a screenshot you captured, a real diff, measured numbers. Never invent a number or draw a screen you did not capture; when no visual exists, say so. Where the host renders HTML inline, put the visuals on one page and keep the explanation and the briefs in the reply, without restating the page.

## Done

Every result since the window opened is accounted for, each touched PR, run, or agent has a checked state or a stated gap, and every action item carries a recommendation and its visual or a stated reason it has none.
