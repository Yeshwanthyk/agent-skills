#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { constants, createReadStream, lstatSync, readFileSync, readlinkSync, realpathSync } from "node:fs";
import { lstat, mkdir, open, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { createInterface } from "node:readline";
import { pathToFileURL, fileURLToPath } from "node:url";

export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_FILES = 500;
export const MAX_DOCUMENT_DEPTH = 12;
export const MAX_DOCUMENT_AGGREGATE_BYTES = 25 * 1024 * 1024;
export const MAX_UNTRACKED_FILES = 500;
export const MAX_SESSION_BYTES = 100 * 1024 * 1024;
export const SUPPORTED_DOCUMENT_EXTENSIONS = Object.freeze([
  ".md", ".mdx", ".txt", ".html", ".htm", ".yaml", ".yml", ".json", ".jsonc", ".json5",
  ".toml", ".ini", ".cfg", ".conf", ".properties", ".csv", ".tsv", ".log", ".xml", ".env.example",
]);
const SUPPORTED_EXTENSION_SET = new Set(SUPPORTED_DOCUMENT_EXTENSIONS);
const SKIPPED_DIRECTORY_NAMES = new Set([
  ".git", ".hg", ".svn", ".cache", ".next", ".nuxt", ".turbo", ".venv", "__pycache__", "build", "coverage",
  "dist", "node_modules", "target", "vendor",
]);
const ALLOWED_ASSET_MIME = new Map([
  [".css", "text/css; charset=utf-8"], [".png", "image/png"], [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"],
  [".gif", "image/gif"], [".webp", "image/webp"], [".bmp", "image/bmp"], [".ico", "image/x-icon"],
  [".woff", "font/woff"], [".woff2", "font/woff2"], [".ttf", "font/ttf"], [".otf", "font/otf"],
]);
const DOCUMENT_SOURCES = Symbol("reviewDocumentSources");
const HTML_CSP = "default-src 'none'; script-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; navigate-to 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'none'; worker-src 'none'";
const HEARTBEAT_TIMEOUT_MS = 30_000;
const ACTIVATION_TIMEOUT_MS = 60_000;
const MAX_REQUEST_BYTES = 1_024;
const COMMAND_TIMEOUT_MS = 60_000;
const MAX_UNTRACKED_FINGERPRINT_FILES = 20;
const MAX_UNTRACKED_FINGERPRINT_CONTENT_BYTES = 1024 * 1024;
const RUNTIME_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const SKILL_DIRECTORY = resolve(RUNTIME_DIRECTORY, "..");
const ASSET_DIRECTORY = join(SKILL_DIRECTORY, "assets");
export const DEFAULT_REVIEW_PREFERENCES = Object.freeze({
  version: 1,
  diffStyle: "unified",
  codeFontSize: 15,
});
const CODE_FONT_SIZES = new Set([14, 15, 16, 18]);

export function isReviewPreferences(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort();
  return (
    keys.length === 3 &&
    keys[0] === "codeFontSize" &&
    keys[1] === "diffStyle" &&
    keys[2] === "version" &&
    value.version === 1 &&
    (value.diffStyle === "unified" || value.diffStyle === "split") &&
    CODE_FONT_SIZES.has(value.codeFontSize)
  );
}

export function parseReviewPreferences(value) {
  return isReviewPreferences(value)
    ? { version: 1, diffStyle: value.diffStyle, codeFontSize: value.codeFontSize }
    : { ...DEFAULT_REVIEW_PREFERENCES };
}

export function reviewStateDirectory(env = process.env, platform = process.platform) {
  if (env.REVIEW_WORKSPACE_STATE_DIRECTORY) return resolve(env.REVIEW_WORKSPACE_STATE_DIRECTORY);
  const home = env.HOME || env.USERPROFILE || homedir();
  if (platform === "darwin") return join(home, "Library", "Application Support", "review-workspace");
  if (platform === "win32") return join(env.LOCALAPPDATA || join(home, "AppData", "Local"), "review-workspace");
  return join(env.XDG_CONFIG_HOME || join(home, ".config"), "review-workspace");
}

export async function readReviewPreferences(env = process.env) {
  try {
    const raw = await readFile(join(reviewStateDirectory(env), "preferences.json"), "utf8");
    return parseReviewPreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_REVIEW_PREFERENCES };
  }
}

export async function writeReviewPreferences(value, env = process.env) {
  if (!isReviewPreferences(value)) throw new Error("Invalid review display preferences.");
  const directory = reviewStateDirectory(env);
  const destination = join(directory, "preferences.json");
  const temporary = join(directory, `.preferences-${process.pid}-${randomBytes(8).toString("hex")}.tmp`);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
    await rename(temporary, destination);
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => {});
    throw error;
  }
  return parseReviewPreferences(value);
}

function assistantText(message) {
  if (message?.role !== "assistant" || !Array.isArray(message.content)) return null;
  const text = message.content
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n");
  return text.trim() ? text : null;
}

function hasToolCall(message) {
  return (
    message?.role === "assistant" &&
    Array.isArray(message.content) &&
    message.content.some((block) => block?.type === "toolCall")
  );
}

