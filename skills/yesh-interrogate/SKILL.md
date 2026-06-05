---
name: yesh-interrogate
description: Use for /interrogate, adversarial review, challenge this, stress test this, find blind spots, and blocker-first review of a plan, diff, design, PR, or artifact. Runs independent read-only reviewers when available using a shared prompt/rubric/context, then synthesizes findings with pragmatic lead judgment. Does not auto-apply changes.
---

# Yesh Interrogate

Challenge a thing before trusting it. The adversarial signal comes from independent review passes against the same intent, context, rubric, and code-quality lens. The deliverable is a synthesized verdict, not an auto-applied fix.

## Workflow

1. Determine scope: diff, files, plan, architecture sketch, PR, or artifact.
   - If the user points at specific files or a diff, use that.
   - If on a feature branch, use the appropriate base diff when possible, such as `git diff main...HEAD`.
   - If the user references recent work, gather the relevant files and surrounding context.
2. State the intent in one clear paragraph. Derive it from the user's message, commits, PR description, plan, and code. Ask only if the intent is materially unclear.
3. Package review context: the diff or file contents plus surrounding files needed to judge execution.
4. Run independent read-only reviewers when available. Use the same filled reviewer prompt for each reviewer:
   - `references/reviewer-prompt.md`
   - `references/rubric.md`
   - `references/code-quality-review.md`
5. If reviewer subagents are unavailable, run the same rubric locally in separate passes rather than using persona-only critique.
6. Require structured findings: severity, location, finding, evidence, and optional suggestion.
7. Synthesize: parse findings, deduplicate, identify agreement, identify lone sharp findings, and note disagreements.
8. Apply pragmatic lead judgment using `references/lead-judgment.md`.
9. Do not auto-fix unless the user asks.

## Output

```md
Intent
- stated intent paragraph

Reviewers
- reviewer/pass: findings count

Act On
- finding:
  evidence:
  raised by:
  why it matters:

Consider
- finding:
  tradeoff:
  raised by:

Noted
- finding:

Dismissed
- finding:
  reason:

Agreement map
- ...
```

## Rules

- Findings first. Summaries second.
- Prefer file/line references, test names, call graph breaks, and concrete failure modes.
- Ignore style noise unless it affects correctness, safety, or maintainability.
- Do not question the intent itself; challenge whether the work achieves it well.
- Findings must include evidence, not just preferences.
- Treat agreement across independent reviewers as high signal, but do not dismiss a lone finding if it identifies a concrete execution path or security/correctness risk.
- Filter aggressively as lead reviewer. Reviewers may lack context; dismiss findings that conflict with known constraints, local patterns, or unreachable paths.
