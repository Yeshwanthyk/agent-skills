// meat-review reading page: styles, layout and behavior in one file, so a T3 page can load it from the CDN
// instead of carrying it. The page supplies the reading as JSON in <script id="data">.
const PIERRE = 'https://esm.sh/@pierre/diffs@1.6.2';
const D = JSON.parse(document.getElementById('data').textContent);
const T3 = D.host === 't3';
// The call tree's detail arrives packed (pack_callmap): rebuild paths, defaults, the unchanged sentence and children
// (indexes into the key order, which JSON keeps). Children's own st is read before it is defaulted, so use || ''.
const KEYS = Object.keys(D.callmap || {});
for (const [key, n] of Object.entries(D.callmap || {})) {
  const at = key.lastIndexOf('@'), name = key.slice(0, at).replace(/\(.*$/, '').replace(/^new /, '').split('.').pop();
  n.path = D.paths[n.p]; n.st ??= ''; n.side ??= 'new'; n.end ??= n.line; n.range ??= ''; n.finding ??= '';
  n.say ??= `\`${name}\` in ${n.path.split('/').pop()}, line ${n.line}, unchanged.`;
  n.kids = (n.kids || []).map(j => { const k = KEYS[j], i = k.lastIndexOf('@'); return {label: k.slice(0, i), ref: k.slice(i + 1), st: D.callmap[k].st || ''}; });
}
// Rows arrive as [old, new, mark, text, side?]; expand them once into the shape the page reads.
for (const f of D.files || []) for (const g of f.ranges) for (const b of g.blocks) b.rows = b.rows.map(([o, n, m, t, s]) => {
  s ??= m === '-' ? 'old' : m === '+' ? 'new' : b.side;
  return {o, n, m, t, s, l: s === 'old' ? o : n};
});
// The published T3 frame is sandboxed without same-origin access, so localStorage throws there; keep state in memory.
const store = (() => {
  try { localStorage.getItem('meat-review:probe'); return localStorage; }
  catch { const m = new Map(); return {getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v))}; }
})();
document.documentElement.dataset.host = D.host;
// The standalone page owns its theme; inside T3 the host's variables decide and mode() reads them.
if (!T3) {
  const pick = store.getItem('meat-review:theme') || 'auto';
  document.documentElement.dataset.pick = pick;
  document.documentElement.dataset.mode = pick === 'dark' || (pick === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}
const STYLE = String.raw`
/* Page mode defines T3's variable names, so one stylesheet serves both hosts. */
html[data-host=page][data-mode=light]{--background:#fbfaf6;--foreground:#1d1c19;--muted-foreground:#6f6b62;--border:#e4e0d6;--card:#f4f1ea;--primary:#2f5d9b;--destructive:#b8432f;--warning:#9a6510;--success:#3d7a4a;--info:#2f5d9b;color-scheme:light}
html[data-host=page][data-mode=dark]{--background:#121211;--foreground:#e7e3d7;--muted-foreground:#8e8a7f;--border:#2b2a26;--card:#191917;--primary:#9db8e0;--destructive:#e0736a;--warning:#e6b04f;--success:#9cc48a;--info:#9db8e0;color-scheme:dark}
html{--mr-bg:var(--background,#fbfaf6);--mr-fg:var(--foreground,#1d1c19);--mr-mut:var(--muted-foreground,#6f6b62);--mr-line:var(--border,#e4e0d6);--mr-card:var(--card,#f4f1ea);
  --mr-acc:var(--primary,#2f5d9b);--mr-risk:var(--destructive,#b8432f);--mr-q:var(--warning,#9a6510);--mr-ok:var(--success,#3d7a4a);
  --mr-add:color-mix(in srgb,var(--mr-ok) 11%,transparent);--mr-del:color-mix(in srgb,var(--mr-risk) 10%,transparent);--mr-soft:color-mix(in srgb,var(--mr-fg) 4%,transparent);
  --mr-code:"Berkeley Mono","BerkeleyMono","BerkeleyMono Nerd Font",ui-monospace,SFMono-Regular,Menlo,monospace;--mr-sans:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;
  --diffs-font-family:var(--mr-code);--diffs-font-size:13.5px;--diffs-line-height:22px;--diffs-bg:var(--mr-bg)}
*{box-sizing:border-box}
html[data-host=page],html[data-host=page] body{margin:0;background:var(--mr-bg)}
html[data-host=t3] body{margin:0}
body{color:var(--mr-fg);font:14.5px/1.6 var(--mr-sans);-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
code,.mono{font-family:var(--mr-code);font-size:.92em}
p code,li code,td code,.say code,.fd code,.rnote code{background:var(--mr-soft);border-radius:4px;padding:0 4px}
button{font:inherit;font-size:12.5px;color:inherit;background:none;border:1px solid var(--mr-line);border-radius:7px;padding:3px 10px;cursor:pointer;transition:border-color .15s,background .15s}
button:hover{border-color:color-mix(in srgb,var(--mr-fg) 30%,transparent)}
button.on{background:var(--mr-fg);border-color:var(--mr-fg);color:var(--mr-bg)}
button:disabled{opacity:.45;cursor:default}
.link{border:0;padding:0;color:var(--mr-mut);font-size:12.5px;border-radius:0}.link:hover{color:var(--mr-fg)}.link.on{background:none;color:var(--mr-acc);font-weight:600}
.mut{color:var(--mr-mut)}.small{font-size:12.5px}
kbd{font:11px var(--mr-code);border:1px solid var(--mr-line);border-bottom-width:2px;border-radius:4px;padding:0 4px}

/* layout */
.wrap{display:grid;grid-template-columns:232px minmax(0,1fr);gap:36px;max-width:1240px;margin:0 auto;padding:0 28px 120px}
html[data-host=t3] .wrap{display:block;padding:0 0 24px;max-width:none}
.rail{position:sticky;top:64px;align-self:start;overflow:hidden auto;scrollbar-width:thin;padding:20px 4px 12px 0;font-size:13px}
.top{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--mr-bg) 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--mr-line)}
.top>div{display:flex;gap:10px;align-items:center;max-width:1240px;margin:0 auto;padding:10px 28px}
.top .chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;min-width:0}.top .chips button{white-space:nowrap}
html[data-host=t3] .top{position:static;background:none;backdrop-filter:none;border:0}html[data-host=t3] .top>div{padding:0 0 12px;max-width:none}
.brand{font-weight:600;font-size:13.5px;margin-right:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;flex:0 1 auto}
.search{display:flex;align-items:center;gap:6px;border:1px solid var(--mr-line);border-radius:999px;padding:3px 6px 3px 12px;min-width:180px;flex:0 1 300px;background:var(--mr-bg)}
.search:focus-within{border-color:color-mix(in srgb,var(--mr-fg) 40%,transparent)}
.search input{border:0;outline:0;background:none;color:inherit;font:13px var(--mr-sans);flex:1;min-width:0}
.search .hits{font-size:11.5px;color:var(--mr-mut);white-space:nowrap}
.chips{display:flex;gap:4px;flex-wrap:wrap}.chips button{border-radius:999px;padding:2px 10px;font-size:12px}
.sp{flex:1}
.seg3{display:flex;border:1px solid var(--mr-line);border-radius:7px;padding:1px}.seg3 button{border:0;padding:1px 8px;font-size:12px;border-radius:5px}
main{min-width:0;padding-top:28px}html[data-host=t3] main{padding-top:0}

/* rail */
.rail .prog{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--mr-mut)}.rail .prog .bar{flex:1}
.rail .bar{height:3px;background:var(--mr-line);border-radius:2px}.rail .bar i{display:block;height:100%;background:var(--mr-fg);border-radius:2px;transition:width .3s}
.rail .secs{display:grid;grid-template-columns:1fr 1fr;gap:1px 10px;margin:12px 0 0}
.rail .secs a{font-size:12.5px;color:var(--mr-mut)}.rail .secs a:hover{color:var(--mr-fg)}.rail .secs a b{font:500 11px var(--mr-code);color:var(--mr-mut);opacity:.7}
.rail .grp{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mr-mut);margin:14px 0 2px;display:flex;gap:6px;cursor:default}
.rail details>summary{list-style:none;cursor:pointer}.rail details>summary::-webkit-details-marker{display:none}
.rail details>summary.grp::before{content:'▸';font-size:9px}.rail details[open]>summary.grp::before{content:'▾'}.rail details>summary.grp:hover{color:var(--mr-fg)}
.rail a{display:flex;gap:6px;align-items:baseline;padding:1.5px 6px;margin:0 -6px;border-radius:5px;cursor:pointer;line-height:1.45}.rail a:hover{background:var(--mr-soft)}
.rail .f{font-size:13px}
.rail a.cur{background:var(--mr-soft);font-weight:600}.rail a .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rail a.read .nm{color:var(--mr-mut)}
.rail a .dot{width:9px;flex:none;color:var(--mr-line);font-size:9px}.rail a.read .dot{color:var(--mr-ok)}
.rail .n-risk,.rail .n-q{font:600 10.5px var(--mr-code);min-width:15px;text-align:center;border-radius:4px;padding:0 3px}
.rail .keys{margin:14px 0 0;font-size:11.5px;color:var(--mr-mut)}.rail .keys summary{cursor:pointer}.rail .keys div{margin-top:4px;line-height:1.9}
.n-risk{color:var(--mr-risk);font-size:11.5px;font-weight:600}.n-q{color:var(--mr-q);font-size:11.5px;font-weight:600}

/* sections */
.hero h1{font-size:21px;line-height:1.3;margin:0 0 4px;font-weight:650;letter-spacing:-.01em;word-break:break-word}
.hero .meta{font-size:12.5px;color:var(--mr-mut)}
.lede{font-size:16px;line-height:1.6;margin:14px 0 14px;max-width:72ch}
.start{display:inline-flex;gap:8px;align-items:baseline;border:1px solid var(--mr-line);border-radius:999px;padding:4px 14px;font-size:13px;cursor:pointer}.start:hover{border-color:var(--mr-fg)}
section.sec{margin:40px 0 0}
.kick{display:flex;gap:10px;align-items:baseline;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--mr-mut);margin:0 0 12px;padding-bottom:6px;border-bottom:1px solid var(--mr-line)}
.kick b{color:var(--mr-fg);font-weight:600}.kick .sp{flex:1}.kick .r{letter-spacing:0;text-transform:none;font-size:12px}
.say{font-size:14.5px;margin:0 0 12px;max-width:76ch}

/* findings */
.fds{display:grid;gap:10px}
.fd{border:1px solid var(--mr-line);border-left:3px solid var(--mr-mut);border-radius:4px 10px 10px 4px;padding:12px 16px;background:var(--mr-bg)}
.fd.risk{border-left-color:var(--mr-risk)}.fd.question{border-left-color:var(--mr-q)}
.fd .hd{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.pill{font-size:10.5px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:1px 8px;white-space:nowrap}
.pill.risk,.pill.broken,.pill.fake{color:var(--mr-risk);background:color-mix(in srgb,var(--mr-risk) 12%,transparent)}
.pill.question,.pill.weak,.pill.unproven{color:var(--mr-q);background:color-mix(in srgb,var(--mr-q) 13%,transparent)}
.pill.note{color:var(--mr-mut);background:var(--mr-soft)}.pill.holds,.pill.real{color:var(--mr-ok);background:color-mix(in srgb,var(--mr-ok) 12%,transparent)}
.fd .ti{font-weight:600;font-size:14.5px;flex:1 1 300px}
.fd .loc{font:12px var(--mr-code);color:var(--mr-mut);cursor:pointer}.fd .loc:hover{color:var(--mr-fg)}
.fd .tx{margin:6px 0 0;font-size:14px;max-width:80ch}
.fd .acts{display:flex;gap:14px;margin-top:8px;align-items:center}
.fd .acts .st{font-size:12px;color:var(--mr-mut)}
.ann .fd{margin:6px 0 10px;font-family:var(--mr-sans);white-space:normal;max-width:900px}

/* tables */
table.grid{border-collapse:collapse;width:100%;font-size:13.5px}
table.grid th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mr-mut);font-weight:500;text-align:left;padding:4px 12px 8px 0;border-bottom:1px solid var(--mr-line)}
table.grid td{padding:9px 12px 9px 0;border-bottom:1px solid var(--mr-line);vertical-align:top}
table.grid tr:last-child td{border-bottom:0}
table.grid td.rule{font-weight:550;width:34%}table.grid td.st{white-space:nowrap;width:1%;text-align:right;padding-right:0}

/* markdown cards */
.md{font-size:14.5px;max-width:80ch}.md>*:first-child{margin-top:0}.md>*:last-child{margin-bottom:0}
.md h1,.md h2,.md h3,.md h4{font-size:14.5px;margin:16px 0 4px}.md p{margin:8px 0}.md ul,.md ol{margin:8px 0;padding-left:22px}.md li{margin:2px 0}
.md pre{font:13px/1.6 var(--mr-code);background:var(--mr-card);border-radius:8px;padding:10px 14px;overflow:auto}.md blockquote{margin:8px 0;padding-left:12px;border-left:3px solid var(--mr-line);color:var(--mr-mut)}
.md table{border-collapse:collapse;font-size:13.5px;margin:8px 0}.md th,.md td{border-bottom:1px solid var(--mr-line);padding:6px 14px 6px 0;text-align:left;vertical-align:top}.md th{font-weight:600}
.card{margin:0 0 18px}
/* stories under a chart: the verdict first, so a broken story is the first thing you see */
.verdict{display:flex;gap:10px;align-items:baseline;margin:0 0 10px;padding:9px 12px;border-radius:8px;font-size:13.5px;background:color-mix(in srgb,var(--mr-ok) 9%,transparent)}
.verdict .play{font-size:13px;color:var(--mr-risk);font-weight:600}.verdict .play:hover{text-decoration:underline}
.verdict.bad{background:color-mix(in srgb,var(--mr-risk) 10%,transparent)}.verdict b{white-space:nowrap}.verdict.bad b{color:var(--mr-risk)}.verdict:not(.bad) b{color:var(--mr-ok)}
.pill.works{color:var(--mr-ok);background:color-mix(in srgb,var(--mr-ok) 12%,transparent)}.pill.bug{color:var(--mr-risk);background:color-mix(in srgb,var(--mr-risk) 13%,transparent)}
.pill.fixed{color:var(--mr-acc);background:color-mix(in srgb,var(--mr-acc) 12%,transparent)}.pill.stops,.pill.unreached,.pill.before{color:var(--mr-mut);background:var(--mr-soft)}.card>h3{font-size:14.5px;margin:0 0 8px;font-weight:600}

/* tests */
.tiles{display:flex;gap:10px;margin:0 0 14px;flex-wrap:wrap}
.tile{border:1px solid var(--mr-line);border-radius:10px;padding:8px 16px;min-width:110px}.tile b{display:block;font-size:22px;line-height:1.2;font-weight:600}.tile span{font-size:12px;color:var(--mr-mut)}
.tile.weak b{color:var(--mr-q)}.tile.fake b{color:var(--mr-risk)}.tile.real b{color:var(--mr-ok)}
.tl{display:flex;gap:12px;align-items:baseline;padding:7px 0;border-bottom:1px solid var(--mr-line);font-size:13.5px}.tl:last-child{border-bottom:0}
.tl .nm{font:12.5px var(--mr-code)}.tl .why{color:var(--mr-mut)}
details>summary{cursor:pointer;list-style:none;color:var(--mr-mut);font-size:13px;padding:6px 0}details>summary::-webkit-details-marker{display:none}
details>summary::before{content:'▸ ';font-size:10px}details[open]>summary::before{content:'▾ '}

/* by function */
.ent{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:4px 12px;align-items:baseline;padding:4px 0;font-size:13.5px}
.ent .tag{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;font-weight:650;text-align:right}
.tag.added{color:var(--mr-ok)}.tag.deleted{color:var(--mr-risk)}.tag.changed{color:var(--mr-acc)}.tag.moved,.tag.renamed{color:var(--mr-q)}.tag.formatting{color:var(--mr-mut)}
.ent .go{font:12px var(--mr-code);color:var(--mr-mut);cursor:pointer;white-space:nowrap}.ent .go:hover{color:var(--mr-fg)}
.efile{font:12.5px var(--mr-code);color:var(--mr-mut);margin:12px 0 2px}.efile:first-child{margin-top:0}

/* calls */
#calls .vz{margin:0}
.callsay{border:1px solid var(--mr-line);border-radius:10px;padding:12px 16px;margin-top:12px;font-size:14px;min-height:46px}
.callsay .where{font:12px var(--mr-code);color:var(--mr-mut);margin:2px 0 0}
.callsay .acts{display:flex;gap:16px;margin-top:8px;flex-wrap:wrap}
.callsay pre{font:13px/1.6 var(--mr-code);background:var(--mr-card);border-radius:8px;padding:8px 12px;margin:10px 0 0;overflow:auto}
.tag{font-size:10px;letter-spacing:.06em;text-transform:uppercase;font-weight:650;margin-left:6px}.tag.ctx{color:var(--mr-mut)}
.callsay .def{margin-top:10px}.callsay .def summary{cursor:pointer;list-style:none;display:flex;gap:6px;align-items:baseline;flex-wrap:wrap}.callsay .def summary::-webkit-details-marker{display:none}.callsay .def pre{margin-top:6px}
.ent .cl{font-size:12.5px}.clist{margin:4px 0 2px}
.caller{display:grid;grid-template-columns:auto auto minmax(0,1fr);gap:8px;align-items:baseline;padding:2px 0 2px 12px;border-left:1px solid var(--mr-line);margin-left:3px}
.caller a{font-size:12px;cursor:pointer;color:var(--mr-acc);white-space:nowrap}.caller a.off{color:var(--mr-mut);cursor:default}.caller .tag{margin:0}.caller code{font:12px var(--mr-code);color:var(--mr-mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.callsay .kids{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;align-items:baseline}
.kid{font:12px var(--mr-code);border-radius:999px;padding:1px 9px}.kid.s-add{color:var(--mr-ok)}.kid.s-del{color:var(--mr-risk)}.kid.s-mod{color:var(--mr-acc)}
/* The ink drawing theme ships dark; on a light ground it becomes ink on paper. */
html[data-mode=light] .vz.vz-drawing{--vz-fg:#1d1c19;--vz-dim:#6f6b62;--vz-line:rgba(29,28,25,.14);--vz-wire:rgba(29,28,25,.32);--vz-amber:#9a6510;--vz-coral:#b8432f;--vz-green:#3d7a4a;--vz-blue:#2f5d9b}
html .vz.vz-drawing{--vz-bg:var(--mr-bg);background:transparent;padding:0}
#calls .vz-detail{display:none}
.vz-drawing .vz-tree{font-family:var(--mr-code);font-size:13px}

/* files and code */
.file{margin:44px 0 0;scroll-margin-top:72px}
.file.shut{margin-top:14px}.file.shut>:not(.fh){display:none}.file.shut .fh{border-bottom-color:var(--mr-line);opacity:.8}.file.shut+.file:not(.shut){margin-top:44px}
.fh{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;padding-bottom:8px;border-bottom:1px solid var(--mr-fg)}
.fh .fid{font:11.5px var(--mr-code);color:var(--mr-mut)}
.fh .path{font:13.5px var(--mr-code);word-break:break-all}.fh .path .dir{color:var(--mr-mut)}.fh .path b{font-weight:650}
.kind{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--mr-mut)}
.delta{font:12px var(--mr-code)}.delta .a{color:var(--mr-ok)}.delta .r{color:var(--mr-risk)}
.flow{font-size:12px;border-radius:999px;padding:0 9px}
.reason{margin:10px 0 0;font-size:14px;color:var(--mr-mut);max-width:80ch}
.range{margin:20px 0 0;scroll-margin-top:72px}
.rnote{display:flex;gap:12px;align-items:baseline;margin:0 0 8px;font-size:14px}
.rnote .tx{flex:1;max-width:80ch}.rnote .id{font:11.5px var(--mr-code);color:var(--mr-mut);white-space:nowrap;cursor:pointer}
.range.cur .rnote .tx{text-decoration:underline;text-decoration-color:var(--mr-line);text-underline-offset:4px}
.code{border:1px solid var(--mr-line);border-radius:10px;overflow:hidden;background:var(--mr-bg)}
.seg+.seg,.seg+.fold,.fold+.seg{border-top:1px solid var(--mr-line)}
table.rows{border-collapse:collapse;width:100%;table-layout:fixed;font:13.5px/22px var(--mr-code)}
table.rows td{padding:0;vertical-align:top}
table.rows td.n{width:46px;text-align:right;color:var(--mr-mut);opacity:.7;padding-right:8px;user-select:none;font-size:12px;position:relative}
table.rows td.m{width:18px;color:var(--mr-mut);user-select:none;text-align:center}
table.rows td.t{white-space:pre-wrap;word-break:break-word;padding-right:14px}
table.rows tr.add{background:var(--mr-add)}table.rows tr.add td.m{color:var(--mr-ok)}
table.rows tr.del{background:var(--mr-del)}table.rows tr.del td.m{color:var(--mr-risk)}
.gu{position:absolute;left:2px;top:3px;width:16px;height:16px;line-height:14px;padding:0;border-radius:4px;font-size:13px;opacity:0;border:0;background:var(--mr-fg);color:var(--mr-bg)}
tr:hover .gu,.gu:focus-visible{opacity:1}
tr.ann td{padding:0 14px 0 64px;font-family:var(--mr-sans)}
mark.hit{background:color-mix(in srgb,var(--mr-q) 32%,transparent);color:inherit;border-radius:2px}mark.hit.now{outline:2px solid var(--mr-q)}
.fold{display:block;width:100%;border:0;border-radius:0;text-align:left;padding:3px 0 3px 64px;font:12.5px var(--mr-code);color:var(--mr-mut);background:var(--mr-soft)}
.fold:hover{color:var(--mr-fg);background:color-mix(in srgb,var(--mr-fg) 7%,transparent)}
.pz{display:none}.seg.up .pz{display:block}.seg.up table.rows{display:none}
.cm{margin:6px 0 10px;border-left:2px solid var(--mr-acc);padding:2px 0 2px 12px;max-width:760px;font-family:var(--mr-sans)}
.cm .who{font-size:11.5px;color:var(--mr-mut)}
.cm textarea{display:block;width:100%;border:0;outline:0;resize:none;background:none;color:inherit;font:14px/1.5 var(--mr-sans);padding:2px 0;field-sizing:content;min-height:24px}
.later,.skim{font-size:13.5px}.later div,.skim div{padding:3px 0}
.order li{margin:4px 0;font-size:14px}
.empty{color:var(--mr-mut);font-size:14px;padding:20px 0}
.sheet{position:fixed;right:18px;bottom:18px;width:min(560px,calc(100% - 36px));background:var(--mr-bg);border:1px solid var(--mr-line);border-radius:12px;padding:12px;box-shadow:0 10px 40px rgba(0,0,0,.18);z-index:10}
html[data-host=t3] .sheet{position:static;width:auto;margin:16px 0 0;box-shadow:none}
.sheet textarea{width:100%;height:200px;background:var(--mr-card);color:inherit;border:0;border-radius:8px;padding:8px 10px;font:12.5px/1.5 var(--mr-code);resize:vertical}
.sheet .hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px}
.hidden{display:none!important}
@media (max-width:900px){.wrap{display:block;padding:0 16px 80px}.rail{display:none}.top>div{padding:10px 16px}}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${STYLE}</style>`);
document.body.insertAdjacentHTML('afterbegin', `<div class="top"><div id="top"></div></div>
<div class="wrap"><nav class="rail" id="rail"></nav><main id="main"></main></div>
<div class="sheet" id="sheet" hidden><div class="hd"><span id="sheet-msg"></span><button class="link" id="sheet-x">Close</button></div><textarea id="sheet-t" readonly></textarea></div>`);