export function extractPreviousAssistantText(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("The Pi session contains no branch entries.");
  }

  const byId = new Map();
  let leaf = null;
  for (const entry of entries) {
    if (!entry || typeof entry.id !== "string") continue;
    byId.set(entry.id, entry);
    leaf = entry;
  }
  if (!leaf) throw new Error("The Pi session contains no addressable branch entries.");

  const visited = new Set();
  let current = leaf;
  let sawInvocationToolCall = false;
  let crossedCurrentUser = false;

  while (current) {
    if (visited.has(current.id)) {
      throw new Error(`Cycle detected in Pi session branch at entry ${current.id}.`);
    }
    visited.add(current.id);

    if (!crossedCurrentUser) {
      if (current.type === "message" && hasToolCall(current.message)) sawInvocationToolCall = true;
      if (current.type === "message" && current.message?.role === "user") {
        if (!sawInvocationToolCall) {
          throw new Error(
            "Could not identify the current Pi tool-call message; refusing to guess the previous response.",
          );
        }
        crossedCurrentUser = true;
      }
    } else if (current.type === "message" && current.message?.role === "assistant") {
      const text = assistantText(current.message);
      if (text) return text;
    }

    if (current.parentId === null || current.parentId === undefined) break;
    const parent = byId.get(current.parentId);
    if (!parent) throw new Error(`Pi session branch references missing parent entry ${current.parentId}.`);
    current = parent;
  }

  if (!sawInvocationToolCall) {
    throw new Error("No current Pi assistant tool-call message was found in the active branch.");
  }
  if (!crossedCurrentUser) {
    throw new Error("No current Pi user invocation was found in the active branch.");
  }
  throw new Error("No previous assistant text message was found in the active Pi branch.");
}

