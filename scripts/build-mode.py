#!/usr/bin/env python3
"""Build the Claude Code "powerball" output style from the yesh-router mode file.

Reads <skills-dir>/yesh-router/SKILL.md, strips its YAML frontmatter, rewrites
relative Markdown link targets to absolute paths under <skills-dir>, and writes
an output style with Claude Code frontmatter.

    build-mode.py [--skills-dir DIR] [--out FILE] [--check]

--check builds in memory and exits 1 if FILE differs from the build.
Python 3.9 compatible; stdlib only.
"""

import argparse
import difflib
import json
import os
import re
import sys

MODE_DIR = "yesh-router"
STYLE_NAME = "powerball"
STYLE_DESCRIPTION = "yesh's working mode: pick a method, run its steps, prove the work"

# [text](target) or [text](target#anchor); target has no spaces or parens.
LINK_RE = re.compile(r"(\]\()([^)\s]+)(\))")
SKIP_PREFIXES = ("http://", "https://", "mailto:", "#")


def strip_frontmatter(text):
    if not text.startswith("---\n"):
        return text
    end = text.find("\n---\n", 4)
    if end == -1:
        raise ValueError("unterminated YAML frontmatter")
    return text[end + len("\n---\n"):].lstrip("\n")


def rewrite_links(body, mode_dir):
    """Return (body, missing) with relative link targets made absolute."""
    missing = []

    def repl(match):
        target = match.group(2)
        if target.startswith(SKIP_PREFIXES) or os.path.isabs(target):
            return match.group(0)
        path, sep, anchor = target.partition("#")
        absolute = os.path.normpath(os.path.join(mode_dir, path))
        if not os.path.exists(absolute):
            missing.append(target + " -> " + absolute)
        return match.group(1) + absolute + sep + anchor + match.group(3)

    return LINK_RE.sub(repl, body), missing


def build(skills_dir):
    mode_dir = os.path.join(skills_dir, MODE_DIR)
    source = os.path.join(mode_dir, "SKILL.md")
    with open(source, encoding="utf-8") as f:
        text = f.read()
    body, missing = rewrite_links(strip_frontmatter(text), mode_dir)
    header = (
        "---\n"
        "name: " + STYLE_NAME + "\n"
        # JSON strings are valid double-quoted YAML scalars; the description has ': '.
        "description: " + json.dumps(STYLE_DESCRIPTION) + "\n"
        "keep-coding-instructions: true\n"
        "---\n\n"
        "<!-- Generated from " + source + "; do not edit; run scripts/build-mode.py -->\n\n"
    )
    return header + body, missing


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--skills-dir", default="~/.claude/skills")
    parser.add_argument("--out", default="~/.claude/output-styles/powerball.md")
    parser.add_argument("--check", action="store_true",
                        help="compare the build with --out instead of writing it")
    args = parser.parse_args(argv)

    # Expand ~ but keep the path as given; do not resolve symlinks.
    skills_dir = os.path.normpath(os.path.abspath(os.path.expanduser(args.skills_dir)))
    out = os.path.expanduser(args.out)

    try:
        content, missing = build(skills_dir)
    except (OSError, ValueError) as exc:
        print("build-mode: " + str(exc), file=sys.stderr)
        return 1
    if missing:
        print("build-mode: link targets missing on disk:", file=sys.stderr)
        for item in missing:
            print("  " + item, file=sys.stderr)
        return 1

    if args.check:
        try:
            with open(out, encoding="utf-8") as f:
                current = f.read()
        except OSError:
            current = ""
        if current == content:
            return 0
        print("powerball style is stale; rerun build-mode.py", file=sys.stderr)
        diff = list(difflib.unified_diff(
            current.splitlines(True), content.splitlines(True),
            fromfile=out, tofile="build"))
        sys.stderr.writelines(diff[:40])
        if len(diff) > 40:
            print("... (%d more diff lines)" % (len(diff) - 40), file=sys.stderr)
        return 1

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(content)
    print("wrote " + out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