const KEY = 'meat-review:' + D.key;
const S = Object.assign({read: {}, verdict: {}, reply: {}, mine: []}, JSON.parse(store.getItem(KEY) || '{}'));
const persist = () => store.setItem(KEY, JSON.stringify(S));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
// Inline markdown for notes and findings: `code` and **bold**, nothing else.
const mi = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const base = p => p.split('/').pop();
const SEV = {risk: 'Risk', question: 'Question', note: 'Note'};
const KINDS = [['core', 'Core'], ['supporting', 'Supporting'], ['config', 'Config'], ['docs', 'Docs'], ['tests', 'Tests']];
const byFile = {};
for (const f of D.findings) (byFile[f.file] ||= []).push(f);
const flowOf = {};
for (const n of Object.values(D.callmap || {})) if (n.st) flowOf[n.path] = (flowOf[n.path] || 0) + 1;
const view = {q: '', chip: 'all', open: {}};

// ---- segments: each run of shown rows is one segment, drawn as plain rows from git and upgraded to Pierre when it loads
const SEGS = {};
let segN = 0;
function seg(file, block) {
  const id = 's' + (++segN);
  SEGS[id] = {id, file, rows: block.rows, hunk: block.hunk};
  return `<div class="seg" id="${id}"><table class="rows">${rowsHtml(SEGS[id])}</table><div class="pz"></div></div>`;
}
const onRow = (r, side, line) => side === 'old' ? r.m !== '+' && r.o === line : r.m !== '-' && r.n === line;
// Findings and comments that sit on this segment's rows, in Pierre's annotation shape.
function anns(sg) {
  const out = [];
  for (const r of sg.rows) {
    for (const f of byFile[sg.file.path] || []) if (f._seg === sg.id && onRow(r, f.side || 'new', f.line)) out.push({r, side: f.side || 'new', line: f.line, meta: {f: f.id}});
    for (const c of S.mine) if (c.path === sg.file.path && onRow(r, c.side, c.line)) out.push({r, side: c.side, line: c.line, meta: {c: c.id}});
  }
  // One annotation per item even when a line shows on both sides.
  const seen = new Set();
  return out.filter(a => { const k = a.meta.f || a.meta.c; if (seen.has(k)) return false; seen.add(k); return true; });
}
function rowsHtml(sg) {
  const list = anns(sg);
  return sg.rows.map(r => {
    const cls = r.m === '+' ? 'add' : r.m === '-' ? 'del' : '';
    const ln = r.m === '-' ? r.o : r.n;
    let h = `<tr class="${cls}" data-s="${r.m === '-' ? 'old' : 'new'}" data-l="${ln}"><td class="n"><button class="gu" title="Comment on this line" tabindex="-1">+</button>${ln ?? ''}</td><td class="m">${r.m === ' ' ? '' : r.m}</td><td class="t">${hl(r.t)}</td></tr>`;
    for (const a of list) if (a.r === r) h += `<tr class="ann"><td colspan="3">${annHtml(a.meta)}</td></tr>`;
    return h;
  }).join('');
}
const annHtml = m => m.f ? findingHtml(D.findings.find(x => x.id === m.f), true) : commentHtml(S.mine.find(c => String(c.id) === String(m.c)));
function annEl(m) { const d = document.createElement('div'); d.className = 'ann'; d.innerHTML = annHtml(m); return d; }
function refreshSeg(id) {
  const sg = SEGS[id], el = document.getElementById(id);
  if (!sg || !el) return;
  $('table.rows', el).innerHTML = rowsHtml(sg);
  window.mrRefresh?.(sg);
  if (view.q) mark(el);
}

