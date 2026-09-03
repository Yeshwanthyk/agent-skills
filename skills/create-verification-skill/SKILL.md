---
name: create-verification-skill
description: Generate and prove a project-local Pi skill that drives one real application surface. Use when the user requests a verification skill or active Poteto Mode finds no real-surface verifier.
---

# Create Verification Skill

Create `.pi/skills/verify-<app>/` so a future agent can launch, inspect, drive, and prove one application surface without prior conversation context.

## Discover the verification contract

Inspect the repository before asking the user:

1. **Surface.** Identify what the user touches: web UI, CLI or TUI, desktop app, API, mobile app, or library. Generate one skill per independently driven surface.
2. **Launch.** Find the repository's authoritative start command, prerequisites, readiness signal, and teardown path.
3. **Doctor.** Define one read-only check that confirms the intended build, process, endpoint, authentication, and isolated state are safe to drive.
4. **Drive.** Prefer an existing harness. Otherwise use stable semantic controls through Pi's browser/UI tools, exact CLI prompts through a PTY-capable harness, or HTTP requests for a service.
5. **Evidence.** Identify observable proof: actions and resulting UI state, terminal output and exit status, response bodies, logs, or persisted side effects.
6. **Isolation.** Determine how runs separate ports, profiles, data directories, accounts, and cleanup. State when concurrent driving is unsafe.

If launch or doctor cannot complete, return `blocked` and do not claim the generated skill is proven. Product repair is outside this generator unless the user requests it.

## Generate

Create a valid Pi skill with a `verify-<app>` name matching its directory and a description that names the app, surface, and invocation condition. Include these sections:

- **Launch** gives exact startup, readiness, and teardown instructions.
- **Doctor** gives the read-only preflight.
- **Drive** uses real commands or stable controls from the repository.
- **Evidence** requires the initiating action, observable result, and material side effects.
- **Cleanup** removes only processes and scratch state created by the run while preserving evidence.
- **Features** points to `features/README.md` and its feature recipes.

Load [`references/feature-map.md`](references/feature-map.md) when writing the feature map. Add executable helpers only when they remove repeated or fragile work, and document their invocation in the generated skill.

## Prove the skill

1. Validate frontmatter and every relative reference.
2. Follow the generated launch and doctor instructions.
3. Drive one mapped feature through its real user path.
4. Capture the named evidence and verify material side effects.
5. Run cleanup after successful and failed attempts.
6. Confirm the evidence remains after cleanup.

## Completion

The generated skill is complete when a cold reader can follow it without placeholders, one mapped feature passes end to end, cleanup leaves no owned runtime residue, and the proof artifacts survive at the documented path. Report the generated skill path and the feature exercised.
