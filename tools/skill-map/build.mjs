#!/usr/bin/env node
// Build the skill map: one self-contained HTML page showing how the router, catalog, playbooks, skills,
// principles and installed external skills link to each other. Click any box to read its file.
// usage: node tools/skill-map/build.mjs [--out tools/skill-map/skill-map.html] [--gitgud ~/.gitgud] [--base <git ref>] [--check]
// Reads: skills/**/*.md, config/AGENTS.md, README.md, scripts/retired-names.json, and every enabled gitgud skill this
// repo does not own. --base picks the commit the changes view compares against: HEAD while edits are uncommitted,
// else HEAD~1. --check writes nothing and exits 1 when the HTML at --out is older than its sources.
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORIES } from './stories.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const OUT = resolve(opt('--out', join(HERE, 'skill-map.html')));
const GITGUD = resolve(opt('--gitgud', join(homedir(), '.gitgud')).replace(/^~/, homedir()));
const CHECK = args.includes('--check');

const lint = [];
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f), s = statSync(p);
  return s.isDirectory() ? walk(p) : f.endsWith('.md') ? [p] : [];
});

// ── collect docs. id = repo-relative path, or ext/<skill>/<path> for external skills
const docs = new Map();
const byPath = new Map(); // realpath → id
function addDoc(id, path, owner, source) {
  docs.set(id, { id, path, owner, source, raw: readFileSync(path, 'utf8') });
  byPath.set(realpathSync(path), id);
}
const repoSkills = readdirSync(join(ROOT, 'skills')).filter((d) => existsSync(join(ROOT, 'skills', d, 'SKILL.md')));
for (const p of walk(join(ROOT, 'skills'))) addDoc(relative(ROOT, p), p, relative(ROOT, p).split('/')[1], 'repo');
for (const f of ['config/AGENTS.md', 'README.md']) if (existsSync(join(ROOT, f))) addDoc(f, join(ROOT, f), null, 'repo');

const gitgudDir = join(GITGUD, 'skills');
const lock = existsSync(join(GITGUD, 'gitgud.lock.json')) ? JSON.parse(readFileSync(join(GITGUD, 'gitgud.lock.json'), 'utf8')) : { sources: {} };
const sourceOf = {};
for (const [sid, src] of Object.entries(lock.sources || {})) for (const sk of Object.values(src.skills || {})) if (sk.status === 'present') sourceOf[sk.name] ??= { id: sid, url: src.url };
// skills this repo once shipped stay in gitgud until the next update; only other sources count as external
const SELF = 'github:Yeshwanthyk/agent-skills/skills';
const selfNames = new Set(Object.values(lock.sources?.[SELF]?.skills || {}).map((sk) => sk.name));
const externals = existsSync(gitgudDir) ? readdirSync(gitgudDir).filter((d) => !repoSkills.includes(d) && existsSync(join(gitgudDir, d, 'SKILL.md')) && !selfNames.has(d)) : [];
for (const name of externals) for (const p of walk(realpathSync(join(gitgudDir, name)))) addDoc(`ext/${name}/${relative(realpathSync(join(gitgudDir, name)), p)}`, p, name, 'external');
// a gitgud path for a repo skill resolves to the repo doc
for (const name of repoSkills) {
  const g = join(gitgudDir, name);
  if (existsSync(g)) for (const p of walk(realpathSync(g))) { const id = join('skills', name, relative(realpathSync(g), p)); if (docs.has(id)) byPath.set(realpathSync(p), id); }
}