// ---- pieces
function findingHtml(f, inline) {
  const v = S.verdict[f.id], r = S.reply[f.id];
  const title = f.title || f.text.split(/(?<=[.!?])\s/)[0];
  const body = f.title ? f.text : f.text.slice(title.length).trim();
  return `<div class="fd ${esc(f.severity)}" data-f="${esc(f.id)}"><div class="hd"><span class="pill ${esc(f.severity)}">${SEV[f.severity] || 'Note'}</span><span class="ti">${mi(title)}</span>
    ${inline ? '' : `<a class="loc" data-line="${esc(f.file)}|${f.side || 'new'}|${f.line}">${esc(base(f.file))}:${f.line}</a>`}</div>
    ${body ? `<div class="tx">${mi(body)}</div>` : ''}
    <div class="acts"><button class="link ${v === 'agree' ? 'on' : ''}" data-v="agree">Agree</button><button class="link ${v === 'disagree' ? 'on' : ''}" data-v="disagree">Disagree</button><button class="link" data-v="reply">Reply</button>${f.area ? `<span class="st">${esc(f.area)}</span>` : ''}</div>
    ${r != null ? `<div class="cm" data-reply="${esc(f.id)}"><textarea placeholder="Your reply. Leave empty to discard." rows="1">${esc(r)}</textarea></div>` : ''}</div>`;
}
function commentHtml(c) {
  return `<div class="cm" data-c="${c.id}"><div class="who">You, on ${esc(base(c.path))}:${c.line}${c.side === 'old' ? ' (old)' : ''}</div><textarea placeholder="Comment on ${esc(base(c.path))}:${c.line}. Leave empty to discard." rows="1">${esc(c.text)}</textarea></div>`;
}
function pathHtml(p) { const i = p.lastIndexOf('/'); return `<span class="dir">${esc(p.slice(0, i + 1))}</span><b>${esc(p.slice(i + 1))}</b>`; }

