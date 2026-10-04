---
name: unslop
description: Write or clean prose so a tired engineer gets it on first read. Use for docs, RFCs, READMEs, PR bodies, commits, reports, skill text, or any padded or AI-sounding prose.
---

# Unslop

Make writing a tired engineer understands on the first read, without flattening its voice. This is a prose pass, not code contribution proof or a substitute for testing and review.

Three rules sit above everything else:

- **Cut every word that does no work.** "In order to" is "to". "It is important to note that" is nothing.
- **Use the short, everyday word**, and the codebase's own names: the real symbol, file, flag, or command, not a synonym or a description of it.
- **When a rule makes a sentence worse, fix it another way or leave it alone.** A sentence that follows every rule and sounds machine-written has failed.

## Process

1. **Clean.** Scan for the [slop patterns](references/patterns.md) and rewrite. Preserve meaning, facts, conditions, warnings, and intended voice. Replace feelings with mechanisms or numbers.
2. **Structure, for documentation.** When writing or restructuring a doc, RFC, README, PR description, or commit message, also apply [technical writing](references/technical-writing.md): pick one mode, address the reader directly, load one statement at a time, and leave no sentence open to two readings. PR bodies and commits skip the mode step; a PR body is a briefing a reviewer reads in under a minute, with logs and tables linked rather than pasted.
3. **Vary the rhythm.** Mix sentence lengths on purpose. Split a sentence that carries two thoughts; keep a long one that carries one. Have a view where the mode allows it. Be specific: not "schema changes can cause issues" but "a column rename fails the build".
4. **Read once more.** Check that nothing in the source's meaning or evidence was lost, every count or tree claim is true, and any evidence gap is stated directly. Do not churn sentences whose content did not change.

## Completion

The prose is clean when it preserves the source's meaning and evidence, matches its intended voice, passes one final read without the listed patterns, and, for documentation, holds one mode with sentences that parse one way.
