/* motion-explainer engine.
 *
 * A scene is a pure function of time: blocks carry keyframes, effects carry
 * start times, and render(t) derives every pixel from them. The explorer plays
 * it live; the recorder seeks it frame by frame. Scenes call mx.scene(); see
 * BLOCKS.md for the API. Nothing here is scene-specific.
 */
(() => {
"use strict";

// ─── utilities ─────────────────────────────────────────────────────────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, x) => a + (b - a) * x;
const prog = (t, start, dur) => (dur <= 0 ? (t >= start ? 1 : 0) : clamp((t - start) / dur));
const outCubic = (x) => 1 - (1 - x) ** 3;
const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const letters = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const bytes = (s) => new TextEncoder().encode(s).length;

const TONE = {
  ink: [233, 230, 225], dim: [138, 133, 126], amber: [230, 176, 79],
  coral: [224, 115, 106], green: [156, 196, 138], blue: [134, 174, 224],
};
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, x) => a.map((v, i) => lerp(v, b[i], x));
const toneOf = (name) => TONE[name] ?? TONE.ink;

// Grid: columns 0..12 across x 140..1780, rows 0..6 across y 180..900.
// [6, 3] is the center of the frame. Objects {x, y} are pixels.
function px(at) {
  if (Array.isArray(at)) return { x: 140 + (at[0] * 1640) / 12, y: 180 + (at[1] * 720) / 6 };
  return { x: at?.x ?? 960, y: at?.y ?? 540 };
}

// ─── narration ─────────────────────────────────────────────────────────────
// Script words, timed. Whistle's words can differ from the script ("for ever"
// vs "forever"), so script words map onto heard words by letter position.
function timedScript(text, timings) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  if (!timings?.words?.length) { // estimate, about 2.6 words a second
    let t = 0.5;
    return tokens.map((w) => {
      const d = 0.11 + 0.052 * letters(w).length, r = { w, s: t, e: t + d };
      t += d + (/[.!?]$/.test(w) ? 0.45 : /[,;:]$/.test(w) ? 0.18 : 0.04);
      return r;
    });
  }
  const heard = []; let n = 0;
  for (const w of timings.words) { const len = letters(w.w).length; heard.push({ a: n, b: n + len, s: w.s, e: w.e }); n += len; }
  const total = tokens.reduce((k, w) => k + letters(w).length, 0) || 1;
  const at = (p) => {
    p *= n / total;
    const h = heard.find((x) => p <= x.b) ?? heard[heard.length - 1];
    return lerp(h.s, h.e, clamp((p - h.a) / Math.max(1, h.b - h.a)));
  };
  let p = 0;
  return tokens.map((w) => { const len = letters(w).length; const r = { w, s: at(p), e: at(p + len) }; p += len; return r; });
}

