/* viz.js: renders compact `text/viz` blocks as interactive graphs (flow, ranked columns, sequence, states, stack),
   coverage strips, call trees and call diffs. Grammar: ../references/grammar.md. The page holds only data; this file is loaded from the CDN or inlined by scripts/viz.py. */
(() => {
  const CSS = `
.vz{--vz-fg:var(--foreground,#e9e6e1);--vz-dim:var(--muted-foreground,#8a857e);--vz-line:var(--border,rgba(255,255,255,.13));
--vz-amber:var(--warning,#e6b04f);--vz-coral:var(--destructive,#e0736a);--vz-green:var(--success,#9cc48a);--vz-blue:var(--info,#7aa2d6);
--vz-card:var(--card,rgba(255,255,255,.03));--vz-bg:var(--vz-ground,#0a0a0a);--vz-r:var(--radius,6px);--vz-out:cubic-bezier(.23,1,.32,1);
color:var(--vz-fg);font:12.5px/1.45 var(--font-mono,"IBM Plex Mono","Berkeley Mono",ui-monospace,SFMono-Regular,Menlo,monospace)}
.vz *{box-sizing:border-box}
.vz.vz-solo{background:#0a0a0a;padding:16px;border-radius:8px}
.vz-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;margin:0 0 8px}
.vz-title{font-weight:600;font-size:14px}.vz-sub{color:var(--vz-dim)}
.vz-tabs{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 8px}
.vz button{font:inherit;color:inherit;background:var(--vz-card);border:1px solid var(--vz-line);border-radius:var(--vz-r);padding:2px 8px;cursor:pointer;transition:border-color 160ms var(--vz-out),transform 160ms var(--vz-out)}
.vz button:active{transform:scale(.97)}.vz button[aria-pressed=true],.vz button[aria-selected=true]{border-color:var(--vz-amber);color:var(--vz-amber)}
.vz button:focus-visible,.vz [tabindex]:focus-visible{outline:1px solid var(--vz-amber);outline-offset:1px}
@media (hover:hover) and (pointer:fine){.vz button:hover{border-color:var(--vz-dim)}}
.vz-panel{border:1px solid var(--vz-line);border-radius:var(--vz-r);background:var(--vz-card);padding:16px}
.vz-err{color:var(--vz-coral);white-space:pre-wrap;margin:6px 0}
.vz-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 8px}
.vz-bar input[type=search]{font:inherit;color:inherit;background:transparent;border:1px solid var(--vz-line);border-radius:var(--vz-r);padding:2px 6px;min-width:0;flex:1 1 120px}
.vz-bar input[type=range]{flex:1 1 120px;accent-color:var(--vz-amber)}
.vz-count{color:var(--vz-dim);margin-left:auto}
.vz-flow{overflow-x:auto;overflow-y:hidden;padding:2px 0}.vz-stage{position:relative;margin:0 auto}
.vz-flow svg{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}.vz-flow .vz-hit{pointer-events:stroke;cursor:pointer}
.vz-flow path{transition:stroke 160ms var(--vz-out),opacity 160ms var(--vz-out)}
.vz-box{position:absolute;transform:translateX(-50%);padding:6px 9px;border:1px solid color-mix(in srgb,var(--vz-fg) 28%,transparent);border-radius:var(--vz-r);
background:linear-gradient(var(--vz-card),var(--vz-card)),linear-gradient(var(--vz-card),var(--vz-card)),var(--vz-bg);cursor:pointer;line-height:17px;white-space:nowrap;
transition:opacity 160ms var(--vz-out),border-color 160ms var(--vz-out),box-shadow 160ms var(--vz-out)}
.vz-box .vz-bs{color:var(--vz-dim);font-size:11px;line-height:15px}.vz-mk{font-weight:600}
.vz-box.s-add{border-color:var(--vz-green)}.vz-box.s-del{border-color:var(--vz-coral);border-style:dashed}.vz-box.s-del .vz-bl{text-decoration:line-through}
.vz-box.s-mod{border-color:var(--vz-amber)}.vz-box.s-fail{border-color:var(--vz-coral)}.vz-box.s-active{border-color:var(--vz-amber);border-style:dashed}.vz-box.s-unk{border-style:dashed}
.vz-box.s-add,.vz-box.s-del,.vz-box.s-mod,.vz-box.s-fail,.vz-box.s-active,.vz-box.s-unk{color:var(--vz-fg)}
.vz-box.s-add .vz-mk{color:var(--vz-green)}.vz-box.s-del .vz-mk,.vz-box.s-fail .vz-mk{color:var(--vz-coral)}.vz-box.s-mod .vz-mk,.vz-box.s-active .vz-mk{color:var(--vz-amber)}.vz-box.s-unk .vz-mk{color:var(--vz-dim)}
.vz-box.done{box-shadow:0 0 0 1px var(--vz-green)}.vz-box.now{box-shadow:0 0 0 2px var(--vz-amber)}.vz-box.nowfail{box-shadow:0 0 0 2px var(--vz-coral)}
.vz-pill{position:absolute;transform:translateX(-50%);height:20px;line-height:18px;padding:0 8px 0 2px;font-size:11px;white-space:nowrap;cursor:pointer;
border:1px solid var(--vz-line);border-radius:10px;background:linear-gradient(var(--vz-card),var(--vz-card)),var(--vz-bg);transition:opacity 160ms var(--vz-out),border-color 160ms var(--vz-out)}
.vz-pill.s-add{color:var(--vz-green)}.vz-pill.s-del{color:var(--vz-coral);text-decoration:line-through}.vz-pill.hot{border-color:var(--vz-amber)}
.vz-num{display:inline-block;min-width:16px;height:16px;padding:0 3px;margin-right:5px;border-radius:8px;background:var(--vz-amber);color:var(--vz-bg);text-align:center;line-height:16px;font-size:10px;font-weight:700;vertical-align:1px;text-decoration:none}
.vz-pill .vz-num:last-child{margin-right:-6px}
.vz-dimmed .vz-box:not(.hot),.vz-dimmed .vz-pill:not(.hot){opacity:.35}
.vz-legend{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px;color:var(--vz-dim);font-size:11px}.vz-legend .vz-hint{margin-left:auto}
.vz-hint{color:var(--vz-dim)}.vz-payload{color:var(--vz-amber);border:1px solid var(--vz-amber);border-radius:10px;padding:0 7px;font-size:11px}
.vz-hop{margin-right:14px;white-space:nowrap;display:inline-block}.vz-where{margin-top:4px;line-height:1.9}.vz-link .vz-num{text-decoration:none}
.vz-lab{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:10ch;flex:0 1 auto}
.vz-ref{color:var(--vz-dim);margin-left:auto;white-space:nowrap;font-size:11px;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1000 auto}
.s-add{color:var(--vz-green)}.s-del{color:var(--vz-coral)}.s-mod{color:var(--vz-amber)}
.s-fail{color:var(--vz-coral)}.s-active{color:var(--vz-amber)}.s-unk{color:var(--vz-dim)}.s-ok{color:var(--vz-green)}
.vz-insp{margin-top:8px;border-top:1px solid var(--vz-line);padding-top:8px;height:var(--vz-ih,150px);overflow:auto}
.vz-insp dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 10px;margin:0}.vz-insp dt{color:var(--vz-dim)}.vz-insp dd{margin:0}
.vz-insp code,.vz-detail code{cursor:copy;color:var(--vz-blue)}
.vz-link{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px}
.vz-narr{min-height:2.9em;margin:0 0 8px;color:var(--vz-fg)}
.vz-tree{overflow:auto;max-height:460px}
.vz-node{display:flex;align-items:baseline;gap:6px;white-space:nowrap;padding:1px 6px 1px 0;border-radius:var(--vz-r);cursor:pointer}
.vz-node.sel{background:color-mix(in srgb,var(--vz-amber) 14%,transparent)}
.vz-node.s-del .vz-lab{text-decoration:line-through}.vz-node.same{opacity:.55}.vz-node .vz-m{width:1ch;flex:none}
.vz-node.s-add{background:color-mix(in srgb,var(--vz-green) 8%,transparent)}.vz-node.s-del{background:color-mix(in srgb,var(--vz-coral) 8%,transparent)}
.vz-node.s-mod{background:color-mix(in srgb,var(--vz-amber) 8%,transparent)}
.vz-car{width:1.2ch;flex:none;color:var(--vz-dim)}.vz-note{color:var(--vz-dim)}
.vz-guide{flex:none;align-self:stretch;border-left:1px solid var(--vz-line);margin-left:.6ch;width:1.4ch}
.vz-detail{margin-top:8px;border-top:1px solid var(--vz-line);padding-top:6px;min-height:3.2em;color:var(--vz-dim);overflow-wrap:anywhere}
.vz-detail b{color:var(--vz-fg);font-weight:500}
.vz-colhead{position:absolute;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--vz-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vz-lane{position:absolute;border-radius:var(--vz-r);background:color-mix(in srgb,var(--vz-fg) 4%,transparent);border:1px dashed color-mix(in srgb,var(--vz-fg) 10%,transparent)}
.vz-lane span{position:absolute;left:8px;top:3px;font-size:10.5px;color:var(--vz-dim)}
.vz-tick{position:absolute;font-size:10.5px;color:var(--vz-dim);white-space:nowrap}
.vz-box .vz-bn{color:var(--vz-dim);font-size:11px;line-height:15px}.vz-box .vz-bv{color:var(--vz-blue);font-size:11px;line-height:15px}
.vz-box.k-event{border-style:dashed}.vz-box.e-reach{border-color:var(--vz-green)}.vz-box.e-dropped{color:var(--vz-dim)}
.vz-pill.plain{padding:0 8px}
.vz-before .s-add,.vz-after .s-del{opacity:.1!important;pointer-events:none}
.vz-cover{margin-top:10px;border-top:1px solid var(--vz-line);padding-top:8px}.vz-ctitle{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--vz-dim);margin-bottom:6px}
.vz-chips{display:flex;flex-wrap:wrap;gap:6px}
.vz .vz-chip{border-radius:999px;padding:2px 10px;font-size:11.5px;transition:opacity 160ms var(--vz-out),border-color 160ms var(--vz-out)}.vz-chip b{font-weight:600}
.vz-chip.c-covered{border-color:var(--vz-green)}.vz-chip.c-partial{border-color:var(--vz-amber);border-style:dashed}.vz-chip.c-gap{border-color:var(--vz-amber);color:var(--vz-amber)}.vz-chip.c-unread{border-style:dashed;color:var(--vz-dim)}
.c-covered .vz-cm,td.c-covered,.c-covered{color:var(--vz-green)}.c-partial .vz-cm,td.c-partial{color:var(--vz-amber)}.c-gap .vz-cm,td.c-gap{color:var(--vz-amber)}.c-unread .vz-cm{color:var(--vz-dim)}
.vz-grid{border-collapse:collapse;font-size:11.5px}.vz-grid th{font-weight:400;color:var(--vz-dim);padding:2px 10px;text-align:center}.vz-grid td{padding:2px 10px;text-align:center;border-top:1px solid var(--vz-line)}
.vz-grid td.vz-gl{text-align:left;color:var(--vz-fg)}.vz-grid tr.vz-chip{cursor:pointer;border:none}.vz-grid tr.vz-chip.hot td{background:color-mix(in srgb,var(--vz-amber) 10%,transparent)}
.vz-cover.vz-dimmed .vz-chip:not(.hot){opacity:.4}.vz-chip.hot{box-shadow:0 0 0 1px var(--vz-amber)}
.vz-linked{outline:1px solid var(--vz-amber);outline-offset:2px;border-radius:3px}
@media (max-width:480px){.vz-node .vz-ref{display:none}}
@media (prefers-reduced-motion:reduce){.vz *{transition:none!important}}`;

  const STATUS = { '+': 'add', '-': 'del', '~': 'mod', '!': 'fail', '*': 'active', '?': 'unk' };
  const STATUS_WORD = { add: 'added', del: 'removed', mod: 'changed', fail: 'fails', active: 'active', unk: 'unverified', ok: 'done' };
  const BOX = /[│├└─┬┌┐┘┼╰╭]/;
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
    return el;
  };
  const svg = (tag, attrs) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const short = (ref) => { const m = ref.match(/([^/]+)$/); return m ? m[1] : ref; };

  /* ---------- parse ---------- */
  // Pulls `@ref` and `# note` off a line. Refs are the first whitespace-free token starting with @.
  function splitTail(s) {
    let note = '', ref = '';
    const hash = s.search(/\s#\s/);
    if (hash >= 0) { note = s.slice(hash + 3).trim(); s = s.slice(0, hash); }
    s = s.replace(/(^|\s)@(\S+)/, (_, pre, r) => { ref = r; return pre; });
    return { rest: s.trim(), ref, note };
  }

  const VIEWS = ['flow', 'ranked', 'seq', 'states', 'stack'];
  const ID = /^[\w.$-]+$/;
  function parse(text) {
    const doc = { title: '', sub: '', base: '', sections: [], errors: [] };
    let sec = null, node = null, lastGraph = null, lastEdges = null;
    const lines = text.replace(/\t/g, '  ').split('\n');
    lines.forEach((raw, i) => {
      const n = i + 1;
      if (!raw.trim() || /^\s*\/\//.test(raw)) return;
      const head = raw.match(/^==\s*(graph|flow|tree|diff|steps|cover)\b\s*(.*)$/);
      if (head) {
        const [, kind, name] = head;
        if (kind === 'steps' || kind === 'cover') {
          const target = kind === 'steps' && name ? doc.sections.find((s) => s.kind === 'graph' && s.name === name.trim()) : lastGraph;
          if (!target) { doc.errors.push(`line ${n}: ${kind} has no graph before it`); sec = null; return; }
          if (kind === 'cover') target.cover = { name: name.trim(), rows: [], columns: '', n };
          sec = { kind, graph: target }; return;
        }
        sec = kind === 'graph' || kind === 'flow'
          ? { kind: 'graph', name: name.trim() || 'graph', nodes: [], edges: [], byId: {}, paths: [], steps: [], ranks: [], view: '', group: -1 }
          : { kind: 'tree', diff: kind === 'diff', name: name.trim() || kind, lines: [] };
        doc.sections.push(sec); if (sec.kind === 'graph') lastGraph = sec; node = null; lastEdges = null; return;
      }
      const meta = sec?.kind !== 'tree' && sec?.kind !== 'cover' && raw.match(/^(title|sub|base)\s+(.*)$/);
      if (meta) { doc[meta[1]] = meta[2].trim(); return; }
      if (!sec) { doc.errors.push(`line ${n}: expected title/sub/base or a == section`); return; }
      if (sec.kind === 'tree') { sec.lines.push({ raw, n }); return; }
      if (sec.kind === 'steps') { if (!parsePath(sec.graph, raw.trim(), n, true)) doc.errors.push(`line ${n}: not a step (a > b | payload | narration): ${raw.trim()}`); return; }
      if (sec.kind === 'cover') { parseCover(sec.graph.cover, raw.trim(), n, doc.errors); return; }
      // graph body
      const g = sec, t = raw.trim();
      const facet = /^\S/.test(raw) && t.match(/^(ranks|view):\s*(.*)$/);
      if (facet) {
        if (facet[1] === 'ranks') g.ranks = facet[2].split('|').map((x) => x.trim()).filter(Boolean);
        else if (VIEWS.includes(facet[2].trim())) g.view = facet[2].trim();
        else doc.errors.push(`line ${n}: view must be one of ${VIEWS.join(', ')}`);
        return;
      }
      const grp = t.match(/^--\s+(.+)$/);
      if (grp) {
        g.group = g.ranks.findIndex((r) => r.toLowerCase() === grp[1].trim().toLowerCase());
        if (g.group < 0) doc.errors.push(`line ${n}: "-- ${grp[1].trim()}" is not in ranks: ${g.ranks.join(' | ') || '(none)'}`);
        node = null; return;
      }
      // Detail lines belong to the node or edge line above them (every edge of a fan-out line).
      const detail = raw.match(/^\s+(does|reads|writes|fails|ref|note|state|carries|locals|lane|at):\s*(.*)$/);
      if (detail) {
        const owners = node ? [node] : lastEdges;
        if (!owners) { doc.errors.push(`line ${n}: detail before any node or edge`); return; }
        const [, key, val] = detail;
        for (const o of owners) {
          if (key === 'ref') { const { rest, ref } = splitTail('@' + val.replace(/^@/, '')); o.refs.push([ref, rest]); }
          else if (key === 'locals') o.info.locals = (o.info.locals ? o.info.locals + '\n' : '') + val;
          else o.info[key] = val;
        }
        return;
      }
      const edge = t.match(/^([+\-~!*?]?)([\w.$-]+(?:\s*,\s*[\w.$-]+)*)\s*(->|~>)\s*([\w.$-]+(?:\s*,\s*[\w.$-]+)*)\s*(?::\s*(.*))?$/);
      if (edge) {
        const [, st, from, arrow, to, body] = edge;
        const { rest, ref, note } = splitTail(body || '');
        lastEdges = [];
        for (const f of from.split(/\s*,\s*/)) for (const to1 of to.split(/\s*,\s*/)) {
          const e = { from: f, to: to1, label: rest, ref, note, async: arrow === '~>', st: STATUS[st] || '', n, info: {}, refs: [], paths: [] };
          g.edges.push(e); lastEdges.push(e);
        }
        node = null; return;
      }
      if (parsePath(g, t, n, false)) { node = null; lastEdges = null; return; }
      const nd = t.match(/^([+\-~!*?]?)([\w.$-]+):\s*(.*)$/);
      if (nd) {
        const [, st, id, body] = nd;
        const { rest, ref, note } = splitTail(body);
        const km = rest.match(/\[([^\]]+)\]\s*$/);
        const label = (km ? rest.slice(0, km.index) : rest).trim() || id;
        if (g.byId[id]) doc.errors.push(`line ${n}: node "${id}" declared twice`);
        node = { id, label, kind: km ? km[1] : '', ref, note, st: STATUS[st] || '', info: {}, refs: [], rank: g.group, n };
        g.byId[id] = node; g.nodes.push(node); lastEdges = null; return;
      }
      doc.errors.push(`line ${n}: not a node (id: Label), edge (a -> b), path (a > b => c), or detail (  does: …): ${t}`);
    });
    for (const s of doc.sections) if (s.kind === 'graph') finishGraph(s, doc.errors); else buildTree(s, doc.errors);
    return doc;
  }

  // Path: `[name:] [+-!]a > b > c => d [| payload | narration]`. `=>` ends it as getting through, `=|` as filtered out.
  // A path with a `|` tail is also a replay step; `id | | narration` is a step that stays on one node.
  function parsePath(g, t, n, stepOnly) {
    // The tail starts at the first `|` that is not part of a `=|` ending.
    const bar = t.search(/(?<!=)\|/);
    let hd = (bar >= 0 ? t.slice(0, bar) : t).trim();
    const [payload = '', narr = ''] = bar >= 0 ? t.slice(bar + 1).split('|').map((x) => x.trim()) : [];
    // The status prefix may sit on the name (`+hit: a > b`) or on the first id (`hit: +a > b`).
    let st = '+-!'.includes(hd[0]) ? STATUS[hd[0]] : '';
    if (st) hd = hd.slice(1);
    let name = '';
    const nm = hd.match(/^([\w.$-]+):\s+(.*)$/);
    if (nm) { name = nm[1]; hd = nm[2]; }
    if (!st && '+-!'.includes(hd[0])) { st = STATUS[hd[0]]; hd = hd.slice(1); }
    const toks = hd.split(/\s*(=>|=\||->|~>|>)\s*/).filter((x) => x !== '');
    const ids = toks.filter((_, j) => j % 2 === 0), ops = toks.filter((_, j) => j % 2 === 1);
    if (!ids.length || !ids.every((x) => ID.test(x)) || ids.length !== ops.length + 1) return false;
    if (ids.length === 1 && bar < 0 && !stepOnly) return false;
    if (!stepOnly && ops.some((o) => o === '->' || o === '~>')) return false;
    if (ops.slice(0, -1).some((o) => o[0] === '=')) return false;
    const last = ops[ops.length - 1] || '';
    const p = { name: name || `#${n}`, named: !!name, st, ids, out: st === 'fail' ? 'fail' : last === '=>' ? 'pass' : last === '=|' ? 'drop' : 'plain', payload, narr, fail: st === 'fail', n, edges: [] };
    if (ids.length > 1) g.paths.push(p);
    if (bar >= 0 || stepOnly) g.steps.push(p);
    return true;
  }

  // Cover row: `[+!?]name: note <- path-or-node, …`. Status comes from the paths it binds unless a prefix sets it.
  function parseCover(cv, t, n, errors) {
    const col = t.match(/^columns:\s*(.+)$/);
    if (col) { cv.columns = col[1].trim(); return; }
    const [left, refs = ''] = t.split(/\s*<-\s*/);
    const m = left.match(/^([+!?]?)([\w.$-]+)(?::\s*(.*))?$/);
    if (!m) { errors.push(`line ${n}: not a cover row (name: note <- path, node): ${t}`); return; }
    cv.rows.push({ set: { '+': 'covered', '!': 'gap', '?': 'unread' }[m[1]] || '', name: m[2], note: (m[3] || '').trim(), refs: refs.split(/\s*,\s*/).filter(Boolean), n });
  }

  const OUT_RANK = { pass: 3, plain: 2, fail: 1, drop: 0 };
  function finishGraph(s, errors) {
    for (const e of s.edges) for (const id of [e.from, e.to]) if (!s.byId[id]) errors.push(`line ${e.n}: edge uses undeclared node "${id}"`);
    s.edges = s.edges.filter((e) => s.byId[e.from] && s.byId[e.to]);
    if (!s.view) s.view = s.ranks.length ? 'ranked' : 'flow';
    if (s.view === 'ranked') {
      if (!s.ranks.length) errors.push(`${s.name}: view ranked needs a ranks: line`);
      for (const nd of s.nodes) if (nd.rank < 0) errors.push(`line ${nd.n}: node "${nd.id}" has no rank; put it under a -- line`);
    }
    // Edges come from paths: each hop reuses the edge already declared for it, or adds one. In a sequence a hop takes
    // the next matching message, so a pair that talks twice keeps both arrows.
    const seq = s.view === 'seq';
    for (const p of [...s.paths, ...s.steps.filter((x) => !s.paths.includes(x))]) {
      const bad = p.ids.find((id) => !s.byId[id]);
      if (bad) { errors.push(`line ${p.n}: path uses undeclared node "${bad}"`); p.ids = []; continue; }
      let after = -1;
      for (let j = 0; j + 1 < p.ids.length; j++) {
        const [a, b] = [p.ids[j], p.ids[j + 1]];
        let k = s.edges.findIndex((e, x) => e.from === a && e.to === b && (!seq || x > after));
        if (k < 0) k = s.edges.findIndex((e) => e.from === a && e.to === b);
        if (k < 0) { s.edges.push({ from: a, to: b, label: '', ref: '', note: '', async: false, st: '', n: p.n, info: {}, refs: [], paths: [], derived: true }); k = s.edges.length - 1; }
        const e = s.edges[k]; after = k;
        p.edges.push(e);
        if (s.paths.includes(p) && !e.paths.includes(p)) e.paths.push(p);
      }
    }
    s.paths = s.paths.filter((p) => p.ids.length);
    s.steps = s.steps.filter((p) => p.ids.length);
    for (const e of s.edges) {
      if (!e.paths.length) continue;
      e.out = e.paths.reduce((a, p) => (OUT_RANK[p.out] > OUT_RANK[a] ? p.out : a), 'drop');
      if (!e.st && e.paths.every((p) => p.st === 'add')) e.st = 'add';
      if (!e.st && e.paths.every((p) => p.st === 'del')) e.st = 'del';
    }
    // A path's last box shows how it ends: reached by any path that gets through, or only by filtered ones.
    for (const nd of s.nodes) {
      const ends = s.paths.filter((p) => p.ids[p.ids.length - 1] === nd.id && p.out !== 'plain');
      if (ends.some((p) => p.out === 'pass')) nd.end = 'reach';
      else if (ends.length && ends.every((p) => p.out === 'drop')) nd.end = 'dropped';
    }
    const cv = s.cover;
    if (cv) for (const r of cv.rows) {
      r.paths = [];
      for (const ref of r.refs) {
        const named = s.paths.filter((p) => p.name === ref);
        if (named.length) r.paths.push(...named);
        else if (s.byId[ref]) r.paths.push(...s.paths.filter((p) => p.ids.includes(ref)));
        else errors.push(`line ${r.n}: cover row "${r.name}" names "${ref}", which is neither a path name nor a node`);
      }
      r.paths = [...new Set(r.paths)];
      const outs = r.paths.map((p) => (p.out === 'fail' ? 'drop' : p.out));
      r.status = r.set || (!outs.length ? 'unread' : outs.every((o) => o !== 'drop') ? 'covered' : outs.every((o) => o === 'drop') ? 'gap' : 'partial');
    }
    if (cv?.columns && !s.ranks.some((r) => r.toLowerCase() === cv.columns.toLowerCase())) errors.push(`line ${cv.n}: cover columns "${cv.columns}" is not in ranks`);
  }

  // Tree lines: indentation (2 spaces) or calldiff ascii (├─ │ └─, 3 columns per level). Marker + - ~ ! first.
  function buildTree(s, errors) {
    const root = { kids: [], depth: -1 };
    const stack = [root];
    // When any line carries a marker, column 0-1 is the marker column on every line, as in a unified diff.
    const marked = s.lines.some(({ raw }) => /^[+\-~!] /.test(raw));
    for (const { raw, n } of s.lines) {
      let line = raw.replace(/\s+$/, '');
      let st = '';
      if (marked) { st = STATUS[line[0]] || ''; line = line.slice(2); }
      let depth;
      if (BOX.test(line.slice(0, 40))) {
        const body = line.search(/[^\s│├└─┬┌┐┘┼╰╭]/);
        depth = Math.round(body / 3); line = line.slice(body);
      } else {
        const ind = line.match(/^ */)[0].length; depth = Math.floor(ind / 2); line = line.trim();
      }
      const { rest, ref, note } = splitTail(line);
      const loc = !ref && rest.match(/^(.*?)\s{2,}(\S+:\d[\d-]*)$/); // calldiff "label  path:line"
      const nd = { label: loc ? loc[1] : rest, ref: loc ? loc[2] : ref, note, st, kids: [], depth, n };
      while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
      const parent = stack[stack.length - 1];
      if (depth > parent.depth + 1) errors.push(`line ${n}: indented more than one level under its parent`);
      nd.depth = parent.depth + 1; nd.parent = parent; parent.kids.push(nd); stack.push(nd);
    }
    const mark = (nd) => { let c = !!nd.st; for (const k of nd.kids) c = mark(k) || c; nd.changed = c; return c; };
    for (const k of root.kids) mark(k);
    s.root = root;
  }

  /* ---------- graph layouts ---------- */
  // Every layout sets nd.box {x: centre, y: top, w, h}, e.d (an SVG path), optionally e.pill {x, y}, and returns
  // {w, h, decor}: column headers, lane bands, lifelines and time ticks drawn behind the boxes.
  const FS = 12.5, PFS = 11, LINE = 17, SUBL = 15, PX = 9, PY = 6, WRAP = 28, PILL = 20, GAP = 26, VGAP = 26;
  let charW = 0;
  function cw() {
    if (charW) return charW;
    const fam = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || '"IBM Plex Mono","Berkeley Mono",ui-monospace,SFMono-Regular,Menlo,monospace';
    const c = document.createElement('canvas').getContext('2d');
    if (c) { c.font = `${FS}px ${fam}`; charW = c.measureText('0123456789').width / 10; }
    return (charW = charW || 7.6);
  }
  // Wrap at a space, comma or paren, or before a dot, so `Class.method` breaks between the two. A part longer than the
  // limit stays whole and the box widens: meaning is never cut.
  function wrap(text, max) {
    const parts = text.split(/(?<=[\s,(])|(?=\.)/), lines = [];
    let cur = '';
    for (const p of parts) {
      if (cur && (cur + p).trimEnd().length > max) { lines.push(cur.trimEnd()); cur = p.trimStart(); } else cur += p;
    }
    if (cur.trim()) lines.push(cur.trimEnd());
    return lines.length ? lines : [text];
  }
  const MARK = { add: '+', del: '−', mod: '~', fail: '!', active: '*', unk: '?' };

  // A box: label (wrapped, never truncated), kind and file:line, the note, then frame locals.
  function boxOf(nd, max) {
    const c = cw(), mark = MARK[nd.st] ? MARK[nd.st] + ' ' : '';
    const lines = wrap(nd.label, max);
    const r = nd.ref && short(nd.ref), lw = Math.max(...lines.map((l, j) => l.length + (j ? 0 : mark.length)));
    // The kind and file:line share a line when they fit under the label; otherwise each takes its own.
    const both = [nd.kind, r].filter(Boolean).join(' · ');
    const sub = !both ? [] : both.length * PFS / FS <= Math.max(lw, max) ? [both] : [nd.kind, r].filter(Boolean);
    const notes = nd.note ? wrap(nd.note, Math.round(Math.max(lw, max) * FS / PFS)) : [];
    const locals = (nd.info.locals || '').split('\n').filter(Boolean);
    const small = [...sub, ...notes, ...locals];
    const wch = Math.max(lw, ...small.map((x) => x.length * PFS / FS));
    return { kind: 'node', nd, lines, mark, sub, notes, locals, w: Math.ceil(wch * c) + 2 * PX + 2, h: lines.length * LINE + small.length * SUBL + 2 * PY + 2 };
  }

  // Isotonic regression (pool adjacent violators): the nondecreasing sequence closest to t under weights w.
  function pav(t, w) {
    const bl = [];
    t.forEach((v, i) => {
      bl.push({ v, w: w[i], n: 1 });
      while (bl.length > 1 && bl[bl.length - 2].v > bl[bl.length - 1].v) {
        const b = bl.pop(), a = bl.pop(), W = a.w + b.w;
        bl.push({ v: (a.v * a.w + b.v * b.w) / W, w: W, n: a.n + b.n });
      }
    });
    return bl.flatMap((b) => Array(b.n).fill(b.v));
  }
  const selfLoop = (b) => { const x = b.x + b.w / 2, y0 = b.y + b.h * 0.3, y1 = b.y + b.h * 0.7; return `M${x},${y0} C${x + 26},${y0 - 8} ${x + 26},${y1 + 8} ${x},${y1}`; };

  // flow and states: a top-to-bottom layered graph. Real nodes sit on even ranks; every edge gets one virtual item on
  // each rank it crosses. In flow, a declared edge's first virtual item is its numbered label pill, so labels take real
  // space and the order of execution reads off the picture. In states only labelled edges get a pill, unnumbered.
  function layoutFlow(s) {
    const n = s.nodes.length, idx = Object.fromEntries(s.nodes.map((nd, i) => [nd.id, i]));
    const real = s.edges.filter((e) => e.from !== e.to);
    const pilled = (e) => (s.view === 'flow' ? !e.derived : !!e.label);
    // Break cycles: walk in declaration order; an edge back into a node still on the walk is laid out reversed.
    const out = s.nodes.map(() => []), seen = new Array(n).fill(0);
    for (const e of real) out[idx[e.from]].push(e);
    const dfs = (i) => { seen[i] = 1; for (const e of out[i]) { const j = idx[e.to]; if (seen[j] === 1) e.rev = true; else if (!seen[j]) dfs(j); } seen[i] = 2; };
    for (let i = 0; i < n; i++) if (!seen[i]) dfs(i);
    const E = real.map((e) => ({ e, u: idx[e.rev ? e.to : e.from], v: idx[e.rev ? e.from : e.to] }));
    const layer = new Array(n).fill(0);
    for (let k = 0; k <= n; k++) { let moved = false; for (const { u, v } of E) if (layer[v] < layer[u] + 1) { layer[v] = layer[u] + 1; moved = true; } if (!moved) break; }
    // A source sits just above its first consumer instead of floating at the top.
    for (let i = 0; i < n; i++) {
      if (E.some((x) => x.v === i)) continue;
      const below = E.filter((x) => x.u === i).map((x) => layer[x.v]);
      if (below.length) layer[i] = Math.min(...below) - 1;
    }
    const items = [], ranks = [];
    const put = (it, r) => { it.r = r; it.up = []; it.down = []; (ranks[r] = ranks[r] || []).push(it); items.push(it); return it; };
    s.nodes.forEach((nd, i) => { nd.box = put(Object.assign(boxOf(nd, WRAP), { i }), 2 * layer[i]); });
    // Order numbers: one per edge line, so a fan-out line shares its number.
    const lines = [...new Set(s.edges.filter((e) => !e.derived).map((e) => e.n))].sort((a, b) => a - b);
    for (const e of s.edges) e.num = e.derived ? 0 : lines.indexOf(e.n) + 1;
    const c = cw(), numbered = s.view === 'flow';
    for (const { e, u, v } of E) {
      const ru = 2 * layer[u], rv = 2 * layer[v];
      let prev = s.nodes[u].box; e.chain = [];
      for (let r = ru + 1; r < rv; r++) {
        const pill = r === ru + 1 && pilled(e);
        const text = (numbered ? String(e.num).length + 1 : 0) + e.label.length;
        const it = put({ kind: pill ? 'pill' : 'v', e, w: pill ? Math.ceil(text * c * PFS / FS) + (numbered ? (e.label ? 30 : 22) : 18) : 2, h: pill ? PILL : 0 }, r);
        prev.down.push(it); it.up.push(prev); prev = it; e.chain.push(it);
      }
      prev.down.push(s.nodes[v].box); s.nodes[v].box.up.push(prev);
    }
    for (let r = 0; r < ranks.length; r++) ranks[r] = ranks[r] || [];
    // Order within ranks: barycentre sweeps, keeping the ordering with fewest crossings.
    ranks.forEach((rk) => rk.forEach((it, j) => (it.o = j)));
    const crossings = () => {
      let x = 0;
      for (let r = 0; r + 1 < ranks.length; r++) {
        const segs = ranks[r].flatMap((a) => a.down.map((b) => [a.o, b.o]));
        for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) if ((segs[i][0] - segs[j][0]) * (segs[i][1] - segs[j][1]) < 0) x++;
      }
      return x;
    };
    const order = (r, dir) => {
      const rk = ranks[r];
      for (const it of rk) { const nb = dir > 0 ? it.up : it.down; it.bc = nb.length ? nb.reduce((a, b) => a + b.o, 0) / nb.length : it.o; }
      rk.sort((a, b) => a.bc - b.bc || a.o - b.o).forEach((it, j) => (it.o = j));
    };
    let best = crossings(), snap = ranks.map((rk) => rk.slice());
    for (let k = 0; k < 16 && best > 0; k++) {
      if (k % 2 === 0) for (let r = 1; r < ranks.length; r++) order(r, 1); else for (let r = ranks.length - 2; r >= 0; r--) order(r, -1);
      const x = crossings();
      if (x < best) { best = x; snap = ranks.map((rk) => rk.slice()); }
    }
    snap.forEach((rk, r) => { ranks[r] = rk; rk.forEach((it, j) => (it.o = j)); });
    // x: each item wants the mean of its neighbours' centres; pav keeps the rank order and minimum spacing.
    const sep = (a, b) => (a.w + b.w) / 2 + (a.kind === 'node' && b.kind === 'node' ? GAP : a.kind === 'v' && b.kind === 'v' ? 8 : 14);
    for (const rk of ranks) { let x = 0; rk.forEach((it, j) => { if (j) x += sep(rk[j - 1], it); it.x = x; }); }
    const place = (rk, want) => {
      if (!rk.length) return;
      const off = [0]; for (let j = 1; j < rk.length; j++) off[j] = off[j - 1] + sep(rk[j - 1], rk[j]);
      const y = pav(rk.map((it, j) => want(it) - off[j]), rk.map((it) => (it.kind === 'node' ? 1 : it.e.chain.length > 1 ? 4 : 2)));
      rk.forEach((it, j) => (it.x = y[j] + off[j]));
    };
    const mean = (it, nb) => (nb.length ? nb.reduce((a, b) => a + b.x, 0) / nb.length : it.x);
    for (let k = 0; k < 24; k++) {
      const seq = k % 2 ? ranks.slice().reverse() : ranks;
      // A long edge's virtual items pull towards their chain's mean, so the edge runs straight instead of drifting.
      for (const rk of seq) place(rk, (it) => (it.kind !== 'node' && it.e.chain.length > 1 ? mean(it, it.e.chain) : mean(it, it.up.concat(it.down))));
    }
    const lo = Math.min(...items.map((it) => it.x - it.w / 2)), hi = Math.max(...items.map((it) => it.x + it.w / 2));
    for (const it of items) it.x = Math.round(it.x - lo + 2);
    // y: rank bands. Node ranks are as tall as their tallest box; label ranks are one pill tall.
    let y = 0;
    const band = ranks.map((rk) => {
      const hh = Math.max(0, ...rk.map((it) => it.h));
      const b = { top: y, h: hh }; y += hh + (hh ? VGAP : 0); return b;
    });
    for (const it of items) { const b = band[it.r]; it.y = b.top + (b.h - it.h) / 2; it.top = b.top; it.bot = b.top + b.h; }
    // Ports: spread a node's edges along its top and bottom edges in the order of their neighbours.
    for (const it of items) {
      if (it.kind !== 'node') continue;
      for (const [list, key] of [[it.down, 'outs'], [it.up, 'ins']]) {
        const sorted = list.slice().sort((a, b) => a.x - b.x), m = sorted.length, step = m > 1 ? Math.min(16, (it.w - 20) / (m - 1)) : 0;
        it[key] = new Map(sorted.map((nb, j) => [nb, it.x + (j - (m - 1) / 2) * step]));
      }
    }
    for (const { e, u, v } of E) {
      const a = s.nodes[u].box, b = s.nodes[v].box, ch = e.chain;
      const pts = [[a.outs.get(ch[0] || b), a.y + a.h]];
      for (const it of ch) pts.push([it.x, it.top], [it.x, it.bot]);
      pts.push([b.ins.get(ch[ch.length - 1] || a), b.y]);
      let d = `M${pts[0][0]},${pts[0][1]}`;
      for (let j = 1; j < pts.length; j++) {
        const [x1, y1] = pts[j - 1], [x2, y2] = pts[j];
        if (x1 === x2 || j % 2 === 0) d += ` L${x2},${y2}`;
        else { const my = (y1 + y2) / 2; d += ` C${x1},${my} ${x2},${my} ${x2},${y2}`; }
      }
      e.d = d; e.pill = ch[0]?.kind === 'pill' ? ch[0] : null;
    }
    let right = hi - lo + 4 + 30;
    for (const e of s.edges) if (e.from === e.to) {
      const b = s.byId[e.from].box;
      e.d = selfLoop(b);
      if (e.label) {
        const w = Math.ceil(e.label.length * c * PFS / FS) + 18;
        e.pill = { x: b.x + b.w / 2 + 30 + w / 2, y: b.y + b.h / 2 - PILL / 2, w };
        right = Math.max(right, e.pill.x + w / 2 + 4);
      }
    }
    return { w: Math.ceil(right), h: Math.ceil(y - VGAP + 4), decor: [] };
  }

  // ranked: columns the author names, left to right, with a header row. Boxes keep declaration order inside a
  // column and slide towards their neighbours; lanes (a `lane:` detail) stack as bands, top to bottom.
  function layoutRanked(s) {
    const COLGAP = 64, ROWGAP = 12, HEAD = 30, LANEHEAD = 20, LANEGAP = 16;
    const idx = Object.fromEntries(s.nodes.map((nd, i) => [nd.id, i]));
    s.nodes.forEach((nd, i) => { nd.box = Object.assign(boxOf(nd, 24), { i, fixed: true }); });
    const R = s.ranks.length, colW = [], colX = [];
    for (let r = 0, x = 0; r < R; r++) {
      colW[r] = Math.max(150, ...s.nodes.filter((nd) => nd.rank === r).map((nd) => nd.box.w));
      colX[r] = x; x += colW[r] + COLGAP;
    }
    for (const nd of s.nodes) { nd.box.w = colW[nd.rank] ?? 150; nd.box.x = (colX[nd.rank] ?? 0) + nd.box.w / 2; }
    const laneOf = (nd) => nd.info.lane || '';
    const lanes = [...new Set(s.nodes.map(laneOf))], banded = lanes.some(Boolean);
    const nb = s.nodes.map(() => []);
    for (const e of s.edges) if (e.from !== e.to) { nb[idx[e.from]].push(idx[e.to]); nb[idx[e.to]].push(idx[e.from]); }
    const decor = s.ranks.map((t, r) => ({ kind: 'head', x: colX[r], w: colW[r], y: 0, text: t }));
    let cursor = HEAD;
    for (const lane of lanes) {
      const top = cursor + (banded ? LANEHEAD : 0);
      const cols = s.ranks.map((_, r) => s.nodes.filter((nd) => nd.rank === r && laneOf(nd) === lane).map((nd) => nd.box));
      for (const col of cols) { let y = top; for (const b of col) { b.y = y; y += b.h + ROWGAP; } }
      const place = (col) => {
        if (!col.length) return;
        const off = [0]; for (let j = 1; j < col.length; j++) off[j] = off[j - 1] + col[j - 1].h + ROWGAP;
        const want = col.map((b, j) => {
          const ns = nb[b.i].map((k) => s.nodes[k]).filter((o) => laneOf(o) === lane).map((o) => o.box.y + o.box.h / 2);
          return (ns.length ? ns.reduce((a, v) => a + v, 0) / ns.length : b.y + b.h / 2) - b.h / 2 - off[j];
        });
        const y = pav(want, col.map(() => 1)), shift = Math.max(0, top - y[0]);
        col.forEach((b, j) => (b.y = Math.round(y[j] + shift + off[j])));
      };
      for (let k = 0; k < 12; k++) (k % 2 ? cols.slice().reverse() : cols).forEach(place);
      const bottom = Math.max(top, ...cols.flat().map((b) => b.y + b.h));
      if (banded) decor.push({ kind: 'lane', y: top - LANEHEAD, h: bottom - top + LANEHEAD + 8, text: lane });
      cursor = bottom + LANEGAP + (banded ? 8 : 0);
    }
    // Ports: a box's forward edges leave its right side and enter the next box's left, spread in neighbour order.
    const fwd = (e) => s.byId[e.to].rank > s.byId[e.from].rank;
    const port = new Map();
    for (const nd of s.nodes) {
      const b = nd.box;
      for (const [list, other] of [[s.edges.filter((e) => e.from === nd.id && fwd(e)), 'to'], [s.edges.filter((e) => e.to === nd.id && fwd(e)), 'from']]) {
        const sorted = list.slice().sort((p, q) => s.byId[p[other]].box.y - s.byId[q[other]].box.y), m = sorted.length;
        const step = m > 1 ? Math.min(10, (b.h - 12) / (m - 1)) : 0;
        sorted.forEach((e, j) => port.set(e[other === 'to' ? 'from' : 'to'] + '|' + e.from + '>' + e.to, b.y + b.h / 2 + (j - (m - 1) / 2) * step));
      }
    }
    let maxY = cursor;
    for (const e of s.edges) {
      const a = s.byId[e.from].box, b = s.byId[e.to].box;
      if (e.from === e.to) { e.d = selfLoop(a); continue; }
      if (fwd(e)) {
        const x1 = a.x + a.w / 2, x2 = b.x - b.w / 2, y1 = port.get(e.from + '|' + e.from + '>' + e.to), y2 = port.get(e.to + '|' + e.from + '>' + e.to);
        // An edge that skips columns runs straight through each one it crosses, in a gap between that column's boxes.
        const pts = [[x1, y1]], ra = s.byId[e.from].rank, rb = s.byId[e.to].rank;
        for (let r = ra + 1; r < rb; r++) {
          const want = y1 + (y2 - y1) * (colX[r] + colW[r] / 2 - x1) / (x2 - x1);
          const col = s.nodes.filter((nd) => nd.rank === r).map((nd) => nd.box).sort((p, q) => p.y - q.y);
          const gaps = [col.length ? col[0].y - 8 : want, ...col.map((c, j) => (j + 1 < col.length ? (c.y + c.h + col[j + 1].y) / 2 : c.y + c.h + 8))];
          const hit = col.some((c) => want > c.y - 4 && want < c.y + c.h + 4);
          const y = hit ? gaps.reduce((m, g) => (Math.abs(g - want) < Math.abs(m - want) ? g : m)) : want;
          pts.push([colX[r] - 6, y], [colX[r] + colW[r] + 6, y]);
        }
        pts.push([x2, y2]);
        let d = `M${x1},${y1}`;
        for (let j = 1; j < pts.length; j++) {
          const [px, py] = pts[j - 1], [qx, qy] = pts[j];
          if (j % 2 === 0 && j < pts.length - 1) { d += ` L${qx},${qy}`; continue; }
          const dx = Math.max(24, (qx - px) / 2);
          d += ` C${px + dx},${py} ${qx - dx},${qy} ${qx},${qy}`;
        }
        e.d = d;
      } else if (b.x === a.x && b.y > a.y) {
        e.d = `M${a.x},${a.y + a.h} C${a.x},${a.y + a.h + 12} ${b.x},${b.y - 12} ${b.x},${b.y}`;
      } else {
        // Back to an earlier column (or up the same one): dip below both boxes.
        const yb = Math.max(a.y + a.h, b.y + b.h) + 30; maxY = Math.max(maxY, yb);
        e.d = `M${a.x},${a.y + a.h} C${a.x},${yb} ${b.x},${yb} ${b.x},${b.y + b.h}`;
      }
    }
    const w = R ? colX[R - 1] + colW[R - 1] + 30 : 200;
    for (const d of decor) if (d.kind === 'lane') d.w = w - 10;
    return { w, h: Math.ceil(maxY), decor };
  }

  // stack: one frame per box, outermost first, each indented under its caller; locals print inside the frame.
  function layoutStack(s) {
    const first = s.paths[0]?.ids || [];
    const ids = [...new Set([...first, ...s.nodes.map((nd) => nd.id)])];
    let y = 0, w = 0;
    ids.forEach((id, j) => {
      const nd = s.byId[id], b = nd.box = Object.assign(boxOf(nd, 48), { i: s.nodes.indexOf(nd), fixed: true });
      b.w = Math.max(b.w, 280); b.left = j * 22; b.x = b.left + b.w / 2; b.y = y; y += b.h + 18; w = Math.max(w, b.left + b.w);
    });
    for (const e of s.edges) {
      const a = s.byId[e.from].box, b = s.byId[e.to].box;
      if (e.from === e.to) e.d = selfLoop(a);
      else if (b.y > a.y) { const x1 = a.left + 14, x2 = b.left + 14; e.d = `M${x1},${a.y + a.h} C${x1},${a.y + a.h + 10} ${x2},${b.y - 10} ${x2},${b.y}`; }
      else { const xr = Math.max(a.x + a.w / 2, b.x + b.w / 2) + 26; e.d = `M${a.x + a.w / 2},${a.y + a.h / 2} C${xr},${a.y + a.h / 2} ${xr},${b.y + b.h / 2} ${b.x + b.w / 2},${b.y + b.h / 2}`; }
    }
    return { w: w + 40, h: Math.max(0, y - 18) + 4, decor: [] };
  }

  // seq: one lifeline per node, messages top to bottom in declaration order. When every message has `at:`, the
  // vertical gaps follow the measured times (with a floor so labels never collide).
  const ms = (v) => { const m = String(v || '').match(/([\d.]+)\s*(ms|s)?/); return m ? +m[1] * (m[2] === 's' ? 1000 : 1) : null; };
  function layoutSeq(s) {
    const COL = 28, c = cw();
    const timed = s.edges.length > 0 && s.edges.every((e) => ms(e.info.at) != null), LEFT = timed ? 64 : 8;
    let x = LEFT, headH = 0;
    for (const nd of s.nodes) {
      const b = nd.box = Object.assign(boxOf(nd, 20), { i: s.nodes.indexOf(nd), fixed: true });
      b.w = Math.max(130, b.w);
      b.x = x + b.w / 2; b.y = 0; x += b.w + COL; headH = Math.max(headH, b.h);
    }
    for (const nd of s.nodes) nd.box.h = headH;
    const top = headH + 34, decor = [];
    const span = timed ? Math.max(...s.edges.map((e) => ms(e.info.at))) || 1 : 1, scale = timed ? Math.max(s.edges.length * 34, 300) / span : 0;
    let y = top - 38, last = top;
    s.edges.forEach((e) => {
      y = timed ? Math.max(y + 38, top + ms(e.info.at) * scale) : y + 38; last = y;
      const a = s.byId[e.from].box, b = s.byId[e.to].box;
      if (e.from === e.to) e.d = `M${a.x},${y} C${a.x + 44},${y} ${a.x + 44},${y + 16} ${a.x + 4},${y + 16}`;
      else { const dir = b.x > a.x ? 1 : -1; e.d = `M${a.x},${y} L${b.x - dir * 3},${y}`; }
      if (e.label) e.pill = { x: (a.x + b.x) / 2 + (e.from === e.to ? 40 : 0), y: y - PILL - 2, w: Math.ceil(e.label.length * c * PFS / FS) + 18 };
      if (timed) decor.push({ kind: 'tick', x: 0, y: y - 8, text: e.info.at });
    });
    for (const nd of s.nodes) decor.push({ kind: 'life', x: nd.box.x, y1: headH, y2: last + 26 });
    return { w: x - COL + 20, h: Math.ceil(last + 30), decor };
  }

  const LAYOUT = { flow: layoutFlow, states: layoutFlow, ranked: layoutRanked, stack: layoutStack, seq: layoutSeq };

  function renderGraph(s, doc, mount) {
    const idx = Object.fromEntries(s.nodes.map((nd, i) => [nd.id, i]));
    const L = LAYOUT[s.view](s), steps = s.steps, view = s.view;
    const wrapEl = h('div', { class: `vz-flow vz-v-${view}`, role: 'group', 'aria-label': s.name, tabindex: 0 });
    const stage = h('div', { class: 'vz-stage', style: `width:${L.w}px;height:${L.h}px` });
    for (const d of L.decor) {
      if (d.kind === 'lane') stage.append(h('div', { class: 'vz-lane', style: `left:0;top:${d.y}px;width:${d.w}px;height:${d.h}px` }, h('span', {}, d.text)));
      if (d.kind === 'head') stage.append(h('div', { class: 'vz-colhead', style: `left:${d.x}px;top:${d.y}px;width:${d.w}px` }, d.text));
      if (d.kind === 'tick') stage.append(h('div', { class: 'vz-tick', style: `left:${d.x}px;top:${d.y}px` }, d.text));
    }
    const g = svg('svg', { width: L.w, height: L.h });
    const defs = svg('defs', {});
    for (const [id, col] of [['a', 'var(--vz-dim)'], ['h', 'var(--vz-amber)'], ['g', 'var(--vz-green)'], ['r', 'var(--vz-coral)']]) {
      const m = svg('marker', { id: `vz-${id}-${s.uid}`, viewBox: '0 0 6 6', refX: 5, refY: 3, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
      m.append(svg('path', { d: 'M0,0 L6,3 L0,6 z', fill: col })); defs.append(m);
    }
    g.append(defs);
    for (const d of L.decor) if (d.kind === 'life') g.append(svg('line', { x1: d.x, x2: d.x, y1: d.y1, y2: d.y2, stroke: 'var(--vz-line)', 'stroke-dasharray': '3 4' }));
    // An edge's colour says how its paths end: green when any gets through, coral when they fail, dashed when all are filtered.
    const base = (e) => (e.st === 'add' ? 'g' : e.st === 'del' ? 'r' : e.out === 'pass' ? 'g' : e.out === 'fail' ? 'r' : 'a');
    const COL = { a: 'var(--vz-dim)', h: 'var(--vz-amber)', g: 'var(--vz-green)', r: 'var(--vz-coral)' };
    const paint = (e, on) => {
      const k = on ? 'h' : base(e);
      e.path.setAttribute('stroke', COL[k]); e.path.setAttribute('stroke-width', on ? 2 : 1.3);
      e.path.setAttribute(e.rev ? 'marker-start' : 'marker-end', `url(#vz-${k}-${s.uid})`);
    };
    for (const e of s.edges) {
      e.path = svg('path', { d: e.d, fill: 'none', class: e.st ? 's-' + e.st : '', 'stroke-dasharray': e.async ? '4 3' : e.st === 'del' ? '2 3' : e.out === 'drop' ? '3 4' : '' });
      e.hit = svg('path', { d: e.d, fill: 'none', stroke: 'transparent', 'stroke-width': 10, class: `vz-hit ${e.st ? 's-' + e.st : ''}` });
      e.hit.addEventListener('click', () => pickEdge(e));
      e.hit.addEventListener('mouseenter', () => hoverEdge(e)); e.hit.addEventListener('mouseleave', () => hoverEdge(null));
      g.append(e.path, e.hit); paint(e, false);
    }
    const pkt = svg('circle', { r: 4, fill: 'var(--vz-amber)', opacity: 0 }); g.append(pkt);
    stage.append(g);
    const KIND = { event: 'k-event', signal: 'k-event', message: 'k-event', topic: 'k-event' };
    const boxes = s.nodes.map((nd, i) => {
      const b = nd.box;
      const cls = ['vz-box', nd.st && 's-' + nd.st, KIND[nd.kind], nd.end && 'e-' + nd.end, b.fixed && 'fixed'].filter(Boolean).join(' ');
      const el = h('div', { class: cls, style: `left:${b.x}px;top:${b.y}px;min-height:${b.h}px${b.fixed ? `;width:${b.w}px` : ''}`, role: 'button', tabindex: -1, 'aria-label': nd.label, 'data-viz-id': nd.id },
        ...b.lines.map((l, j) => h('div', { class: 'vz-bl' }, j === 0 && b.mark ? h('span', { class: 'vz-mk' }, b.mark) : null, l)),
        ...b.sub.map((x) => h('div', { class: 'vz-bs' }, x)),
        ...b.notes.map((x) => h('div', { class: 'vz-bn' }, x)),
        ...b.locals.map((x) => h('div', { class: 'vz-bv' }, x)));
      el.addEventListener('click', () => pickNode(i));
      el.addEventListener('mouseenter', () => hoverNode(i)); el.addEventListener('mouseleave', () => hoverNode(null));
      stage.append(el); return el;
    });
    const numbered = view === 'flow';
    for (const e of s.edges) {
      if (!e.pill) continue;
      e.pillEl = h('div', { class: `vz-pill ${e.st ? 's-' + e.st : ''}`, style: `left:${e.pill.x}px;top:${e.pill.y}px`, role: 'button', title: e.label || `${s.byId[e.from].label} → ${s.byId[e.to].label}` },
        numbered ? h('span', { class: 'vz-num' }, e.num) : null, e.label ? h('span', {}, e.label) : null);
      if (!numbered) e.pillEl.classList.add('plain');
      e.pillEl.addEventListener('click', () => pickEdge(e));
      e.pillEl.addEventListener('mouseenter', () => hoverEdge(e)); e.pillEl.addEventListener('mouseleave', () => hoverEdge(null));
      stage.append(e.pillEl);
    }
    wrapEl.append(stage);

    // Legend: only for what this graph uses.
    const outs = new Set(s.edges.map((e) => e.out)), used = [...new Set(s.nodes.map((nd) => nd.st).filter((st) => st && !(st === 'fail' && outs.has('fail'))))];
    const legend = h('div', { class: 'vz-legend' },
      numbered && s.edges.some((e) => e.pill) ? h('span', {}, h('span', { class: 'vz-num' }, '1'), 'order') : null,
      outs.has('pass') ? h('span', { class: 's-add' }, '— gets through') : null,
      outs.has('drop') ? h('span', {}, '┄ filtered out') : null,
      outs.has('fail') ? h('span', { class: 's-fail' }, '! — fails') : null,
      s.edges.some((e) => e.async) ? h('span', {}, '┄ async') : null,
      ...used.map((st) => h('span', { class: 's-' + st }, `${MARK[st]} ${STATUS_WORD[st]}`)),
      s.paths.length ? h('span', { class: 'vz-hint' }, 'hover anything to trace its paths') : null);

    // Before/after: when a change is drawn on one layout, a toggle hides either side instead of a second tab.
    const twoSided = [...s.edges, ...s.nodes].some((x) => x.st === 'add') && [...s.edges, ...s.nodes].some((x) => x.st === 'del');
    let side = 'both';
    const sideBtns = twoSided ? ['before', 'both', 'after'].map((k) => h('button', { 'aria-pressed': k === side, onclick: () => setSide(k) }, k)) : [];
    function setSide(k) {
      side = k; sideBtns.forEach((b) => b.setAttribute('aria-pressed', b.textContent === k));
      wrapEl.classList.toggle('vz-before', k === 'before'); wrapEl.classList.toggle('vz-after', k === 'after'); restore();
    }
    const shown = (p) => !(side === 'before' && p.st === 'add') && !(side === 'after' && p.st === 'del');

    // Highlight: a node lights every path through it (or, off any path, its edges and neighbours); a chip lights its paths.
    let selNode = null, selEdge = null, selRow = null, step = -1, timer = null;
    const chips = [];
    function light(nodes, edges, paths) {
      const any = nodes || edges;
      wrapEl.classList.toggle('vz-dimmed', !!any);
      boxes.forEach((b, i) => b.classList.toggle('hot', !!nodes && nodes.has(i)));
      for (const e of s.edges) { const on = !!edges && edges.has(e); paint(e, on); e.pillEl?.classList.toggle('hot', on); }
      coverEl?.classList.toggle('vz-dimmed', !!any);
      for (const c of chips) c.el.classList.toggle('hot', !!paths && c.row.paths.some((p) => paths.has(p)));
    }
    const ofPaths = (ps) => {
      const ns = new Set(), es = new Set();
      for (const p of ps) { p.ids.forEach((id) => ns.add(idx[id])); p.edges.forEach((e) => es.add(e)); }
      return [ns, es, new Set(ps)];
    };
    const around = (i) => {
      const id = s.nodes[i].id, ps = s.paths.filter((p) => shown(p) && p.ids.includes(id));
      if (ps.length) return ofPaths(ps);
      const es = new Set(s.edges.filter((e) => e.from === id || e.to === id)), ns = new Set([i]);
      for (const e of es) { ns.add(idx[e.from]); ns.add(idx[e.to]); }
      return [ns, es, null];
    };
    const alongEdge = (e) => { const ps = e.paths.filter(shown); return ps.length ? ofPaths(ps) : [new Set([idx[e.from], idx[e.to]]), new Set([e]), null]; };
    const restore = () => {
      if (selNode != null) light(...around(selNode)); else if (selEdge) light(...alongEdge(selEdge));
      else if (selRow) light(...ofPaths(selRow.paths.filter(shown))); else light(null, null, null);
    };
    const tell = (id) => document.dispatchEvent(new CustomEvent('viz:hover', { detail: { id, from: s.uid } }));
    function hoverNode(i) { tell(i == null ? null : s.nodes[i].id); if (step >= 0) return; if (i == null) restore(); else light(...around(i)); }
    function hoverEdge(e) { if (step >= 0) return; if (!e) restore(); else light(...alongEdge(e)); }
    function hoverRow(r) { if (step >= 0) return; if (!r) restore(); else light(...ofPaths(r.paths.filter(shown))); }
    // Linked views: hovering a node id or path name anywhere on the page (another view, or any element with data-viz-id) lights it here.
    document.addEventListener('viz:hover', (ev) => {
      const { id, from } = ev.detail || {};
      if (from === s.uid || step >= 0) return;
      const named = id == null ? [] : s.paths.filter((p) => p.name === id);
      if (id != null && idx[id] != null) light(...around(idx[id]));
      else if (named.length) light(...ofPaths(named.filter(shown)));
      else restore();
    });

    // Inspector: only what the picture can't carry: file:line, detail lines, refs, and the paths through a box.
    const insp = h('div', { class: 'vz-insp', 'aria-live': 'polite' });
    // With nothing picked, the inspector lists where each numbered edge happens: the one thing the picture omits.
    const hint = () => {
      const seen = new Set(), at = numbered ? s.edges.filter((e) => e.ref && e.num && !seen.has(e.num) && seen.add(e.num)).sort((a, b) => a.num - b.num) : [];
      return h('div', {}, h('div', { class: 'vz-hint' }, numbered ? 'Numbers give the order. Click a box or an edge label for file:line and detail.' : 'Click a box, an edge or a chip for file:line, detail and the paths through it.'),
        at.length ? h('div', { class: 'vz-where' }, ...at.map((e) => h('span', { class: 'vz-hop vz-link', onclick: () => pickEdge(e) }, h('span', { class: 'vz-num' }, e.num), short(e.ref)))) : null);
    };
    const copy = (ref) => { const full = (doc.base || '') + ref; navigator.clipboard?.writeText(full).catch(() => {}); };
    const refEl = (ref, what) => h('div', {}, h('code', { title: 'copy path', onclick: () => copy(ref) }, (doc.base || '') + ref), what ? ' ' + what : '');
    const jump = (id) => h('span', { class: 'vz-link', onclick: () => pickNode(idx[id]) }, s.byId[id].label);
    const OUT_WORD = { pass: '→ gets through', drop: '⊘ filtered out', fail: '✕ fails', plain: '→' };
    const pathEl = (p) => h('div', {}, h('span', { class: p.out === 'pass' ? 's-add' : p.out === 'fail' ? 's-fail' : 's-unk' }, OUT_WORD[p.out]), ' ',
      p.named ? h('b', {}, p.name + ' ') : '', p.ids.map((id) => s.byId[id].label).join(' › '), p.st === 'add' || p.st === 'del' ? h('span', { class: 's-' + p.st }, `  ${STATUS_WORD[p.st]}`) : '');
    const DETAIL = ['carries', 'does', 'reads', 'writes', 'fails', 'state', 'locals', 'lane', 'at'];
    function sheet(rows) {
      const dl = h('dl', {});
      for (const [k, v] of rows) if (!(v == null || v === '' || (Array.isArray(v) && !v.length))) dl.append(h('dt', {}, k), h('dd', {}, v));
      insp.replaceChildren(dl);
    }
    function pickNode(i) {
      selNode = i; selEdge = null; selRow = null; restore();
      const nd = s.nodes[i];
      const ins = s.edges.filter((e) => e.to === nd.id), outs2 = s.edges.filter((e) => e.from === nd.id);
      const hop = (e, id) => h('span', { class: 'vz-hop' }, numbered && e.num ? h('span', { class: 'vz-num' }, e.num) : null, ' ', jump(id));
      sheet([
        ['node', [h('b', {}, nd.label), nd.kind ? `  [${nd.kind}]` : '', nd.st ? h('span', { class: 's-' + nd.st }, `  ${STATUS_WORD[nd.st]}`) : '']],
        ['at', nd.ref ? refEl(nd.ref) : null],
        ...DETAIL.map((k) => [k, nd.info[k]]),
        ['note', nd.note || nd.info.note],
        ['refs', nd.refs.map(([r, w]) => refEl(r, w))],
        ['paths', s.paths.filter((p) => p.ids.includes(nd.id)).map(pathEl)],
        ['in', ins.map((e) => hop(e, e.from))],
        ['out', outs2.map((e) => hop(e, e.to))],
      ]);
    }
    function pickEdge(e) {
      selEdge = e; selNode = null; selRow = null; restore();
      sheet([
        ['edge', [numbered && e.num ? h('span', { class: 'vz-num' }, e.num) : '', ' ', jump(e.from), e.async ? ' ~> ' : ' → ', jump(e.to), e.st ? h('span', { class: 's-' + e.st }, `  ${STATUS_WORD[e.st]}`) : '']],
        ['label', e.label],
        ['at', e.ref ? refEl(e.ref) : null],
        ...DETAIL.map((k) => [k, e.info[k]]),
        ['note', e.note || e.info.note],
        ['refs', e.refs.map(([r, w]) => refEl(r, w))],
        ['paths', e.paths.map(pathEl)],
      ]);
    }
    function pickRow(r) {
      selRow = r; selNode = null; selEdge = null; restore();
      sheet([['input', [h('b', {}, r.name), '  ', h('span', { class: 'c-' + r.status }, COVER_WORD[r.status])]], ['note', r.note], ['paths', r.paths.map(pathEl)]]);
    }
    const rowsOf = (o) => DETAIL.filter((k) => o.info[k]).length + o.refs.length + (o.note || o.info.note ? 1 : 0) + (o.ref ? 1 : 0) + (o.id ? s.paths.filter((p) => p.ids.includes(o.id)).length : (o.paths || []).length);
    const ih = Math.min(220, Math.max(64, ...s.nodes.map((nd) => 26 + 20 * (rowsOf(nd) + 3)), ...s.edges.map((e) => 26 + 20 * (rowsOf(e) + 2))));
    insp.style.setProperty('--vz-ih', ih + 'px');
    insp.append(hint());

    // Cover: what the outcome reads, each row bound to paths; its status is derived from how those paths end.
    let coverEl = null;
    const COVER_WORD = { covered: 'covered', partial: 'partly covered', gap: 'gap: nothing gets through', unread: 'no path' };
    const COVER_MARK = { covered: '●', partial: '◐', gap: '⚠', unread: '○' };
    const cv = s.cover;
    if (cv) {
      const rowEl = (r, ...kids) => {
        const el = h(cv.columns ? 'tr' : 'button', { class: `vz-chip c-${r.status}`, title: COVER_WORD[r.status], ...(cv.columns ? { tabindex: 0 } : {}) }, ...kids);
        el.addEventListener('mouseenter', () => hoverRow(r)); el.addEventListener('mouseleave', () => hoverRow(null));
        el.addEventListener('click', () => pickRow(r)); el.addEventListener('focus', () => hoverRow(r));
        chips.push({ el, row: r }); return el;
      };
      const lead = (r) => [h('span', { class: 'vz-cm' }, COVER_MARK[r.status]), ' ', h('b', {}, r.name), r.note ? ' ' + r.note : ''];
      let body;
      if (cv.columns) {
        const ri = s.ranks.findIndex((x) => x.toLowerCase() === cv.columns.toLowerCase()), cols = s.nodes.filter((nd) => nd.rank === ri);
        const cell = (r, nd) => {
          const os = new Set(r.paths.filter((p) => p.ids.includes(nd.id)).map((p) => (p.out === 'fail' ? 'drop' : p.out)));
          const k = !os.size ? '' : os.has('drop') && os.size > 1 ? 'partial' : os.has('drop') ? 'gap' : 'covered';
          return h('td', { class: k ? 'c-' + k : '' }, k ? COVER_MARK[k] : '');
        };
        body = h('table', { class: 'vz-grid' }, h('thead', {}, h('tr', {}, h('th', {}, ''), ...cols.map((nd) => h('th', { 'data-viz-id': nd.id }, nd.label)))),
          h('tbody', {}, ...cv.rows.map((r) => rowEl(r, h('td', { class: 'vz-gl' }, ...lead(r)), ...cols.map((nd) => cell(r, nd))))));
      } else body = h('div', { class: 'vz-chips' }, ...cv.rows.map((r) => rowEl(r, ...lead(r))));
      coverEl = h('div', { class: 'vz-cover' }, cv.name ? h('div', { class: 'vz-ctitle' }, cv.name) : null, body);
    }

    wrapEl.addEventListener('keydown', (ev) => {
      const cur = selNode ?? -1;
      if (ev.key === 'ArrowDown' || ev.key === 'j') { pickNode(Math.min(cur + 1, s.nodes.length - 1)); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp' || ev.key === 'k') { pickNode(Math.max(cur - 1, 0)); ev.preventDefault(); }
      else if (ev.key === 'Escape') { selNode = null; selEdge = null; selRow = null; restore(); insp.replaceChildren(hint()); }
      else if (steps.length && ev.key === 'ArrowRight') { go(step + 1); ev.preventDefault(); }
      else if (steps.length && ev.key === 'ArrowLeft') { go(step - 1); ev.preventDefault(); }
      else if (steps.length && ev.key === ' ') { play(); ev.preventDefault(); }
    });

    // Replay: each step lights its path and sends a packet along it; visited boxes stay marked done.
    let bar = null, narr = null, range = null, playBtn = null, count = null;
    function go(k) {
      k = Math.max(-1, Math.min(k, steps.length - 1)); step = k;
      if (range) range.value = k + 1;
      count.textContent = `${k + 1}/${steps.length}`;
      boxes.forEach((b) => b.classList.remove('done', 'now', 'nowfail'));
      pkt.setAttribute('opacity', 0);
      if (k < 0) { narr.replaceChildren(`Press ▶ or → to step through the ${view === 'seq' ? 'messages' : 'paths'}.`); restore(); return; }
      for (let j = 0; j < k; j++) for (const id of steps[j].ids) boxes[idx[id]].classList.add('done');
      const st = steps[k], last = st.ids[st.ids.length - 1], hops = st.edges, es = new Set(hops);
      for (const id of st.ids) boxes[idx[id]].classList.add(st.fail ? 'nowfail' : 'now');
      narr.replaceChildren(st.fail ? h('span', { class: 's-fail' }, '✕ ') : st.out === 'drop' ? h('span', { class: 's-unk' }, '⊘ ') : '',
        st.payload ? h('span', { class: 'vz-payload' }, st.payload) : '', st.payload ? ' ' : '',
        st.narr || st.ids.map((id) => s.byId[id].label).join(' → '));
      pickNode(idx[last]); light(new Set(st.ids.map((id) => idx[id])), es, s.paths.includes(st) ? new Set([st]) : null);
      animate(hops);
    }
    function animate(es) {
      if (!es.length || reduced()) return;
      const t0 = performance.now(), per = 520, total = per * es.length, mine = step;
      const tick = (t) => {
        if (step !== mine) return;
        const f = Math.min(Math.max(t - t0, 0) / total, 0.999), e = es[Math.floor(f * es.length)], p = e.path, local = (f * es.length) % 1, len = p.getTotalLength();
        const pt = p.getPointAtLength(len * (e.rev ? 1 - local : local));
        pkt.setAttribute('cx', pt.x); pkt.setAttribute('cy', pt.y); pkt.setAttribute('opacity', 1);
        if (f < 0.999) requestAnimationFrame(tick); else pkt.setAttribute('opacity', 0);
      };
      requestAnimationFrame(tick);
    }
    function play() {
      if (timer) { clearInterval(timer); timer = null; playBtn.textContent = '▶'; playBtn.setAttribute('aria-pressed', false); return; }
      if (step >= steps.length - 1) go(-1);
      playBtn.textContent = '❚❚'; playBtn.setAttribute('aria-pressed', true);
      go(step + 1);
      timer = setInterval(() => { if (step >= steps.length - 1) play(); else go(step + 1); }, 1900);
    }
    if (steps.length) {
      playBtn = h('button', { 'aria-label': 'play', 'aria-pressed': false, onclick: play }, '▶');
      range = h('input', { type: 'range', min: 0, max: steps.length, value: 0, 'aria-label': 'step' });
      range.addEventListener('input', () => go(+range.value - 1));
      count = h('span', { class: 'vz-count' });
      bar = h('div', { class: 'vz-bar' }, h('button', { 'aria-label': 'previous step', onclick: () => go(step - 1) }, '◀'), playBtn,
        h('button', { 'aria-label': 'next step', onclick: () => go(step + 1) }, '▶▏'), range, count, ...sideBtns);
      narr = h('div', { class: 'vz-narr', 'aria-live': 'polite' });
    } else if (sideBtns.length) bar = h('div', { class: 'vz-bar' }, ...sideBtns);
    mount.append(...[bar, narr, wrapEl, legend, coverEl, insp].filter(Boolean));
    // A graph wider than its frame shrinks to fit, down to 70%; past that it scrolls sideways.
    let zoom = 1;
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => requestAnimationFrame(() => {
      const room = wrapEl.clientWidth, k = room ? Math.min(1, Math.max(0.7, Math.floor((room / L.w) * 100) / 100)) : zoom;
      if (k !== zoom) { zoom = k; stage.style.zoom = k; }
    })).observe(wrapEl);
    if (steps.length) go(-1);
  }

  /* ---------- tree / diff ---------- */
  function renderTree(s, doc, mount) {
    const all = [];
    const walk = (nd) => { for (const k of nd.kids) { all.push(k); walk(k); } };
    walk(s.root);
    const counts = { add: 0, del: 0, mod: 0, fail: 0 };
    for (const nd of all) if (nd.st) counts[nd.st]++;
    const anyChange = all.some((nd) => nd.st);
    let onlyChanged = anyChange && all.some((nd) => !nd.changed), query = '', sel = null;
    for (const nd of all) nd.open = nd.depth < 2 || nd.changed;
    const box = h('div', { class: 'vz-tree', role: 'tree', tabindex: 0, 'aria-label': s.name });
    const detail = h('div', { class: 'vz-detail', 'aria-live': 'polite' }, 'Select a call to see where it lives.');
    const search = h('input', { type: 'search', placeholder: 'filter calls', 'aria-label': 'filter calls' });
    const chgBtn = anyChange ? h('button', { 'aria-pressed': onlyChanged, onclick: () => { onlyChanged = !onlyChanged; chgBtn.setAttribute('aria-pressed', onlyChanged); draw(); } }, 'changes only') : null;
    const sum = [counts.add && h('span', { class: 's-add' }, `+${counts.add}`), counts.del && h('span', { class: 's-del' }, ` −${counts.del}`), counts.mod && h('span', { class: 's-mod' }, ` ~${counts.mod}`)].filter(Boolean);
    const bar = h('div', { class: 'vz-bar' }, search, chgBtn,
      h('button', { onclick: () => { all.forEach((n) => (n.open = true)); draw(); } }, 'expand'),
      h('button', { onclick: () => { all.forEach((n) => (n.open = n.depth < 1)); draw(); } }, 'collapse'),
      h('span', { class: 'vz-count' }, all.length + ' calls ', ...sum));
    search.addEventListener('input', () => { query = search.value.trim().toLowerCase(); draw(); });
    let visible = [];
    const matches = (nd) => !query || nd.label.toLowerCase().includes(query) || (nd.ref || '').toLowerCase().includes(query);
    const keep = (nd) => {
      if (nd._k != null) return nd._k;
      const self = (!onlyChanged || nd.changed) && matches(nd);
      return (nd._k = self || nd.kids.some(keep));
    };
    function draw() {
      for (const nd of all) nd._k = null;
      visible = []; const frag = document.createDocumentFragment();
      const emit = (nd) => {
        if (!keep(nd)) return;
        visible.push(nd);
        const kidsShown = nd.kids.filter(keep);
        const open = nd.open || !!query;
        const row = h('div', { class: `vz-node ${nd.st ? 's-' + nd.st : anyChange ? 'same' : ''} ${nd === sel ? 'sel' : ''}`, role: 'treeitem', 'aria-level': nd.depth + 1, 'aria-expanded': kidsShown.length ? open : null },
          ...Array.from({ length: nd.depth }, () => h('span', { class: 'vz-guide' })),
          h('span', { class: 'vz-car' }, kidsShown.length ? (open ? '▾' : '▸') : ''),
          h('span', { class: 'vz-m' }, nd.st === 'add' ? '+' : nd.st === 'del' ? '−' : nd.st === 'mod' ? '~' : nd.st === 'fail' ? '!' : ''),
          h('span', { class: 'vz-lab' }, nd.label),
          nd.note ? h('span', { class: 'vz-note' }, '# ' + nd.note) : null,
          nd.ref ? h('span', { class: 'vz-ref', title: nd.ref }, short(nd.ref)) : null);
        row.addEventListener('click', (ev) => { if (ev.target.classList.contains('vz-car') || nd === sel) { nd.open = !nd.open; } pick(nd); draw(); });
        frag.append(row);
        if (open) kidsShown.forEach(emit);
      };
      s.root.kids.forEach(emit);
      box.replaceChildren(frag);
    }
    function pick(nd) {
      sel = nd;
      const trail = []; for (let p = nd; p && p.depth >= 0; p = p.parent) trail.unshift(p.label.replace(/\(.*$/, ''));
      const full = nd.ref ? (doc.base || '') + nd.ref : '';
      detail.replaceChildren(...[h('div', {}, h('b', {}, nd.label), nd.st ? `  ${STATUS_WORD[nd.st]}` : ''),
        full && h('div', {}, h('code', { title: 'copy path', onclick: () => navigator.clipboard?.writeText(full).catch(() => {}) }, full)),
        nd.note && h('div', {}, nd.note), h('div', {}, trail.join(' › '))].filter(Boolean));
    }
    box.addEventListener('keydown', (ev) => {
      const i = visible.indexOf(sel);
      const mv = (j) => { if (visible[j]) { pick(visible[j]); draw(); box.querySelector('.sel')?.scrollIntoView({ block: 'nearest' }); } };
      if (ev.key === 'ArrowDown' || ev.key === 'j') mv(i + 1);
      else if (ev.key === 'ArrowUp' || ev.key === 'k') mv(Math.max(i - 1, 0));
      else if (sel && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft' || ev.key === 'Enter')) { sel.open = ev.key === 'Enter' ? !sel.open : ev.key === 'ArrowRight'; draw(); }
      else return;
      ev.preventDefault();
    });
    draw();
    mount.append(bar, box, detail);
    // Reserve the first draw's height so the host frame does not jump as rows collapse. Counted from rows, not
    // measured: a tree in a hidden tab measures 0 px tall.
    box.style.minHeight = Math.min(visible.length * 20 + 2, 460) + 'px';
  }

  /* ---------- mount ---------- */
  let uid = 0;
  function render(el, text) {
    if (!document.getElementById('vz-css')) document.head.append(h('style', { id: 'vz-css' }, CSS));
    const doc = parse(text);
    const root = h('div', { class: 'vz' });
    if (doc.title || doc.sub) root.append(h('div', { class: 'vz-head' }, h('span', { class: 'vz-title' }, doc.title), h('span', { class: 'vz-sub' }, [doc.sub, doc.base && `paths under ${doc.base}`].filter(Boolean).join(' · '))));
    for (const e of doc.errors) console.error('viz: ' + e);
    if (doc.errors.length) root.append(h('div', { class: 'vz-err' }, doc.errors.join('\n')));
    const secs = doc.sections;
    const panels = secs.map((s) => { s.uid = ++uid; const p = h('div', { class: 'vz-panel', role: 'tabpanel' }); (s.kind === 'graph' ? renderGraph : renderTree)(s, doc, p); return p; });
    if (secs.length > 1) {
      const tabs = secs.map((s, i) => h('button', { role: 'tab', 'aria-selected': i === 0, onclick: () => show(i) }, s.name));
      const show = (i) => { tabs.forEach((t, j) => t.setAttribute('aria-selected', i === j)); panels.forEach((p, j) => (p.hidden = i !== j)); };
      root.append(h('div', { class: 'vz-tabs', role: 'tablist' }, tabs), ...panels); show(0);
    } else root.append(...panels);
    el.replaceChildren(root);
    // Outside T3 there are no theme variables and the fallback palette is dark; give it a dark ground unless the page has its own.
    const clear = (e) => getComputedStyle(e).backgroundColor === 'rgba(0, 0, 0, 0)';
    if (!getComputedStyle(root).getPropertyValue('--foreground').trim() && clear(document.body) && clear(document.documentElement)) root.classList.add('vz-solo');
    ground(root); watch();
    return doc;
  }
  // Boxes and edge labels sit on an opaque ground so edges pass behind them. The ground is the first painted
  // background above the view; with none (a transparent frame), it follows the theme's foreground: light text, dark ground.
  function ground(root) {
    let col = '';
    for (let e = root; e && e.nodeType === 1; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      if (c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c)) { col = c; break; }
    }
    if (!col) {
      const m = getComputedStyle(root).color.match(/\d+(\.\d+)?/g) || [233, 230, 225];
      col = (+m[0] * 0.3 + +m[1] * 0.59 + +m[2] * 0.11) > 128 ? '#0f0f10' : '#ffffff';
    }
    root.style.setProperty('--vz-ground', col);
  }
  let watching = false;
  function watch() {
    if (watching || typeof MutationObserver === 'undefined') return; watching = true;
    const again = () => document.querySelectorAll('.vz').forEach(ground);
    const mo = new MutationObserver(() => requestAnimationFrame(again));
    for (const el of [document.documentElement, document.body]) if (el) mo.observe(el, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', again);
  }
  // Page elements carrying data-viz-id join the views: hovering one lights that id in every view, and a hovered box
  // outlines the page elements with its id. No page script needed.
  let linking = false;
  function link() {
    if (linking) return; linking = true;
    const page = (t) => t.closest?.('[data-viz-id]:not(.vz *)');
    const send = (id) => document.dispatchEvent(new CustomEvent('viz:hover', { detail: { id, from: 'page' } }));
    document.addEventListener('mouseover', (ev) => { const el = page(ev.target); if (el) send(el.dataset.vizId); });
    document.addEventListener('mouseout', (ev) => { const el = page(ev.target); if (el && !el.contains(ev.relatedTarget)) send(null); });
    document.addEventListener('focusin', (ev) => { const el = page(ev.target); if (el) send(el.dataset.vizId); });
    document.addEventListener('focusout', (ev) => { if (page(ev.target)) send(null); });
    document.addEventListener('viz:hover', (ev) => {
      const id = ev.detail?.id;
      for (const el of document.querySelectorAll('[data-viz-id]:not(.vz *)')) el.classList.toggle('vz-linked', id != null && el.dataset.vizId === id && ev.detail.from !== 'page');
    });
  }
  function boot() {
    link();
    for (const sc of document.querySelectorAll('script[type="text/viz"]')) {
      if (sc.dataset.done) continue; sc.dataset.done = 1;
      // A page with no <body> tag parses these scripts into <head>, where an inserted view never shows.
      const host = h('div', {});
      if (document.body.contains(sc)) sc.after(host); else document.body.append(host);
      render(host, sc.textContent);
    }
  }
  window.Viz = { render, parse, boot };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
