/* viz.js: renders compact `text/viz` blocks as interactive graphs (flow, ranked columns, sequence, states, stack),
   coverage strips, call trees and call diffs. Grammar: ../references/grammar.md. The page holds only data; this file is loaded from the CDN or inlined by scripts/viz.py. */
(() => {
  const CSS = `
.vz{--vz-fg:var(--foreground,#e9e6e1);--vz-dim:var(--muted-foreground,#8a857e);--vz-line:var(--border,rgba(255,255,255,.13));
--vz-amber:var(--warning,#e6b04f);--vz-coral:var(--destructive,#e0736a);--vz-green:var(--success,#9cc48a);--vz-blue:var(--info,#7aa2d6);
--vz-card:var(--card,rgba(255,255,255,.03));--vz-bg:var(--vz-ground,#0a0a0a);--vz-r:var(--radius,6px);--vz-out:cubic-bezier(.23,1,.32,1);
color:var(--vz-fg);font:12.5px/1.45 var(--font-mono,"IBM Plex Mono","Berkeley Mono",ui-monospace,SFMono-Regular,Menlo,monospace)}
.vz *{box-sizing:border-box}
.vz.vz-solo{background:#0a0a0a;padding:16px;border-radius:8px}.vz.vz-solo.vz-lt{background:#fff;box-shadow:inset 0 0 0 1px rgba(17,24,39,.08)}
.vz.vz-lt:not(.vz-drawing):not(.vz-paper){--vz-fg:#1d2026;--vz-dim:#6b7280;--vz-line:rgba(17,24,39,.12);--vz-amber:#b45309;--vz-coral:#c93a32;--vz-green:#1f8a4c;--vz-blue:#2f5fd0;--vz-card:rgba(17,24,39,.025)}
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
transition:opacity 160ms var(--vz-out),border-color 160ms var(--vz-out),box-shadow 160ms var(--vz-out),scale 200ms var(--vz-out)}
.vz-box .vz-bs{color:var(--vz-dim);font-size:11px;line-height:15px}.vz-mk{font-weight:600}
.vz-box.s-add{border-color:var(--vz-green)}.vz-box.s-del{border-color:var(--vz-coral);border-style:dashed}.vz-box.s-del .vz-bl{text-decoration:line-through}
.vz-box.s-mod{border-color:var(--vz-amber)}.vz-box.s-fail{border-color:var(--vz-coral)}.vz-box.s-active{border-color:var(--vz-amber);border-style:dashed}.vz-box.s-unk{border-style:dashed}
.vz-box.s-add,.vz-box.s-del,.vz-box.s-mod,.vz-box.s-fail,.vz-box.s-active,.vz-box.s-unk{color:var(--vz-fg)}
.vz-box.s-add .vz-mk{color:var(--vz-green)}.vz-box.s-del .vz-mk,.vz-box.s-fail .vz-mk{color:var(--vz-coral)}.vz-box.s-mod .vz-mk,.vz-box.s-active .vz-mk{color:var(--vz-amber)}.vz-box.s-unk .vz-mk{color:var(--vz-dim)}
.vz-box.done{box-shadow:0 0 0 1px var(--vz-green)}.vz-box.now{box-shadow:0 0 0 2px var(--vz-amber)}.vz-box.nowfail{box-shadow:0 0 0 2px var(--vz-coral)}
.vz-pill{position:absolute;transform:translateX(-50%);height:20px;line-height:18px;padding:0 8px 0 2px;font-size:11px;white-space:nowrap;cursor:pointer;
border:1px solid var(--vz-line);border-radius:10px;background:linear-gradient(var(--vz-card),var(--vz-card)),var(--vz-bg);transition:opacity 160ms var(--vz-out),border-color 160ms var(--vz-out)}
.vz-pill.multi{height:auto;line-height:14px;padding:2px 8px 3px 2px;border-radius:8px;text-align:center}.vz-pill.multi>span:last-child{display:inline-block;vertical-align:middle}.vz-pill.s-add{color:var(--vz-green)}.vz-pill.s-del{color:var(--vz-coral);text-decoration:line-through}.vz-pill.hot{border-color:var(--vz-amber)}
.vz-num{display:inline-block;min-width:16px;height:16px;padding:0 3px;margin-right:5px;border-radius:8px;background:var(--vz-amber);color:var(--vz-bg);text-align:center;line-height:16px;font-size:10px;font-weight:700;vertical-align:1px;text-decoration:none}
.vz-pill .vz-num:last-child{margin-right:-6px}
.vz-dimmed .vz-box:not(.hot),.vz-dimmed .vz-pill:not(.hot){opacity:.35}
.vz-legend{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px;color:var(--vz-dim);font-size:11px}.vz-legend .vz-hint{margin-left:auto}
.vz-hint{color:var(--vz-dim)}.vz-payload{color:var(--vz-amber);border:1px solid var(--vz-amber);border-radius:10px;padding:0 7px;font-size:11px}
.vz-stories{margin-top:6px}.vz-story.vz-link{padding:1px 0;text-decoration:none;border:0;cursor:pointer}.vz-story:hover b{text-decoration:underline}.vz-cap{color:var(--vz-dim);font-size:11px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px}
.vz-hop{margin-right:14px;white-space:nowrap;display:inline-block}.vz-where{margin-top:4px;line-height:1.9}.vz-link .vz-num{text-decoration:none}
.vz-lab{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:10ch;flex:0 1 auto}
.vz-ref{color:var(--vz-dim);margin-left:auto;white-space:nowrap;font-size:11px;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1000 auto}
.s-add{color:var(--vz-green)}.s-del{color:var(--vz-coral)}.s-mod{color:var(--vz-amber)}
.s-fail{color:var(--vz-coral)}.s-active{color:var(--vz-amber)}.s-unk{color:var(--vz-dim)}.s-ok{color:var(--vz-green)}
.vz-insp{margin-top:8px;border-top:1px solid var(--vz-line);padding-top:8px;height:var(--vz-ih,150px);overflow:auto}
.vz-insp dl{display:grid;grid-template-columns:max-content 1fr;gap:2px 10px;margin:0}.vz-insp dt{color:var(--vz-dim)}.vz-insp dd{margin:0}
.vz-insp code,.vz-detail code{cursor:copy;color:var(--vz-blue)}
.vz-link{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px}
.vz-narr{min-height:2.9em;margin:0 0 8px;color:var(--vz-fg);display:flex;gap:8px;align-items:baseline}.vz-st{flex:none;width:1.2ch;text-align:center}
.vz-spin{display:inline-block;width:9px;height:9px;border:1.5px solid var(--vz-amber);border-right-color:transparent;border-radius:50%;animation:vz-spin .7s linear infinite}
@keyframes vz-spin{to{rotate:360deg}}
.vz-shim{background:linear-gradient(100deg,var(--vz-fg) 38%,color-mix(in srgb,var(--vz-fg) 35%,transparent) 50%,var(--vz-fg) 62%) 0 0/300% 100% no-repeat;-webkit-background-clip:text;background-clip:text;color:transparent;animation:vz-shim 1.5s linear infinite}
@keyframes vz-shim{from{background-position:100% 0}to{background-position:0 0}}
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
.vz-group{position:absolute;border:1px solid color-mix(in srgb,var(--vz-fg) 16%,transparent);border-radius:calc(var(--vz-r) + 2px);background:color-mix(in srgb,var(--vz-fg) 3%,transparent);transition:border-color 160ms var(--vz-out)}
.vz-group>span{display:block;height:26px;line-height:26px;text-align:left;border-bottom:1px solid color-mix(in srgb,var(--vz-fg) 10%,transparent);color:var(--vz-fg);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 10px;font-weight:600;cursor:pointer}
.vz-group.r>span{text-align:right}
.vz-group>span>b{position:relative;z-index:1;font-weight:inherit;padding:0 4px;margin:0 -4px;background:linear-gradient(color-mix(in srgb,var(--vz-fg) 3%,transparent),color-mix(in srgb,var(--vz-fg) 3%,transparent)),linear-gradient(var(--vz-card),var(--vz-card)),var(--vz-bg)}
.vz-group.hot{border-color:var(--vz-amber)}
.vz-box.t-1,.vz-sw.t-1{--vz-t:var(--chart-1,#5fb3a3)}.vz-box.t-2,.vz-sw.t-2{--vz-t:var(--chart-2,#7aa2d6)}.vz-box.t-3,.vz-sw.t-3{--vz-t:var(--chart-3,#b08ee0)}
.vz-box.t-4,.vz-sw.t-4{--vz-t:var(--chart-4,#e6b04f)}.vz-box.t-5,.vz-sw.t-5{--vz-t:var(--chart-5,#d98e6a)}.vz-box.t-6,.vz-sw.t-6{--vz-t:var(--chart-6,#9cc48a)}
.vz-box[class*=" t-"]{background:linear-gradient(color-mix(in srgb,var(--vz-t) 24%,transparent),color-mix(in srgb,var(--vz-t) 24%,transparent)),var(--vz-bg);border-color:color-mix(in srgb,var(--vz-t) 60%,transparent)}
.vz-box.s-fail{background:linear-gradient(color-mix(in srgb,var(--vz-coral) 14%,transparent),color-mix(in srgb,var(--vz-coral) 14%,transparent)),var(--vz-bg);border-color:var(--vz-coral);border-width:1.5px}
.vz-box.k-start{width:14px;height:14px;min-height:14px!important;padding:0;border:none;border-radius:50%;background:var(--vz-dim)}
.vz-sw{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px;background:color-mix(in srgb,var(--vz-t) 45%,transparent);border:1px solid var(--vz-t)}
.vz-sw.s-fail{background:color-mix(in srgb,var(--vz-coral) 20%,transparent);border-color:var(--vz-coral)}
.vz-before .s-add,.vz-after .s-del{opacity:.1!important;pointer-events:none}.vz-before .vz-box.s-add,.vz-after .vz-box.s-del{scale:.96}
.vz-flow .vz-box.ghost,.vz-flow .vz-pill.ghost{opacity:.13;border-style:dashed;box-shadow:none}.vz-flow path.ghost{opacity:.1}.vz-building.vz-dimmed .vz-box:not(.hot):not(.ghost),.vz-building.vz-dimmed .vz-pill:not(.hot):not(.ghost){opacity:.65}
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
.vz-box .vz-bx{color:var(--vz-amber);font-size:11px;line-height:15px;min-height:15px;overflow:hidden;text-overflow:ellipsis}
.vz-meter{display:flex;align-items:center;gap:10px;margin:8px 0 18px;font-size:11px;color:var(--vz-dim)}
.vz-mtrack{position:relative;flex:1 1 auto;height:22px;display:flex;border:1px solid var(--vz-line);border-radius:var(--vz-r)}
.vz-mband{height:100%;border-right:1px solid var(--vz-line);display:flex;align-items:center;justify-content:center;white-space:nowrap;overflow:hidden;font-size:10.5px;transition:background-color 220ms var(--vz-out),color 220ms var(--vz-out)}
.vz-mband:last-of-type{border-right:0}.vz-mband.on{background:color-mix(in srgb,var(--vz-amber) 18%,transparent);color:var(--vz-fg)}
.vz-mtick{position:absolute;top:100%;margin-top:2px;transform:translateX(-50%);font-size:10px}
.vz-mmark{position:absolute;top:-6px;bottom:-6px;width:2px;margin-left:-1px;background:var(--vz-amber);opacity:0;transition:left 800ms var(--vz-out),opacity 300ms}
.vz-mnote{flex:0 0 22ch;color:var(--vz-fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vz.vz-drawing{--vz-fg:#e7e3d7;--vz-dim:#8e8a7f;--vz-line:rgba(231,227,215,.18);--vz-wire:rgba(231,227,215,.34);--vz-amber:#e6b04f;--vz-coral:#e0736a;--vz-green:#9cc48a;--vz-blue:#c9c3b3;
--vz-card:transparent;--vz-bg:#0c0c0b;--vz-r:0px;--vz-letter:"Routed Gothic Narrow","Routed Gothic","Avenir Next Condensed","Arial Narrow","Helvetica Neue",sans-serif;
--vz-type:"Letter Gothic","Courier Prime","IBM Plex Mono",ui-monospace,monospace;background:#0c0c0b;color:var(--vz-fg);padding:16px;border-radius:6px;font:12.5px/1.45 var(--vz-type)}
.vz-drawing .vz-head{justify-content:space-between;border-bottom:1px solid var(--vz-fg);padding-bottom:6px}
.vz-drawing .vz-title{font:400 14px var(--vz-letter);letter-spacing:.16em;text-transform:uppercase}.vz-drawing .vz-sub{font-size:11px}
.vz-drawing .vz-panel{border:0;background:none;padding:8px 0 0}
.vz-drawing button{border-radius:0;background:none;border-color:var(--vz-line);color:var(--vz-fg)}
.vz-drawing button[aria-pressed=true],.vz-drawing button[aria-selected=true]{background:var(--vz-fg);border-color:var(--vz-fg);color:var(--vz-bg)}
.vz-drawing .vz-tabs button,.vz-drawing .vz-schip{font:10.5px var(--vz-letter);letter-spacing:.12em;text-transform:uppercase;padding:3px 7px}
.vz-drawing button:focus-visible,.vz-drawing [tabindex]:focus-visible{outline-color:var(--vz-fg)}
.vz-schips{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:2px 0 10px}.vz-cg{display:contents}
.vz-cg>i{font:normal 10px var(--vz-letter);letter-spacing:.18em;text-transform:uppercase;color:var(--vz-dim);margin:0 2px 0 10px}.vz-cg:first-child>i{margin-left:0}
.vz .vz-schip{color:var(--vz-dim)}.vz .vz-schip.on{background:var(--vz-fg);border-color:var(--vz-fg);color:var(--vz-bg)}
.vz-o{margin-right:5px}.vz-o.err{color:var(--vz-coral)}.vz-o.filt{color:var(--vz-amber)}.vz-schip.on .vz-o{color:inherit}
.vz-drawing .vz-colhead{font:11px var(--vz-letter);letter-spacing:.22em;color:var(--vz-dim)}
.vz-drawing .vz-lane,.vz-drawing .vz-group{border-radius:0;background:none;border-color:var(--vz-line)}
.vz-drawing .vz-box{border:.9px solid var(--vz-fg);border-radius:0;background:var(--vz-bg);
transition:opacity 300ms var(--vz-out),background-color 220ms var(--vz-out),color 220ms var(--vz-out),box-shadow 220ms var(--vz-out),scale 200ms var(--vz-out)}
.vz-drawing .vz-box .vz-bl{font:13px/17px var(--vz-letter);letter-spacing:.05em;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis}
.vz-drawing .vz-box .vz-bs,.vz-drawing .vz-box .vz-bn{font:10px/15px var(--vz-type);letter-spacing:.04em;text-transform:uppercase;color:var(--vz-dim)}
.vz-drawing .vz-box .vz-bx{font:11px/15px var(--vz-type);color:var(--vz-fg)}
.vz-drawing .vz-box.hot,.vz-drawing .vz-box.done{box-shadow:inset 0 0 0 .9px var(--vz-fg)}
.vz-drawing .vz-box.now{background:var(--vz-fg);color:var(--vz-bg);box-shadow:none}
.vz-drawing .vz-box.now .vz-bs,.vz-drawing .vz-box.now .vz-bn,.vz-drawing .vz-box.now .vz-bx,.vz-drawing .vz-box.now .vz-mk,.vz-drawing .vz-box.nowfail *{color:var(--vz-bg)!important}
.vz-drawing .vz-box.nowfail{background:var(--vz-coral);border-color:var(--vz-coral);color:var(--vz-bg);box-shadow:none}
.vz-drawing .vz-box.e-reach{border-color:var(--vz-fg)}
.vz-drawing .vz-box.e-dropped{border:.9px dashed var(--vz-amber);color:var(--vz-fg)}.vz-drawing .vz-box.e-dropped.now{background:var(--vz-amber);border-style:solid}
.vz-drawing .vz-box.s-add{box-shadow:inset 3px 0 0 var(--vz-green)}.vz-drawing .vz-box.s-add.hot,.vz-drawing .vz-box.s-add.done{box-shadow:inset 3px 0 0 var(--vz-green),inset 0 0 0 .9px var(--vz-fg)}
.vz-drawing .vz-box.s-del{border:.9px dashed var(--vz-coral);color:var(--vz-coral);opacity:.6}.vz-drawing .vz-box.s-del .vz-bs{color:var(--vz-coral)}
.vz-drawing .vz-box.s-fail{background:var(--vz-bg);border:.9px solid var(--vz-coral)}.vz-drawing .vz-box.s-mod{border-color:var(--vz-amber)}
.vz-drawing .vz-box.s-active{border:.9px dashed var(--vz-fg)}.vz-drawing .vz-box.s-active .vz-mk{color:var(--vz-fg)}
.vz-drawing.vz-dimmed .vz-box:not(.hot),.vz-drawing .vz-dimmed .vz-box:not(.hot),.vz-drawing .vz-dimmed .vz-pill:not(.hot){opacity:.2}
.vz-drawing .vz-building.vz-dimmed .vz-box:not(.hot):not(.ghost){opacity:.5}
.vz-drawing .vz-pill{border-radius:0;font-family:var(--vz-type);background:var(--vz-bg)}.vz-drawing .vz-pill.hot{border-color:var(--vz-fg)}
.vz-drawing .vz-num{border-radius:50%;background:var(--vz-bg);color:var(--vz-fg);box-shadow:inset 0 0 0 .9px var(--vz-fg);font-weight:400}
.vz-hopm circle{fill:var(--vz-bg);stroke:var(--vz-fg);stroke-width:.9}.vz-hopm text{font:9px var(--vz-type);fill:var(--vz-fg);text-anchor:middle;dominant-baseline:central}
.vz-pkl{font:10px var(--vz-type);fill:var(--vz-fg);paint-order:stroke;stroke:var(--vz-bg);stroke-width:3px}
.vz-drawing .vz-narr{font:13px/1.55 var(--vz-type);min-height:4.7em;margin:6px 0;border-top:1px solid var(--vz-line);padding-top:8px}
.vz-drawing .vz-st{width:auto}.vz-drawing .vz-st:empty{display:none}
.vz-verdict{display:inline-block;background:var(--vz-fg);color:var(--vz-bg);font:400 12px var(--vz-letter);letter-spacing:.14em;text-transform:uppercase;padding:2px 8px;white-space:nowrap}
.vz-verdict.filt{background:none;color:var(--vz-amber);border:1px dashed var(--vz-amber)}.vz-verdict.err{background:var(--vz-coral)}
.vz-drawing .vz-payload{color:var(--vz-fg);border:1px solid var(--vz-line);border-radius:0;font-size:11px}
.vz-drawing .vz-spin{border-color:var(--vz-fg);border-right-color:transparent}
.vz-drawing .vz-bar input[type=range]{accent-color:var(--vz-fg)}.vz-drawing .vz-bar input[type=search]{border-radius:0}
.vz-drawing .vz-legend{font:10.5px var(--vz-letter);letter-spacing:.12em;text-transform:uppercase}
.vz-drawing .vz-insp{border:1px solid var(--vz-fg);padding:8px 10px}.vz-drawing .vz-insp dt{color:var(--vz-dim);font:10.5px/1.8 var(--vz-letter);letter-spacing:.14em;text-transform:uppercase}
.vz-drawing .vz-insp .s-add{color:var(--vz-fg)}.vz-drawing .vz-insp .s-unk{color:var(--vz-amber)}
.vz-drawing .vz-cap{font-family:var(--vz-letter);letter-spacing:.14em}
.vz-drawing .vz-mtrack{border-color:var(--vz-fg)}.vz-drawing .vz-mband{border-color:var(--vz-line);font:10px var(--vz-letter);letter-spacing:.14em;text-transform:uppercase}
.vz-drawing .vz-mband.on{background:var(--vz-fg);color:var(--vz-bg)}.vz-drawing .vz-mmark{background:var(--vz-fg);box-shadow:0 0 0 2px var(--vz-bg)}
.vz-drawing .vz-mt{font:10.5px var(--vz-letter);letter-spacing:.16em;text-transform:uppercase}
.vz{--vz-hl:var(--vz-amber);--vz-hlfg:var(--vz-bg);--vz-cw:color-mix(in srgb,var(--vz-fg) 38%,transparent);--vz-cg:color-mix(in srgb,var(--vz-fg) 9%,transparent);--vz-cb:color-mix(in srgb,var(--vz-fg) 32%,transparent)}
.vz.vz-drawing{--vz-hl:var(--vz-fg);--vz-hlfg:var(--vz-bg);--vz-cb:var(--vz-fg)}
.vz.vz-paper,.vz.vz-paper.vz-solo{--vz-fg:#1d2026;--vz-dim:#6b7280;--vz-line:rgba(17,24,39,.1);--vz-amber:#b45309;--vz-coral:#d0423b;--vz-green:#1f8a4c;--vz-blue:#2f5fd0;
--vz-card:#fff;--vz-bg:#fff;--vz-r:6px;--vz-hl:#2f5fd0;--vz-hlfg:#fff;--vz-cw:rgba(17,24,39,.38);--vz-cg:rgba(17,24,39,.07);--vz-cb:rgba(17,24,39,.3);
--vz-sans:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--vz-fg);background:#f7f8fa;padding:18px;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(17,24,39,.06)}
.vz-paper .vz-title{font:600 16px/1.3 var(--vz-sans);letter-spacing:-.01em}.vz-paper .vz-sub{font-family:var(--vz-sans);font-size:12.5px}
.vz-paper .vz-panel{background:#fff;border-color:rgba(17,24,39,.08);box-shadow:0 1px 2px rgba(17,24,39,.04)}
.vz-paper button{border-color:rgba(17,24,39,.14);color:var(--vz-fg);background:#fff}
.vz-paper button[aria-pressed=true],.vz-paper button[aria-selected=true]{background:#1d2026;border-color:#1d2026;color:#fff}
.vz-paper .vz-box{background:#fff;border:1px solid rgba(17,24,39,.16);box-shadow:0 1px 2px rgba(17,24,39,.06),0 2px 6px rgba(17,24,39,.04)}
.vz-paper .vz-box.now{border-color:var(--vz-hl);box-shadow:0 0 0 3px color-mix(in srgb,var(--vz-hl) 18%,transparent)}.vz-paper .vz-box.s-fail{border-color:var(--vz-coral);box-shadow:0 0 0 3px color-mix(in srgb,var(--vz-coral) 14%,transparent)}
.vz-paper .vz-pill{background:#fff;border-color:rgba(17,24,39,.14)}.vz-paper .vz-num{background:var(--vz-hl);color:#fff}
.vz-paper .vz-ro b,.vz-paper .vz-cname{font-family:var(--vz-sans)}.vz-paper .vz-ro b{color:var(--vz-hl)}
.vz-paper .vz-insp code,.vz-paper .vz-detail code{color:var(--vz-blue)}
.vz-paper .vz-bar input[type=range]{accent-color:var(--vz-hl)}
.vz-ctop{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 14px;margin:0 0 6px}
.vz-cname{font-weight:600}.vz-ro{margin-left:auto;text-align:right;display:flex;flex-wrap:wrap;gap:2px 10px;justify-content:flex-end;align-items:baseline}
.vz-ro b{font-size:15px;font-weight:600;font-variant-numeric:tabular-nums}.vz-ro span{color:var(--vz-dim)}
.vz-cx{overflow-x:auto}.vz-cx>svg{display:block;width:100%;height:auto;min-width:520px;overflow:visible}
.vz-cx svg text{font-size:11px;fill:var(--vz-fg)}
.vz-ln{stroke:var(--vz-fg);fill:none}.vz-wr{stroke:var(--vz-cw);stroke-width:1.3;fill:none}.vz-gd{stroke:var(--vz-cg);fill:none}
.vz-cx svg .vz-td{fill:var(--vz-dim)}.vz-cx svg .vz-small{font-size:9.5px}.vz-cx svg .vz-big{font-size:12px;font-weight:600}
.vz-cx svg .vz-tc{fill:var(--vz-dim);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.vz-cx svg .vz-cap2{font-size:10px;letter-spacing:.1em;text-transform:uppercase}
.vz-bx{fill:var(--vz-bg);stroke:var(--vz-cb);stroke-width:1}.vz-bx.on{stroke-width:2;stroke:var(--vz-hl)}
.vz-cx svg .vz-bd{fill:var(--vz-dim);font-size:10px}
.vz-cx svg .vz-sl{paint-order:stroke;stroke:var(--vz-bg);stroke-width:4px;stroke-linejoin:round}
.vz-hitc{fill:transparent;cursor:crosshair}
.vz-crow,.vz-cause{cursor:pointer;transition:opacity .15s}.vz-crow.dim{opacity:.28}.vz-cause:hover text,.vz-cause:focus text{text-decoration:underline}.vz-cause:focus{outline:none}
.vz-cx svg .vz-struck{text-decoration:line-through}
.vz-band{transition:opacity .15s;cursor:pointer}.vz-band.dim{opacity:.18}
.vz-kb{display:grid;gap:10px;min-width:520px}
.vz-col{border:1px solid var(--vz-line);border-radius:var(--vz-r);padding:8px;min-height:90px;background:var(--vz-card)}
.vz-col h4{display:flex;justify-content:space-between;gap:6px;margin:0 0 8px;font-size:10.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--vz-dim)}
.vz-col h4 .full{color:var(--vz-amber)}.vz-col h4 .over{color:var(--vz-coral);font-weight:700}
.vz-card{border:1px solid var(--vz-cb);border-radius:var(--vz-r);background:var(--vz-bg);padding:6px 8px;margin-bottom:6px;cursor:pointer;font-size:12px;line-height:1.35}
.vz-card small{display:block;color:var(--vz-dim);font-size:10.5px;margin-top:2px}
.vz-card .vz-pb{height:3px;margin-top:6px;background:var(--vz-line);border-radius:2px;overflow:hidden}.vz-card .vz-pb i{display:block;height:100%;background:var(--vz-hl)}
.vz-card.q-ok{border-color:var(--vz-green)}.vz-card.q-fail{border-color:var(--vz-coral);border-width:1.5px}.vz-card.q-fail small{color:var(--vz-coral)}
.vz-card.q-warn{border-color:var(--vz-amber)}.vz-card.q-unk{border-style:dashed;color:var(--vz-dim)}
.vz-card.sel,.vz-card:focus{outline:2px solid var(--vz-hl);outline-offset:1px}
.vz-detail .q-fail{color:var(--vz-coral)}.vz-detail .q-ok{color:var(--vz-green)}.vz-detail .q-warn{color:var(--vz-amber)}
.vz-spill{position:absolute;transform:translateX(-50%);height:18px;line-height:16px;padding:0 8px;border:1px solid var(--vz-line);border-radius:9px;background:var(--vz-bg);
color:var(--vz-dim);font-size:10.5px;white-space:nowrap;transition:opacity .2s,border-color .2s,color .2s;z-index:1}
.vz-life{stroke:color-mix(in srgb,var(--vz-fg) 26%,transparent);stroke-width:1.25}
.vz-sbar,.vz-sbar-key{background:color-mix(in srgb,var(--vz-fg) 14%,transparent);border-radius:3px}.vz-sbar{position:absolute;width:8px;transform:translateX(-50%);transition:opacity 160ms var(--vz-out)}
.vz-sbar-key{display:inline-block;width:8px;height:12px;margin-right:5px;vertical-align:-1px}.vz-flow .vz-sbar.ghost{opacity:.13}
.vz-sbar.q-warn,.vz-sbar-key.q-warn{background:color-mix(in srgb,var(--vz-amber) 55%,transparent)}.vz-sbar.q-ok,.vz-sbar-key.q-ok{background:color-mix(in srgb,var(--vz-green) 55%,transparent)}.vz-sbar.q-fail,.vz-sbar-key.q-fail{background:color-mix(in srgb,var(--vz-coral) 60%,transparent)}
.vz-spill.hot{color:var(--vz-fg);border-color:var(--vz-hl)}.vz-flow .vz-spill.ghost{opacity:.13}
.vz-spill.q-fail{color:var(--vz-coral);border-color:var(--vz-coral)}.vz-spill.q-ok{color:var(--vz-green)}.vz-spill.q-warn{color:var(--vz-amber)}
.vz-drawing .vz-col h4,.vz-drawing .vz-cname{font-family:var(--vz-letter);letter-spacing:.14em;text-transform:uppercase}
.vz-drawing .vz-col,.vz-drawing .vz-card,.vz-drawing .vz-spill{border-radius:0}.vz-drawing .vz-cx svg text{font-family:var(--vz-type)}
.vz-paper .vz-cx svg .vz-sl{stroke:#fff}.vz-drawing .vz-cx svg .vz-sl{stroke:#0c0c0b}
.vz-paper .vz-card{background:#fff;box-shadow:0 1px 2px rgba(17,24,39,.06)}.vz-paper .vz-col{background:#f3f4f6;border-color:rgba(17,24,39,.06)}
@media (prefers-reduced-motion:reduce){.vz *{transition:none!important;animation:none!important}}`;

  const STATUS = { '+': 'add', '-': 'del', '~': 'mod', '!': 'fail', '*': 'active', '?': 'unk' };
  const STATUS_TIP = { add: 'New in this change.', del: 'Removed by this change.', mod: 'Exists before and after, but behaves differently.', fail: 'Where it goes wrong.', active: 'Where things are right now.', unk: 'Not read in the code yet: treat as a guess.', ok: 'Already done.' };
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

  const VIEWS = ['flow', 'ranked', 'seq', 'states', 'stack', 'sankey'], THEMES = ['default', 'drawing', 'paper'];
  const CHARTS = ['timing', 'gantt', 'causes', 'board', 'stock', 'waits', 'hist', 'retries'];
  const ID = /^[\w.$-]+$/;
  function parse(text) {
    const doc = { title: '', sub: '', base: '', theme: '', sections: [], errors: [] };
    let sec = null, node = null, lastGraph = null, lastEdges = null, lastStep = null, lastPath = null;
    const lines = text.replace(/\t/g, '  ').split('\n');
    lines.forEach((raw, i) => {
      const n = i + 1;
      if (!raw.trim() || /^\s*\/\//.test(raw)) return;
      const head = raw.match(/^==\s*(graph|flow|tree|diff|steps|cover|timing|gantt|causes|board|stock|waits|hist|retries)\b\s*(.*)$/);
      if (head) {
        const [, kind, name] = head;
        lastStep = null;
        if (kind === 'steps' || kind === 'cover') {
          const target = kind === 'steps' && name ? doc.sections.find((s) => s.kind === 'graph' && s.name === name.trim()) : lastGraph;
          if (!target) { doc.errors.push(`line ${n}: ${kind} has no graph before it`); sec = null; return; }
          if (kind === 'cover') target.cover = { name: name.trim(), rows: [], columns: '', n };
          sec = { kind, graph: target }; return;
        }
        if (CHARTS.includes(kind)) { sec = { kind, name: name.trim() || kind, lines: [] }; doc.sections.push(sec); node = null; lastEdges = null; return; }
        sec = kind === 'graph' || kind === 'flow'
          ? { kind: 'graph', name: name.trim() || 'graph', nodes: [], edges: [], byId: {}, paths: [], steps: [], ranks: [], view: '', group: -1, groups: [], tones: [], box: '' }
          : { kind: 'tree', diff: kind === 'diff', name: name.trim() || kind, lines: [] };
        doc.sections.push(sec); if (sec.kind === 'graph') lastGraph = sec; node = null; lastEdges = null; return;
      }
      const meta = sec?.kind !== 'tree' && sec?.kind !== 'cover' && !CHARTS.includes(sec?.kind) && raw.match(/^(title|sub|base|theme)\s+(.*)$/);
      if (meta) {
        doc[meta[1]] = meta[2].trim();
        if (meta[1] === 'theme' && !THEMES.includes(doc.theme)) { doc.errors.push(`line ${n}: theme must be one of ${THEMES.join(', ')}`); doc.theme = ''; }
        return;
      }
      if (!sec) { doc.errors.push(`line ${n}: expected title/sub/base or a == section`); return; }
      if (sec.kind === 'tree' || CHARTS.includes(sec.kind)) { sec.lines.push({ raw, n }); return; }
      if (sec.kind === 'steps') {
        const sd = raw.match(STEP_DETAIL);
        if (sd) { stepDetail(lastStep, sd[1], sd[2], n, doc.errors); return; }
        lastStep = parsePath(sec.graph, raw.trim(), n, true);
        if (!lastStep) doc.errors.push(`line ${n}: not a step (a > b | payload | narration): ${raw.trim()}`);
        return;
      }
      if (sec.kind === 'cover') { parseCover(sec.graph.cover, raw.trim(), n, doc.errors); return; }
      // graph body
      const g = sec, t = raw.trim();
      const sdt = raw.match(STEP_DETAIL);
      if (sdt) { stepDetail(lastStep, sdt[1], sdt[2], n, doc.errors); return; }
      const prevPath = lastPath;
      lastStep = null; lastPath = null;
      const facet = /^\S/.test(raw) && t.match(/^(ranks|view|meter):\s*(.*)$/);
      if (facet) {
        if (facet[1] === 'ranks') g.ranks = facet[2].split('|').map((x) => x.trim()).filter(Boolean);
        else if (facet[1] === 'meter') g.meter = parseMeter(facet[2], n, doc.errors);
        else if (VIEWS.includes(facet[2].trim())) g.view = facet[2].trim();
        else doc.errors.push(`line ${n}: view must be one of ${VIEWS.join(', ')}`);
        return;
      }
      // `group id: Label` opens a box drawn around the nodes declared after it, until the next group line or `group end`.
      const gb = /^\S/.test(raw) && t.match(/^group\s+(?:end|([\w.$-]+):\s*(.*))$/);
      if (gb) {
        if (!gb[1]) { g.box = ''; node = null; return; }
        if (g.groups.some((x) => x.id === gb[1])) doc.errors.push(`line ${n}: group "${gb[1]}" declared twice`);
        g.groups.push({ id: gb[1], label: gb[2].trim() || gb[1], n }); g.box = gb[1]; node = null; return;
      }
      // `tone id: Label` names a fill colour; a node takes it with `{id}` and the legend lists it.
      const tn = /^\S/.test(raw) && t.match(/^tone\s+([\w.$-]+):\s*(.*)$/);
      if (tn) { g.tones.push({ id: tn[1], label: tn[2].trim() || tn[1], k: g.tones.length % 6 + 1, n }); node = null; return; }
      // `[*] -> id: label` draws the start dot.
      const sd = t.match(/^\[\*\]\s*->\s*([\w.$-]+)\s*(?::\s*(.*))?$/);
      if (sd) {
        const id = `__start${g.nodes.filter((x) => x.kind === 'start').length || ''}`;
        const dot = { id, label: 'start', kind: 'start', ref: '', note: '', st: '', info: {}, refs: [], rank: g.group, group: '', tone: '', n };
        g.byId[id] = dot; g.nodes.push(dot);
        const e = { from: id, to: sd[1], label: (sd[2] || '').trim(), ref: '', note: '', async: false, st: '', n, info: {}, refs: [], paths: [] };
        g.edges.push(e); lastEdges = [e]; node = null; return;
      }
      const grp = t.match(/^--\s+(.+)$/);
      if (grp) {
        g.group = g.ranks.findIndex((r) => r.toLowerCase() === grp[1].trim().toLowerCase());
        if (g.group < 0) doc.errors.push(`line ${n}: "-- ${grp[1].trim()}" is not in ranks: ${g.ranks.join(' | ') || '(none)'}`);
        node = null; return;
      }
      // Detail lines belong to the node or edge line above them (every edge of a fan-out line).
      const detail = raw.match(/^\s+(does|reads|writes|fails|ref|note|state|carries|locals|lane|at|sets|weight):\s*(.*)$/);
      if (detail) {
        // `weight:` under a path sets how much flows along it (view: sankey).
        if (detail[1] === 'weight' && !node && !lastEdges && prevPath) { lastPath = prevPath; prevPath.weight = +detail[2].replace(/[^\d.]/g, '') || 0; return; }
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
      const pp = parsePath(g, t, n, false);
      if (pp) { node = null; lastEdges = null; lastPath = pp; lastStep = g.steps.includes(pp) ? pp : null; return; }
      const nd = t.match(/^([+\-~!*?]?)([\w.$-]+):\s*(.*)$/);
      if (nd) {
        const [, st, id, body] = nd;
        const { rest, ref, note } = splitTail(body);
        // `{tone}` sits next to the kind: `Label [state] {run}` or `Label {run} [state]`.
        let tone = '';
        const txt = rest.replace(/\s*\{([\w.$-]+)\}(?=\s*(\[[^\]]*\])?\s*$)/, (_, x) => { tone = x; return ''; });
        const km2 = txt.match(/\[([^\]]+)\]\s*$/);
        const label = (km2 ? txt.slice(0, km2.index) : txt).trim() || id;
        if (g.byId[id]) doc.errors.push(`line ${n}: node "${id}" declared twice`);
        node = { id, label, kind: km2 ? km2[1] : '', ref, note, st: STATUS[st] || '', info: {}, refs: [], rank: g.group, group: g.box, tone, n };
        g.byId[id] = node; g.nodes.push(node); lastEdges = null; return;
      }
      doc.errors.push(`line ${n}: not a node (id: Label), edge (a -> b), path (a > b => c), or detail (  does: …): ${t}`);
    });
    for (const s of doc.sections) if (s.kind === 'graph') finishGraph(s, doc.errors); else if (s.kind === 'tree') buildTree(s, doc.errors); else CHART[s.kind].parse(s, doc.errors);
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
    return p;
  }

  // Lines under a step: `shows: id = text` puts text in that box while the step plays; `meter: 0.93 note` moves the
  // graph's meter. `meter: title | 0 band | 0.2 band | 1` on the graph declares the scale: ticks, each naming the band after it.
  const STEP_DETAIL = /^\s+(shows|meter):\s*(.*)$/;
  function stepDetail(p, key, val, n, errors) {
    if (!p) { errors.push(`line ${n}: ${key}: belongs under a step (a path line with a | tail)`); return; }
    if (key === 'shows') {
      const m = val.match(/^([\w.$-]+)\s*=\s*(.*)$/);
      if (!m) { errors.push(`line ${n}: shows: wants id = text: ${val}`); return; }
      (p.shows ||= {})[m[1]] = m[2].trim();
    } else {
      const m = val.match(/^(-?\d*\.?\d+)\s*(.*)$/);
      if (!m) { errors.push(`line ${n}: meter: wants a number, then an optional note: ${val}`); return; }
      p.meter = { v: +m[1], text: m[1], note: m[2].trim() };
    }
    p.showsLine = p.showsLine || n;
  }
  function parseMeter(val, n, errors) {
    const [title, ...rest] = val.split('|').map((x) => x.trim());
    const ticks = rest.map((x) => x.match(/^(-?\d*\.?\d+)\s*(.*)$/));
    if (ticks.length < 2 || ticks.some((m) => !m)) { errors.push(`line ${n}: meter: wants title | number band | … | number`); return null; }
    const out = ticks.map((m) => ({ v: +m[1], label: m[2].trim() }));
    if (out.some((t, j) => j && t.v <= out[j - 1].v)) { errors.push(`line ${n}: meter: ticks must increase`); return null; }
    return { title, ticks: out };
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
    for (const nd of s.nodes) if (nd.tone && !s.tones.some((t) => t.id === nd.tone)) errors.push(`line ${nd.n}: node "${nd.id}" uses tone "${nd.tone}", which no tone line declares`);
    if (s.groups.length && s.view !== 'flow' && s.view !== 'states') errors.push(`${s.name}: group boxes need view flow or states`);
    for (const gr of s.groups) if (!s.nodes.some((nd) => nd.group === gr.id)) errors.push(`line ${gr.n}: group "${gr.id}" has no nodes`);
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
    for (const p of s.steps) {
      for (const [id, txt] of Object.entries(p.shows || {})) {
        if (!s.byId[id]) { errors.push(`line ${p.showsLine}: shows: names undeclared node "${id}"`); delete p.shows[id]; continue; }
        s.byId[id].showLen = Math.max(s.byId[id].showLen || 0, txt.length);
      }
      if (p.meter && !s.meter) errors.push(`line ${p.showsLine}: meter: on a step, but the graph has no meter: line`);
    }
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
    // `sets: a = waiting, b = !timed out` under a message: the state each party is in once it lands (view: seq).
    for (const e of s.edges) {
      if (!e.info.sets) continue;
      e.sets = e.info.sets.split(/\s*,\s*/).map((x) => x.match(/^([\w.$-]+)\s*=\s*(.*)$/)).filter(Boolean).map(([, id, v]) => ({ id, ...toned(v.trim()) }));
      for (const x of e.sets) if (!s.byId[x.id]) errors.push(`line ${e.n}: sets: names undeclared node "${x.id}"`);
      e.sets = e.sets.filter((x) => s.byId[x.id]);
      if (s.view !== 'seq') errors.push(`line ${e.n}: sets: draws state pills only in view: seq`);
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
  const FS = 12.5, PFS = 11, LINE = 17, SUBL = 15, PX = 9, PY = 6, WRAP = 28, PILL = 20, GAP = 26, VGAP = 26, FGAP = 14;
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
    const parts = text.split(/(?<=[\s,]|\S\()|(?=\.)/), lines = [];
    let cur = '';
    for (const p of parts) {
      if (cur && (cur + p).trimEnd().length > max) { lines.push(cur.trimEnd()); cur = p.trimStart(); } else cur += p;
    }
    if (cur.trim()) lines.push(cur.trimEnd());
    return lines.length ? lines : [text];
  }
  // An edge label over PWRAP + 8 characters wraps at PWRAP so a long one stacks instead of widening the graph, which would
  // then shrink to fit and leave every label too small to read.
  const PWRAP = 24, PLINE = 14;
  function pillDims(e, extra, pre = 0) {
    const lines = !e.label ? [] : e.label.length > PWRAP + 8 ? wrap(e.label, PWRAP) : [e.label];
    e.plines = lines;
    const w = Math.ceil((pre + Math.max(0, ...lines.map((l) => l.length))) * cw() * PFS / FS) + extra;
    return { w, h: lines.length > 1 ? lines.length * PLINE + 6 : PILL };
  }
  const MARK = { add: '+', del: '−', mod: '~', fail: '!', active: '*', unk: '?' };

  // A box: label (wrapped, never truncated), kind and file:line, the note, then frame locals.
  function boxOf(nd, max, view) {
    if (nd.kind === 'start') return { kind: 'node', nd, lines: [], mark: '', sub: [], notes: [], locals: [], w: 14, h: 14 };
    const c = cw(), kind = view === 'states' && nd.kind === 'state' ? '' : nd.kind, mark = MARK[nd.st] ? MARK[nd.st] + ' ' : '';
    const lines = wrap(nd.label, max);
    const r = nd.ref && short(nd.ref), lw = Math.max(...lines.map((l, j) => l.length + (j ? 0 : mark.length)));
    // The kind and file:line share a line when they fit under the label; otherwise each takes its own.
    const both = [kind, r].filter(Boolean).join(' · ');
    const sub = !both ? [] : both.length * PFS / FS <= Math.max(lw, max) ? [both] : [kind, r].filter(Boolean);
    const notes = nd.note ? wrap(nd.note, Math.round(Math.max(lw, max) * FS / PFS)) : [];
    const locals = (nd.info.locals || '').split('\n').filter(Boolean);
    const small = [...sub, ...notes, ...locals];
    // A box some step writes into (shows:) keeps one line for that text, sized to the longest, up to 34 characters.
    const bx = Math.min(nd.showLen || 0, 34);
    const wch = Math.max(lw, ...small.map((x) => x.length * PFS / FS), bx * PFS / FS);
    return { kind: 'node', nd, lines, mark, sub, notes, locals, bx: bx > 0, w: Math.ceil(wch * c) + 2 * PX + 2, h: lines.length * LINE + (small.length + (bx ? 1 : 0)) * SUBL + 2 * PY + 2 };
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
  // Down from (x1, y1), across at my, down to (x2, y2), with rounded corners; the path continues an open `M`.
  const vjog = (x1, x2, y1, y2, my) => {
    if (Math.abs(x2 - x1) < 1) return ` L${x2},${y2}`;
    const sx = Math.sign(x2 - x1), r = Math.max(0, Math.min(6, Math.abs(x2 - x1) / 2, my - y1, y2 - my));
    return ` L${x1},${my - r} Q${x1},${my} ${x1 + sx * r},${my} L${x2 - sx * r},${my} Q${x2},${my} ${x2},${my + r} L${x2},${y2}`;
  };
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
    s.nodes.forEach((nd, i) => { nd.box = put(Object.assign(boxOf(nd, WRAP, s.view), { i }), 2 * layer[i]); });
    // Order numbers: one per edge line, so a fan-out line shares its number.
    const lines = [...new Set(s.edges.filter((e) => !e.derived).map((e) => e.n))].sort((a, b) => a - b);
    for (const e of s.edges) e.num = e.derived ? 0 : lines.indexOf(e.n) + 1;
    const c = cw(), numbered = s.view === 'flow';
    for (const { e, u, v } of E) {
      const ru = 2 * layer[u], rv = 2 * layer[v];
      let prev = s.nodes[u].box; e.chain = [];
      for (let r = ru + 1; r < rv; r++) {
        const pill = r === ru + 1 && pilled(e);
        const pd = pill ? pillDims(e, numbered ? (e.label ? 30 : 22) : 18, numbered ? String(e.num).length + 1 : 0) : null;
        const it = put({ kind: pill ? 'pill' : 'v', e, w: pd ? pd.w : 2, h: pd ? pd.h : 0 }, r);
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
    // Group boxes: a group's items stay side by side in every rank, gathered where its first item sits. An edge's
    // bends belong to the group when both its ends do.
    const gkey = (it) => (it.kind === 'node' ? it.nd.group || '' : s.byId[it.e.from].group && s.byId[it.e.from].group === s.byId[it.e.to].group ? s.byId[it.e.from].group : '');
    // Every rank lists the groups in one left-to-right order (their mean position after the sweeps), so a group's
    // boxes never interleave with another's. Items outside groups sit by the groups they connect.
    let gorder = {};
    if (s.groups.length) {
      const pos = {}, cnt = {};
      ranks.forEach((rk) => rk.forEach((it) => { const k = gkey(it); if (k) { pos[k] = (pos[k] || 0) + (it.o + 0.5) / rk.length; cnt[k] = (cnt[k] || 0) + 1; } }));
      const gs = Object.keys(pos).sort((a, b) => pos[a] / cnt[a] - pos[b] / cnt[b]), gi = Object.fromEntries(gs.map((k, j) => [k, j]));
      gorder = gi;
      const near = (ids) => { const v = ids.map((id) => s.byId[id].group).filter((k) => k in gi).map((k) => gi[k]); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
      // Outside a group, a node sits just right of the groups it links to; an edge between two groups runs between
      // them, and one leaving a group runs just outside it.
      const key = (it, rk) => {
        const k = gkey(it);
        if (k) return gi[k];
        const ids = it.kind === 'node' ? s.edges.filter((e) => e.from === it.nd.id || e.to === it.nd.id).map((e) => (e.from === it.nd.id ? e.to : e.from)) : [it.e.from, it.e.to];
        const v = near(ids), inside = ids.filter((id) => s.byId[id].group in gi).length;
        if (v == null) return (it.o / Math.max(1, rk.length - 1)) * (gs.length - 1) + 0.5;
        return it.kind === 'node' || inside < ids.length || new Set(ids.map((id) => s.byId[id].group)).size < 2 ? v + 0.5 : v;
      };
      ranks.forEach((rk, r) => {
        for (const it of rk) it.gk = key(it, rk);
        rk.sort((a, b) => a.gk - b.gk || a.o - b.o).forEach((it, j) => (it.o = j));
      });
    }
    // x: each item wants the mean of its neighbours' centres; pav keeps the rank order and minimum spacing.
    // A self-loop and its label take room right of their box.
    for (const e of s.edges) if (e.from === e.to) { const b = s.byId[e.from].box; b.xr = Math.max(b.xr || 0, 30 + (e.label ? pillDims(e, 22).w : 0)); }
    const sep = (a, b) => (a.w + b.w) / 2 + (a.xr || 0) + (a.kind === 'node' && b.kind === 'node' ? GAP : a.kind === 'v' && b.kind === 'v' ? 8 : 14);
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
      // A group's members also pull towards the group's centre, so the group stays compact enough to box.
      const gc = {};
      if (s.groups.length) for (const it of items) { const k = gkey(it); if (k) { (gc[k] = gc[k] || [0, 0])[0] += it.x; gc[k][1]++; } }
      const want = (it) => {
        const m = it.kind !== 'node' && it.e.chain.length > 1 ? mean(it, it.e.chain) : mean(it, it.up.concat(it.down)), k = gkey(it);
        return k && gc[k] ? 0.4 * m + 0.6 * gc[k][0] / gc[k][1] : m;
      };
      for (const rk of seq) place(rk, want);
    }
    // Groups that share ranks get separate columns, in the rank order above: each group starts right of every
    // earlier group it shares a rank with, then each rank is re-spaced left to right so nothing overlaps.
    const GPAD = 12, GHEAD = 40, GFOOT = 12, GGAP = 18;
    const blocks = () => [...s.groups.map((gr) => {
      const mem = items.filter((it) => gkey(it) === gr.id);
      if (!mem.length) return null;
      let l = Math.min(...mem.map((it) => it.x - it.w / 2)) - GPAD, rr = Math.max(...mem.map((it) => it.x + it.w / 2 + (it.xr || 0))) + GPAD;
      const lw = Math.ceil(gr.label.length * c) + 2 * GPAD;
      if (rr - l < lw) { const mid = (l + rr) / 2; l = mid - lw / 2; rr = mid + lw / 2; }
      return { gr, mem, k: gorder[gr.id], l, r: rr, r0: Math.min(...mem.map((it) => it.r)), r1: Math.max(...mem.map((it) => it.r)) };
    }), ...items.filter((it) => it.kind === 'node' && !it.nd.group).map((it) => ({ gr: null, mem: [it], k: it.gk ?? 0, l: it.x - it.w / 2, r: it.x + it.w / 2 + (it.xr || 0), r0: it.r, r1: it.r }))]
      .filter(Boolean).sort((p, q) => p.k - q.k);
    // Pull each group's members toward its centre, as far as their rank neighbours allow, so a group stays one tight box.
    for (let k = 0; k < 3; k++) for (const gr of s.groups) {
      const xs = items.filter((it) => it.kind === 'node' && it.nd.group === gr.id).map((it) => it.x).sort((a, b) => a - b);
      if (!xs.length) continue;
      const mid = xs[xs.length >> 1];
      for (const it of items) {
        if (gkey(it) !== gr.id) continue;
        const rk = ranks[it.r], j = rk.indexOf(it), L = rk[j - 1], R = rk[j + 1];
        it.x = Math.min(R ? R.x - sep(it, R) : Infinity, Math.max(L ? L.x + sep(L, it) : -Infinity, mid));
      }
    }
    const respace = () => { for (const rk of ranks) for (let j = 1; j < rk.length; j++) { const min = rk[j - 1].x + sep(rk[j - 1], rk[j]); if (rk[j].x < min) rk[j].x = min; } };
    for (let k = 0; s.groups.length && k < 8; k++) {
      let moved = false;
      const bs = blocks();
      bs.forEach((B, j) => {
        const need = Math.max(-Infinity, ...bs.slice(0, j).filter((A) => (A.gr || B.gr) && A.k < B.k && A.r0 <= B.r1 && B.r0 <= A.r1).map((A) => A.r + GGAP));
        if (B.l < need) { const dx = need - B.l; for (const it of B.mem) it.x += dx; B.l += dx; B.r += dx; moved = true; }
      });
      respace();
      if (!moved) break;
    }
    const gb = blocks().filter((b) => b.gr);
    const lo = Math.min(...items.map((it) => it.x - it.w / 2), ...gb.map((b) => b.l)), hi = Math.max(...items.map((it) => it.x + it.w / 2 + (it.xr || 0)), ...gb.map((b) => b.r));
    for (const it of items) it.x = Math.round(it.x - lo + 2);
    // y: rank bands. Node ranks are as tall as their tallest box; label ranks are one pill tall.
    let y = 0;
    const heads = ranks.map((_, r) => gb.some((b) => b.r0 === r)), feet = ranks.map((_, r) => gb.some((b) => b.r1 === r));
    const band = ranks.map((rk, r) => {
      const hh = Math.max(0, ...rk.map((it) => it.h));
      if (heads[r]) y += GHEAD;
      // A flow alternates box ranks and pill ranks, so the gap on each side of a pill can be tighter than between boxes.
      const pills = s.view === 'flow' && (r % 2 || (ranks[r + 1] || []).some((it) => it.kind === 'pill'));
      const b = { top: y, h: hh }; y += hh + (hh ? (pills ? FGAP : VGAP) : 0) + (feet[r] ? GFOOT : 0); return b;
    });
    const decor = gb.map((b) => ({ kind: 'group', id: b.gr.id, text: b.gr.label, x: Math.round(b.l - lo + 2), w: Math.round(b.r - b.l),
      y: band[b.r0].top - GHEAD + 6, h: band[b.r1].top + band[b.r1].h - band[b.r0].top + GHEAD - 6 + GFOOT - 2 }));
    for (const it of items) { const b = band[it.r]; it.y = b.top + (b.h - it.h) / 2; it.top = b.top; it.bot = b.top + b.h; }
    // Ports: spread a node's edges along its top and bottom edges in the order of their neighbours.
    for (const it of items) {
      if (it.kind !== 'node') continue;
      for (const [list, key] of [[it.down, 'outs'], [it.up, 'ins']]) {
        const sorted = list.slice().sort((a, b) => a.x - b.x), m = sorted.length, step = m > 1 ? Math.min(16, (it.w - 20) / (m - 1)) : 0;
        // A neighbour straight below or above the box gets a port at its own x, so the line runs straight.
        const lo = it.x - it.w / 2 + 8, hi = it.x + it.w / 2 - 8;
        it[key] = new Map(sorted.map((nb, j) => [nb, nb.x >= lo && nb.x <= hi && sorted.filter((o) => Math.abs(o.x - nb.x) < 6).length === 1 ? nb.x : it.x + (j - (m - 1) / 2) * step]));
      }
      // A line into a group's top row crosses the group's title: move its port right of the title text when the box allows.
      const gd = it.nd.group && decor.find((d) => d.id === it.nd.group && band[it.r].top - GHEAD + 6 === d.y);
      if (gd) {
        const end = gd.x + Math.ceil(gd.text.length * c * 12 / FS) + 26, hi = it.x + it.w / 2 - 8;
        let next = end;
        for (const [nb, px] of [...it.ins].sort((p, q) => p[1] - q[1])) if (px < end && next <= hi) { it.ins.set(nb, next); next += 12; }
      }
    }
    // Edges are orthogonal: straight down, one horizontal jog per rank gap, rounded corners. Jogs that share a gap
    // get their own track, so two edges never run along the same line.
    const routes = [], gaps = new Map();
    for (const { e, u, v } of E) {
      const a = s.nodes[u].box, b = s.nodes[v].box, ch = e.chain;
      // Waypoints on rank bands with no height (no pill or box on them) would leave a jog no room, so they drop out.
      const via = ch.filter((it) => band[it.r].h > 0);
      const pts = [[a.outs.get(ch[0] || b), a.y + a.h]], rs = [a.r];
      for (const it of via) { pts.push([it.x, it.top], [it.x, it.bot]); rs.push(it.r, it.r); }
      pts.push([b.ins.get(ch[ch.length - 1] || a), b.y]); rs.push(b.r);
      // With a dropped waypoint, a line that already falls on the box keeps its x instead of a small last jog.
      if (via.length < ch.length) {
        const px = pts[pts.length - 2][0], ex = pts[pts.length - 1][0];
        if (Math.abs(px - b.x) < b.w / 2 - 8 && ![...b.ins.values()].some((x) => x !== ex && Math.abs(x - px) < 6)) pts[pts.length - 1][0] = px;
      }
      const jogs = [];
      for (let j = 1; j < pts.length; j += 2) {
        if (Math.abs(pts[j][0] - pts[j - 1][0]) < 6) { pts[j][0] = pts[j - 1][0]; if (j + 1 < pts.length - 1) pts[j + 1][0] = pts[j][0]; continue; }
        // The jog runs in the clear space between two rank bands, outside any group's title or foot.
        const r = rs[j - 1], rn = rs[j], z1 = band[r].top + band[r].h + (feet[r] ? GFOOT : 0), z2 = band[rn].top - (heads[rn] ? GHEAD - 6 : 0);
        const g = { y1: z1, y2: z2, x1: pts[j - 1][0], x2: pts[j][0], my: 0 };
        const key = r;
        if (!gaps.has(key)) gaps.set(key, []);
        gaps.get(key).push(g); jogs[j] = g;
      }
      routes.push({ e, ch, pts, jogs });
    }
    for (const list of gaps.values()) {
      // Rightward jogs take tracks from the top, leftward ones from the bottom, so a fan-out never crosses itself.
      list.sort((p, q) => (Math.sign(q.x2 - q.x1) - Math.sign(p.x2 - p.x1)) || (p.x2 > p.x1 ? q.x1 - p.x1 : p.x1 - q.x1));
      const n = list.length, span = Math.min(6 * (n - 1), Math.min(...list.map((g) => g.y2 - g.y1)) * 0.5);
      list.forEach((g, k) => (g.my = Math.round((g.y1 + g.y2) / 2 - span / 2 + (n > 1 ? (span * k) / (n - 1) : 0))));
    }
    const vsegs = [];
    for (const { e, ch, pts, jogs } of routes) {
      let d = `M${pts[0][0]},${pts[0][1]}`;
      for (let j = 1; j < pts.length; j++) {
        const [x1, y1] = pts[j - 1], [x2, y2] = pts[j], g = jogs[j];
        if (!g) { d += ` L${x2},${y2}`; vsegs.push([x2, y1, y2]); continue; }
        d += vjog(x1, x2, y1, y2, g.my); vsegs.push([x1, y1, g.my], [x2, g.my, y2]);
      }
      e.d = d; e.pill = ch[0]?.kind === 'pill' ? ch[0] : null;
    }
    // A group title moves to the right end of its header when a line would cross it on the left.
    for (const d of decor) {
      const tw = Math.ceil(d.text.length * c * 12 / FS) + 28, hit = (l, r) => vsegs.some(([x, y1, y2]) => x > l && x < r && y1 < d.y + 26 && y2 > d.y);
      if (hit(d.x, d.x + tw) && !hit(d.x + d.w - tw, d.x + d.w)) d.align = 'right';
    }
    let right = hi - lo + 4 + 30;
    for (const e of s.edges) if (e.from === e.to) {
      const b = s.byId[e.from].box;
      e.d = selfLoop(b);
      if (e.label) {
        const { w, h: ph } = pillDims(e, 18);
        e.pill = { x: b.x + b.w / 2 + 30 + w / 2, y: b.y + b.h / 2 - ph / 2, w };
        right = Math.max(right, e.pill.x + w / 2 + 4);
      }
    }
    return { w: Math.ceil(right), h: Math.ceil(y - VGAP + 4), decor };
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
      // Centring on neighbours only ever pushes a column down; lift the lane back so its highest box meets the top.
      const lift = Math.min(Infinity, ...cols.flat().map((b) => b.y)) - top;
      if (lift > 0 && lift < Infinity) for (const b of cols.flat()) b.y -= lift;
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
    const jogN = new Map();
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
          if (Math.abs(qy - py) < 6) { d += ` L${qx},${qy}`; continue; }
          // Across, one vertical jog in the gap, across again; jogs in the same gap take their own track.
          const key = Math.round(px), k = (jogN.get(key) || 0); jogN.set(key, k + 1);
          const mx = Math.min(qx - 8, Math.max(px + 8, (px + qx) / 2 + ((k % 5) - 2) * 6)), sy = Math.sign(qy - py);
          const r = Math.max(0, Math.min(6, Math.abs(qy - py) / 2, mx - px, qx - mx));
          d += ` L${mx - r},${py} Q${mx},${py} ${mx},${py + sy * r} L${mx},${qy - sy * r} Q${mx},${qy} ${mx + r},${qy} L${qx},${qy}`;
        }
        e.d = d;
      } else if (b.x === a.x && b.y > a.y) {
        e.d = `M${a.x},${a.y + a.h}` + vjog(a.x, b.x, a.y + a.h, b.y, (a.y + a.h + b.y) / 2);
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
      else if (b.y > a.y) { const x1 = a.left + 14, x2 = b.left + 14; e.d = `M${x1},${a.y + a.h}` + vjog(x1, x2, a.y + a.h, b.y, (a.y + a.h + b.y) / 2); }
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
    // State pills: with any `sets:`, each party shows its `state:` under its head, then its new state under each
    // message that changes it.
    const pills = s.edges.some((e) => e.sets?.length), decor = [];
    const first = pills ? s.nodes.filter((nd) => nd.info.state) : [];
    for (const nd of first) decor.push({ kind: 'spill', x: nd.box.x, y: headH + 10, ...toned(nd.info.state), e: null });
    // Each state is also a bar on its lifeline, from the message that sets it to the next change, so how long a
    // party sits in a state reads as length.
    const open = new Map(), bar = (id, y2) => { const o = open.get(id); if (o && y2 - 3 > o.y1) decor.push({ kind: 'sbar', x: s.byId[id].box.x, y1: o.y1, y2: y2 - 3, tone: o.tone, e: o.e }); open.delete(id); };
    for (const nd of first) open.set(nd.id, { y1: headH + 10, tone: toned(nd.info.state).tone, e: null });
    const top = headH + 34 + (first.length ? 26 : 0);
    const span = timed ? Math.max(...s.edges.map((e) => ms(e.info.at))) || 1 : 1, scale = timed ? Math.max(s.edges.length * 34, 300) / span : 0;
    let y = top - 38, last = top;
    s.edges.forEach((e) => {
      y = timed ? Math.max(y + 38, top + ms(e.info.at) * scale) : y + 38; last = y;
      const a = s.byId[e.from].box, b = s.byId[e.to].box;
      if (e.from === e.to) e.d = `M${a.x},${y} C${a.x + 44},${y} ${a.x + 44},${y + 16} ${a.x + 4},${y + 16}`;
      else { const dir = b.x > a.x ? 1 : -1, gap = pills ? 6 : 3; e.d = `M${a.x + dir * (pills ? 4 : 0)},${y} L${b.x - dir * gap},${y}`; }
      if (e.label) e.pill = { x: (a.x + b.x) / 2 + (e.from === e.to ? 40 : 0), y: y - PILL - 2, w: Math.ceil(e.label.length * c * PFS / FS) + 18 };
      if (timed) decor.push({ kind: 'tick', x: 0, y: y - 8, text: e.info.at });
      if (e.sets?.length) {
        for (const x of e.sets) { bar(x.id, y); open.set(x.id, { y1: y, tone: x.tone, e }); decor.push({ kind: 'spill', x: s.byId[x.id].box.x, y: y + 9, text: x.text, tone: x.tone, e }); }
        y += 28; last = y;
      }
    });
    for (const id of [...open.keys()]) bar(id, last + 14);
    for (const nd of s.nodes) decor.push({ kind: 'life', x: nd.box.x, y1: headH, y2: last + 26 });
    return { w: x - COL + 20, h: Math.ceil(last + 30), decor };
  }

  const LAYOUT = { flow: layoutFlow, states: layoutFlow, ranked: layoutRanked, stack: layoutStack, seq: layoutSeq };
  // A status prefix on a chart item picks its colour: + ok, ! fails, * or ~ in progress, ? unread.
  const PRE = { '+': 'ok', '!': 'fail', '*': 'warn', '~': 'warn', '?': 'unk' };
  const toned = (v) => (PRE[v[0]] ? { tone: PRE[v[0]], text: v.slice(1).trim() } : { tone: '', text: v });

  function renderGraph(s, doc, mount) {
    const idx = Object.fromEntries(s.nodes.map((nd, i) => [nd.id, i]));
    const L = LAYOUT[s.view](s), steps = s.steps, view = s.view, drawing = doc.theme === 'drawing';
    const wrapEl = h('div', { class: `vz-flow vz-v-${view}`, role: 'group', 'aria-label': s.name, tabindex: 0 });
    const stage = h('div', { class: 'vz-stage', style: `width:${L.w}px;height:${L.h}px` });
    const groupEls = new Map();
    for (const d of L.decor) {
      if (d.kind === 'lane') stage.append(h('div', { class: 'vz-lane', style: `left:0;top:${d.y}px;width:${d.w}px;height:${d.h}px` }, h('span', {}, d.text)));
      if (d.kind === 'head') stage.append(h('div', { class: 'vz-colhead', style: `left:${d.x}px;top:${d.y}px;width:${d.w}px` }, d.text));
      if (d.kind === 'tick') stage.append(h('div', { class: 'vz-tick', style: `left:${d.x}px;top:${d.y}px` }, d.text));
      if (d.kind === 'group') {
        const el = h('div', { class: 'vz-group' + (d.align === 'right' ? ' r' : ''), style: `left:${d.x}px;top:${d.y}px;width:${d.w}px;height:${d.h}px`, 'data-viz-id': d.id }, h('span', { title: d.text }, h('b', {}, d.text)));
        const head = el.firstChild;
        head.addEventListener('mouseenter', () => hoverGroup(d.id)); head.addEventListener('mouseleave', () => hoverGroup(null));
        head.addEventListener('click', () => pickGroup(d.id));
        groupEls.set(d.id, el); stage.append(el);
      }
    }
    const g = svg('svg', { width: L.w, height: L.h });
    const defs = svg('defs', {});
    // An edge's colour says how its paths end: green when any gets through, coral when they fail, dashed when all are filtered.
    // The drawing theme keeps colour for meaning only: ink for the plain way through, green added, coral removed or
    // failing, amber filtered; how many stories use an edge sets its weight.
    const COL = drawing ? { a: 'var(--vz-wire)', h: 'var(--vz-fg)', g: 'var(--vz-green)', r: 'var(--vz-coral)', y: 'var(--vz-amber)' }
      : { a: 'var(--vz-dim)', h: 'var(--vz-hl)', g: 'var(--vz-green)', r: 'var(--vz-coral)' };
    for (const [id, col] of Object.entries(COL)) {
      const m = svg('marker', { id: `vz-${id}-${s.uid}`, viewBox: '0 0 6 6', refX: 5, refY: 3, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse', ...(drawing ? { markerUnits: 'userSpaceOnUse' } : {}) });
      m.append(svg('path', { d: 'M0,0 L6,3 L0,6 z', fill: col })); defs.append(m);
    }
    g.append(defs);
    for (const d of L.decor) if (d.kind === 'life') g.append(svg('line', { x1: d.x, x2: d.x, y1: d.y1, y2: d.y2, class: 'vz-life' }));
    const base = drawing ? (e) => (e.st === 'add' ? 'g' : e.st === 'del' || e.out === 'fail' ? 'r' : e.out === 'drop' ? 'y' : 'a')
      : (e) => (e.st === 'add' ? 'g' : e.st === 'del' ? 'r' : e.out === 'pass' ? 'g' : e.out === 'fail' ? 'r' : 'a');
    let lit = null;
    const weight = (e) => (drawing ? 0.8 + 0.55 * Math.min(e.paths.length, 6) : 1.3);
    const paint = (e, on) => {
      const k = on ? 'h' : base(e), quiet = drawing && !on && !!lit;
      e.path.setAttribute('stroke', COL[k]); e.path.setAttribute('stroke-width', on ? (drawing ? 1.6 : 2) : quiet ? 0.8 : weight(e));
      if (drawing) e.path.style.opacity = quiet ? 0.35 : '';
      e.path.setAttribute(e.rev ? 'marker-start' : 'marker-end', `url(#vz-${k}-${s.uid})`);
    };
    for (const e of s.edges) {
      e.path = svg('path', { d: e.d, fill: 'none', class: e.st ? 's-' + e.st : '', 'stroke-dasharray': e.async ? '4 3' : e.st === 'del' ? '2 3' : e.out === 'drop' ? '3 4' : '' });
      e.hit = svg('path', { d: e.d, fill: 'none', stroke: 'transparent', 'stroke-width': 10, class: `vz-hit ${e.st ? 's-' + e.st : ''}` });
      e.hit.addEventListener('click', () => pickEdge(e));
      e.hit.addEventListener('mouseenter', () => hoverEdge(e)); e.hit.addEventListener('mouseleave', () => hoverEdge(null));
      g.append(e.path, e.hit); paint(e, false);
    }
    const pkt = svg('circle', { r: drawing ? 3.5 : 4, fill: drawing ? 'var(--vz-fg)' : 'var(--vz-hl)', opacity: 0 });
    // The drawing theme numbers each hop as the packet passes it, and the packet carries its payload as a label.
    const hopG = svg('g', {}), pktL = drawing ? svg('text', { class: 'vz-pkl', opacity: 0 }) : null;
    g.append(hopG, pkt); if (pktL) g.append(pktL);
    stage.append(g);
    const KIND = { event: 'k-event', signal: 'k-event', message: 'k-event', topic: 'k-event' };
    const boxes = s.nodes.map((nd, i) => {
      const b = nd.box;
      const tk = nd.tone && s.tones.find((t) => t.id === nd.tone)?.k;
      const cls = ['vz-box', nd.st && 's-' + nd.st, KIND[nd.kind], nd.kind === 'start' && 'k-start', tk && 't-' + tk, nd.end && 'e-' + nd.end, b.fixed && 'fixed'].filter(Boolean).join(' ');
      const el = h('div', { class: cls, style: `left:${b.x}px;top:${b.y}px;min-height:${b.h}px${b.fixed ? `;width:${b.w}px` : ''}`, role: 'button', tabindex: -1, 'aria-label': nd.label, 'data-viz-id': nd.id },
        ...b.lines.map((l, j) => h('div', { class: 'vz-bl' }, j === 0 && b.mark ? h('span', { class: 'vz-mk' }, b.mark) : null, l)),
        ...b.sub.map((x) => h('div', { class: 'vz-bs' }, x)),
        ...b.notes.map((x) => h('div', { class: 'vz-bn' }, x)),
        ...b.locals.map((x) => h('div', { class: 'vz-bv' }, x)),
        b.bx ? h('div', { class: 'vz-bx' }) : null);
      el.addEventListener('click', () => pickNode(i));
      el.addEventListener('mouseenter', () => hoverNode(i)); el.addEventListener('mouseleave', () => hoverNode(null));
      stage.append(el); return el;
    });
    const sbars = L.decor.filter((d) => d.kind === 'sbar');
    for (const d of sbars) { d.el = h('div', { class: `vz-sbar${d.tone ? ' q-' + d.tone : ''}`, style: `left:${d.x}px;top:${d.y1}px;height:${d.y2 - d.y1}px` }); stage.append(d.el); }
    const spills = L.decor.filter((d) => d.kind === 'spill');
    for (const d of spills) { d.el = h('div', { class: `vz-spill${d.tone ? ' q-' + d.tone : ''}`, style: `left:${d.x}px;top:${d.y}px` }, d.text); stage.append(d.el); }
    const numbered = view === 'flow';
    for (const e of s.edges) {
      if (!e.pill) continue;
      e.pillEl = h('div', { class: `vz-pill ${e.st ? 's-' + e.st : ''} f-${e.out || 'none'}`, style: `left:${e.pill.x}px;top:${e.pill.y}px`, role: 'button', title: e.label || `${s.byId[e.from].label} → ${s.byId[e.to].label}` },
        numbered ? h('span', { class: 'vz-num' }, e.num) : null, e.label ? h('span', {}, ...(e.plines?.length > 1 ? e.plines.flatMap((l, i) => (i ? [h('br'), l] : [l])) : [e.label])) : null);
      if (e.plines?.length > 1) e.pillEl.classList.add('multi');
      if (!numbered) e.pillEl.classList.add('plain');
      e.pillEl.addEventListener('click', () => pickEdge(e));
      e.pillEl.addEventListener('mouseenter', () => hoverEdge(e)); e.pillEl.addEventListener('mouseleave', () => hoverEdge(null));
      stage.append(e.pillEl);
    }
    wrapEl.append(stage);

    // Legend: only for what this graph uses.
    const outs = new Set(s.edges.map((e) => e.out)), used = [...new Set(s.nodes.map((nd) => nd.st).filter((st) => st && !(st === 'fail' && outs.has('fail'))))];
    const legend = h('div', { class: 'vz-legend' },
      ...s.tones.map((t) => h('span', {}, h('span', { class: `vz-sw t-${t.k}` }), t.label)),
      s.tones.length && s.nodes.some((nd) => nd.st === 'fail') ? h('span', {}, h('span', { class: 'vz-sw s-fail' }), 'breaks a rule') : null,
      numbered && s.edges.some((e) => e.pill) ? h('span', { title: 'Each numbered pill is one hop, numbered in the order it happens.' }, h('span', { class: 'vz-num' }, '1'), 'order') : null,
      outs.has('pass') ? (drawing ? h('span', { title: 'A heavier line carries more of the stories.' }, '━ weight: stories through it')
        : h('span', { class: 's-add', title: 'A green line: at least one story through it reaches its end.' }, '— gets through')) : null,
      outs.has('drop') ? h('span', { class: drawing ? 's-mod' : null, title: 'A dashed line: every story through it is stopped before the end.' }, '┄ filtered out') : null,
      outs.has('fail') ? h('span', { class: 's-fail', title: 'A coral line: a story through it ends in a failure.' }, '! — fails') : null,
      s.edges.some((e) => e.async) ? h('span', { title: 'Fire and forget: the sender does not wait for this hop.' }, '┄ async') : null,
      ...[['warn', 'in progress'], ['ok', 'done'], ['fail', 'failed']].filter(([t]) => L.decor.some((d) => d.kind === 'sbar' && d.tone === t))
        .map(([t, w]) => h('span', { title: 'A bar on a lifeline: how long that party stays in the state named at its top.' }, h('span', { class: `vz-sbar-key q-${t}` }), w)),
      ...used.map((st) => h('span', { class: 's-' + st, title: STATUS_TIP[st] }, `${MARK[st]} ${STATUS_WORD[st]}`)),
      null);

    // Before/after: when a change is drawn on one layout, a toggle hides either side instead of a second tab.
    const twoSided = [...s.edges, ...s.nodes].some((x) => x.st === 'add') && [...s.edges, ...s.nodes].some((x) => x.st === 'del');
    let side = 'both';
    const sideBtns = twoSided ? ['before', 'both', 'after'].map((k) => h('button', { 'aria-pressed': k === side, onclick: () => setSide(k) }, k)) : [];
    function setSide(k) {
      const was = side;
      side = k; sideBtns.forEach((b) => b.setAttribute('aria-pressed', b.textContent === k));
      wrapEl.classList.toggle('vz-before', k === 'before'); wrapEl.classList.toggle('vz-after', k === 'after'); restore();
      // The boxes that just came back pulse once in their colour, so the eye lands on what the change touched.
      boxes.forEach((b, i) => {
        const st = s.nodes[i].st;
        if ((st === 'add' && was === 'before') || (st === 'del' && was === 'after')) pulse(b, st === 'add' ? '--vz-green' : '--vz-coral', 0);
      });
    }
    const shown = (p) => !(side === 'before' && p.st === 'add') && !(side === 'after' && p.st === 'del');

    // Highlight: a node lights every path through it (or, off any path, its edges and neighbours); a chip lights its paths.
    let selNode = null, selEdge = null, selRow = null, step = -1, timer = null;
    const chips = [], storyChips = [];
    let chipsEl = null, auto = true, autoT = null;
    const halt = () => { if (!auto) return; auto = false; clearTimeout(autoT); };
    // Meter: a scale under the graph, banded by the graph's meter: line; a step's meter: slides the marker to its value.
    let meterEl = null, meterTo = () => {};
    if (s.meter) {
      const { title, ticks } = s.meter, lo = ticks[0].v, span = ticks[ticks.length - 1].v - lo, pct = (v) => `${(100 * (Math.min(Math.max(v, lo), lo + span) - lo)) / span}%`;
      const bands = ticks.slice(0, -1).map((t, j) => h('div', { class: 'vz-mband', style: `width:${(100 * (ticks[j + 1].v - t.v)) / span}%` }, t.label));
      const mark = h('div', { class: 'vz-mmark' }), note = h('span', { class: 'vz-mnote' });
      meterEl = h('div', { class: 'vz-meter' }, h('span', { class: 'vz-mt' }, title),
        h('div', { class: 'vz-mtrack' }, ...bands, ...ticks.map((t) => h('span', { class: 'vz-mtick', style: `left:${pct(t.v)}` }, String(t.v))), mark), note);
      meterTo = (m) => {
        mark.style.opacity = m ? 1 : 0; note.textContent = m ? `${m.text}${m.note ? ' ' + m.note : ''}` : '';
        if (m) mark.style.left = pct(m.v);
        bands.forEach((b, j) => b.classList.toggle('on', !!m && m.v >= ticks[j].v && (m.v < ticks[j + 1].v || j === bands.length - 1)));
      };
    }
    function light(nodes, edges, paths) {
      const any = nodes || edges; lit = edges;
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
    const ofGroup = (gid) => {
      const ids = new Set(s.nodes.filter((nd) => nd.group === gid).map((nd) => nd.id));
      const ps = s.paths.filter((p) => shown(p) && p.ids.some((id) => ids.has(id)));
      if (ps.length) return ofPaths(ps);
      return [new Set([...ids].map((id) => idx[id])), new Set(s.edges.filter((e) => ids.has(e.from) && ids.has(e.to))), null];
    };
    function hoverGroup(gid) {
      for (const [k, el] of groupEls) el.classList.toggle('hot', k === gid);
      if (step >= 0) return; if (gid == null) restore(); else light(...ofGroup(gid));
    }
    function pickGroup(gid) {
      selNode = null; selEdge = null; selRow = null; light(...ofGroup(gid));
      const gr = s.groups.find((x) => x.id === gid), mem = s.nodes.filter((nd) => nd.group === gid);
      sheet([['group', h('b', {}, gr.label)], ['holds', mem.map((nd) => h('div', {}, jump(nd.id)))],
        ['paths', s.paths.filter((p) => p.ids.some((id) => mem.some((nd) => nd.id === id))).map(pathEl)]]);
    }
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
      const how = [s.paths.length ? 'hover a box: lights every story through it' : 'hover a box: lights its neighbours',
        'click: file:line and detail', steps.length ? `▶ or ← →: replay ${steps.length} step${steps.length > 1 ? 's' : ''}` : null,
        twoSided ? 'before | after: show one side of the change' : null, 'Esc clears'].filter(Boolean);
      const named = s.paths.filter((p) => p.named && shown(p)), stories = named.slice(0, 8);
      const story = (p) => h('div', { class: 'vz-story vz-link', onmouseenter: () => hoverRow({ paths: [p] }), onmouseleave: () => hoverRow(null), onclick: () => pickStory(p) },
        h('span', { class: p.out === 'pass' ? 's-add' : p.out === 'fail' ? 's-fail' : 's-unk' }, OUT_WORD[p.out]), ' ', h('b', {}, p.name), ' ',
        p.st === 'add' || p.st === 'del' ? h('span', { class: 's-' + p.st }, p.st === 'add' ? 'after ' : 'before ') : '',
        h('span', { class: 'vz-hint' }, p.narr || p.ids.map((id) => s.byId[id].label).join(' › ')));
      return h('div', {}, h('div', { class: 'vz-hint' }, 'How to read it: ' + how.join(' · ') + '.'),
        stories.length ? h('div', { class: 'vz-stories' }, h('div', { class: 'vz-cap' }, `${named.length} stor${named.length > 1 ? 'ies' : 'y'} in this graph${named.length > stories.length ? `, first ${stories.length} shown` : ''}`), ...stories.map(story)) : null,
        at.length ? h('div', { class: 'vz-where' }, ...at.map((e) => h('span', { class: 'vz-hop vz-link', onclick: () => pickEdge(e) }, h('span', { class: 'vz-num' }, e.num), short(e.ref)))) : null);
    };
    const copy = (ref) => { const full = (doc.base || '') + ref; navigator.clipboard?.writeText(full).catch(() => {}); };
    const refEl = (ref, what) => h('div', {}, h('code', { title: 'copy path', onclick: () => copy(ref) }, (doc.base || '') + ref), what ? ' ' + what : '');
    const jump = (id) => h('span', { class: 'vz-link', onclick: () => pickNode(idx[id]) }, s.byId[id].label);
    const OUT_WORD = { pass: '→ gets through', drop: '⊘ filtered out', fail: '✕ fails', plain: '→' };
    const pathEl = (p) => h('div', {}, h('span', { class: p.out === 'pass' ? 's-add' : p.out === 'fail' ? 's-fail' : 's-unk' }, OUT_WORD[p.out]), ' ',
      p.named ? h('b', {}, p.name + ' ') : '', p.ids.map((id) => s.byId[id].label).join(' › '), p.st === 'add' || p.st === 'del' ? h('span', { class: 's-' + p.st }, `  ${STATUS_WORD[p.st]}`) : '');
    const DETAIL = ['carries', 'does', 'reads', 'writes', 'fails', 'state', 'sets', 'weight', 'locals', 'lane', 'at'];
    function sheet(rows) {
      const dl = h('dl', {});
      for (const [k, v] of rows) if (!(v == null || v === '' || (Array.isArray(v) && !v.length))) dl.append(h('dt', {}, k), h('dd', {}, v));
      insp.replaceChildren(dl);
    }
    function pickStory(p) {
      selRow = { paths: [p] }; selNode = null; selEdge = null; restore();
      sheet([['story', pathEl(p)], ['why', p.narr], ['carries', p.payload], ['', h('span', { class: 'vz-hint' }, 'Esc goes back to the overview.')]]);
    }
    function pickNode(i) {
      selNode = i; selEdge = null; selRow = null; restore();
      const nd = s.nodes[i];
      const ins = s.edges.filter((e) => e.to === nd.id), outs2 = s.edges.filter((e) => e.from === nd.id);
      const hop = (e, id) => h('span', { class: 'vz-hop' }, numbered && e.num ? h('span', { class: 'vz-num' }, e.num) : null, ' ', jump(id));
      sheet([
        ['node', [h('b', {}, nd.label), nd.kind ? `  [${nd.kind}]` : '', nd.st ? h('span', { class: 's-' + nd.st }, `  ${STATUS_WORD[nd.st]}`) : '']],
        ['at', nd.ref ? refEl(nd.ref) : null],
        ['group', nd.group ? s.groups.find((x) => x.id === nd.group)?.label : null],
        ['tone', nd.tone ? s.tones.find((t) => t.id === nd.tone)?.label : null],
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

    // Replay builds the graph. Each box and edge is born at the first step that reaches it; parts no step reaches
    // arrive with the last. Unborn parts wait as ghosts in their final place, so the layout never moves. Stepping
    // forward animates the births in time with the packet; jumping or stepping back only sets the state.
    let bar = null, narr = null, range = null, playBtn = null, count = null, anims = [], timers = [];
    const PER = 520, EASE = 'cubic-bezier(.23,1,.32,1)', lastStep = steps.length - 1;
    const nBirth = new Map(), eBirth = new Map();
    steps.forEach((st, k) => {
      for (const id of st.ids) if (!nBirth.has(idx[id])) nBirth.set(idx[id], k);
      for (const e of st.edges) if (!eBirth.has(e)) eBirth.set(e, k);
    });
    const bornN = (i) => nBirth.get(i) ?? lastStep;
    const bornE = (e) => eBirth.get(e) ?? Math.max(bornN(idx[e.from]), bornN(idx[e.to]));
    const later = (ms, f) => { if (ms <= 0) f(); else timers.push(setTimeout(f, ms)); };
    const anim = (el, kf, o) => { const a = el.animate(kf, { easing: EASE, fill: 'backwards', ...o }); anims.push(a); return a; };
    const settle = () => { for (const a of anims) a.finish(); anims = []; timers.forEach(clearTimeout); timers = []; };
    const tone = (v) => getComputedStyle(wrapEl).getPropertyValue(v).trim();
    function pulse(el, v, delay) {
      if (reduced()) return;
      anim(el, [{ boxShadow: `0 0 0 0 ${tone(v)}` }, { boxShadow: '0 0 0 7px transparent' }], { duration: 700, delay, fill: 'none' });
    }
    // The status line: a spinner and a shimmer while the packet is in flight, then how the step ended.
    function say(st, text, flight) {
      const glyph = h('span', { class: 'vz-st' }), words = h('span', {}, text);
      const line = h('span', {}, st?.payload ? h('span', { class: 'vz-payload' }, st.payload) : '', st?.payload ? ' ' : '', words);
      narr.replaceChildren(glyph, line);
      if (!reduced()) line.animate([{ opacity: 0, translate: '0 5px', filter: 'blur(2px)' }, { opacity: 1, translate: '0 0', filter: 'blur(0)' }], { duration: 260, easing: EASE });
      if (!st) return;
      const land = () => {
        // The drawing theme stamps where the story ends, inverted; filtered is a dashed amber stamp, a failure coral.
        if (drawing) glyph.replaceChildren(h('span', { class: `vz-verdict${st.fail ? ' err' : st.out === 'drop' ? ' filt' : ''}` }, s.byId[st.ids[st.ids.length - 1]].label));
        else glyph.replaceChildren(st.fail ? h('span', { class: 's-fail' }, '✕') : st.out === 'drop' ? h('span', { class: 's-unk' }, '⊘') : h('span', { class: 's-ok' }, '✓'));
        words.classList.remove('vz-shim');
      };
      if (flight) { glyph.append(h('span', { class: 'vz-spin' })); words.classList.add('vz-shim'); later(flight, land); } else land();
    }
    function go(k) {
      k = Math.max(-1, Math.min(k, lastStep));
      const fwd = k >= 0 && k === step + 1 && !reduced();
      settle(); step = k; wrapEl.classList.toggle('vz-building', k >= 0);
      if (range) range.value = k + 1;
      count.textContent = `${k + 1}/${steps.length}`;
      boxes.forEach((b, i) => { b.classList.remove('done', 'now', 'nowfail'); b.classList.toggle('ghost', k >= 0 && bornN(i) > k); });
      for (const e of s.edges) for (const el of [e.path, e.hit, e.pillEl]) el?.classList.toggle('ghost', k >= 0 && bornE(e) > k);
      pkt.setAttribute('opacity', 0); pktL?.setAttribute('opacity', 0); hopG.replaceChildren();
      for (const c of storyChips) c.el.classList.toggle('on', k >= 0 && c.p === steps[k]);
      for (const d of sbars) d.el.classList.toggle('ghost', k >= 0 && !!d.e && bornE(d.e) > k);
      for (const d of spills) { d.el.classList.toggle('ghost', k >= 0 && !!d.e && bornE(d.e) > k); d.el.classList.toggle('hot', k >= 0 && !!d.e && steps[k].edges.includes(d.e)); }
      boxes.forEach((b) => { const x = b.querySelector('.vz-bx'); if (x) x.textContent = ''; });
      meterTo(k >= 0 ? steps[k].meter : null);
      if (k < 0) { say(null, drawing && s.paths.length ? overview() : `Press ▶ or → to build it ${view === 'seq' ? 'message by message' : 'path by path'}.`); restore(); return; }
      for (let j = 0; j < k; j++) for (const id of steps[j].ids) boxes[idx[id]].classList.add('done');
      const st = steps[k], last = st.ids[st.ids.length - 1], hops = st.edges, flight = reduced() ? 0 : PER * hops.length;
      pickNode(idx[last]); light(new Set(st.ids.map((id) => idx[id])), new Set(hops), s.paths.includes(st) ? new Set([st]) : null);
      say(st, st.narr || st.ids.map((id) => s.byId[id].label).join(' → '), flight);
      // `now` lands on each box as the packet reaches it.
      // The drawing theme fills only the box a failing story ends in coral; the rest of its way invert as usual.
      st.ids.forEach((id, p) => later(fwd ? p * PER : 0, () => boxes[idx[id]].classList.add(st.fail && (!drawing || p === st.ids.length - 1) ? 'nowfail' : 'now')));
      // A box the step writes into types its text as the packet reaches it.
      for (const [id, txt] of Object.entries(st.shows || {})) {
        const x = boxes[idx[id]].querySelector('.vz-bx'), at = Math.max(0, st.ids.indexOf(id)) * PER;
        if (fwd) later(at, () => typeIn(x, txt)); else x.textContent = txt;
      }
      if (drawing && view !== 'flow' && view !== 'seq') hops.forEach((e, j) => later(fwd ? j * PER + PER / 2 : 0, () => hopMark(e, j + 1)));
      if (fwd) born(k, st, flight);
      animate(hops, st.payload);
      if (fwd && k === lastStep) later(flight + 260, () => finale(st));
    }
    function typeIn(el, txt) {
      if (reduced()) { el.textContent = txt; return; }
      for (let j = 0; j <= txt.length; j++) later(j * 16, () => (el.textContent = txt.slice(0, j)));
    }
    function hopMark(e, n) {
      const len = e.path.getTotalLength(), pt = e.path.getPointAtLength(len / 2), m = svg('g', { class: 'vz-hopm', transform: `translate(${pt.x},${pt.y})` });
      const t = svg('text', {}); t.textContent = n;
      m.append(svg('circle', { r: 7 }), t); hopG.append(m);
      if (!reduced()) m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    }
    // The overview, before any story plays: how the stories end, counted.
    function overview() {
      const n = s.paths.length, c = (o) => s.paths.filter((p) => p.out === o).length;
      const bits = [[c('pass'), 'get through'], [c('drop'), 'filtered out'], [c('fail'), 'fail']].filter(([x]) => x).map(([x, w]) => `${x} ${w}`);
      return `${n} stor${n > 1 ? 'ies' : 'y'}: ${bits.join(' · ')}. A heavier line carries more of them. ${steps.length ? 'Pick a story or press ▶.' : 'Hover a box to light its stories.'}`;
    }
    function born(k, st, flight) {
      const when = new Map();
      st.ids.forEach((id, p) => { if (!when.has(idx[id])) when.set(idx[id], p * PER); });
      boxes.map((_, i) => i).filter((i) => bornN(i) === k && !when.has(i))
        .sort((a, b) => s.nodes[a].box.y - s.nodes[b].box.y || s.nodes[a].box.x - s.nodes[b].box.x)
        .forEach((i, j) => when.set(i, flight + 160 + j * 45));
      boxes.forEach((b, i) => {
        if (bornN(i) !== k) return;
        anim(b, [{ opacity: 0.13, scale: 0.94, translate: '0 6px' }, { opacity: 1, scale: 1, translate: '0 0' }], { duration: 420, delay: when.get(i) });
      });
      for (const e of s.edges) {
        if (bornE(e) !== k) continue;
        const j = st.edges.indexOf(e), d = j >= 0 ? j * PER : Math.max(when.get(idx[e.from]) ?? 0, when.get(idx[e.to]) ?? 0);
        if (j >= 0 && !e.path.getAttribute('stroke-dasharray')) {
          // A hop the packet travels draws itself under the packet; the arrowhead waits for the line.
          const len = e.path.getTotalLength(), dash = `${len} ${len}`, mk = e.rev ? 'marker-start' : 'marker-end';
          e.path.removeAttribute(mk);
          const a = anim(e.path, [{ strokeDasharray: dash, strokeDashoffset: e.rev ? -len : len }, { strokeDasharray: dash, strokeDashoffset: 0 }], { duration: PER, delay: d, easing: 'linear' });
          a.onfinish = () => paint(e, !!lit && lit.has(e));
        } else anim(e.path, [{ opacity: 0.1 }, { opacity: 1 }], { duration: 320, delay: d });
        if (e.pillEl) anim(e.pillEl, [{ opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1 }], { duration: 260, delay: d + (j >= 0 ? PER * 0.6 : 120) });
      }
    }
    // Reaching the last step forward: every box the replay visited settles green in reading order. An ending that
    // fails or is filtered out pulses only where it stopped.
    function finale(st) {
      const end = boxes[idx[st.ids[st.ids.length - 1]]];
      if (st.fail || st.out === 'drop') { pulse(end, st.fail ? '--vz-coral' : '--vz-dim', 0); return; }
      const seen = boxes.map((_, i) => i).filter((i) => nBirth.has(i))
        .sort((a, b) => s.nodes[a].box.y - s.nodes[b].box.y || s.nodes[a].box.x - s.nodes[b].box.x);
      const ok = drawing ? '--vz-fg' : '--vz-green';
      seen.forEach((i, j) => { later(j * 40, () => boxes[i].classList.add('done')); pulse(boxes[i], ok, j * 40); });
      pulse(end, ok, seen.length * 40 + 120);
    }
    function animate(es, payload) {
      if (!es.length || reduced()) return;
      if (pktL) pktL.textContent = payload || '';
      const t0 = performance.now(), per = PER, total = per * es.length, mine = step;
      const tick = (t) => {
        if (step !== mine) return;
        const f = Math.min(Math.max(t - t0, 0) / total, 0.999), e = es[Math.floor(f * es.length)], p = e.path, local = (f * es.length) % 1, len = p.getTotalLength();
        const pt = p.getPointAtLength(len * (e.rev ? 1 - local : local));
        pkt.setAttribute('cx', pt.x); pkt.setAttribute('cy', pt.y); pkt.setAttribute('opacity', 1);
        if (pktL) { pktL.setAttribute('x', pt.x + 7); pktL.setAttribute('y', pt.y - 7); pktL.setAttribute('opacity', payload ? 1 : 0); }
        if (f < 0.999) requestAnimationFrame(tick); else { pkt.setAttribute('opacity', 0); pktL?.setAttribute('opacity', 0); }
      };
      requestAnimationFrame(tick);
    }
    const stop = () => { clearTimeout(timer); timer = null; playBtn.textContent = '▶'; playBtn.setAttribute('aria-pressed', false); };
    function play() {
      if (timer) return stop();
      if (step >= lastStep) go(-1);
      playBtn.textContent = '❚❚'; playBtn.setAttribute('aria-pressed', true);
      // The next step waits for this one's packet, so a long path is never cut off mid-flight.
      const next = () => {
        go(step + 1);
        if (step < lastStep) timer = setTimeout(next, Math.max(drawing ? 2600 : 1900, PER * steps[step].edges.length + 1100));
        else { stop(); if (auto) autoT = setTimeout(() => auto && go(-1), 4500); }
      };
      next();
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
    if (drawing) {
      // Story chips, grouped by where each story starts; a chip that is a step plays it.
      const named = s.paths.filter((p) => p.named), by = new Map();
      for (const p of named) { const k = p.ids[0]; if (!by.has(k)) by.set(k, []); by.get(k).push(p); }
      const chip = (p) => {
        const k = steps.indexOf(p), el = h('button', { class: 'vz-schip', title: p.narr || p.ids.map((id) => s.byId[id].label).join(' › '),
          onclick: () => { halt(); if (k >= 0) go(k); else pickStory(p); },
          onmouseenter: () => hoverRow({ paths: [p] }), onmouseleave: () => hoverRow(null) },
        h('span', { class: `vz-o${p.out === 'fail' ? ' err' : p.out === 'drop' ? ' filt' : ''}` }, { pass: '→', drop: '⊘', fail: '✕', plain: '·' }[p.out]), p.name);
        storyChips.push({ el, p }); return el;
      };
      if (named.length) chipsEl = h('div', { class: 'vz-schips' }, ...[...by].map(([id, ps]) => h('span', { class: 'vz-cg' }, h('i', {}, s.byId[id].label), ...ps.map(chip))));
    }
    mount.append(...(drawing ? [chipsEl, wrapEl, meterEl, narr, bar, legend, coverEl, insp] : [bar, narr, wrapEl, meterEl, legend, coverEl, insp]).filter(Boolean));
    // A graph wider than its frame, or taller than about half the screen, shrinks to fit, but only down to 85%:
    // below that the labels get too small to read, so the rest scrolls. The button switches to 100% and back.
    let zoom = 1, fit = true;
    const tall = () => Math.max(420, Math.round((window.screen?.availHeight || 900) * 0.55));
    const fitBtn = h('button', { class: 'vz-fit', title: 'Fit: shrink the graph toward one screen. Full size: 100% text, more scrolling.', onclick: () => { fit = !fit; refit(); } });
    function refit() {
      const room = wrapEl.clientWidth;
      if (!room) return;
      const want = Math.min(room / L.w, tall() / L.h), fitK = Math.min(1, Math.max(0.85, Math.floor(want * 100) / 100));
      const k = fit ? fitK : 1;
      fitBtn.hidden = fitK >= 1;
      fitBtn.textContent = fit ? 'full size' : 'fit';
      if (k !== zoom) { zoom = k; stage.style.zoom = k; }
    }
    (bar || mount.insertBefore(bar = h('div', { class: 'vz-bar' }), wrapEl)).append(fitBtn);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => requestAnimationFrame(refit)).observe(wrapEl);
    if (steps.length) go(-1);
    // The drawing theme plays its stories once, a moment after it first shows, then returns to the overview.
    // Touching any control ends that.
    mount.addEventListener('pointerdown', halt, true); mount.addEventListener('keydown', halt, true);
    if (drawing && steps.length && !reduced()) {
      if (typeof IntersectionObserver === 'undefined') autoT = setTimeout(() => auto && play(), 2500);
      else {
        const io2 = new IntersectionObserver((xs) => { if (xs.some((x) => x.isIntersecting)) { io2.disconnect(); autoT = setTimeout(() => auto && play(), 2500); } });
        io2.observe(wrapEl);
      }
    } else auto = false;
    // The first time the graph scrolls into view (or its tab opens), boxes rise in reading order, then the edges.
    // A graph already on screen when it renders starts built, so a screenshot taken at load shows all of it.
    if (typeof IntersectionObserver !== 'undefined' && !reduced()) {
      let first = true;
      const io = new IntersectionObserver((xs) => {
        const seen = xs.some((x) => x.isIntersecting);
        if (seen) io.disconnect();
        if (seen && !first) enter();
        first = false;
      });
      io.observe(wrapEl);
    }
    function enter() {
      if (step >= 0) return;
      const order = boxes.map((_, i) => i).sort((a, b) => s.nodes[a].box.y - s.nodes[b].box.y || s.nodes[a].box.x - s.nodes[b].box.x);
      const gap = Math.min(22, 360 / Math.max(order.length, 1)), fade = [{ opacity: 0 }, { opacity: 1 }];
      order.forEach((i, j) => boxes[i].animate([{ opacity: 0, translate: '0 4px' }, { opacity: 1, translate: '0 0' }], { duration: 320, delay: j * gap, easing: EASE, fill: 'backwards' }));
      for (const e of s.edges) {
        e.path.animate(fade, { duration: 360, delay: 140, easing: EASE, fill: 'backwards' });
        e.pillEl?.animate(fade, { duration: 280, delay: 220, easing: EASE, fill: 'backwards' });
      }
    }
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
    const chgBtn = anyChange ? h('button', { 'aria-pressed': onlyChanged, onclick: () => { onlyChanged = !onlyChanged; chgBtn.setAttribute('aria-pressed', onlyChanged); draw(true); } }, 'changes only') : null;
    const sum = [counts.add && h('span', { class: 's-add' }, `+${counts.add}`), counts.del && h('span', { class: 's-del' }, ` −${counts.del}`), counts.mod && h('span', { class: 's-mod' }, ` ~${counts.mod}`)].filter(Boolean);
    const bar = h('div', { class: 'vz-bar' }, search, chgBtn,
      h('button', { onclick: () => { all.forEach((n) => (n.open = true)); draw(true); } }, 'expand'),
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
    // A toggle that reveals rows slides them in, staggered; filtering and the first draw do not animate.
    function draw(reveal) {
      for (const nd of all) nd._k = null;
      const before = new Set(visible), fresh = [];
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
        row.addEventListener('click', (ev) => { const flip = ev.target.classList.contains('vz-car') || nd === sel; if (flip) nd.open = !nd.open; pick(nd); draw(flip); });
        if (reveal && !before.has(nd)) fresh.push(row);
        frag.append(row);
        if (open) kidsShown.forEach(emit);
      };
      s.root.kids.forEach(emit);
      box.replaceChildren(frag);
      if (reveal && !reduced()) fresh.slice(0, 24).forEach((r, j) => r.animate([{ opacity: 0, translate: '-4px 0' }, { opacity: 1, translate: '0 0' }], { duration: 200, delay: j * 14, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' }));
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
      else if (sel && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft' || ev.key === 'Enter')) { sel.open = ev.key === 'Enter' ? !sel.open : ev.key === 'ArrowRight'; draw(true); }
      else return;
      ev.preventDefault();
    });
    draw();
    mount.append(bar, box, detail);
    // Reserve the first draw's height so the host frame does not jump as rows collapse. Counted from rows, not
    // measured: a tree in a hidden tab measures 0 px tall.
    box.style.minHeight = Math.min(visible.length * 20 + 2, 460) + 'px';
  }

  /* ---------- charts: timing, gantt, causes, board, stock, and view: sankey ---------- */
  // Each chart parses its own lines and draws one SVG that scales to its frame, with a readout top right and a
  // detail line under it. Colour keeps the graph's meaning: green ok, coral fails, amber in progress or at risk.
  const TONE = { ok: 'var(--vz-green)', fail: 'var(--vz-coral)', warn: 'var(--vz-amber)', unk: 'var(--vz-dim)', hl: 'var(--vz-hl)' };
  const tw = (t, fs = 11) => (String(t).length * cw() * fs) / FS;
  const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(Math.abs(v) >= 10 ? 0 : 2)));
  const kfmt = (v) => (Math.abs(v) >= 1000 ? `${+(v / 1000).toFixed(1)}k` : fmt(v));
  const range2 = /^(-?\d*\.?\d+)\s*\.\.\s*(-?\d*\.?\d+)/;
  function tx(x, y, t, cls, a = {}) { const e = svg('text', { x, y, class: cls, ...a }); e.textContent = t; return e; }
  function ticks(lo, hi, n = 8) {
    const raw = (hi - lo) / n || 1, p = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((x) => x >= raw);
    const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(+v.toFixed(6));
    return out;
  }
  const refC = (doc, ref) => h('code', { title: 'copy path', onclick: () => navigator.clipboard?.writeText((doc.base || '') + ref).catch(() => {}) }, (doc.base || '') + ref);
  const tell = (el, ...parts) => el.replaceChildren(...parts.filter((x) => x != null && x !== '').flatMap((x, j) => (j ? [' · ', x] : [x])));
  function shell(s, mount, W, H) {
    const ro1 = h('b', {}), ro2 = h('span', {});
    mount.append(h('div', { class: 'vz-ctop' }, s.tabbed ? null : h('span', { class: 'vz-cname' }, s.name), h('div', { class: 'vz-ro', 'aria-live': 'polite' }, ro1, ro2)));
    const g = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': s.name });
    g.style.maxWidth = W + 'px';
    const wrap = h('div', { class: 'vz-cx' }); wrap.append(g); mount.append(wrap);
    const detail = h('div', { class: 'vz-detail', 'aria-live': 'polite' });
    const ro = (a, b, tone) => { ro1.textContent = a; ro2.textContent = b || ''; ro1.style.color = tone ? TONE[tone] : ''; };
    // Pointer x in chart units.
    const at = (ev) => { const r = g.getBoundingClientRect(); return ((ev.clientX - r.left) * W) / r.width; };
    return { g, ro, detail, at };
  }
  const lineErr = (errors, n, what, t) => errors.push(`line ${n}: not ${what}: ${t}`);

  // timing: lanes over one time axis. A lane's indented line lists `time label` segments; `(label)` is a quiet
  // stretch drawn as a wire. `!name: a..b text` shades a window across every lane.
  function parseTiming(s, errors) {
    s.lanes = []; s.marks = []; s.unit = ''; s.lo = null; s.hi = null;
    let lane = null;
    for (const { raw, n } of s.lines) {
      const t = raw.trim();
      const ax = /^\S/.test(raw) && t.match(/^axis:\s*([^\d\s.-]\S*)?\s*(?:(-?\d*\.?\d+)\s*\.\.\s*(-?\d*\.?\d+))?\s*$/);
      if (ax) { s.unit = ax[1] || ''; if (ax[2] != null) { s.lo = +ax[2]; s.hi = +ax[3]; } continue; }
      if (/^\s/.test(raw)) {
        if (!lane) { errors.push(`line ${n}: segments before any lane`); continue; }
        for (const part of t.split('|').map((x) => x.trim()).filter(Boolean)) {
          const m = part.match(/^(-?\d*\.?\d+)\s*(.*)$/);
          if (!m) { errors.push(`line ${n}: a segment is "time label": ${part}`); continue; }
          let { tone, text } = toned(m[2].trim());
          const quiet = /^\(.*\)$/.test(text); if (quiet) text = text.slice(1, -1).trim();
          if (lane.segs.length && +m[1] <= lane.segs[lane.segs.length - 1].t) errors.push(`line ${n}: segment times must increase: ${part}`);
          lane.segs.push({ t: +m[1], label: text, tone, quiet });
        }
        continue;
      }
      const mk = t.match(/^([+!*~?]?)([\w.$-]+):\s*(-?\d*\.?\d+)\s*\.\.\s*(-?\d*\.?\d+)\s*(.*)$/);
      if (mk) { s.marks.push({ tone: PRE[mk[1]] || 'warn', name: mk[2], a: +mk[3], b: +mk[4], text: mk[5].trim(), n }); lane = null; continue; }
      const ln = t.match(/^([\w.$-]+):\s*(.*)$/);
      if (ln) { const { rest, ref, note } = splitTail(ln[2]); lane = { id: ln[1], label: rest || ln[1], ref, note, segs: [], n }; s.lanes.push(lane); continue; }
      lineErr(errors, n, 'a lane (id: Label), its segments (  0 idle | 40 read), a window (!name: 90..280 text) or axis: ms 0..400', t);
    }
    for (const l of s.lanes) if (!l.segs.length) errors.push(`line ${l.n}: lane "${l.id}" has no segments; list them on the indented line under it`);
    s.lanes = s.lanes.filter((l) => l.segs.length);
    if (!s.lanes.length) errors.push(`${s.name}: a timing chart needs a lane`);
  }
  function renderTiming(s, doc, mount) {
    if (!s.lanes.length) return;
    const ts = s.lanes.flatMap((l) => l.segs.map((x) => x.t)), ms2 = s.marks.flatMap((m) => [m.a, m.b]);
    const lo = s.lo ?? Math.min(...ts, ...ms2), far = Math.max(...ts, ...ms2);
    const hi = s.hi ?? (far + (far - lo) * 0.12 || lo + 1);
    for (const l of s.lanes) l.segs.forEach((x, j) => { x.b = j + 1 < l.segs.length ? l.segs[j + 1].t : hi; });
    const LW = Math.ceil(Math.max(56, ...s.lanes.map((l) => tw(l.label, 10) * 1.25 + 12)));
    const W = 720, X0 = LW + 6, X1 = W - 8, RH = 34, X = (t) => X0 + ((t - lo) / (hi - lo)) * (X1 - X0), ends = [];
    for (const m of s.marks) { const a = X(m.a) + 6, b = a + tw(m.text || m.name, 10) + 10; m.row = ends.findIndex((e) => e < a); if (m.row < 0) m.row = ends.length; ends[m.row] = b; }
    const T = s.marks.length ? 12 + ends.length * 14 : 8, yA = T + s.lanes.length * RH + 4, H = yA + 22;
    const { g, ro, detail, at } = shell(s, mount, W, H);
    for (const m of s.marks) {
      const c = TONE[m.tone];
      g.append(svg('rect', { x: X(m.a), y: 4 + m.row * 14, width: Math.max(2, X(m.b) - X(m.a)), height: yA - 4 - m.row * 14, style: `fill:color-mix(in srgb,${c} 12%,transparent);stroke:${c}`, 'stroke-dasharray': '3 3' }),
        tx(X(m.a) + 6, 15 + m.row * 14, m.text || m.name, 'vz-td vz-sl', { style: `fill:${c};font-size:10px` }));
    }
    const showLane = (l) => tell(detail, h('b', {}, l.label), l.ref ? refC(doc, l.ref) : null, l.note, l.segs.map((x) => `${fmt(x.t)} ${x.label || '·'}`).join(' → '));
    s.lanes.forEach((l, i) => {
      const y = T + i * RH, name = tx(0, y + 19, l.label, 'vz-tc vz-crow');
      name.addEventListener('click', () => showLane(l)); g.append(name);
      for (const x of l.segs) {
        const x1 = X(x.t), w = X(x.b) - x1, c = x.tone ? TONE[x.tone] : '';
        x.el = x.quiet ? svg('line', { x1, x2: x1 + w, y1: y + 16, y2: y + 16, class: 'vz-wr', style: c ? `stroke:${c}` : '' })
          : svg('rect', { x: x1, y: y + 4, width: Math.max(1, w), height: 22, class: 'vz-bx', style: c ? `stroke:${c}` : '', ...(x.tone === 'unk' ? { 'stroke-dasharray': '3 3' } : {}) });
        g.append(x.el);
        if (x.label && w > tw(x.label) + 10) g.append(tx(x1 + 6, x.quiet ? y + 11 : y + 19, x.label, x.quiet ? 'vz-td' : 'vz-bt', x.tone === 'fail' ? { style: `fill:${c}` } : {}));
      }
    });
    g.append(svg('line', { x1: X0, x2: X1, y1: yA, y2: yA, class: 'vz-ln' }));
    for (const v of ticks(lo, hi, 8)) g.append(svg('line', { x1: X(v), x2: X(v), y1: yA, y2: yA + 4, class: 'vz-ln' }), tx(X(v), yA + 16, fmt(v), 'vz-td', { 'text-anchor': 'middle' }));
    if (s.unit) g.append(tx(X0 - 10, yA + 16, s.unit, 'vz-td', { 'text-anchor': 'end' }));
    const cur = svg('line', { y1: 2, y2: yA, stroke: 'var(--vz-hl)', 'stroke-width': 1.5 }), dot = svg('circle', { r: 4, cy: yA, fill: 'var(--vz-hl)' });
    const hit = svg('rect', { x: X0, y: 0, width: X1 - X0, height: yA, class: 'vz-hitc' });
    g.append(cur, dot, hit);
    const segAt = (l, t) => l.segs.find((x) => t >= x.t && t < x.b) || (t >= hi ? l.segs[l.segs.length - 1] : null);
    const range = h('input', { type: 'range', min: lo, max: hi, step: (hi - lo) / 400, value: lo, 'aria-label': 'time' });
    let now = lo, raf = 0;
    function set(t) {
      now = t = Math.max(lo, Math.min(hi, t)); range.value = t;
      cur.setAttribute('x1', X(t)); cur.setAttribute('x2', X(t)); dot.setAttribute('cx', X(t));
      const on = s.marks.filter((m) => t >= m.a && t <= m.b);
      ro(`t = ${fmt(+t.toFixed(1))}${s.unit ? ' ' + s.unit : ''}`, on.length ? on.map((m) => m.text || m.name).join(' · ') : 'hover, drag or ▶', on.find((m) => m.tone === 'fail') ? 'fail' : on.length ? on[0].tone : '');
      for (const l of s.lanes) for (const x of l.segs) x.el.classList.toggle('on', segAt(l, t) === x);
      detail.replaceChildren(...s.lanes.flatMap((l, j) => { const x = segAt(l, t); return [j ? ' · ' : '', h('b', {}, l.label), ' ', h('span', { class: x?.tone ? 'q-' + x.tone : '' }, x?.label || '·')]; }));
    }
    const playB = h('button', { 'aria-label': 'play', onclick: () => (raf ? stop() : play()) }, '▶');
    function stop() { cancelAnimationFrame(raf); raf = 0; playB.textContent = '▶'; }
    function play() {
      const from = now >= hi ? lo : now, t0 = performance.now(), dur = reduced() ? 1 : 4200;
      playB.textContent = '❚❚';
      const f = (n2) => { const t = from + ((hi - lo) * (n2 - t0)) / dur; set(t); if (t < hi) raf = requestAnimationFrame(f); else stop(); };
      raf = requestAnimationFrame(f);
    }
    range.addEventListener('input', () => { stop(); set(+range.value); });
    hit.addEventListener('mousemove', (ev) => { if (raf) return; set(lo + ((at(ev) - X0) / (X1 - X0)) * (hi - lo)); });
    mount.append(h('div', { class: 'vz-bar' }, playB, range), detail);
    const m0 = s.marks.find((m) => m.tone === 'fail') || s.marks[0];
    set(m0 ? (m0.a + m0.b) / 2 : lo);
  }

  // gantt: one bar per row, `a..b` or a duration `after` other rows. The critical path (the chain that ends last)
  // is filled; slack before the next row that waits on a bar is dotted; `budget:` draws a limit.
  function parseGantt(s, errors) {
    s.rows = []; s.unit = ''; s.budget = null;
    for (const { raw, n } of s.lines) {
      const t = raw.trim();
      const f = /^\S/.test(raw) && t.match(/^(axis|budget):\s*(.*)$/);
      if (f) { if (f[1] === 'axis') s.unit = f[2].trim(); else s.budget = parseFloat(f[2]); continue; }
      const m = t.match(/^([+!*~?]?)([\w.$-]+):\s*(.*)$/);
      if (!m) { lineErr(errors, n, 'a row (id: Label 0..30, or id: Label 32ms after other)', t); continue; }
      let { rest, ref, note } = splitTail(m[3]), was = null;
      rest = rest.replace(/\s+was\s+(?:(-?\d*\.?\d+)\s*\.\.\s*(-?\d*\.?\d+)|(\d*\.?\d+)\s*[a-zµ]*)\s*$/i, (_, a, b, d) => { was = a != null ? { a: +a, b: +b } : { dur: +d }; return ''; });
      const tm = rest.match(/^(?:(.*?)\s+)?(?:(-?\d*\.?\d+)\s*\.\.\s*(-?\d*\.?\d+)|(\d*\.?\d+)\s*[a-zµ]*)(?:\s+after\s+(.+))?$/i);
      if (!tm) { errors.push(`line ${n}: row "${m[2]}" wants a..b or a duration, then an optional "after id, id": ${t}`); continue; }
      s.rows.push({ id: m[2], st: PRE[m[1]] || '', label: (tm[1] || '').trim() || m[2], a: tm[2] != null ? +tm[2] : null, b: tm[3] != null ? +tm[3] : null, dur: tm[4] != null ? +tm[4] : 0,
        after: (tm[5] || '').split(/\s*,\s*/).filter(Boolean), ref, note, was, n });
    }
    const by = Object.fromEntries(s.rows.map((r) => [r.id, r]));
    for (const r of s.rows) { for (const d of r.after) if (!by[d]) errors.push(`line ${r.n}: "${r.id}" runs after "${d}", which no row declares`); r.after = r.after.filter((d) => by[d]); }
    const done = new Set(), busy = new Set();
    const solve = (r) => {
      if (done.has(r)) return;
      if (busy.has(r)) { errors.push(`line ${r.n}: "${r.id}" waits on itself through after:`); r.after = []; }
      busy.add(r); r.after.forEach((d) => solve(by[d])); busy.delete(r);
      if (r.a == null) { r.a = r.after.length ? Math.max(...r.after.map((d) => by[d].b ?? 0)) : 0; r.b = r.a + r.dur; }
      done.add(r);
    };
    s.rows.forEach(solve);
    if (!s.rows.length) { errors.push(`${s.name}: a gantt chart needs a row`); return; }
    // The old run (rows with `was`): same chain, old durations; a row without `was` kept its duration.
    s.cmp = s.rows.some((r) => r.was);
    if (s.cmp) {
      const od = new Set();
      const old = (r) => {
        if (od.has(r)) return; od.add(r); r.after.forEach((d) => old(by[d]));
        if (r.was?.a != null) { r.oa = r.was.a; r.ob = r.was.b; return; }
        const dur = r.was ? r.was.dur : r.b - r.a;
        r.oa = r.after.length ? Math.max(...r.after.map((d) => by[d].ob)) : r.a; r.ob = r.oa + dur;
      };
      s.rows.forEach(old);
      s.oend = Math.max(...s.rows.map((r) => r.ob));
    }
    s.end = Math.max(...s.rows.map((r) => r.b));
    // Critical path: from the row that ends last, back through whichever row it waits on ends latest.
    s.crit = new Set();
    for (let r = [...s.rows].reverse().find((x) => x.b === s.end); r; r = r.after.map((d) => by[d]).sort((a, b) => b.b - a.b)[0]) { if (s.crit.has(r)) break; s.crit.add(r); }
    const linked = s.rows.some((r) => r.after.length);
    for (const r of s.rows) {
      const next = s.rows.filter((x) => x.after.includes(r.id));
      r.slack = s.crit.has(r) || !linked ? 0 : (next.length ? Math.min(...next.map((x) => x.a)) : s.end) - r.b;
    }
    s.by = by;
  }
  function renderGantt(s, doc, mount) {
    if (!s.rows.length) return;
    const lo = Math.min(0, ...s.rows.map((r) => r.a)), hi = Math.max(s.end, s.oend || 0, s.budget || 0) * (s.cmp ? 1.1 : 1.04) || 1, u = s.unit ? ' ' + s.unit : '';
    const LW = Math.ceil(Math.max(60, ...s.rows.map((r) => tw(r.label) + 12)));
    const W = 720, X0 = LW + 8, X1 = W - 12, RH = 25, T = s.budget != null ? 18 : 6, yA = T + s.rows.length * RH, H = yA + 34;
    const X = (t) => X0 + ((t - lo) / (hi - lo)) * (X1 - X0);
    const { g, ro, detail } = shell(s, mount, W, H);
    for (const v of ticks(lo, hi, 7)) g.append(svg('line', { x1: X(v), x2: X(v), y1: T - 4, y2: yA, class: 'vz-gd' }), tx(X(v), yA + 14, fmt(v), 'vz-td', { 'text-anchor': 'middle' }));
    if (s.unit) g.append(tx(X0 - 8, yA + 14, s.unit, 'vz-td', { 'text-anchor': 'end' }));
    const rowEls = new Map();
    const chain = (r, acc = new Set()) => { acc.add(r); r.after.forEach((d) => chain(s.by[d], acc)); return acc; };
    function focus(r) {
      const keep = r ? chain(r) : null;
      for (const [x, el] of rowEls) el.classList.toggle('dim', !!keep && !keep.has(x));
      if (!r) { tell(detail, h('span', { class: 'vz-hint' }, 'Hover a bar: what it waits on, its slack, and where it lives.')); return; }
      tell(detail, h('b', {}, r.label), `${fmt(r.a)}..${fmt(r.b)}${u} (${fmt(r.b - r.a)}${u})`, r.after.length ? 'after ' + r.after.map((d) => s.by[d].label).join(', ') : null,
        s.crit.has(r) ? 'on the critical path' : r.slack > 0 ? `slack ${fmt(r.slack)}${u}` : null, s.cmp ? `was ${fmt(r.oa)}..${fmt(r.ob)}${u} (${fmt(r.ob - r.oa)}${u})` : null, r.ref ? refC(doc, r.ref) : null, r.note);
    }
    s.rows.forEach((r, i) => {
      const y = T + i * RH + 3, crit = s.crit.has(r) && (s.crit.size > 1 || s.rows.length === 1 || s.rows.some((x) => x.after.length)), c = r.st ? TONE[r.st] : '';
      const row = svg('g', { class: 'vz-crow' }), bw = Math.max(3, X(r.b) - X(r.a)), lab = fmt(r.b - r.a) + u, inside = bw > tw(lab) + 10;
      row.append(svg('rect', { x: 0, y: y - 3, width: W, height: RH, fill: 'transparent' }), tx(0, y + 13, r.label, crit ? 'vz-tx' : 'vz-td'));
      if (r.slack > 0) {
        const sx = X(r.b) + (inside ? 0 : tw(lab) + 10), ex = X(r.b + r.slack);
        if (ex > sx + 4) row.append(svg('line', { x1: sx, x2: ex, y1: y + 9, y2: y + 9, class: 'vz-wr', 'stroke-dasharray': '1 3' }));
        if (ex - sx > tw(`slack ${fmt(r.slack)}`, 9.5) + 12) row.append(tx(sx + 6, y + 5, `slack ${fmt(r.slack)}`, 'vz-td vz-small'));
      }
      if (s.cmp) row.append(svg('rect', { x: X(r.oa), y: y - 2, width: Math.max(3, X(r.ob) - X(r.oa)), height: 22, fill: 'none', stroke: 'var(--vz-dim)', 'stroke-dasharray': '3 2' }));
      row.append(svg('rect', { x: X(r.a), y, width: bw, height: 18, class: 'vz-bx', style: crit ? `fill:${c || 'var(--vz-hl)'};stroke:${c || 'var(--vz-hl)'}` : c ? `stroke:${c}` : '', ...(r.st === 'unk' ? { 'stroke-dasharray': '3 3' } : {}) }));
      const lt = inside ? tx(X(r.a) + 6, y + 13, lab, 'vz-bt', crit ? { style: 'fill:var(--vz-hlfg)' } : {}) : tx(Math.max(X(r.b), s.cmp ? X(r.ob) : 0) + 5, y + 13, lab, 'vz-td');
      const dd = s.cmp ? (r.b - r.a) - (r.ob - r.oa) : 0;
      row.append(lt);
      // The change against the old run sits right of both bars, in the colour of its direction.
      if (dd) row.append(tx(Math.max(X(r.b), X(r.ob)) + 5 + (inside ? 0 : tw(lab) + 6), y + 13, `${dd > 0 ? '+' : '−'}${fmt(Math.abs(dd))}`, 'vz-td', { style: `fill:${dd > 0 ? 'var(--vz-coral)' : 'var(--vz-green)'}` }));
      row.addEventListener('mouseenter', () => focus(r)); row.addEventListener('mouseleave', () => focus(null)); row.addEventListener('click', () => focus(r));
      rowEls.set(r, row); g.append(row);
    });
    if (s.budget != null) {
      g.append(svg('line', { x1: X(s.budget), x2: X(s.budget), y1: T - 6, y2: yA + 2, stroke: 'var(--vz-coral)', 'stroke-dasharray': '4 3', 'stroke-width': 1.3 }),
        tx(X(s.budget) - 5, T - 8, `budget ${fmt(s.budget)}${u}`, 'vz-td', { 'text-anchor': 'end', style: 'fill:var(--vz-coral)' }));
    }
    if (s.crit.size > 1 || s.cmp) g.append(tx(X1, yA + 30, [s.crit.size > 1 && 'filled = critical path', s.cmp && 'dashed = was'].filter(Boolean).join(' · '), 'vz-tc', { 'text-anchor': 'end' }));
    const over = s.budget != null && s.end > s.budget;
    ro(`${fmt(s.end)}${u}${s.cmp ? ` · was ${fmt(s.oend)} (${s.end >= s.oend ? '+' : '−'}${fmt(Math.abs(s.end - s.oend))})` : ''}`, s.budget != null ? `budget ${fmt(s.budget)} · ${over ? 'over by ' + fmt(s.end - s.budget) : fmt(s.budget - s.end) + ' to spare'}` : s.crit.size > 1 ? `critical: ${[...s.crit].reverse().map((r) => r.label).join(' → ')}` : '', over ? 'fail' : '');
    mount.append(detail); focus(null);
  }

  // causes: a fishbone. `-- family` lines open a bone; under each, `+id` is ruled in, `-id` ruled out, a plain or
  // `?id` still open. `effect: what happened # was what` labels the head.
  function parseCauses(s, errors) {
    s.fams = []; s.effect = null;
    let fam = null;
    for (const { raw, n } of s.lines) {
      const t = raw.trim();
      const ef = t.match(/^effect:\s*(.*)$/);
      if (ef) { const { rest, note } = splitTail(ef[1]); s.effect = { label: rest, note }; continue; }
      const fm = t.match(/^--\s+(.+)$/);
      if (fm) { fam = { label: fm[1].trim(), causes: [] }; s.fams.push(fam); continue; }
      const c = t.match(/^([+\-?]?)([\w.$-]+):\s*(.*)$/);
      if (c) {
        if (!fam) { errors.push(`line ${n}: cause "${c[2]}" comes before any -- family line`); continue; }
        const { rest, ref, note } = splitTail(c[3]);
        fam.causes.push({ id: c[2], st: { '+': 'in', '-': 'out' }[c[1]] || 'open', label: rest || c[2], ref, note, fam, n }); continue;
      }
      lineErr(errors, n, 'a family (-- deploy), a cause (+id: label # why), or effect:', t);
    }
    if (!s.fams.length) errors.push(`${s.name}: a causes chart needs a -- family line`);
  }
  function renderCauses(s, doc, mount) {
    if (!s.fams.length) return;
    const all = s.fams.flatMap((f) => f.causes), K = Math.max(1, ...s.fams.map((f) => f.causes.length));
    const per = Math.ceil(s.fams.length / 2), maxT = Math.max(80, ...all.map((c) => tw(c.label) + 16));
    const SP = Math.ceil(maxT + 30), BH = Math.max(84, K * 30 + 24), DX = Math.round(BH * 0.75), SY = BH + 46;
    const eff = s.effect || { label: s.name.length <= 24 ? s.name : 'the effect', note: '' };
    const EW = Math.ceil(Math.max(110, tw(eff.label, 12) + 26, tw(eff.note || '') + 26));
    const base = (j) => DX + 40 + j * SP, EX = Math.ceil(base(per - 1) + maxT * 0.8 + 10), W = EX + EW + 4, H = 2 * SY;
    const { g, ro, detail } = shell(s, mount, W, H);
    const GLYPH = { in: '●', out: '✕', open: '○' }, COL = { in: 'var(--vz-coral)', out: 'var(--vz-dim)', open: 'var(--vz-amber)' }, WORD = { in: 'ruled in', out: 'ruled out', open: 'open' };
    g.append(svg('line', { x1: 24, x2: EX - 2, y1: SY, y2: SY, class: 'vz-ln', 'stroke-width': 2 }), svg('path', { d: `M${EX - 10},${SY - 5} L${EX - 1},${SY} L${EX - 10},${SY + 5}`, class: 'vz-ln', 'stroke-width': 2 }));
    g.append(svg('rect', { x: EX, y: SY - 30, width: EW, height: 60, class: 'vz-bx' }), tx(EX + EW / 2, SY + (eff.note ? -2 : 4), eff.label, 'vz-bt vz-big', { 'text-anchor': 'middle' }));
    if (eff.note) g.append(tx(EX + EW / 2, SY + 16, eff.note, 'vz-bd', { 'text-anchor': 'middle' }));
    const show = (c) => tell(detail, h('span', { style: `color:${COL[c.st]}` }, `${GLYPH[c.st]} ${WORD[c.st]}`), h('b', {}, c.label), c.fam.label, c.ref ? refC(doc, c.ref) : null, c.note);
    s.fams.forEach((f, i) => {
      const up = i % 2 === 0, j = Math.floor(i / 2), x0 = base(j), x1 = x0 - DX, y1 = up ? SY - BH : SY + BH;
      g.append(svg('line', { x1: x0, y1: SY, x2: x1, y2: y1, class: 'vz-ln', 'stroke-width': 1.3 }));
      const fw = tw(f.label, 10) * 1.2 + 16;
      g.append(svg('rect', { x: x1 - fw / 2, y: up ? y1 - 20 : y1 + 2, width: fw, height: 18, class: 'vz-bx' }), tx(x1, up ? y1 - 7 : y1 + 15, f.label, 'vz-bt vz-cap2', { 'text-anchor': 'middle' }));
      const n = f.causes.length;
      f.causes.forEach((c, k) => {
        const fr = n === 1 ? 0.55 : 0.24 + (k * 0.66) / (n - 1), px = x0 + (x1 - x0) * fr, py = SY + (y1 - SY) * fr;
        const el = svg('g', { class: `vz-cause c-${c.st}`, tabindex: 0 });
        el.append(svg('rect', { x: px - 6, y: py - 10, width: tw(c.label) + 26, height: 20, fill: 'transparent' }), tx(px, py + 4, GLYPH[c.st], 'vz-tx', { 'text-anchor': 'middle', style: `fill:${COL[c.st]}` }), tx(px + 11, py + 4, c.label, c.st === 'out' ? 'vz-td vz-struck' : 'vz-tx vz-sl'));
        for (const ev of ['mouseenter', 'focus', 'click']) el.addEventListener(ev, () => show(c));
        g.append(el);
      });
    });
    const cnt = (st) => all.filter((c) => c.st === st).length;
    ro(`${cnt('in')} in · ${cnt('out')} out`, `${cnt('open')} still open`, cnt('in') ? 'fail' : '');
    tell(detail, h('span', { class: 'vz-hint' }, '● ruled in · ✕ ruled out · ○ open: hover a cause for why and where'));
    mount.append(detail);
  }

  // board: `columns: a | b 3 | c` (a number is the WIP limit), `-- column` before its cards. `!id` is blocked,
  // `+id` done, `?id` not started; `progress: 0.4` under a card draws a bar; other `key: value` lines show on click.
  function parseBoard(s, errors) {
    s.cols = [];
    let col = null, card = null;
    for (const { raw, n } of s.lines) {
      const t = raw.trim();
      const cl = /^\S/.test(raw) && t.match(/^columns:\s*(.*)$/);
      if (cl) { s.cols = cl[1].split('|').map((x) => x.trim()).filter(Boolean).map((x) => { const m = x.match(/^(.*?)\s+(\d+)$/); return { label: m ? m[1] : x, wip: m ? +m[2] : 0, cards: [] }; }); continue; }
      const gm = t.match(/^--\s+(.+)$/);
      if (gm) { col = s.cols.find((c) => c.label.toLowerCase() === gm[1].trim().toLowerCase()) || null; if (!col) errors.push(`line ${n}: "-- ${gm[1].trim()}" is not in columns: ${s.cols.map((c) => c.label).join(' | ') || '(none)'}`); card = null; continue; }
      const dt = raw.match(/^\s+([\w-]+):\s*(.*)$/);
      if (dt) {
        if (!card) { errors.push(`line ${n}: detail before any card`); continue; }
        if (dt[1] === 'progress') { const v = parseFloat(dt[2]); card.progress = Math.max(0, Math.min(1, /%/.test(dt[2]) || v > 1 ? v / 100 : v)); } else card.info.push([dt[1], dt[2].trim()]);
        continue;
      }
      const cm = t.match(/^([+!*~?]?)([\w.$-]+):\s*(.*)$/);
      if (cm) {
        if (!col) { errors.push(`line ${n}: card "${cm[2]}" comes before any -- column line`); card = null; continue; }
        const { rest, ref, note } = splitTail(cm[3]);
        card = { id: cm[2], st: PRE[cm[1]] || '', label: rest || cm[2], ref, note, info: [], progress: null, col, n }; col.cards.push(card); continue;
      }
      lineErr(errors, n, 'columns:, a column (-- name), a card (id: Label # note) or a detail under it', t);
    }
    if (!s.cols.length) errors.push(`${s.name}: a board needs a columns: line`);
  }
  function renderBoard(s, doc, mount) {
    if (!s.cols.length) return;
    const all = s.cols.flatMap((c) => c.cards), last = s.cols[s.cols.length - 1], blocked = all.filter((c) => c.st === 'fail');
    const ro1 = h('b', {}, `${last.cards.length} of ${all.length} ${last.label}`), full = s.cols.filter((c) => c.wip && c.cards.length >= c.wip);
    const ro2 = h('span', {}, [blocked.length ? `${blocked.length} blocked` : null, ...full.map((c) => `${c.label} ${c.cards.length > c.wip ? 'over' : 'at'} its WIP limit`)].filter(Boolean).join(' · '));
    if (blocked.length) ro1.style.color = TONE.fail;
    mount.append(h('div', { class: 'vz-ctop' }, s.tabbed ? null : h('span', { class: 'vz-cname' }, s.name), h('div', { class: 'vz-ro' }, ro1, ro2)));
    const detail = h('div', { class: 'vz-detail', 'aria-live': 'polite' }, h('span', { class: 'vz-hint' }, 'Click a card for its detail.'));
    const els = [];
    const pick = (c, el) => {
      els.forEach((x) => x.classList.toggle('sel', x === el));
      tell(detail, h('b', {}, c.label), c.col.label + (c.st === 'fail' ? ', blocked' : ''), c.progress != null ? `${Math.round(c.progress * 100)}%` : null, c.note,
        ...c.info.map(([k, v]) => `${k}: ${v}`), c.ref ? refC(doc, c.ref) : null,
        c.st === 'fail' && c.col.wip && c.col.cards.length >= c.col.wip ? `${c.col.label} is full, so the cards waiting before it stay put` : null);
    };
    const grid = h('div', { class: 'vz-kb', style: `grid-template-columns:repeat(${s.cols.length},minmax(130px,1fr))` }, ...s.cols.map((col) => {
      const n = col.cards.length, lim = col.wip ? `${n}/${col.wip}` : String(n);
      return h('div', { class: 'vz-col' }, h('h4', {}, h('span', {}, col.label), h('span', { class: col.wip && n > col.wip ? 'over' : col.wip && n === col.wip ? 'full' : '', title: col.wip ? `WIP limit ${col.wip}` : null }, col.wip ? 'WIP ' + lim : lim)),
        ...col.cards.map((c) => {
          const el = h('div', { class: `vz-card${c.st ? ' q-' + c.st : ''}`, role: 'button', tabindex: 0, 'data-viz-id': c.id },
            c.label, c.note ? h('small', {}, (c.st === 'fail' ? 'blocked · ' : '') + c.note) : c.st === 'fail' ? h('small', {}, 'blocked') : null,
            c.progress != null ? h('div', { class: 'vz-pb' }, h('i', { style: `width:${c.progress * 100}%` })) : null);
          el.addEventListener('click', () => pick(c, el)); el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { pick(c, el); ev.preventDefault(); } });
          els.push(el); return el;
        }));
    }));
    mount.append(h('div', { class: 'vz-cx' }, grid), detail);
  }

  // stock: one value over time, as a level in a tank and a line through meter bands. Each point is
  // `label value [| in 9k/min | out 2k/min] [# note]`; flows carry forward until a point changes them.
  function parseStock(s, errors) {
    s.pts = []; s.unit = ''; s.meter = null; s.stock = null;
    for (const { raw, n } of s.lines) {
      const t = raw.trim();
      const f = /^\S/.test(raw) && t.match(/^(unit|meter|stock):\s*(.*)$/);
      if (f) {
        if (f[1] === 'unit') s.unit = f[2].trim();
        else if (f[1] === 'meter') s.meter = parseMeter(f[2], n, errors);
        else { const { rest, ref, note } = splitTail(f[2]); s.stock = { label: rest, ref, note }; }
        continue;
      }
      const { rest, note } = splitTail(t), [head, ...extra] = rest.split('|').map((x) => x.trim());
      const m = head.match(/^(\S+)\s+(-?\d*\.?\d+)$/);
      if (!m) { lineErr(errors, n, 'a point (label value | in 9k/min | out 2k/min # note), unit:, stock: or meter:', t); continue; }
      s.pts.push({ x: m[1], v: +m[2], kv: extra.filter(Boolean).map((x) => { const k = x.match(/^([^\s:]+):?\s+(.*)$/); return k ? [k[1], k[2]] : [x, '']; }), note, n });
    }
    if (s.pts.length < 2) errors.push(`${s.name}: a stock chart needs at least two points`);
    const cur = new Map();
    for (const p of s.pts) { for (const [k, v] of p.kv) cur.set(k, v); p.state = [...cur]; }
  }
  function renderStock(s, doc, mount) {
    if (s.pts.length < 2) return;
    const vs = s.pts.map((p) => p.v), mt = s.meter?.ticks, u = s.unit;
    const lo = mt ? Math.min(mt[0].v, ...vs) : Math.min(0, ...vs), hi = mt ? Math.max(mt[mt.length - 1].v, ...vs) : Math.max(...vs) * 1.12 || 1;
    const bandW = mt ? Math.max(...mt.slice(0, -1).map((t) => tw(t.label, 10) * 1.2)) + 14 : 0;
    const W = 720, TK = 40, C0 = 160, C1 = W - Math.max(16, bandW), T = 14, B = 172, H = 204;
    const X = (i) => C0 + (i / (s.pts.length - 1)) * (C1 - C0), Y = (v) => B - ((v - lo) / (hi - lo)) * (B - T);
    const { g, ro, detail, at } = shell(s, mount, W, H);
    // A band's colour: the first is fine, the last is the worst, any between is at risk.
    const bands = mt ? mt.slice(0, -1).map((t, j) => ({ a: t.v, b: mt[j + 1].v, label: t.label, tone: j === 0 ? 'ok' : j === mt.length - 2 ? 'fail' : 'warn' })) : [];
    for (const b of bands) {
      g.append(svg('rect', { x: C0, y: Y(b.b), width: C1 - C0, height: Y(b.a) - Y(b.b), style: `fill:color-mix(in srgb,${TONE[b.tone]} ${b.tone === 'ok' ? 6 : 10}%,transparent)` }),
        tx(C1 + 8, (Y(b.a) + Y(b.b)) / 2 + 4, b.label, 'vz-tc', b.tone === 'ok' ? {} : { style: `fill:${TONE[b.tone]}` }));
    }
    for (const t of mt ? mt.slice(1, -1) : ticks(lo, hi, 4)) g.append(svg('line', { x1: C0, x2: C1, y1: Y(t.v ?? t), y2: Y(t.v ?? t), class: 'vz-gd', 'stroke-dasharray': '3 3' }), tx(C0 - 6, Y(t.v ?? t) + 4, kfmt(t.v ?? t) + u, 'vz-td', { 'text-anchor': 'end' }));
    g.append(svg('line', { x1: C0, x2: C1, y1: B, y2: B, class: 'vz-ln' }));
    const every = Math.ceil(s.pts.length / 7);
    s.pts.forEach((p, i) => { if (i % every === 0 || i === s.pts.length - 1) g.append(tx(X(i), B + 16, p.x, 'vz-td', { 'text-anchor': 'middle' })); });
    const nEnd = [];
    s.pts.forEach((p, i) => {
      if (!p.note) return;
      const a = X(i) + 5; let r = nEnd.findIndex((e) => e < a); if (r < 0) r = nEnd.length; nEnd[r] = a + tw(p.note, 10) + 8;
      g.append(svg('line', { x1: X(i), x2: X(i), y1: T, y2: B, class: 'vz-wr', 'stroke-dasharray': '2 3' }), tx(a, T + 10 + r * 13, p.note, 'vz-td vz-sl', { style: 'font-size:10px' }));
    });
    g.append(svg('path', { d: 'M' + s.pts.map((p, i) => `${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join('L'), class: 'vz-ln', 'stroke-width': 1.8 }));
    // The tank: its level is the value under the cursor; what flows in drops in from above, what drains leaves right.
    const tx0 = 30, tw0 = 2 * TK;
    g.append(svg('rect', { x: tx0, y: T, width: tw0, height: B - T, class: 'vz-bx', style: 'fill:none' }));
    const lvl = svg('rect', { x: tx0 + 1, width: tw0 - 2, y: B, height: 0 });
    g.append(lvl);
    for (const b of bands.slice(1)) g.append(svg('line', { x1: tx0, x2: tx0 + tw0, y1: Y(b.a), y2: Y(b.a), class: 'vz-gd', 'stroke-dasharray': '3 3' }));
    const inT = tx(tx0 + tw0 / 2 + 10, T - 2, '', 'vz-td'), outT = tx(tx0 + tw0 + 6, B - 14, '', 'vz-td');
    const inK = s.pts.flatMap((p) => p.kv.map(([k]) => k)).find((k) => /^in/i.test(k)), outK = s.pts.flatMap((p) => p.kv.map(([k]) => k)).find((k) => /^out/i.test(k));
    if (inK) g.append(svg('path', { d: `M${tx0 + tw0 / 2},${T - 12} v14 M${tx0 + tw0 / 2 - 5},${T - 3} l5,6 5,-6`, class: 'vz-ln' }), inT);
    if (outK) g.append(svg('path', { d: `M${tx0 + tw0},${B - 6} h26 M${tx0 + tw0 + 20},${B - 11} l6,5 -6,5`, class: 'vz-ln' }), outT);
    if (s.stock) g.append(tx(tx0 + tw0 / 2, B + 16, s.stock.label, 'vz-tc', { 'text-anchor': 'middle' }));
    const cur = svg('line', { y1: T, y2: B, stroke: 'var(--vz-hl)' }), dot = svg('circle', { r: 4, fill: 'var(--vz-hl)' });
    const hit = svg('rect', { x: C0 - 10, y: 0, width: C1 - C0 + 20, height: B + 4, class: 'vz-hitc' });
    g.append(cur, dot, hit);
    const bandOf = (v) => bands.find((b, j) => v >= b.a && (v < b.b || j === bands.length - 1));
    function set(i) {
      const p = s.pts[i], b = bandOf(p.v), st = new Map(p.state);
      cur.setAttribute('x1', X(i)); cur.setAttribute('x2', X(i)); dot.setAttribute('cx', X(i)); dot.setAttribute('cy', Y(p.v));
      lvl.setAttribute('y', Y(p.v)); lvl.setAttribute('height', Math.max(0, B - Y(p.v)));
      lvl.setAttribute('style', `fill:color-mix(in srgb,${b && b.tone !== 'ok' ? TONE[b.tone] : 'var(--vz-fg)'} 30%,transparent)`);
      if (inK) inT.textContent = `${inK} ${st.get(inK) || ''}`; if (outK) outT.textContent = `${outK} ${st.get(outK) || ''}`;
      ro(`${p.x} · ${kfmt(p.v)}${u}`, [b?.label, ...[...st].map(([k, v]) => `${k} ${v}`)].filter(Boolean).join(' · '), b && b.tone !== 'ok' ? b.tone : '');
      tell(detail, s.stock ? h('b', {}, s.stock.label) : null, `${p.x}: ${kfmt(p.v)}${u}`, b ? `${s.meter.title ? s.meter.title + ' ' : ''}${b.label}` : null, p.note, s.stock?.ref ? refC(doc, s.stock.ref) : null);
    }
    hit.addEventListener('mousemove', (ev) => set(Math.max(0, Math.min(s.pts.length - 1, Math.round(((at(ev) - C0) / (C1 - C0)) * (s.pts.length - 1))))));
    mount.append(detail);
    set(vs.indexOf(Math.max(...vs)));
  }

  // view: sankey: the graph's paths, drawn as bands whose width is how much flows (`weight:` under a path, or
  // under an edge). A band is green when everything along it gets through, coral when it all fails.
  function renderSankey(s, doc, mount) {
    const anyW = s.paths.some((p) => p.weight != null);
    for (const p of s.paths) p.w = p.weight ?? (anyW ? 0 : 1);
    for (const e of s.edges) e.w = e.info.weight != null ? parseFloat(e.info.weight) || 0 : e.paths.reduce((a, p) => a + p.w, 0);
    const es = s.edges.filter((e) => e.w > 0 && e.from !== e.to), n = s.nodes.length, idx = Object.fromEntries(s.nodes.map((nd, i) => [nd.id, i]));
    const layer = new Array(n).fill(0);
    for (let k = 0; k <= n; k++) { let moved = false; for (const e of es) { const u = idx[e.from], v = idx[e.to]; if (layer[v] < layer[u] + 1 && layer[u] + 1 < n) { layer[v] = layer[u] + 1; moved = true; } } if (!moved) break; }
    const top = Math.max(0, ...layer);
    s.nodes.forEach((nd, i) => { if (!es.some((e) => e.from === nd.id) && es.some((e) => e.to === nd.id)) layer[i] = top; });
    const inW = (i) => es.filter((e) => idx[e.to] === i).reduce((a, e) => a + e.w, 0), outW = (i) => es.filter((e) => idx[e.from] === i).reduce((a, e) => a + e.w, 0);
    const val = s.nodes.map((_, i) => Math.max(inW(i), outW(i)));
    const cols = Array.from({ length: top + 1 }, (_, c) => s.nodes.map((_, i) => i).filter((i) => layer[i] === c && val[i] > 0));
    const GAP = 16, HMAX = 240, big = Math.max(...cols.map((c) => c.reduce((a, i) => a + val[i], 0))) || 1;
    const K = (HMAX - GAP * Math.max(0, Math.max(...cols.map((c) => c.length)) - 1)) / big;
    const lab = (i) => `${s.nodes[i].label} ${kfmt(val[i])}`;
    const SPC = Math.ceil(Math.max(150, ...s.nodes.map((_, i) => tw(lab(i)) + 44)));
    const NW = 10, W = top * SPC + NW + Math.ceil(Math.max(60, ...cols[top].map((i) => tw(lab(i)) + 16))) + 4;
    const y0 = [], hgt = [];
    cols.forEach((c, ci) => {
      // Order a column by where its inputs come from, so bands cross as little as they can.
      if (ci) c.sort((a, b) => { const m = (i) => { const ins = es.filter((e) => idx[e.to] === i); const w = ins.reduce((x, e) => x + e.w, 0) || 1; return ins.reduce((x, e) => x + (y0[idx[e.from]] ?? 0) * e.w, 0) / w; }; return m(a) - m(b); });
      let y = 14; for (const i of c) { y0[i] = y; hgt[i] = Math.max(3, val[i] * K); y += hgt[i] + GAP; }
    });
    const H = Math.ceil(Math.max(...s.nodes.map((_, i) => (y0[i] ?? 0) + (hgt[i] ?? 0)))) + 20;
    const { g, ro, detail } = shell(s, mount, W, H);
    const xOf = (i) => layer[i] * SPC, oOut = new Array(n).fill(0), oIn = new Array(n).fill(0);
    const sorted = [...es].sort((a, b) => y0[idx[a.from]] - y0[idx[b.from]] || y0[idx[a.to]] - y0[idx[b.to]]);
    const toneOf = (e) => (!e.paths.length ? '' : e.paths.every((p) => p.out === 'pass') ? 'ok' : e.paths.every((p) => p.out === 'fail') ? 'fail' : e.paths.every((p) => p.out === 'drop') ? 'warn' : '');
    const bandG = svg('g', {}); g.append(bandG);
    for (const e of [...es].sort((a, b) => y0[idx[a.to]] - y0[idx[b.to]] || y0[idx[a.from]] - y0[idx[b.from]])) { e.zIn = oIn[idx[e.to]]; oIn[idx[e.to]] += e.w * K; }
    for (const e of sorted) {
      const u = idx[e.from], v = idx[e.to], th = e.w * K, a0 = y0[u] + oOut[u], b0 = y0[v] + e.zIn; oOut[u] += th;
      const xa = xOf(u) + NW, xb = xOf(v), m = (xa + xb) / 2, t = toneOf(e), c = t ? TONE[t] : 'var(--vz-fg)';
      e.band = svg('path', { d: `M${xa},${a0}C${m},${a0} ${m},${b0} ${xb},${b0}L${xb},${b0 + th}C${m},${b0 + th} ${m},${a0 + th} ${xa},${a0 + th}Z`, class: 'vz-band', style: `fill:color-mix(in srgb,${c} ${t === 'fail' ? 55 : t ? 26 : 16}%,transparent)${t === 'fail' ? `;stroke:${c}` : ''}` });
      e.band.addEventListener('mouseenter', () => light(new Set([e]), e)); e.band.addEventListener('mouseleave', () => light(null));
      e.band.addEventListener('click', () => tell(detail, h('b', {}, `${s.byId[e.from].label} → ${s.byId[e.to].label}`), kfmt(e.w), e.label, ...e.paths.map((p) => (p.named ? p.name : p.ids.join(' › ')) + ` ${kfmt(p.w)}`), e.ref ? refC(doc, e.ref) : null));
      bandG.append(e.band);
    }
    const total = cols[0].reduce((a, i) => a + val[i], 0) || 1, sum = (o) => s.paths.filter((p) => p.out === o).reduce((a, p) => a + p.w, 0);
    const ends = (i) => s.paths.filter((p) => p.ids[p.ids.length - 1] === s.nodes[i].id);
    s.nodes.forEach((nd, i) => {
      if (y0[i] == null) return;
      const en = ends(i), bad = nd.st === 'fail' || (en.length && en.every((p) => p.out === 'fail')) ? 'var(--vz-coral)' : en.length && en.every((p) => p.out === 'drop' || p.out === 'fail') ? 'var(--vz-amber)' : '', x = xOf(i);
      const el = svg('g', { class: 'vz-crow', 'data-viz-id': nd.id });
      el.append(svg('rect', { x, y: y0[i], width: NW, height: hgt[i], style: `fill:${bad || 'var(--vz-fg)'}` }),
        tx(x + NW + 6, y0[i] + hgt[i] / 2 + 4, lab(i), 'vz-tx vz-sl', bad ? { style: `fill:${bad}` } : {}));
      const mine = new Set(es.filter((e) => e.from === nd.id || e.to === nd.id));
      el.addEventListener('mouseenter', () => light(mine)); el.addEventListener('mouseleave', () => light(null));
      el.addEventListener('click', () => tell(detail, h('b', {}, nd.label), `${kfmt(val[i])} · ${fmt(+((100 * val[i]) / total).toFixed(1))}% of the inflow`, nd.ref ? refC(doc, nd.ref) : null, nd.note, ...DETAIL_KEYS.map((k) => nd.info[k] && `${k}: ${nd.info[k]}`)));
      g.append(el);
    });
    const pass = sum('pass'), lost = sum('fail') + sum('drop'), idle = () => ro(pass + lost ? `${fmt(+((100 * pass) / (pass + lost)).toFixed(1))}% get through` : `${kfmt(total)} in`,
      [sum('fail') && `${kfmt(sum('fail'))} fail`, sum('drop') && `${kfmt(sum('drop'))} filtered out`].filter(Boolean).join(' · '), lost && !pass ? 'fail' : '');
    function light(set, e) {
      for (const x of es) x.band.classList.toggle('dim', !!set && !set.has(x));
      if (e) ro(`${kfmt(e.w)} · ${fmt(+((100 * e.w) / total).toFixed(1))}%`, `${s.byId[e.from].label} → ${s.byId[e.to].label}${e.label ? ': ' + e.label : ''}`, toneOf(e)); else idle();
    }
    idle(); tell(detail, h('span', { class: 'vz-hint' }, 'Width is volume. Hover a band or a node; click for detail.'));
    mount.append(detail);
  }
  // waits: a wait-for graph. `a holds r` and `a waits r [text] [@ref]` lines, with optional `id: Label` lines. It is
  // drawn as a states graph (waiter → resource → holder); every cycle is a deadlock and becomes a failing path.
  function parseWaits(s, errors) {
    const decl = new Map(), rel = [], seen = [];
    const use = (id) => { if (!seen.includes(id)) seen.push(id); };
    for (const { raw, n } of s.lines) {
      const t = raw.trim();
      const r = t.match(/^([\w.$#-]+)\s+(holds|waits)\s+([\w.$#-]+)\s*(.*)$/);
      if (r) { const { rest, ref, note } = splitTail(r[4]); rel.push({ a: r[1], v: r[2], b: r[3], text: rest, ref, note, n }); use(r[1]); use(r[3]); continue; }
      const d = t.match(/^([\w.$#-]+):\s*(.*)$/);
      if (d) { decl.set(d[1], d[2]); use(d[1]); continue; }
      lineErr(errors, n, 'a holder (a holds r), a waiter (a waits r 3s @ref) or a label (a: Worker A @ref)', t);
    }
    const res = new Set(rel.map((x) => x.b)), holder = new Map(), out = new Map();
    for (const x of rel) if (x.v === 'holds') { if (holder.has(x.b)) errors.push(`line ${x.n}: "${x.b}" already held by "${holder.get(x.b)}"`); else holder.set(x.b, x.a); }
    for (const x of rel) if (x.v === 'waits') (out.get(x.a) || out.set(x.a, []).get(x.a)).push(x.b);
    // Cycles: follow waiter → resource → its holder until a node repeats.
    const cycles = [], inCyc = new Set();
    for (const start of out.keys()) {
      if (inCyc.has(start)) continue;
      const walk = (a, trail) => {
        for (const r of out.get(a) || []) {
          const hd = holder.get(r); if (!hd) continue;
          const at = trail.indexOf(hd);
          if (at >= 0) { const c = [...trail.slice(at), r]; if (!c.some((x) => inCyc.has(x))) { cycles.push(c); c.forEach((x) => inCyc.add(x)); } continue; }
          if (trail.length < 40) walk(hd, [...trail, r, hd]);
        }
      };
      walk(start, [start]);
    }
    // Stuck: anyone whose wait leads, through holders, into a cycle.
    const stuck = new Set();
    const leads = (a, vis = new Set()) => { if (inCyc.has(a)) return true; if (vis.has(a)) return false; vis.add(a); return (out.get(a) || []).some((r) => holder.has(r) && leads(holder.get(r), vis)); };
    for (const a of out.keys()) if (!inCyc.has(a) && leads(a)) stuck.add(a);
    const lab = (id) => { const v = decl.get(id); return v == null ? id : splitTail(v).rest.replace(/\s*\[.*\]$/, '') || id; };
    const L = [`== graph ${s.name}`, 'view: states'];
    for (const id of seen) { const v = decl.get(id) ?? id, kind = res.has(id) && !/\[/.test(v) ? ' [lock]' : ''; L.push(`${inCyc.has(id) ? '!' : stuck.has(id) ? '*' : ''}${id}: ${v.replace(/(\s@|\s#\s|$)/, kind + '$1')}`); }
    for (const x of rel) {
      const [f, t2] = x.v === 'holds' ? [x.b, x.a] : [x.a, x.b];
      L.push(`${f} -> ${t2}: ${x.v === 'holds' ? 'held by' : 'waits'}${x.text ? ' ' + x.text : ''}${x.ref ? ' @' + x.ref : ''}`);
      if (x.note) L.push(`  note: ${x.note}`);
    }
    cycles.forEach((c, j) => L.push(`!deadlock${cycles.length > 1 ? j + 1 : ''}: ${[...c, c[0]].join(' > ')}`));
    const sub = parse(L.join('\n'));
    for (const e of sub.errors) errors.push(`${s.name}: ${e}`);
    s.graph = sub.sections[0]; s.cycles = cycles; s.stuck = [...stuck]; s.rel = rel;
    s.say = cycles.length ? cycles.map((c) => { const who = c.filter((x) => !res.has(x)).map(lab); return 'deadlock: ' + (who.length === 2 ? who.join(' ⇄ ') : [...who, who[0]].join(' → ')); }).join(' · ') : 'no cycle';
    s.say2 = stuck.size ? 'also stuck: ' + s.stuck.map(lab).join(', ') : cycles.length ? '' : `${rel.filter((x) => x.v === 'waits').length} waits, each ends at a holder that can run`;
    if (!rel.length) errors.push(`${s.name}: a waits chart needs holds or waits lines`);
  }
  function renderWaits(s, doc, mount) {
    if (!s.graph) return;
    mount.append(h('div', { class: 'vz-ctop' }, s.tabbed ? null : h('span', { class: 'vz-cname' }, s.name),
      h('div', { class: 'vz-ro' }, h('b', { style: s.cycles.length ? 'color:var(--vz-coral)' : '' }, s.say), h('span', {}, s.say2))));
    s.graph.uid = s.uid; s.graph.tabbed = true;
    renderGraph(s.graph, doc, mount);
  }

  // hist: a latency distribution. Bucket lines are `upper count` pairs; `was:` the same for a ghost to compare.
  // p50, p90 and p99 are interpolated from the buckets unless a `p99: 900` line gives a measured one.
  function parseHist(s, errors) {
    s.b = []; s.was = null; s.unit = ''; s.budget = null; s.ps = [];
    const pairs = (str, n) => str.split('|').map((x) => x.trim()).filter(Boolean).flatMap((x) => { const m = x.match(/^(\d*\.?\d+)\s+(\d*\.?\d+)$/); if (!m) { errors.push(`line ${n}: a bucket is "upper count": ${x}`); return []; } return [{ le: +m[1], c: +m[2] }]; });
    for (const { raw, n } of s.lines) {
      const t = splitTail(raw.trim()).rest;
      const f = t.match(/^(unit|budget|was):\s*(.*)$/);
      if (f) { if (f[1] === 'unit') s.unit = f[2]; else if (f[1] === 'budget') s.budget = parseFloat(f[2]); else s.was = pairs(f[2], n); continue; }
      const p = t.match(/^([+!*~?]?)p(\d+(?:\.\d+)?):\s*(\d*\.?\d+)\s*(.*)$/);
      if (p) { s.ps.push({ q: +p[2], v: +p[3], tone: PRE[p[1]] || '', text: p[4], measured: true }); continue; }
      s.b.push(...pairs(t, n));
    }
    s.b.sort((a, c) => a.le - c.le);
    if (s.b.length < 2) { errors.push(`${s.name}: a hist needs at least two buckets (upper count | upper count)`); return; }
    const pct = (bs, q) => {
      const tot = bs.reduce((a, x) => a + x.c, 0); let acc = 0;
      for (let i = 0; i < bs.length; i++) { const lo = i ? bs[i - 1].le : 0; if (acc + bs[i].c >= (q / 100) * tot) return lo + ((q / 100 * tot - acc) / (bs[i].c || 1)) * (bs[i].le - lo); acc += bs[i].c; }
      return bs[bs.length - 1].le;
    };
    for (const q of [50, 90, 99]) if (!s.ps.some((p) => p.q === q)) s.ps.push({ q, v: pct(s.b, q), tone: '', text: '', measured: false });
    s.ps.sort((a, c) => a.q - c.q);
    s.pw = s.was ? Object.fromEntries([50, 90, 99, ...s.ps.map((p) => p.q)].map((q) => [q, pct([...s.was].sort((a, c) => a.le - c.le), q)])) : null;
    s.total = s.b.reduce((a, x) => a + x.c, 0);
  }
  function renderHist(s, doc, mount) {
    if (s.b.length < 2) return;
    const u = s.unit ? ' ' + s.unit : '', W = 720, X0 = 44, X1 = W - 14, T = 30, B = 190, H = 230, n = s.b.length;
    // Buckets take equal widths (they usually grow ×2), so a value maps through its bucket.
    const X = (v) => { let i = s.b.findIndex((x) => v <= x.le); if (i < 0) return X1; const lo = i ? s.b[i - 1].le : 0; return X0 + ((i + (v - lo) / (s.b[i].le - lo || 1)) / n) * (X1 - X0); };
    const share = (bs) => { const tot = bs.reduce((a, x) => a + x.c, 0) || 1; return bs.map((x) => x.c / tot); };
    const sh = share(s.b), wmap = s.was ? new Map(s.was.map((x, j, all) => [x.le, x.c / (all.reduce((a, y) => a + y.c, 0) || 1)])) : null;
    const top = Math.max(...sh, ...(wmap ? [...wmap.values()] : [])) * 1.1 || 1, Y = (f) => B - (f / top) * (B - T);
    const { g, ro, detail } = shell(s, mount, W, H), bw = (X1 - X0) / n;
    for (const v of ticks(0, top * 100, 4)) if (v > 0) g.append(svg('line', { x1: X0, x2: X1, y1: Y(v / 100), y2: Y(v / 100), class: 'vz-gd', 'stroke-dasharray': '3 3' }), tx(X0 - 6, Y(v / 100) + 4, v + '%', 'vz-td', { 'text-anchor': 'end' }));
    const bars = s.b.map((x, i) => {
      const lo = i ? s.b[i - 1].le : 0, over = s.budget != null && lo >= s.budget, c = over ? 'var(--vz-coral)' : 'var(--vz-fg)';
      const el = svg('g', { class: 'vz-crow' });
      el.append(svg('rect', { x: X0 + i * bw, y: T - 4, width: bw, height: B - T + 4, fill: 'transparent' }),
        svg('rect', { x: X0 + i * bw + 2, y: Y(sh[i]), width: bw - 4, height: B - Y(sh[i]), style: `fill:color-mix(in srgb,${c} ${over ? 45 : 22}%,transparent);stroke:${c};stroke-width:.8` }));
      if (wmap?.has(x.le)) el.append(svg('line', { x1: X0 + i * bw + 2, x2: X0 + (i + 1) * bw - 2, y1: Y(wmap.get(x.le)), y2: Y(wmap.get(x.le)), stroke: 'var(--vz-dim)', 'stroke-width': 2, 'stroke-dasharray': '4 2' }));
      g.append(el, tx(X0 + (i + 1) * bw, B + 14, kfmt(x.le), 'vz-td', { 'text-anchor': 'middle' }));
      const cum = s.b.slice(0, i + 1).reduce((a, y) => a + y.c, 0);
      const show = () => tell(detail, h('b', {}, `${fmt(lo)}–${fmt(x.le)}${u}`), `${kfmt(x.c)} (${fmt(+(sh[i] * 100).toFixed(1))}%)`, wmap?.has(x.le) ? `was ${fmt(+(wmap.get(x.le) * 100).toFixed(1))}%` : null, `${fmt(+((100 * cum) / s.total).toFixed(1))}% at or under ${fmt(x.le)}${u}`);
      el.addEventListener('mouseenter', show); el.addEventListener('click', show);
      return el;
    });
    g.append(svg('line', { x1: X0, x2: X1, y1: B, y2: B, class: 'vz-ln' }), tx(X0, B + 14, '0', 'vz-td', { 'text-anchor': 'middle' }));
    if (s.unit) g.append(tx(X1, B + 30, s.unit, 'vz-td', { 'text-anchor': 'end' }));
    const taken = [];
    for (const p of s.ps) {
      const x = X(p.v), c = p.tone ? TONE[p.tone] : p.q >= 99 ? 'var(--vz-hl)' : 'var(--vz-dim)', right = x > X1 - 150;
      const wl = tw(`p${p.q} ≈${kfmt(+p.v.toFixed(0))}${s.pw ? ` (was ${kfmt(+(s.pw[p.q] || 0).toFixed(0))})` : ''}`, 10) + 8, span = right ? [x - wl, x] : [x, x + wl];
      let row = 0; while (taken.some((t) => t.row === row && t.a < span[1] && span[0] < t.b)) row++;
      taken.push({ row, a: span[0], b: span[1] });
      g.append(svg('line', { x1: x, x2: x, y1: T - 8, y2: B, stroke: c, 'stroke-width': 1.3, ...(p.measured ? {} : { 'stroke-dasharray': '2 2' }) }),
        tx(right ? x - 4 : x + 4, T - 18 + row * 12, `p${p.q} ${p.measured ? '' : '≈'}${kfmt(+p.v.toFixed(p.v < 10 ? 1 : 0))}${s.pw?.[p.q] != null ? ` (was ${kfmt(+s.pw[p.q].toFixed(0))})` : ''}`, 'vz-td vz-sl', { style: `fill:${c};font-size:10px`, ...(right ? { 'text-anchor': 'end' } : {}) }));
    }
    if (s.budget != null) g.append(svg('line', { x1: X(s.budget), x2: X(s.budget), y1: T - 4, y2: B + 2, stroke: 'var(--vz-coral)', 'stroke-dasharray': '4 3' }));
    const p99 = s.ps.find((p) => p.q === 99), over = s.budget != null ? s.b.reduce((a, x, i) => a + ((i ? s.b[i - 1].le : 0) >= s.budget ? x.c : x.le > s.budget ? (x.c * (x.le - s.budget)) / (x.le - (i ? s.b[i - 1].le : 0)) : 0), 0) : 0;
    ro(p99 ? `p99 ${kfmt(+p99.v.toFixed(0))}${u}${s.pw ? ` · was ${kfmt(+s.pw[99].toFixed(0))}` : ''}` : `${kfmt(s.total)} samples`,
      [`${kfmt(s.total)} samples`, s.budget != null ? `${fmt(+((100 * over) / s.total).toFixed(1))}% over ${fmt(s.budget)}${u}` : null, s.was ? 'dashed = was' : null].filter(Boolean).join(' · '), s.budget != null && p99 && p99.v > s.budget ? 'fail' : '');
    tell(detail, h('span', { class: 'vz-hint' }, `Hover a bucket. Percentiles marked ≈ are interpolated from the buckets.`));
    mount.append(detail);
  }

  // retries: attempts per client on one time axis. `policy: 1 x2 cap 30 jitter 50%` shades where each retry should
  // land after the last attempt ends; `giveup: 60` draws the deadline. The strip below counts attempts over time.
  function parseRetries(s, errors) {
    s.lanes = []; s.unit = ''; s.policy = null; s.giveup = null; s.max = null;
    let lane = null;
    for (const { raw, n } of s.lines) {
      const t = raw.trim();
      if (/^\S/.test(raw)) {
        const f = t.match(/^(axis|policy|giveup|max):\s*(.*)$/);
        if (f) {
          const v = splitTail(f[2]).rest;
          if (f[1] === 'axis') s.unit = v;
          else if (f[1] === 'giveup') s.giveup = parseFloat(v);
          else if (f[1] === 'max') s.max = parseInt(v, 10);
          else {
            const m = v.match(/^(\d*\.?\d+)\s*[a-zµ]*(?:\s+x(\d*\.?\d+))?(?:\s+cap\s+(\d*\.?\d+)\s*[a-zµ]*)?(?:\s+jitter\s+(\d*\.?\d+)%?)?$/i);
            if (!m) errors.push(`line ${n}: policy is "first x2 cap 30 jitter 50%": ${v}`);
            else s.policy = { base: +m[1], f: m[2] ? +m[2] : 2, cap: m[3] ? +m[3] : Infinity, j: m[4] ? +m[4] / (+m[4] > 1 ? 100 : 1) : 0 };
          }
          continue;
        }
        const ln = t.match(/^([\w.$-]+):\s*(.*)$/);
        if (ln) { const { rest, ref, note } = splitTail(ln[2]); lane = { id: ln[1], label: rest || ln[1], ref, note, at: [], n }; s.lanes.push(lane); continue; }
        lineErr(errors, n, 'a client (id: Label), its attempts (  0..2 !timeout | 3 !503), axis:, policy:, giveup: or max:', t); continue;
      }
      if (!lane) { errors.push(`line ${n}: attempts before any client`); continue; }
      for (const part of t.split('|').map((x) => x.trim()).filter(Boolean)) {
        const m = part.match(/^(-?\d*\.?\d+)(?:\s*\.\.\s*(-?\d*\.?\d+))?\s*(.*)$/);
        if (!m) { errors.push(`line ${n}: an attempt is "start[..end] label": ${part}`); continue; }
        const { tone, text } = toned(m[3].trim());
        if (lane.at.length && +m[1] < lane.at[lane.at.length - 1].a) errors.push(`line ${n}: attempt times must increase: ${part}`);
        lane.at.push({ a: +m[1], b: m[2] != null ? +m[2] : +m[1], tone: tone || (/^(ok|200|done)/i.test(text) ? 'ok' : ''), label: text });
      }
    }
    if (!s.lanes.some((l) => l.at.length)) errors.push(`${s.name}: a retries chart needs a client with attempts`);
    const delay = (k) => s.policy && Math.min(s.policy.cap, s.policy.base * s.policy.f ** k);
    for (const l of s.lanes) l.at.forEach((x, k) => {
      if (!k) return;
      const prev = l.at[k - 1], d = delay(k - 1);
      x.gap = x.a - prev.b;
      if (d != null) { x.exp = [prev.b + d * (1 - s.policy.j), prev.b + d * (1 + s.policy.j)]; x.off = x.a < x.exp[0] - 1e-9 ? 'early' : x.a > x.exp[1] + 1e-9 ? 'late' : ''; }
    });
  }
  function renderRetries(s, doc, mount) {
    const lanes = s.lanes.filter((l) => l.at.length); if (!lanes.length) return;
    const all = lanes.flatMap((l) => l.at), u = s.unit ? ' ' + s.unit : '';
    const lo = Math.min(0, ...all.map((x) => x.a)), far = Math.max(...all.map((x) => x.b), ...all.flatMap((x) => (x.exp ? [x.exp[1]] : [])), s.giveup ?? -Infinity);
    const hi = far + (far - lo) * 0.06 || 1;
    const LW = Math.ceil(Math.max(56, ...lanes.map((l) => tw(l.label, 10) * 1.25 + 12)));
    const W = 720, X0 = LW + 6, X1 = W - 10, RH = 34, T = 8, SH = 26, yS = T + lanes.length * RH + 6, yA = yS + SH, H = yA + 22;
    const X = (t) => X0 + ((t - lo) / (hi - lo)) * (X1 - X0);
    const { g, ro, detail } = shell(s, mount, W, H);
    if (s.giveup != null) g.append(svg('line', { x1: X(s.giveup), x2: X(s.giveup), y1: 2, y2: yA, stroke: 'var(--vz-coral)', 'stroke-dasharray': '4 3', 'stroke-width': 1.3 }), tx(X(s.giveup) - 4, yA - 4, 'give up', 'vz-td vz-sl', { 'text-anchor': 'end', style: 'fill:var(--vz-coral);font-size:10px' }));
    const show = (l, x, k) => tell(detail, h('b', {}, `${l.label}, attempt ${k + 1}`), `at ${fmt(x.a)}${u}${x.b > x.a ? ` for ${fmt(+(x.b - x.a).toFixed(2))}${u}` : ''}`, x.label,
      x.gap != null ? `${fmt(+x.gap.toFixed(2))}${u} after the last` : null, x.exp ? `policy says ${+x.exp[0].toFixed(1)}..${+x.exp[1].toFixed(1)}${x.off ? ` (${x.off})` : ''}` : null, l.ref ? refC(doc, l.ref) : null);
    lanes.forEach((l, i) => {
      const y = T + i * RH, mid = y + 15;
      g.append(tx(0, mid + 4, l.label, 'vz-tc'), svg('line', { x1: X(l.at[0].a), x2: X(l.at[l.at.length - 1].b), y1: mid, y2: mid, class: 'vz-wr' }));
      l.at.forEach((x, k) => {
        if (x.exp) g.append(svg('rect', { x: X(x.exp[0]), y: y + 4, width: Math.max(2, X(x.exp[1]) - X(x.exp[0])), height: 22, style: 'fill:color-mix(in srgb,var(--vz-hl) 13%,transparent)' }));
        if (x.gap != null && X(x.a) - X(l.at[k - 1].b) > tw('+' + fmt(x.gap), 9) + 8) g.append(tx((X(x.a) + X(l.at[k - 1].b)) / 2, y + 2, '+' + fmt(+x.gap.toFixed(2)), 'vz-td vz-small', { 'text-anchor': 'middle' }));
      });
      l.at.forEach((x, k) => {
        const c = x.tone ? TONE[x.tone] : 'var(--vz-fg)', w = Math.max(7, X(x.b) - X(x.a)), el = svg('g', { class: 'vz-crow' });
        el.append(svg('rect', { x: X(x.a), y: y + 8, width: w, height: 14, rx: 2, style: `fill:color-mix(in srgb,${c} 35%,var(--vz-ground,#111));stroke:${c}` }));
        if (x.off) el.append(svg('rect', { x: X(x.a) - 3, y: y + 5, width: w + 6, height: 20, rx: 3, fill: 'none', stroke: 'var(--vz-amber)', 'stroke-dasharray': '2 2' }));
        el.addEventListener('mouseenter', () => show(l, x, k)); el.addEventListener('click', () => show(l, x, k));
        g.append(el);
      });
    });
    // Pile-up strip: attempts started per slot, across every client.
    const N = 48, cnt = new Array(N).fill(0);
    for (const x of all) cnt[Math.min(N - 1, Math.floor(((x.a - lo) / (hi - lo)) * N))]++;
    const peak = Math.max(...cnt), pi = cnt.indexOf(peak), sw = (X1 - X0) / N;
    cnt.forEach((c, j) => c && g.append(svg('rect', { x: X0 + j * sw + 1, y: yA - (c / peak) * (SH - 6), width: sw - 2, height: (c / peak) * (SH - 6), style: `fill:${c === peak && peak > 1 ? 'var(--vz-hl)' : 'var(--vz-dim)'}` })));
    g.append(svg('line', { x1: X0, x2: X1, y1: yA, y2: yA, class: 'vz-ln' }), tx(X0 - 6, yA - 4, 'tries', 'vz-td vz-small', { 'text-anchor': 'end' }));
    for (const v of ticks(lo, hi, 8)) g.append(tx(X(v), yA + 14, fmt(v), 'vz-td', { 'text-anchor': 'middle' }));
    if (s.unit) g.append(tx(X0 - 10, yA + 14, s.unit, 'vz-td', { 'text-anchor': 'end' }));
    const okN = lanes.filter((l) => l.at[l.at.length - 1].tone === 'ok').length, offN = all.filter((x) => x.off).length;
    const tooMany = s.max != null ? lanes.filter((l) => l.at.length > s.max).length : 0, late = s.giveup != null ? all.filter((x) => x.a > s.giveup).length : 0;
    const t0 = lo + (pi / N) * (hi - lo);
    ro(`${all.length} attempts · ${okN}/${lanes.length} succeed`,
      [peak > 1 && lanes.length > 1 ? `peak ${peak} at ${fmt(+t0.toFixed(1))}${u}` : null, offN ? `${offN} off policy` : null, tooMany ? `${tooMany} past max ${s.max}` : null, late ? `${late} after give-up` : null].filter(Boolean).join(' · '),
      okN < lanes.length ? 'fail' : '');
    tell(detail, h('span', { class: 'vz-hint' }, s.policy ? 'Shaded: where the policy puts each retry. Dashed ring: off policy. Hover an attempt.' : 'Hover an attempt. Add policy: to shade where each retry should land.'));
    mount.append(detail);
  }

  const DETAIL_KEYS = ['does', 'reads', 'writes', 'fails', 'state', 'carries'];
  const CHART = { timing: { parse: parseTiming, render: renderTiming }, gantt: { parse: parseGantt, render: renderGantt }, causes: { parse: parseCauses, render: renderCauses },
    board: { parse: parseBoard, render: renderBoard }, stock: { parse: parseStock, render: renderStock },
    waits: { parse: parseWaits, render: renderWaits }, hist: { parse: parseHist, render: renderHist }, retries: { parse: parseRetries, render: renderRetries } };

  /* ---------- mount ---------- */
  let uid = 0;
  function render(el, text) {
    if (!document.getElementById('vz-css')) document.head.append(h('style', { id: 'vz-css' }, CSS));
    const doc = parse(text);
    const root = h('div', { class: doc.theme && doc.theme !== 'default' ? `vz vz-${doc.theme}` : 'vz' });
    if (doc.title || doc.sub) root.append(h('div', { class: 'vz-head' }, h('span', { class: 'vz-title' }, doc.title), h('span', { class: 'vz-sub' }, [doc.sub, doc.base && `paths under ${doc.base}`].filter(Boolean).join(' · '))));
    for (const e of doc.errors) console.error('viz: ' + e);
    if (doc.errors.length) root.append(h('div', { class: 'vz-err' }, doc.errors.join('\n')));
    const secs = doc.sections;
    const panels = secs.map((s) => {
      s.uid = ++uid; s.tabbed = secs.length > 1;
      const p = h('div', { class: 'vz-panel', role: 'tabpanel' });
      (s.kind === 'graph' ? (s.view === 'sankey' ? renderSankey : renderGraph) : s.kind === 'tree' ? renderTree : CHART[s.kind].render)(s, doc, p);
      return p;
    });
    if (secs.length > 1) {
      const tabs = secs.map((s, i) => h('button', { role: 'tab', 'aria-selected': i === 0, onclick: () => show(i) }, s.name));
      const show = (i, quiet) => {
        tabs.forEach((t, j) => t.setAttribute('aria-selected', i === j)); panels.forEach((p, j) => (p.hidden = i !== j));
        if (!quiet && !reduced()) panels[i].animate([{ opacity: 0, translate: '0 4px' }, { opacity: 1, translate: '0 0' }], { duration: 220, easing: 'cubic-bezier(.23,1,.32,1)' });
      };
      root.append(h('div', { class: 'vz-tabs', role: 'tablist' }, tabs), ...panels); show(0, true);
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
  // Without host theme variables the default palette follows the host: a light page (or, on a bare page, a light OS
  // scheme) switches it to light colours via .vz-lt. Host variables (T3) win; drawing and paper paint their own sheet.
  const lum = (c) => { const m = String(c).match(/\d+(\.\d+)?/g); return m ? +m[0] * 0.3 + +m[1] * 0.59 + +m[2] * 0.11 : 0; };
  function ground(root) {
    const tokens = !!getComputedStyle(root).getPropertyValue('--foreground').trim();
    if (root.classList.contains('vz-solo')) root.classList.toggle('vz-lt', !matchMedia('(prefers-color-scheme: dark)').matches);
    else if (!tokens) {
      let bg = ''; for (let e = root.parentElement; e && e.nodeType === 1; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba\(.*,\s*0\)$/.test(c) && c !== 'transparent') { bg = c; break; } }
      root.classList.toggle('vz-lt', !!bg && lum(bg) > 128);
    }
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
