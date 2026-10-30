// Builds the offline copy of @pierre/diffs that `render --html` inlines, so the standalone page
// highlights diffs without network. Writes assets/pierre/: core.js (Pierre with the JS regex engine
// and the Pierre light and dark themes), one script per language, and langs.json, which maps a file
// name or extension to its language script the way Pierre's getFiletypeFromFileName does.
// The esm.sh bundle is 11.7 MB because it carries every grammar and theme; render inlines the core
// and only the languages a reading's files use.
//
// usage: node build_pierre.mjs   (needs node and npm; installs pinned packages into a temp dir)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PKGS = ['@pierre/diffs@1.6.2', 'shiki@4.5.0', '@shikijs/langs@4.5.0', '@pierre/theme@2.0.0', 'esbuild@0.28.2'];
// Grammars worth shipping: common in reviews and small. Ruby (1.9 MB) and C++ (870 KB) embed many others.
const LANGS = ['python', 'typescript', 'tsx', 'javascript', 'jsx', 'json', 'jsonc', 'yaml', 'toml', 'sql',
  'shellscript', 'go', 'rust', 'markdown', 'css', 'html', 'docker', 'diff', 'java', 'kotlin', 'c', 'make', 'ini'];

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'pierre');
const work = mkdtempSync(join(tmpdir(), 'mr-pierre-'));
execFileSync('npm', ['init', '-y'], { cwd: work, stdio: 'ignore' });
execFileSync('npm', ['install', '--silent', ...PKGS], { cwd: work, stdio: 'inherit' });
const need = m => import(pathToFileURL(join(work, 'node_modules', m)).href);
const esbuild = (await need('esbuild/lib/main.js')).default;

// Catalogs the core must not pull in: the full language and theme lists, the wasm engine, and the
// second highlighter backend. Languages and themes are registered by name instead.
const STUB = {
  'shiki/langs': 'export const bundledLanguages = {};',
  'shiki/wasm': 'export default null;',
  'shiki/engine/oniguruma': 'export function createOnigurumaEngine() { throw new Error("no wasm engine offline"); }',
  '@pierre/theming/themes': 'export const themes = { getTheme: () => null };',
  '@pierre/highlights/themes/loader': 'export const themes = {};',
};
const stubs = {
  name: 'stubs',
  setup(b) {
    b.onResolve({ filter: /.*/ }, a => STUB[a.path] != null ? { path: a.path, namespace: 'stub' }
      : /backends\/highlights\.js$/.test(a.path) ? { path: 'highlights', namespace: 'stub' } : null);
    b.onLoad({ filter: /.*/, namespace: 'stub' }, a => ({
      contents: STUB[a.path] ?? 'export class HighlightsHighlighter { constructor() { throw new Error("no highlights backend offline"); } }',
    }));
  },
};
const entry = `
import { FileDiff, parsePatchFiles, registerCustomLanguage, registerCustomTheme, getFiletypeFromFileName } from '@pierre/diffs';
import dark from '@pierre/theme/pierre-dark';
import light from '@pierre/theme/pierre-light';
registerCustomTheme('pierre-dark', async () => dark);
registerCustomTheme('pierre-light', async () => light);
const known = new Set();
window.MR_PIERRE = {
  FileDiff, parsePatchFiles,
  lang(names, data) { for (const n of names) if (!known.has(n)) { known.add(n); registerCustomLanguage(n, async () => ({ default: data })); } },
  langOf(path) { const t = getFiletypeFromFileName(path); return known.has(t) ? t : 'text'; },
};`;
const core = await esbuild.build({
  stdin: { contents: entry, resolveDir: work, loader: 'js' }, bundle: true, format: 'iife', minify: true,
  write: false, plugins: [stubs], logLevel: 'error', legalComments: 'none',
});

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const head = `/* @pierre/diffs 1.6.2 + shiki 4.5.0, built by scripts/build_pierre.mjs; do not edit */\n`;
// Inlined into a <script>, a "<!--" then "<script" would hide the closing tag. Both appear only in
// strings and regex literals, where \x3c is the same "<".
const text = core.outputFiles[0].text.replace(/<!--/g, '\\x3c!--').replace(/<(\/?script)/gi, '\\x3c$1');
if (/<!--|<\/?script/i.test(text)) throw new Error('core.js still has a raw <!-- or <script');
writeFileSync(join(OUT, 'core.js'), head + text);

// Each language script registers its grammar (with the grammars it embeds) under its id and aliases,
// so Pierre's names (for example "zsh" for .sh files) resolve.
const { bundledLanguagesInfo } = await need('shiki/dist/langs.mjs');
const { EXTENSION_TO_FILE_FORMAT } = await need('@pierre/diffs/dist/utils/getFiletypeFromFileName.js');
const names = {};
for (const id of LANGS) {
  const info = bundledLanguagesInfo.find(l => l.id === id);
  if (!info) throw new Error(`no shiki grammar ${id}`);
  const ids = [info.id, ...(info.aliases || [])];
  const data = (await need(`@shikijs/langs/dist/${id}.mjs`)).default;
  writeFileSync(join(OUT, `${id}.js`), `MR_PIERRE.lang(${JSON.stringify(ids)}, ${JSON.stringify(data).replace(/</g, '\\u003c')});\n`);
  for (const [key, format] of Object.entries(EXTENSION_TO_FILE_FORMAT)) if (ids.includes(format)) names[key] = id;
}
writeFileSync(join(OUT, 'langs.json'), JSON.stringify(names, null, 0) + '\n');
rmSync(work, { recursive: true, force: true });
for (const f of readdirSync(OUT).sort()) console.log(f);
