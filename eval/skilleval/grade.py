"""Deterministic checks of a transcript against a case's expectations.

Each expectation key maps to one small check. Adding a check means adding one
function to CHECKS; cases opt in by using the key.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from .events import Transcript

ROUTER = "yesh-router"


@dataclass
class Check:
    name: str
    passed: bool
    detail: str


# "Methods" are skills or router playbooks, so a case names what should happen
# without caring whether it is packaged as a skill or a playbook.
def _methods(tr: Transcript, want: list[str]) -> Check:
    missing = [m for m in want if m not in tr.methods_used()]
    return Check("methods", not missing, f"missing {missing}" if missing else f"used {want}")


def _any_method(tr: Transcript, want: list[str]) -> Check:
    hit = sorted(set(want) & tr.methods_used())
    return Check("any_method", bool(hit), f"used {hit}" if hit else f"none of {want}")


def _not_methods(tr: Transcript, banned: list[str]) -> Check:
    hit = sorted(set(banned) & tr.methods_used())
    return Check("not_methods", not hit, f"used {hit}" if hit else "none used")


def _no_methods(tr: Transcript, want: bool) -> Check:
    used = sorted(tr.methods_used() - {ROUTER})
    ok = not used if want else True
    return Check("no_methods", ok, f"used {used}" if used else "none used")


def _reads(tr: Transcript, want: list[str]) -> Check:
    read = tr.files_read()
    missing = [w for w in want if not any(w in r for r in read)]
    return Check("reads", not missing, f"missing {missing}" if missing else f"read {want}")


def _no_edits(tr: Transcript, want: bool) -> Check:
    edits = sorted(tr.edits())
    ok = not edits if want else True
    return Check("no_edits", ok, f"edited {edits}" if edits else "no edits")


def _edits_any(tr: Transcript, want: list[str]) -> Check:
    hit = [e for e in tr.edits() if any(w in e for w in want)]
    return Check("edits_any", bool(hit), f"edited {hit}" if hit else f"no edit to {want}")


def _answer(tr: Transcript, patterns: list[str]) -> Check:
    missing = [p for p in patterns if not re.search(p, tr.final_text, re.I | re.S)]
    return Check("answer", not missing, f"no match for {missing}" if missing else "matched")


def _max_skill_files(tr: Transcript, limit: int) -> Check:
    n = len(tr.files_read())
    return Check("max_skill_files", n <= limit, f"{n} skill files read (limit {limit})")


CHECKS = {
    "methods": _methods,
    "any_method": _any_method,
    "not_methods": _not_methods,
    "no_methods": _no_methods,
    "reads": _reads,
    "no_edits": _no_edits,
    "edits_any": _edits_any,
    "answer": _answer,
    "max_skill_files": _max_skill_files,
}


def grade(tr: Transcript, expect: dict, activation: str) -> list[Check]:
    unknown = set(expect) - set(CHECKS)
    if unknown:
        raise ValueError(f"unknown expectation keys: {sorted(unknown)}")
    checks = []
    if tr.error:
        checks.append(Check("run", False, tr.error[:200]))
    if activation == "router":
        loaded = ROUTER in tr.skills_used()
        checks.append(Check("router_loaded", loaded, "loaded" if loaded else "router not loaded"))
    for key, value in expect.items():
        checks.append(CHECKS[key](tr, value))
    return checks
