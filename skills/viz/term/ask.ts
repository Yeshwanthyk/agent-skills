// "ask": type `about <label> @<ref>: ` into the origin agent pane, without Enter, then focus that pane.
export const MAX_LABEL = 120;

// Pure: the text typed into the pane. Any whitespace run (newline, tab, CR) collapses to one space so the text can
// never submit; other control, zero-width and bidi characters are dropped; a very long label is cut with an ellipsis.
export function askText(label: string, ref?: string): string {
  const clean = (s: string) => s.replace(/[\r\n\t\v\f\u0085\p{Zl}\p{Zp}]+|\s{2,}/gu, " ")
    // C0, DEL and C1 (U+009B is a one-byte CSI) controls, plus zero-width and bidi marks that hide what is typed.
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/gu, "").trim();
  let l = clean(label);
  if (l.length > MAX_LABEL) l = `${[...l].slice(0, MAX_LABEL - 1).join("")}…`;
  const r = ref ? clean(ref).replace(/\s/g, "") : "";
  return `about ${l}${r ? ` @${r}` : ""}: `;
}

export type Target = { session?: string; block: string; focus: boolean };
type Run = (argv: string[]) => Promise<{ code: number; err: string }>;

const run: Run = async (argv) => {
  try {
    const p = Bun.spawn(argv, { stdin: "ignore", stdout: "ignore", stderr: "pipe" });
    const [err, code] = await Promise.all([new Response(p.stderr).text(), p.exited]);
    return { code, err: err.trim() };
  } catch (e) { return { code: 127, err: e instanceof Error ? e.message : String(e) }; }
};

// Returns "" on success, else a one-line error for the hint row. `exec` is injectable for tests.
export async function sendAsk(t: Target, text: string, exec: Run = run): Promise<string> {
  const scope = t.session ? ["-s", t.session] : [];
  const sent = await exec(["rex", "send", ...scope, "-b", t.block, "--", text]);
  if (sent.code) return oneLine(`rex send failed: ${sent.err || `exit ${sent.code}`}`);
  if (t.focus) {
    const f = await exec(["rex", "focus", ...scope, t.block]);
    if (f.code) return oneLine(`typed, but rex focus failed: ${f.err || `exit ${f.code}`}`);
  }
  return "";
}
const oneLine = (s: string) => s.replace(/\s+/g, " ").slice(0, 160);
