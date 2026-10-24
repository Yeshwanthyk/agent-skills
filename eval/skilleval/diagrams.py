"""Box-and-arrow art drawn in a fenced block, shared by the grader and scripts/audit-sessions.py.

Diagrams belong in viz; in T3 Code and GitHub a text diagram renders as unreadable plain text.
"""
from __future__ import annotations

import re

DIAGRAM = re.compile(r"[─│┌┐└┘├┤┬┴┼▶◀►◄▼▲→←↓↑]|-->|<--")
# A file tree in a code block is a fine text form, so its entry lines (`│   ├── name`) don't count.
TREE_ENTRY = re.compile(r"^\s*(?:│\s*)*[├└]──")
FENCE = re.compile(r"```(\w*)\n(.*?)```", re.S)
CODE_LANGS = {"python", "py", "ts", "tsx", "js", "javascript", "bash", "sh", "zsh", "json", "sql", "diff",
              "rust", "go", "yaml", "toml", "viz"}


def text_diagrams(text: str) -> list[str]:
    """Fenced non-code blocks with 3+ box or arrow lines; returns each block's first line."""
    hits = []
    for lang, body in FENCE.findall(text):
        if lang.lower() in CODE_LANGS:
            continue
        if sum(1 for line in body.splitlines() if DIAGRAM.search(line) and not TREE_ENTRY.match(line)) >= 3:
            hits.append(body.strip().splitlines()[0][:80])
    return hits
