# Locations

- Skills source: `~/Documents/personal/agent-skills`. Installed copies live in `~/.gitgud/skills`, linked into `~/.claude/skills` and `~/.pi/agent/skills`. After pushing, run `gitgud update --global` and `gitgud apply --global` from outside the repo; inside it, gitgud reads the working tree and can fail on stale frontmatter.
- Skill map of every skill, playbook and principle link: `node tools/skill-map/build.mjs` in that repo.
- Session logs: Claude Code, including T3 Code threads, in `~/.claude/projects/*/*.jsonl`; Pi in `~/.pi/agent/sessions/`.
- Pi models and defaults: `~/.pi/agent/settings.json`.
- Pi powerball extension (the toggle that puts yesh-router in the system prompt, plus the todo tool and the worker contract for child agents): its own repo, `github.com/Yeshwanthyk/pi-powerball`, checked out at `~/code/personal/pi-powerball`. Install with `pi install git:github.com/Yeshwanthyk/pi-powerball`, or for local development list the checkout path under `packages` in `~/.pi/agent/settings.json`. Claude Code gets the same mode from `config/agents/powerball-worker.md` and `config/statusline/`.
- Global git hooks: `~/.config/git/hooks/dispatch` (set via `git config --global core.hooksPath`); every hook name symlinks to it. It APFS-clones `node_modules` from the main checkout into each new worktree, then runs the repo's own `.git/hooks/<name>` so husky and similar keep working. Undo with `git config --global --unset core.hooksPath`.
