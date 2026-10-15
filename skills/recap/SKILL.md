---
name: recap
description: "On request, play back the user's goal in your own words and catch them up on this chat since their last message, read-only: what happened, in a few plain sentences and small visuals, plus the calls only they can make."
disable-model-invocation: true
---

# Recap

Play back what the user is after, then catch them up on this chat since the last message they wrote. Earlier sessions belong to [resume](../yesh-router/playbooks/resume.md).

Keep the turn read-only. Change no code, start no job, and post nothing; the only things you make are visuals for the reply, built from what you already have.

## Gather

1. **Set the window.** Start from the last message the user wrote. Subagent results, task notifications, and hook output are not their messages. Assume they remember that message and nothing after it.
2. **Name the goal.** Work out what the user is trying to achieve and the problem behind it, from their own messages, not from the plan you made.
3. **Collect** your own work since then, subagent reports, and anyone else's messages in the chat. Check the live state of each PR, CI run, branch, or agent the chat touched, and note which are still running and which you could not check. Check each number you will show against its source, and say so when you correct one.
4. **Find action items.** An action item is a decision or step only the user can take: a product choice, an approval, an irreversible action, or access you lack. Include any still waiting from before their last message. Work you can still do yourself is not an action item, and a call made up to fill the reply is not one either.

## Write

Write in [unslop's plain mode](../unslop/SKILL.md#plain-mode-explicit-request), like one person catching up another. Keep the reply under 150 words, not counting visuals; when words run short, cut from what happened before you cut from the action items. Say what changed for the user, not how you did it: "the tests pass", not "CI is green". Leave out hashes, paths, commands, build numbers, and test counts unless the user needs one to act. Name each PR, branch, or agent the way the user would. Give each fact once, in text or in a visual.

1. **Goal.** One sentence, in your own words: what the user is after and the problem it solves. This is where they catch a misread. Before any work has happened, the goal and any open questions are the whole reply.
2. **Count.** One sentence giving the number of action items, or that there are none. When nothing happened and nothing waits, say so and stop.
3. **What happened.** Visuals first, then one short bullet per thing the user asked for: what came of it, and whether it is done, still running, failed, or not checked. Write each line the way you would say it out loud ("Search was slow from a missing index", not "Search: done"), and make each line true when read alone. Name any bug found and fixed on the way. Never mark something done that still waits on the user. Then name in one line any work left that you can do yourself.
4. **Action items**, as plain bullets. Give each two lines: the call with your recommendation and why, then what happens if the user does not answer. Put any step that must come first, and anything that cannot be undone, in the recommendation. Write "unknown" for a part you do not know, and link to the detail. An irreversible step the user did not ask for gets one line.
5. **Choices.** After the list, show each choice's options side by side, beside the current state when there is one, with what each option gets the user and what it costs.

## Show

A visual is a picture: a screenshot, a video, or a diagram or chart from [show-me](../show-me/SKILL.md). A Markdown table or a status list is not a visual. Draw one when a change is easier seen than read: how a design works, a PR chain with each PR's state, a before and after of a fix, or options side by side.

- Keep each visual readable at a glance: at most six boxes, at most eight words in each, labels a person would say.
- Embed screenshots and videos inline when the change is visible. A visible change with none gets "No screenshot yet" on its line and a sentence on what changed on screen.
- Build visuals only from artifacts that exist: a screenshot you captured, a real diff, measured numbers. Link only artifacts that exist.

Where the host renders HTML inline, put the visuals on one page and keep the text in the reply, without restating the page.

## Done

The goal is played back, every result since the window opened is accounted for, each touched PR, run, or agent has a checked state or a stated gap, and every action item carries a recommendation and what happens without an answer.
