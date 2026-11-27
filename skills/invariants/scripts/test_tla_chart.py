#!/usr/bin/env python3
"""Regression check for tla_chart.py on variants of the gift card example. Builds everystate once (git, cargo).

  python3 test_tla_chart.py
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "tla_chart.py")
EXAMPLE = os.path.join(HERE, "..", "assets", "tla", "giftcard")


def run(folder, *args):
    p = subprocess.run([sys.executable, SCRIPT, "run", "GiftCard.tla", *args], cwd=folder, capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr


def variant(edit_spec=None, edit_chart=None, cfg=None):
    d = tempfile.mkdtemp(prefix="tla-chart-test-")
    for f in os.listdir(EXAMPLE):
        shutil.copy(os.path.join(EXAMPLE, f), d)
    for name, edit in (("GiftCard.tla", edit_spec), ("chart.viz", edit_chart)):
        if edit:
            p = os.path.join(d, name)
            with open(p) as f:
                text = edit(f.read())
            with open(p, "w") as f:
                f.write(text)
    if cfg:
        with open(os.path.join(d, "Test.cfg"), "w") as f:
            f.write(cfg)
    return d


FAILS = []


def expect(label, out, *patterns, absent=()):
    for pat in patterns:
        if not re.search(pat, out, re.M):
            FAILS.append(f"{label}: missing /{pat}/")
    for pat in absent:
        if re.search(pat, out, re.M):
            FAILS.append(f"{label}: unexpected /{pat}/")


def main():
    # 1. The example as shipped: one bug, fixed by the conditional write, one dead arrow.
    d = variant()
    code, out = run(d, "--viz", "chart.viz", "--fix", "GiftCardFixed.cfg", "--require-rule", "NoDoubleCredit")
    chart = open(os.path.join(d, "chart.checked.viz")).read()
    expect("example", out, r"^  NoDoubleCredit: broken, 4 steps", r"^    4\. t2 Answer: checking -> credited",
           r"^  redeem: works", r"^  twotabs: fixed", r"^  dropped: unreached", r"checking -> offline: the model never takes")
    expect("example chart", chart, r"^!twice:", r"^\+both:", r"^\?offline:", r"^!cx_NoDoubleCredit: form > checking > credited => twice",
           r"^dropped: form > checking =\| offline")
    if code != 0:
        FAILS.append(f"example: exit {code}, want 0 (the fix is clean)")

    # 2. Same trace on every run (breadth-first, one thread).
    _, again = run(d, "--viz", "chart.viz", "--fix", "GiftCardFixed.cfg")
    if re.findall(r"^    \d\..*$", again, re.M) != re.findall(r"^    \d\..*$", out, re.M):
        FAILS.append("determinism: the counterexample changed between two runs")

    # 3. A stuck end state is a deadlock once Done is gone.
    d = variant(edit_spec=lambda s: s.replace(" \\/ Done", ""))
    code, out = run(d)
    expect("no Done", out, r"^  deadlock: broken")
    if code != 1:
        FAILS.append(f"no Done: exit {code}, want 1")

    # 4. Every rule gets a verdict: two invariants, deadlock, and two properties, one of them a lasso.
    extra = """
