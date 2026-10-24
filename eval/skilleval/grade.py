"""Deterministic checks of a transcript against a case's expectations.

Each expectation key maps to one small check. Adding a check means adding one
function to CHECKS; cases opt in by using the key.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from .diagrams import text_diagrams
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


def _no_text_diagram(tr: Transcript, want: bool) -> Check:
    hits = [h for t in (tr.texts or [tr.final_text]) for h in text_diagrams(t)]
    ok = not hits if want else True
    return Check("no_text_diagram", ok, f"box art in {len(hits)} block(s): {hits[:2]}" if hits else "none")


def _max_skill_files(tr: Transcript, limit: int) -> Check:
    n = len(tr.files_read())
    return Check("max_skill_files", n <= limit, f"{n} skill files read (limit {limit})")


_METHOD_LINE = re.compile(r"^[\s*_`>]*Method:", re.M)
_USED_LINE = re.compile(r"^[\s*_`>]*Used:\s*(.+)$", re.M)
_NOT_A_METHOD = {"", "—", "-", "direct", "none"}


def _header(tr: Transcript, want: bool) -> Check:
    """The mode's Method: line opens the task and its Used: line names only what was read."""
    if not want:
        return Check("header", True, "not required")
    problems = []
    if not any(_METHOD_LINE.search(t) for t in tr.texts):
        problems.append("no Method: line")
    used = _USED_LINE.findall(tr.final_text)
    if not used:
        problems.append("no Used: line in the final reply")
    else:
        known = set(tr.discovered_skills) | tr.methods_used()
        read = tr.files_read()
        for seg in used[-1].strip("`* ").split(" · "):
            label, _, rest = seg.partition(":") if seg.startswith(("playbook:", "principles:")) else ("skills", "", seg)
            for item in re.split(r",|\+", re.sub(r"\([^)]*\)", lambda m: m.group(0) if "unread" in m.group(0) else "", rest)):
                name = item.strip().strip("`")
                if "(unread)" in name or name in _NOT_A_METHOD or name.startswith("steps"):
                    continue
                if label == "principles":
                    if not any(r.endswith(f"/{name}.md") for r in read):
                        problems.append(f"principle {name} named but not read")
                elif name in known and name not in tr.methods_used():
                    problems.append(f"{name} named but not opened")
    return Check("header", not problems, "; ".join(problems) or "Method: and Used: lines match reads")


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
    "no_text_diagram": _no_text_diagram,
    "header": _header,
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
        cut_off = tr.metrics.get("timed_out") or tr.metrics.get("stop") == "error_max_turns"
        if "header" not in expect and not cut_off and not tr.error:
            checks.append(_header(tr, True))
    for key, value in expect.items():
        checks.append(CHECKS[key](tr, value))
    return checks
