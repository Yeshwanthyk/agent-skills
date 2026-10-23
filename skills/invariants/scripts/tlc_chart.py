#!/usr/bin/env python3
"""Model-check a TLA+ spec with TLC and report the result on the flow's statechart.

  tlc_chart.py run SPEC.tla [--config C.cfg] [--chart ui] [--viz CHART.viz] [--fix FIXED.cfg]
                            [-o OUT.viz] [--jar tla2tools.jar] [--workers auto]
  tlc_chart.py log TRACE.txt [--chart ui]      read a TLC trace printed elsewhere (quint verify --backend tlc)
  tlc_chart.py jar                             print the pinned tla2tools.jar path, downloading it once

`run` checks the invariants in the config (the current code). With --fix it checks the fixed config too.
With --viz it checks every named story path in the chart for reachability and writes OUT.viz, the same
chart with each story marked: plain = reached, `!` path = counterexample, `+` = reached only after the
fix, `?` on the leaf = never reached. Exit 0 when the final model is clean, 1 on a violation, 2 on an
error. Conventions (chart variable, `state:` and `fails:` lines): ../references/model-checkers.md.
"""
import argparse
import hashlib
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

TLA_VERSION = "1.7.4"
TLA_SHA256 = "936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88"
TLA_URL = f"https://github.com/tlaplus/tlaplus/releases/download/v{TLA_VERSION}/tla2tools.jar"
HERE = os.path.dirname(os.path.abspath(__file__))
VIZ_PY = os.path.join(HERE, "..", "..", "viz", "scripts", "viz.py")
# tlc2.output.EC.ExitStatus
EXIT = {0: "clean", 10: "assumption violated", 11: "deadlock", 12: "invariant violated",
        13: "temporal property violated", 14: "assertion failed", 75: "spec evaluation failed",
        76: "invariant evaluation failed", 77: "temporal evaluation failed", 150: "spec parse error",
        151: "config parse error", 152: "state space too large", 153: "system error", 255: "error"}
CFG_KEYS = ("CONSTANTS", "CONSTANT", "INIT", "NEXT", "SPECIFICATION", "INVARIANTS", "INVARIANT", "PROPERTIES",
            "PROPERTY", "CONSTRAINTS", "CONSTRAINT", "ACTION_CONSTRAINTS", "ACTION_CONSTRAINT", "SYMMETRY", "VIEW",
            "ALIAS", "POSTCONDITION", "CHECK_DEADLOCK")


# ---------- jar ----------

def jar_path(override=None):
    if override or os.environ.get("TLA2TOOLS"):
        return override or os.environ["TLA2TOOLS"]
    cache = os.path.join(os.environ.get("XDG_CACHE_HOME") or os.path.expanduser("~/.cache"), "tlaplus")
    path = os.path.join(cache, f"tla2tools-{TLA_VERSION}.jar")
    if not os.path.exists(path):
        os.makedirs(cache, exist_ok=True)
        print(f"downloading tla2tools {TLA_VERSION} -> {path}", file=sys.stderr)
        with urllib.request.urlopen(TLA_URL) as r:
            data = r.read()
        if hashlib.sha256(data).hexdigest() != TLA_SHA256:
            sys.exit(f"tla2tools.jar sha256 mismatch for {TLA_URL}")
        with open(path + ".part", "wb") as f:
            f.write(data)
        os.replace(path + ".part", path)
    return path


# ---------- TLA+ values ----------

TOK = re.compile(r'\s*("(?:[^"\\]|\\.)*"|<<|>>|\|->|:>|@@|-?\d+|[A-Za-z_][\w]*|[\[\](){},])')


def parse_value(text):
    toks, pos = [], 0
    while pos < len(text):
        m = TOK.match(text, pos)
        if not m:
            if text[pos:].strip():
                return text.strip()  # a shape this parser does not know; keep the raw text
            break
        toks.append(m.group(1))
        pos = m.end()
    try:
        val, i = _value(toks, 0)
        return val if i == len(toks) else text.strip()
    except (IndexError, ValueError):
        return text.strip()


