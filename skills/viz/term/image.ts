// viz-term images: the HTML renderer's graph drawing as a PNG, for the kitty graphics protocol (the `i` key).
// viz.js builds its graph from DOM nodes (divs and svg), so there is no SVG string to reuse headlessly: this draws
// the same geometry (Viz.layout: boxes, edge `d` paths, pills, decor) in viz's own colours, then rasterizes it with
// @resvg/resvg-js. main.ts loads this file with a dynamic import() on the first `i`, never at startup.
import { Resvg } from "@resvg/resvg-js";
import type { Theme } from "./style";

// viz.css custom properties (.vz and .vz.vz-lt), plus the ground behind a solo page.
const COLORS = {
  dark: { bg: "#0a0a0a", fg: "#e9e6e1", dim: "#8a857e", amber: "#e6b04f", coral: "#e0736a", green: "#9cc48a", blue: "#7aa2d6" },
  light: { bg: "#ffffff", fg: "#1d2026", dim: "#6b7280", amber: "#b45309", coral: "#c93a32", green: "#1f8a4c", blue: "#2f5fd0" },
} as const;
const TONES = ["#5fb3a3", "#7aa2d6", "#b08ee0", "#e6b04f", "#d98e6a", "#9cc48a"];   // --chart-1..6
const FONT = "Helvetica Neue, Helvetica, Arial, DejaVu Sans, sans-serif";
const PAD = 14, CHAR = 6.6, LINE = 15;

type Box = { id: string; label: string; kind: string; x: number; y: number; w: number; h: number };
type Edge = { from: string; to: string; label: string; d: string; rev: boolean; pill?: { x: number; y: number; w: number; h: number } | null };
export type Geo = { w: number; h: number; decor: any[]; boxes: Box[]; edges: Edge[] };
type SecNode = { id: string; label: string; kind: string; st: string; tone?: string };
type SecEdge = { st: string; out?: string; async?: boolean; num?: number | string };
export type ImageSection = { nodes: SecNode[]; edges: SecEdge[]; tones?: { id: string; k: string }[] };

const esc = (s: unknown) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const f = (n: number) => Math.round(n * 100) / 100;

function wrap(text: string, maxChars: number): string[] {
  const out: string[] = []; let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + " " + word).length > maxChars) { out.push(line); line = word; } else line = line ? line + " " + word : word;
  }
  if (line) out.push(line);
  return out.length ? out : [""];
}

