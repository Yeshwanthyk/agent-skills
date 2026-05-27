#!/usr/bin/env node
/**
 * Review Export Orchestrator
 * 
 * Handles non-LLM orchestration for /review-export command.
 * 
 * Usage:
 *   node runner.mjs prepare [--diff-args "main..HEAD"]
 *   node runner.mjs finalize --results /tmp/review-results.json
 *   node runner.mjs status
 *   node runner.mjs clear-cache
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { getCache, getCacheMany, setCache, getCacheStats, clearCache } from "./cache.mjs";
import { estimateTokens, chunkDiff, getDiffStats, parseDiffFiles } from "./chunker.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = "/tmp/review-export-state.json";
const MAX_TOKENS = 50_000;

// ─────────────────────────────────────────────────────────────
// Git helpers
// ─────────────────────────────────────────────────────────────

function git(cmd, cwd = process.cwd()) {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }).trim();
  } catch (e) {
    throw new Error(`git ${cmd} failed: ${e.message}`);
  }
}

function getRepoRoot() {
  return git("rev-parse --show-toplevel");
}

function getBranch() {
  return git("rev-parse --abbrev-ref HEAD");
}

function getCommitHash() {
  return git("rev-parse --short HEAD");
}

function getCommitsInRange(diffArgs) {
  // For ranges like main..HEAD, get individual commits
  // For HEAD~N, get last N commits
  try {
    const log = git(`log --format="%H" ${diffArgs} 2>/dev/null || echo ""`);
    return log.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

// Empty tree hash - parent of all root commits
const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

function getDiff(diffArgs) {
  // Handle --root flag (not valid for git diff, convert to empty tree diff)
  if (diffArgs.startsWith("--root ")) {
    const commitish = diffArgs.replace("--root ", "").trim();
    return git(`diff --no-color ${EMPTY_TREE} ${commitish}`);
  }
  return git(`diff --no-color ${diffArgs}`);
}

function getDiffNumstat(diffArgs) {
  if (diffArgs.startsWith("--root ")) {
    const commitish = diffArgs.replace("--root ", "").trim();
    return git(`diff --numstat ${EMPTY_TREE} ${commitish}`);
  }
  return git(`diff --numstat ${diffArgs}`);
}

// ─────────────────────────────────────────────────────────────
// Prepare phase
// ─────────────────────────────────────────────────────────────

async function prepare(diffArgs = "HEAD~1") {
  console.error(`[prepare] Starting with diff args: ${diffArgs}`);
  
  const repoRoot = getRepoRoot();
  const branch = getBranch();
  const commit = getCommitHash();
  
  console.error(`[prepare] Repo: ${repoRoot}`);
  console.error(`[prepare] Branch: ${branch}, Commit: ${commit}`);
  
  // Get commits in range
  const commits = getCommitsInRange(diffArgs);
  console.error(`[prepare] Commits in range: ${commits.length}`);
  
  // Check cache
  const cached = await getCacheMany(repoRoot, commits);
  const cachedCommits = Array.from(cached.keys());
  const uncachedCommits = commits.filter(c => !cached.has(c));
  
  console.error(`[prepare] Cached: ${cachedCommits.length}, Uncached: ${uncachedCommits.length}`);
  
  // Get diff for uncached (or full diff if no commits found)
  let diff, diffForReview;
  if (uncachedCommits.length === 0 && cachedCommits.length > 0) {
    // All cached - just need diff for display
    diff = getDiff(diffArgs);
    diffForReview = null;
  } else if (uncachedCommits.length > 0 && cachedCommits.length > 0) {
    // Partial cache - get diff only for uncached
    diff = getDiff(diffArgs);
    // For simplicity, review the full diff but we'll merge with cached
    diffForReview = diff;
  } else {
    // No cache - full diff
    diff = getDiff(diffArgs);
    diffForReview = diff;
  }
  
  // Get stats
  const stats = getDiffStats(diff);
  console.error(`[prepare] Files: ${stats.files}, Additions: ${stats.additions}, Deletions: ${stats.deletions}`);
  console.error(`[prepare] Estimated tokens: ${stats.tokens}`);
  
  // Chunk if needed
  let chunks = [];
  let needsChunking = false;
  
  if (diffForReview) {
    const chunkResult = chunkDiff(diffForReview, MAX_TOKENS);
    chunks = chunkResult.chunks;
    needsChunking = chunkResult.stats.chunkCount > 1;
    
    if (needsChunking) {
      console.error(`[prepare] Large diff - chunked into ${chunks.length} parts`);
    }
  }
  
  // Build cached reviews data
  const cachedReviews = [];
  for (const [commitHash, data] of cached.entries()) {
    cachedReviews.push({
      commitHash,
      ...data
    });
  }
  
  // Prepare numstat for file metadata
  const numstat = getDiffNumstat(diffArgs);
  const fileStats = parseNumstat(numstat);
  
  // Save state for finalize phase
  const state = {
    diffArgs,
    repoRoot,
    branch,
    commit,
    commits,
    cachedCommits,
    uncachedCommits,
    cachedReviews,
    fullDiff: diff,
    fileStats,
    stats,
    chunks,
    needsChunking,
    createdAt: Date.now()
  };
  
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.error(`[prepare] State saved to ${STATE_FILE}`);
  
  // Output for agent
  const output = {
    status: uncachedCommits.length === 0 ? "all_cached" : "needs_review",
    branch,
    commit,
    repoRoot,
    stats: {
      files: stats.files,
      additions: stats.additions,
      deletions: stats.deletions,
      tokens: stats.tokens,
      cachedCommits: cachedCommits.length,
      uncachedCommits: uncachedCommits.length,
      chunks: chunks.length
    },
    // Only include chunks if review needed
    ...(uncachedCommits.length > 0 && {
      chunks: chunks.map((chunk, i) => ({
        index: i,
        tokens: estimateTokens(chunk),
        preview: chunk.slice(0, 200) + (chunk.length > 200 ? "..." : "")
      })),
      fullDiffForReview: diffForReview
    }),
    // Include cached summaries for context
    cachedSummaries: cachedReviews.map(r => ({
      commit: r.commitHash,
      summary: r.explanation?.summary || "(no summary)"
    }))
  };
  
  console.log(JSON.stringify(output, null, 2));
  return output;
}

function parseNumstat(numstat) {
  const files = {};
  for (const line of numstat.split("\n").filter(Boolean)) {
    const [add, del, path] = line.split("\t");
    files[path] = {
      additions: add === "-" ? 0 : parseInt(add, 10),
      deletions: del === "-" ? 0 : parseInt(del, 10)
    };
  }
  return files;
}

// ─────────────────────────────────────────────────────────────
// Finalize phase
// ─────────────────────────────────────────────────────────────

async function finalize(resultsPath) {
  console.error(`[finalize] Loading results from ${resultsPath}`);
  
  // Load state
  if (!existsSync(STATE_FILE)) {
    throw new Error("No state file found. Run 'prepare' first.");
  }
  const state = JSON.parse(readFileSync(STATE_FILE, "utf8"));
  
  // Load review results from agent
  let newReviews = [];
  if (resultsPath && existsSync(resultsPath)) {
    newReviews = JSON.parse(readFileSync(resultsPath, "utf8"));
    if (!Array.isArray(newReviews)) {
      newReviews = [newReviews];
    }
  }
  
  console.error(`[finalize] New reviews: ${newReviews.length}`);
  console.error(`[finalize] Cached reviews: ${state.cachedReviews.length}`);
  
  // Cache new reviews
  for (const review of newReviews) {
    if (review.commitHash) {
      await setCache(state.repoRoot, review.commitHash, review);
      console.error(`[finalize] Cached: ${review.commitHash.slice(0, 7)}`);
    }
  }
  
  // Merge all reviews
  const allReviews = [...state.cachedReviews, ...newReviews];
  
  // Build merged file list
  const fileMap = new Map();
  
  // First, add all files from diff
  const diffFiles = parseDiffFiles(state.fullDiff);
  for (const f of diffFiles) {
    const stats = state.fileStats[f.path] || { additions: f.additions, deletions: f.deletions };
    fileMap.set(f.path, {
      path: f.path,
      summary: "",
      additions: stats.additions,
      deletions: stats.deletions,
      comments: []
    });
  }
  
  // Merge in review data
  for (const review of allReviews) {
    // Add file summaries from explanation
    if (review.explanation?.fileOrder) {
      for (const f of review.explanation.fileOrder) {
        if (fileMap.has(f.filename)) {
          fileMap.get(f.filename).summary = f.fileSummary || "";
        }
      }
    }
    
    // Add comments from verified review
    if (review.verified?.confirmed) {
      for (const comment of review.verified.confirmed) {
        if (fileMap.has(comment.file)) {
          fileMap.get(comment.file).comments.push({
            startLine: comment.startLine || 1,
            endLine: comment.endLine || comment.startLine || 1,
            type: comment.type || "suggestion",
            text: comment.text || ""
          });
        }
      }
    }
    
    // Add new comments found in verification
    if (review.verified?.added) {
      for (const comment of review.verified.added) {
        if (fileMap.has(comment.file)) {
          fileMap.get(comment.file).comments.push({
            startLine: comment.startLine || 1,
            endLine: comment.endLine || comment.startLine || 1,
            type: comment.type || "suggestion",
            text: comment.text || ""
          });
        }
      }
    }
  }
  
  // Build summary from all reviews
  const summaries = allReviews
    .map(r => r.explanation?.summary)
    .filter(Boolean);
  const mergedSummary = summaries.length > 0 
    ? summaries.join(" | ") 
    : "Code review";
  
  // Count stats
  const allComments = Array.from(fileMap.values()).flatMap(f => f.comments);
  const commentStats = {
    bugs: allComments.filter(c => c.type === "bug").length,
    warnings: allComments.filter(c => c.type === "warning").length,
    suggestions: allComments.filter(c => c.type === "suggestion").length,
    good: allComments.filter(c => c.type === "good").length
  };
  
  // Build final review data - re-fetch branch in case worktree changed
  const reviewData = {
    branch: getBranch(),
    commit: getCommitHash(),
    summary: mergedSummary,
    patch: state.fullDiff,
    files: Array.from(fileMap.values()),
    stats: commentStats
  };
  
  // Write JSON
  const jsonPath = "/tmp/review.json";
  writeFileSync(jsonPath, JSON.stringify(reviewData, null, 2));
  console.error(`[finalize] Wrote ${jsonPath}`);
  
  // Render HTML
  const templatePath = join(__dirname, "template.html");
  const outPath = `/tmp/review-${Date.now()}.html`;
  
  const renderScript = join(__dirname, "render.mjs");
  execSync(`node "${renderScript}" --template "${templatePath}" --data "${jsonPath}" --out "${outPath}"`, {
    encoding: "utf8"
  });
  
  console.error(`[finalize] Rendered ${outPath}`);
  
  // Open in browser
  try {
    execSync(`open "${outPath}"`, { encoding: "utf8" });
    console.error(`[finalize] Opened in browser`);
  } catch {
    console.error(`[finalize] Could not open browser, file at: ${outPath}`);
  }
  
  // Output
  const output = {
    status: "complete",
    htmlPath: outPath,
    jsonPath,
    stats: {
      files: fileMap.size,
      comments: allComments.length,
      ...commentStats
    }
  };
  
  console.log(JSON.stringify(output, null, 2));
  return output;
}

// ─────────────────────────────────────────────────────────────
// Status command
// ─────────────────────────────────────────────────────────────

async function status() {
  const cacheStats = await getCacheStats();
  
  let stateInfo = null;
  if (existsSync(STATE_FILE)) {
    const state = JSON.parse(readFileSync(STATE_FILE, "utf8"));
    stateInfo = {
      diffArgs: state.diffArgs,
      createdAt: new Date(state.createdAt).toISOString(),
      commits: state.commits.length,
      cached: state.cachedCommits.length,
      uncached: state.uncachedCommits.length
    };
  }
  
  const output = {
    cache: {
      entries: cacheStats.entries,
      sizeKB: Math.round(cacheStats.sizeBytes / 1024),
      oldestDays: Math.round(cacheStats.oldestMs / (24 * 60 * 60 * 1000))
    },
    pendingState: stateInfo
  };
  
  console.log(JSON.stringify(output, null, 2));
  return output;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

const [,, command, ...args] = process.argv;

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

try {
  switch (command) {
    case "prepare": {
      const diffArgs = getArg("--diff-args") || args[0] || "HEAD~1";
      await prepare(diffArgs);
      break;
    }
    
    case "finalize": {
      const resultsPath = getArg("--results") || args[0];
      if (!resultsPath) {
        console.error("Usage: runner.mjs finalize --results /path/to/results.json");
        process.exit(1);
      }
      await finalize(resultsPath);
      break;
    }
    
    case "status": {
      await status();
      break;
    }
    
    case "clear-cache": {
      await clearCache();
      console.log(JSON.stringify({ status: "cleared" }));
      break;
    }
    
    default: {
      console.error(`
Review Export Orchestrator

Commands:
  prepare [--diff-args "main..HEAD"]   Gather data, check cache, prepare chunks
  finalize --results /path/to.json     Cache results, merge, render HTML
  status                               Show cache stats and pending state
  clear-cache                          Clear all cached reviews

Examples:
  node runner.mjs prepare HEAD~1
  node runner.mjs prepare --diff-args "main..HEAD"
  node runner.mjs finalize --results /tmp/review-results.json
  node runner.mjs status
`);
      process.exit(1);
    }
  }
} catch (e) {
  console.error(`[error] ${e.message}`);
  process.exit(1);
}