function fileHtml(file) {
  // A finding goes into the first shown segment that holds its line; a fold holding one starts open.
  const fx = byFile[file.path] || [];
  const ranges = file.ranges.map(g => {
    const parts = g.blocks.map((b, i) => {
      const has = fx.some(f => b.rows.some(r => onRow(r, f.side || 'new', f.line)));
      if (b.hidden && !has) return `<button class="fold" data-fold="${g.id}:${i}">${esc(b.label)}</button>`;
      const h = seg(file, b), id = 's' + segN;
      for (const f of fx) if (!f._seg && b.rows.some(r => onRow(r, f.side || 'new', f.line))) f._seg = id;
      return h;
    });
    return `<div class="range" id="${g.id}" data-label="${esc(g.label)}"><div class="rnote"><span class="tx">${mi(g.note || '')}</span><a class="id" data-copy="${esc(g.label)}" title="Refer to this range by its id">${esc(g.label)} · ${g.start}–${g.end}${g.side === 'old' ? ' old' : ''}</a></div><div class="code">${parts.join('')}</div></div>`;
  }).join('');
  const loose = fx.filter(f => !f._seg);
  const flow = flowOf[file.path];
  // Test files without findings start as a header only; the reader opens them when they want the proof.
  const shut = file.kind === 'tests' && !fx.length && !view.open[file.id];
  return `<section class="file${shut ? ' shut' : ''}" id="${file.id}" data-path="${esc(file.path)}" data-kind="${esc(file.kind)}"><div class="fh"><span class="fid">${file.id}</span><span class="path">${pathHtml(file.path)}</span>
    <span class="kind">${esc(file.kind)}</span><span class="delta"><span class="a">+${file.added}</span> <span class="r">−${file.removed}</span></span>
    ${flow && D.calls ? `<button class="flow" data-flow="${esc(base(file.path))}" title="Show this file's changed calls">${flow} call change${flow === 1 ? '' : 's'}</button>` : ''}
    <span class="sp"></span>${file.kind === 'tests' ? `<button class="link" data-shut="${file.id}">${shut ? `Show ${file.ranges.length} range${file.ranges.length === 1 ? '' : 's'}` : 'Hide'}</button>` : ''}<button class="link" data-done="${file.id}">${S.read[file.id] ? '✓ Read' : 'Mark read'}</button></div>
    ${file.reason ? `<div class="reason">${mi(file.reason)}</div>` : ''}${loose.length ? `<div class="fds" style="margin-top:12px">${loose.map(f => findingHtml(f)).join('')}</div>` : ''}${ranges}</section>`;
}

function unshut(id, close = false) {
  const el = document.getElementById(id), file = D.files.find(f => f.id === id);
  if (!el || !file || el.classList.contains('shut') === close) return;
  view.open[id] = !close; el.classList.toggle('shut', close);
  const b = $('[data-shut]', el); if (b) b.textContent = close ? `Show ${file.ranges.length} range${file.ranges.length === 1 ? '' : 's'}` : 'Hide';
}
function kick(title, right = '') { return `<div class="kick"><b>${title}</b><span class="sp"></span><span class="r">${right}</span></div>`; }

