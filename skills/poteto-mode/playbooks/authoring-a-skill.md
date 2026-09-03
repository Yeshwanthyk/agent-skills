# Authoring or modifying a skill

Use this playbook when you create or edit a `SKILL.md` or a skill reference.

1. Read `writing-for-agents/SKILL.md` and `SKILL-MECHANICS.md` from the active skill installation. Read the target skill and every reference it reaches.
2. State the skill's user, trigger, invocation mode, and completion result. Choose model invocation only when autonomous discovery or cross-skill reuse earns its context cost. Otherwise set `disable-model-invocation: true`.
3. Separate steps from reference. Keep the steps in `SKILL.md`. Move branch-specific detail into a local reference only when a pointer names the branch that reaches it.
4. Write the smallest complete workflow. Give every step a checkable completion criterion. Route to canonical skills instead of copying their procedures.
5. Validate frontmatter, names, descriptions, relative links, and required sections. Use an executable check when the structure permits it.
6. Read the finished files as an agent would. Remove stale facts, repeated meaning, weak triggers, and instructions that the runtime already enforces.
7. Run the smallest relevant check. Record the command and result.
8. Run `opening-a-pr` after the skill change. It prepares publication only when the user has authorized that external action.

## Completion

The skill has valid frontmatter, resolved local links, clear invocation behavior, complete steps, and a passing structural check.

**Reply:** summary of the skill, its invocation choice, key decisions, and validation result.