export async function readPiPreviousAssistantText(sessionFile, expectedSessionId) {
  const before = await lstat(sessionFile).catch((error) => {
    if (error?.code === "ENOENT") throw new Error(`Pi session file does not exist: ${sessionFile}`);
    throw error;
  });
  if (!before.isFile()) throw new Error(`Pi session path is not a regular file: ${sessionFile}`);
  if (before.size > MAX_SESSION_BYTES) throw new Error(`Pi session exceeds the ${MAX_SESSION_BYTES / 1024 / 1024} MiB safety limit.`);

  const entries = [];
  const entryIds = new Set();
  const input = createReadStream(sessionFile, { encoding: "utf8" });
  const lines = createInterface({ input, crlfDelay: Infinity });
  let lineNumber = 0;
  let header = null;

  for await (const line of lines) {
    lineNumber += 1;
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid JSON in Pi session ${sessionFile}:${lineNumber}: ${error.message}`);
    }
    if (!header) {
      if (entry?.type !== "session" || entry.version !== 3 || typeof entry.id !== "string") {
        throw new Error(`Unsupported Pi session header in ${sessionFile}:${lineNumber}.`);
      }
      if (expectedSessionId && entry.id !== expectedSessionId) {
        throw new Error(`Pi session ID mismatch: expected ${expectedSessionId}, found ${entry.id}.`);
      }
      header = entry;
      continue;
    }
    if (entry?.type === "session") throw new Error(`Duplicate Pi session header at ${sessionFile}:${lineNumber}.`);
    if (typeof entry?.id !== "string" || entry.id.length === 0) continue;
    if (entryIds.has(entry.id)) throw new Error(`Duplicate Pi session entry ID ${entry.id}.`);
    if (entry.parentId !== null && entry.parentId !== undefined && typeof entry.parentId !== "string") {
      throw new Error(`Malformed parentId for Pi session entry ${entry.id}.`);
    }
    entryIds.add(entry.id);
    entries.push(entry);
  }

  if (!header) throw new Error(`Pi session file is empty: ${sessionFile}`);
  const after = await lstat(sessionFile);
  if (after.size !== before.size || after.mtimeMs !== before.mtimeMs) {
    throw new Error("Pi session changed while review-annotate was reading it; run the skill again.");
  }
  return extractPreviousAssistantText(entries);
}

const CODEX_TURN_START_TYPES = new Set(["task_started", "turn_started"]);
const CODEX_TURN_COMPLETE_TYPES = new Set(["task_complete", "turn_completed"]);
const SAFE_CODEX_THREAD_ID = /^[A-Za-z0-9_-]{1,128}$/;

async function codexDirectoryNames(path) {
  let entries;
  try {
    entries = await readdir(path, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => entry.name)
    .sort()
    .reverse();
}

export async function findCodexRolloutFile(threadId, env = process.env) {
  if (typeof threadId !== "string" || !SAFE_CODEX_THREAD_ID.test(threadId)) {
    throw new Error("Invalid Codex thread ID.");
  }
  const home = env.CODEX_HOME
    ? resolve(env.CODEX_HOME)
    : join(resolve(env.HOME || env.USERPROFILE || homedir()), ".codex");
  const sessionsDirectory = join(home, "sessions");
  const suffix = `-${threadId}.jsonl`;
  const matches = [];

  for (const year of await codexDirectoryNames(sessionsDirectory)) {
    const yearDirectory = join(sessionsDirectory, year);
    for (const month of await codexDirectoryNames(yearDirectory)) {
      const monthDirectory = join(yearDirectory, month);
      for (const day of await codexDirectoryNames(monthDirectory)) {
        const dayDirectory = join(monthDirectory, day);
        const entries = await readdir(dayDirectory, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && !entry.isSymbolicLink() && entry.name.startsWith("rollout-") && entry.name.endsWith(suffix)) {
            matches.push(join(dayDirectory, entry.name));
          }
        }
      }
    }
  }

  if (matches.length === 0) {
    throw new Error(`Could not find the active Codex rollout for thread ${threadId}.`);
  }
  if (matches.length > 1) {
    throw new Error(`Found multiple Codex rollouts for active thread ${threadId}; refusing to guess.`);
  }
  return matches[0];
}

function codexAssistantText(entry) {
  if (entry?.type !== "response_item" || entry.payload?.type !== "message" || entry.payload?.role !== "assistant") {
    return null;
  }
  if (!Array.isArray(entry.payload.content)) return null;
  const text = entry.payload.content
    .filter((block) => block?.type === "output_text" && typeof block.text === "string")
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n");
  return text || null;
}

export function extractCodexPreviousAssistantText(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("The Codex rollout contains no entries.");
  }

  let latestTurnStart = -1;
  let latestTurnComplete = -1;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry?.type !== "event_msg") continue;
    if (CODEX_TURN_START_TYPES.has(entry.payload?.type)) latestTurnStart = index;
    if (CODEX_TURN_COMPLETE_TYPES.has(entry.payload?.type)) latestTurnComplete = index;
  }
  const activeTurnStart = latestTurnStart > latestTurnComplete ? latestTurnStart : entries.length;

  for (let index = activeTurnStart - 1; index >= 0; index -= 1) {
    const text = codexAssistantText(entries[index]);
    if (text) return text;
  }
  throw new Error("No previous assistant text message was found in the active Codex thread.");
}

export async function readCodexPreviousAssistantText(rolloutFile, expectedThreadId) {
  let handle;
  try {
    handle = await open(rolloutFile, constants.O_RDONLY | constants.O_NOFOLLOW).catch((error) => {
      if (error?.code === "ENOENT") throw new Error(`Codex rollout file does not exist: ${rolloutFile}`);
      throw error;
    });
    const before = await handle.stat();
    if (!before.isFile()) throw new Error(`Codex rollout path is not a regular file: ${rolloutFile}`);
    if (before.size > MAX_SESSION_BYTES) {
      throw new Error(`Codex rollout exceeds the ${MAX_SESSION_BYTES / 1024 / 1024} MiB safety limit.`);
    }
    const buffer = await handle.readFile();
    const after = await handle.stat();
    if (
      after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs ||
      after.dev !== before.dev || after.ino !== before.ino
    ) {
      throw new Error("Codex rollout changed while review-annotate was reading it; run the skill again.");
    }

    let content;
    try {
      content = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      throw new Error("The active Codex rollout is not valid UTF-8 text.");
    }
    const entries = [];
    let lineNumber = 0;
    for (const line of content.split(/\r?\n/)) {
      lineNumber += 1;
      if (!line.trim()) continue;
      try {
        entries.push(JSON.parse(line));
      } catch (error) {
        throw new Error(`Invalid JSON in Codex rollout ${rolloutFile}:${lineNumber}: ${error.message}`);
      }
    }

    const metadata = entries[0];
    if (metadata?.type !== "session_meta" || typeof metadata.payload?.id !== "string") {
      throw new Error(`Unsupported Codex rollout header in ${rolloutFile}.`);
    }
    if (expectedThreadId && metadata.payload.id !== expectedThreadId) {
      throw new Error(`Codex thread ID mismatch: expected ${expectedThreadId}, found ${metadata.payload.id}.`);
    }
    if (entries.slice(1).some((entry) => entry?.type === "session_meta")) {
      throw new Error(`Duplicate Codex rollout header in ${rolloutFile}.`);
    }
    return extractCodexPreviousAssistantText(entries);
  } finally {
    await handle?.close();
  }
}

async function readStdin() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_SOURCE_BYTES) {
      throw new Error(`Review source exceeds the ${MAX_SOURCE_BYTES / 1024 / 1024} MiB limit.`);
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function enforceSourceSize(content) {
  const size = Buffer.byteLength(content);
  if (size > MAX_SOURCE_BYTES) {
    throw new Error(`Review source is ${(size / 1024 / 1024).toFixed(1)} MiB; limit is ${MAX_SOURCE_BYTES / 1024 / 1024} MiB.`);
  }
  return content;
}

function documentKind(path) {
  const lower = basename(path).toLowerCase();
  const extension = lower.endsWith(".env.example") ? ".env.example" : extname(lower);
  if (!SUPPORTED_EXTENSION_SET.has(extension)) return null;
  if (extension === ".html" || extension === ".htm") return "html";
  if (extension === ".md" || extension === ".mdx") return "markdown";
  return "text";
}

function normalizedRelative(path) {
  return path.split(sep).join("/");
}

function isContained(root, candidate) {
  const child = relative(root, candidate);
  return child === "" || (!child.startsWith(`..${sep}`) && child !== ".." && !isAbsolute(child));
}

function documentId(relativePath, stats) {
  return createHash("sha256")
    .update(relativePath)
    .update("\0")
    .update(String(stats.dev))
    .update("\0")
    .update(String(stats.ino))
    .update("\0")
    .update(String(stats.size))
    .update("\0")
    .update(String(stats.mtimeMs))
    .update("\0")
    .update(String(stats.ctimeMs))
    .digest("base64url");
}

function snapshotSource(path, root, relativePath, kind, stats) {
  return {
    path,
    root,
    relativePath,
    kind,
    size: stats.size,
    mtimeMs: stats.mtimeMs,
    ctimeMs: stats.ctimeMs,
    dev: stats.dev,
    ino: stats.ino,
  };
}

async function enumerateDocumentSources(path, root, depth = 0, sources = []) {
  if (depth > MAX_DOCUMENT_DEPTH) throw new Error(`Folder exceeds the maximum review depth of ${MAX_DOCUMENT_DEPTH}.`);
  const entries = await readdir(path, { withFileTypes: true });
  entries.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
  for (const entry of entries) {
    if (entry.isSymbolicLink() || (!entry.isFile() && !entry.isDirectory())) continue;
    if (entry.isDirectory() && SKIPPED_DIRECTORY_NAMES.has(entry.name.toLowerCase())) continue;
    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      await enumerateDocumentSources(child, root, depth + 1, sources);
      continue;
    }
    const kind = documentKind(entry.name);
    if (!kind) continue;
    const stats = await lstat(child);
    if (!stats.isFile() || stats.isSymbolicLink()) continue;
    if (stats.size > MAX_DOCUMENT_BYTES) throw new Error("A supported document exceeds the per-file safety limit.");
    if (sources.length >= MAX_DOCUMENT_FILES) throw new Error(`Folder exceeds the ${MAX_DOCUMENT_FILES}-document safety limit.`);
    const aggregate = sources.reduce((sum, source) => sum + source.size, 0) + stats.size;
    if (aggregate > MAX_DOCUMENT_AGGREGATE_BYTES) throw new Error("Folder exceeds the aggregate document safety limit.");
    const canonical = await realpath(child);
    if (!isContained(root, canonical)) throw new Error("A document escapes the selected folder.");
    sources.push(snapshotSource(canonical, root, normalizedRelative(relative(root, canonical)), kind, stats));
  }
  return sources;
}

function publicDocument(source) {
  return {
    id: documentId(source.relativePath, source),
    relativePath: source.relativePath,
    kind: source.kind,
    size: source.size,
  };
}

async function readDocumentSource(source) {
  if (source.path === null && typeof source.content === "string") return source.content;
  let handle;
  try {
    handle = await open(source.path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const before = await handle.stat();
    if (
      !before.isFile() || before.size !== source.size || before.mtimeMs !== source.mtimeMs ||
      before.ctimeMs !== source.ctimeMs || before.dev !== source.dev || before.ino !== source.ino
    ) throw new Error("The selected document changed; restart the review.");
    const buffer = await handle.readFile();
    const after = await handle.stat();
    if (
      after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs ||
      after.dev !== before.dev || after.ino !== before.ino
    ) {
      throw new Error("The selected document changed while it was being read; restart the review.");
    }
    if (buffer.includes(0)) throw new Error("The selected document is binary.");
    let content;
    try {
      content = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      throw new Error("The selected document is not valid UTF-8 text.");
    }
    return content;
  } finally {
    await handle?.close();
  }
}

function attachDocumentSources(session, sources) {
  Object.defineProperty(session, DOCUMENT_SOURCES, { value: sources, enumerable: false });
  return session;
}

export async function createDocumentSession(argument, env = process.env, cwd = process.cwd()) {
  if (typeof argument !== "string" || !argument || argument.startsWith("-") || /^[a-z][a-z\d+.-]*:/i.test(argument) || argument.startsWith("//")) {
    throw new Error("review-annotate requires exactly `last` or one local file/folder path.");
  }
  if (argument === "last") {
    let content;
    let sourceLabel;
    if (env.PI_SESSION_FILE) {
      content = await readPiPreviousAssistantText(env.PI_SESSION_FILE, env.PI_SESSION_ID);
      sourceLabel = "latest assistant response · active Pi branch";
    } else if (env.CODEX_THREAD_ID) {
      const rolloutFile = await findCodexRolloutFile(env.CODEX_THREAD_ID, env);
      content = await readCodexPreviousAssistantText(rolloutFile, env.CODEX_THREAD_ID);
      sourceLabel = "latest assistant response · active Codex thread";
    } else {
      throw new Error("`last` requires the active Pi or Codex session; refusing to guess from unrelated transcripts.");
    }
    enforceSourceSize(content);
    const buffer = Buffer.from(content);
    const source = {
      path: null, root: null, relativePath: "Assistant response", kind: "markdown", size: buffer.length,
      mtimeMs: 0, ctimeMs: 0, dev: 0, ino: 0, content,
    };
    const document = publicDocument(source);
    return attachDocumentSources({
      version: 2,
      id: createHash("sha256").update("document\0last\0").update(content).digest("hex"),
      mode: "document",
      title: "Review last response",
      sourceLabel,
      rootLabel: "Assistant response",
      documents: [document],
      initialDocumentId: document.id,
      createdAt: new Date().toISOString(),
    }, [source]);
  }

  const absolute = resolve(cwd, argument);
  const stats = await lstat(absolute).catch((error) => {
    if (error?.code === "ENOENT") throw new Error("The selected review source does not exist.");
    throw error;
  });
  if (stats.isSymbolicLink()) throw new Error("Symbolic links are not accepted as review sources.");
  const canonical = await realpath(absolute);
  let sources;
  let root;
  if (stats.isFile()) {
    const kind = documentKind(canonical);
    if (!kind) throw new Error("The selected file type is not supported for review.");
    if (stats.size > MAX_DOCUMENT_BYTES) throw new Error("The selected document exceeds the per-file safety limit.");
    root = dirname(canonical);
    sources = [snapshotSource(canonical, root, basename(canonical), kind, stats)];
    await readDocumentSource(sources[0]);
  } else if (stats.isDirectory()) {
    root = canonical;
    sources = await enumerateDocumentSources(canonical, canonical);
    if (sources.length === 0) throw new Error("The selected folder contains no supported documents.");
  } else {
    throw new Error("The selected review source is not a regular file or folder.");
  }
  const documents = sources.map(publicDocument);
  const idHash = createHash("sha256").update("document\0").update(canonical);
  for (const document of documents) idHash.update("\0").update(document.id);
  return attachDocumentSources({
    version: 2,
    id: idHash.digest("hex"),
    mode: "document",
    title: "Review documents",
    sourceLabel: basename(canonical),
    rootLabel: basename(canonical),
    documents,
    initialDocumentId: documents[0].id,
    createdAt: new Date().toISOString(),
  }, sources);
}

function commandResult(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: {
      ...process.env,
      GIT_PAGER: "cat",
      PAGER: "cat",
      GH_PROMPT_DISABLED: "1",
      GLAB_PAGER: "cat",
      NO_COLOR: "1",
      CLICOLOR: "0",
      ...(options.env ?? {}),
    },
    encoding: "utf8",
    maxBuffer: MAX_SOURCE_BYTES + 1024 * 1024,
    timeout: COMMAND_TIMEOUT_MS,
    windowsHide: true,
  });
  if (result.error) {
    if (result.error.code === "ENOENT") throw new Error(`${command} is required but was not found on PATH.`);
    throw result.error;
  }
  if (options.acceptStatuses?.includes(result.status)) return result.stdout ?? "";
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "unknown error").trim();
    throw new Error(`${command} ${args.join(" ")} failed (${result.status}): ${detail}`);
  }
  return result.stdout ?? "";
}

function normalizeGitPath(path) {
  return path.split(sep).join("/");
}

function untrackedPatch(root, path) {
  return commandResult(
    "git",
    ["diff", "--no-ext-diff", "--no-index", "--", "/dev/null", path],
    { cwd: root, acceptStatuses: [0, 1] },
  );
}

export function collectLocalDiff(cwd = process.cwd()) {
  const root = commandResult("git", ["rev-parse", "--show-toplevel"], { cwd }).trim();
  if (!root) throw new Error("Git did not return a worktree root.");

  let tracked = "";
  const hasHead = spawnSync("git", ["rev-parse", "--verify", "HEAD"], {
    cwd: root,
    stdio: "ignore",
    windowsHide: true,
  }).status === 0;
  if (hasHead) {
    tracked = commandResult(
      "git",
      ["diff", "--no-ext-diff", "--find-renames", "--find-copies", "HEAD", "--"],
      { cwd: root },
    );
  } else {
    tracked = commandResult(
      "git",
      ["diff", "--cached", "--no-ext-diff", "--find-renames", "--find-copies", "--"],
      { cwd: root },
    );
  }

  const untrackedOutput = commandResult("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: root });
  const untracked = untrackedOutput.split("\0").filter(Boolean);
  if (untracked.length > MAX_UNTRACKED_FILES) {
    throw new Error(`Worktree has ${untracked.length} untracked files; limit is ${MAX_UNTRACKED_FILES}. Narrow the review scope first.`);
  }

  const patches = [tracked];
  for (const path of untracked) patches.push(untrackedPatch(root, normalizeGitPath(path)));
  return {
    content: enforceSourceSize(patches.filter(Boolean).join("\n")),
    sourceLabel: `${root} · worktree`,
  };
}

function verifiedCommit(root, revision, label) {
  if (!revision || revision.startsWith("-")) throw new Error(`${label} must name a commit.`);
  return commandResult("git", ["rev-parse", "--verify", `${revision}^{commit}`], { cwd: root }).trim();
}

export function collectRevisionDiff(cwd = process.cwd(), revision, requireRange = false) {
  const root = commandResult("git", ["rev-parse", "--show-toplevel"], { cwd }).trim();
  if (!root) throw new Error("Git did not return a worktree root.");

  const range = revision.match(/^(.+?)(\.{2,3})(.+)$/);
  if (requireRange && !range) throw new Error("--range requires <base>..<head> or <base>...<head>.");

  let content;
  let sourceLabel;
  if (range) {
    const [, base, operator, head] = range;
    const baseCommit = verifiedCommit(root, base, "Range base");
    const headCommit = verifiedCommit(root, head, "Range head");
    content = commandResult(
      "git",
      ["diff", "--no-ext-diff", "--find-renames", "--find-copies", `${baseCommit}${operator}${headCommit}`, "--"],
      { cwd: root },
    );
    sourceLabel = `${root} · ${revision}`;
  } else {
    const commit = verifiedCommit(root, revision, "Revision");
    content = commandResult(
      "git",
      ["show", "--format=", "--no-ext-diff", "--find-renames", "--find-copies", commit, "--"],
      { cwd: root },
    );
    sourceLabel = `${root} · commit ${revision}`;
  }
  return { content: enforceSourceSize(content), sourceLabel };
}

export function collectWorktreeFingerprint(cwd = process.cwd()) {
  try {
    const root = commandResult("git", ["rev-parse", "--show-toplevel"], { cwd }).trim();
    if (!root) return null;
    const hash = createHash("sha256");
    const hasHead = spawnSync("git", ["rev-parse", "--verify", "HEAD"], {
      cwd: root,
      stdio: "ignore",
      windowsHide: true,
    }).status === 0;
    const trackedArgs = hasHead
      ? ["--no-optional-locks", "diff", "--no-ext-diff", "HEAD", "--"]
      : ["--no-optional-locks", "diff", "--cached", "--no-ext-diff", "--"];
    hash.update(commandResult("git", trackedArgs, { cwd: root }));

    const status = commandResult(
      "git",
      ["--no-optional-locks", "status", "--porcelain=v1", "-z", "--untracked-files=all"],
      { cwd: root },
    );
    hash.update("\0status\0").update(status);
    const untracked = status
      .split("\0")
      .filter((entry) => entry.startsWith("?? "))
      .map((entry) => entry.slice(3))
      .slice(0, MAX_UNTRACKED_FINGERPRINT_FILES);
    for (const path of untracked) {
      const fullPath = resolve(root, path);
      const stats = lstatSync(fullPath);
      hash.update("\0untracked\0").update(path);
      if (stats.isSymbolicLink()) {
        hash.update(`symlink:${readlinkSync(fullPath)}`);
      } else if (!stats.isFile() || stats.size > MAX_UNTRACKED_FINGERPRINT_CONTENT_BYTES) {
        hash.update(`${stats.isFile() ? "large" : "non-file"}:${stats.size}:${stats.mtimeMs}`);
      } else {
        hash.update(readFileSync(fullPath));
      }
    }
    return hash.digest("hex");
  } catch {
    return null;
  }
}

export function classifyReviewUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Expected a GitHub pull request or GitLab merge request URL, received: ${value}`);
  }
  if (url.protocol !== "https:") throw new Error("Review URLs must use HTTPS.");

  const github = url.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/.*)?$/);
  if (github && url.hostname === "github.com") {
    return { kind: "github", url: url.href, number: github[3] };
  }

  const gitlab = url.pathname.match(/^\/(.+)\/-\/merge_requests\/(\d+)(?:\/.*)?$/);
  if (gitlab) {
    const repositoryUrl = `${url.origin}/${gitlab[1]}`;
    return { kind: "gitlab", url: url.href, number: gitlab[2], repositoryUrl };
  }
  throw new Error(`Unsupported review URL: ${value}`);
}