function mainHtml() {
  const first = D.files[0];
  let h = `<div class="hero">${T3 ? '' : `<h1>${esc(D.title)}</h1>`}<div class="meta">${esc(D.label)} · ${esc(D.manifest)}</div>
    <p class="lede">${mi(D.summary)}</p>${first ? `<a class="start" data-go="${first.id}">Start with <b class="mono">${esc(base(first.path))}</b>${first.reason ? `<span class="mut">${mi(first.reason.split(/(?<=[.!?])\s/)[0])}</span>` : ''} →</a>` : ''}</div>`;
  if (D.findings.length) {
    const n = s => D.findings.filter(f => f.severity === s).length;
    h += `<section class="sec" id="findings">${kick('Findings', [n('risk') && `${n('risk')} risk${n('risk') > 1 ? 's' : ''}`, n('question') && `${n('question')} question${n('question') > 1 ? 's' : ''}`, n('note') && `${n('note')} note${n('note') > 1 ? 's' : ''}`].filter(Boolean).join(' · '))}<div class="fds">${D.findings.map(f => findingHtml(f)).join('')}</div></section>`;
  }
  if (D.outline.length) h += `<section class="sec" id="outline">${kick('How it works')}${D.outline.map((c, i) => `<div class="card">${c.title ? `<h3>${esc(c.title)}</h3>` : ''}${
    c.kind === 'markdown' ? `<div class="md">${c.html || ''}</div>` : `<div class="vizcard" data-i="${i}"></div>`}</div>`).join('')}</section>`;
  if (D.invariants.length) {
    const broken = D.invariants.filter(x => x.status !== 'holds').length;
    h += `<section class="sec" id="invariants">${kick('What must stay true', broken ? `${broken} not held` : 'all held')}<table class="grid"><tr><th>Must stay true</th><th>Held by</th><th>Evidence</th><th></th></tr>${D.invariants.map(x =>
      `<tr><td class="rule">${mi(x.rule)}</td><td>${mi(x.held_by || '')}</td><td class="mut">${mi(x.evidence || '')}</td><td class="st"><span class="pill ${esc(x.status)}">${esc(x.status)}</span></td></tr>`).join('')}</table></section>`;
  }
  if (D.tests.length) {
    const n = v => D.tests.filter(t => t.verdict === v);
    const line = t => `<div class="tl"><span class="pill ${esc(t.verdict)}">${esc(t.verdict)}</span><span><a class="nm" data-line="${esc(t.file)}|new|${t.line}">${esc(t.name)}</a><br>${mi(t.proves || '')}${t.why ? ` <span class="why">${mi(t.why)}</span>` : ''}</span></div>`;
    const bad = [...n('fake'), ...n('weak')];
    h += `<section class="sec" id="tests">${kick('Tests', `${D.tests.length} cases`)}<div class="tiles">${['real', 'weak', 'fake'].map(v => `<div class="tile ${v}"><b>${n(v).length}</b><span>${v}</span></div>`).join('')}</div>
      ${bad.map(line).join('')}${n('real').length ? `<details${bad.length ? '' : ' open'}><summary>${n('real').length} real tests</summary>${n('real').map(line).join('')}</details>` : ''}</section>`;
  }
  if (D.entities?.length) {
    const test = p => /(^|\/)tests?\/|test_[^/]*$|_test\.py$/.test(p);
    let entN = 0;
    const group = list => { let out = '', last = ''; for (const e of list) { if (e.file !== last) { out += `<div class="efile">${esc(e.file)}</div>`; last = e.file; }
      const cl = callersHtml(e.callers, ++entN);
      out += `<div class="ent"><span class="tag ${e.change}">${{added: 'new', deleted: 'gone', changed: 'changed', moved: 'moved', renamed: 'renamed', formatting: 'layout'}[e.change]}</span><span class="es">${mi(e.say)}${e.finding ? ` <span class="n-risk">· has a finding</span>` : ''}${cl[0]}${cl[1]}</span>${
        e.range ? `<a class="go" data-go="${e.range}">read ${e.range.replace('-', '.')} →</a>` : `<a class="go" data-line="${esc(e.file)}|${e.side}|${e.line}">line ${e.line}</a>`}</div>`; } return out; };
    const src = D.entities.filter(e => !test(e.file)), tst = D.entities.filter(e => test(e.file));
    const count = c => D.entities.filter(e => e.change === c).length;
    h += `<section class="sec" id="entities">${kick('What changed, by function', [['added', 'new'], ['changed', 'changed'], ['deleted', 'gone'], ['moved', 'moved'], ['renamed', 'renamed']].map(([c, w]) => count(c) && `${count(c)} ${w}`).filter(Boolean).join(' · '))}
      ${group(src)}${tst.length ? `<details${src.length ? '' : ' open'}><summary>${tst.length} in tests</summary>${group(tst)}</details>` : ''}</section>`;
  }
  if (D.calls) h += `<section class="sec" id="callsec">${kick('Call changes', 'click a call to see what it does')}${D.callsum ? `<p class="say">${mi(D.callsum)}</p>` : ''}<div id="calls"></div>
    <div class="callsay" id="callsay"><span class="mut">Pick a call. Changed calls say what changed and link to the code that shows it.</span></div></section>`;
  if (T3 && D.files.length) h += `<section class="sec" id="order">${kick('Reading order')}<ol class="order">${D.files.map(f => `<li><a data-go="${f.id}"><b class="mono">${esc(base(f.path))}</b></a> <span class="mut">${mi(f.reason || '')}</span></li>`).join('')}</ol></section>`;
  h += `<div id="files">${D.files.map(fileHtml).join('')}</div><div class="empty hidden" id="none">Nothing matches. Clear the search or pick another filter.</div>`;
  if (D.later?.length) h += `<section class="sec">${kick('Not shown here', `${D.later.length} ranges`)}<div class="later">${D.later.map(l => `<div><span class="mono">${esc(l.label)}</span> <span class="mono mut">${esc(base(l.path))}:${l.start}–${l.end}</span> ${mi(l.note || '')}</div>`).join('')}
    <p class="mut small">Ask for one by id (“show ${esc(D.later[0].label)}”)${D.full ? `, or open the full page: <span class="mono">${esc(D.full)}</span>` : ''}.</p></div></section>`;
  if (D.skimmed.length || D.uncovered.length) h += `<section class="sec">${kick('Not worth reading', `${D.skimmed.length + D.uncovered.length} files`)}<details><summary>Show them</summary><div class="skim">${
    D.skimmed.map(s => `<div><span class="mono">${esc(s.path)}</span> <span class="kind">${esc(s.kind)}</span> <span class="mut">${mi(s.reason || '')}</span></div>`).join('')}${
    D.uncovered.map(p => `<div><span class="mono">${esc(p)}</span> <span class="mut">not covered by the reading</span></div>`).join('')}</div></details></section>`;
  return h;
}

function topHtml() {
  const kinds = KINDS.filter(([k]) => D.files.some(f => f.kind === k));
  const chips = [['all', 'All'], ['findings', 'With findings'], ['unread', 'Unread'], ...(kinds.length > 1 ? kinds : [])];
  const pick = document.documentElement.dataset.pick;
  return `${T3 ? '' : `<span class="brand" title="${esc(D.title)}">${esc(D.title)}</span>`}
    <label class="search"><input id="q" type="search" placeholder="Search code, notes, files" autocomplete="off" value="${esc(view.q)}"><span class="hits" id="hits"></span>${T3 ? '' : '<kbd>/</kbd>'}</label>
    <div class="chips">${chips.map(([k, w]) => `<button data-chip="${k}" class="${view.chip === k ? 'on' : ''}">${w}</button>`).join('')}</div><span class="sp"></span>
    ${T3 ? '' : `<div class="seg3">${['auto', 'light', 'dark'].map(t => `<button data-theme="${t}" class="${pick === t ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>`}
    <button id="copy" style="white-space:nowrap">Copy feedback<span id="nfb"></span></button>`;
}

// Keep both ends of a long name: the start says what it is, the end which variant.
const squeeze = (t, n) => t.length <= n ? t : t.slice(0, n - 12) + '…' + t.slice(-11);
function railHtml() {
  if (T3) return '';
  const read = D.files.filter(f => S.read[f.id]).length, cur = document.body.dataset.cur;
  let h = `<div class="prog"><span>${read}/${D.files.length} read</span><div class="bar"><i style="width:${D.files.length ? 100 * read / D.files.length : 100}%"></i></div></div>`;
  const secs = [['findings', 'Findings', D.findings.length], ['outline', 'How it works', D.outline.length], ['invariants', 'Must hold', D.invariants.length], ['tests', 'Tests', D.tests.length], ['entities', 'Functions', D.entities?.length], ['callsec', 'Calls', D.calls && 1]];
  h += `<div class="secs">${secs.filter(s => s[2]).map(([id, w, n]) => `<a data-go="${id}">${w}${id === 'outline' || id === 'callsec' ? '' : `<b>${n}</b>`}</a>`).join('')}</div>`;
  for (const [k, w] of KINDS) {
    const fs = D.files.filter(f => f.kind === k);
    if (!fs.length) continue;
    const rows = fs.map(f => {
      const fx = byFile[f.path] || [], risk = fx.filter(x => x.severity === 'risk').length, q = fx.length - risk;
      return `<a class="f ${S.read[f.id] ? 'read' : ''} ${cur === f.id ? 'cur' : ''}" data-go="${f.id}" title="${esc(f.path)}"><span class="dot">${S.read[f.id] ? '✓' : '●'}</span><span class="nm">${esc(squeeze(base(f.path), fx.length > 1 ? 24 : 27))}</span>${risk ? `<span class="n-risk">${risk}</span>` : ''}${q ? `<span class="n-q">${q}</span>` : ''}</a>`;
    }).join('');
    // Test files start folded unless one has a finding or is where you are.
    const fold = k === 'tests' && !(view.railTests ?? fs.some(f => byFile[f.path]?.length || cur === f.id));
    h += k === 'tests' ? `<details class="rt"${fold ? '' : ' open'}><summary class="grp">${w} · ${fs.length}</summary>${rows}</details>` : `<div class="grp">${w}</div>${rows}`;
  }
  return h + `<details class="keys"><summary>Keyboard</summary><div><kbd>/</kbd> search <kbd>j</kbd><kbd>k</kbd> range <kbd>]</kbd><kbd>[</kbd> file<br><kbd>o</kbd> folds <kbd>m</kbd> read <kbd>c</kbd> copy</div></details>`;
}
const rail = () => { $('#rail').innerHTML = railHtml(); };

// ---- search and filter
const words = s => s.toLowerCase();
function fileText(file) { return file._text ??= words([file.path, file.reason, ...file.ranges.flatMap(g => [g.note, ...g.blocks.flatMap(b => b.rows.map(r => r.t))])].join('\n')); }
function hl(t) {
  if (!view.q) return esc(t);
  const q = view.q, lo = t.toLowerCase();
  let out = '', i = 0, j;
  while ((j = lo.indexOf(q, i)) >= 0) { out += esc(t.slice(i, j)) + `<mark class="hit">${esc(t.slice(j, j + q.length))}</mark>`; i = j + q.length; }
  return out + esc(t.slice(i));
}
function mark(el) { const sg = SEGS[el.id]; if (sg) $('table.rows', el).innerHTML = rowsHtml(sg); }
function applyFilter() {
  const q = view.q;
  let shown = 0;
  for (const file of D.files) {
    const el = document.getElementById(file.id);
    if (!el) continue;
    const chip = view.chip;
    let ok = chip === 'all' || (chip === 'findings' && (byFile[file.path] || []).length) || (chip === 'unread' && !S.read[file.id]) || file.kind === chip;
    if (ok && q) ok = fileText(file).includes(q);
    el.classList.toggle('hidden', !ok);
    if (!ok) continue;
    shown++;
    if (q && file.kind === 'tests') unshut(file.id);
    // Within a matching file, keep only the ranges that match, unless only the path or reason matched.
    const hitRanges = file.ranges.filter(g => !q || words([g.note, ...g.blocks.flatMap(b => b.rows.map(r => r.t))].join('\n')).includes(q));
    for (const g of file.ranges) $(`#${g.id}`)?.classList.toggle('hidden', q && hitRanges.length > 0 && !hitRanges.includes(g));
    if (q) for (const g of hitRanges) g.blocks.forEach((b, i) => { if (b.hidden && words(b.rows.map(r => r.t).join('\n')).includes(q)) openFold(`${g.id}:${i}`); });
  }
  $$('.seg').forEach(mark);
  $('#none').classList.toggle('hidden', shown > 0);
  window.mrMark?.(q);
  const n = hits().length;
  $('#hits').textContent = q ? `${n} match${n === 1 ? '' : 'es'}` : '';
  hitAt = -1;
}
// Matches in plain rows are <mark>s; matches inside Pierre are Ranges. Walk both in page order.
const shownMark = m => !m.closest('.hidden') && !m.closest('.seg.up');
function hits() {
  const all = [...$$('mark.hit').filter(shownMark), ...(window.mrRanges?.() || [])];
  const top = h => h.getBoundingClientRect().top;
  return all.sort((a, b) => top(a) - top(b));
}
let hitAt = -1;
function nextHit(d) {
  const all = hits();
  if (!all.length) return;
  $$('mark.hit.now').forEach(m => m.classList.remove('now'));
  hitAt = (hitAt + d + all.length) % all.length;
  const h = all[hitAt];
  if (h.classList) h.classList.add('now'); else window.mrNow?.(h);
  const r = h.getBoundingClientRect();
  scrollBy({top: r.top - innerHeight / 2, behavior: 'smooth'});
}

