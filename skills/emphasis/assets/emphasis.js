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
  const SCORE_TONES = ["success", "error", "warning", "danger"];
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

  // An item: "[[Word detail]] subject text **Next:** action". The action splits onto its own row.
  function itemHTML(line) {
    const m = line.match(/^\s*(?:[-*]\s+)?\[\[([^\]]{1,40})\]\]\s*(.*)$/);
    const pill = parsePill(m[1]);
    let body = m[2], action = "";
    LEAD.lastIndex = 0;
    const lead = LEAD.exec(body);
    if (lead) {
      action = `<div class="em-action"><span class="em-lead">${lead[1]}</span>${inline(body.slice(lead.index + lead[0].length).trim())}</div>`;
      body = body.slice(0, lead.index).trim();
    }
    return { pill, html: `<div class="em-item em-tone-${pill.tone}" data-word="${esc(pill.word)}">${pillHTML(pill)}<div class="em-body"><div class="em-subject">${inline(body)}</div>${action}</div></div>` };
  }

  function render(src) {
    const out = [], items = [];
    let title = "", sub = "", list = null, mode = null;
    const close = () => { if (list) { out.push(`<ul>${list.join("")}</ul>`); list = null; } };
    for (const raw of src.replace(/^\n+|\s+$/g, "").split("\n")) {
      const line = raw.replace(/\s+$/, "");
      if (!line.trim()) { close(); continue; }
      let m;
      if ((m = line.match(/^#\s+(.*)/))) { close(); title = m[1]; continue; }
      if ((m = line.match(/^sub:\s*(.*)/))) { sub = m[1]; continue; }
      if ((m = line.match(/^mode:\s*(.*)/))) { mode = parsePill(m[1]); continue; }
      if ((m = line.match(/^##\s+(.*)/))) { close(); out.push(`<h2>${inline(m[1])}</h2>`); continue; }
      if (/^\s*(?:[-*]\s+)?\[\[/.test(line)) { close(); const it = itemHTML(line); items.push(it); out.push(it); continue; }
      if (/^\s*(├──|└──|│)/.test(line)) { close(); out.push(`<div class="em-tree">${inline(line).replace(/(├──|└──|│)/g, '<span class="em-dim">$1</span>')}</div>`); continue; }
      if ((m = line.match(/^\s*[-*]\s+(.*)/))) { (list ??= []).push(`<li>${inline(m[1])}</li>`); continue; }
      close(); out.push(`<p>${inline(line)}</p>`);
    }
    close();

    const counts = new Map();
    for (const { pill } of items) if (SCORE_TONES.includes(pill.tone)) counts.set(pill.word, (counts.get(pill.word) ?? 0) + 1);
    const order = (w) => SCORE_TONES.indexOf(lookup.get(w.toLowerCase()).tone);
    const score = [...counts].sort((a, b) => order(b[0]) - order(a[0]) || b[1] - a[1])
      .map(([w, n]) => pillHTML({ ...lookup.get(w.toLowerCase()), detail: String(n) }, "em-score-pill")).join("");
    const pinned = items.filter((it) => PINNED.includes(it.pill.word));
    const pin = pinned.length ? `<section class="em-pinned"><div class="em-pinned-label">Waiting on you</div>${pinned.map((it) => it.html).join("")}</section>` : "";

    const head = `<header>${mode ? pillHTML(mode, "em-mode") : ""}${title ? `<h1>${inline(title)}</h1>` : ""}${sub ? `<div class="em-sub">${inline(sub)}</div>` : ""}${score ? `<div class="em-score">${score}</div>` : ""}</header>`;
    for (const it of items) if (!it.pill.known) console.warn(`emphasis: unknown pill word "${it.pill.word}", drawn as context`);
    // A pinned item is drawn in full at the top; where it was written, it stays as one line.
    const body = out.map((o) => (typeof o === "string" ? o : PINNED.includes(o.pill.word) ? o.html.replace('class="em-item', 'class="em-item em-compact') : o.html));
    return `<article class="emphasis">${head}${pin}${body.join("")}</article>`;
  }

  const CSS = `
  :root { --em-bg:#fbfbfa; --em-fg:#1d2026; --em-muted:#69707d; --em-line:#e6e6e3; --em-card:#ffffff;
    --em-error:#c2412d; --em-error-bg:#fbe9e5; --em-warning:#9a6700; --em-warning-bg:#fdf3d7;
    --em-success:#1f7a45; --em-success-bg:#e3f4e9; --em-danger:#fff; --em-danger-bg:#c62828;
    --em-mode:#0b6e79; --em-mode-bg:#dcf3f5; --em-owner:#fff; --em-owner-bg:#2f5fd0; --em-context:#3b5b9a; --em-context-bg:#e7edf8; }
  @media (prefers-color-scheme: dark) { :root { --em-bg:#16181c; --em-fg:#e8e9ec; --em-muted:#9aa1ad; --em-line:#2b2f36; --em-card:#1d2025;
    --em-error:#ff9b8a; --em-error-bg:#3a1f1b; --em-warning:#f3c969; --em-warning-bg:#362c14; --em-success:#7fd6a0; --em-success-bg:#163323;
    --em-danger:#fff; --em-danger-bg:#b3261e; --em-mode:#7fdbe6; --em-mode-bg:#123236; --em-owner:#fff; --em-owner-bg:#3a6ae0; --em-context:#a9c1f0; --em-context-bg:#1d2a42; } }
  html, body { margin:0; background:var(--em-bg); }
  .emphasis { color:var(--em-fg); font:20px/1.5 ui-sans-serif, -apple-system, "SF Pro Text", system-ui, sans-serif; max-width:980px; margin:0 auto; padding:28px 32px 40px; }
  .emphasis header { margin-bottom:22px; }
  .emphasis h1 { font-size:34px; line-height:1.2; margin:10px 0 4px; letter-spacing:-0.01em; }
  .emphasis h2 { font-size:15px; text-transform:uppercase; letter-spacing:.08em; color:var(--em-muted); margin:30px 0 10px; font-weight:650; }
  .emphasis p, .emphasis li { margin:6px 0; }
  .emphasis ul { padding-left:24px; margin:8px 0; }
  .emphasis b { font-weight:680; }
  .emphasis code { font:0.85em ui-monospace, "SF Mono", Menlo, monospace; background:var(--em-line); padding:1px 6px; border-radius:5px; }
  .em-sub { color:var(--em-muted); font-size:18px; }
  .em-score { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
  .em-pill { display:inline-flex; align-items:center; gap:7px; padding:4px 13px 4px 11px; border-radius:999px; font-size:17px; font-weight:650; white-space:nowrap; line-height:1.35; }
  .em-pill.inline { font-size:0.82em; padding:1px 9px 1px 7px; vertical-align:1px; }
  .em-glyph { font-size:0.95em; opacity:.9; }
  .em-detail { font-weight:500; opacity:.85; }
  ${["error", "warning", "success", "danger", "mode", "owner", "context"].map((t) => `.em-${t}{color:var(--em-${t});background:var(--em-${t}-bg)}`).join("")}
  .em-score-pill { font-size:18px; padding:6px 15px 6px 12px; }
  .em-mode { font-size:14px; letter-spacing:.04em; text-transform:uppercase; }
  .em-item { display:grid; grid-template-columns:200px 1fr; gap:16px; align-items:start; padding:14px 16px; margin:8px 0; background:var(--em-card); border:1px solid var(--em-line); border-left:5px solid var(--em-line); border-radius:12px; }
  .em-tone-error { border-left-color:var(--em-error); } .em-tone-warning { border-left-color:var(--em-warning); } .em-tone-danger { border-left-color:var(--em-danger-bg); }
  .em-tone-success { border-left-color:var(--em-success); } .em-tone-mode { border-left-color:var(--em-mode); } .em-tone-owner { border-left-color:var(--em-owner-bg); } .em-tone-context { border-left-color:var(--em-context); }
  .em-item > .em-pill { justify-self:start; margin-top:1px; }
  .em-subject { font-size:20px; }
  .em-action { margin-top:6px; color:var(--em-muted); font-size:18px; }
  .em-lead { display:inline-block; color:var(--em-fg); font-weight:700; margin-right:8px; }
  .em-lead::after { content:":"; }
  .em-pinned { border:2px solid var(--em-warning); background:var(--em-warning-bg); border-radius:14px; padding:6px 12px 8px; margin:0 0 18px; }
  .em-pinned-label { font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--em-warning); margin:6px 4px 2px; }
  .em-pinned .em-item { margin:8px 0; }
  .em-compact { padding:8px 16px; opacity:.72; } .em-compact .em-action { display:none; } .em-compact .em-subject::after { content:"  ↑ pinned"; color:var(--em-muted); font-size:15px; }
  .em-tree { font-size:19px; white-space:pre; margin:2px 0; }
  .em-dim { color:var(--em-muted); opacity:.6; }
  .em-ok { color:var(--em-success); font-weight:700; } .em-bad { color:var(--em-error); font-weight:700; } .em-arrow { color:var(--em-mode); font-weight:700; }
  html.em-t3, html.em-t3 body { background:transparent; }
  .em-t3 { --em-bg:transparent; --em-fg:var(--foreground); --em-muted:var(--muted-foreground); --em-line:var(--border); --em-card:var(--card); }
  .em-t3 .emphasis { padding:0; max-width:none; font-family:var(--font-sans); }
  .em-t3 .em-item, .em-t3 .em-pinned { border-radius:var(--radius); }
  @media (max-width:640px) { .em-item { grid-template-columns:1fr; gap:8px; } .emphasis { padding:18px; font-size:18px; } }`;

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
