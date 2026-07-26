import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  classifyReviewUrl,
  collectLocalDiff,
  createReviewSession,
  extractPreviousAssistantText,
  readPiPreviousAssistantText,
  readReviewPreferences,
  startWorkspaceServer,
} from "../skills/review-last/scripts/review-workspace.mjs";

function textMessage(id, parentId, role, text) {
  return {
    type: "message",
    id,
    parentId,
    message: { role, content: [{ type: "text", text }] },
  };
}

function invocationMessage(id, parentId, preamble) {
  return {
    type: "message",
    id,
    parentId,
    message: {
      role: "assistant",
      content: [
        ...(preamble ? [{ type: "text", text: preamble }] : []),
        { type: "toolCall", id: "call-1", name: "bash", arguments: { command: "review" } },
      ],
    },
  };
}

async function withTempDirectory(run) {
  const directory = await mkdtemp(join(tmpdir(), "embedded-review-test-"));
  try {
    return await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("extracts the previous assistant response from the active Pi parent chain", () => {
  const entries = [
    textMessage("u1", null, "user", "start"),
    textMessage("a1", "u1", "assistant", "active answer"),
    textMessage("u2", "a1", "user", "abandoned prompt"),
    textMessage("a2", "u2", "assistant", "newer abandoned answer"),
    textMessage("u3", "a1", "user", "review the last answer"),
    invocationMessage("a3", "u3", "current-turn preamble"),
    {
      type: "message",
      id: "t1",
      parentId: "a3",
      message: { role: "toolResult", content: [{ type: "text", text: "skill loaded" }] },
    },
    invocationMessage("a4", "t1"),
  ];
  assert.equal(extractPreviousAssistantText(entries), "active answer");
});

test("fails closed when the current Pi tool invocation cannot be proven", () => {
  assert.throws(
    () => extractPreviousAssistantText([
      textMessage("u1", null, "user", "start"),
      textMessage("a1", "u1", "assistant", "answer"),
      textMessage("u2", "a1", "user", "review"),
    ]),
    /current Pi tool-call message/,
  );
});

test("reads Pi JSONL and creates a stable review-last session", async () => {
  await withTempDirectory(async (directory) => {
    const sessionFile = join(directory, "session.jsonl");
    const entries = [
      { type: "session", version: 3, id: "session-id", cwd: directory },
      textMessage("u1", null, "user", "start"),
      textMessage("a1", "u1", "assistant", "# Answer\n\nExact response."),
      textMessage("u2", "a1", "user", "review"),
      invocationMessage("a2", "u2"),
    ];
    await writeFile(sessionFile, `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);

    assert.equal(await readPiPreviousAssistantText(sessionFile), "# Answer\n\nExact response.");
    const review = await createReviewSession("markdown", [], { PI_SESSION_FILE: sessionFile }, directory);
    assert.equal(review.mode, "markdown");
    assert.equal(review.content, "# Answer\n\nExact response.");
    assert.equal(review.id.length, 64);
  });
});

test("rejects mismatched and duplicate Pi session identity", async () => {
  await withTempDirectory(async (directory) => {
    const sessionFile = join(directory, "session.jsonl");
    const entries = [
      { type: "session", version: 3, id: "session-id", cwd: directory },
      textMessage("u1", null, "user", "start"),
      textMessage("a1", "u1", "assistant", "answer"),
      { ...textMessage("a1", "u1", "assistant", "duplicate"), parentId: "a1" },
    ];
    await writeFile(sessionFile, `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);

    await assert.rejects(readPiPreviousAssistantText(sessionFile, "other-session"), /session ID mismatch/i);
    await assert.rejects(readPiPreviousAssistantText(sessionFile, "session-id"), /Duplicate Pi session entry ID/);
  });
});

test("requires explicit input outside Pi", async () => {
  await assert.rejects(
    createReviewSession("markdown", [], {}, process.cwd()),
    /requires --file <path> or --stdin/,
  );
});

test("classifies only HTTPS GitHub PR and GitLab MR URLs", () => {
  assert.deepEqual(
    classifyReviewUrl("https://github.com/acme/widget/pull/42"),
    { kind: "github", url: "https://github.com/acme/widget/pull/42", number: "42" },
  );
  assert.deepEqual(
    classifyReviewUrl("https://gitlab.example.com/group/sub/project/-/merge_requests/9"),
    {
      kind: "gitlab",
      url: "https://gitlab.example.com/group/sub/project/-/merge_requests/9",
      number: "9",
      repositoryUrl: "https://gitlab.example.com/group/sub/project",
    },
  );
  assert.throws(() => classifyReviewUrl("http://github.com/acme/widget/pull/1"), /HTTPS/);
  assert.throws(() => classifyReviewUrl("https://example.com/not-a-review"), /Unsupported/);
});

test("collects tracked, staged, and untracked worktree changes without mutation", async () => {
  await withTempDirectory(async (directory) => {
    execFileSync("git", ["init", "-q"], { cwd: directory });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: directory });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: directory });
    await writeFile(join(directory, "tracked.txt"), "before\n");
    execFileSync("git", ["add", "tracked.txt"], { cwd: directory });
    execFileSync("git", ["commit", "-qm", "initial"], { cwd: directory });

    await writeFile(join(directory, "tracked.txt"), "after\n");
    await writeFile(join(directory, "untracked.txt"), "new file\n");
    const beforeStatus = execFileSync("git", ["status", "--short"], { cwd: directory, encoding: "utf8" });
    const review = collectLocalDiff(directory);
    const afterStatus = execFileSync("git", ["status", "--short"], { cwd: directory, encoding: "utf8" });

    assert.match(review.content, /diff --git a\/tracked\.txt b\/tracked\.txt/);
    assert.match(review.content, /diff --git a\/untracked\.txt b\/untracked\.txt/);
    assert.match(review.content, /\+new file/);
    assert.equal(afterStatus, beforeStatus);
  });
});