// ---- folds, comments, verdicts
function openFold(key) {
  const btn = $(`[data-fold="${CSS.escape(key)}"]`);
  if (!btn) return;
  const [gid, i] = key.split(':');
  const file = D.files.find(f => f.ranges.some(g => g.id === gid));
  const b = file.ranges.find(g => g.id === gid).blocks[+i];
  btn.insertAdjacentHTML('afterend', seg(file, b));
  const el = btn.nextElementSibling;
  btn.remove();
  window.mrWatch?.(el);
}
function addComment(path, side, line) {
  let c = S.mine.find(x => x.path === path && x.side === side && x.line === line);
  if (!c) { c = {id: Date.now(), path, side, line, text: ''}; S.mine.push(c); persist(); }
  const file = D.files.find(f => f.path === path);
  for (const id in SEGS) if (SEGS[id].file === file && SEGS[id].rows.some(r => onRow(r, side, line))) { refreshSeg(id); break; }
  focusBox(`.cm[data-c="${c.id}"] textarea`);
}
// Pierre redraws annotations a frame later, so the box may not exist yet.
function focusBox(sel, tries = 6) {
  const el = $$(sel).find(x => x.offsetParent);
  if (el) { el.focus(); grow(el); return; }
  if (tries) setTimeout(() => focusBox(sel, tries - 1), 60);
}
function grow(t) { if (!CSS.supports('field-sizing', 'content')) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; } }
function dropComment(id) {
  const c = S.mine.find(x => String(x.id) === String(id));
  if (!c) return;
  S.mine = S.mine.filter(x => x !== c); persist();
  for (const sid in SEGS) if (SEGS[sid].file.path === c.path && SEGS[sid].rows.some(r => onRow(r, c.side, c.line))) refreshSeg(sid);
  counts();
}
function refreshFinding(id) {
  const f = D.findings.find(x => x.id === id);
  $$(`.fd[data-f="${CSS.escape(id)}"]`).forEach(el => { el.outerHTML = findingHtml(f, !!el.closest('.ann')); });
  counts();
}
function feedback() {
  const out = [];
  for (const f of D.findings) {
    const v = S.verdict[f.id], r = (S.reply[f.id] || '').trim();
    if (v || r) out.push(`- ${f.id} (${f.file}:${f.line}): ${v || 'reply'}${r ? ': ' + r : ''}`);
  }
  for (const c of S.mine) if (c.text.trim()) out.push(`- ${c.path}:${c.line}${c.side === 'old' ? ' (old)' : ''}: ${c.text.trim()}`);
  const unread = D.files.filter(f => !S.read[f.id]).map(f => f.id);
  return out.length ? `Feedback on the reading of ${D.title}:\n${out.join('\n')}${unread.length ? `\n(not read yet: ${unread.join(', ')})` : ''}` : '';
}
function counts() { const n = feedback().split('\n').filter(l => l.startsWith('- ')).length; $('#nfb').textContent = n ? ` (${n})` : ''; $('#copy').disabled = !n; }
// T3's frame blocks the Clipboard API, so the feedback also opens selected in a box where ⌘C works.
function copy() {
  const t = feedback(); if (!t) return;
  const box = $('#sheet-t'), msg = $('#sheet-msg');
  box.value = t; $('#sheet').hidden = false; box.focus(); box.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch {}
  msg.textContent = ok ? 'Copied. Paste it to the agent.' : 'Press ⌘C, then paste it to the agent.';
  if (!ok) navigator.clipboard?.writeText(t).then(() => { msg.textContent = 'Copied. Paste it to the agent.'; }, () => {});
}
function setRead(id, on) {
  S.read[id] = on; persist(); rail();
  const b = $(`[data-done="${id}"]`); if (b) b.textContent = on ? '✓ Read' : 'Mark read';
  if (view.chip === 'unread') applyFilter();
}

// ---- calls: a plain sentence for the picked call, its code from git, and the changed calls it makes
const ST = {'+': 's-add', '-': 's-del', '~': 's-mod'};
function dedent(lines) { const pad = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length)); return lines.map(l => l.slice(pad)); }
// The definition of the called function, read from git even when it is outside the diff.
function defHtml(n) {
  const d = n.def && D.defs?.[n.def];
  if (!d || (d.path === n.path && d.line === n.line && n.code?.length)) return '';
  const inFile = D.files.find(f => f.path === d.path), rg = inFile?.ranges.find(g => g.side !== 'old' && g.start <= d.line && d.line <= g.end);
  const where = `${esc(d.path)}:${d.line}`, state = d.changed ? 'changed in this diff' : 'not in this diff';
  return `<details class="def" open><summary><span class="mut small">Defined in</span> <span class="mono small">${where}</span> <span class="tag ${d.changed ? 'changed' : 'ctx'}">${state}</span>${rg ? ` <a class="link" data-go="${rg.id}">read ${rg.id.replace('-', '.')} →</a>` : ''}</summary>
    <pre>${esc(dedent(d.code).join('\n'))}${d.more ? `\n<span class="mut">… ${d.more} more line${d.more === 1 ? '' : 's'}</span>` : ''}</pre></details>`;
}
// Callers sit inline after the sentence; the list opens under it. Too common a name says nothing, so it shows nothing.
function callersHtml(c, id) {
  if (!c || c.total == null) return ['', ''];
  if (!c.total) return [` <span class="mut small">· no callers</span>`, ''];
  const nw = c.list.filter(x => x.new).length, w = `${c.total} caller${c.total === 1 ? '' : 's'}${nw ? `, ${nw} new` : ''}`;
  if (!c.list.length) return [` <span class="mut small">· ${w}</span>`, ''];
  const rows = c.list.map(x => { const f = D.files.find(f => f.path === x.path);
    return `<div class="caller"><a class="mono ${f ? '' : 'off'}" ${f ? `data-line="${esc(x.path)}|new|${x.line}"` : ''} title="${esc(x.path)}">${esc(base(x.path))}:${x.line}</a>${x.new ? '<span class="tag added">new</span>' : '<span></span>'}<code>${esc(x.text)}</code></div>`; }).join('');
  const more = c.total - c.list.length;
  return [` <button class="link small cl" data-callers="${id}">· ${w} ▾</button>`, `<div class="clist hidden" id="cl-${id}">${rows}${more > 0 ? `<div class="mut small">and ${more} more</div>` : ''}</div>`];
}
function pickCall(key) {
  const n = D.callmap[key], box = $('#callsay');
  if (!n) { box.innerHTML = `<span class="mut">This call is unchanged and outside the reading.</span>`; return; }
  const kept = n.range && document.getElementById(n.range);
  const acts = [kept ? `<a class="link" data-go="${n.range}">Read it in ${n.range.replace('-', '.')} →</a>` : D.files.some(f => f.path === n.path) ? `<a class="link" data-go="${D.files.find(f => f.path === n.path).id}">Go to its file →</a>` : '',
    n.finding ? `<a class="link" data-gof="${esc(n.finding)}">See the finding →</a>` : ''].filter(Boolean);
  box.innerHTML = `<div>${mi(n.say)}</div><div class="where">${esc(n.path)}:${n.line}${n.side === 'old' ? ' (before the change)' : ''}</div>
    ${n.code?.length ? `<pre>${esc(dedent(n.code).join('\n'))}</pre>` : ''}${defHtml(n)}${acts.length ? `<div class="acts">${acts.join('')}</div>` : ''}
    ${n.kids.length ? `<div class="kids"><span class="mut small">Changed calls it makes:</span>${n.kids.map(k => `<button class="kid ${ST[k.st] || ''}" data-kid="${esc(k.label + '@' + k.ref)}">${esc(k.st || '·')} ${esc(k.label.replace(/\(.*$/, '()').split('.').pop())}</button>`).join('')}</div>` : ''}`;
}
const nodeKey = row => `${$('.vz-lab', row)?.textContent}@${$('.vz-ref', row)?.title}`;
function selectCall(key) {
  const find = () => $$('#calls .vz-node').find(r => nodeKey(r) === key);
  let row = find();
  // A collapsed parent hides the row: open the selected one and look again.
  if (!row) { $('#calls .vz-node.sel .vz-car')?.click(); row = find(); }
  if (row) { row.click(); find()?.scrollIntoView({block: 'nearest', behavior: 'smooth'}); }
  else pickCall(key);
}