def _value(t, i):
    x = t[i]
    if x[0] == '"':
        return x[1:-1], i + 1
    if re.fullmatch(r"-?\d+", x):
        return int(x), i + 1
    if x in ("TRUE", "FALSE"):
        return x == "TRUE", i + 1
    if x == "<<":
        items, i = _items(t, i + 1, ">>")
        return tuple(items), i
    if x == "{":
        items, i = _items(t, i + 1, "}")
        return frozenset(items) if all(_hashable(v) for v in items) else tuple(items), i
    if x == "[":  # record [a |-> 1, b |-> 2]
        rec, i = {}, i + 1
        while t[i] != "]":
            k = t[i]
            if t[i + 1] != "|->":
                raise ValueError
            v, i = _value(t, i + 2)
            rec[k] = v
            if t[i] == ",":
                i += 1
        return rec, i + 1
    if x == "(":  # function (k :> v @@ k2 :> v2)
        fn, i = {}, i + 1
        while t[i] != ")":
            k, i = _value(t, i)
            if t[i] != ":>":
                raise ValueError
            v, i = _value(t, i + 1)
            fn[k] = v
            if t[i] == "@@":
                i += 1
        return fn, i + 1
    if re.fullmatch(r"[A-Za-z_]\w*", x):
        return x, i + 1  # model value
    raise ValueError(x)


def _items(t, i, end):
    out = []
    while t[i] != end:
        v, i = _value(t, i)
        out.append(v)
        if t[i] == ",":
            i += 1
    return out, i + 1


def _hashable(v):
    try:
        hash(v)
        return True
    except TypeError:
        return False


def show(v):
    if isinstance(v, str):
        return f'"{v}"'
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, dict):
        return "[" + ", ".join(f"{k} |-> {show(x)}" for k, x in v.items()) + "]"
    if isinstance(v, (tuple, frozenset)):
        o, c = ("<<", ">>") if isinstance(v, tuple) else ("{", "}")
        return o + ", ".join(show(x) for x in (v if isinstance(v, tuple) else sorted(v, key=str))) + c
    return str(v)


# ---------- TLC output ----------

STATE = re.compile(r"^State (\d+): (.*)$")
BACK = re.compile(r"^(?:State \d+: )?Back to state:? (\d+)(?::\s*(.*))?")


def parse_trace(out):
    """TLC's error trace: [{'action': name, 'args': str, 'vars': {name: value}}], plus a lasso target."""
    states, cur, var, buf, loop = [], None, None, [], None

    def flush():
        nonlocal var, buf
        if cur is not None and var:
            cur["vars"][var] = parse_value(" ".join(buf))
        var, buf = None, []

    for line in out.splitlines():
        m, b = STATE.match(line), BACK.match(line)
        if b:
            flush()
            loop = int(b.group(1))
            am = re.match(r"<([\w!]+)(\(.*?\))?", b.group(2) or "")
            if 0 < loop <= len(states):  # the step that closes the lasso, back onto state `loop`
                states.append({"action": am.group(1) if am else "back", "args": (am.group(2) or "").strip("()") if am else "",
                               "vars": dict(states[loop - 1]["vars"])})
            cur = None
            continue
        if m:
            flush()
            head = m.group(2).strip()
            am = re.match(r"<([\w!]+)(\(.*?\))?(?: line .*)?>", head)
            action = "init" if "Initial predicate" in head else am.group(1) if am else head
            cur = {"action": action, "args": (am.group(2) or "").strip("()") if am else "", "vars": {}}
            states.append(cur)
            continue
        if cur is None:
            continue
        vm = re.match(r"^(?:/\\ )?(\w+) = (.*)$", line)
        if vm:
            flush()
            var, buf = vm.group(1), [vm.group(2)]
        elif line.strip() and var:
            buf.append(line.strip())
        elif not line.strip():
            flush()
            cur = None
    flush()
    return states, loop


def violated_name(out):
    m = re.search(r"Error: (?:Invariant|Action property|Temporal properties were) (\S+)? ?(?:is )?violated", out)
    if m:
        return m.group(1) or "a temporal property"
    if "Deadlock reached" in out:
        return "deadlock"
    m = re.search(r"Error: (?:The )?(?:first argument of )?Assert", out)
    return "assert" if m else None


def stats(out):
    g = re.search(r"(\d[\d,]*) states generated, (\d[\d,]*) distinct states found", out)
    d = re.search(r"depth of the complete state graph search is (\d+)", out)
    return (f"{g.group(2)} distinct states" if g else "") + (f", depth {d.group(1)}" if d else "")


