# Agent skills

Skills for Claude Code, Codex, pi, and other agents that read `SKILL.md` folders. Each skill works on its own. [`yesh-router`](./skills/yesh-router/SKILL.md) picks a skill for each task and applies the engineering principles in [`references/principles`](./skills/yesh-router/references/principles).

## Install

The skills install with [gitgud](https://github.com/Yeshwanthyk/gitgud). Run these from outside this repo, because inside it gitgud reads the working tree instead of GitHub:

```sh
gitgud add https://github.com/Yeshwanthyk/agent-skills/tree/main/skills
gitgud update --global   # pull the latest skills
gitgud apply --global    # copy enabled skills to ~/.gitgud/skills and link them into each agent
```

`gitgud update` adds new skills as disabled. Turn them on with `gitgud enable <name> --global`, then run `gitgud apply --global` again.

## Turn on powerball mode

Powerball mode sends `yesh-router` to the agent on every turn, so each task starts with a method. Install the skills first, then set up each host.

### Claude Code

1. Build the output style from the installed router:

   ```sh
   python3 scripts/build-mode.py   # writes ~/.claude/output-styles/powerball.md
   ```

2. Link the worker subagent, so delegated steps start with the router loaded:

   ```sh
   ln -sfn "$PWD/config/agents/powerball-worker.md" ~/.claude/agents/powerball-worker.md
   ```

3. Add `"outputStyle": "powerball"` to `~/.claude/settings.json`, then restart Claude Code.

The status line segment in [`config/statusline`](./config/statusline) is optional. It shows which skills a session read.

### pi

Install the [pi-powerball](https://github.com/Yeshwanthyk/pi-powerball) extension (private repo), then restart pi:

```sh
pi install git:github.com/Yeshwanthyk/pi-powerball
```

It reads the router from `~/.pi/agent/skills/yesh-router/SKILL.md` and is on in every new session. Toggle it with `/powerball on` or `/powerball off`. To confirm it found the router, run `pi -p "/powerball status"`.

## Skills

| Skill | Use it to |
| --- | --- |
| [`architect`](./skills/architect) | Pick a target architecture from the real contracts, call paths, and state ownership. |
| [`benchmark-checklist`](./skills/benchmark-checklist) | Check a performance number before you report it or act on it. |
| [`blast-radius`](./skills/blast-radius) | Find what a change could break beyond what grep shows. |
| [`correct`](./skills/correct) | Stop a mistake agents keep repeating in a repo, with types, checks, or tests. |
| [`deep-dive-explainer`](./skills/deep-dive-explainer) | Research a topic and write it up as a long offline article. |
| [`diagnose`](./skills/diagnose) | Reproduce a bug, find the cause, and prove the smallest fix. |
| [`how`](./skills/how) | Explain how code works and why it was built that way. |
| [`interactive-explainer`](./skills/interactive-explainer) | Build an interactive HTML model of behavior or state. |
| [`interrogate`](./skills/interrogate) | Run independent adversarial reviews and merge them into one judgment. |
| [`invariants`](./skills/invariants) | Model state in Quint or Lean, then break the invariants with property tests or fuzzing. |
| [`meat-review`](./skills/meat-review) | Review a diff, branch, or PR as a short annotated reading. |
| [`motion-explainer`](./skills/motion-explainer) | Build a narrated, timeline-driven explainer, optionally rendered to MP4. |
| [`plan`](./skills/plan) | Turn a settled approach into ordered chunks with risks and proof. |
| [`recap`](./skills/recap) | Catch up on a chat: what's done, what's left, and what needs your call. |
| [`reflect`](./skills/reflect) | Pull reusable lessons out of a session. |
| [`research`](./skills/research) | Send a question to a background agent that saves a cited note in the repo. |
| [`sharpen`](./skills/sharpen) | Tighten a task before starting it, then do it. |
| [`show-me`](./skills/show-me) | Explain a topic with diagrams and focused HTML. Also writes visual PR descriptions. |
| [`structure-review`](./skills/structure-review) | Audit code structure and propose fixes backed by evidence. |
| [`swarm`](./skills/swarm) | Run parallel agents for coverage, a solution race, or a best-of pick. |
| [`unslop`](./skills/unslop) | Clean up prose, docs, PR bodies, and commits. |
| [`verification-skill`](./skills/verification-skill) | Build or fix a project skill that drives and proves one real app surface. |
| [`viz`](./skills/viz) | Render a flow, DAG, call tree, or call diff from a few lines of text. |
| [`writing-for-agents`](./skills/writing-for-agents) | Write or review docs agents read: skills, `AGENTS.md`, `CLAUDE.md`. |
| [`yesh-router`](./skills/yesh-router) | Pick the method for each task and apply the principles. |

Name a skill to run it: `/how` in Claude Code, `/skill:how` in pi, or "use how" in prose. Skills marked `disable-model-invocation: true` stay out of the agent's skill list, so reach them by name or through the router.

## Optional tools

None of these are required. A few skills call them when they are installed.

| Tool | Used by |
| --- | --- |
| [`gh`](https://cli.github.com/) | `show-me` PR workflow |
| [`calldiff`](https://github.com/tanishqkancharla/calldiff) (Node 22+) | `show-me`, `viz`, `meat-review` |
| [Quint](https://quint-lang.org/) (JDK 17+ for `quint verify`) | `invariants` |
| [Lean 4](https://lean-lang.org/) | `invariants` |

## Changing a skill

1. Edit the skill, then run `python3 scripts/check-skill-routing.py` to check links and router coverage.
2. Run `node tools/skill-map/build.mjs` to rebuild the skill map.
3. When you retire a skill, playbook, or principle, add it to `scripts/retired-names.json`.
4. Push, then run `gitgud update --global` and `gitgud apply --global`. A repo edit does not reach installed copies until you do.
5. If you changed `yesh-router`, run `python3 scripts/build-mode.py` and restart Claude Code. pi picks up the change on its own.

[`config/AGENTS.md`](./config/AGENTS.md) is the host instructions template. `python3 scripts/audit-sessions.py` reports how recent Claude Code and pi sessions used powerball.

## Credits

`research` and `writing-for-agents` are adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT). The `show-me` PR sections draw on its `pr` skill and on Dex Horthy's [humanlayer/skills](https://github.com/humanlayer/skills). The router and its playbooks draw on the [Cursor pstack plugin](https://github.com/cursor/plugins/tree/main/pstack) (MIT). The [forward implementation first](skills/yesh-router/references/principles/forward-implementation-first.md) principle draws on [Vuk97/forward-implementation-first](https://github.com/Vuk97/forward-implementation-first).