export function collectRemoteDiff(value) {
  const target = classifyReviewUrl(value);
  const content = target.kind === "github"
    ? commandResult("gh", ["pr", "diff", target.url, "--patch", "--color=never"])
    : commandResult("glab", ["mr", "diff", target.number, "--raw", "--color=never", "--repo", target.repositoryUrl]);
  return { content: enforceSourceSize(content), sourceLabel: target.url };
}

export async function createReviewSession(mode, args, env = process.env, cwd = process.cwd()) {
  if (mode === "document") {
    if (args.length !== 1) throw new Error("review-annotate requires exactly `last` or one local file/folder path.");
    return createDocumentSession(args[0], env, cwd);
  }
  let source;
  if (mode === "diff" && args.length === 0) {
    source = collectLocalDiff(cwd);
  } else if (args.length === 1) {
    source = /^[a-z][a-z\d+.-]*:\/\//i.test(args[0])
      ? collectRemoteDiff(args[0])
      : collectRevisionDiff(cwd, args[0]);
  } else if (args.length === 2 && (args[0] === "--commit" || args[0] === "--range")) {
    source = collectRevisionDiff(cwd, args[1], args[0] === "--range");
  } else {
    throw new Error("review-diff accepts a PR/MR URL, a commit, or one commit range.");
  }
  const id = createHash("sha256").update(mode).update("\0").update(source.content).digest("hex");
  return {
    version: 1,
    id,
    mode: "diff",
    title: "Review diff",
    sourceLabel: source.sourceLabel,
    content: source.content,
    createdAt: new Date().toISOString(),
  };
}