def run_tlc(jar, spec, cfg, workers, extra_lib=None):
    meta = tempfile.mkdtemp(prefix="tlc-meta-")
    lib = os.path.dirname(os.path.abspath(spec))
    cmd = ["java", "-XX:+UseParallelGC", f"-DTLA-Library={extra_lib or lib}", "-cp", jar, "tlc2.TLC",
           "-config", cfg, "-workers", str(workers), "-metadir", meta, "-cleanup", spec]
    t0 = time.time()
    p = subprocess.run(cmd, capture_output=True, text=True, cwd=lib)
    shutil.rmtree(meta, ignore_errors=True)
    return p.returncode, p.stdout + p.stderr, time.time() - t0


# ---------- config and witness wrapper ----------

def read_cfg(path):
    text = re.sub(r"\\\*.*", "", open(path).read())
    text = re.sub(r"\(\*.*?\*\)", "", text, flags=re.S)
    parts = re.split(r"\b(" + "|".join(CFG_KEYS) + r")\b", text)
    return [(parts[i], parts[i + 1].strip()) for i in range(1, len(parts) - 1, 2)]


def witness(jar, spec, cfg, pred, workers):
    """TLC finds a behavior reaching a state where pred holds, by checking ~pred as an invariant."""
    name = os.path.splitext(os.path.basename(spec))[0]
    tmp = tempfile.mkdtemp(prefix="tlc-witness-")
    mod = f"Witness_{name}"
    with open(os.path.join(tmp, mod + ".tla"), "w") as f:
        f.write(f"---- MODULE {mod} ----\nEXTENDS {name}\nWitnessNotReached == ~({pred})\n====\n")
    keep = [(k, v) for k, v in read_cfg(cfg) if k not in ("INVARIANT", "INVARIANTS", "PROPERTY", "PROPERTIES", "CHECK_DEADLOCK")]
    with open(os.path.join(tmp, mod + ".cfg"), "w") as f:
        f.write("\n".join(f"{k} {v}" for k, v in keep) + "\nINVARIANT WitnessNotReached\nCHECK_DEADLOCK FALSE\n")
    lib = os.path.dirname(os.path.abspath(spec))
    code, out, _ = run_tlc(jar, os.path.join(tmp, mod + ".tla"), os.path.join(tmp, mod + ".cfg"), workers, extra_lib=lib)
    shutil.rmtree(tmp, ignore_errors=True)
    if code == 12:
        return parse_trace(out)[0]
    if code == 0:
        return None
    sys.exit(f"witness check failed ({EXIT.get(code, code)}) for: {pred}\n{tail(out)}")


def tail(out, n=25):
    return "\n".join(out.strip().splitlines()[-n:])


# ---------- chart paths ----------

def chart_var(states, chart):
    names = states[0]["vars"].keys() if states else []
    exact = [v for v in names if v == chart]
    return (exact or [v for v in names if v.endswith("_" + chart)] or [None])[0]


def positions(vars_, cv):
    v = vars_.get(cv)
    if isinstance(v, dict):
        return {str(k): str(x) for k, x in v.items()}
    return {"user": str(v)} if v is not None else {}


def walk(states, chart):
    """Per step: who moved, what it did, which node it left and reached, and what else changed."""
    cv = chart_var(states, chart)
    prefix = cv[: -len(chart)] if cv and cv != chart else ""
    steps, prev = [], None
    for s in states:
        pos = positions(s["vars"], cv)
        if prev is None:
            prev = s
            continue
        ppos = positions(prev["vars"], cv)
        movers = [a for a in pos if pos.get(a) != ppos.get(a)]
        actor = (movers[0] if movers else s["args"].strip('"') or "-")
        changed = []
        for k, v in s["vars"].items():
            if k == cv or prev["vars"].get(k) == v:
                continue
            old = prev["vars"].get(k)
            if isinstance(v, dict) and isinstance(old, dict):
                changed += [f"{k[len(prefix):]}[{i}] = {show(x)}" for i, x in v.items() if old.get(i) != x]
            else:
                changed.append(f"{k[len(prefix):]} = {show(v)}")
        steps.append({"actor": actor, "action": s["action"][len(prefix):] if s["action"].startswith(prefix) else s["action"],
                      "src": ppos.get(actor), "dst": pos.get(actor), "changed": changed})
        prev = s
    return steps


def actor_path(states, chart, actor):
    cv = chart_var(states, chart)
    seq = []
    for s in states:
        n = positions(s["vars"], cv).get(actor)
        if n and (not seq or seq[-1] != n):
            seq.append(n)
    return seq


