/* viz.js: renders compact `text/viz` blocks as interactive flows, call trees and call diffs.
   Grammar: ../references/viz.md. The page holds only data; this file is loaded from the CDN or inlined by scripts/viz.py. */
(() => {
  const CSS = `
.vz{--vz-fg:var(--foreground,#e9e6e1);--vz-dim:var(--muted-foreground,#8a857e);--vz-line:var(--border,rgba(255,255,255,.13));
--vz-amber:var(--warning,#e6b04f);--vz-coral:var(--destructive,#e0736a);--vz-green:var(--success,#9cc48a);--vz-blue:var(--info,#7aa2d6);
--vz-card:var(--card,rgba(255,255,255,.03));--vz-r:var(--radius,6px);--vz-out:cubic-bezier(.23,1,.32,1);
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
.vz-flow{position:relative}.vz-flow svg{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
.vz-row{position:relative;display:flex;align-items:center;gap:8px;height:30px;border-radius:var(--vz-r);cursor:pointer;padding-right:6px;transition:background-color 160ms var(--vz-out),opacity 160ms var(--vz-out)}
.vz-row.sel{background:color-mix(in srgb,var(--vz-amber) 14%,transparent)}
.vz-dimmed .vz-row:not(.hot){opacity:.38}
.vz-lab{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:10ch;flex:0 1 auto}
.vz-kind{flex:none;color:var(--vz-dim);border:1px solid var(--vz-line);border-radius:3px;padding:0 4px;font-size:11px;white-space:nowrap}
.vz-ref{color:var(--vz-dim);margin-left:auto;white-space:nowrap;font-size:11px;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1000 auto}
.vz-via{color:var(--vz-dim);font-size:11px;white-space:nowrap;flex:none}
.vz-pkt{color:var(--vz-amber);white-space:nowrap;font-size:11px;flex:none}
.vz-st{color:var(--vz-dim);white-space:nowrap;font-size:11px;width:64px;flex:none}
.s-add{color:var(--vz-green)}.s-del{color:var(--vz-coral)}.s-del .vz-lab{text-decoration:line-through}.s-mod{color:var(--vz-amber)}
.s-fail{color:var(--vz-coral)}.s-active{color:var(--vz-amber)}.s-unk{color:var(--vz-dim)}.s-ok{color:var(--vz-green)}
.vz-insp{margin-top:8px;border-top:1px solid var(--vz-line);padding-top:8px;height:var(--vz-ih,150px);overflow:auto}
.vz-insp dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 10px;margin:0}.vz-insp dt{color:var(--vz-dim)}.vz-insp dd{margin:0}
.vz-insp code,.vz-detail code{cursor:copy;color:var(--vz-blue)}
.vz-link{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px}
.vz-narr{min-height:2.9em;margin:0 0 8px;color:var(--vz-fg)}
.vz-tree{overflow:auto;max-height:460px}
.vz-node{display:flex;align-items:baseline;gap:6px;white-space:nowrap;padding:1px 6px 1px 0;border-radius:var(--vz-r);cursor:pointer}
.vz-node.sel{background:color-mix(in srgb,var(--vz-amber) 14%,transparent)}
.vz-node.same{opacity:.55}.vz-node .vz-m{width:1ch;flex:none}
.vz-node.s-add{background:color-mix(in srgb,var(--vz-green) 8%,transparent)}.vz-node.s-del{background:color-mix(in srgb,var(--vz-coral) 8%,transparent)}
.vz-node.s-mod{background:color-mix(in srgb,var(--vz-amber) 8%,transparent)}
.vz-car{width:1.2ch;flex:none;color:var(--vz-dim)}.vz-note{color:var(--vz-dim)}
.vz-guide{flex:none;align-self:stretch;border-left:1px solid var(--vz-line);margin-left:.6ch;width:1.4ch}
.vz-detail{margin-top:8px;border-top:1px solid var(--vz-line);padding-top:6px;min-height:3.2em;color:var(--vz-dim);overflow-wrap:anywhere}
.vz-detail b{color:var(--vz-fg);font-weight:500}
@media (max-width:480px){.vz-ref,.vz-st{display:none}}
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
    let sec = null, node = null, lastFlow = null;
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
        doc.sections.push(sec); if (kind === 'flow') lastFlow = sec; node = null; return;
      }
      const meta = sec?.kind !== 'tree' && raw.match(/^(title|sub|base)\s+(.*)$/);
      if (meta) { doc[meta[1]] = meta[2].trim(); return; }
      if (!sec) { doc.errors.push(`line ${n}: expected title/sub/base or a == section`); return; }
      if (sec.kind === 'tree') { sec.lines.push({ raw, n }); return; }
      if (sec.kind === 'steps') { parseStep(sec.flow, raw.trim(), n, doc.errors); return; }
      // flow body
      const detail = raw.match(/^\s+(does|reads|writes|fails|ref|note|state):\s*(.*)$/);
      if (detail) {
        if (!node) { doc.errors.push(`line ${n}: detail before any node`); return; }
        const [, key, val] = detail;
        if (key === 'ref') { const { rest, ref } = splitTail('@' + val.replace(/^@/, '')); node.refs.push([ref, rest]); }
        else node.info[key] = val; return;
      }
      const edge = raw.trim().match(/^([+\-~!*?]?)([\w.$-]+(?:\s*,\s*[\w.$-]+)*)\s*(->|~>|=>)\s*([\w.$-]+(?:\s*,\s*[\w.$-]+)*)\s*(?::\s*(.*))?$/);
      if (edge) {
        const [, st, from, arrow, to, label] = edge;
        for (const f of from.split(/\s*,\s*/)) for (const t of to.split(/\s*,\s*/))
          sec.edges.push({ from: f, to: t, label: (label || '').trim(), async: arrow === '~>', st: STATUS[st] || '', n });
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
        sec.byId[id] = node; sec.nodes.push(node); return;
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
  const ROW = 30, LANE = 11;
  function renderFlow(s, doc, mount) {
    const idx = Object.fromEntries(s.nodes.map((nd, i) => [nd.id, i]));
    // Edges between adjacent rows run straight down the spine; the rest take a lane to its left (greedy interval colouring).
    const long = s.edges.filter((e) => idx[e.to] - idx[e.from] !== 1).sort((a, b) => Math.abs(idx[a.to] - idx[a.from]) - Math.abs(idx[b.to] - idx[b.from]));
    const lanes = [];
    for (const e of long) {
      const lo = Math.min(idx[e.from], idx[e.to]), hi = Math.max(idx[e.from], idx[e.to]);
      let l = 0;
      while ((lanes[l] || []).some(([a, b]) => lo < b && a < hi)) l++;
      (lanes[l] = lanes[l] || []).push([lo, hi]); e.lane = l + 1;
    }
    const gut = 14 + lanes.length * LANE + 8, spine = gut - 10;
    const steps = s.steps || [];
    const hasSt = s.nodes.some((nd) => nd.st) || steps.length;
    const wrap = h('div', { class: 'vz-flow', role: 'listbox', 'aria-label': s.name, tabindex: 0 });
    const g = svg('svg', { width: gut, height: s.nodes.length * ROW });
    const defs = svg('defs', {});
    for (const [id, col] of [['a', 'var(--vz-dim)'], ['h', 'var(--vz-amber)']]) {
      const m = svg('marker', { id: `vz-${id}-${s.uid}`, viewBox: '0 0 6 6', refX: 5, refY: 3, markerWidth: 6, markerHeight: 6, orient: 'auto' });
      m.append(svg('path', { d: 'M0,0 L6,3 L0,6 z', fill: col })); defs.append(m);
    }
    g.append(defs);
    const y = (i) => i * ROW + ROW / 2;
    const paths = s.edges.map((e) => {
      const a = idx[e.from], b = idx[e.to], x = spine - (e.lane || 0) * LANE, r = 5;
      const y1 = y(a) + (b > a ? 5 : -5), y2 = y(b) + (b > a ? -6 : 6), dir = b > a ? 1 : -1;
      const d = e.lane ? `M${spine - 4},${y(a)} L${x + r},${y(a)} Q${x},${y(a)} ${x},${y(a) + dir * r} L${x},${y(b) - dir * r} Q${x},${y(b)} ${x + r},${y(b)} L${spine - 6},${y(b)}`
        : `M${spine},${y1} L${spine},${y2}`;
      const p = svg('path', { d, fill: 'none', stroke: e.st === 'add' ? 'var(--vz-green)' : e.st === 'del' ? 'var(--vz-coral)' : 'var(--vz-dim)', 'stroke-width': 1.2,
        'stroke-dasharray': e.async ? '3 3' : e.st === 'del' ? '2 3' : '', 'marker-end': `url(#vz-a-${s.uid})`, opacity: 0.75 });
      g.append(p); e.path = p; return p;
    });
    const dots = s.nodes.map((nd, i) => {
      const c = svg('circle', { cx: spine, cy: y(i), r: 4.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4 });
      c.classList.add(`s-${nd.st || 'none'}`); g.append(c); return c;
    });
    const pkt = svg('circle', { r: 3.5, fill: 'var(--vz-amber)', opacity: 0 }); g.append(pkt);
    wrap.append(g);
    // The first labelled edge into a row prints before it, like a branch label, so the gutter reads without the inspector.
    const via = s.nodes.map((nd) => { const e = s.edges.find((x) => x.to === nd.id && x.label); return e ? (e.label.length > 22 ? e.label.slice(0, 21) + '…' : e.label) : ''; });
    const rows = s.nodes.map((nd, i) => {
      const row = h('div', { class: `vz-row ${nd.st ? 's-' + nd.st : ''}`, role: 'option', 'data-i': i, style: `padding-left:${gut}px` },
        hasSt ? h('span', { class: 'vz-st' }, STATUS_WORD[nd.st] || '') : null,
        via[i] ? h('span', { class: 'vz-via', title: via[i] }, via[i]) : null,
        h('span', { class: 'vz-lab' }, nd.label), nd.kind ? h('span', { class: 'vz-kind' }, nd.kind) : null,
        h('span', { class: 'vz-pkt' }), nd.ref ? h('span', { class: 'vz-ref', title: nd.ref }, short(nd.ref)) : null);
      row.addEventListener('click', () => select(i));
      row.addEventListener('mouseenter', () => hover(i)); row.addEventListener('mouseleave', () => hover(null));
      wrap.append(row); return row;
    });
    const insp = h('div', { class: 'vz-insp', 'aria-live': 'polite' });
    const ih = Math.min(220, Math.max(96, ...s.nodes.map((nd) => 40 + 19 * (Object.keys(nd.info).length + nd.refs.length + (nd.note ? 1 : 0) + (nd.ref ? 1 : 0) + 2))));
    insp.style.setProperty('--vz-ih', ih + 'px');
    let sel = 0, step = -1, timer = null;
    const lit = (e, on) => { e.path.setAttribute('stroke', on ? 'var(--vz-amber)' : e.st === 'add' ? 'var(--vz-green)' : e.st === 'del' ? 'var(--vz-coral)' : 'var(--vz-dim)'); e.path.setAttribute('opacity', on ? 1 : 0.75); e.path.setAttribute('marker-end', `url(#vz-${on ? 'h' : 'a'}-${s.uid})`); };
    function hover(i) {
      if (step >= 0) return;
      wrap.classList.toggle('vz-dimmed', i != null);
      rows.forEach((r) => r.classList.remove('hot'));
      for (const e of s.edges) {
        const on = i != null && (idx[e.from] === i || idx[e.to] === i); lit(e, on);
        if (on) { rows[idx[e.from]].classList.add('hot'); rows[idx[e.to]].classList.add('hot'); }
      }
      if (i != null) rows[i].classList.add('hot');
    }
    const copy = (ref) => { const full = (doc.base || '') + ref; navigator.clipboard?.writeText(full).catch(() => {}); };
    const refEl = (ref, what) => h('div', {}, h('code', { title: 'copy path', onclick: () => copy(ref) }, ref), what ? ' ' + what : '');
    const jump = (id) => h('span', { class: 'vz-link', onclick: () => select(idx[id]) }, s.byId[id].label);
    function select(i) {
      sel = i; rows.forEach((r, j) => { r.classList.toggle('sel', j === i); r.setAttribute('aria-selected', j === i); });
      const nd = s.nodes[i];
      const ins = s.edges.filter((e) => e.to === nd.id), outs = s.edges.filter((e) => e.from === nd.id);
      const dl = h('dl', {});
      const add = (k, v) => { if (v == null || v === '' || (Array.isArray(v) && !v.length)) return; dl.append(h('dt', {}, k), h('dd', {}, v)); };
      add('node', [h('b', {}, nd.label), nd.kind ? `  [${nd.kind}]` : '', nd.st ? `  ${STATUS_WORD[nd.st]}` : '']);
      add('at', nd.ref ? refEl(nd.ref) : null);
      for (const k of ['does', 'reads', 'writes', 'fails', 'state']) add(k, nd.info[k]);
      add('note', nd.note || nd.info.note);
      add('from', ins.map((e) => h('div', {}, jump(e.from), e.async ? ' ~> ' : ' → ', e.label || '')));
      add('to', outs.map((e) => h('div', {}, e.async ? '~> ' : '→ ', jump(e.to), e.label ? ' · ' + e.label : '')));
      add('refs', nd.refs.map(([r, w]) => refEl(r, w)));
      insp.replaceChildren(dl);
    }
    wrap.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown' || ev.key === 'j') { select(Math.min(sel + 1, rows.length - 1)); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp' || ev.key === 'k') { select(Math.max(sel - 1, 0)); ev.preventDefault(); }
      else if (steps.length && ev.key === 'ArrowRight') { go(step + 1); ev.preventDefault(); }
      else if (steps.length && ev.key === 'ArrowLeft') { go(step - 1); ev.preventDefault(); }
      else if (steps.length && ev.key === ' ') { play(); ev.preventDefault(); }
    });

    // Replay: each step lights a path, shows its payload beside the target, and leaves visited nodes marked done.
    let bar = null, narr = null, range = null, playBtn = null, count = null;
    function go(k) {
      k = Math.max(-1, Math.min(k, steps.length - 1)); step = k;
      if (range) range.value = k + 1;
      count.textContent = `${k + 1}/${steps.length}`;
      wrap.classList.toggle('vz-dimmed', k >= 0);
      rows.forEach((r, i) => { r.classList.remove('hot'); r.querySelector('.vz-pkt').textContent = ''; dots[i].setAttribute('class', `s-${s.nodes[i].st || 'none'}`); });
      s.edges.forEach((e) => lit(e, false)); pkt.setAttribute('opacity', 0);
      if (k < 0) { narr.textContent = 'Press ▶ or → to step through the flow.'; return; }
      for (let j = 0; j <= k; j++) for (const id of steps[j].ids) { dots[idx[id]].setAttribute('class', j === k ? (steps[j].fail ? 's-fail' : 's-active') : 's-ok'); rows[idx[id]].classList.add('hot'); }
      const st = steps[k], last = st.ids[st.ids.length - 1];
      if (st.payload) rows[idx[last]].querySelector('.vz-pkt').textContent = `⟵ ${st.payload}`;
      narr.replaceChildren(st.fail ? h('span', { class: 's-fail' }, '✕ ') : '', st.narr || st.ids.map((id) => s.byId[id].label).join(' → '));
      const hops = [];
      for (let j = 0; j + 1 < st.ids.length; j++) {
        const e = s.edges.find((x) => x.from === st.ids[j] && x.to === st.ids[j + 1]);
        if (e) { lit(e, true); hops.push(e.path); } else hops.push(null);
      }
      select(idx[last]); animate(hops.filter(Boolean));
    }
    function animate(ps) {
      if (!ps.length || reduced()) return;
      const t0 = performance.now(), per = 420, total = per * ps.length, mine = step;
      const tick = (t) => {
        if (step !== mine) return;
        const f = Math.min((t - t0) / total, 0.999), p = ps[Math.floor(f * ps.length)], local = (f * ps.length) % 1;
        const pt = p.getPointAtLength(p.getTotalLength() * local);
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
      timer = setInterval(() => { if (step >= steps.length - 1) play(); else go(step + 1); }, 1700);
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
    mount.append(...[bar, narr, wrap, insp].filter(Boolean));
    select(0); if (steps.length) go(-1);
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
    return doc;
  }
  function boot() {
    for (const sc of document.querySelectorAll('script[type="text/viz"]')) {
      if (sc.dataset.done) continue; sc.dataset.done = 1;
      const host = h('div', {}); sc.after(host); render(host, sc.textContent);
    }
  }
  window.Viz = { render, parse, boot };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
