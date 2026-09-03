# Agent routing

Use this contract whenever a skill delegates work.

## Select the runtime

- **The current harness is the default.** Use its managed subagent runtime and inherit its session defaults when model and effort are unspecified.
- **Scotty is explicit.** Use Scotty only when the user requests Scotty or cloud execution. Read the installed CLI and relevant subcommand help before dispatch instead of caching its interface here.
- **An explicit override wins.** Honor a named harness, provider, model, or effort exactly. Report an unavailable choice instead of substituting one.

## Dispatch

Give every worker a standalone brief with its outcome, read-only or writable scope, required inputs, acceptance criteria, proof, time bound when useful, and report shape. A dependency handoff includes the completed result; ordering alone does not supply context. Resolve every referenced file to a repository-root-relative or absolute path that the worker can access. Inline the needed rule when the selected runtime cannot read that path.

Give writers distinct owned paths, worktrees, or branches. Confirm that a remote worker can access the named repository state before launch.

## Reconcile

The parent owns judgment, integration, and final proof. Verify consequential claims against current repository or runtime evidence.

Account for every launched worker. Managed children must settle or be cancelled through their owning runtime. For Scotty, retain the session ID, inspect and read it through the current CLI, and report any session that remains active or unresolved. Preserve durable sessions by default; vaporize one only when the user explicitly requests permanent deletion.