def print_steps(steps, loop=None):
    for i, s in enumerate(steps, 1):
        move = f"{s['src']} -> {s['dst']}" if s["src"] != s["dst"] else f"stays on {s['dst']}"
        extra = f"   ({'; '.join(s['changed'])})" if s["changed"] else ""
        print(f"  {i}. {s['actor']} {s['action']}: {move}{extra}")
    if loop:
        print(f"  ... and from there the last {len(steps) - loop + 1} steps repeat forever")


# ---------- the chart (.viz) ----------

def read_chart(path):
    """Nodes with their `state:` predicate and `fails:` invariant, and the named story paths."""
    lines = open(path).read().splitlines()
    nodes, stories, cur = {}, [], None
    for i, raw in enumerate(lines):
        t = raw.strip()
        d = re.match(r"^\s+(state|fails):\s*(.*)$", raw)
        if d and cur:
            nodes[cur][d.group(1)] = d.group(2).strip()
            continue
        if not t or t.startswith(("//", "==", "view:", "ranks:", "title ", "sub ", "base ")) or re.match(r"^\s", raw):
            continue
        p = re.match(r"^([\w.$-]+):\s+([\w.$-]+(?:\s*>\s*[\w.$-]+)*)\s*(=>|=\|)\s*([\w.$-]+)\s*(\|.*)?$", t)
        if p:
            ids = re.split(r"\s*>\s*", p.group(2)) + [p.group(4)]
            stories.append({"name": p.group(1), "ids": ids, "line": i, "tail": p.group(5) or ""})
            cur = None
            continue
        n = re.match(r"^([+\-~!*?]?)([\w.$-]+):\s*(.*)$", t)
        if n and "->" not in t and "~>" not in t:
            cur = n.group(2)
            nodes[cur] = {"line": i, "state": None, "fails": None}
            continue
        cur = None
    return lines, nodes, stories


def node_pred(nodes, nid, cv):
    return nodes[nid]["state"] or f'\\E a \\in DOMAIN {cv} : {cv}[a] = "{nid}"'


def is_subsequence(want, have):
    it = iter(have)
    return all(x in it for x in want)


def mark_node(lines, nodes, nid, mark):
    i = nodes[nid]["line"]
    lines[i] = re.sub(r"^(\s*)[+\-~!*?]?", lambda m: m.group(1) + mark, lines[i], count=1)


def check_stories(jar, spec, cfg, nodes, stories, chart_name, cv, workers):
    """story name -> (reached, actor path or None)"""
    res = {}
    for st in stories:
        end = st["ids"][-1]
        if end not in nodes or nodes[end]["fails"]:
            continue
        tr = witness(jar, spec, cfg, node_pred(nodes, end, cv), workers)
        if tr is None:
            res[st["name"]] = (False, None)
            continue
        steps = walk(tr, chart_name)
        last = steps[-1]["actor"] if steps else "user"
        path = actor_path(tr, chart_name, last)
        res[st["name"]] = (True, path)
    return res


# ---------- commands ----------

def cmd_run(a):
    jar = jar_path(a.jar)
    spec = os.path.abspath(a.spec)
    cfg = os.path.abspath(a.config or os.path.splitext(spec)[0] + ".cfg")
    code, out, secs = run_tlc(jar, spec, cfg, a.workers)
    what = EXIT.get(code, f"exit {code}")
    print(f"current ({os.path.basename(cfg)}): {what} · {stats(out)} · {secs:.1f}s · TLC {TLA_VERSION}")
    if code not in (0, 10, 11, 12, 13, 14):
        print(tail(out))
        return 2
    bad = None
    if code != 0:
        inv = violated_name(out) or what
        states, loop = parse_trace(out)
        steps = walk(states, a.chart)
        print(f"counterexample for {inv}, {len(steps)} steps:")
        print_steps(steps, loop)
        bad = {"inv": inv, "states": states, "steps": steps, "loop": loop}
    fixed_code = None
    if a.fix:
        fcfg = os.path.abspath(a.fix)
        fixed_code, fout, fsecs = run_tlc(jar, spec, fcfg, a.workers)
        print(f"fixed ({os.path.basename(fcfg)}): {EXIT.get(fixed_code, fixed_code)} · {stats(fout)} · {fsecs:.1f}s")
        if fixed_code != 0:
            fs, floop = parse_trace(fout)
            print(f"the fix still fails {violated_name(fout) or ''}:")
            print_steps(walk(fs, a.chart), floop)
    if a.viz:
        write_chart(a, jar, spec, cfg, bad)
    final = fixed_code if a.fix else code
    return 0 if final == 0 else 1


