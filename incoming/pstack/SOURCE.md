# pstack source

## Upstream

- Repository: https://github.com/cursor/plugins
- Scoped upstream tree: https://github.com/cursor/plugins/tree/efa2a531985e0a8084d36ff3cf87233be8a9f34b/pstack
- Exact source commit: `efa2a531985e0a8084d36ff3cf87233be8a9f34b`
- Commit subject: `feat(pstack): add plugin logo (#303)`
- Retrieval date: `2026-09-02T22:26:16Z`
- Retrieval method: shallow content-filtered clone followed by `git archive` at the pinned commit.

## Copied paths

The following pstack-level files and the complete skills tree were copied verbatim:

- `README.md`
- `.cursor-plugin/plugin.json`
- `LICENSE`
- `skills/**` — every file below the upstream `pstack/skills/` directory.

The copied skill tree contains 45 skill directories, 45 `SKILL.md` files, and 122 files in total. The skill directory names are:

```text
architect
arena
automate-me
blast-radius
bro
create-verification-skill
figure-it-out
how
interrogate
maintain-verification-skill
make-bot-ui
no-comments
poteto-mode
principle-boundary-discipline
principle-build-the-lever
principle-encode-lessons-in-structure
principle-exhaust-the-design-space
principle-experience-first
principle-fix-root-causes
principle-foundational-thinking
principle-guard-the-context-window
principle-laziness-protocol
principle-make-operations-idempotent
principle-migrate-callers-then-delete-legacy-apis
principle-minimize-reader-load
principle-model-the-domain
principle-never-block-on-the-human
principle-outcome-oriented-execution
principle-prove-it-works
principle-redesign-from-first-principles
principle-separate-before-serializing-shared-state
principle-sequence-verifiable-units
principle-subtract-before-you-add
principle-type-system-discipline
recall
reflect
setup-pstack
show-me-your-work
swarm
tdd
teach
technical-writing
typescript-best-practices
unslop
why
```

## Scope exclusions

Other upstream pstack paths were intentionally not copied because they are not part of the requested skill source or the pstack-level files needed to explain it:

- `agents/**`
- `assets/**`
- `automations/**`
- `docs/**`
- `.gitignore`

The manifest still points at the upstream `agents/` and logo asset; those references are preserved in the unchanged manifest, but the files are outside this import scope. In particular, `poteto-agent` and `Comment Sicko` are described by the imported README and skills but their agent definitions are not present here.

## License and attribution

`LICENSE` and `.cursor-plugin/plugin.json` identify the source as MIT-licensed. The retained license states `Copyright (c) 2026 Lauren Tan` and requires the copyright and permission notice in copies or substantial portions. The license file and attribution were retained unchanged. No imported source files were edited.
