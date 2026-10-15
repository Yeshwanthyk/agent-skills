#!/usr/bin/env python3
"""Audit powerball pickup across recent Claude Code and pi sessions.

For each session: whether the router/mode left a trace (loaded, quoted, or a
Method line; transcripts do not record the system prompt), Method/Used line counts, what was
actually read (skills, playbooks, principles), what the last Used line claimed
but never read, todo-tool use, and spawns. Prints a table and totals.

    audit-sessions.py [--days N] [--json] [--claude DIR] [--pi DIR]

Python 3.9 compatible; stdlib only. Skips subagent sidechains, T3 title and
skilltest sessions. Reads made inside pi codemode scripts are not recorded in
transcripts, so they are not counted.
"""

import argparse
import glob
import importlib.util
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "powerball_usage", os.path.join(HERE, "..", "skills", "yesh-router", "scripts", "powerball_usage.py"))
usage = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(usage)

TODO_TOOLS = {"TodoWrite", "TaskCreate", "TaskUpdate", "todo"}
SPAWN_TOOLS = {"Agent", "Task", "subagent_spawn", "delegate_task", "mcp__t3-code__t3_thread_launch",
               "mcp__t3-code__delegate_task"}
SKIP = ("skilltest", "t3code-claude-title", "/subagents/")


def extra_counts(path):
    todo = spawns = 0
    mode_on = False
    with open(path, "rb") as f:
        for raw in f:
            if b"Powerball mode is ON" in raw or b"<powerball>" in raw:
                mode_on = True
            if b"tool_use" not in raw and b"toolCall" not in raw:
                continue
            try:
                e = json.loads(raw)
            except ValueError:
                continue
            if e.get("isSidechain"):
                continue
            msg = e.get("message") if isinstance(e.get("message"), dict) else {}
            for b in msg.get("content") or []:
                if isinstance(b, dict) and b.get("type") in ("tool_use", "toolCall"):
                    n = b.get("name", "")
                    todo += n in TODO_TOOLS
                    spawns += n in SPAWN_TOOLS
    return todo, spawns, mode_on


def sessions(roots, days):
    cutoff = time.time() - days * 86400
    for host, root in roots:
        for path in glob.glob(os.path.join(os.path.expanduser(root), "**", "*.jsonl"), recursive=True):
            if any(s in path for s in SKIP) or os.path.getmtime(path) < cutoff:
                continue
            yield host, path


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--days", type=float, default=7)
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--claude", default="~/.claude/projects")
    ap.add_argument("--pi", default="~/.pi/agent/sessions")
    args = ap.parse_args(argv)

    rows = []
    for host, path in sessions([("claude", args.claude), ("pi", args.pi)], args.days):
        state, _ = usage.parse(path)
        todo, spawns, mode_on = extra_counts(path)
        rows.append({
            "host": host, "session": os.path.basename(path)[:-6].split("_")[-1], "path": path,
            "mtime": os.path.getmtime(path),
            # Transcripts do not record the system prompt, so "on" means the router text was
            # loaded or quoted, or a Method line appeared (the output style leaves no other trace).
            "mode_on": mode_on or state["mode_loads"] > 0 or bool(state["method"]),
            "method_lines": len(state["method"]), "used_lines": len(state["used"]),
            "skills": state["skills"], "playbooks": state["playbooks"],
            "principles": state["principles"], "unread_claims": usage.unread_claims(state),
            "todo_calls": todo, "spawns": spawns,
        })
    rows.sort(key=lambda r: r["mtime"])
    if args.json:
        print(json.dumps(rows, indent=2))
        return 0

    print("%-6s %-10s %-4s %4s %4s %4s %5s  %-40s %s" % (
        "host", "session", "mode", "Meth", "Used", "todo", "spawn", "read (skills | playbooks | principles)", "claimed, unread"))
    for r in rows:
        read = "%s | %s | %s" % (",".join(r["skills"]) or "-", ",".join(r["playbooks"]) or "-",
                                  len(r["principles"]))
        print("%-6s %-10s %-4s %4d %4d %4d %5d  %-40s %s" % (
            r["host"], r["session"][:10], "on" if r["mode_on"] else "-", r["method_lines"], r["used_lines"],
            r["todo_calls"], r["spawns"], read[:40], ",".join(r["unread_claims"]) or ""))
    on = [r for r in rows if r["mode_on"]]
    def share(rs, key):
        return "%d/%d" % (sum(1 for r in rs if r[key]), len(rs))
    print("\nsessions %d, mode on %d" % (len(rows), len(on)))
    print("with mode on: Method line %s · Used line %s · read a skill %s · read a playbook %s · "
          "read a principle %s · used todo %s · claimed-unread %s" % (
              share(on, "method_lines"), share(on, "used_lines"), share(on, "skills"),
              share(on, "playbooks"), share(on, "principles"), share(on, "todo_calls"),
              share(on, "unread_claims")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
