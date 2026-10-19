#!/usr/bin/env python3
"""Build the Claude Code "powerball" output style from the yesh-router mode file.

Reads <skills-dir>/yesh-router/SKILL.md, strips its YAML frontmatter, rewrites
relative Markdown link targets to absolute paths under <skills-dir>, and writes
an output style with Claude Code frontmatter.

    build-mode.py [--skills-dir DIR] [--out FILE] [--check]

--check builds in memory and exits 1 if FILE differs from the build.
Writing the style also installs the per-turn reminder hook
(yesh-router/scripts/turn-reminder.py) in ~/.claude/settings.json as a
UserPromptSubmit hook; --no-hook skips that, and --check reports it.
--source FILE reads the mode text from FILE (e.g. the repo copy) while links
still resolve under <skills-dir>; use it to see whether a repo edit has
reached the installed style. The installed skills come from GitHub main via
gitgud, so the order after a router edit is: push, gitgud sync, build,
restart Claude Code.
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


def build(skills_dir, source=None):
    mode_dir = os.path.join(skills_dir, MODE_DIR)
    source = source or os.path.join(mode_dir, "SKILL.md")
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


HOOK_SCRIPT = "scripts/turn-reminder.py"
SETTINGS = "~/.claude/settings.json"


def hook_command(skills_dir):
    return "python3 " + os.path.join(skills_dir, MODE_DIR, HOOK_SCRIPT)


def ensure_hook(skills_dir, write):
    """Point one UserPromptSubmit hook at the reminder script; drop stale copies."""
    script = os.path.join(skills_dir, MODE_DIR, HOOK_SCRIPT)
    if not os.path.isfile(script):
        return "turn reminder: %s missing; hook left as is" % script
    path = os.path.expanduser(SETTINGS)
    try:
        with open(path, encoding="utf-8") as f:
            settings = json.load(f)
    except FileNotFoundError:
        settings = {}
    groups = settings.setdefault("hooks", {}).setdefault("UserPromptSubmit", [])
    want = {"type": "command", "command": hook_command(skills_dir), "timeout": 5}
    kept = [g for g in groups
            if not any("turn-reminder.py" in h.get("command", "") for h in g.get("hooks", []))]
    if kept + [{"hooks": [want]}] == groups:
        return "turn reminder: installed"
    if not write:
        return "turn reminder: not installed; rerun build-mode.py"
    settings["hooks"]["UserPromptSubmit"] = kept + [{"hooks": [want]}]
    with open(path, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2)
        f.write("\n")
    return "turn reminder: installed in " + path


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--skills-dir", default="~/.claude/skills")
    parser.add_argument("--out", default="~/.claude/output-styles/powerball.md")
    parser.add_argument("--source", default=None,
                        help="read the mode text from this file instead of the installed copy")
    parser.add_argument("--check", action="store_true",
                        help="compare the build with --out instead of writing it")
    parser.add_argument("--no-hook", action="store_true",
                        help="do not install the per-turn reminder hook")
    args = parser.parse_args(argv)

    # Expand ~ but keep the path as given; do not resolve symlinks.
    skills_dir = os.path.normpath(os.path.abspath(os.path.expanduser(args.skills_dir)))
    out = os.path.expanduser(args.out)

    try:
        content, missing = build(skills_dir, os.path.abspath(os.path.expanduser(args.source)) if args.source else None)
    except (OSError, ValueError) as exc:
        print("build-mode: " + str(exc), file=sys.stderr)
        return 1
    if missing:
        print("build-mode: link targets missing on disk:", file=sys.stderr)
        for item in missing:
            print("  " + item, file=sys.stderr)
        return 1

    if args.check:
        if not args.no_hook:
            print(ensure_hook(skills_dir, write=False), file=sys.stderr)
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
    if not args.no_hook:
        print(ensure_hook(skills_dir, write=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
