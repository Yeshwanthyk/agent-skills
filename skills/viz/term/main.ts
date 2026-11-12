// viz-term: draw the sections of a .viz file in the terminal, in thimble's card style (graphs here, charts in charts/).
//   bun main.ts <file.viz> [--section N|name] [--origin <rex block id>] [--session <id>] [--no-focus] [--dump]
// --dump prints every drawable section as plain text and exits (no terminal needed): used to check all examples.
import { readFileSync } from "node:fs";
import { BoxRenderable, ImageRenderable, TextRenderable, createCliRenderer } from "@opentui/core";
import { DETAIL_ROWS, FIXED_ROWS, cardWidth, chunkText, createModel, follow, initialState, move, replay, toggleSide, view } from "./graph";
import type { Doc, Model, State, VSection, View } from "./graph";
import { askText, sendAsk } from "./ask";
import { loadViz } from "./viz-host";
import { hasChart, loadChart, type Chart, type Section } from "./charts";   // the registry only: chart modules load lazily
import { PALETTES, accent, label, pickPalette, plain, styled, type Chunk, type Palette } from "./style";


const argv = process.argv.slice(2);
const flag = (name: string) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const file = argv.find((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--") && argv[i - 1] !== "--dump" && argv[i - 1] !== "--no-focus"));
if (!file) { console.error("usage: bun main.ts <file.viz> [--section N|name] [--origin <block id>] [--session <id>] [--no-focus] [--dump]"); process.exit(2); }
const origin = flag("--origin");                           // `a` types into this block (rex send)
const session = flag("--session") ?? process.env.REX_SESSION;
const focusOrigin = !argv.includes("--no-focus");

const Viz = loadViz();
const doc = Viz.parse(readFileSync(file, "utf8"));
if (doc.errors.length) { console.error(`${file}:\n${doc.errors.join("\n")}`); process.exit(1); }
// Drawable = a graph the grid draws, or a kind with a registered chart. `[`/`]` cycle through these.
const isGraph = (s: VSection) => s.kind === "graph" && s.view !== "sankey";
const graphs = doc.sections.map((s, i) => [s, i] as const).filter(([s]) => isGraph(s) || hasChart(s as Section)).map(([, i]) => i);
if (!graphs.length) graphs.push(0);                       // a file with nothing drawable still opens, on a gray note

// --section opens that section first, even when it is not a graph (it then shows the gray note).
function startAt(): number {
  const want = flag("--section");
  if (want === undefined) return 0;
  const i = /^\d+$/.test(want) ? Number(want) : doc.sections.findIndex((s) => s.name.toLowerCase().includes(want.toLowerCase()));
  if (i < 0 || i >= doc.sections.length) { console.error(`no section "${want}"`); process.exit(2); }
  if (!graphs.includes(i)) graphs.push(i), graphs.sort((x, y) => x - y);
  return graphs.indexOf(i);
}

// A section the terminal can draw has a model; anything else (charts, sankey) gets a gray note.
function modelOf(section: VSection): Model | null {
  // Sankey bars need a band renderer (not built yet). charW 10 > the 7.6 px draw grid: a box then has room for
  // its border, pad and kind glyph (layout gives chars*7.6+20 px, the cells need chars+6).
  const geo = isGraph(section) ? Viz.layout(section, { charW: 10 }) : null;
  return geo ? createModel(section, geo) : null;
}
const NOT_DRAWN = "not drawn in the terminal yet";
type Open = { model: Model | null; chart: Chart | null; cstate: any };
// Opening a section loads its chart module (graphs load none).
async function openSection(section: VSection): Promise<Open> {
  const model = modelOf(section);
  const chart = model ? null : await loadChart(section as Section);
  return { model, chart, cstate: chart?.init(section as Section, { doc, at: { n: 1, of: 1 } }) };
}
const printView = (v: View) => {
  for (const row of [v.title, v.answer, ...v.body, v.scroll, v.legend, ...v.details, v.footer]) console.log(chunkText(row).trimEnd());
};

if (argv.includes("--dump")) {
  const p = PALETTES.dark;
  for (const i of graphs) {
    const section = doc.sections[i], { model, chart, cstate } = await openSection(section);
    console.log(`== ${section.name} (${section.kind === "graph" ? section.view : section.view || ((section as Section).diff ? "diff" : section.kind)})`);
    if (chart) {
      const at = { n: 1, of: graphs.length };
      const big = { width: 82, height: FIXED_ROWS + 40 };
      const v = chart.render(p, section as Section, cstate, big, { doc, at });
      let last = v.body.length; while (last > 1 && chunkText(v.body[last - 1]).trim() === "") last--;
      v.body.length = last;
      printView(v);
      // every key must work without throwing, on a small card too
      for (const name of ["j", "j", "enter", "right", "left", "left", "k", "down", "up", "x"]) {
        chart.key?.(section as Section, cstate, { name, sequence: name }, big);
        chart.render(p, section as Section, cstate, { width: 60, height: 20 }, { doc, at });
      }
      continue;
    }
    if (!model) { console.log(NOT_DRAWN); continue; }
    const s = initialState(model);
    const v = view(p, model, s, { width: 82, height: model.grid.rows + FIXED_ROWS }, doc, { n: 1, of: graphs.length });
    for (const row of [v.title, v.answer, ...v.body, v.scroll, v.legend, ...v.details, v.footer]) console.log(chunkText(row).trimEnd());
    // every node and every key must work without throwing
    for (let k = 0; k < model.order.length; k++) { move(model, s, 1); view(p, model, s, { width: 60, height: 20 }, doc, { n: 1, of: 1 }); }
    for (let k = 0; k < model.trail.length + 1; k++) { replay(model, s, 1); view(p, model, s, { width: 60, height: 20 }, doc, { n: 1, of: 1 }); }
    toggleSide(model, s); s.inspector = true; view(p, model, s, { width: 60, height: 20 }, doc, { n: 1, of: 1 });
  }
  process.exit(0);
}

// ---- live ------------------------------------------------------------------------------------------------------------
const renderer = await createCliRenderer({
  screenMode: "alternate-screen", exitOnCtrlC: true, useKittyKeyboard: null, useMouse: false,
  consoleMode: "disabled", externalOutputMode: "passthrough",
});
let quitting = false;
async function quit(code = 0, error?: unknown) {
  if (quitting) return;
  quitting = true; renderer.destroy(); await renderer.closed;
  if (error !== undefined) console.error(error);
  process.exit(code);
}
renderer.on("render:error", ({ error }) => void quit(1, error));

try {
  const p: Palette = await pickPalette(renderer);
  let at = startAt();
  let { model, chart, cstate } = await openSection(doc.sections[graphs[at]]);
  let state: State = model ? initialState(model) : ({} as State);

  const layout = new BoxRenderable(renderer, { id: "layout", width: "100%", flexDirection: "column", paddingX: 1 });
  const card = new BoxRenderable(renderer, {
    id: "card", width: cardWidth(renderer), flexShrink: 0, flexDirection: "column",
    border: true, borderStyle: "single", borderColor: p.border, paddingX: 1,
  });
  const text = (id: string, parent: BoxRenderable, height = 1) => {
    const r = new TextRenderable(renderer, { id, content: "", height, flexShrink: 0, wrapMode: "none" });
    parent.add(r); return r;
  };
  const head = new BoxRenderable(renderer, { id: "head", height: 1, flexShrink: 0, flexDirection: "row", justifyContent: "space-between" });
  const title = text("title", head), hint = text("hint", head);
  card.add(head);
  const answer = text("answer", card);
  text("g1", card);
  const body = text("body", card, 10);
  const scroll = text("scroll", card);
  const key = text("legend", card);
  text("g2", card);
  const details = text("details", card, DETAIL_ROWS);
  layout.add(card);
  const footer = new TextRenderable(renderer, { id: "footer", height: 1, flexShrink: 0, wrapMode: "none", content: "" });
  layout.add(footer);
  renderer.root.add(layout);

  // `i`: the graph as a kitty image (image.ts and its native rasterizer load on the first press, never at startup).
  let picture: ImageRenderable | null = null, pictureKey = "", imageMod: typeof import("./image") | null = null;
  const hideImage = () => { picture?.destroy(); picture = null; pictureKey = ""; body.visible = true; };
  const syncImage = (dims: { width: number; height: number }, rows: number) => {
    if (!picture || !imageMod || !model) return;
    const cols = cardWidth(dims) - 4, res = renderer.resolution;
    const cellW = res ? res.width / renderer.width : 7.6, cellH = res ? res.height / renderer.height : 17;
    const key = `${at}:${cols}x${rows}:${cellW}x${cellH}:${p === PALETTES.light}`;
    if (key === pictureKey) return;
    pictureKey = key;
    const section = doc.sections[graphs[at]];
    const { png, scale } = imageMod.graphPng(section as any, Viz.layout(section), p === PALETTES.light ? "light" : "dark", cols * cellW, rows * cellH);
    picture.width = cols; picture.height = rows; picture.source = png;
    // below ~40% the labels stop being readable: say so instead of silently showing a smudge
    state.hint = scale < 0.4 ? `the image is shrunk to ${Math.round(scale * 100)}%: widen the pane, or i for cells` : state.hint;
  };
  const toggleImage = async () => {
    if (!model) return;
    if (picture) { hideImage(); return draw(); }
    if (renderer.capabilities?.kitty_graphics !== true) { state.hint = "this terminal does not show kitty images: staying in cells"; return draw(); }
    try { imageMod ??= await import("./image"); } catch (e) { state.hint = `images unavailable: ${(e as Error)?.message?.split("\n")[0] ?? e}`; return draw(); }
    if (!model || picture) return;
    picture = new ImageRenderable(renderer, { id: "picture", protocol: "kitty", fit: "fit", width: 1, height: 1, flexShrink: 0 });
    card.insertBefore(picture, body); body.visible = false;
    draw();
  };
  const lines = (rows: Chunk[][]) => styled(rows.flatMap((r, i) => (i ? [plain(p, "\n"), ...r] : r)));
  const draw = () => {
    const dims = { width: renderer.width, height: renderer.height };
    card.width = cardWidth(dims);
    const section = doc.sections[graphs[at]];
    let v: View;
    if (model) v = view(p, model, state, dims, doc, { n: at + 1, of: graphs.length });
    else if (chart) v = chart.render(p, section as Section, cstate, dims, { doc, at: { n: at + 1, of: graphs.length } });
    else {
      const bodyRows = Math.max(4, dims.height - FIXED_ROWS);
      v = {
        title: [label(p, section.name)], hint: [], answer: [label(p, `${section.view || section.kind}`)], bodyRows,
        body: [[label(p, NOT_DRAWN)]], scroll: [], legend: [], details: [], footer: [label(p, "[ ] section · q quit")],
      };
    }
    body.height = v.bodyRows;
    if (origin && model) {
      v.hint = [...v.hint, label(p, " · "), accent(p, "a ask")];
      const at = v.footer.findIndex((c) => c.text === "[ ]");
      if (at > 0) v.footer.splice(at, 0, accent(p, "a"), label(p, " ask"), label(p, " · "));
    }
    if (model) v.footer.splice(Math.max(0, v.footer.findIndex((c) => c.text === "[ ]")), 0, accent(p, "i"), label(p, picture ? " cells" : " image"), label(p, " · "));
    if (picture) { body.content = ""; v.scroll = [label(p, state.hint || "image · i back to cells")]; }
    syncImage(dims, v.bodyRows);
    title.content = styled(v.title); hint.content = styled(v.hint); answer.content = styled(v.answer);
    body.content = lines(v.body); scroll.content = styled(v.scroll); key.content = styled(v.legend);
    details.content = lines(v.details.length ? v.details : [[]]);
    footer.content = styled(v.footer);
  };
  let asking = false;
  const ask = async () => {
    if (!model) return;
    if (!origin) { state.hint = "no origin pane: open with --origin <block>"; return draw(); }
    const n = model.section.byId[state.sel];
    if (!n || asking) return;
    asking = true;
    const err = await sendAsk({ session, block: origin, focus: focusOrigin }, askText(n.label, n.ref));
    asking = false;
    state.hint = err || `typed into ${origin}`;
    draw();
  };
  let opening = false;
  const open = async (next: number) => {
    if (opening) return;
    opening = true;
    at = (next + graphs.length) % graphs.length;
    hideImage();
    ({ model, chart, cstate } = await openSection(doc.sections[graphs[at]]));
    state = model ? initialState(model) : ({} as State);
    opening = false;
    draw();
  };
  draw();
  renderer.on("resize", draw);

  renderer.keyInput.on("keypress", (k) => {
    const name = k.name, seq = k.sequence;
    if (name === "q") return void quit();
    if (seq === "[" || seq === "]") return open(at + (seq === "]" ? 1 : -1));
    if (!model) {
      if (chart?.key?.(doc.sections[graphs[at]] as Section, cstate, { name, sequence: seq }, { width: renderer.width, height: renderer.height })) draw();
      return;
    }
    if (name === "j" || name === "down") move(model, state, 1);
    else if (name === "k" || name === "up") move(model, state, -1);
    else if (name === "right") replay(model, state, 1);
    else if (name === "left") replay(model, state, -1);
    else if (name === "return" || name === "enter") state.inspector = !state.inspector;
    else if (name === "b") toggleSide(model, state);
    else if (name === "a") return void ask();
    else if (name === "i") return void toggleImage();
    else if (name === "y") {
      const n = model.section.byId[state.sel];
      state.hint = n?.ref ? (renderer.copyToClipboardOSC52(`@${n.ref}`) ? `sent @${n.ref} to the clipboard` : "this terminal ignores OSC 52 copy") : "this node has no @ref to copy";
    } else return;
    draw();
  });
  renderer.start();
} catch (error) {
  await quit(1, error);
}