Retry(t) == /\\ ui[t] = "rejected" /\\ ui' = [ui EXCEPT ![t] = "form"] /\\ UNCHANGED <<card, credits, seen>>
Next2 == (\\E t \\in Tabs : Press(t) \\/ Answer(t) \\/ Retry(t)) \\/ Done
Spec == Init /\\ [][Next2]_vars /\\ \\A t \\in Tabs : WF_vars(Answer(t))
SeenOK == \\A t \\in Tabs : seen[t] \\in {"none", "unused"}
Answered == \\A t \\in Tabs : (ui[t] = "checking") ~> (ui[t] # "checking")
AllCredited == <>(\\A t \\in Tabs : ui[t] = "credited")
===="""
    d = variant(edit_spec=lambda s: s.replace("====", extra),
                edit_chart=lambda c: re.sub(r"checking -> rejected.*\n|reuse:.*\n", "", c),
                cfg="CONSTANTS Tabs = {t1, t2}\nFix = FALSE\nSPECIFICATION Spec\n"
                    "INVARIANTS NoDoubleCredit SeenOK\nPROPERTIES Answered AllCredited\n")
    code, out = run(d, "--config", "Test.cfg", "--viz", "chart.viz",
                    "--require-rule", "SeenOK", "--require-rule", "Answered")
    expect("rules", out, r"^  NoDoubleCredit: broken", r"^  SeenOK: broken", r"^  deadlock: holds", r"^  Answered: holds",
           r"^  AllCredited: broken", r"repeat forever", r"checking -> rejected by Answer: no arrow",
           r"rejected -> form by Retry: no arrow")

    # 5. A story the model reaches only by another route than the one drawn.
    d = variant(edit_chart=lambda c: c.replace("reuse: form > checking => rejected", "reuse: form => rejected"))
    _, out = run(d, "--viz", "chart.viz", "--fix", "GiftCardFixed.cfg")
    expect("route", out, r"^  reuse: reached only via form > checking > rejected", r"form -> rejected: the model never takes")

    # 6. Over --graph-limit, stories fall back to witness runs and say so.
    d = variant()
    _, out = run(d, "--viz", "chart.viz", "--fix", "GiftCardFixed.cfg", "--graph-limit", "3")
    expect("fallback", out, r"state graph skipped", r"^  twotabs: fixed", absent=[r"never takes this arrow"])

    # 7. Types: names from the spec, values from the reachable states, composite Next left out.
    d = variant()
    p = subprocess.run([sys.executable, SCRIPT, "types", "GiftCard.tla"], cwd=d, capture_output=True, text=True)
    expect("types", p.stdout, r'^  card: "unused" \| "used";', r'^  credits: number;',
           r'^  ui: Partial<Record<"t1" \| "t2", "checking" \| "credited" \| "form" \| "rejected">>;',
           r'^  \| \{ action: "Press"; params\?: \["t1" \| "t2"\]', r'^  \| \{ action: "Done"; params\?: \[\]',
           absent=[r'action: "Next"', r'action: "Init"'])

    # 8. Conform: a double credit breaks the fixed model (20) and the current model's invariant (12).
    with open(os.path.join(d, "double.jsonl"), "w") as f:
        f.write('{"state":{"card":"unused","credits":0}}\n{"action":"Press","params":["t1"]}\n'
                '{"action":"Press","params":["t2"]}\n{"action":"Answer","params":["t1"],"state":{"credits":1}}\n'
                '{"action":"Answer","params":["t2"],"state":{"credits":2}}\n')
    for cfg, want in (("GiftCardFixed.cfg", 20), ("GiftCard.cfg", 12)):
        p = subprocess.run([sys.executable, SCRIPT, "conform", "double.jsonl", "GiftCard.tla", "--config", cfg],
                           cwd=d, capture_output=True, text=True)
        if p.returncode != want:
            FAILS.append(f"conform {cfg}: exit {p.returncode}, want {want}\n{p.stdout}{p.stderr}")

    # 9. No cargo, and no network, each exit 3 with the fix and the ask-first line (empty cache, no $EVERYSTATE).
    bare = tempfile.mkdtemp(prefix="tla-nocargo-")
    git = shutil.which("git")
    os.symlink(git, os.path.join(bare, "git"))
    for label, env in (("no cargo", {"PATH": bare}),
                       ("offline", {"https_proxy": "http://127.0.0.1:9", "HTTPS_PROXY": "http://127.0.0.1:9"})):
        e = {k: v for k, v in os.environ.items() if k != "EVERYSTATE"}
        e.update(env, XDG_CACHE_HOME=tempfile.mkdtemp(prefix="tla-cache-"))
        p = subprocess.run([sys.executable, SCRIPT, "run", "GiftCard.tla"], cwd=EXAMPLE, capture_output=True, text=True, env=e)
        if p.returncode != 3:
            FAILS.append(f"{label}: exit {p.returncode}, want 3")
        expect(label, p.stderr, r"^SETUP NEEDED: ", r"^  fix: ", r"ask whether to set it up", absent=[r"Traceback"])

    for f in FAILS:
        print("FAIL", f)
    print("ok" if not FAILS else f"{len(FAILS)} failed")
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
