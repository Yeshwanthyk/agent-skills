"""python3 -m skilleval {run,report,compare,regrade,view,lint,list} — run from eval/."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import lint as lint_mod
from .run import EVAL_DIR, REPO, load_cases, regrade, run

DEFAULT_MODELS = {"claude": "claude-opus-5-5", "pi": ""}


def _results(run_dir: Path) -> dict[str, dict]:
    out = {}
    for f in sorted(run_dir.glob("*/result.json")):
        r = json.loads(f.read_text())
        out[r["id"]] = r
    return out


def _resolve_run(arg: str | None) -> Path:
    if arg:
        p = Path(arg)
        return p if p.is_absolute() or p.exists() else EVAL_DIR / "results" / arg
    runs = sorted(p for p in (EVAL_DIR / "results").glob("2*") if (p / "meta.json").exists())
    if not runs:
        sys.exit("no runs in eval/results")
    return runs[-1]


def cmd_report(args) -> int:
    run_dir = _resolve_run(args.run)
    meta = json.loads((run_dir / "meta.json").read_text())
    results = _results(run_dir)
    seen_models = sorted({(r.get("metrics") or {}).get("model") or "" for r in results.values()} - {""})
    model = meta["model"] or ",".join(seen_models) or "default"
    print(f"{run_dir.name}  harness={meta['harness']} model={model} "
          f"skills={meta['skills_hash']}{' (dirty)' if meta['repo_dirty'] else ''} rev={meta['repo_rev']}")
    by_file: dict[str, list[dict]] = {}
    for r in results.values():
        by_file.setdefault(r["file"], []).append(r)
    total_cost = 0.0
    for file, rs in sorted(by_file.items()):
        graded = [r for r in rs if not r.get("infra")]
        print(f"\n{file}: {sum(r['passed'] for r in graded)}/{len(graded)}"
              + (f"  ({len(rs) - len(graded)} infra errors)" if len(graded) < len(rs) else ""))
        for r in sorted(rs, key=lambda r: r["id"]):
            total_cost += (r.get("metrics") or {}).get("cost_usd") or 0
            mark = "INFRA" if r.get("infra") else "PASS" if r["passed"] else "FAIL"
            used = ",".join(s for s in r.get("skills_used", []) if s != "yesh-router")
            playbooks = ",".join(Path(f).stem for f in r.get("skill_files_read", []) if "/playbooks/" in f)
            print(f"  {mark}  {r['id']:<34} [{r.get('activation', '')}] used: {used or '-'}"
                  + (f" playbooks: {playbooks}" if playbooks else ""))
            for c in r["checks"]:
                if not c["passed"]:
                    print(f"          x {c['name']}: {c['detail']}")
    graded = [r for r in results.values() if not r.get("infra")]
    infra = [r["id"] for r in results.values() if r.get("infra")]
    print(f"\ntotal {sum(r['passed'] for r in graded)}/{len(graded)}  cost ${total_cost:.2f}")
    if infra:
        print(f"{len(infra)} infra errors (not graded); rerun: --only {' '.join(sorted({i.split('#')[0] for i in infra}))}")
    return 0


def cmd_compare(args) -> int:
    a, b = _resolve_run(args.base), _resolve_run(args.head)
    ra, rb = _results(a), _results(b)
    print(f"base {a.name}\nhead {b.name}\n")
    changed = 0
    for cid in sorted(set(ra) | set(rb)):
        pa = ra.get(cid, {}).get("passed")
        pb = rb.get(cid, {}).get("passed")
        if pa == pb:
            continue
        changed += 1
        label = {(False, True): "FIXED", (True, False): "BROKE"}.get((pa, pb), "NEW/GONE")
        print(f"  {label:<8} {cid}")
    sa = sum(r["passed"] for r in ra.values())
    sb = sum(r["passed"] for r in rb.values())
    print(f"\n{changed} changed   base {sa}/{len(ra)}   head {sb}/{len(rb)}")
    print("Single trials are noisy: rerun changed cases with --repeat before trusting a flip.")
    return 0


def cmd_list(args) -> int:
    for c in load_cases(args.only, args.file, args.tag):
        print(f"{c.file:<10} {c.id:<34} {c.tier:<5} {c.activation:<6} {c.prompt[:70]}")
    return 0


def cmd_run(args) -> int:
    cases = load_cases(args.only, args.file, args.tag)
    if args.tier:
        cases = [c for c in cases if c.tier == args.tier]
    if not cases:
        sys.exit("no cases selected")
    if args.repeat > 1:
        from dataclasses import replace
        cases = [replace(c, id=f"{c.id}#{i}") for c in cases for i in range(1, args.repeat + 1)]
    opts = {
        "harness": args.harness,
        "model": args.model if args.model is not None else DEFAULT_MODELS[args.harness],
        "effort": args.effort, "activation": args.activation, "label": args.label,
        "skills": Path(args.skills).expanduser().resolve(), "jobs": args.jobs, "keep_ws": args.keep_ws,
    }
    run_dir = run(cases, opts)
    args.run = str(run_dir)
    return cmd_report(args)


def main() -> int:
    p = argparse.ArgumentParser(prog="skilleval")
    sub = p.add_subparsers(dest="cmd", required=True)

    def selectors(sp):
        sp.add_argument("--only", nargs="+", help="case ids")
        sp.add_argument("--file", nargs="+", help="case files (stem), e.g. routing playbooks")
        sp.add_argument("--tag", nargs="+")

    r = sub.add_parser("run", help="run cases against a harness")
    selectors(r)
    r.add_argument("--harness", choices=["claude", "pi"], default="claude")
    r.add_argument("--model", help="default: claude-opus-5-5 for claude, pi's default for pi")
    r.add_argument("--effort", default="", help="claude --effort / pi --thinking")
    r.add_argument("--activation", choices=["plain", "router"], help="override every case's activation")
    r.add_argument("--tier", choices=["route", "task"])
    r.add_argument("--skills", default=str(REPO / "skills"), help="skills dir to test (e.g. an installed copy)")
    r.add_argument("--repeat", type=int, default=1, help="trials per case")
    r.add_argument("-j", "--jobs", type=int, default=4)
    r.add_argument("--label", default="")
    r.add_argument("--keep-ws", action="store_true", help="keep workspaces for inspection")
    r.set_defaults(fn=cmd_run)

    rp = sub.add_parser("report", help="summarize a run (default: latest)")
    rp.add_argument("run", nargs="?")
    rp.set_defaults(fn=cmd_report)

    rg = sub.add_parser("regrade", help="re-grade a saved run with current parsers/checks/cases (no model calls)")
    rg.add_argument("run", nargs="?")
    rg.set_defaults(fn=lambda a: (regrade(_resolve_run(a.run)), cmd_report(a))[1])

    c = sub.add_parser("compare", help="show cases that flipped between two runs")
    c.add_argument("base")
    c.add_argument("head")
    c.set_defaults(fn=cmd_compare)

    v = sub.add_parser("view", help="write an HTML page of runs: prompt, picks, timeline, checks, answer")
    v.add_argument("runs", nargs="*", help="run names (default: latest)")
    v.add_argument("-o", "--out", help="output file (default: results/view.html)")

    def cmd_view(a):
        from .view import render
        dirs = [_resolve_run(r) for r in a.runs] or [_resolve_run(None)]
        print(render(dirs, Path(a.out) if a.out else EVAL_DIR / "results" / "view.html"))
        return 0
    v.set_defaults(fn=cmd_view)

    li = sub.add_parser("lint", help="static checks, no model calls")
    li.add_argument("--skills", default=str(REPO / "skills"))
    li.set_defaults(fn=lambda a: lint_mod.main(Path(a.skills).expanduser().resolve()))

    ls = sub.add_parser("list", help="list cases")
    selectors(ls)
    ls.set_defaults(fn=cmd_list)

    args = p.parse_args()
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
