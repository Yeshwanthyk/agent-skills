# Blocks

The scene API. Full working scenes live in `examples/`: `starter` (flow and packets), `optmem` (orb assembly, tree, camera pan), `stop-waits` (race, rewind, gauge, burst, diff). Copy from them before inventing.

```js
mx.scene({ title: ["#50042", "stop waits for the process"], highlight: ["binds cleanly."] }, (s) => {
  s.box("stop", "stop()", { at: [1.6, 3.4], status: "idle", enter: "before" });
  s.orb("old", "old server", { at: [9.6, 3], r: 80, status: "pid 4182" });
  s.wire("stop", "old", { id: "watch", enter: "watches" }).send("signalled", "SIGTERM");
  s.el("old").burst("out").exit("out+0.6");
});
```

## Time

Every `ref` is a time: a number of seconds, or a spoken word from `narration.txt`.

- `"collided"`: the word's start. `"one#2"` is its second occurrence. Matching ignores case and punctuation.
- `"fold+0.5"`, `"after-0.3"`, `"then+0.35+0.9"`: offsets in seconds.
- `"+0.4"`: relative to the previous ref in the scene.
- `s.at(ref)` returns the number, for durations: `const grace = s.at("out") - s.at("watches")`.

In narration, `[SIGKILL](sig kill)` shows the first part and speaks the second. Cue on the shown word.

## Placement

`at: [col, row]` on a 12 × 6 grid over the safe area (x 140–1780, y 180–900); `[6, 3]` is the centre and fractions are fine. `at: { x, y }` takes stage pixels (1920 × 1080). Every block is placed by its centre. Title, act pill and caption own the top and bottom bands.

## Blocks

Every block takes `{ at, tone, enter, exit, enterDur, inspect }`. `enter` defaults to 0; pass `enter: false` to start hidden. `tone` is `ink` (default), `dim`, `amber`, `coral`, `green` or `blue`.

- `s.box(id, title, { status, spin, size })`: a titled card with a status line. `spin: true` shows a spinner, `"ok"` shows a check. `size: "sm"` is a 178px note card (amber title, wrapped status), used for log rows and leaves.
- `s.orb(id, label, { r, status, dots, labelSide })`: a rotating dotted sphere, the "live thing" (a process, a summary, a store). `labelSide: "right"` puts a compact label beside it.
- `s.wire(from, to, { id, shape, label })`: a connector between two block ids, drawn on as it enters. `shape` is `auto` (straight when aligned, else curve), `curve`, `elbow` or `straight`. It picks horizontal or vertical anchors from the geometry.
- `s.callout(anchorId, key, gloss, { side, rise })`: an elbow leader plus a tag reading `key · gloss`, amber key. It flips sides rather than leave the frame.
- `s.gauge(id, label, value, { unit, digits })`: a numeric pill. Animate it with `.set(ref, { value: 0 }, { dur })`.
- `s.tag(id, html)` and `s.text(id, html)`: a bordered label and loose text. `<em>` renders amber.
- `s.group(ids, html)`: a dashed bracket over blocks with a label above, for a pending or collective state ("nap owed · #0-1").
- `s.diff(id, file, lines)`: a code panel. Lines starting with `+` or `-` are additions and removals. Syntax colouring is built in.

## Changing over time

Methods chain, and each takes a `ref`:

- `.set(ref, { status, title, label, tone, value, pulse, spin, at }, { dur })`: numbers and positions ease (`dur` defaults to 0.45s), colour cross-fades, text types on.
- `.enter(ref)`, `.exit(ref)`, `.move(ref, at)`.
- wire `.send(ref, label, { back, tone, dur })` sends a packet along the wire (`back` runs it to-from). `.fail(ref)` flashes the wire and turns it coral.
- orb `.assemble(ref, fromIds, { dur })`: particles fly in from the source blocks and settle into the sphere. Use it instead of `enter` for an orb made from other things. `.burst(ref)` explodes it: flash, sparks, smoke, an empty ring.
- diff `.note(ref, lineIndex, html)` adds an inline leader note. `.apply(ref)` collapses the removed lines.

## Scene

- `s.act(name, ref, { tone })`: a chapter. It renames the pill (scrambled), and adds a scrub marker and a `[ ]` jump target.
- `s.rewind(fromRef, toRef, { dur })`: plays the timeline backwards to `toRef`, with scrambled labels, and drops every change between the two. Changes keyed after the rewind replay the story differently. Pick `toRef` after everything that should survive has entered.
- `s.pan(ref, { x, y, zoom }, { dur })`: camera. `s.pan(0, { y: -250 }, { dur: 0 })` starts offset.
- `s.end(ref)`: the end time. The default is the later of the last beat + 1.2s and the narration + 0.9s.
- `s.el(id)` gets a block. `s.draw((ctx, k) => …)` is the escape hatch: called every frame, after the built-in canvas, with `k = { t, tau, geo(id), state(id), tone(name, a), prog, inOut, lerp, clamp, rng }`. Draw with `k.tau` (story time, which runs backwards in a rewind) so drawings stay a pure function of time.

## Scene options

`title: [key, rest]` (typed in, key amber) · `highlight: [phrases]` (amber in captions) · `captions: false` · `css: "…"` (overrides, e.g. `:root { --mx-amber: #7fd1b9 }`; the variables are at the top of `engine/engine.css`).

## Explorer

`inspect: "text"` or `{ body, more, cite }` on any block shows an inspector on hover; `more` appears on click (click also pauses and focuses). Hover dims everything not connected through wires, callouts, groups or assembly. Put a `file:line` in `cite` for every behavioural claim. Keys: space, ←/→ (shift for one frame), `[ ]` acts, `m` mute, Esc.
