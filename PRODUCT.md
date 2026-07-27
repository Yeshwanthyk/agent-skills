# Product

## Register

product

## Platform

web

## Users

Primary users are senior developers reviewing an agent response or a code diff at their desk. They need to read carefully, attach precise feedback, and return that feedback to the active conversation without changing repository or remote state.

Secondary users are developers who install the same portable skills in Pi, Claude Code, or Codex and may not have Glimpse available.

## Product Purpose

Provide a focused, local review workspace embedded in two agent skills: `review-annotate` for the latest assistant response or supported local documents/folders, and `review-diff` for worktree, historical, or pull-request diffs. Success means the user can select text or lines, write comments, and copy a complete structured feedback block back into chat with no asynchronous handoff.

## Positioning

A self-contained, read-only annotation surface that stays attached to the skill and turns precise review notes into paste-ready feedback.

## Brand Personality

Quiet, precise, and IDE-grade. The interface should feel fast and trustworthy under concentrated use: terse labels, high information density, restrained color, and no decorative flourish.

## Anti-references

Do not resemble a marketing page, generic card dashboard, chat app, or playful note-taking tool. Avoid oversized controls, ornamental gradients, glass effects, novelty motion, and unfamiliar interaction patterns.

## Design Principles

1. Keep the reviewed material primary; controls and comments remain subordinate.
2. Make annotation a short loop: select, comment, continue, copy.
3. Preserve provenance in every comment so pasted feedback is actionable without the UI.
4. Prefer local, inspectable mechanisms over hidden services or automatic handoffs.
5. Support pointer and full keyboard use, with vi movement for expert flow.

## Accessibility & Inclusion

The complete workflow must be operable by keyboard with visible focus, semantic controls, and non-color selection indicators. Respect browser zoom and reduced-motion preferences. No formal conformance level is claimed.