// ---- events
const go = id => document.getElementById(id)?.scrollIntoView({behavior: 'smooth', block: 'start'});
function goLine(path, side, line) {
  const file = D.files.find(f => f.path === path);
  if (!file) return;
  const el = document.getElementById(file.id);
  el.classList.remove('hidden'); unshut(file.id);
  const seg = Object.values(SEGS).find(s => s.file === file && s.rows.some(r => onRow(r, side, line)));
  if (!seg) {
    for (const g of file.ranges) g.blocks.forEach((b, i) => { if (b.hidden && b.rows.some(r => onRow(r, side, line))) openFold(`${g.id}:${i}`); });
  }
  const target = $$(`#${file.id} tr[data-l="${line}"][data-s="${side}"]`)[0] || $(`#${file.id} .seg`) || el;
  (target.closest('.seg')?.classList.contains('up') ? target.closest('.seg') : target).scrollIntoView({behavior: 'smooth', block: 'center'});
}
document.addEventListener('click', e => {
  const t = e.target, at = s => t.closest(s);
  let el;
  if ((el = at('[data-theme]'))) return theme(el.dataset.theme);
  if ((el = at('[data-chip]'))) { view.chip = el.dataset.chip; $$('[data-chip]').forEach(b => b.classList.toggle('on', b === el)); return applyFilter(); }
  if ((el = at('[data-go]'))) { e.preventDefault(); return go(el.dataset.go); }
  if ((el = at('[data-gof]'))) { return $(`#findings .fd[data-f="${CSS.escape(el.dataset.gof)}"]`)?.scrollIntoView({behavior: 'smooth', block: 'center'}); }
  if ((el = at('[data-line]'))) { const [p, s, l] = el.dataset.line.split('|'); return goLine(p, s, +l); }
  if ((el = at('[data-fold]'))) return openFold(el.dataset.fold);
  if ((el = at('[data-play]'))) { const want = el.dataset.play.toLowerCase(); return [...el.closest('.vizcard').querySelectorAll('button')].find(b => b !== el && b.textContent.trim().toLowerCase().endsWith(want))?.click(); }
  if ((el = at('[data-callers]'))) { const l = $('#cl-' + el.dataset.callers); l.classList.toggle('hidden'); el.textContent = el.textContent.replace(/[▾▴]$/, l.classList.contains('hidden') ? '▾' : '▴'); return; }
  if ((el = at('[data-shut]'))) return unshut(el.dataset.shut, !$('#' + el.dataset.shut).classList.contains('shut'));
  if ((el = at('[data-done]'))) return setRead(el.dataset.done, !S.read[el.dataset.done]);
  if ((el = at('[data-flow]'))) { const inp = $('#calls .vz-bar input'); if (inp) { inp.value = el.dataset.flow; inp.dispatchEvent(new Event('input')); } return go('callsec'); }
  if ((el = at('[data-kid]'))) return selectCall(el.dataset.kid);
  if ((el = at('[data-copy]'))) { navigator.clipboard?.writeText(el.dataset.copy).catch(() => {}); return; }
  if ((el = at('.gu'))) { const tr = el.closest('tr'); return addComment(el.closest('.file').dataset.path, tr.dataset.s, +tr.dataset.l); }
  if ((el = at('.fd [data-v]'))) {
    const id = el.closest('.fd').dataset.f, v = el.dataset.v;
    if (v === 'reply') { if (S.reply[id] == null) S.reply[id] = ''; refreshFinding(id); return focusBox(`.fd[data-f="${CSS.escape(id)}"] .cm textarea`); }
    S.verdict[id] = S.verdict[id] === v ? undefined : v; persist(); return refreshFinding(id);
  }
  if (t.id === 'copy' || t.closest('#copy')) return copy();
  if (t.id === 'sheet-x') $('#sheet').hidden = true;
});
// The call tree is drawn by viz; listen on its rows rather than changing it.
$('#rail').addEventListener('toggle', e => { if (e.target.matches?.('details.rt')) view.railTests = e.target.open; }, true);
document.addEventListener('click', e => { const row = e.target.closest('#calls .vz-node'); if (row) setTimeout(() => pickCall(nodeKey(row)), 0); }, true);
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q') { view.q = t.value.trim().toLowerCase(); clearTimeout(t._d); t._d = setTimeout(applyFilter, 120); return; }
  const cm = t.closest('.cm');
  if (!cm) return;
  grow(t);
  if (cm.dataset.c) { const c = S.mine.find(x => String(x.id) === cm.dataset.c); if (c) c.text = t.value; }
  if (cm.dataset.reply) S.reply[cm.dataset.reply] = t.value;
  persist(); counts();
});
// A box left empty goes away.
document.addEventListener('focusout', e => {
  const cm = e.target.closest?.('.cm');
  if (!cm || e.target.value.trim()) return;
  setTimeout(() => {
    if (cm.contains(document.activeElement)) return;
    if (cm.dataset.c) dropComment(cm.dataset.c);
    if (cm.dataset.reply) { delete S.reply[cm.dataset.reply]; persist(); refreshFinding(cm.dataset.reply); }
  }, 0);
});
function current(sel) { const els = $$(sel).filter(x => !x.closest('.hidden')); let best = els[0]; for (const el of els) if (el.getBoundingClientRect().top < 120) best = el; return best; }
document.addEventListener('keydown', e => {
  const t = e.target;
  if (t.id === 'q') {
    if (e.key === 'Enter') { e.preventDefault(); nextHit(e.shiftKey ? -1 : 1); }
    if (e.key === 'Escape') { t.value = ''; view.q = ''; applyFilter(); t.blur(); }
    return;
  }
  if (t.tagName === 'TEXTAREA') { if (e.key === 'Escape') { if (!t.value.trim()) t.value = ''; t.blur(); } return; }
  if (e.key === 'Escape' && !$('#sheet').hidden) { $('#sheet').hidden = true; return; }
  if (t.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
  const step = (sel, d) => { const els = $$(sel).filter(x => !x.closest('.hidden')), i = els.indexOf(current(sel)); els[Math.max(0, Math.min(els.length - 1, i + d))]?.scrollIntoView({behavior: 'smooth', block: 'start'}); };
  if (e.key === '/') $('#q').focus();
  else if (e.key === 'j') step('.range', 1); else if (e.key === 'k') step('.range', -1);
  else if (e.key === ']') step('.file', 1); else if (e.key === '[') step('.file', -1);
  else if (e.key === 'o') { const r = current('.range'); if (r) $$('[data-fold]', r).forEach(b => openFold(b.dataset.fold)); }
  else if (e.key === 'm') { const f = current('.file'); if (f) setRead(f.id, !S.read[f.id]); }
  else if (e.key === 'c') copy();
  else return;
  e.preventDefault();
});

// ---- theme: the page owns it; in T3 it follows the host's background
function lum(color) {
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = '#808080'; c.fillStyle = color; c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return 0.3 * r + 0.59 * g + 0.11 * b;
}
function mode() {
  if (!T3) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
  const dark = bg ? lum(bg) < 128 : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.mode = dark ? 'dark' : 'light';
}
function theme(pick) {
  store.setItem('meat-review:theme', pick);
  const html = document.documentElement;
  html.dataset.pick = pick;
  html.dataset.mode = pick === 'dark' || (pick === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  $$('[data-theme]').forEach(b => b.classList.toggle('on', b.dataset.theme === pick));
  window.mrRetheme?.();
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (T3) mode(); else if ((html => html.dataset.pick)(document.documentElement) === 'auto') theme('auto'); window.mrRetheme?.(); });

// ---- draw
mode();
document.title = 'Reading · ' + D.title;
$('#top').innerHTML = topHtml();
$('#main').innerHTML = mainHtml();
rail(); counts();
// Read the named paths of a chart (tlc_chart's marks: ! fails, + only after the fix, - before only, ? leaf
// never reached) and say each story's verdict in a table the graph lights up from (data-viz-id).
function stories(body) {
  const label = {}, fails = {}, out = [];
  let last = null;
  for (const ln of body.split('\n')) {
    const m = ln.match(/^([!+-]?)([\w.-]+):\s*(.*)$/), f = ln.match(/^\s+fails:\s*(.+)$/);
    if (f && last) { fails[last] = f[1].trim(); continue; }
    if (!m || /^(view|tone|group|theme|layout|meter)$/.test(m[2])) { if (!/^\s/.test(ln)) last = null; continue; }
    const [, mark, id, rest] = m;
    if (!/\s>\s/.test(rest)) { label[id] = rest.replace(/\s*\{[^}]*\}\s*$/, '').replace(/\s*\[[^\]]*\]\s*$/, ''); last = id; continue; }
    last = null;
    const end = rest.match(/\s(=>|=\|)\s*([\w.-]+\??)\s*$/), hops = (end ? rest.slice(0, end.index) : rest).split('>').map(x => x.trim()).filter(Boolean);
    if (end) hops.push(end[2]);
    const leaf = hops[hops.length - 1], unreached = leaf.endsWith('?');
    out.push({name: id, mark, hops: hops.map(h => h.replace(/\?$/, '')), stop: end?.[1] === '=|', unreached});
  }
  for (const st of out) {
    st.v = st.mark === '!' ? 'bug' : st.unreached ? 'unreached' : st.mark === '+' ? 'fixed' : st.mark === '-' ? 'before' : st.stop ? 'stops' : 'works';
    st.broke = st.hops.find(h => fails[h]); st.rule = st.broke ? fails[st.broke] : '';
    st.say = st.hops.map(h => `<span class="${h === st.broke ? 'x' : ''}">${esc(label[h] || h)}</span>`).join('<i>→</i>');
  }
  const rank = {bug: 0, unreached: 1, fixed: 2, works: 3, stops: 4, before: 5};
  return out.sort((a, b) => rank[a.v] - rank[b.v]);
}
const VERDICT = {bug: 'Bug', works: 'Works', fixed: 'Fixed', stops: 'Stops', unreached: 'Unreached', before: 'Before only'};
function storiesHtml(list) {
  if (!list.length) return [''];
  const bad = list.filter(x => x.v === 'bug' || x.v === 'unreached'), name = x => x.name.replace(/_/g, ' ');
  const head = bad.length
    ? `<div class="verdict bad"><b>✗ ${bad.length} of ${list.length} ${list.length === 1 ? 'story' : 'stories'} ${bad.length === 1 ? 'goes' : 'go'} wrong</b><span>${bad.map(x => `<button class="link mono play" data-play="${esc(x.name)}" title="Play this story on the chart">${esc(name(x))}</button> ${x.rule ? `breaks “${esc(x.rule)}”` : x.v === 'unreached' ? 'never reaches its end' : ''}`).join('; ')}</span><span class="sp"></span><span class="mut small">click a name to play it</span></div>`
    : `<div class="verdict"><b>✓ All ${list.length} stories end where they should</b></div>`;
  return [head];
}
$$('.vizcard').forEach(el => {
  const c = D.outline[+el.dataset.i], s = document.createElement('script');
  s.type = 'text/viz';
  s.textContent = (/^\s*theme\s/m.test(c.body) ? '' : 'theme drawing\n') + c.body;
  el.append(s);
  const [head] = storiesHtml(stories(c.body));
  el.insertAdjacentHTML('afterbegin', head);
});
if (D.calls) { const s = document.createElement('script'); s.type = 'text/viz'; s.textContent = 'theme drawing\n' + D.calls; $('#calls').append(s); }
if (!T3) {
  const fit = () => { $('#rail').style.maxHeight = (innerHeight - 76) + 'px'; };
  fit(); addEventListener('resize', fit);
  // Mark the file you are in, and count a file read once you scroll past its end.
  addEventListener('scroll', () => {
    const f = current('.file');
    if (f && document.body.dataset.cur !== f.id) { document.body.dataset.cur = f.id; rail(); }
    for (const sec of $$('.file')) if (!S.read[sec.id] && !sec.classList.contains('hidden') && sec.getBoundingClientRect().bottom < 0) setRead(sec.id, true);
  }, {passive: true});
}

