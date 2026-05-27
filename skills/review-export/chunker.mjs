/**
 * Diff chunking - split large diffs to stay under model context limits
 * 
 * Usage:
 *   import { estimateTokens, chunkDiff, parseDiffFiles } from './chunker.mjs'
 *   
 *   const tokens = estimateTokens(diffText)
 *   if (tokens > MAX_TOKENS) {
 *     const chunks = chunkDiff(diffText, MAX_TOKENS)
 *     // Process each chunk separately
 *   }
 */

const MAX_TOKENS = 50_000;
const CHARS_PER_TOKEN = 4; // Conservative estimate for code

/**
 * Estimate token count for text
 * Uses ~4 chars/token heuristic (conservative for code)
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Format token count for display
 * @param {number} tokens
 * @returns {string}
 */
export function formatTokens(tokens) {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}k`;
  return tokens.toString();
}

/**
 * Parse unified diff into per-file sections
 * @param {string} diff - Unified diff output (git diff --no-color)
 * @returns {Array<{path: string, patch: string, additions: number, deletions: number}>}
 */
export function parseDiffFiles(diff) {
  const files = [];
  const lines = diff.split("\n");
  let currentFile = null;
  let currentPatch = [];
  let additions = 0;
  let deletions = 0;
  
  for (const line of lines) {
    // New file starts with "diff --git"
    if (line.startsWith("diff --git ")) {
      // Save previous file
      if (currentFile) {
        files.push({
          path: currentFile,
          patch: currentPatch.join("\n"),
          additions,
          deletions
        });
      }
      
      // Extract path from "diff --git a/path b/path"
      const match = line.match(/diff --git a\/(.*) b\/(.*)/);
      currentFile = match ? match[2] : null;
      currentPatch = [line];
      additions = 0;
      deletions = 0;
    } else if (currentFile) {
      currentPatch.push(line);
      if (line.startsWith("+") && !line.startsWith("+++")) additions++;
      if (line.startsWith("-") && !line.startsWith("---")) deletions++;
    }
  }
  
  // Don't forget last file
  if (currentFile) {
    files.push({
      path: currentFile,
      patch: currentPatch.join("\n"),
      additions,
      deletions
    });
  }
  
  return files;
}

/**
 * Chunk files into groups that fit under token limit
 * @param {Array<{path: string, patch: string}>} files - Parsed diff files
 * @param {number} maxTokens - Max tokens per chunk
 * @returns {Array<Array<{path: string, patch: string}>>} - Chunked file groups
 */
export function chunkFiles(files, maxTokens = MAX_TOKENS) {
  const chunks = [];
  let currentChunk = [];
  let currentTokens = 0;
  
  // Sort by size (smaller first) to pack efficiently
  const sorted = [...files].sort((a, b) => a.patch.length - b.patch.length);
  
  for (const file of sorted) {
    const fileTokens = estimateTokens(file.patch);
    
    // If single file exceeds limit, it gets its own chunk (will be truncated later)
    if (fileTokens > maxTokens) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentTokens = 0;
      }
      chunks.push([file]);
      continue;
    }
    
    // If adding this file exceeds limit, start new chunk
    if (currentTokens + fileTokens > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentTokens = 0;
    }
    
    currentChunk.push(file);
    currentTokens += fileTokens;
  }
  
  // Don't forget last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Chunk a diff string into processable pieces
 * @param {string} diff - Full unified diff
 * @param {number} maxTokens - Max tokens per chunk
 * @returns {{chunks: string[], stats: {totalFiles: number, totalTokens: number, chunkCount: number}}}
 */
export function chunkDiff(diff, maxTokens = MAX_TOKENS) {
  const files = parseDiffFiles(diff);
  const totalTokens = estimateTokens(diff);
  
  // If under limit, return single chunk
  if (totalTokens <= maxTokens) {
    return {
      chunks: [diff],
      stats: {
        totalFiles: files.length,
        totalTokens,
        chunkCount: 1
      }
    };
  }
  
  // Chunk by files
  const fileChunks = chunkFiles(files, maxTokens);
  const chunks = fileChunks.map(chunk => 
    chunk.map(f => f.patch).join("\n\n")
  );
  
  return {
    chunks,
    stats: {
      totalFiles: files.length,
      totalTokens,
      chunkCount: chunks.length
    }
  };
}

/**
 * Truncate a single large file diff to fit within token limit
 * Keeps header and tries to preserve context around changes
 * @param {string} patch - Single file patch
 * @param {number} maxTokens
 * @returns {string}
 */
export function truncatePatch(patch, maxTokens = MAX_TOKENS) {
  const tokens = estimateTokens(patch);
  if (tokens <= maxTokens) return patch;
  
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const lines = patch.split("\n");
  
  // Always keep header (first 4 lines typically)
  const header = lines.slice(0, 4).join("\n");
  const headerLen = header.length;
  const remaining = maxChars - headerLen - 100; // Reserve for truncation notice
  
  // Keep as much of the diff as possible
  let body = "";
  for (let i = 4; i < lines.length; i++) {
    if (body.length + lines[i].length + 1 > remaining) break;
    body += lines[i] + "\n";
  }
  
  const truncatedLines = lines.length - body.split("\n").length;
  return `${header}\n${body}\n... (${truncatedLines} lines truncated, file too large)`;
}

/**
 * Check if diff is within acceptable limits
 * @param {string} diff
 * @param {number} maxTokens
 * @returns {{ok: boolean, tokens: number, message?: string}}
 */
export function checkDiffSize(diff, maxTokens = MAX_TOKENS) {
  const tokens = estimateTokens(diff);
  
  if (tokens <= maxTokens) {
    return { ok: true, tokens };
  }
  
  const files = parseDiffFiles(diff);
  return {
    ok: false,
    tokens,
    files: files.length,
    message: `Diff is ~${formatTokens(tokens)} tokens (${files.length} files). Will be chunked into multiple reviews.`
  };
}

/**
 * Get summary of diff for logging/display
 * @param {string} diff
 * @returns {{files: number, additions: number, deletions: number, tokens: number}}
 */
export function getDiffStats(diff) {
  const files = parseDiffFiles(diff);
  return {
    files: files.length,
    additions: files.reduce((sum, f) => sum + f.additions, 0),
    deletions: files.reduce((sum, f) => sum + f.deletions, 0),
    tokens: estimateTokens(diff)
  };
}
