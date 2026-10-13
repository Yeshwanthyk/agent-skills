# Recap

Use when the user asks to be caught up on this chat: what happened since their last message and what waits on them. Earlier sessions belong to [resume](resume.md).

Keep the turn read-only. Change no code, start no job, and post nothing to build the recap.

1. **Set the window.** Start from the last message the user wrote. Subagent results, task notifications, and hook output are not their messages. Assume they remember that message and nothing after it.
2. **Gather.** Collect your own work since then, subagent reports, and anyone else's messages in the chat. Check the live state of each PR, CI run, branch, or agent the chat touched, and note which are still running and which you could not check.
3. **Find action items.** An action item is a decision or step only the user can take: a product choice, an approval, an irreversible action, or access you lack. Include any still waiting from before their last message. Work you can still do yourself is not an action item.
4. **Write the recap** in [unslop's plain mode](../../unslop/SKILL.md#plain-mode-explicit-request). Name each PR, branch, or agent the way the user would, not by a label invented during the work.
   - Open with one sentence giving the number of action items, or that there are none. When nothing happened and nothing waits, say so and stop.
   - Then what happened, most important first: each result and what it means for the user. Skip steps that changed nothing. Name in one line any work left that you can do yourself.
   - Then one short brief per action item: the decision, why it matters now, the options and what each costs, your recommendation, and what happens if the user does not answer. Say which parts you do not know. Write it so the user can decide without opening the linked detail.
   - When a before and after makes a choice clearer, show it with [show-me](../../show-me/SKILL.md) from artifacts that exist: a screenshot you captured, a diff, a table of measured numbers. Link only artifacts that exist.

Done when every result since the window opened is accounted for, each touched PR, run, or agent has a checked state or a stated gap, and every action item carries a recommendation.
