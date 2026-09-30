"""Static checks that need no model: structure, portability, descriptions,
and whether every catalog method is covered by at least one case."""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

from .run import EVAL_DIR, REPO, load_cases

DESCRIPTION_LIMIT = 200
# Skills must work wherever they are installed and in any harness.
PORTABILITY = {
    "install path": re.compile(r"~/\.gitgud|\.gitgud/|/Users/[a-z]"),
    "host config path": re.compile(r"~/\.(claude|codex|pi)/"),
    "local-only tool": re.compile(r"\bJev\b|\bgitgud\b", re.I),
}
_CATALOG_ROW = re.compile(r"^\|.*\|\s*\[([a-z0-9-]+)\]\(([^)]+)\)\s*\|\s*$")


def _frontmatter(text: str) -> dict[str, str]:
    m = re.match(r"^---\n(.*?)\n---", text, re.S)
    out = {}
    for line in (m.group(1).splitlines() if m else []):
        key, _, value = line.partition(":")
        if value:
            out[key.strip()] = value.strip().strip('"').strip("'")
    return out


def catalog_methods(skills: Path) -> list[str]:
    methods = skills / "yesh-router" / "methods.md"
    if not methods.exists():
        return []
    return [m.group(1) for line in methods.read_text().splitlines() if (m := _CATALOG_ROW.match(line))]


def lint(skills: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if skills.resolve() == (REPO / "skills").resolve():
        checker = REPO / "scripts" / "check-skill-routing.py"
        if checker.exists():
            proc = subprocess.run([sys.executable, str(checker)], cwd=REPO, capture_output=True, text=True)
            if proc.returncode:
                errors.append(f"check-skill-routing: {(proc.stdout + proc.stderr).strip()[-500:]}")

    for entry in sorted(skills.glob("*/SKILL.md")):
        name = entry.parent.name
        fm = _frontmatter(entry.read_text())
        if fm.get("name") != name:
            errors.append(f"{name}: frontmatter name {fm.get('name')!r} != directory")
        desc = fm.get("description", "")
        if not desc:
            errors.append(f"{name}: missing description")
        elif len(desc) > DESCRIPTION_LIMIT:
            warnings.append(f"{name}: description {len(desc)} chars (> {DESCRIPTION_LIMIT})")

    for md in sorted(skills.rglob("*.md")):
        rel = md.relative_to(skills)
        for n, line in enumerate(md.read_text().splitlines(), 1):
            for label, pattern in PORTABILITY.items():
                if pattern.search(line):
                    warnings.append(f"{rel}:{n}: {label}: {line.strip()[:100]}")

    covered = set()
    for case in load_cases():
        for key in ("methods", "any_method"):
            covered |= set(case.expect.get(key, []))
    for method in catalog_methods(skills):
        if method not in covered:
            warnings.append(f"no case expects method {method!r}")
    return errors, warnings


def main(skills: Path) -> int:
    errors, warnings = lint(skills)
    for w in warnings:
        print(f"warn  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print(f"{len(errors)} errors, {len(warnings)} warnings")
    return 1 if errors else 0
