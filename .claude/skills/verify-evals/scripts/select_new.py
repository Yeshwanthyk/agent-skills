#!/usr/bin/env python3
"""Select the eval cases added or changed since a base ref, and check they target the skills that changed.

    select_new.py [--base REF] [--ids] [--strict]

Compares eval/cases/*.toml and skills/ between REF (default HEAD) and the
working tree, untracked files included. Prints:

  SELECTED   new or changed case ids, their expected methods and activation
  COVERAGE   each changed method and which selected cases expect it
  READS      each changed reference file and whether a selected case's
             `reads` expectation checks it was opened
  WARN       cases that can only pass under router activation, and cases
             whose expected methods did not change
  RUN        the skilleval commands for the selection

--ids prints only the selected ids, space-separated. --strict exits 1 when a
changed method has no selected case. Python 3.11+, stdlib only, read-only.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
import tomllib
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
CASES = "eval/cases"
ROUTER = "yesh-router"


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(REPO), *args], capture_output=True, text=True).stdout


def cases_at(ref: str | None) -> dict[str, dict]:
    out: dict[str, dict] = {}
    if ref is None:
        paths = sorted((REPO / CASES).glob("*.toml"))
        texts = [(p.stem, p.read_text()) for p in paths]
    else:
        names = git("ls-tree", "--name-only", f"{ref}:{CASES}").split()
        texts = [(Path(n).stem, git("show", f"{ref}:{CASES}/{n}")) for n in names if n.endswith(".toml")]
    for stem, text in texts:
        for raw in tomllib.loads(text).get("case", []):
            out[raw["id"]] = {**raw, "_file": stem}
    return out


def changed_skill_files(base: str) -> list[str]:
    tracked = git("diff", "--name-only", base, "--", "skills").split()
    untracked = git("ls-files", "--others", "--exclude-standard", "--", "skills").split()
    return sorted(set(tracked) | set(untracked))


def method_of(path: str) -> str | None:
    parts = Path(path).parts  # skills/<name>/...
    if len(parts) < 3:
        return None
    if parts[1] == ROUTER and len(parts) >= 4 and parts[2] == "playbooks":
        return Path(parts[3]).stem
    return parts[1]


def user_invoked(method: str) -> bool:
    skill = REPO / "skills" / method / "SKILL.md"
    if not skill.exists():
        return False
    head = skill.read_text().split("\n---", 1)[0]
    return bool(re.search(r"^disable-model-invocation:\s*true", head, re.M))


def expected(case: dict) -> set[str]:
    e = case.get("expect", {})
    return set(e.get("methods", [])) | set(e.get("any_method", [])) | set(e.get("not_methods", []))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="HEAD")
    ap.add_argument("--ids", action="store_true")
    ap.add_argument("--strict", action="store_true")
    a = ap.parse_args()

    if not git("rev-parse", "--verify", a.base).strip():
        sys.exit(f"unknown ref: {a.base}")
    old, new = cases_at(a.base), cases_at(None)
    strip = lambda c: {k: v for k, v in c.items() if k != "_file"}
    selected = {i: c for i, c in new.items() if i not in old or strip(old[i]) != strip(c)}

    if a.ids:
        print(" ".join(selected))
        return 0

    files = changed_skill_files(a.base)
    methods = sorted({m for f in files if (m := method_of(f))})
    router_cases = [i for i, c in selected.items() if c.get("activation") == "router"]

    print(f"base {a.base} ({git('rev-parse', '--short', a.base).strip()})  repo {REPO}\n")
    print("SELECTED")
    if not selected:
        print("  none: no case was added or changed since the base")
    for i, c in selected.items():
        tag = "new" if i not in old else "changed"
        print(f"  {i:<40} {tag:<8} file={c['_file']:<10} activation={c.get('activation', 'plain'):<7} "
              f"expects={sorted(expected(c)) or '-'}")

    print("\nCOVERAGE (changed methods)")
    uncovered = []
    for m in methods:
        if m == ROUTER:
            hit = router_cases or (["any case run with --activation router"] if selected else [])
        else:
            hit = [i for i, c in selected.items() if m in expected(c)]
        if not hit:
            uncovered.append(m)
        print(f"  {'ok ' if hit else 'GAP'} {m:<24} {', '.join(hit) if hit else 'no selected case expects it'}")

    print("\nREADS (changed reference files)")
    refs = [f for f in files if not f.endswith("/SKILL.md")]
    if not refs:
        print("  none")
    for f in refs:
        key = f.removeprefix("skills/")
        hit = [i for i, c in selected.items() if any(r in key for r in c.get("expect", {}).get("reads", []))]
        print(f"  {'ok  ' if hit else 'none'} {key:<60} {', '.join(hit) if hit else 'reached only if the agent chooses to'}")

    print("\nWARN")
    warned = False
    for i, c in selected.items():
        need = sorted(m for m in c.get("expect", {}).get("methods", []) if user_invoked(m))
        if need and c.get("activation") != "router":
            warned = True
            print(f"  {i}: expects user-invoked {need}; passes only under --activation router")
        if methods and not expected(c) & set(methods):
            warned = True
            print(f"  {i}: expects none of the changed methods (regression guard, not coverage)")
    if not warned:
        print("  none")

    ids = " ".join(selected)
    print("\nRUN (from eval/)")
    if ids:
        print(f"  python3 -m skilleval run --only {ids} --activation router --repeat 3 --label new-router")
        print(f"  python3 -m skilleval run --only {ids} --activation plain  --repeat 3 --label new-plain")
        print("  python3 -m skilleval report")
    return 1 if a.strict and uncovered else 0


if __name__ == "__main__":
    sys.exit(main())
