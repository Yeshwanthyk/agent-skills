// viz-term card style: the rules of thimble's terminal cards, as small helpers over OpenTUI.
// Palette and rules adapted from thimble (Apache-2.0): plugin/cards/runner.mjs:193-230 (palette),
// plugin/prompts/card-tool.md:29-42 (card advice), plugin/core/theme.ts (accent). See STYLE.md.
import { StyledText, bold, fg } from "@opentui/core";
import type { TextChunk } from "@opentui/core/text-buffer";

export type Theme = "dark" | "light";
export type Chunk = TextChunk;

// thimble: runner.mjs:200-217. Categories in fixed order (blue, orange, teal, pink, gold);
// no violet (accent), no green/red (good/bad).
export const PALETTES = {
  dark: {
    cat: ["#80b2ea", "#ed9a6b", "#6fd0cc", "#ed95ba", "#f0ca78"],
    gray: "#85827a", good: "#67cda8", bad: "#f59183",
    accent: "#af87ff",            // theme.ts:26: merged-PR purple, dark
    text: "#e6e6e6", border: "#5a5852",   // ours: OpenTUI has no "terminal default" fg
  },
  light: {
    cat: ["#0471c8", "#e26101", "#018d82", "#c8367b", "#a08319"],
    gray: "#a19d94", good: "#0b7c5f", bad: "#c93a28",
    accent: "#8700ff",            // theme.ts:26: merged-PR purple, light
    text: "#1e1e1e", border: "#c4c0b6",
  },
} as const;
export type Palette = (typeof PALETTES)[Theme];

// OpenTUI reports the terminal's theme via OSC 11/CSI?996; null when the terminal says nothing.
export async function pickPalette(renderer: { waitForThemeMode(ms?: number): Promise<Theme | null> }): Promise<Palette> {
  return PALETTES[(await renderer.waitForThemeMode(300)) ?? "dark"];
}

// thimble: card-tool.md:35 (glyph legends), terminal screenshot legend `● merged ◆ review ▲ revert · status`
export const GLYPH = { entry: "●", step: "◆", risk: "▲", store: "·", select: "▸" } as const;

// ---- chunks: text, gray labels, bold values (card-tool.md:33) -------------------------------------------------
export const plain = (p: Palette, s: string): Chunk => fg(p.text)(s);
export const label = (p: Palette, s: string): Chunk => fg(p.gray)(s);
export const value = (p: Palette, s: string): Chunk => bold(fg(p.text)(s));
export const accent = (p: Palette, s: string): Chunk => fg(p.accent)(s);
export const mark = (p: Palette, glyph: string, cat: number | "gray"): Chunk =>
  fg(cat === "gray" ? p.gray : p.cat[cat])(glyph);
export const styled = (chunks: Chunk[]) => new StyledText(chunks);

// thimble: refs are `file#L12`, in the first category colour (screenshot: events.jsonl#L365 blue).
export const ref = (p: Palette, s: string): Chunk => fg(p.cat[0])(s);

// "Orders settle in **3 hops**": default text with the important entities bold (screenshot answer line).
export function rich(p: Palette, s: string): Chunk[] {
  return s.split("**").map((part, i) => (i % 2 ? value(p, part) : plain(p, part)));
}

// thimble screenshot footer: `thimble j k card keys · v visualize …` — key letters in accent, words in gray.
export function keybar(p: Palette, name: string, keys: [string, string][]): Chunk[] {
  const out: Chunk[] = [bold(fg(p.accent)(name)), label(p, " ")];
  keys.forEach(([k, word], i) => {
    if (i) out.push(label(p, " · "));
    out.push(accent(p, k), label(p, ` ${word}`));
  });
  return out;
}

// card-tool.md:35: show what each colour and symbol means with a sample.
export function legend(p: Palette, items: [glyph: string, cat: number | "gray", word: string][]): Chunk[] {
  return items.flatMap(([g, c, w], i) => [...(i ? [plain(p, "  ")] : []), mark(p, g, c), label(p, ` ${w}`)]);
}

// card-tool.md:39: size each column from its longest value.
export const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));