// The SVG of one graph section: what the HTML renderer draws, with the status colours viz.css gives each state.
export function graphSvg(section: ImageSection, geo: Geo, theme: Theme): string {
  const c = COLORS[theme], W = Math.max(1, geo.w) + PAD * 2, H = Math.max(1, geo.h) + PAD * 2;
  const byId = new Map(section.nodes.map((n, i) => [n.id, n] as const));
  const tone = (n?: SecNode) => { const k = n?.tone ? section.tones?.find((t) => t.id === n.tone)?.k : undefined; return k ? TONES[(Number(k) - 1 + 6) % 6] ?? undefined : undefined; };
  const stColor = (st: string) => (st === "add" ? c.green : st === "del" || st === "fail" ? c.coral : st === "mod" || st === "active" ? c.amber : "");
  const out: string[] = [];
  const text = (x: number, y: number, s: string, o: { size?: number; fill?: string; anchor?: string; weight?: number; extra?: string } = {}) =>
    out.push(`<text x="${f(x)}" y="${f(y)}" font-family="${FONT}" font-size="${o.size ?? 12}" fill="${o.fill ?? c.fg}" text-anchor="${o.anchor ?? "start"}"${o.weight ? ` font-weight="${o.weight}"` : ""}${o.extra ?? ""}>${esc(s)}</text>`);

  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${f(W)}" height="${f(H)}" viewBox="0 0 ${f(W)} ${f(H)}">`);
  out.push(`<rect width="${f(W)}" height="${f(H)}" fill="${c.bg}"/>`);
  out.push(`<defs>${(["a", "g", "r"] as const).map((k) => `<marker id="m-${k}" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L6,3 L0,6 z" fill="${k === "g" ? c.green : k === "r" ? c.coral : c.dim}"/></marker>`).join("")}</defs>`);
  out.push(`<g transform="translate(${PAD} ${PAD})">`);

  // decor behind everything: lanes, groups, lifelines, column heads, ticks
  for (const d of geo.decor) {
    if (d.kind === "lane") {
      out.push(`<rect x="0" y="${f(d.y)}" width="${f(d.w ?? geo.w)}" height="${f(d.h)}" rx="6" fill="${c.fg}" fill-opacity=".04" stroke="${c.fg}" stroke-opacity=".12" stroke-dasharray="3 3"/>`);
      text(8, d.y + 14, d.text, { size: 10.5, fill: c.dim });
    } else if (d.kind === "group") {
      out.push(`<rect x="${f(d.x)}" y="${f(d.y)}" width="${f(d.w)}" height="${f(d.h)}" rx="8" fill="${c.fg}" fill-opacity=".03" stroke="${c.fg}" stroke-opacity=".16"/>`);
      out.push(`<line x1="${f(d.x)}" x2="${f(d.x + d.w)}" y1="${f(d.y + 26)}" y2="${f(d.y + 26)}" stroke="${c.fg}" stroke-opacity=".1"/>`);
      text(d.align === "right" ? d.x + d.w - 10 : d.x + 10, d.y + 17, d.text, { size: 12, weight: 600, anchor: d.align === "right" ? "end" : "start" });
    } else if (d.kind === "life") {
      out.push(`<line x1="${f(d.x)}" x2="${f(d.x)}" y1="${f(d.y1)}" y2="${f(d.y2)}" stroke="${c.fg}" stroke-opacity=".26" stroke-width="1.25"/>`);
    } else if (d.kind === "head") text(d.x, d.y + 11, String(d.text).toUpperCase(), { size: 10.5, fill: c.dim, extra: ' letter-spacing="0.6"' });
    else if (d.kind === "tick") text(d.x, d.y + 10, d.text, { size: 10.5, fill: c.dim });
    else if (d.kind === "sbar") {
      const col = d.tone === "warn" ? c.amber : d.tone === "ok" ? c.green : d.tone === "fail" ? c.coral : c.fg;
      out.push(`<rect x="${f(d.x - 4)}" y="${f(d.y1)}" width="8" height="${f(Math.max(1, d.y2 - d.y1))}" rx="3" fill="${col}" fill-opacity="${d.tone ? ".55" : ".14"}"/>`);
    }
  }

  // edges: colour says how the paths end (green gets through, coral fails/removed), dashed for async and removed
  geo.edges.forEach((e, i) => {
    const se = section.edges[i] ?? ({} as SecEdge);
    const k = se.st === "add" || se.out === "pass" ? "g" : se.st === "del" || se.out === "fail" ? "r" : "a";
    const col = k === "g" ? c.green : k === "r" ? c.coral : c.dim;
    const dash = se.async ? "4 3" : se.st === "del" ? "2 3" : se.out === "drop" ? "3 4" : "";
    out.push(`<path d="${esc(e.d)}" fill="none" stroke="${col}" stroke-width="1.3"${dash ? ` stroke-dasharray="${dash}"` : ""} ${e.rev ? "marker-start" : "marker-end"}="url(#m-${k})"/>`);
  });

  // boxes: status border, tone fill, wrapped label, kind as a dim second line when there is room
  for (const b of geo.boxes) {
    const n = byId.get(b.id), x = b.x - b.w / 2;
    if (n?.kind === "start") { out.push(`<circle cx="${f(b.x)}" cy="${f(b.y + b.h / 2)}" r="${f(Math.min(b.w, b.h) / 2)}" fill="${c.bg}"/><circle cx="${f(b.x)}" cy="${f(b.y + b.h / 2)}" r="${f(Math.min(b.w, b.h) / 2)}" fill="${c.dim}"/>`); continue; }
    // an opaque card first, as .vz-box does in viz.css, so lines passing under a box stay hidden
    out.push(`<rect x="${f(x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="6" fill="${c.bg}"/><rect x="${f(x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="6" fill="${theme === "light" ? "#111827" : c.fg}" fill-opacity="${theme === "light" ? ".025" : ".03"}"/>`);
    const t = tone(n), sc = stColor(n?.st ?? "");
    const stroke = sc || (t ?? c.fg), sop = sc ? 1 : t ? 0.6 : 0.28;
    const fill = n?.st === "fail" ? `<rect x="${f(x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="6" fill="${c.coral}" fill-opacity=".14"/>` :
      t ? `<rect x="${f(x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="6" fill="${t}" fill-opacity=".24"/>` : "";
    out.push(fill, `<rect x="${f(x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="6" fill="none" stroke="${stroke}" stroke-opacity="${sop}"${n?.st === "del" || n?.st === "active" || n?.st === "unk" || n?.kind === "event" ? ' stroke-dasharray="4 3"' : ""}/>`);
    const lines = wrap(n?.label ?? b.label, Math.max(4, Math.floor((b.w - 18) / CHAR)));
    const room = Math.max(1, Math.floor((b.h - 12) / LINE));
    const shown = lines.slice(0, room);
    if (lines.length > room) shown[room - 1] = shown[room - 1].replace(/.{0,1}$/, "…");
    const dimKind = n?.kind && room > shown.length ? n.kind : "";
    shown.forEach((l, j) => text(b.x, b.y + 6 + LINE * (j + 1) - 3, l, { anchor: "middle", fill: n?.st === "unk" ? c.dim : c.fg, extra: n?.st === "del" ? ' text-decoration="line-through"' : "" }));
    if (dimKind) text(b.x, b.y + 6 + LINE * (shown.length + 1) - 3, dimKind, { anchor: "middle", fill: c.dim, size: 11 });
  }

  // pills: the edge label, with its hop number in the flow view
  geo.edges.forEach((e, i) => {
    if (!e.pill) return;
    const se = section.edges[i] ?? ({} as SecEdge), num = se.num !== undefined && se.num !== "" ? String(se.num) : "";
    const label = e.label || "", col = se.st === "add" ? c.green : se.st === "del" ? c.coral : c.fg;
    if (!label && !num) return;
    const w = Math.max(e.pill.w, 20 + label.length * 5.6), x = e.pill.x - w / 2, h = Math.max(20, e.pill.h);
    out.push(`<rect x="${f(x)}" y="${f(e.pill.y)}" width="${f(w)}" height="${f(h)}" rx="${f(Math.min(10, h / 2))}" fill="${c.bg}" stroke="${c.fg}" stroke-opacity=".2"/>`);
    let tx = x + 8;
    if (num) { out.push(`<circle cx="${f(x + 11)}" cy="${f(e.pill.y + h / 2)}" r="7" fill="${c.amber}"/>`); text(x + 11, e.pill.y + h / 2 + 3.5, num, { size: 10, anchor: "middle", fill: c.bg, extra: ' font-weight="700"' }); tx = x + 23; }
    if (label) text(tx, e.pill.y + h / 2 + 4, label, { size: 11, fill: col });
  });

  // spills (state chips on a sequence)
  for (const d of geo.decor) if (d.kind === "spill") {
    const w = 16 + String(d.text).length * 5.6, tcol = d.tone === "warn" ? c.amber : d.tone === "ok" ? c.green : d.tone === "fail" ? c.coral : c.fg;
    out.push(`<rect x="${f(d.x - w / 2)}" y="${f(d.y)}" width="${f(w)}" height="18" rx="9" fill="${c.bg}" stroke="${c.fg}" stroke-opacity=".13"/>`);
    text(d.x, d.y + 12.5, d.text, { size: 11, anchor: "middle", fill: tcol });
  }
  out.push("</g></svg>");
  return out.join("");
}

// Rasterize to a PNG that fits `maxW`×`maxH` pixels (never enlarged beyond 2×). Returns the bytes and the pixel size.
export function graphPng(section: ImageSection, geo: Geo, theme: Theme, maxW: number, maxH: number): { png: Buffer; width: number; height: number; scale: number } {
  const svg = graphSvg(section, geo, theme);
  const W = Math.max(1, geo.w) + PAD * 2, H = Math.max(1, geo.h) + PAD * 2;
  const scale = Math.min(2, Math.max(0.05, maxW) / W, Math.max(0.05, maxH) / H);
  const r = new Resvg(svg, { fitTo: { mode: "zoom", value: scale }, font: { loadSystemFonts: true, defaultFontFamily: "Helvetica Neue" } });
  const img = r.render();
  return { png: img.asPng(), width: img.width, height: img.height, scale };
}