// ── kinds and titles
function kindOf(d) {
  const id = d.id;
  if (id === 'skills/yesh-router/SKILL.md') return 'router';
  if (id.startsWith('skills/yesh-router/playbooks/')) return 'playbook';
  if (id.startsWith('skills/yesh-router/references/principles/')) return 'principle';
  if (id.startsWith('skills/yesh-router/references/')) return 'contract';
  if (id === 'config/AGENTS.md') return 'host';
  if (id === 'README.md') return 'readme';
  if (/^(skills|ext)\/[^/]+\/SKILL\.md$/.test(id)) return d.source === 'external' ? 'external' : 'skill';
  return 'ref';
}
function frontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return [{}, raw];
  const fm = {};
  for (const line of m[1].split('\n')) { const kv = line.match(/^([\w-]+):\s*(.*)$/); if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, ''); }
  return [fm, raw.slice(m[0].length)];
}
for (const d of docs.values()) {
  const [fm, body] = frontmatter(d.raw);
  d.kind = kindOf(d);
  d.body = body;
  d.name = fm.name || (d.kind === 'playbook' || d.kind === 'principle' || d.kind === 'contract' ? basename(d.id, '.md') : null) || basename(d.id, '.md');
  if (d.kind === 'skill' || d.kind === 'external' || d.kind === 'router') d.name = fm.name || d.owner;
  d.title = (body.match(/^#\s+(.+)$/m) || [])[1] || d.name;
  d.desc = fm.description || (body.match(/^\*\*Read when:\*\*\s*(.+)$/m) || [])[1] || '';
  d.hidden = fm['disable-model-invocation'] === 'true'; // slash command or router only; the host leaves it out of the skill list
  d.loaded = !!fm.description && !d.hidden; // a listed description sits in context every turn
  d.words = body.split(/\s+/).filter(Boolean).length;
  d.source = d.source === 'external' ? (sourceOf[d.owner]?.id || 'gitgud') : 'repo';
}

// ── the router's Triggers and Apply principles sections become their own hub boxes, so the router box
// shows only its own links. The router panel still renders its whole file.
const ROUTER = 'skills/yesh-router/SKILL.md';
const HUBS = { Triggers: { id: `${ROUTER}#triggers`, kind: 'catalog', name: 'triggers' }, 'Apply principles': { id: `${ROUTER}#apply-principles`, kind: 'triggers', name: 'principle table' } };
{
  const r = docs.get(ROUTER);
  r.linkBody = r.body;
  for (const [heading, h] of Object.entries(HUBS)) {
    const m = r.body.match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
    if (!m) { lint.push({ doc: ROUTER, msg: `no "## ${heading}" section` }); continue; }
    r.linkBody = r.linkBody.replace(m[1], '');
    const body = `# ${heading}\n\n${m[1]}`;
    docs.set(h.id, { id: h.id, path: r.path, owner: 'yesh-router', source: 'repo', kind: h.kind, name: h.name, title: `${heading} (router section)`,
      desc: '', loaded: false, body, words: body.split(/\s+/).filter(Boolean).length });
  }
}

// ── links: markdown links outside code, plus backticked skill names
const skillIds = {};
for (const d of docs.values()) if (['skill', 'external', 'router'].includes(d.kind)) skillIds[d.name] = d.id;
function resolveLink(d, href) {
  const target = href.split('#')[0];
  if (!target || /^[a-z]+:/i.test(target)) return null;
  let p = resolve(dirname(d.path), decodeURIComponent(target));
  if (existsSync(p) && statSync(p).isDirectory()) p = ['SKILL.md', 'README.md'].map((f) => join(p, f)).find(existsSync) || p;
  if (!existsSync(p)) return { missing: target };
  const id = byPath.get(realpathSync(p));
  return id ? { id } : { file: relative(ROOT, p) };
}
const proseOnly = (md) => md.replace(/^(```|~~~)[\s\S]*?^\1.*$/gm, '');
const edges = [];
for (const d of docs.values()) {
  const prose = proseOnly(d.linkBody ?? d.body), seen = new Set();
  for (const m of prose.matchAll(/\[([^\]\n]+)\]\(([^)\s]+)\)/g)) {
    const r = resolveLink(d, m[2]);
    if (!r) continue;
    if (r.missing) { lint.push({ doc: d.id, msg: `broken link → ${r.missing}` }); continue; }
    if (r.id && r.id !== d.id && !seen.has(r.id)) { seen.add(r.id); edges.push({ from: d.id, to: r.id, type: 'link', text: m[1].replace(/`/g, '') }); }
  }
  for (const m of prose.matchAll(/`([a-z][a-z0-9-]+)`/g)) {
    const to = skillIds[m[1]];
    if (to && to !== d.id && docs.get(to).owner !== d.owner && !seen.has(to)) { seen.add(to); edges.push({ from: d.id, to, type: 'mention', text: m[1] }); }
  }
}

