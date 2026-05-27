# agent-skills

Installable Agent Skills for Claude Code, Codex, and Pi.

## Install

Clone the repo, choose a target skills directory, then copy either one skill or all skills.

```sh
git clone https://github.com/Yeshwanthyk/agent-skills.git
cd agent-skills

# Claude Code
export SKILLS_DIR="$HOME/.claude/skills"

# Codex
# export SKILLS_DIR="$HOME/.codex/skills"

# Pi
# export SKILLS_DIR="$HOME/.pi/agent/skills"

mkdir -p "$SKILLS_DIR"
cp -R stateful-systems "$SKILLS_DIR/"
```

Install every skill in this repo:

```sh
find . -mindepth 2 -maxdepth 2 -name SKILL.md \
  -exec sh -c 'mkdir -p "$1"; cp -R "$(dirname "$2")" "$1/"' sh "$SKILLS_DIR" {} \;
```

Each installable skill is a top-level directory containing `SKILL.md`.

## Skills

| Skill | Use |
| --- | --- |
| [`code-simplifier`](./code-simplifier) | Simplify recently modified code while preserving behavior. |
| [`context-explorer`](./context-explorer) | Generate interactive context and token-usage explorers from agent transcripts. |
| [`frontend-design`](./frontend-design) | Build distinctive production-grade frontend interfaces. |
| [`interactive-system-explainer`](./interactive-system-explainer) | Generate self-contained interactive HTML explainers for technical systems. |
| [`interface-design`](./interface-design) | Design dashboards, admin panels, apps, tools, and interactive products. |
| [`librarian`](./librarian) | Cache and refresh remote git repositories for reuse. |
| [`mission`](./mission) | Keep long-running coding work aligned while handling side quests. |
| [`park`](./park) | Capture deferred ideas and future implementation notes in `NEXT.md`. |
| [`review-export`](./review-export) | Generate shareable HTML code review documents from git diffs. |
| [`skill-writer`](./skill-writer) | Write Agent Skills and `SKILL.md` files. |
| [`stateful-systems`](./stateful-systems) | Model and build lifecycle/state-machine-driven systems. |
| [`thermo-nuclear-code-quality-review`](./thermo-nuclear-code-quality-review) | Run a strict maintainability review for abstraction quality and spaghetti growth. |
| [`ui-skills`](./ui-skills) | Apply opinionated constraints for better agent-built interfaces. |
| [`visual-explainer`](./visual-explainer) | Generate self-contained visual explanations of systems, plans, and data. |

## External Not Owned Skills

These skills live outside this repo and can be installed via [`gitgud`](https://github.com/yeshwanthyk/gitgud):

| Skill | Source | Install |
| --- | --- | --- |
| `breadboard` | [rjs/shaping-skills](https://github.com/rjs/shaping-skills) | `gitgud install breadboard --source rjs/shaping-skills` |
| `shaping` | [rjs/shaping-skills](https://github.com/rjs/shaping-skills) | `gitgud install shaping --source rjs/shaping-skills` |
| `framing-doc` | [rjs/shaping-skills](https://github.com/rjs/shaping-skills) | `gitgud install framing-doc --source rjs/shaping-skills` |
| `kickoff-doc` | [rjs/shaping-skills](https://github.com/rjs/shaping-skills) | `gitgud install kickoff-doc --source rjs/shaping-skills` |
| `impeccable` | [impeccable.style](https://impeccable.style/) | `gitgud install impeccable --source https://impeccable.style/` |
| `grill-with-docs` | [mattpocock/skills](https://github.com/mattpocock/skills) | `gitgud install grill-with-docs --source mattpocock/skills` |
| `improve-codebase-architecture` | [mattpocock/skills](https://github.com/mattpocock/skills) | `gitgud install improve-codebase-architecture --source mattpocock/skills` |
| `make-interfaces-feel-better` | [jakubkrehel/make-interfaces-feel-better](https://github.com/jakubkrehel/make-interfaces-feel-better) | `gitgud install make-interfaces-feel-better --source jakubkrehel/make-interfaces-feel-better` |

## License

MIT
