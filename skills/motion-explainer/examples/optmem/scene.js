// OptMem from ky (src/memory.ts): an append-only log whose neighbours fold into a summary tree.
mx.scene({
  title: ["#optmem", "memory that folds"],
  highlight: ["one line", "folds", "the tree grows upward."],
}, (s) => {
  const leaves = [
    "user builds ky on Cloudflare", "ky lives in one Durable Object", "user wants terse answers", "main model: Kimi K2.7",
    "runner 'mac' connected", "narration voice: af_heart", "OptMem ported to SQLite", "explainers in Kit's style",
  ];
  const X = (i) => 267 + i * 198, Y = [800, 610, 430, 255], R = [0, 30, 38, 50];
  const cite = "src/memory.ts";

  s.act("the log", 0);
  s.pan(0, { y: -250 }, { dur: 0 });
  leaves.forEach((text, i) => s.box(`l${i}`, `#${i}`, {
    size: "sm", at: { x: X(i), y: Y[0] }, enter: `memory+${i * 0.2}`,
    inspect: { body: "memory_note appends one dated line to memo_log. Lines are never rewritten.", cite: `${cite}:260 note()` },
  }).set(`memory+${i * 0.2 + 0.15}`, { status: text }, { dur: 0 }));

  // two neighbours owe a nap
  s.act("folding", "two-0.2");
  s.el("l0").set("two", { tone: "amber", pulse: 1 }, { dur: 0.3 });
  s.el("l1").set("two", { tone: "amber", pulse: 1 }, { dur: 0.3 });
  s.group(["l0", "l1"], "<em>nap owed</em> · #0-1", { enter: "two", exit: "folds+0.1" });

  const blocks = [
    [0, 2, "ky: one Durable Object on Cloudflare", "folds"],
    [2, 4, "terse answers, Kimi K2.7", "one#2"],
    [4, 6, "mac runner up; voice af_heart", "then"],
    [6, 8, "OptMem on SQLite; Kit-style explainers", "then+0.35"],
    [0, 4, "ky: terse Kimi agent in one DO", "fold"],
    [4, 8, "runner, voice, memory, explainers", "fold+0.5"],
    [0, 8, "ky: a terse agent that remembers", "tree"],
  ];
  for (const [lo, hi, summary, when] of blocks) {
    const level = Math.log2(hi - lo), id = `${lo}-${hi - 1}`, half = (lo + hi) / 2;
    const kids = level === 1 ? [`l${lo}`, `l${lo + 1}`] : [`${lo}-${half - 1}`, `${half}-${hi - 1}`];
    if (level === 3) s.act("the tree", `${when}-0.1`);
    s.orb(id, `#${id}`, {
      at: { x: (X(lo) + X(hi - 1)) / 2, y: Y[level] }, r: R[level], dots: [0, 120, 170, 260][level], status: summary, labelSide: "right",
      inspect: {
        body: `memory_nap folds ${hi - lo} memories into one line in memo_tree.`,
        more: `memory_zoom #${id}\n${kids.map((k) => `#${k.replace("l", "")}`).join("\n")} — the halves it summarises`,
        cite: [`${cite}:270 nap()`, `${cite}:329 zoom()`],
      },
    }).assemble(when, kids, { dur: level === 3 ? 1.9 : 1.6 });
    for (const k of kids) s.wire(k, id, { enter: `${when}+0.9`, enterDur: 0.6 });
    if (level === 1) for (const k of kids) s.el(k).set(`${when}-0.1`, { tone: "amber", pulse: 0 }, { dur: 0.15 }).set(`${when}+1.1`, { tone: "dim" }, { dur: 0.4 });
  }
  s.pan("folds-0.8", { y: 0 }, { dur: 5.4 });
  s.callout("0-7", "memory_nap", "one line, ≤ 280 bytes", { side: "left", enter: "tree+1.5", inspect: { body: "Summaries over ENTRY_BYTES are rejected; the agent compresses again.", cite: `${cite}:26 ENTRY_BYTES` } });
});