(async () => {
// Pierre upgrades each shown segment once it is on screen: syntax highlighting and word-level diffs over the same rows
// from git. If the import fails (offline, blocked), the plain rows stay and the page works the same.
let P;
try { P = window.MR_PIERRE || await import(PIERRE); } catch (err) { console.warn('meat-review: diff renderer unavailable, showing plain rows', err?.message || err); }
if (P) {
  const dark = () => document.documentElement.dataset.mode === 'dark';
  const SIDE = {old: 'deletions', new: 'additions'};
  const live = new Map();
  const css = `::highlight(mr-hit){background:color-mix(in srgb,#e6b04f 40%,transparent)}::highlight(mr-now){background:#e6b04f;color:#000}`;
  const patch = sg => {
    const [os, oc, ns, nc] = sg.hunk, p = sg.file.path;
    return `--- a/${p}\n+++ b/${p}\n@@ -${os},${oc} +${ns},${nc} @@\n` + sg.rows.map(r => (r.m === ' ' ? ' ' : r.m) + r.t).join('\n') + '\n';
  };
  const annList = sg => anns(sg).map(a => ({side: SIDE[a.side], lineNumber: a.line, metadata: a.meta}));
  function upgrade(el) {
    const sg = SEGS[el.id];
    if (!sg || live.has(el.id)) return;
    try {
      const fileDiff = P.parsePatchFiles(patch(sg))[0].files[0];
      if (P.langOf) fileDiff.lang = P.langOf(sg.file.path);
      const box = el.querySelector('.pz');
      const view = new P.FileDiff({
        theme: {dark: 'pierre-dark', light: 'pierre-light'}, themeType: dark() ? 'dark' : 'light',
        diffStyle: 'unified', disableFileHeader: true, overflow: 'wrap', hunkSeparators: 'simple', lineDiffType: 'word-alt', unsafeCSS: css,
        enableGutterUtility: true,
        onGutterUtilityClick: range => addComment(sg.file.path, range.side === 'deletions' ? 'old' : 'new', range.start),
        renderAnnotation: a => annEl(a.metadata),
      });
      view.render({fileDiff, containerWrapper: box, lineAnnotations: annList(sg)});
      live.set(el.id, {view, fileDiff, box});
      el.classList.add('up');
      if (window.mrQ) mark1(el.id, window.mrQ);
    } catch (err) { console.warn('meat-review: kept plain rows for', sg.file.path, err?.message || err); }
  }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); upgrade(e.target); } }), {rootMargin: '600px 0px'});
  window.mrWatch = el => io.observe(el);
  document.querySelectorAll('.seg').forEach(el => io.observe(el));
  window.mrRefresh = sg => { const v = live.get(sg.id); if (!v) return; v.view.setLineAnnotations(annList(sg)); v.view.rerender(); if (window.mrQ) setTimeout(() => window.mrMark(window.mrQ), 50); };
  window.mrRetheme = () => { for (const [id, v] of live) { v.view.setThemeType?.(dark() ? 'dark' : 'light'); } };
  // Search inside Pierre's shadow DOM: the CSS Custom Highlight API marks matches without touching its nodes.
  let ranges = [];
  function mark1(id, q) {
    const v = live.get(id), root = v?.box.querySelector('diffs-container')?.shadowRoot || v?.box.firstElementChild?.shadowRoot;
    if (!root || document.getElementById(id).closest('.hidden')) return;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode());) {
      if (n.parentElement.closest('[data-line-annotation],[data-gutter],[data-column-number]')) continue;
      const lo = n.data.toLowerCase();
      for (let i = lo.indexOf(q); i >= 0; i = lo.indexOf(q, i + q.length)) { const r = new Range(); r.setStart(n, i); r.setEnd(n, i + q.length); ranges.push(r); }
    }
  }
  window.mrMark = q => {
    window.mrQ = q; ranges = [];
    if (q && window.CSS?.highlights) for (const id of live.keys()) mark1(id, q);
    if (window.CSS?.highlights) { if (ranges.length) CSS.highlights.set('mr-hit', new Highlight(...ranges)); else CSS.highlights.delete('mr-hit'); }
  };
  window.mrRanges = () => ranges;
  window.mrNow = r => { if (CSS.highlights) CSS.highlights.set('mr-now', new Highlight(r)); };
}
})();