for (const h of Object.values(HUBS)) if (docs.has(h.id)) edges.push({ from: ROUTER, to: h.id, type: 'link', text: h.name });

// ── catalog rows (the router's Triggers bullets) and principle rows (its Apply principles table)
const catalog = [], triggers = [];
{
  const d = docs.get(HUBS.Triggers.id);
  let group = null, groupAsk = false;
  for (const line of (d?.body || '').split('\n')) {
    const g = line.match(/^\*\*([^*]+)\*\*\s*(\(\*on request\*\))?\s*$/); if (g) { group = g[1].trim(); groupAsk = !!g[2]; continue; }
    if (!group || !/^\s*-\s/.test(line)) continue;
    const ask = groupAsk || /^\s*-\s*\*On request:\*/.test(line);
    let last = 0;
    for (const m of line.matchAll(/→\s*\[([^\]]+)\]\(([^)\s]+)\)/g)) {
      const use = line.slice(last, m.index).replace(/^\s*-\s*/, '').replace(/\*On request:\*\s*/, '').replace(/^[.\s]+/, '').trim();
      last = m.index + m[0].length;
      const r = resolveLink(d, m[2]);
      if (r?.id && !catalog.some((c) => c.id === r.id)) catalog.push({ group, use, explicit: ask, id: r.id });
    }
  }
  const t = docs.get(HUBS['Apply principles'].id) || { body: '' };
  const section = t.body;
  if (!section) lint.push({ doc: ROUTER, msg: 'no "## Apply principles" table' });
  for (const line of section.split('\n')) {
    const row = line.match(/^\|\s*(.+?)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|$/);
    if (row) { const r = resolveLink(t, row[3]); if (r?.id) triggers.push({ when: row[1], id: r.id }); }
  }
}
for (const c of catalog) { const d = docs.get(c.id); d.catalog = c; }
for (const t of triggers) docs.get(t.id).trigger = t.when;

