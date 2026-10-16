/* viz.js: renders compact `text/viz` blocks as interactive flows, call trees and call diffs.
   Grammar: ../references/viz.md. The page holds only data; this file is loaded from the CDN or inlined by scripts/viz.py. */
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

  function parse(text) {
    const doc = { title: '', sub: '', base: '', sections: [], errors: [] };
    let sec = null, node = null, lastFlow = null, lastEdges = null;
    const lines = text.replace(/\t/g, '  ').split('\n');
    lines.forEach((raw, i) => {
      const n = i + 1;
      if (!raw.trim() || /^\s*\/\//.test(raw)) return;
      const head = raw.match(/^==\s*(flow|tree|diff|steps)\b\s*(.*)$/);
      if (head) {
        const [, kind, name] = head;
        if (kind === 'steps') {
          const target = name ? doc.sections.find((s) => s.kind === 'flow' && s.name === name.trim()) : lastFlow;
          if (!target) { doc.errors.push(`line ${n}: steps "${name}" has no flow before it`); sec = null; return; }
          sec = { kind: 'steps', flow: target }; target.steps = target.steps || []; return;
        }
        sec = kind === 'flow' ? { kind, name: name.trim() || 'flow', nodes: [], edges: [], byId: {} }
          : { kind: 'tree', diff: kind === 'diff', name: name.trim() || kind, lines: [] };
        doc.sections.push(sec); if (kind === 'flow') lastFlow = sec; node = null; lastEdges = null; return;
      }
      const meta = sec?.kind !== 'tree' && raw.match(/^(title|sub|base)\s+(.*)$/);
      if (meta) { doc[meta[1]] = meta[2].trim(); return; }
      if (!sec) { doc.errors.push(`line ${n}: expected title/sub/base or a == section`); return; }
      if (sec.kind === 'tree') { sec.lines.push({ raw, n }); return; }
      if (sec.kind === 'steps') { parseStep(sec.flow, raw.trim(), n, doc.errors); return; }
      // flow body
      // Detail lines belong to the node or edge line above them (every edge of a fan-out line).
      const detail = raw.match(/^\s+(does|reads|writes|fails|ref|note|state|carries):\s*(.*)$/);
      if (detail) {
        const owners = node ? [node] : lastEdges;
        if (!owners) { doc.errors.push(`line ${n}: detail before any node or edge`); return; }
        const [, key, val] = detail;
        for (const o of owners) {
          if (key === 'ref') { const { rest, ref } = splitTail('@' + val.replace(/^@/, '')); o.refs.push([ref, rest]); }
          else o.info[key] = val;
        }
        return;
      }
      const edge = raw.trim().match(/^([+\-~!*?]?)([\w.$-]+(?:\s*,\s*[\w.$-]+)*)\s*(->|~>|=>)\s*([\w.$-]+(?:\s*,\s*[\w.$-]+)*)\s*(?::\s*(.*))?$/);
      if (edge) {
        const [, st, from, arrow, to, body] = edge;
        const { rest, ref, note } = splitTail(body || '');
        lastEdges = [];
        for (const f of from.split(/\s*,\s*/)) for (const t of to.split(/\s*,\s*/)) {
          const e = { from: f, to: t, label: rest, ref, note, async: arrow === '~>', st: STATUS[st] || '', n, info: {}, refs: [] };
          sec.edges.push(e); lastEdges.push(e);
        }
        node = null; return;
      }
      const nd = raw.trim().match(/^([+\-~!*?]?)([\w.$-]+):\s*(.*)$/);
      if (nd) {
        const [, st, id, body] = nd;
        const { rest, ref, note } = splitTail(body);
        const km = rest.match(/\[([^\]]+)\]\s*$/);
        const label = (km ? rest.slice(0, km.index) : rest).trim() || id;
        if (sec.byId[id]) doc.errors.push(`line ${n}: node "${id}" declared twice`);
        node = { id, label, kind: km ? km[1] : '', ref, note, st: STATUS[st] || '', info: {}, refs: [] };
        sec.byId[id] = node; sec.nodes.push(node); lastEdges = null; return;
      }
      doc.errors.push(`line ${n}: not a node (id: Label), edge (a -> b), or detail (  does: …): ${raw.trim()}`);
    });
    for (const s of doc.sections) {
      if (s.kind === 'flow') {
        for (const e of s.edges) for (const id of [e.from, e.to]) if (!s.byId[id]) doc.errors.push(`line ${e.n}: edge uses undeclared node "${id}"`);
        s.edges = s.edges.filter((e) => s.byId[e.from] && s.byId[e.to]);
        for (const st of s.steps || []) for (const id of st.ids) if (!s.byId[id]) doc.errors.push(`line ${st.n}: step uses undeclared node "${id}"`);
      } else buildTree(s, doc.errors);
    }
    return doc;
  }

  // Step: `a -> b | payload | narration`, or `a | | narration` for a step that stays on one node. Leading ! marks a failing step.
  function parseStep(flow, line, n, errors) {
    const [path, payload = '', narr = ''] = line.split('|').map((x) => x.trim());
    const fail = path.startsWith('!');
    const ids = path.replace(/^!/, '').split(/\s*(?:->|~>|=>)\s*/).filter(Boolean);
    if (!ids.length) { errors.push(`line ${n}: empty step`); return; }
    flow.steps.push({ ids, payload, narr, fail, n });
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

  /* ---------- flow ---------- */
  // Layered layout: real nodes sit on even ranks; every edge gets one virtual item on each rank it crosses.
  // An edge's first virtual item is its label pill, so labels take real space: they never overlap, cover a
  // node, or need truncating. Edges are numbered in declaration order, so the order of execution reads off the picture.
  const FS = 12.5, PFS = 11, LINE = 17, PX = 9, PY = 6, WRAP = 28, PILL = 20, GAP = 26, VGAP = 26;
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

  function layoutFlow(s) {
    const n = s.nodes.length, idx = Object.fromEntries(s.nodes.map((nd, i) => [nd.id, i])), c = cw();
    const real = s.edges.filter((e) => e.from !== e.to);
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
    // Node boxes.
    const items = [], ranks = [];
    const put = (it, r) => { it.r = r; it.up = []; it.down = []; (ranks[r] = ranks[r] || []).push(it); items.push(it); return it; };
    s.nodes.forEach((nd, i) => {
      const mark = MARK[nd.st] ? MARK[nd.st] + ' ' : '';
      const lines = wrap(nd.label, WRAP);
      const r = nd.ref && short(nd.ref), lw = Math.max(...lines.map((l, j) => l.length + (j ? 0 : mark.length)));
      // The kind and file:line share a line when they fit under the label; otherwise each takes its own.
      const both = [nd.kind, r].filter(Boolean).join(' · ');
      const sub = !both ? [] : both.length * PFS / FS <= Math.max(lw, WRAP) ? [both] : [nd.kind, r].filter(Boolean);
      const wch = Math.max(lw, ...sub.map((x) => x.length * PFS / FS));
      nd.box = put({ kind: 'node', nd, i, lines, mark, sub, w: Math.ceil(wch * c) + 2 * PX + 2, h: lines.length * LINE + sub.length * 15 + 2 * PY + 2 }, 2 * layer[i]);
    });
    // Order numbers: one per edge line, so a fan-out line shares its number.
    const lines = [...new Set(s.edges.map((e) => e.n))].sort((a, b) => a - b);
    for (const e of s.edges) e.num = lines.indexOf(e.n) + 1;
    for (const { e, u, v } of E) {
      const ru = 2 * layer[u], rv = 2 * layer[v];
      let prev = s.nodes[u].box; e.chain = [];
      for (let r = ru + 1; r < rv; r++) {
        const pill = r === ru + 1;
        const it = put({ kind: pill ? 'pill' : 'v', e, w: pill ? Math.ceil((String(e.num).length + 1 + e.label.length) * c * PFS / FS) + (e.label ? 30 : 22) : 2, h: pill ? PILL : 0 }, r);
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
    const band = ranks.map((rk, r) => {
      const hh = Math.max(0, ...rk.map((it) => it.h));
      const b = { top: y, h: hh }; y += hh + VGAP; return b;
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
      e.d = d; e.pill = ch[0];
    }
    for (const e of s.edges) if (e.from === e.to) {
      const b = e.box = s.nodes[idx[e.from]].box, x = b.x + b.w / 2, y0 = b.y + b.h * 0.3, y1 = b.y + b.h * 0.7;
      e.d = `M${x},${y0} C${x + 26},${y0 - 8} ${x + 26},${y1 + 8} ${x},${y1}`;
    }
    return { w: Math.ceil(hi - lo + 4 + 30), h: Math.ceil(y - VGAP + 4), items };
  }

  function renderFlow(s, doc, mount) {
    const idx = Object.fromEntries(s.nodes.map((nd, i) => [nd.id, i]));
    const L = layoutFlow(s), steps = s.steps || [];
    const wrapEl = h('div', { class: 'vz-flow', role: 'group', 'aria-label': s.name, tabindex: 0 });
    const stage = h('div', { class: 'vz-stage', style: `width:${L.w}px;height:${L.h}px` });
    const g = svg('svg', { width: L.w, height: L.h });
    const defs = svg('defs', {});
    for (const [id, col] of [['a', 'var(--vz-dim)'], ['h', 'var(--vz-amber)'], ['g', 'var(--vz-green)'], ['r', 'var(--vz-coral)']]) {
      const m = svg('marker', { id: `vz-${id}-${s.uid}`, viewBox: '0 0 6 6', refX: 5, refY: 3, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
      m.append(svg('path', { d: 'M0,0 L6,3 L0,6 z', fill: col })); defs.append(m);
    }
    g.append(defs);
    const base = (e) => (e.st === 'add' ? 'g' : e.st === 'del' ? 'r' : 'a');
    const COL = { a: 'var(--vz-dim)', h: 'var(--vz-amber)', g: 'var(--vz-green)', r: 'var(--vz-coral)' };
    const paint = (e, on) => {
      const k = on ? 'h' : base(e);
      e.path.setAttribute('stroke', COL[k]); e.path.setAttribute('stroke-width', on ? 2 : 1.3);
      e.path.setAttribute(e.rev ? 'marker-start' : 'marker-end', `url(#vz-${k}-${s.uid})`);
    };
    for (const e of s.edges) {
      e.path = svg('path', { d: e.d, fill: 'none', 'stroke-dasharray': e.async ? '4 3' : e.st === 'del' ? '2 3' : '' });
      e.hit = svg('path', { d: e.d, fill: 'none', stroke: 'transparent', 'stroke-width': 10, class: 'vz-hit' });
      e.hit.addEventListener('click', () => pickEdge(e));
      e.hit.addEventListener('mouseenter', () => hoverEdge(e)); e.hit.addEventListener('mouseleave', () => hoverEdge(null));
      g.append(e.path, e.hit); paint(e, false);
    }
    const pkt = svg('circle', { r: 4, fill: 'var(--vz-amber)', opacity: 0 }); g.append(pkt);
    stage.append(g);
    const boxes = s.nodes.map((nd, i) => {
      const b = nd.box;
      const el = h('div', { class: `vz-box ${nd.st ? 's-' + nd.st : ''}`, style: `left:${b.x}px;top:${b.y}px;min-height:${b.h}px`, role: 'button', tabindex: -1, 'aria-label': nd.label },
        ...b.lines.map((l, j) => h('div', { class: 'vz-bl' }, j === 0 && b.mark ? h('span', { class: 'vz-mk' }, b.mark) : null, l)),
        ...b.sub.map((x) => h('div', { class: 'vz-bs' }, x)));
      el.addEventListener('click', () => pickNode(i));
      el.addEventListener('mouseenter', () => hoverNode(i)); el.addEventListener('mouseleave', () => hoverNode(null));
      stage.append(el); return el;
    });
    for (const e of s.edges) {
      if (!e.pill) continue;
      e.pillEl = h('div', { class: `vz-pill ${e.st ? 's-' + e.st : ''}`, style: `left:${e.pill.x}px;top:${e.pill.y}px`, role: 'button', title: e.label || `${s.byId[e.from].label} → ${s.byId[e.to].label}` },
        h('span', { class: 'vz-num' }, e.num), e.label ? h('span', {}, e.label) : null);
      e.pillEl.addEventListener('click', () => pickEdge(e));
      e.pillEl.addEventListener('mouseenter', () => hoverEdge(e)); e.pillEl.addEventListener('mouseleave', () => hoverEdge(null));
      stage.append(e.pillEl);
    }
    wrapEl.append(stage);

    // Legend: only for what this flow uses.
    const used = [...new Set(s.nodes.map((nd) => nd.st).filter(Boolean))];
    const legend = h('div', { class: 'vz-legend' },
      h('span', {}, h('span', { class: 'vz-num' }, '1'), 'order'),
      s.edges.some((e) => e.async) ? h('span', {}, '┄ async') : null,
      ...used.map((st) => h('span', { class: 's-' + st }, `${MARK[st]} ${STATUS_WORD[st]}`)));

    // Highlight: a node lights its edges and neighbours; an edge lights itself and its ends.
    let selNode = null, selEdge = null, step = -1, timer = null;
    function light(nodes, edges) {
      const any = nodes || edges;
      wrapEl.classList.toggle('vz-dimmed', !!any);
      boxes.forEach((b, i) => b.classList.toggle('hot', !!nodes && nodes.has(i)));
      for (const e of s.edges) { const on = !!edges && edges.has(e); paint(e, on); e.pillEl?.classList.toggle('hot', on); }
    }
    const around = (i) => {
      const id = s.nodes[i].id, es = new Set(s.edges.filter((e) => e.from === id || e.to === id)), ns = new Set([i]);
      for (const e of es) { ns.add(idx[e.from]); ns.add(idx[e.to]); }
      return [ns, es];
    };
    const restore = () => { if (selNode != null) light(...around(selNode)); else if (selEdge) light(new Set([idx[selEdge.from], idx[selEdge.to]]), new Set([selEdge])); else light(null, null); };
    function hoverNode(i) { if (step >= 0) return; if (i == null) restore(); else light(...around(i)); }
    function hoverEdge(e) { if (step >= 0) return; if (!e) restore(); else light(new Set([idx[e.from], idx[e.to]]), new Set([e])); }

    // Inspector: only what the picture can't carry: file:line, detail lines, refs.
    const insp = h('div', { class: 'vz-insp', 'aria-live': 'polite' });
    // With nothing picked, the inspector lists where each numbered edge happens: the one thing the picture omits.
    const hint = () => {
      const seen = new Set(), at = s.edges.filter((e) => e.ref && !seen.has(e.num) && seen.add(e.num)).sort((a, b) => a.num - b.num);
      return h('div', {}, h('div', { class: 'vz-hint' }, 'Numbers give the order. Click a box or an edge label for file:line and detail.'),
        at.length ? h('div', { class: 'vz-where' }, ...at.map((e) => h('span', { class: 'vz-hop vz-link', onclick: () => pickEdge(e) }, h('span', { class: 'vz-num' }, e.num), short(e.ref)))) : null);
    };
    const copy = (ref) => { const full = (doc.base || '') + ref; navigator.clipboard?.writeText(full).catch(() => {}); };
    const refEl = (ref, what) => h('div', {}, h('code', { title: 'copy path', onclick: () => copy(ref) }, (doc.base || '') + ref), what ? ' ' + what : '');
    const jump = (id) => h('span', { class: 'vz-link', onclick: () => pickNode(idx[id]) }, s.byId[id].label);
    const DETAIL = ['carries', 'does', 'reads', 'writes', 'fails', 'state'];
    function sheet(rows) {
      const dl = h('dl', {});
      for (const [k, v] of rows) if (!(v == null || v === '' || (Array.isArray(v) && !v.length))) dl.append(h('dt', {}, k), h('dd', {}, v));
      insp.replaceChildren(dl);
    }
    function pickNode(i) {
      selNode = i; selEdge = null; restore();
      const nd = s.nodes[i];
      const ins = s.edges.filter((e) => e.to === nd.id).sort((a, b) => a.num - b.num), outs = s.edges.filter((e) => e.from === nd.id).sort((a, b) => a.num - b.num);
      const hop = (e, id) => h('span', { class: 'vz-hop' }, h('span', { class: 'vz-num' }, e.num), ' ', jump(id));
      sheet([
        ['node', [h('b', {}, nd.label), nd.kind ? `  [${nd.kind}]` : '', nd.st ? h('span', { class: 's-' + nd.st }, `  ${STATUS_WORD[nd.st]}`) : '']],
        ['at', nd.ref ? refEl(nd.ref) : null],
        ...DETAIL.map((k) => [k, nd.info[k]]),
        ['note', nd.note || nd.info.note],
        ['refs', nd.refs.map(([r, w]) => refEl(r, w))],
        ['in', ins.map((e) => hop(e, e.from))],
        ['out', outs.map((e) => hop(e, e.to))],
      ]);
    }
    function pickEdge(e) {
      selEdge = e; selNode = null; restore();
      sheet([
        ['edge', [h('span', { class: 'vz-num' }, e.num), ' ', jump(e.from), e.async ? ' ~> ' : ' → ', jump(e.to), e.st ? h('span', { class: 's-' + e.st }, `  ${STATUS_WORD[e.st]}`) : '']],
        ['label', e.label],
        ['at', e.ref ? refEl(e.ref) : null],
        ...DETAIL.map((k) => [k, e.info[k]]),
        ['note', e.note || e.info.note],
        ['refs', e.refs.map(([r, w]) => refEl(r, w))],
      ]);
    }
    const rowsOf = (o) => DETAIL.filter((k) => o.info[k]).length + o.refs.length + (o.note || o.info.note ? 1 : 0) + (o.ref ? 1 : 0);
    const ih = Math.min(190, Math.max(64, ...s.nodes.map((nd) => 26 + 20 * (rowsOf(nd) + 3)), ...s.edges.map((e) => 26 + 20 * (rowsOf(e) + 2))));
    insp.style.setProperty('--vz-ih', ih + 'px');
    insp.append(hint());

    wrapEl.addEventListener('keydown', (ev) => {
      const cur = selNode ?? -1;
      if (ev.key === 'ArrowDown' || ev.key === 'j') { pickNode(Math.min(cur + 1, s.nodes.length - 1)); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp' || ev.key === 'k') { pickNode(Math.max(cur - 1, 0)); ev.preventDefault(); }
      else if (ev.key === 'Escape') { selNode = null; selEdge = null; restore(); insp.replaceChildren(hint()); }
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
      if (k < 0) { narr.replaceChildren('Press ▶ or → to step through the flow.'); restore(); return; }
      for (let j = 0; j < k; j++) for (const id of steps[j].ids) boxes[idx[id]].classList.add('done');
      const st = steps[k], last = st.ids[st.ids.length - 1], hops = [], es = new Set();
      for (const id of st.ids) boxes[idx[id]].classList.add(st.fail ? 'nowfail' : 'now');
      for (let j = 0; j + 1 < st.ids.length; j++) {
        const e = s.edges.find((x) => x.from === st.ids[j] && x.to === st.ids[j + 1]);
        if (e) { es.add(e); hops.push(e); }
      }
      light(new Set(st.ids.map((id) => idx[id])), es);
      narr.replaceChildren(st.fail ? h('span', { class: 's-fail' }, '✕ ') : '', st.payload ? h('span', { class: 'vz-payload' }, st.payload) : '', st.payload ? ' ' : '',
        st.narr || st.ids.map((id) => s.byId[id].label).join(' → '));
      pickNode(idx[last]); light(new Set(st.ids.map((id) => idx[id])), es);
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
        h('button', { 'aria-label': 'next step', onclick: () => go(step + 1) }, '▶▏'), range, count);
      narr = h('div', { class: 'vz-narr', 'aria-live': 'polite' });
    }
    mount.append(...[bar, narr, wrapEl, legend, insp].filter(Boolean));
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
    const panels = secs.map((s) => { s.uid = ++uid; const p = h('div', { class: 'vz-panel', role: 'tabpanel' }); (s.kind === 'flow' ? renderFlow : renderTree)(s, doc, p); return p; });
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
  function boot() {
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