function securityHeaders(contentType, csp = null) {
  return {
    "Cache-Control": "no-store",
    "Content-Security-Policy": csp ?? "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'",
    "Content-Type": contentType,
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
}

function sourceMap(session) {
  const sources = session[DOCUMENT_SOURCES];
  if (!Array.isArray(sources)) return new Map();
  return new Map(sources.map((source) => [documentId(source.relativePath, source), source]));
}

function htmlText(content) {
  return content
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function safeRelativeAsset(value) {
  const clean = value.trim();
  if (!clean || clean.startsWith("#") || clean.startsWith("/") || clean.startsWith("\\") || clean.includes("?") || clean.includes("#")) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(clean) || clean.startsWith("//")) return null;
  const parts = clean.replaceAll("\\", "/").split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) return null;
  return parts.join("/");
}

function assetUrl(base, documentIdValue, value, relativeDirectory = "") {
  const relativeAsset = safeRelativeAsset(value);
  if (!relativeAsset) return null;
  const resolvedAsset = safeRelativeAsset(relativeDirectory ? join(relativeDirectory, relativeAsset) : relativeAsset);
  if (!resolvedAsset || !ALLOWED_ASSET_MIME.has(extname(resolvedAsset).toLowerCase())) return null;
  return `${base}api/asset/${documentIdValue}/${Buffer.from(resolvedAsset).toString("base64url")}`;
}

