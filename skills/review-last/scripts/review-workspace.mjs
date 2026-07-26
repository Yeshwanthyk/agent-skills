#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { createReadStream, realpathSync } from "node:fs";
import { lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { createInterface } from "node:readline";
import { pathToFileURL, fileURLToPath } from "node:url";

export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
export const MAX_UNTRACKED_FILES = 500;
export const MAX_SESSION_BYTES = 100 * 1024 * 1024;
const HEARTBEAT_TIMEOUT_MS = 30_000;
const ACTIVATION_TIMEOUT_MS = 60_000;
const MAX_REQUEST_BYTES = 1_024;
const COMMAND_TIMEOUT_MS = 60_000;
const RUNTIME_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const SKILL_DIRECTORY = resolve(RUNTIME_DIRECTORY, "..");
const ASSET_DIRECTORY = join(SKILL_DIRECTORY, "assets");
export const DEFAULT_REVIEW_PREFERENCES = Object.freeze({
  version: 1,
  diffStyle: "unified",
  codeFontSize: 13,
});
const CODE_FONT_SIZES = new Set([12, 13, 14, 16]);

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
    throw new Error("Pi session changed while review-last was reading it; run the skill again.");
  }
  return extractPreviousAssistantText(entries);
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

export async function resolveLastSource(args, env = process.env) {
  let file = null;
  let useStdin = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--stdin") {
      useStdin = true;
    } else if (argument === "--file") {
      file = args[index + 1];
      if (!file) throw new Error("--file requires a path.");
      index += 1;
    } else {
      throw new Error(`Unknown review-last argument: ${argument}`);
    }
  }
  if (file && useStdin) throw new Error("Use either --file or --stdin, not both.");

  let content;
  let sourceLabel;
  if (file) {
    const absolutePath = resolve(file);
    const stats = await lstat(absolutePath);
    if (!stats.isFile()) throw new Error(`Review source is not a regular file: ${absolutePath}`);
    if (stats.size > MAX_SOURCE_BYTES) throw new Error(`Review source exceeds the ${MAX_SOURCE_BYTES / 1024 / 1024} MiB limit.`);
    content = await readFile(absolutePath, "utf8");
    sourceLabel = absolutePath;
  } else if (useStdin) {
    content = await readStdin();
    sourceLabel = "assistant response from stdin";
  } else if (env.PI_SESSION_FILE) {
    content = await readPiPreviousAssistantText(env.PI_SESSION_FILE, env.PI_SESSION_ID);
    sourceLabel = "latest assistant response · active Pi branch";
  } else {
    throw new Error("Outside Pi, review-last requires --file <path> or --stdin; refusing to guess from unrelated transcripts.");
  }
  return { content: enforceSourceSize(content), sourceLabel };
}

export async function createReviewSession(mode, args, env = process.env, cwd = process.cwd()) {
  const source = mode === "markdown"
    ? await resolveLastSource(args, env)
    : args.length > 1
      ? (() => { throw new Error("review-diff accepts at most one PR or MR URL."); })()
      : args[0]
        ? collectRemoteDiff(args[0])
        : collectLocalDiff(cwd);
  const id = createHash("sha256").update(mode).update("\0").update(source.content).digest("hex");
  return {
    version: 1,
    id,
    mode,
    title: mode === "markdown" ? "Review last response" : "Review diff",
    sourceLabel: source.sourceLabel,
    content: source.content,
    createdAt: new Date().toISOString(),
  };
}

function securityHeaders(contentType) {
  return {
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'",
    "Content-Type": contentType,
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
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
  const sessionPayload = Buffer.from(JSON.stringify(session));
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
    const send = (status, contentType, body) => {
      response.writeHead(status, securityHeaders(contentType));
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
        send(200, "application/json; charset=utf-8", sessionPayload);
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
  const session = await createReviewSession(mode, args, env, options.cwd ?? process.cwd());
  const workspace = await startWorkspaceServer(session, { ...options.serverOptions, env });
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
  if (command === "last") return runReview("markdown", rest, options);
  if (command === "diff") return runReview("diff", rest, options);
  throw new Error("Usage: review-workspace.mjs <last [--file path|--stdin] | diff [pr-or-mr-url]>");
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
