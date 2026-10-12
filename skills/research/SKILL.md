---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a cited Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
metadata:
  credits:
    author: Matt Pocock
    url: "https://github.com/mattpocock/skills/tree/main/skills/engineering/research"
    license: MIT (see LICENSE)
---

# Research

Hand the reading to a **background agent** so you keep working while it reads. Brief it per the [delegation contract](../yesh-router/references/delegation.md): the question, what the answer is for, where to save, and the source rules below.

## The agent's job

1. **Pin the question.** Restate it with the versions, platforms, and dates it depends on. A fact about the wrong version is a wrong fact.
2. **Read primary sources.** Official docs, versioned source code, specs, release notes, and first-party APIs, not a write-up of them. Follow every claim back to the source that owns it. Authority is per claim: a vendor can document its feature but cannot establish that it is the best choice. For depth, counterevidence, and source roles, read [research sources](../deep-dive-explainer/references/research.md).
3. **Check the claims that matter.** Where the answer turns on behavior, confirm it in the source or with a small probe rather than trusting the prose. Record what was checked and how.
4. **Write one Markdown file.** Lead with the answer. Cite each claim with a link and the version or date. Mark each claim as checked, documented only, or inferred. List open questions and anything the sources could not settle.
5. **Save it where the repo keeps such notes.** Match the existing convention; if there is none, pick a sensible path and say where.

## Completion

Research is done when the file is saved, its answer addresses the pinned question, every claim carries a source with its version or date, and unresolved points are listed rather than smoothed over. Report the path and a two-line summary.