// ── markdown → html. Doc links become wiki links (data-doc); backticked skill names too.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function inline(d, s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    const h = href.replace(/&amp;/g, '&');
    if (/^https?:/i.test(h)) return `<a href="${h}" target="_blank" rel="noreferrer">${text}</a>`;
    const r = resolveLink(d, h);
    if (r?.id) return `<a class="wl" href="#doc=${encodeURIComponent(r.id)}" data-doc="${r.id}">${text}</a>`;
    if (r?.missing) return `<span class="broken" title="missing: ${esc(r.missing)}">${text}</span>`;
    return `<span class="file" title="${esc(r?.file || h)}">${text}</span>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:]|$)/g, '$1<em>$2</em>').replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:]|$)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => {
    const c = codes[i], to = skillIds[c];
    return to && to !== d.id ? `<a class="wl" href="#doc=${encodeURIComponent(to)}" data-doc="${to}"><code>${esc(c)}</code></a>` : `<code>${esc(c)}</code>`;
  });
}
function render(d) {
  const lines = d.body.split('\n'), out = [];
  let i = 0;
  const isBlockStart = (l) => /^(#{1,6}\s|```|~~~|\s*([-*+]|\d+\.)\s|\||>)/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const fence = l.match(/^(```|~~~)(.*)$/);
    if (fence) { const buf = []; i++; while (i < lines.length && !lines[i].startsWith(fence[1])) buf.push(lines[i++]); i++; out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`); continue; }
    const h = l.match(/^(#{1,6})\s+(.+)$/);
    if (h) { out.push(`<h${Math.min(6, h[1].length + 1)}>${inline(d, h[2])}</h${Math.min(6, h[1].length + 1)}>`); i++; continue; }
    if (l.startsWith('|')) {
      const rows = []; while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim());
      const body = rows.filter((r, k) => k !== 1 || !/^\|[\s:|-]+\|$/.test(r));
      out.push(`<div class="tbl"><table><thead><tr>${cells(body[0]).map((c) => `<th>${inline(d, c)}</th>`).join('')}</tr></thead><tbody>${body.slice(1).map((r) => `<tr>${cells(r).map((c) => `<td>${inline(d, c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (l.startsWith('>')) { const buf = []; while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, '')); out.push(`<blockquote>${inline(d, buf.join(' '))}</blockquote>`); continue; }
    if (/^\s*([-*+]|\d+\.)\s/.test(l)) { // lists, nested by indent
      const stack = []; let html = '';
      while (i < lines.length && (/^\s*([-*+]|\d+\.)\s/.test(lines[i]) || (lines[i].trim() && /^\s{2,}/.test(lines[i])))) {
        const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
        if (!m) { html += ' ' + inline(d, lines[i].trim()); i++; continue; }
        const ind = m[1].length, tag = /\d/.test(m[2]) ? 'ol' : 'ul';
        while (stack.length && ind < stack.at(-1).ind) html += `</li></${stack.pop().tag}>`;
        if (!stack.length || ind > stack.at(-1).ind) { stack.push({ ind, tag }); html += `<${tag}><li>`; } else html += '</li><li>';
        html += inline(d, m[3]); i++;
      }
      while (stack.length) html += `</li></${stack.pop().tag}>`;
      out.push(html); continue;
    }
    const buf = []; while (i < lines.length && lines[i].trim() && (!buf.length || !isBlockStart(lines[i]))) buf.push(lines[i++]);
    out.push(`<p>${inline(d, buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

// ── stories: each step's wire must be a real link, or the build reports it
const has = (a, b) => edges.some((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a));
for (const s of STORIES) s.steps.forEach((st, k) => {
  st.from ??= k ? s.steps[k - 1].doc : null;
  if (!docs.has(st.doc)) lint.push({ doc: `story: ${s.name}`, msg: `unknown doc ${st.doc}` });
  else if (st.from && !has(st.from, st.doc)) lint.push({ doc: `story: ${s.name}`, msg: `no link between ${st.from} and ${st.doc}` });
});

// ── changes since the base commit: each doc gets new / moved / edited, and removed files are grouped under
// the retired-names entry that says where their content went and why
const git = (c) => { try { return execSync(`git -C "${ROOT}" ${c}`, { encoding: 'utf8' }).trim(); } catch { return ''; } };
const SCOPE = '-- skills config README.md';
const dirty = !!git(`status --porcelain ${SCOPE}`);
const BASE = opt('--base', dirty ? 'HEAD' : 'HEAD~1');
const retired = JSON.parse(readFileSync(join(ROOT, 'scripts/retired-names.json'), 'utf8'));
const changes = { base: git(`rev-parse --short ${BASE}`) || BASE, baseSubject: git(`log -1 --format=%s ${BASE}`), retired: [], removed: [] };
{
  const counts = {};
  for (const l of git(`diff --numstat -M ${BASE} ${SCOPE}`).split('\n').filter(Boolean)) {
    const [add, del, ...rest] = l.split('\t'); let p = rest.join('\t');
    const br = p.match(/^(.*)\{(.*) => (.*)\}(.*)$/); if (br) p = (br[1] + br[3] + br[4]).replace(/\/\//g, '/'); else p = p.split(' => ').at(-1);
    counts[p] = { add: +add || 0, del: +del || 0 };
  }
  const mark = (id, c) => { const d = docs.get(id); if (d) d.change = { ...c, ...counts[id] }; };
  for (const l of git(`diff --name-status -M ${BASE} ${SCOPE}`).split('\n').filter(Boolean)) {
    const [st, a, b] = l.split('\t');
    if (st[0] === 'R') { mark(b, { status: 'moved', from: a }); changes.removed.push({ path: a, to: b }); }
    else if (st === 'A') mark(a, { status: 'new' });
    else if (st === 'D') changes.removed.push({ path: a, to: null });
    else if (st === 'M') mark(a, { status: 'edited' });
  }
  for (const p of git(`ls-files --others --exclude-standard ${SCOPE}`).split('\n').filter(Boolean)) mark(p, { status: 'new' });
  const owner = (p) => retired.find((r) => (r.was.endsWith('/') ? p.startsWith(r.was) : p === r.was));
  for (const r of retired) {
    const files = changes.removed.filter((f) => owner(f.path) === r);
    if (files.length) changes.retired.push({ ...r, nowId: r.now && docs.has(r.now.split('#')[0]) ? r.now.split('#')[0] : null, files });
  }
  // git guesses renames by similarity, which misses rewritten moves; a new file a retired name points at was moved there
  for (const id of new Set(changes.retired.map((r) => r.nowId).filter(Boolean))) {
    const d = docs.get(id), from = changes.retired.filter((r) => r.nowId === id);
    if (d.change?.status === 'new') d.change = { ...d.change, status: from.length > 1 ? 'merged' : 'moved', from: from.map((r) => r.was).join(', ') };
  }
  // a new reference inside a skill that took over retired folders came from their files of the same name
  for (const d of docs.values()) {
    if (d.change?.status !== 'new' || d.kind !== 'ref') continue;
    const stem = basename(d.id, '.md'), into = changes.retired.filter((r) => r.nowId?.startsWith(`skills/${d.owner}/`));
    const from = changes.removed.filter((f) => !f.to && into.some((r) => r.name === owner(f.path)?.name) && basename(f.path, '.md').startsWith(stem)).map((f) => f.path);
    if (from.length) d.change = { ...d.change, status: from.length > 1 ? 'merged' : 'moved', from: from.join(', ') };
  }
  // the router's section hubs change with the router
  for (const h of Object.values(HUBS)) if (docs.get(ROUTER).change && docs.has(h.id)) docs.get(h.id).change = { status: 'edited', note: 'router section' };
  for (const f of changes.removed) if (!owner(f.path) && !f.to) lint.push({ doc: f.path, msg: 'removed, but scripts/retired-names.json does not say where it went or why' });
}
// a skill box counts as changed when its SKILL.md or any of its files changed
const changedOwners = new Set([...docs.values()].filter((d) => d.change && d.kind === 'ref').map((d) => d.owner));

// ── emit
const data = {
  built: { commit: git('rev-parse --short HEAD'), dirty, at: new Date().toISOString().slice(0, 16).replace('T', ' ') },
  docs: Object.fromEntries([...docs.values()].map((d) => [d.id, {
    id: d.id, kind: d.kind, name: d.name, title: d.title, desc: d.desc, loaded: d.loaded, hidden: !!d.hidden, words: d.words, owner: d.owner,
    source: d.source, sourceUrl: sourceOf[d.owner]?.url, catalog: d.catalog, trigger: d.trigger, html: render(d),
    change: d.change, refsChanged: changedOwners.has(d.owner) && d.kind !== 'ref',
  }])),
  edges, catalog, triggers, stories: STORIES, lint, changes,
};
const tpl = readFileSync(join(HERE, 'template.html'), 'utf8');
// the fingerprint covers everything the page shows except the build time, so --check can tell a stale page
const { at, ...stable } = data.built;
const fingerprint = createHash('sha256').update(JSON.stringify({ ...data, built: stable })).update(tpl).update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 16);
if (CHECK) {
  const old = existsSync(OUT) ? (readFileSync(OUT, 'utf8').match(/<meta name="skill-map-fingerprint" content="(\w+)">/) || [])[1] : null;
  if (old === fingerprint) { console.log(`${relative(process.cwd(), OUT)} is current`); process.exit(0); }
  console.log(`${relative(process.cwd(), OUT)} is ${old ? 'stale' : 'missing'}; run node tools/skill-map/build.mjs`); process.exit(1);
}
writeFileSync(OUT, tpl.replace('<!--FINGERPRINT-->', `<meta name="skill-map-fingerprint" content="${fingerprint}">`).replace('/*DATA*/null', () => JSON.stringify(data).replace(/</g, '\\u003c')));
console.log(`wrote ${relative(process.cwd(), OUT)}: ${docs.size} docs, ${edges.length} links, ${catalog.length} catalog rows, ${triggers.length} triggers, ${externals.length} external skills`);
console.log(`changes since ${changes.base}: ${[...docs.values()].filter((d) => d.change).length} files changed or added, ${changes.removed.length} removed or moved, ${changes.retired.length} retired names`);
for (const l of lint) console.log(`lint: ${l.doc}: ${l.msg}`);
