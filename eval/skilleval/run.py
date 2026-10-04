"""Stage an isolated workspace per case, run a harness headlessly, grade it.

Isolation: the harness sees only the fixture repo and the skills copied from
`--skills` (default: this repo's skills/). User-level skills, settings, MCP
servers, extensions, and AGENTS.md/CLAUDE.md files are excluded, so a result
reflects the collection's own text, not whatever happens to be installed.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import tomllib
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass, field, replace
from pathlib import Path

from .events import PARSERS, Event, staged_skill_names
from .grade import grade

EVAL_DIR = Path(__file__).resolve().parent.parent
REPO = EVAL_DIR.parent
ROUTER_PREFIX = "Use yesh-router. "
TIERS = {  # route: stop once selection has happened; task: run to completion
    "route": {"max_turns": 8, "timeout_s": 300},
    "task": {"max_turns": 60, "timeout_s": 1500},
}


@dataclass
class Case:
    id: str
    prompt: str
    file: str
    fixture: str = "orders"
    activation: str = "plain"  # plain | router
    tier: str = "route"
    tags: list[str] = field(default_factory=list)
    expect: dict = field(default_factory=dict)
    notes: str = ""


def load_cases(only: list[str] | None = None, files: list[str] | None = None,
               tags: list[str] | None = None) -> list[Case]:
    cases = []
    for path in sorted((EVAL_DIR / "cases").glob("*.toml")):
        if files and path.stem not in files:
            continue
        for raw in tomllib.loads(path.read_text())["case"]:
            case = Case(file=path.stem, **raw)
            if only and case.id not in only:
                continue
            if tags and not set(tags) & set(case.tags):
                continue
            cases.append(case)
    ids = [c.id for c in cases]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        raise ValueError(f"duplicate case ids: {sorted(dupes)}")
    return cases


def content_hash(root: Path) -> str:
    h = hashlib.sha256()
    for p in sorted(root.rglob("*")):
        if p.is_file() and ".DS_Store" not in p.name:
            h.update(str(p.relative_to(root)).encode())
            h.update(p.read_bytes())
    return h.hexdigest()[:12]


def _git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(REPO), *args], capture_output=True, text=True).stdout.strip()


# Variables a parent agent session sets for its children. Inheriting them turns
# the harness into a nested child session, which (in Claude Code) hides project
# skill descriptions and redirects subagent models, so results stop reflecting
# normal use. Strip them so a run behaves like a fresh terminal session.
_SESSION_ENV = ("CLAUDE", "AI_AGENT", "__CF", "CODEX_", "PI_CODING_AGENT")


def clean_env() -> dict[str, str]:
    return {k: v for k, v in os.environ.items() if not k.startswith(_SESSION_ENV)}


def stage(case: Case, skills_src: Path, ws: Path) -> Path:
    setup = EVAL_DIR / "fixtures" / case.fixture / "setup.sh"
    subprocess.run(["sh", str(setup), str(ws)], check=True)
    skills_root = ws / ".claude" / "skills"
    shutil.copytree(skills_src, skills_root, symlinks=False,
                    ignore=shutil.ignore_patterns(".DS_Store", "__pycache__"))
    return skills_root


def command(harness: str, prompt: str, model: str, effort: str, max_turns: int,
            skills_root: Path) -> list[str]:
    if harness == "claude":
        cmd = ["claude", "-p", prompt, "--output-format", "stream-json", "--verbose",
               "--setting-sources", "project", "--strict-mcp-config",
               "--permission-mode", "bypassPermissions", "--no-session-persistence",
               "--max-turns", str(max_turns)]
        if model:
            cmd += ["--model", model]
        if effort:
            cmd += ["--effort", effort]
        return cmd
    if harness == "pi":
        cmd = ["pi", "-p", prompt, "--mode", "json", "--no-session", "--no-skills",
               "--no-context-files", "--no-extensions"]
        for skill in sorted(skills_root.glob("*/SKILL.md")):
            cmd += ["--skill", str(skill.parent)]
        if model:
            cmd += ["--model", model]
        if effort:
            cmd += ["--thinking", effort]
        return cmd
    raise ValueError(f"unknown harness {harness!r}")


def evaluate(case: Case, harness: str, activation: str, stream: str, known: set[str],
             ws_edits: list[str], metrics: dict, ws_root: str = "") -> dict:
    """Parse and grade one transcript. Pure, so saved runs can be regraded."""
    tr = PARSERS[harness](stream, known)
    root = ws_root.rstrip("/") + "/"
    for e in tr.events:  # tool edits inside the workspace: make relative to match git
        if e.kind != "edit":
            continue
        if ws_root and str(Path(e.name).resolve()).startswith(root):
            e.name = str(Path(e.name).resolve())[len(root):]
        elif m := re.search(r"/skilleval-[^/]+/repo/(.+)$", e.name):  # regrade: workspace is gone
            e.name = m.group(1)
    tr.events += [Event("edit", path, "git") for path in ws_edits if path not in tr.edits()]
    for key, value in metrics.items():
        tr.metrics.setdefault(key, value)
    # Hitting the turn/time cap is the intended stop for routing trials.
    if case.tier == "route" and (metrics.get("timed_out") or tr.metrics.get("stop") == "error_max_turns"):
        tr.error = ""
    elif metrics.get("timed_out"):
        tr.error = f"timed out after {TIERS[case.tier]['timeout_s']}s"
    checks = grade(tr, case.expect, activation)
    # Account limits and outages say nothing about the skills; report them apart.
    infra = bool(re.search(r"session limit|usage limit|rate.?limit|overloaded|model is not supported|model_not_found|unknown model", tr.error or "", re.I))
    return {
        "id": case.id, "file": case.file, "tier": case.tier, "activation": activation,
        "passed": all(c.passed for c in checks),
        "infra": infra,
        "checks": [asdict(c) for c in checks],
        "skills_used": sorted(tr.skills_used()),
        "skill_files_read": sorted(tr.files_read()),
        "edits": sorted(tr.edits()),
        "ws_edits": ws_edits,
        "discovered_skills": len(tr.discovered_skills),
        "metrics": tr.metrics,
        "final_text": tr.final_text[-2000:],
    }


def regrade(run_dir: Path) -> None:
    """Re-parse and re-grade saved transcripts with current parsers, checks, and case expectations."""
    meta = json.loads((run_dir / "meta.json").read_text())
    cases = {c.id: c for c in load_cases()}
    known = staged_skill_names(Path(meta["skills_source"]))
    for f in sorted(run_dir.glob("*/result.json")):
        old = json.loads(f.read_text())
        case = cases.get(old["id"].split("#")[0])
        transcript = f.parent / "transcript.jsonl"
        if not case or not transcript.exists():
            continue
        case = replace(case, id=old["id"])
        metrics = {k: (old.get("metrics") or {}).get(k) for k in ("duration_s", "timed_out")}
        result = evaluate(case, meta["harness"], old.get("activation") or case.activation,
                          transcript.read_text(), known, old.get("ws_edits", old.get("edits", [])), metrics)
        result["workspace"] = old.get("workspace", "")
        f.write_text(json.dumps(result, indent=2))


def run_case(case: Case, run_dir: Path, opts: dict) -> dict:
    activation = opts["activation"] or case.activation
    tier = TIERS[case.tier]
    case_dir = run_dir / case.id
    case_dir.mkdir(parents=True)
    # Outside this repo, so no parent AGENTS.md/CLAUDE.md or repo files leak in.
    ws = Path(tempfile.mkdtemp(prefix=f"skilleval-{case.id.replace('#', '-')}-")) / "repo"
    skills_root = stage(case, opts["skills"], ws)
    prompt = (ROUTER_PREFIX if activation == "router" else "") + case.prompt
    cmd = command(opts["harness"], prompt, opts["model"], opts["effort"], tier["max_turns"], skills_root)
    started = time.time()
    try:
        proc = subprocess.run(cmd, cwd=ws, capture_output=True, text=True, timeout=tier["timeout_s"],
                              env=clean_env())
        stream, timed_out = proc.stdout, False
    except subprocess.TimeoutExpired as exc:
        stream = (exc.stdout or b"").decode() if isinstance(exc.stdout, bytes) else (exc.stdout or "")
        timed_out = True
    # Keep the transcript, minus pi's token-by-token deltas.
    kept = [l for l in stream.splitlines() if '"type": "message_update"' not in l and '"type":"message_update"' not in l]
    (case_dir / "transcript.jsonl").write_text("\n".join(kept))

    # Edits come from the workspace itself, so shell edits (sed, scripts) count too.
    status = subprocess.run(["git", "status", "--porcelain", "--untracked-files=all", "--", ".", ":!.claude"],
                            cwd=ws, capture_output=True, text=True).stdout
    ws_edits = sorted(line[3:] for line in status.splitlines())
    metrics = {"duration_s": round(time.time() - started, 1), "timed_out": timed_out}
    result = evaluate(case, opts["harness"], activation, stream, staged_skill_names(skills_root),
                      ws_edits, metrics, str(ws.resolve()))
    result["workspace"] = str(ws) if opts["keep_ws"] else ""
    (case_dir / "result.json").write_text(json.dumps(result, indent=2))
    if not opts["keep_ws"]:
        shutil.rmtree(ws.parent, ignore_errors=True)
    return result


def run(cases: list[Case], opts: dict) -> Path:
    stamp = time.strftime("%Y%m%d-%H%M%S")
    label = "-".join(x for x in (opts["harness"], opts["model"], opts["activation"], opts["label"]) if x)
    run_dir = EVAL_DIR / "results" / f"{stamp}-{label}".replace("/", "_")
    run_dir.mkdir(parents=True)
    meta = {
        "harness": opts["harness"], "model": opts["model"], "effort": opts["effort"],
        "activation_override": opts["activation"], "label": opts["label"],
        "skills_source": str(opts["skills"]), "skills_hash": content_hash(opts["skills"]),
        "repo_rev": _git("rev-parse", "--short", "HEAD"),
        "repo_dirty": bool(_git("status", "--porcelain", "--", "skills")),
        "cases": [c.id for c in cases], "started": stamp,
    }
    (run_dir / "meta.json").write_text(json.dumps(meta, indent=2))
    with ThreadPoolExecutor(max_workers=opts["jobs"]) as pool:
        futures = {pool.submit(run_case, c, run_dir, opts): c for c in cases}
        for fut in futures:
            case = futures[fut]
            try:
                r = fut.result()
                print(f"{'PASS' if r['passed'] else 'FAIL'}  {case.id}", flush=True)
            except Exception as exc:  # a broken case must not hide the others
                (run_dir / case.id).mkdir(exist_ok=True)
                (run_dir / case.id / "result.json").write_text(json.dumps(
                    {"id": case.id, "file": case.file, "passed": False, "tier": case.tier,
                     "checks": [{"name": "harness", "passed": False, "detail": repr(exc)}]}))
                print(f"ERROR {case.id}: {exc!r}", flush=True)
    return run_dir