test("serves one tokenized local workspace with strict no-store headers", async () => {
  const session = {
    version: 1,
    id: "a".repeat(64),
    mode: "markdown",
    title: "Review last response",
    sourceLabel: "test",
    content: "# Test",
    createdAt: "2026-07-26T12:00:00.000Z",
  };
  const workspace = await startWorkspaceServer(session, {
    token: "fixed-token",
    assets: {
      index: Buffer.from("<!doctype html><div id=app></div>"),
      script: Buffer.from("export {};"),
      style: Buffer.from("body{}"),
    },
  });
  try {
    const page = await fetch(workspace.url);
    assert.equal(page.status, 200);
    assert.equal(page.headers.get("cache-control"), "no-store");
    assert.match(page.headers.get("content-security-policy"), /default-src 'none'/);
    assert.equal(page.headers.get("x-frame-options"), null);

    const loadedSession = await (await fetch(`${workspace.url}api/session`)).json();
    assert.deepEqual(loadedSession, session);
    const wrongToken = new URL(workspace.url);
    wrongToken.pathname = "/wrong/";
    assert.equal((await fetch(wrongToken)).status, 404);

    const origin = new URL(workspace.url).origin;
    assert.equal((await fetch(`${workspace.url}api/heartbeat`, { method: "POST" })).status, 403);
    assert.equal((await fetch(`${workspace.url}api/heartbeat`, {
      method: "POST",
      headers: { Origin: origin },
    })).status, 204);
    assert.equal((await fetch(`${workspace.url}api/close`, {
      method: "POST",
      headers: { Origin: origin },
    })).status, 204);
    assert.equal(await workspace.completion, "closed");
  } finally {
    await workspace.close("test-cleanup");
  }
});

test("persists validated display preferences on this computer across workspaces", async () => {
  await withTempDirectory(async (directory) => {
    const env = { REVIEW_WORKSPACE_STATE_DIRECTORY: directory };
    const session = {
      version: 1,
      id: "b".repeat(64),
      mode: "diff",
      title: "Review diff",
      sourceLabel: "test",
      content: "diff --git a/a.txt b/a.txt\n",
      createdAt: "2026-07-26T12:00:00.000Z",
    };
    const assets = {
      index: Buffer.from("<!doctype html><div id=app></div>"),
      script: Buffer.from("export {};"),
      style: Buffer.from("body{}"),
    };
    const first = await startWorkspaceServer(session, { token: "preferences-one", assets, env });
    try {
      const origin = new URL(first.url).origin;
      const saved = { version: 1, diffStyle: "split", codeFontSize: 16 };
      const response = await fetch(`${first.url}api/preferences`, {
        method: "PUT",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify(saved),
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), saved);

      const invalid = await fetch(`${first.url}api/preferences`, {
        method: "PUT",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify({ version: 1, diffStyle: "sideways", codeFontSize: 48 }),
      });
      assert.equal(invalid.status, 400);
      const unknownKey = await fetch(`${first.url}api/preferences`, {
        method: "PUT",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify({ ...saved, extra: true }),
      });
      assert.equal(unknownKey.status, 400);
      const crossOrigin = await fetch(`${first.url}api/preferences`, {
        method: "PUT",
        headers: { Origin: "https://attacker.invalid", "Content-Type": "application/json" },
        body: JSON.stringify(saved),
      });
      assert.equal(crossOrigin.status, 403);
      assert.deepEqual(await readReviewPreferences(env), saved);
    } finally {
      await first.close("test-cleanup");
    }

    const second = await startWorkspaceServer(session, { token: "preferences-two", assets, env });
    try {
      const loaded = await (await fetch(`${second.url}api/preferences`)).json();
      assert.deepEqual(loaded, { version: 1, diffStyle: "split", codeFontSize: 16 });
    } finally {
      await second.close("test-cleanup");
    }
  });
});

test("both independently synced skills carry identical runtime assets and notices", async () => {
  const files = [
    "assets/app.js",
    "assets/app.css",
    "assets/core.mjs",
    "assets/index.html",
    "scripts/review-workspace.mjs",
    "licenses/LICENSE-APACHE",
    "licenses/LICENSE-MIT",
    "licenses/PLANNOTATOR_NOTICE.md",
    "licenses/THIRD_PARTY_NOTICES.md",
  ];
  for (const file of files) {
    const last = await readFile(join("skills", "review-last", file));
    const diff = await readFile(join("skills", "review-diff", file));
    assert.deepEqual(diff, last, file);
  }
});