function rewriteHtml(content, base, documentIdValue) {
  const withoutRefresh = content.replace(/<meta\b(?=[^>]*\bhttp-equiv\s*=\s*(?:["']?refresh\b))[^>]*>/gi, "");
  return withoutRefresh.replace(
    /\b(src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/gi,
    (_match, attribute, doubleQuoted, singleQuoted, unquoted) => {
      const value = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
      if (/^(?:data:image\/(?:png|jpeg|gif|webp);base64,)/i.test(value)) return `${attribute}="${value}"`;
      const rewritten = assetUrl(base, documentIdValue, value);
      return `${attribute}="${rewritten ?? "about:blank#blocked"}"`;
    },
  );
}

function rewriteCss(content, base, documentIdValue, relativeDirectory = "") {
  const importsRewritten = content.replace(/@import\s*(["'])([^"']+)\1/gi, (_match, _quote, value) => {
    const rewritten = assetUrl(base, documentIdValue, value, relativeDirectory);
    return `@import url("${rewritten ?? "about:blank#blocked"}")`;
  });
  return importsRewritten.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (_match, _quote, value) => {
    if (value.startsWith(base)) return `url("${value}")`;
    const rewritten = assetUrl(base, documentIdValue, value, relativeDirectory);
    return rewritten ? `url("${rewritten}")` : "url(\"about:blank#blocked\")";
  });
}

async function resolveAssetSource(source, encoded) {
  if (!source.path || !source.root || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  let requested;
  try {
    requested = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const safe = safeRelativeAsset(requested);
  if (!safe) return null;
  const candidate = resolve(dirname(source.path), safe);
  const stats = await lstat(candidate).catch(() => null);
  if (!stats?.isFile() || stats.isSymbolicLink() || stats.size > MAX_DOCUMENT_BYTES) return null;
  const canonical = await realpath(candidate);
  if (!isContained(source.root, canonical) || !isContained(dirname(source.path), canonical)) return null;
  const mime = ALLOWED_ASSET_MIME.get(extname(canonical).toLowerCase());
  return mime ? {
    path: canonical,
    relativePath: safe,
    mime,
    size: stats.size,
    mtimeMs: stats.mtimeMs,
    ctimeMs: stats.ctimeMs,
    dev: stats.dev,
    ino: stats.ino,
  } : null;
}

async function readAsset(asset) {
  let handle;
  try {
    handle = await open(asset.path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const before = await handle.stat();
    if (
      !before.isFile() || before.size !== asset.size || before.mtimeMs !== asset.mtimeMs ||
      before.ctimeMs !== asset.ctimeMs || before.dev !== asset.dev || before.ino !== asset.ino
    ) throw new Error("The local asset changed; restart the review.");
    const body = await handle.readFile();
    const after = await handle.stat();
    if (
      after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs ||
      after.dev !== before.dev || after.ino !== before.ino
    ) {
      throw new Error("The local asset changed while it was being read; restart the review.");
    }
    return body;
  } finally {
    await handle?.close();
  }
}

function readSmallRequest(request) {
  return new Promise((resolveRequest, rejectRequest) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) {
        rejectRequest(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolveRequest(Buffer.concat(chunks)));
    request.on("error", rejectRequest);
  });
}

export async function startWorkspaceServer(session, options = {}) {
  const token = options.token ?? randomBytes(24).toString("base64url");
  const assets = options.assets ?? {
    index: await readFile(join(ASSET_DIRECTORY, "index.html")),
    script: await readFile(join(ASSET_DIRECTORY, "app.js")),
    style: await readFile(join(ASSET_DIRECTORY, "app.css")),
  };
  let currentSession = session;
  let documentsById = sourceMap(session);
  const preferenceStore = options.preferenceStore ?? {
    read: () => readReviewPreferences(options.env),
    write: (value) => writeReviewPreferences(value, options.env),
  };
  let preferences = parseReviewPreferences(await preferenceStore.read());
  let finish;
  let finished = false;
  const startedAt = Date.now();
  let lastHeartbeat = startedAt;
  let receivedHeartbeat = false;
  let expectedHost = null;
  const completion = new Promise((resolveCompletion) => { finish = resolveCompletion; });

  const complete = (reason) => {
    if (finished) return;
    finished = true;
    finish(reason);
  };

  const server = createServer(async (request, response) => {
    const host = request.headers.host ?? "";
    if (!expectedHost || host !== expectedHost) {
      response.writeHead(421, securityHeaders("text/plain; charset=utf-8"));
      response.end("Misdirected request");
      return;
    }

    const requestUrl = new URL(request.url ?? "/", `http://${host}`);
    const base = `/${token}/`;
    const path = requestUrl.pathname;
    const send = (status, contentType, body, csp = null) => {
      response.writeHead(status, securityHeaders(contentType, csp));
      response.end(body);
    };

    try {
      if ((request.method === "POST" || request.method === "PUT") && request.headers.origin !== `http://${expectedHost}`) {
        send(403, "text/plain; charset=utf-8", "Cross-origin request denied");
      } else if (request.method === "GET" && path === base) {
        send(200, "text/html; charset=utf-8", assets.index);
      } else if (request.method === "GET" && path === `${base}app.js`) {
        send(200, "text/javascript; charset=utf-8", assets.script);
      } else if (request.method === "GET" && path === `${base}app.css`) {
        send(200, "text/css; charset=utf-8", assets.style);
      } else if (request.method === "GET" && path === `${base}api/session`) {
        if (options.refreshSession) {
          const refreshed = await options.refreshSession();
          if (refreshed.id !== currentSession.id) {
            currentSession = refreshed;
            documentsById = sourceMap(refreshed);
          }
        }
        if (requestUrl.searchParams.get("after") === currentSession.id) {
          send(204, "application/json; charset=utf-8", "");
        } else {
          send(200, "application/json; charset=utf-8", JSON.stringify(currentSession));
        }
      } else if (request.method === "GET" && path.startsWith(`${base}api/document/`)) {
        const id = path.slice(`${base}api/document/`.length);
        const source = documentsById.get(id);
        if (!source || id.includes("/")) {
          send(404, "text/plain; charset=utf-8", "Document not found");
        } else {
          const content = await readDocumentSource(source);
          send(200, "application/json; charset=utf-8", JSON.stringify({
            id,
            kind: source.kind,
            content: source.kind === "html" ? htmlText(content) : content,
            frameUrl: source.kind === "html" ? `./api/html/${id}` : undefined,
          }));
        }
      } else if (request.method === "GET" && path.startsWith(`${base}api/html/`)) {
        const id = path.slice(`${base}api/html/`.length);
        const source = documentsById.get(id);
        if (!source || source.kind !== "html" || id.includes("/")) {
          send(404, "text/plain; charset=utf-8", "Document not found", HTML_CSP);
        } else {
          const content = await readDocumentSource(source);
          send(200, "text/html; charset=utf-8", rewriteHtml(content, base, id), HTML_CSP);
        }
      } else if (request.method === "GET" && path.startsWith(`${base}api/asset/`)) {
        const parts = path.slice(`${base}api/asset/`.length).split("/");
        const source = parts.length === 2 ? documentsById.get(parts[0]) : null;
        const asset = source ? await resolveAssetSource(source, parts[1]) : null;
        if (!source || !asset) {
          send(404, "text/plain; charset=utf-8", "Asset not found", HTML_CSP);
        } else {
          let body = await readAsset(asset);
          if (asset.mime.startsWith("text/css")) {
            const css = new TextDecoder("utf-8", { fatal: true }).decode(body);
            body = Buffer.from(rewriteCss(css, base, parts[0], dirname(asset.relativePath)));
          }
          send(200, asset.mime, body, HTML_CSP);
        }
      } else if (request.method === "GET" && path === `${base}api/preferences`) {
        send(200, "application/json; charset=utf-8", JSON.stringify(preferences));
      } else if (request.method === "PUT" && path === `${base}api/preferences`) {
        if ((request.headers["content-type"] ?? "").split(";", 1)[0].trim() !== "application/json") {
          send(415, "text/plain; charset=utf-8", "Expected application/json");
        } else {
          const body = await readSmallRequest(request);
          let nextPreferences;
          try {
            nextPreferences = JSON.parse(body.toString("utf8"));
          } catch {
            throw new Error("Invalid preferences JSON.");
          }
          if (!isReviewPreferences(nextPreferences)) throw new Error("Invalid review display preferences.");
          const normalizedPreferences = parseReviewPreferences(nextPreferences);
          await preferenceStore.write(normalizedPreferences);
          preferences = normalizedPreferences;
          send(200, "application/json; charset=utf-8", JSON.stringify(preferences));
        }
      } else if (request.method === "POST" && path === `${base}api/heartbeat`) {
        await readSmallRequest(request);
        receivedHeartbeat = true;
        lastHeartbeat = Date.now();
        send(204, "text/plain; charset=utf-8", "");
      } else if (request.method === "POST" && path === `${base}api/close`) {
        await readSmallRequest(request);
        send(204, "text/plain; charset=utf-8", "");
        complete(requestUrl.searchParams.get("reason") || "closed");
      } else {
        send(404, "text/plain; charset=utf-8", "Not found");
      }
    } catch (error) {
      send(400, "text/plain; charset=utf-8", error instanceof Error ? error.message : String(error));
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not determine the local review server address.");
  expectedHost = `127.0.0.1:${address.port}`;
  const url = `http://${expectedHost}/${token}/`;

  const heartbeatTimer = setInterval(() => {
    const now = Date.now();
    if (!receivedHeartbeat && now - startedAt > ACTIVATION_TIMEOUT_MS) complete("activation-timeout");
    else if (receivedHeartbeat && now - lastHeartbeat > HEARTBEAT_TIMEOUT_MS) complete("heartbeat-timeout");
  }, 5_000);
  heartbeatTimer.unref();

  const close = async (reason = "host-closed") => {
    complete(reason);
    clearInterval(heartbeatTimer);
    if (!server.listening) return;
    await new Promise((resolveClose) => server.close(() => resolveClose()));
  };

  completion.finally(() => {
    clearInterval(heartbeatTimer);
  });

  return { url, completion, close, token };
}

function glimpseCandidates(env = process.env) {
  const candidates = [];
  if (env.REVIEW_WORKSPACE_GLIMPSE_MODULE) candidates.push(resolve(env.REVIEW_WORKSPACE_GLIMPSE_MODULE));
  const homes = [
    join(homedir(), ".pi", "agent", "git", "github.com", "HazAT", "glimpse", "src", "glimpse.mjs"),
    join(homedir(), ".pi", "agent", "npm", "node_modules", "glimpseui", "src", "glimpse.mjs"),
  ];
  for (const path of homes) if (!candidates.includes(path)) candidates.push(path);
  return candidates;
}

async function findGlimpseModule(env = process.env) {
  if (env.REVIEW_WORKSPACE_GLIMPSE === "0") return null;
  for (const candidate of glimpseCandidates(env)) {
    try {
      const stats = await lstat(candidate);
      if (stats.isFile()) return candidate;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return null;
}

function iframeHtml(url, title) {
  const safeUrl = url.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const safeTitle = title.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title><style>html,body,iframe{width:100%;height:100%;margin:0;border:0;background:#181715}body{overflow:hidden}</style></head><body><iframe src="${safeUrl}" title="${safeTitle}"></iframe></body></html>`;
}

async function openWithGlimpse(url, title, env = process.env) {
  const modulePath = await findGlimpseModule(env);
  if (!modulePath) return null;
  try {
    const glimpse = await import(pathToFileURL(modulePath).href);
    const windowHandle = glimpse.open(iframeHtml(url, title), {
      width: 1440,
      height: 900,
      title,
      openLinks: false,
    });
    const closed = new Promise((resolveClosed) => {
      windowHandle.once("closed", () => resolveClosed("surface-closed"));
      windowHandle.once("error", () => resolveClosed("surface-error"));
    });
    return { kind: "glimpse", close: () => windowHandle.close(), closed };
  } catch (error) {
    if (env.REVIEW_WORKSPACE_DEBUG === "1") {
      process.stderr.write(`Glimpse unavailable: ${error instanceof Error ? error.message : String(error)}\n`);
    }
    return null;
  }
}

function spawnDetached(command, args) {
  return new Promise((resolveSpawn, rejectSpawn) => {
    const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
    child.once("error", rejectSpawn);
    child.once("spawn", () => {
      child.unref();
      resolveSpawn();
    });
  });
}

export async function openInBrowser(url, platform = process.platform) {
  if (platform === "darwin") return spawnDetached("open", [url]);
  if (platform === "win32") return spawnDetached("rundll32", ["url.dll,FileProtocolHandler", url]);
  return spawnDetached("xdg-open", [url]);
}

export async function openWorkspaceSurface(url, title, env = process.env) {
  if (env.REVIEW_WORKSPACE_SURFACE === "none") return { kind: "none", close() {}, closed: new Promise(() => {}) };
  const isPi = Boolean(env.PI_SESSION_FILE || env.PI_CODING_AGENT === "true");
  if (isPi) {
    const glimpse = await openWithGlimpse(url, title, env);
    if (glimpse) return glimpse;
  }
  await openInBrowser(url);
  return { kind: "browser", close() {}, closed: new Promise(() => {}) };
}

export async function runReview(mode, args, options = {}) {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  let worktreeFingerprint = mode === "diff" && args.length === 0
    ? collectWorktreeFingerprint(cwd)
    : null;
  const session = await createReviewSession(mode, args, env, cwd);
  let latestSession = session;
  const refreshSession = mode === "diff" && args.length === 0
    ? async () => {
        const nextFingerprint = collectWorktreeFingerprint(cwd);
        if (nextFingerprint === null || nextFingerprint === worktreeFingerprint) return latestSession;
        const refreshedSession = await createReviewSession(mode, args, env, cwd);
        worktreeFingerprint = nextFingerprint;
        latestSession = refreshedSession;
        return latestSession;
      }
    : undefined;
  const workspace = await startWorkspaceServer(session, { ...options.serverOptions, env, refreshSession });
  let surface;
  try {
    surface = await openWorkspaceSurface(workspace.url, session.title, env);
    const reason = await Promise.race([workspace.completion, surface.closed]);
    surface.close();
    await workspace.close(reason);
    return 0;
  } catch (error) {
    surface?.close();
    await workspace.close("error");
    throw error;
  }
}

export async function main(args = process.argv.slice(2), options = {}) {
  const [command, ...rest] = args;
  const packageName = basename(SKILL_DIRECTORY);
  if (command === "annotate" && packageName !== "review-diff") return runReview("document", rest, options);
  if (command === "diff" && packageName !== "review-annotate") return runReview("diff", rest, options);
  const usage = packageName === "review-annotate"
    ? "review-workspace.mjs annotate <last|file|folder>"
    : packageName === "review-diff"
      ? "review-workspace.mjs diff [pr-or-mr-url|commit|base..head|--commit commit|--range base..head]"
      : "review-workspace.mjs <annotate <last|file|folder> | diff [source]>";
  throw new Error(`Usage: ${usage}`);
}

function isDirectInvocation(argvPath) {
  if (!argvPath) return false;
  try {
    return realpathSync(resolve(argvPath)) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return resolve(argvPath) === fileURLToPath(import.meta.url);
  }
}

if (isDirectInvocation(process.argv[1])) {
  main()
    .then((status) => { process.exitCode = status; })
    .catch((error) => {
      process.stderr.write(`review skill: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
