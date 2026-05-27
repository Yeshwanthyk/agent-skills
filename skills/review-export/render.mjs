import { readFile, writeFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx === -1 ? undefined : process.argv[idx + 1];
}

// Load bundled Berkeley Mono fonts if available
let fontCSS = "";
try {
  const fontPath = join(__dirname, "fonts/berkeley-mono.json");
  if (existsSync(fontPath)) {
    const fonts = JSON.parse(readFileSync(fontPath, "utf8"));
    fontCSS = `
    @font-face {
      font-family: 'Berkeley Mono';
      src: url(data:font/otf;base64,${fonts.regular}) format('opentype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Berkeley Mono';
      src: url(data:font/otf;base64,${fonts.bold}) format('opentype');
      font-weight: 600;
      font-style: normal;
      font-display: swap;
    }`;
  }
} catch {
  // Font not available, template will use local() fallback
}

const templatePath = getArg("--template");
const dataPath = getArg("--data");
const outPath = getArg("--out");

if (!templatePath || !dataPath || !outPath) {
  console.error("Usage: node render.mjs --template template.html --data review.json --out review.html");
  process.exit(2);
}

const [template, jsonText] = await Promise.all([
  readFile(templatePath, "utf8"),
  readFile(dataPath, "utf8"),
]);

const reviewData = JSON.parse(jsonText);
const b64 = Buffer.from(JSON.stringify(reviewData), "utf8").toString("base64");

const counts = { bug: 0, warning: 0, suggestion: 0, good: 0 };
for (const f of reviewData.files ?? []) {
  for (const c of f.comments ?? []) {
    if (c.type in counts) counts[c.type]++;
  }
}

// Replace template @font-face with embedded version if available
let processedTemplate = template;
if (fontCSS) {
  // Remove existing Berkeley Mono @font-face rules and Google Fonts links
  processedTemplate = processedTemplate
    .replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/g, "")
    .replace(/<link[^>]*fonts\.gstatic\.com[^>]*>/g, "")
    .replace(/@font-face\s*\{[^}]*Berkeley Mono[^}]*\}\s*/g, "");
  // Inject embedded font CSS after <style> tag
  processedTemplate = processedTemplate.replace("<style>", `<style>${fontCSS}`);
}

const html = processedTemplate
  .replaceAll("{{BRANCH}}", reviewData.branch ?? "")
  .replaceAll("{{COMMIT}}", reviewData.commit ?? "")
  .replaceAll("{{SUMMARY}}", reviewData.summary ?? "")
  .replaceAll("{{BUG_COUNT}}", String(counts.bug))
  .replaceAll("{{WARNING_COUNT}}", String(counts.warning))
  .replaceAll("{{SUGGESTION_COUNT}}", String(counts.suggestion))
  .replaceAll("{{GOOD_COUNT}}", String(counts.good))
  .replaceAll("{{BUG_ZERO}}", counts.bug === 0 ? "zero" : "")
  .replaceAll("{{WARNING_ZERO}}", counts.warning === 0 ? "zero" : "")
  .replaceAll("{{SUGGESTION_ZERO}}", counts.suggestion === 0 ? "zero" : "")
  .replaceAll("{{GOOD_ZERO}}", counts.good === 0 ? "zero" : "")
  .replaceAll("{{REVIEW_DATA_B64}}", b64);

await writeFile(outPath, html, "utf8");
console.log(outPath);
