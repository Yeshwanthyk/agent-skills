import { expect, test } from "bun:test";
import { askText, MAX_LABEL, sendAsk } from "../ask";

test("label with ref", () => expect(askText("Order API", "api/orders.ts:8")).toBe("about Order API @api/orders.ts:8: "));
test("label without ref", () => { expect(askText("Order API")).toBe("about Order API: "); expect(askText("Order API", "")).toBe("about Order API: "); });
test("quotes and unicode pass through", () => expect(askText(`say "hi" it's ✓ é`)).toBe(`about say "hi" it's ✓ é: `));
test("newlines collapse so the text cannot submit", () => {
  const t = askText("a\nb\r\nc\td\u2028e", "x.ts:1\n2");
  expect(t).toBe("about a b c d e @x.ts:12: ");
  expect(/[\r\n\u0000-\u001f]/.test(t)).toBe(false);
});
test("control characters dropped", () => expect(askText("a\u001bb\u0003c")).toBe("about abc: "));
test("very long label is cut", () => {
  const t = askText("x".repeat(500), "f.ts:1");
  expect(t).toBe(`about ${"x".repeat(MAX_LABEL - 1)}… @f.ts:1: `);
});
test("sendAsk sends then focuses; errors become a line", async () => {
  const calls: string[][] = [];
  expect(await sendAsk({ session: "S", block: "B", focus: true }, "t", async (a) => (calls.push(a), { code: 0, err: "" }))).toBe("");
  expect(calls).toEqual([["rex", "send", "-s", "S", "-b", "B", "--", "t"], ["rex", "focus", "-s", "S", "B"]]);
  expect(await sendAsk({ block: "B", focus: false }, "t", async () => ({ code: 1, err: "bad\nblock" }))).toBe("rex send failed: bad block");
});

test("no adversarial label can put a control, newline or hidden mark into the typed text", () => {
  const bad = ["a\u009bb", "x\r\ny", "\u001b[2J", "t\u0003", "\u202egnp.exe", "z\u200bw", "\ufeffbom", "\u0085nel", "-x $(id) `id`", "a\u2028b"];
  for (const label of bad) for (const ref of [undefined, "a/b.ts:1", "x\ny.ts\u009b:2"]) {
    const out = askText(label, ref);
    expect(out).not.toMatch(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2028\u2029\u2066-\u2069\ufeff]/u);
    expect(out.startsWith("about ") && out.endsWith(": ")).toBe(true);
  }
});