// ─── syntax colouring for diff blocks ──────────────────────────────────────
const KW = new Set("const let var if else return yield function export import from await async new class extends for while of in try catch throw finally switch case break continue default type interface public private static def fn pub use mut impl struct enum match self this true false null undefined None".split(" "));
function colour(code) {
  const re = /(\/\/.*$|#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g;
  let out = "", last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    const tok = m[0], next = code.slice(m.index + tok.length);
    let cls = "";
    if (/^(\/\/|#)/.test(tok)) cls = "cm";
    else if (/^["'`]/.test(tok)) cls = "str";
    else if (/^\d/.test(tok)) cls = "num";
    else if (KW.has(tok)) cls = "kw";
    else if (/^\s*\(/.test(next) || /^[A-Z]/.test(tok)) cls = "fn";
    out += cls ? `<span class="${cls}">${esc(tok)}</span>` : esc(tok);
    last = m.index + tok.length;
  }
  return out + esc(code.slice(last));
}

// ─── the scene ─────────────────────────────────────────────────────────────
const mx = (window.mx = window.mx || {});
const warnings = new Set();
const warn = (msg) => warnings.add(msg);

mx.scene = function scene(opts, build) {
  const narration = (window.MX_NARRATION ?? opts.narration ?? "").trim();
  const script = timedScript(narration, window.MX_TIMINGS);
  const S = {
    opts, script, els: [], byId: new Map(), events: [], acts: [], rewinds: [], pans: [], draws: [], end: null, last: 0,
  };

  // time references: 3.2 | "word" | "word#2" | "word+0.3" | "+0.4" (after the last reference)
  function at(ref) {
    if (typeof ref === "number") return (S.last = ref);
    const m = /^\s*([a-z0-9'’]+)?(?:#(\d+))?\s*((?:[+-]\s*\d*\.?\d+\s*)*)$/i.exec(String(ref ?? ""));
    if (!m) { warn(`bad time reference "${ref}"`); return S.last; }
    let base = S.last;
    if (m[1]) {
      const hits = script.filter((w) => letters(w.w) === letters(m[1]));
      const hit = hits[(Number(m[2]) || 1) - 1];
      if (!hit) warn(`"${m[1]}${m[2] ? "#" + m[2] : ""}" is not a word in the narration`);
      base = hit ? hit.s : S.last;
    }
    return (S.last = base + (m[3].match(/[+-]\s*\d*\.?\d+/g) ?? []).reduce((a, x) => a + Number(x.replace(/\s/g, "")), 0));
  }

  class Block {
    constructor(kind, id, base, o = {}) {
      if (S.byId.has(id)) warn(`duplicate id "${id}"`);
      Object.assign(this, { kind, id, o, kf: [] });
      const p = px(o.at);
      this.base = { shown: 0, x: p.x, y: p.y, toneC: toneOf(o.tone ?? "ink"), tone: o.tone ?? "ink", ...base };
      S.els.push(this); S.byId.set(id, this);
      if (o.enter !== false) this.enter(o.enter ?? 0, { dur: o.enterDur });
      if (o.exit !== undefined) this.exit(o.exit);
    }
    set(ref, props, o = {}) { this.kf.push({ t: at(ref), props, dur: o.dur ?? 0.45 }); return this; }
    enter(ref, o = {}) { return this.set(ref, { shown: 1 }, { dur: o.dur ?? 0.55 }); }
    exit(ref, o = {}) { return this.set(ref, { shown: 0 }, { dur: o.dur ?? 0.4 }); }
    move(ref, to, o = {}) { const p = px(to); return this.set(ref, { x: p.x, y: p.y }, { dur: o.dur ?? 0.8 }); }
  }
  class Wire extends Block {
    send(ref, label = "", o = {}) { S.events.push({ kind: "send", el: this, t: at(ref), label, dur: o.dur ?? 0.9, tone: o.tone ?? "amber", back: !!o.back }); return this; }
    fail(ref) { S.events.push({ kind: "fail", el: this, t: at(ref) }); return this.set(S.last, { tone: "coral" }, { dur: 0.2 }); }
  }
  class Orb extends Block {
    assemble(ref, from, o = {}) { this.assembled = { t: at(ref), from: [].concat(from), dur: o.dur ?? 1.6 }; this.set(S.last, { shown: 1 }, { dur: 0.01 }); return this; }
    burst(ref) { S.events.push({ kind: "burst", el: this, t: at(ref) }); return this; }
  }
  class Diff extends Block {
    apply(ref, o = {}) { return this.set(ref, { applied: 1 }, { dur: o.dur ?? 0.7 }); }
    note(ref, line, html) { (this.notes ??= []).push({ t: at(ref), line, html }); return this; }
  }

  let auto = 0;
  const id = (o, p) => o.id ?? `${p}${++auto}`;
  const api = {
    at,
    act(name, ref = 0, o = {}) { S.acts.push({ name, t: at(ref), tone: o.tone }); return api; },
    box: (id_, title, o = {}) => new Block("box", id_, { title, status: o.status ?? "", spin: o.spin ?? false, size: o.size ?? "md" }, o),
    orb: (id_, label, o = {}) => new Orb("orb", id_, { label, status: o.status ?? "", r: o.r ?? 90 }, { ...o, enter: o.enter ?? (o.assemble ? false : 0) }),
    wire: (from, to, o = {}) => new Wire("wire", id(o, "wire"), { from, to, shape: o.shape ?? "auto", label: o.label ?? "" }, o),
    callout: (anchor, key, gloss = "", o = {}) => new Block("callout", id(o, "callout"), { anchor, key, gloss, side: o.side ?? "right" }, { tone: "amber", ...o }),
    gauge: (id_, label, value, o = {}) => new Block("gauge", id_, { label, value, unit: o.unit ?? "", digits: o.digits ?? 1 }, o),
    tag: (id_, html, o = {}) => new Block("tag", id_, { html }, o),
    text: (id_, html, o = {}) => new Block("text", id_, { html }, o),
    group: (ids, label, o = {}) => new Block("group", id(o, "group"), { ids, label }, { tone: "amber", ...o }),
    diff: (id_, file, lines, o = {}) => new Diff("diff", id_, { file, lines, applied: 0 }, { at: [6, 3.2], ...o }),
    pan(ref, to, o = {}) { S.pans.push({ t: at(ref), to, dur: o.dur ?? 1.2 }); return api; },
    rewind(ref, toRef, o = {}) { const s = at(ref), g = at(toRef); S.rewinds.push({ s, g, d: o.dur ?? 1.4 }); S.last = s + (o.dur ?? 1.4); return api; },
    draw(fn) { S.draws.push(fn); return api; },
    end(ref) { S.end = at(ref); return api; },
    el: (id_) => S.byId.get(id_),
  };
  build(api);

  for (const e of S.els) e.kf.sort((a, b) => a.t - b.t);
  for (const r of S.rewinds) for (const e of S.els) for (const k of e.kf) if (k.t > r.s && k.t < r.s + r.d) warn(`"${e.id}" changes during a rewind at ${k.t.toFixed(2)}s`);
  if (!S.acts.length && opts.acts) opts.acts.forEach((a, i) => S.acts.push({ name: a, t: i ? Infinity : 0 }));
  S.acts.sort((a, b) => a.t - b.t);
  S.rewinds.sort((a, b) => a.s - b.s);
  S.pans.sort((a, b) => a.t - b.t);
  for (const w of S.els.filter((e) => e.kind === "wire")) for (const end of [w.base.from, w.base.to]) if (!S.byId.has(end)) warn(`wire "${w.id}" points at missing "${end}"`);

  const lastBeat = Math.max(0, ...S.els.flatMap((e) => e.kf.map((k) => k.t + k.dur)), ...S.events.map((e) => e.t + (e.dur ?? 1)),
    ...S.els.filter((e) => e.assembled).map((e) => e.assembled.t + e.assembled.dur), ...S.rewinds.map((r) => r.s + r.d));
  const speechEnd = script.length ? script[script.length - 1].e : 0;
  S.END = S.end ?? Math.max(lastBeat + 1.2, speechEnd + 0.9);
  start(S);
  return S;
};

// ─── time: rewinds replay the timeline backwards, then drop what they undid ──
function timeAt(S, t) {
  const done = S.rewinds.filter((r) => t >= r.s + r.d);
  const cur = S.rewinds.find((r) => t >= r.s && t < r.s + r.d);
  const drop = (k) => done.some((r) => k > r.g && k <= r.s);
  if (cur) { const p = inOut((t - cur.s) / cur.d); return { tau: lerp(cur.s, cur.g, p), drop, rewind: Math.sin(p * Math.PI) }; }
  return { tau: t, drop, rewind: 0 };
}

function stateOf(el, tau, drop) {
  const st = { ...el.base, since: {} };
  for (const k of el.kf) {
    if (k.t > tau) break;
    if (drop(k.t)) continue;
    const p = k.dur > 0 ? inOut(prog(tau, k.t, k.dur)) : 1;
    for (const [key, v] of Object.entries(k.props)) {
      if (key === "tone") { st.toneC = mixc(st.toneC, toneOf(v), p); st.tone = v; }
      else if (key === "at") { const q = px(v); st.x = lerp(st.x, q.x, p); st.y = lerp(st.y, q.y, p); }
      else if (typeof v === "number" && typeof st[key] === "number") st[key] = lerp(st[key], v, p);
      else if (st[key] !== v) { st[key] = v; st.since[key] = k.t; }
    }
  }
  return st;
}

// ─── runtime ───────────────────────────────────────────────────────────────
function start(S) {
  const RECORD = new URLSearchParams(location.search).has("record");
  document.documentElement.classList.add(RECORD ? "mx-record" : "mx-explore");
  const opts = S.opts;
  if (opts.title) document.title = [].concat(opts.title).join(" · ");
  if (opts.css) document.head.appendChild(Object.assign(document.createElement("style"), { textContent: opts.css }));

  if (!document.getElementById("mx-stage")) throw new Error("mx: the page needs engine/shell.html; build it with `mx build`");
  const $ = (s) => document.querySelector(s);
  const stage = $("#mx-stage"), world = $("#mx-world"), dom = $("#mx-dom");
  const ctx = $("#mx-fx").getContext("2d");
  const audio = new Audio();
  if (window.MX_AUDIO) audio.src = window.MX_AUDIO;

  { // grain, drawn once
    const g = $("#mx-grain").getContext("2d"), img = g.createImageData(960, 540), r = rng(42);
    for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
  }

  // DOM for each block
  const div = (cls, html = "", parent = dom) => { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; parent.appendChild(d); return d; };
  for (const e of S.els) {
    const b = e.base;
    if (e.kind === "box") e.node = div(`mx-el mx-box ${b.size === "sm" ? "sm" : ""}`, `<div class="t"></div><div class="s"><span class="mx-spin"></span><span class="v"></span></div>`);
    else if (e.kind === "orb") { e.node = div(`mx-el mx-orb-label ${e.o.labelSide === "right" ? "right" : ""}`, `<div class="t"></div><div class="s"><b></b><span class="v"></span></div>`); e.hit = div("mx-hit"); e.hit.dataset.mx = e.id; }
    else if (e.kind === "callout" || e.kind === "tag") e.node = div("mx-el mx-tag");
    else if (e.kind === "group") e.node = div("mx-el mx-tag");
    else if (e.kind === "gauge") e.node = div("mx-el mx-gauge");
    else if (e.kind === "text") e.node = div("mx-el mx-text", b.html);
    else if (e.kind === "diff") {
      e.node = div("mx-el mx-diff", `<div class="h"><b></b>${esc(b.file)}</div><div class="b"></div>`);
      const body = e.node.querySelector(".b");
      e.lineEls = b.lines.map((line, i) => {
        const op = line[0] === "+" || line[0] === "-" ? line[0] : " ";
        const code = op === " " && line[0] !== " " ? line : line.slice(1);
        const l = div(`l ${op === "+" ? "add" : op === "-" ? "del" : ""}`, `<span class="g">${op === " " ? "" : op}</span>${colour(code)}<span class="note"></span>`, body);
        return { l, op, i };
      });
    }
    if (e.node && e.kind !== "wire") e.node.dataset.mx = e.id;
  }

  // assemble flights and burst particles, from seeds
  const spherePts = (n) => Array.from({ length: n }, (_, k) => { const y = 1 - (2 * (k + 0.5)) / n, r = Math.sqrt(1 - y * y), phi = k * 2.399963; return [Math.cos(phi) * r, y, Math.sin(phi) * r]; });
  for (const e of S.els.filter((x) => x.kind === "orb")) {
    e.pts = spherePts(e.o.dots ?? Math.round(clamp(e.base.r * e.base.r * 0.11, 90, 900)));
    const r = rng(hash(e.id));
    e.flights = e.pts.map((_, k) => ({ src: k % Math.max(1, e.assembled?.from.length ?? 1), fx: r() - 0.5, fy: r() - 0.5, delay: r() * 0.32, bend: (r() - 0.5) * 80, lift: 30 + r() * 60 }));
  }
  for (const ev of S.events.filter((x) => x.kind === "burst")) {
    const r = rng(hash(ev.el.id + ev.t)), R = ev.el.base.r;
    ev.sparks = Array.from({ length: 700 }, () => { const a = r() * Math.PI * 2, sp = (0.35 + r() * r() * 2.4) * R * 2.2; return { a, sp, life: 0.6 + r() * 1.6, size: 0.6 + r() * 1.8, hot: r() }; });
    ev.smoke = Array.from({ length: 26 }, () => ({ dx: (r() - 0.5) * R * 1.4, dy: (r() - 0.5) * R * 1.0 - R * 0.2, s: 0.6 + r() * 0.8, rise: 20 + r() * 50 }));
  }

  // ─── explorer state, layered over the timeline ───
  const ui = { hover: null, focus: null };
  const links = new Map(S.els.map((e) => [e.id, new Set([e.id])]));
  const link = (a, b) => { links.get(a)?.add(b); links.get(b)?.add(a); };
  for (const e of S.els) {
    if (e.kind === "wire") { link(e.id, e.base.from); link(e.id, e.base.to); link(e.base.from, e.base.to); }
    if (e.kind === "callout") link(e.id, e.base.anchor);
    if (e.kind === "group") for (const g of e.base.ids) link(e.id, g);
    if (e.assembled) for (const f of e.assembled.from) link(e.id, f);
  }
  const related = (key) => { const set = new Set(links.get(key)); for (const k of [...set]) if (S.byId.get(k)?.kind === "wire") for (const j of links.get(k)) set.add(j); return set; };

  // ─── render ───
  const cache = new WeakMap();
  const setText = (node, value) => { if (cache.get(node) !== value) { cache.set(node, value); node.textContent = value; } };
  const setHTML = (node, value) => { if (cache.get(node) !== value) { cache.set(node, value); node.innerHTML = value; } };
  const typed = (s, tau, since, cps = 48) => (since === undefined ? s : s.slice(0, Math.max(0, Math.floor((tau - since) * cps))));
  const scramble = (s, amount, seed) => { if (amount < 0.05) return s; const r = rng(seed); return s.replace(/\S/g, (c) => (r() < amount * 0.8 ? "abcdefghijklmnopqrstuvwxyz#_·"[Math.floor(r() * 29)] : c)); };

  let geo = new Map(); // id -> {x, y, w, h, r, shown}

  function render(t) {
    const { tau, drop, rewind } = timeAt(S, t);
    const active = ui.focus ?? ui.hover, rel = active ? related(active) : null;
    const dimOf = (id) => (rel && !rel.has(id) ? 0.25 : 1);
    const st = new Map(S.els.map((e) => [e.id, stateOf(e, tau, drop)]));
    const scr = Math.floor(t * 30);

    // camera
    let cam = { x: 0, y: 0, zoom: 1 };
    for (const p of S.pans) { if (p.t > tau || drop(p.t)) continue; const q = inOut(prog(tau, p.t, p.dur)); cam = { x: lerp(cam.x, p.to.x ?? cam.x, q), y: lerp(cam.y, p.to.y ?? cam.y, q), zoom: lerp(cam.zoom, p.to.zoom ?? cam.zoom, q) }; }
    world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`;
    world.style.filter = rewind > 0.02 ? `saturate(${1 - 0.6 * rewind}) brightness(${1 - 0.15 * rewind})` : "";

    // chrome
    const [k, r] = [].concat(opts.title ?? ["", ""]);
    const n = Math.floor(t * 34), rr = `  ${r ?? ""}`;
    setText($("#mx-title .k"), (k ?? "").slice(0, n));
    setText($("#mx-title .r"), rr.slice(0, Math.max(0, n - (k ?? "").length)));
    $("#mx-title .mx-cursor").style.opacity = n < (k ?? "").length + rr.length + 4 ? 1 : 0;
    const acts = S.acts.filter((a) => !drop(a.t));
    const act = [...acts].reverse().find((a) => tau >= a.t) ?? acts[0];
    const pill = $("#mx-pill");
    if (act) {
      const since = tau - act.t, name = rewind > 0.02 ? "◂◂ rewind" : act.name;
      setText(pill.querySelector("span"), since < 0.35 && act.t > 0 && !rewind ? name.replace(/\S/g, (c, i) => (i / name.length < since / 0.35 ? c : "abcdefghijklmnopqrstuvwxyz#_·"[(scr * 7 + i * 13) % 29])) : name);
      pill.querySelector("i").style.background = rgba(rewind > 0.02 ? TONE.amber : toneOf(act.tone ?? (act === acts[0] ? "dim" : "amber")));
      pill.style.opacity = prog(t, 0.5, 0.4);
    } else pill.style.opacity = 0;

    // caption: the sentence being spoken, typed word by word
    renderCaption(t);

    // blocks: write text first, measure, then place
    for (const e of S.els) {
      const s = st.get(e.id), node = e.node;
      if (!node) continue;
      const sc = rewind > 0.02 ? rewind : 0;
      if (e.kind === "box") {
        setText(node.querySelector(".t"), scramble(s.title, sc, scr + 1));
        setText(node.querySelector(".v"), scramble(typed(s.status, tau, s.since.status), sc, scr + 2));
        const spin = node.querySelector(".mx-spin");
        spin.style.display = s.spin && e.base.size !== "sm" ? "" : "none";
        setText(spin, s.spin === "ok" ? "✓" : "◠");
        spin.style.transform = s.spin === true ? `rotate(${t * 400}deg)` : "";
      } else if (e.kind === "orb") {
        setText(node.querySelector(".t"), scramble(typed(s.label, tau, e.assembled ? e.assembled.t + e.assembled.dur * 0.62 : s.since.label, 30), sc, scr + 3));
        setText(node.querySelector(".v"), scramble(typed(s.status, tau, s.since.status ?? (e.assembled ? e.assembled.t + e.assembled.dur * 0.7 : undefined)), sc, scr + 4));
        node.querySelector(".s").style.display = s.status ? "" : "none";
      } else if (e.kind === "callout") setHTML(node, `<em>${esc(s.key)}</em>${s.gloss ? ` · ${esc(s.gloss)}` : ""}`);
      else if (e.kind === "group") setHTML(node, s.label);
      else if (e.kind === "tag") setHTML(node, s.html);
      else if (e.kind === "text") setHTML(node, s.html);
      else if (e.kind === "gauge") setHTML(node, `${esc(s.label)}  <em>${s.value.toFixed(s.digits)}</em> ${esc(s.unit)}`);
      else if (e.kind === "diff") {
        for (const { l, op, i } of e.lineEls) {
          const h = op === "-" ? 1 - s.applied : op === "+" ? 1 : 1;
          l.style.height = `${44 * h}px`; l.style.opacity = h; l.style.overflow = h < 1 ? "hidden" : "visible";
          const note = (e.notes ?? []).filter((x) => x.line === i && x.t <= tau && !drop(x.t)).pop();
          setHTML(l.querySelector(".note"), note ? `<i></i><span>${note.html}</span>` : "");
          l.querySelector(".note").style.opacity = note ? prog(tau, note.t, 0.4) : 0;
        }
      }
    }
    geo = new Map();
    for (const e of S.els) {
      const s = st.get(e.id);
      if (e.kind === "orb") geo.set(e.id, { x: s.x, y: s.y, w: s.r * 2, h: s.r * 2, r: s.r, shown: s.shown });
      else if (e.node && e.kind !== "callout" && e.kind !== "group") geo.set(e.id, { x: s.x, y: s.y, w: e.node.offsetWidth, h: e.node.offsetHeight, shown: s.shown });
    }
    for (const e of S.els) {
      const s = st.get(e.id), node = e.node, a = dimOf(e.id);
      if (!node) continue;
      const p = outCubic(clamp(s.shown));
      if (e.kind === "callout") {
        const g = geo.get(s.anchor); if (!g) continue;
        const w = node.offsetWidth, h = node.offsetHeight, reach = (g.r ?? g.w / 2) + 90 + w;
        let side = s.side === "left" ? -1 : 1;
        if (g.x + side * reach > 1860 || g.x + side * reach < 60) side = -side; // flip rather than leave the frame
        const ax = g.x + side * (g.r ?? g.w / 2), ay = g.y - (g.r ? g.r * 0.55 : 0);
        const tx = ax + side * 90, ty = ay - (e.o.rise ?? 44);
        node.style.transform = `translate(${side > 0 ? tx : tx - w}px, ${ty - h / 2}px)`;
        node.style.opacity = prog(s.shown, 0.6, 0.4) * a;
        e.leader = { ax, ay, tx, ty, p: clamp(s.shown / 0.7), toneC: s.toneC };
        continue;
      }
      if (e.kind === "group") {
        const boxes = s.ids.map((i) => geo.get(i)).filter(Boolean);
        if (!boxes.length) continue;
        const x0 = Math.min(...boxes.map((b) => b.x - b.w / 2)) - 18, x1 = Math.max(...boxes.map((b) => b.x + b.w / 2)) + 18, y = Math.min(...boxes.map((b) => b.y - b.h / 2)) - 22;
        e.bracket = { x0, x1, y, a: p * a, toneC: s.toneC };
        node.style.transform = `translate(${(x0 + x1) / 2 - node.offsetWidth / 2}px, ${y - 30 - node.offsetHeight}px)`;
        node.style.opacity = p * a;
        continue;
      }
      const g = geo.get(e.id);
      if (e.kind === "diff") { e.h0 = Math.max(e.h0 ?? 0, node.offsetHeight); node.style.transform = `translate(${s.x - node.offsetWidth / 2}px, ${s.y - e.h0 / 2 + (1 - p) * 16}px)`; node.style.opacity = p * a; continue; }
      const yOff = e.kind === "orb" ? (e.o.labelSide === "right" ? 0 : s.r + 16 + g.h / 2) : 0;
      const xOff = e.kind === "orb" && e.o.labelSide === "right" ? s.r + 16 + node.offsetWidth / 2 : 0;
      const shownLabel = e.kind === "orb" ? (e.assembled ? prog(tau, e.assembled.t + e.assembled.dur * 0.6, 0.3) * (e.assembled.t <= tau && !drop(e.assembled.t) ? 1 : 0) : p) : p;
      node.style.transform = `translate(${s.x + xOff - node.offsetWidth / 2}px, ${s.y + yOff - node.offsetHeight / 2 + (1 - p) * 16}px)`;
      node.style.opacity = shownLabel * a;
      node.style.filter = p < 0.999 && p > 0 ? `blur(${(1 - p) * 6}px)` : "";
      node.style.pointerEvents = shownLabel > 0.5 ? "auto" : "none";
      if (e.hit) { Object.assign(e.hit.style, { left: `${s.x - s.r - 8}px`, top: `${s.y - s.r - 8}px`, width: `${2 * s.r + 16}px`, height: `${2 * s.r + 16}px`, pointerEvents: shownLabel > 0.5 ? "auto" : "none" }); }
      // tone: border, glow, status colour
      if (e.kind === "box" || e.kind === "gauge" || e.kind === "tag") {
        const tn = s.toneC, neutral = s.tone === "ink" || s.tone === "dim";
        const pulse = s.pulse ? 0.6 + 0.4 * Math.sin(t * 7) : 1;
        node.style.borderColor = neutral ? "" : rgba(tn, 0.3 + 0.5 * pulse);
        node.style.boxShadow = neutral ? "" : `0 0 ${26 * pulse}px ${rgba(tn, 0.22 * pulse)}, 0 12px 34px rgba(0,0,0,.55)`;
        node.style.background = s.tone === "coral" ? "linear-gradient(180deg, #2a1514, #1a0e0d)" : "";
        if (e.kind === "box") {
          node.querySelector(".s").style.color = neutral ? (e.base.size === "sm" ? "" : "") : rgba(tn);
          node.querySelector(".t").style.color = s.tone === "coral" ? rgba(tn) : "";
          if (e.base.size === "sm") node.querySelector(".s").style.color = s.tone === "dim" ? rgba(TONE.ink, 0.62) : "";
        }
      }
      if (e.kind === "orb") {
        const sEl = node.querySelector(".s");
        sEl.style.color = s.tone === "ink" ? "" : rgba(s.toneC);
        sEl.querySelector("b").style.color = rgba(s.tone === "ink" ? TONE.amber : s.toneC);
      }
    }

    drawFx(t, tau, drop, st, dimOf, cam);
    S.lastFrame = { t, tau, st };
  }

  function renderCaption(t) {
    const cap = $("#mx-caption");
    const sentences = []; let cur = [];
    for (const w of S.script) { cur.push(w); if (/[.!?]$/.test(w.w)) { sentences.push(cur); cur = []; } }
    if (cur.length) sentences.push(cur);
    let si = -1;
    sentences.forEach((s, k) => { if (t >= s[0].s - 0.05) si = k; });
    if (si < 0 || opts.captions === false) { setHTML(cap, ""); return; }
    const s = sentences[si];
    const fade = si === sentences.length - 1 ? 1 - prog(t, S.END - 0.6, 0.5) : 1 - prog(t, sentences[si + 1][0].s - 0.25, 0.2);
    const shown = [];
    for (const w of s) { if (t < w.s) break; const f = clamp((t - w.s) / Math.max(0.08, w.e - w.s)); shown.push(w.w.slice(0, Math.ceil(f * w.w.length))); }
    let html = esc(shown.join(" "));
    for (const phrase of opts.highlight ?? []) { // whole words, punctuation-insensitive
      const want = phrase.split(/\s+/).map(letters).join(" ");
      for (let a = 0; a < shown.length; a++) for (let b = a + 1; b <= shown.length; b++) {
        if (shown.slice(a, b).map(letters).join(" ") === want) {
          html = [esc(shown.slice(0, a).join(" ")), `<em>${esc(shown.slice(a, b).join(" "))}</em>`, esc(shown.slice(b).join(" "))].filter(Boolean).join(" ");
        }
      }
    }
    const typing = s.some((w) => t >= w.s && t < w.e + 0.1);
    setHTML(cap, html + (typing ? `<span class="mx-cursor"></span>` : ""));
    cap.style.opacity = fade;
  }

  // ─── canvas ───
  function anchorsOf(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const horiz = Math.abs(dx) >= Math.abs(dy) * 0.9;
    const edge = (g, sx, sy) => (g.r ? [g.x + sx * g.r, g.y + sy * g.r] : [g.x + (sx * g.w) / 2, g.y + (sy * g.h) / 2]);
    if (horiz) { const s = Math.sign(dx) || 1; return { p0: edge(a, s, 0), p1: edge(b, -s, 0), d0: [s, 0], d1: [-s, 0], horiz }; }
    const s = Math.sign(dy) || 1; return { p0: edge(a, 0, s), p1: edge(b, 0, -s), d0: [0, s], d1: [0, -s], horiz };
  }
  function wirePath(w, s) {
    const a = geo.get(s.from), b = geo.get(s.to);
    if (!a || !b) return null;
    const { p0, p1, d0, d1, horiz } = anchorsOf(a, b);
    const shape = s.shape === "auto" ? (Math.abs(p0[0] - p1[0]) < 2 || Math.abs(p0[1] - p1[1]) < 2 ? "straight" : "curve") : s.shape;
    const pts = [];
    if (shape === "straight") { for (let i = 0; i <= 24; i++) pts.push([lerp(p0[0], p1[0], i / 24), lerp(p0[1], p1[1], i / 24)]); }
    else if (shape === "elbow") {
      const mid = horiz ? [(p0[0] + p1[0]) / 2, p0[1]] : [p0[0], (p0[1] + p1[1]) / 2];
      const mid2 = horiz ? [mid[0], p1[1]] : [p1[0], mid[1]];
      for (const [q0, q1] of [[p0, mid], [mid, mid2], [mid2, p1]]) for (let i = 0; i < 12; i++) pts.push([lerp(q0[0], q1[0], i / 12), lerp(q0[1], q1[1], i / 12)]);
      pts.push(p1);
    } else {
      const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * 0.5;
      const c0 = [p0[0] + d0[0] * L, p0[1] + d0[1] * L], c1 = [p1[0] + d1[0] * L, p1[1] + d1[1] * L];
      for (let i = 0; i <= 48; i++) { const u = i / 48, m = 1 - u; pts.push([m ** 3 * p0[0] + 3 * m * m * u * c0[0] + 3 * m * u * u * c1[0] + u ** 3 * p1[0], m ** 3 * p0[1] + 3 * m * m * u * c0[1] + 3 * m * u * u * c1[1] + u ** 3 * p1[1]]); }
    }
    const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, len, total: len[len.length - 1] };
  }
  const pointAt = (path, f) => {
    const L = clamp(f) * path.total; let i = 1;
    while (i < path.len.length - 1 && path.len[i] < L) i++;
    const u = (L - path.len[i - 1]) / Math.max(1e-6, path.len[i] - path.len[i - 1]);
    return [lerp(path.pts[i - 1][0], path.pts[i][0], u), lerp(path.pts[i - 1][1], path.pts[i][1], u)];
  };
  const stroke = (path, upTo) => { ctx.beginPath(); ctx.moveTo(...path.pts[0]); for (let i = 1; i < path.pts.length; i++) { if (path.len[i] > upTo * path.total) { ctx.lineTo(...pointAt(path, upTo)); break; } ctx.lineTo(...path.pts[i]); } ctx.stroke(); };

  function project(e, s, p, t) {
    const a = t * 0.45 + (hash(e.id) % 100) / 10, tilt = 0.38;
    const x1 = p[0] * Math.cos(a) + p[2] * Math.sin(a), z1 = -p[0] * Math.sin(a) + p[2] * Math.cos(a);
    const y2 = p[1] * Math.cos(tilt) - z1 * Math.sin(tilt), z2 = p[1] * Math.sin(tilt) + z1 * Math.cos(tilt);
    return [s.x + x1 * s.r, s.y + y2 * s.r, z2];
  }
  const bez = (x0, y0, cx, cy, x1, y1, u) => { const m = 1 - u; return [m * m * x0 + 2 * m * u * cx + u * u * x1, m * m * y0 + 2 * m * u * cy + u * u * y1]; };

  function drawFx(t, tau, drop, st, dimOf) {
    ctx.clearRect(0, 0, 1920, 1080);
    const live = (ev) => ev.t <= tau && !drop(ev.t);

    for (const e of S.els) { // group brackets
      if (e.kind !== "group" || !e.bracket || e.bracket.a <= 0) continue;
      const { x0, x1, y, a, toneC } = e.bracket;
      ctx.strokeStyle = rgba(toneC, 0.7 * a); ctx.lineWidth = 1; ctx.setLineDash([4, 5]); ctx.lineDashOffset = -t * 20;
      ctx.beginPath(); ctx.moveTo(x0, y + 10); ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, y + 10); ctx.stroke(); ctx.setLineDash([]);
    }

    for (const e of S.els) { // wires
      if (e.kind !== "wire") continue;
      const s = st.get(e.id); if (s.shown <= 0) continue;
      const path = wirePath(e, s); if (!path) continue;
      const a = dimOf(e.id), neutral = s.tone === "ink";
      const fails = S.events.filter((ev) => ev.el === e && ev.kind === "fail" && live(ev));
      const flash = fails.length ? Math.exp(-(((tau - fails[fails.length - 1].t) / 0.25) ** 2)) : 0;
      ctx.strokeStyle = neutral ? `rgba(255,255,255,${(0.22 + 0.3 * flash) * a})` : rgba(s.toneC, (0.55 + 0.45 * flash) * a);
      ctx.lineWidth = 1 + flash * 1.5;
      stroke(path, inOut(clamp(s.shown)));
      ctx.fillStyle = rgba(neutral ? [200, 190, 180] : s.toneC, 0.8 * a);
      ctx.beginPath(); ctx.arc(...path.pts[0], 2.2, 0, 7); ctx.fill();
      if (s.shown > 0 && s.shown < 1) { const [x, y] = pointAt(path, inOut(s.shown)); ctx.fillStyle = "rgba(255,215,150,.95)"; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 7); ctx.fill(); }
      if (s.label) { const [x, y] = pointAt(path, 0.5); ctx.font = "15px 'MX Plex Mono', monospace"; ctx.fillStyle = rgba(neutral ? TONE.dim : s.toneC, a * clamp(s.shown)); ctx.textAlign = "center"; ctx.fillText(s.label, x, y - 12); }
      for (const ev of S.events) { // packets
        if (ev.el !== e || ev.kind !== "send" || !live(ev)) continue;
        const u = (tau - ev.t) / ev.dur; if (u > 1.15) continue;
        const f = inOut(clamp(u)), dir = ev.back ? 1 - f : f, tc = toneOf(ev.tone), fade = 1 - prog(u, 1, 0.15);
        ctx.globalCompositeOperation = "lighter";
        for (let k = 0; k < 14; k++) { const [x, y] = pointAt(path, ev.back ? dir + k * 0.012 : dir - k * 0.012); ctx.fillStyle = rgba(tc, (0.5 - k * 0.034) * fade * a); ctx.beginPath(); ctx.arc(x, y, 3 - k * 0.15, 0, 7); ctx.fill(); }
        ctx.globalCompositeOperation = "source-over";
        const [x, y] = pointAt(path, dir);
        ctx.fillStyle = `rgba(255,240,220,${fade * a})`; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
        if (ev.label) { ctx.font = "16px 'MX Plex Mono', monospace"; ctx.textAlign = "center"; ctx.fillStyle = rgba(tc, fade * a); ctx.fillText(ev.label, x, y - 14); }
      }
    }

    ctx.globalCompositeOperation = "lighter";
    for (const e of S.els) { // orbs: assembly flights, dots, bursts
      if (e.kind !== "orb") continue;
      const s = st.get(e.id), a = dimOf(e.id);
      const asm = e.assembled && !drop(e.assembled.t) ? e.assembled : null;
      if (e.assembled && !asm) continue;
      const u = asm ? (tau - asm.t) / asm.dur : 99;
      if (asm && u <= 0) continue;
      if (!asm && s.shown <= 0) continue;
      const bursts = S.events.filter((ev) => ev.el === e && ev.kind === "burst" && live(ev));
      const burst = bursts[bursts.length - 1], bu = burst ? tau - burst.t : -1;
      const tone = s.tone === "ink" ? [236, 220, 212] : mixc([236, 220, 212], s.toneC, 0.45);
      const sources = asm ? asm.from.map((f) => geo.get(f)).filter(Boolean) : [];
      const shell = burst ? 1 - prog(bu, 0, 0.12) : clamp(s.shown);
      e.pts.forEach((p, k) => {
        const f = e.flights[k];
        const [tx, ty, z] = project(e, s, p, t);
        const v = asm ? clamp((u - f.delay) / 0.42) : 1;
        if (v <= 0) return;
        if (v < 1 && sources.length) {
          const src = sources[f.src % sources.length];
          const sx = src.x + f.fx * (src.r ? src.r : src.w * 0.85), sy = src.y + f.fy * (src.r ? src.r : src.h * 0.8);
          const cx = (sx + tx) / 2 + f.bend, cy = Math.min(sy, ty) - f.lift;
          const [x, y] = bez(sx, sy, cx, cy, tx, ty, inOut(v)), [x0, y0] = bez(sx, sy, cx, cy, tx, ty, inOut(Math.max(0, v - 0.07)));
          ctx.strokeStyle = `rgba(255,180,90,${0.55 * a})`; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
          ctx.fillStyle = `rgba(255,225,180,${0.9 * a})`; ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
          return;
        }
        if (shell <= 0) return;
        const depth = (z + 1) / 2;
        ctx.fillStyle = rgba(tone, (0.18 + 0.82 * depth) * a * shell);
        ctx.beginPath(); ctx.arc(tx, ty, (0.7 + 1.3 * depth) * Math.min(1.6, Math.max(0.8, s.r / 70)), 0, 7); ctx.fill();
      });
      if (asm) { // flash as the sphere settles
        const glow = Math.exp(-(((u - 0.78) / 0.18) ** 2)) * a;
        if (glow > 0.01) { const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.6); gr.addColorStop(0, `rgba(230,160,70,${0.35 * glow})`); gr.addColorStop(1, "rgba(230,160,70,0)"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 2.6, 0, 7); ctx.fill(); }
      }
      if (burst) drawBurst(burst, bu, s, a);
    }
    ctx.globalCompositeOperation = "source-over";

    for (const e of S.els) { // callout leaders
      if (e.kind !== "callout" || !e.leader || e.leader.p <= 0) continue;
      const { ax, ay, tx, ty, p, toneC } = e.leader, a = dimOf(e.id);
      const mx_ = ax + (tx - ax) * 0.6, seg1 = Math.hypot(mx_ - ax, ty - ay), seg2 = Math.abs(tx - mx_), L = (seg1 + seg2) * inOut(p);
      ctx.strokeStyle = rgba(toneC, 0.8 * a); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(ax, ay);
      if (L <= seg1) ctx.lineTo(lerp(ax, mx_, L / seg1), lerp(ay, ty, L / seg1)); else { ctx.lineTo(mx_, ty); ctx.lineTo(mx_ + Math.sign(tx - ax) * (L - seg1), ty); }
      ctx.stroke();
      ctx.beginPath(); ctx.arc(ax, ay, 5, 0, 7); ctx.stroke();
      ctx.fillStyle = rgba(toneC, a); ctx.beginPath(); ctx.arc(ax, ay, 2, 0, 7); ctx.fill();
    }

    const kit = { t, tau, at: (r) => r, ctx, geo: (id) => geo.get(id), state: (id) => st.get(id), tone: (n, a = 1) => rgba(toneOf(n), a), clamp, lerp, prog, inOut, outCubic, rng };
    for (const fn of S.draws) { ctx.save(); fn(ctx, kit); ctx.restore(); }

    if (ui.focus) { // focus ring
      const g = geo.get(ui.focus);
      if (g) { ctx.strokeStyle = "rgba(230,176,79,0.7)"; ctx.setLineDash([3, 4]); ctx.lineDashOffset = -t * 12; ctx.beginPath();
        if (g.r) ctx.arc(g.x, g.y, g.r + 12, 0, 7); else ctx.roundRect(g.x - g.w / 2 - 8, g.y - g.h / 2 - 8, g.w + 16, g.h + 16, 14);
        ctx.stroke(); ctx.setLineDash([]); }
    }
  }

  function drawBurst(ev, bu, s, a) {
    const R = s.r;
    if (bu < 0.5) { // core flash and shockwave
      const f = 1 - bu / 0.5;
      const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, R * (1 + bu * 3));
      gr.addColorStop(0, `rgba(255,220,140,${0.9 * f * a})`); gr.addColorStop(0.4, `rgba(255,140,40,${0.6 * f * a})`); gr.addColorStop(1, "rgba(255,90,20,0)");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.x, s.y, R * (1 + bu * 3), 0, 7); ctx.fill();
    }
    if (bu < 1.2) { ctx.strokeStyle = `rgba(255,190,120,${0.35 * (1 - bu / 1.2) * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, R * (1.1 + bu * 2.4), 0, 7); ctx.stroke(); }
    for (const p of ev.sparks) {
      const life = bu / p.life; if (life >= 1) continue;
      const d = p.sp * (1 - Math.exp(-bu * 2.2)), x = s.x + Math.cos(p.a) * d, y = s.y + Math.sin(p.a) * d + 40 * bu * bu;
      const heat = clamp(1 - life * 1.3 + p.hot * 0.3);
      ctx.fillStyle = rgba(mixc([200, 60, 20], [255, 220, 150], heat), (1 - life) * a);
      ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
    }
    ctx.globalCompositeOperation = "source-over";
    for (const m of ev.smoke) { // smoke, rising and fading
      const life = clamp((bu - 0.15) / 2.6); if (life <= 0 || life >= 1) continue;
      const rr = R * m.s * (0.6 + life * 1.2), x = s.x + m.dx * (0.5 + life), y = s.y + m.dy - m.rise * life;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, `rgba(120,120,125,${0.22 * Math.sin(life * Math.PI) * a})`); gr.addColorStop(1, "rgba(120,120,125,0)");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = `rgba(230,210,190,${0.22 * prog(bu, 0.4, 0.8) * a})`; ctx.lineWidth = 1.5; // the ring it leaves behind
    ctx.beginPath(); ctx.arc(s.x, s.y, R, 0, 7); ctx.stroke();
    ctx.globalCompositeOperation = "lighter";
  }

  // ─── playback ───
  const END = S.END;
  const state = { t: 0, playing: false, speed: 1, last: 0, muted: false };
  function fit() {
    if (RECORD) { stage.style.transform = "translate(-50%,-50%)"; return; }
    const vp = $("#mx-viewport").getBoundingClientRect(), s = Math.min(vp.width / 1920, vp.height / 1080);
    stage.style.transform = `scale(${s}) translate(-50%, -50%)`;
  }
  addEventListener("resize", fit);
  const hasAudio = !!window.MX_AUDIO;
  function syncAudio(force) {
    if (!hasAudio || state.muted || !state.playing || state.t >= (window.MX_TIMINGS?.duration ?? END)) { audio.pause(); return; }
    audio.playbackRate = state.speed;
    if (force || Math.abs(audio.currentTime - state.t) > 0.12) audio.currentTime = state.t;
    if (audio.paused) audio.play().catch(() => {});
  }
  function setPlaying(on) {
    if (on && state.t >= END - 0.01) state.t = 0;
    state.playing = on; state.last = performance.now();
    $("#mx-play").textContent = on ? "❚❚" : "▶";
    if (on) ui.focus = null;
    syncAudio(true);
  }
  const seek = (t) => { state.t = clamp(t, 0, END); syncAudio(true); };
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`;
  const chapters = S.acts.filter((a) => Number.isFinite(a.t));

  function frame(now) {
    if (state.playing) { state.t += ((now - state.last) / 1000) * state.speed; if (state.t >= END) { state.t = END; setPlaying(false); } else syncAudio(false); }
    state.last = now;
    render(state.t);
    inspector();
    const f = state.t / END;
    $("#mx-scrub .fill").style.width = `${f * 100}%`; $("#mx-scrub .head").style.left = `${f * 100}%`;
    $("#mx-time").textContent = `${fmt(state.t)} / ${fmt(END)}`;
    document.querySelectorAll("#mx-scrub .chap").forEach((c, i) => c.classList.toggle("on", state.t >= chapters[i].t && (i === chapters.length - 1 || state.t < chapters[i + 1].t)));
    requestAnimationFrame(frame);
  }

  const scrub = $("#mx-scrub");
  for (const c of chapters) { const d = div("chap", esc(c.name), scrub); d.style.left = `${(c.t / END) * 100}%`; d.onclick = (e) => { e.stopPropagation(); seek(c.t); }; }
  for (const w of S.script) { const d = div("word", "", scrub); d.style.left = `${(w.s / END) * 100}%`; }
  let dragging = false;
  const scrubTo = (e) => { const r = scrub.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * END); };
  scrub.addEventListener("pointerdown", (e) => { dragging = true; scrub.setPointerCapture(e.pointerId); audio.pause(); scrubTo(e); });
  scrub.addEventListener("pointermove", (e) => dragging && scrubTo(e));
  scrub.addEventListener("pointerup", () => { dragging = false; syncAudio(true); });
  $("#mx-play").onclick = () => setPlaying(!state.playing);
  $("#mx-speed").onclick = () => { const s = [1, 0.5, 0.25, 2]; state.speed = s[(s.indexOf(state.speed) + 1) % s.length]; $("#mx-speed").textContent = `${state.speed}×`; syncAudio(true); };
  $("#mx-mute").onclick = () => { state.muted = !state.muted; $("#mx-mute").classList.toggle("on", !state.muted); syncAudio(true); };
  if (!hasAudio) $("#mx-mute").style.display = "none";
  addEventListener("pointerdown", () => syncAudio(true), { once: true }); // browsers hold audio until a gesture
  addEventListener("keydown", (e) => {
    if (e.key === " ") { e.preventDefault(); setPlaying(!state.playing); }
    else if (e.key === "ArrowRight") seek(state.t + (e.shiftKey ? 1 / 60 : 1));
    else if (e.key === "ArrowLeft") seek(state.t - (e.shiftKey ? 1 / 60 : 1));
    else if (e.key === "]") { const c = chapters.find((c) => c.t > state.t + 0.05); seek(c ? c.t : END); }
    else if (e.key === "[") { const c = [...chapters].reverse().find((c) => c.t < state.t - 0.3); seek(c ? c.t : 0); }
    else if (e.key === "m") $("#mx-mute").click();
    else if (e.key === "Escape") ui.focus = null;
  });
  dom.addEventListener("pointerover", (e) => { const n = e.target.closest("[data-mx]"); ui.hover = n ? n.dataset.mx : null; });
  dom.addEventListener("pointerout", (e) => { if (!e.relatedTarget?.closest?.("[data-mx]")) ui.hover = null; });
  stage.addEventListener("click", (e) => {
    const n = e.target.closest("[data-mx]");
    if (!n) { ui.focus = null; return; }
    setPlaying(false); ui.focus = ui.focus === n.dataset.mx ? null : n.dataset.mx;
  });

  function inspector() {
    const box = $("#mx-inspector"), key = ui.focus ?? ui.hover;
    const e = key && S.byId.get(key), s = e && S.lastFrame?.st.get(key);
    if (!e || RECORD) { box.style.opacity = 0; return; }
    const ins = typeof e.o.inspect === "string" ? { body: e.o.inspect } : e.o.inspect ?? {};
    const head = s.title ?? s.label ?? s.key ?? s.file ?? e.id;
    const lines = [`<div class="row"><span class="k">${esc(head)}</span>${s.status ? ` <span class="d">· ${esc(s.status)}</span>` : ""}</div>`];
    if (ins.body) lines.push(`<div class="row">${esc(ins.body)}</div>`);
    if (ui.focus === key && ins.more) lines.push(`<hr><div class="row">${esc(ins.more)}</div>`);
    if (ins.cite) lines.push(`<hr><div class="row d">${esc([].concat(ins.cite).join("\n"))}</div>`);
    if (ins.more && ui.focus !== key) lines.push(`<div class="row d">click to expand</div>`);
    box.innerHTML = lines.join("");
    const sr = stage.getBoundingClientRect(), scale = sr.width / 1920;
    const rs = [e.hit, e.node].filter(Boolean).map((n) => n.getBoundingClientRect());
    const l = Math.min(...rs.map((r) => r.left)), r = Math.max(...rs.map((r) => r.right)), top = Math.min(...rs.map((r) => r.top));
    const x = (l - sr.left) / scale, y = (top - sr.top) / scale, w = (r - l) / scale;
    box.style.left = `${x + w + 440 < 1880 ? x + w + 24 : x - 444}px`;
    box.style.top = `${clamp(y - 20, 140, 1080 - box.offsetHeight - 40)}px`;
    box.style.opacity = 1;
  }

  // ─── checks, for `mx check` ───
  function check() {
    const found = new Set(warnings);
    const rects = (t) => { render(t); const sr = stage.getBoundingClientRect(); return S.els.filter((e) => e.node && +e.node.style.opacity > 0.5).map((e) => { const r = e.node.getBoundingClientRect(); return { id: e.id, kind: e.kind, free: e.kind === "callout" || e.kind === "group", x0: r.left - sr.left, y0: r.top - sr.top, x1: r.right - sr.left, y1: r.bottom - sr.top, node: e.node }; }); };
    for (let t = 0; t <= END; t += 0.25) {
      const rs = rects(t);
      for (const r of rs) {
        if (r.x0 < 30 || r.y0 < 130 || r.x1 > 1890 || r.y1 > 950) found.add(`"${r.id}" leaves the safe area (40..1880 × 130..950) at ${t.toFixed(2)}s`);
        for (const n of r.node.querySelectorAll(".t,.s,.v")) if (n.scrollWidth > n.clientWidth + 2 && getComputedStyle(n).whiteSpace !== "nowrap") found.add(`"${r.id}" text overflows at ${t.toFixed(2)}s`);
      }
      for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
        const a = rs[i], b = rs[j];
        if (a.free && b.free) continue;
        const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (w > 4 && h > 4) found.add(`"${a.id}" overlaps "${b.id}" at ${t.toFixed(2)}s`);
      }
    }
    const seen = new Map(); // keep the first time per message
    for (const m of found) { const key = m.replace(/ at [\d.]+s$/, ""); if (!seen.has(key)) seen.set(key, m); }
    return [...seen.values()];
  }

  fit();
  mx.END = END;
  mx.seek = (t) => { state.t = t; render(t); };
  mx.check = check;
  mx.acts = chapters.map((c) => ({ name: c.name, t: c.t }));
  mx.ready = Promise.all([document.fonts.load("400 16px 'MX Plex Mono'"), document.fonts.ready]).then(() => { render(0); return END; });
  if (!RECORD) {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    mx.ready.then(() => { if (still) seek(END); else setPlaying(true); });
    requestAnimationFrame(frame);
  }
}
})();
