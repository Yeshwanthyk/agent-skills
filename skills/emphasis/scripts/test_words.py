#!/usr/bin/env python3
"""words.md and the renderer's VOCAB must list the same words, and the example board must lint clean."""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import emphasis  # noqa: E402

SKILL = Path(__file__).resolve().parent.parent


def test_words_match_renderer():
    v = emphasis.vocab()
    doc = (SKILL / "references" / "words.md").read_text()
    for tone in ("error", "warning", "success", "danger", "mode", "owner", "context"):
        row = re.search(rf"^\| {tone} \|[^|]*\| (.*) \|$", doc, re.M)
        assert row, f"words.md has no row for {tone}"
        assert [w.strip() for w in row.group(1).split(",")] == v[tone], f"{tone} differs between words.md and emphasis.js"
    for lead in v["leadins"]:
        assert f"**{lead}:**" in doc, f"lead-in {lead} missing from words.md"


def test_example_lints_clean():
    assert emphasis.check((SKILL / "assets" / "example.emph").read_text()) == []


def test_lint_catches_missing_action_and_unknown_word():
    bad = "[[Failed]] the deploy\n[[Shiny]] thing\n## Result [[Done]]\n"
    problems = emphasis.check(bad)
    assert any("needs its action" in p for p in problems)
    assert any("unknown pill word" in p for p in problems)
    assert any("heading" in p for p in problems)


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
