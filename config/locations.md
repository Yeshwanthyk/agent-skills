# Locations

- Skills source: `~/Documents/personal/agent-skills`. Installed copies live in `~/.gitgud/skills`, linked into `~/.claude/skills` and `~/.pi/agent/skills`. After pushing, run `gitgud update --global` and `gitgud apply --global` from outside the repo; inside it, gitgud reads the working tree and can fail on stale frontmatter.
- Skill map of every skill, playbook and principle link: `node tools/skill-map/build.mjs` in that repo.
- Session logs: Claude Code, including T3 Code threads, in `~/.claude/projects/*/*.jsonl`; Pi in `~/.pi/agent/sessions/`.
- Pi models and defaults: `~/.pi/agent/settings.json`.