def write_chart(a, jar, spec, cfg, bad):
    lines, nodes, stories = read_chart(a.viz)
    cv = a.chart
    now = check_stories(jar, spec, cfg, nodes, stories, a.chart, cv, a.workers)
    after = check_stories(jar, spec, os.path.abspath(a.fix), nodes, stories, a.chart, cv, a.workers) if a.fix else now
    print("stories:")
    for st in stories:
        if st["name"] not in now:
            continue
        r0, p0 = now[st["name"]]
        r1, p1 = after[st["name"]]
        end = st["ids"][-1]
        if r0 and r1:
            verdict = "works"
        elif r1:
            verdict = "fixed"
            lines[st["line"]] = "+" + lines[st["line"]].lstrip("+-!")
            mark_node(lines, nodes, end, "+")
        elif r0:
            verdict = "broken by the fix"
            mark_node(lines, nodes, end, "?")
        else:
            verdict = "unreached"
            mark_node(lines, nodes, end, "?")
        path = p1 or p0
        if path and not is_subsequence(st["ids"][:-1], path):
            verdict += f" (reached via {' > '.join(path)}, not the drawn path)"
        print(f"  {st['name']}: {verdict}")
    for nid, n in nodes.items():
        if n["fails"] and not (bad and bad["inv"] == n["fails"]):
            print(f"  {nid}: never reached ({n['fails']} holds)")
    add = []
    if bad:
        harm = next((nid for nid, n in nodes.items() if n["fails"] == bad["inv"]), None)
        if harm:
            mark_node(lines, nodes, harm, "!")
        else:
            harm = "violated_" + re.sub(r"\W", "_", bad["inv"])
            add.append(f"!{harm}: {bad['inv']} fails [state]")
        last = bad["steps"][-1]["actor"] if bad["steps"] else "user"
        path = actor_path(bad["states"], a.chart, last) or ["init"]
        for s in bad["steps"]:
            hop = f"{s['src']} > {s['dst']}" if s["src"] and s["dst"] and s["src"] != s["dst"] else (s["dst"] or harm)
            note = f"{s['action']}" + (f": {'; '.join(s['changed'])}" if s["changed"] else "")
            add.append(f"!{hop} | {s['actor']} | {note}")
        story = ", then ".join(f"{s['actor']} {s['action']}" for s in bad["steps"])
        cx = "cx_" + re.sub(r"\W", "_", bad["inv"])
        add.append(f"!{cx}: {' > '.join(path)} => {harm} | counterexample | {story}: {bad['inv']} fails.")
    out = a.o or os.path.splitext(a.viz)[0] + ".checked.viz"
    with open(out, "w") as f:
        f.write("\n".join(lines + add) + "\n")
    print(f"chart: {out}")
    if os.path.exists(VIZ_PY):
        subprocess.run([sys.executable, VIZ_PY, "check", out])


def cmd_log(a):
    out = sys.stdin.read() if a.trace == "-" else open(a.trace).read()
    states, loop = parse_trace(out)
    if not states:
        print("no trace in the log")
        return 0
    steps = walk(states, a.chart)
    print(f"counterexample for {violated_name(out) or '?'}, {len(steps)} steps:")
    print_steps(steps, loop)
    return 1


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("spec")
    r.add_argument("--config")
    r.add_argument("--chart", default="ui", help="variable mapping each actor to its statechart node (default ui)")
    r.add_argument("--viz", help="the statechart drawn before modeling")
    r.add_argument("--fix", help="config of the fixed model, same spec")
    r.add_argument("-o", help="output chart (default CHART.checked.viz)")
    r.add_argument("--jar")
    r.add_argument("--workers", default="auto")
    lg = sub.add_parser("log")
    lg.add_argument("trace")
    lg.add_argument("--chart", default="ui")
    sub.add_parser("jar")
    a = ap.parse_args()
    if a.cmd == "jar":
        print(jar_path())
        return 0
    return cmd_run(a) if a.cmd == "run" else cmd_log(a)


if __name__ == "__main__":
    sys.exit(main())
