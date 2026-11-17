// emphasis.js: draws every <script type="text/emphasis"> block on the page as a status board.
// The data format is in ../SKILL.md. The VOCAB block below is the single source of the pill words:
// scripts/emphasis.py reads it to lint, and references/words.md is checked against it.
(() => {
  /* VOCAB:start */
  const VOCAB = {
    error: ["Failed", "Blocked", "Broken", "Unsafe", "Rejected", "Down"],
    warning: ["Needs you", "Decision", "Unverified", "Partial", "Skipped", "In progress", "Pending", "At risk", "Review", "Todo", "Stale", "Draft"],
    success: ["Done", "Passed", "Observed", "Fixed", "Live", "Recommended", "Keep", "Ready", "Merged", "Safe", "Verified", "Shipped", "Approved", "Healthy"],
    danger: ["Costs money", "Destructive", "Irreversible"],
    mode: ["Brainstorm", "Investigate", "Preview", "Implement", "Qualify"],
    owner: ["Owned", "Shared", "Foreign"],
    context: ["Inferred", "New", "Changed", "Optional"],
    synonyms: { Completed: "Done", Complete: "Done", OK: "Done", Finished: "Done", Fail: "Failed", Failing: "Failed", Error: "Failed", Pass: "Passed", Waiting: "Pending", "Needs review": "Review" },
    leadins: ["Check", "Do", "Next", "Unblock", "Left", "Run", "Guard", "Undo", "See"],
    needsAction: ["error", "warning", "danger", "Inferred"],
  };
  /* VOCAB:end */

  const GLYPH = { error: "✕", warning: "!", success: "✓", danger: "⚠", mode: "◆", owner: "●", context: "·" };
  const WORD_GLYPH = { "Needs you": "➜", Decision: "⑂", Unverified: "?", "In progress": "◐", Pending: "…", Skipped: "↷", Inferred: "≈", Observed: "◉" };
  // Score order: failures and risks first, then asks, then results.
  const SCORE_TONES = ["error", "danger", "warning", "success"];
  const PINNED = ["Needs you", "Decision"];

  const lookup = new Map();
  for (const tone of ["error", "warning", "success", "danger", "mode", "owner", "context"])
    for (const w of VOCAB[tone]) lookup.set(w.toLowerCase(), { word: w, tone });
  for (const [from, to] of Object.entries(VOCAB.synonyms)) lookup.set(from.toLowerCase(), lookup.get(to.toLowerCase()));

  // "Failed: 3 tests" -> {word: Failed, tone: error, detail: "3 tests"}; unknown words are context.
  function parsePill(raw) {
    const text = raw.trim().replace(/\s+/g, " ");
    const words = text.split(" ");
    for (let n = Math.min(3, words.length); n > 0; n--) {
      const head = words.slice(0, n).join(" ").replace(/:$/, "");
      const hit = lookup.get(head.toLowerCase());
      if (hit) return { ...hit, detail: words.slice(n).join(" ").replace(/^[:\s]+/, ""), known: true };
    }
    return { word: text, tone: "context", detail: "", known: false };
  }

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const LEAD = new RegExp(`\\*\\*(${VOCAB.leadins.join("|")}):\\*\\*`, "g");

  function inline(s) {
    const parts = s.split(/(`[^`]+`)/);
    return parts.map((p) => {
      if (p.startsWith("`") && p.endsWith("`") && p.length > 1) return `<code>${esc(p.slice(1, -1))}</code>`;
      return esc(p)
        .replace(/\[\[([^\]]{1,40})\]\]/g, (_, raw) => pillHTML(parsePill(raw), "inline"))
        .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
        .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<i>$2</i>")
        .replace(/✓/g, '<span class="em-ok">✓</span>').replace(/✗/g, '<span class="em-bad">✗</span>')
        .replace(/→/g, '<span class="em-arrow">→</span>');
    }).join("");
  }

  function pillHTML(p, cls = "") {
    const glyph = WORD_GLYPH[p.word] ?? GLYPH[p.tone];
    const detail = p.detail ? ` <span class="em-detail">${esc(p.detail)}</span>` : "";
    return `<span class="em-pill em-${p.tone} ${cls}"><span class="em-glyph">${glyph}</span>${esc(p.word)}${detail}</span>`;
  }

  // An item: "[[Word detail]] subject text **Next:** action". The action follows the subject, dimmed.
  function itemHTML(line) {
    const m = line.match(/^\s*(?:[-*]\s+)?\[\[([^\]]{1,40})\]\]\s*(.*)$/);
    const pill = parsePill(m[1]);
    let body = m[2], action = "";
    LEAD.lastIndex = 0;
    const lead = LEAD.exec(body);
    if (lead) {
      action = ` <span class="em-action"><span class="em-arrow">→</span> <b>${lead[1]}:</b> ${inline(body.slice(lead.index + lead[0].length).trim())}</span>`;
      body = body.slice(0, lead.index).trim();
    }
    return { pill, html: `${pillHTML(pill)}<div class="em-body">${inline(body)}${action}</div>` };
  }

  function render(src) {
    const out = [], items = [];
    let title = "", sub = "", list = null, group = null, mode = null;
    const close = () => {
      if (list) { out.push(`<ul>${list.join("")}</ul>`); list = null; }
      if (group) { if (group.length) out.push(`<div class="em-items">${group.join("")}</div>`); group = null; }
    };
    for (const raw of src.replace(/^\n+|\s+$/g, "").split("\n")) {
      const line = raw.replace(/\s+$/, "");
      if (!line.trim()) { close(); continue; }
      let m;
      if ((m = line.match(/^#\s+(.*)/))) { close(); title = m[1]; continue; }
      if ((m = line.match(/^sub:\s*(.*)/))) { sub = m[1]; continue; }
      if ((m = line.match(/^mode:\s*(.*)/))) { mode = parsePill(m[1]); continue; }
      if ((m = line.match(/^##\s+(.*)/))) { close(); out.push(`<h2>${inline(m[1])}</h2>`); continue; }
      if (/^\s*(?:[-*]\s+)?\[\[/.test(line)) {
        if (list) { out.push(`<ul>${list.join("")}</ul>`); list = null; }
        const it = itemHTML(line); items.push(it);
        // A pinned item is drawn once, in the box at the top.
        (group ??= []); if (!PINNED.includes(it.pill.word)) group.push(it.html);
        continue;
      }
      if (/^\s*(├──|└──|│)/.test(line)) { close(); out.push(`<div class="em-tree">${inline(line).replace(/(├──|└──|│)/g, '<span class="em-dim">$1</span>')}</div>`); continue; }
      if ((m = line.match(/^\s*[-*]\s+(.*)/))) { (list ??= []).push(`<li>${inline(m[1])}</li>`); continue; }
      close(); out.push(`<p>${inline(line)}</p>`);
    }
    close();

    const counts = new Map();
    for (const { pill } of items) if (SCORE_TONES.includes(pill.tone)) counts.set(pill.word, (counts.get(pill.word) ?? 0) + 1);
    const order = (w) => SCORE_TONES.indexOf(lookup.get(w.toLowerCase()).tone);
    const score = [...counts].sort((a, b) => order(a[0]) - order(b[0]) || b[1] - a[1])
      .map(([w, n]) => pillHTML({ ...lookup.get(w.toLowerCase()), detail: String(n) })).join("");
    const pinned = items.filter((it) => PINNED.includes(it.pill.word));
    const pin = pinned.length ? `<section class="em-pinned"><h2>Waiting on you</h2><div class="em-items">${pinned.map((it) => it.html).join("")}</div></section>` : "";

    const head = `<header><h1>${mode ? pillHTML(mode, "em-mode") : ""}${inline(title)}</h1>${sub ? `<div class="em-sub">${inline(sub)}</div>` : ""}${score ? `<div class="em-score">${score}</div>` : ""}</header>`;
    for (const it of items) if (!it.pill.known) console.warn(`emphasis: unknown pill word "${it.pill.word}", drawn as context`);
    // Drop a section label left with nothing under it (all its items were pinned).
    const body = out.join("").replace(/<h2>[^<]*<\/h2>(?=<h2>|$)/g, "");
    return `<article class="emphasis">${head}${pin}${body}</article>`;
  }

  const CSS = `
  :root { --em-bg:#fbfbfa; --em-fg:#1d2026; --em-muted:#69707d; --em-line:#e6e6e3; --em-card:#ffffff;
    --em-error:#c2412d; --em-error-bg:#fbe9e5; --em-warning:#9a6700; --em-warning-bg:#fdf3d7;
    --em-success:#1f7a45; --em-success-bg:#e3f4e9; --em-danger:#fff; --em-danger-bg:#c62828;
    --em-mode:#0b6e79; --em-mode-bg:#dcf3f5; --em-owner:#fff; --em-owner-bg:#2f5fd0; --em-context:#3b5b9a; --em-context-bg:#e7edf8; --em-accent:#9a6700; }
  @media (prefers-color-scheme: dark) { :root { --em-bg:#16181c; --em-fg:#e8e9ec; --em-muted:#9aa1ad; --em-line:#2b2f36; --em-card:#1d2025;
    --em-error:#ff9b8a; --em-error-bg:#3a1f1b; --em-warning:#f3c969; --em-warning-bg:#362c14; --em-success:#7fd6a0; --em-success-bg:#163323;
    --em-danger:#fff; --em-danger-bg:#b3261e; --em-mode:#7fdbe6; --em-mode-bg:#123236; --em-owner:#fff; --em-owner-bg:#3a6ae0; --em-context:#a9c1f0; --em-context-bg:#1d2a42; --em-accent:#e9c46a; } }
  html, body { margin:0; background:var(--em-bg); }
  .emphasis { color:var(--em-fg); font:16px/1.55 ui-sans-serif, -apple-system, "SF Pro Text", system-ui, sans-serif; max-width:900px; margin:0 auto; padding:24px 28px 32px; }
  .emphasis header { margin-bottom:6px; }
  .emphasis h1 { display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-size:24px; line-height:1.25; margin:0 0 2px; letter-spacing:-0.01em; }
  .emphasis h2 { font-size:15px; color:var(--em-accent); margin:20px 0 6px; font-weight:700; }
  .emphasis p, .emphasis li { margin:4px 0; }
  .emphasis ul { padding-left:20px; margin:4px 0; }
  .emphasis b { font-weight:650; }
  .emphasis code { font:0.88em ui-monospace, "SF Mono", Menlo, monospace; background:var(--em-line); padding:0 5px; border-radius:4px; }
  .em-sub { color:var(--em-muted); font-size:14px; }
  .em-score { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
  .em-pill { display:inline-flex; align-items:center; gap:5px; padding:1px 8px; border-radius:6px; font-size:13.5px; font-weight:650; white-space:nowrap; line-height:1.55; }
  .em-pill.inline { vertical-align:1px; }
  .em-glyph { font-family:-apple-system, "Apple Symbols", "Segoe UI Symbol", system-ui, sans-serif; font-size:0.95em; }
  .em-detail { font-weight:500; opacity:.85; }
  ${["error", "warning", "success", "danger", "mode", "owner", "context"].map((t) => `.em-${t}{color:var(--em-${t});background:var(--em-${t}-bg)}`).join("")}
  .em-mode { font-size:12px; letter-spacing:.04em; text-transform:uppercase; }
  .em-items { display:grid; grid-template-columns:minmax(104px, max-content) 1fr; column-gap:12px; row-gap:7px; align-items:baseline; }
  .em-items > .em-pill { justify-self:start; }
  .em-action { color:var(--em-muted); }
  .em-action b { color:var(--em-fg); }
  .em-pinned { margin:16px 0 4px; padding:2px 14px 12px; border:1px solid var(--em-line); border-left:3px solid var(--em-warning); background:var(--em-card); border-radius:0 8px 8px 0; }
  .em-pinned h2 { color:var(--em-warning); margin:10px 0 8px; }
  .em-tree { font:14.5px/1.6 ui-monospace, "SF Mono", Menlo, monospace; white-space:pre; }
  .em-dim { color:var(--em-muted); opacity:.6; }
  .em-ok { color:var(--em-success); font-weight:700; } .em-bad { color:var(--em-error); font-weight:700; } .em-arrow { color:var(--em-mode); font-weight:700; }
  html.em-t3, html.em-t3 body { background:transparent; }
  .em-t3 { --em-bg:transparent; --em-fg:var(--foreground); --em-muted:var(--muted-foreground); --em-line:var(--border); --em-card:var(--card); }
  .em-t3 .emphasis { padding:0; max-width:none; font-family:var(--font-sans); }
  .em-t3 .em-pinned { border-radius:0 var(--radius) var(--radius) 0; }
  @media (max-width:520px) { .em-items { grid-template-columns:1fr; row-gap:2px; } .em-items > .em-body { margin-bottom:8px; } .emphasis { padding:16px; } }`;

  function mount() {
    if (document.documentElement.classList.contains("em-t3") === false && document.querySelector('style#t3-theme')) document.documentElement.classList.add("em-t3");
    if (!document.getElementById("em-style")) {
      const st = document.createElement("style"); st.id = "em-style"; st.textContent = CSS; document.head.appendChild(st);
    }
    for (const s of document.querySelectorAll('script[type="text/emphasis"]:not([data-done])')) {
      // A page without <body> parses its scripts into <head>; draw those once <body> exists.
      if (s.closest("head") && !document.body) continue;
      s.dataset.done = "1";
      const div = document.createElement("div");
      try { div.innerHTML = render(s.textContent); } catch (e) { console.error("emphasis:", e); div.textContent = s.textContent; }
      if (s.closest("head")) document.body.appendChild(div); else s.after(div);
    }
  }
  window.emphasis = { render, parsePill, VOCAB };
  // Draw now for blocks above this script; DOMContentLoaded picks up blocks placed after it.
  mount();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
})();
