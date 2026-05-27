/**
 * Review cache - file-based LRU cache for commit reviews
 * 
 * Cache location: ~/.cache/gitgud/review-export/
 * 
 * Usage:
 *   import { getCache, setCache, clearCache } from './cache.mjs'
 *   
 *   const cached = await getCache(repoPath, commitHash)
 *   if (!cached) {
 *     const review = await runPipeline(...)
 *     await setCache(repoPath, commitHash, review)
 *   }
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rm, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const CACHE_DIR = join(homedir(), ".cache", "gitgud", "review-export");
const INDEX_FILE = join(CACHE_DIR, "index.json");
const MAX_ENTRIES = 100;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash repo path to create a short, filesystem-safe directory name
 */
function hashRepoPath(repoPath) {
  return createHash("sha256").update(repoPath).digest("hex").slice(0, 12);
}

/**
 * Get path to cache file for a specific commit
 */
function getCachePath(repoPath, commitHash) {
  const repoHash = hashRepoPath(repoPath);
  return join(CACHE_DIR, repoHash, `${commitHash}.json`);
}

/**
 * Load the LRU index
 */
async function loadIndex() {
  try {
    const data = await readFile(INDEX_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return { entries: [] };
  }
}

/**
 * Save the LRU index
 */
async function saveIndex(index) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
}

/**
 * Get cached review for a commit
 * @param {string} repoPath - Absolute path to repo root
 * @param {string} commitHash - Git commit hash (short or full)
 * @returns {Promise<object|null>} Cached review data or null
 */
export async function getCache(repoPath, commitHash) {
  const cachePath = getCachePath(repoPath, commitHash);
  
  try {
    const data = await readFile(cachePath, "utf8");
    const cached = JSON.parse(data);
    
    // Check TTL
    if (Date.now() - cached.timestamp > TTL_MS) {
      await rm(cachePath, { force: true });
      return null;
    }
    
    // Update LRU access time
    const index = await loadIndex();
    const key = `${hashRepoPath(repoPath)}/${commitHash}`;
    index.entries = index.entries.filter(e => e.key !== key);
    index.entries.unshift({ key, accessedAt: Date.now() });
    await saveIndex(index);
    
    return cached;
  } catch {
    return null;
  }
}

/**
 * Cache a review result
 * @param {string} repoPath - Absolute path to repo root
 * @param {string} commitHash - Git commit hash
 * @param {object} data - Review data to cache
 */
export async function setCache(repoPath, commitHash, data) {
  const repoHash = hashRepoPath(repoPath);
  const cacheDir = join(CACHE_DIR, repoHash);
  const cachePath = getCachePath(repoPath, commitHash);
  
  await mkdir(cacheDir, { recursive: true });
  
  const entry = {
    commitHash,
    repoPath,
    timestamp: Date.now(),
    ...data
  };
  
  await writeFile(cachePath, JSON.stringify(entry, null, 2));
  
  // Update LRU index
  const index = await loadIndex();
  const key = `${repoHash}/${commitHash}`;
  index.entries = index.entries.filter(e => e.key !== key);
  index.entries.unshift({ key, accessedAt: Date.now() });
  
  // Evict old entries if over limit
  while (index.entries.length > MAX_ENTRIES) {
    const evicted = index.entries.pop();
    if (evicted) {
      const [repoH, commit] = evicted.key.split("/");
      const evictPath = join(CACHE_DIR, repoH, `${commit}.json`);
      await rm(evictPath, { force: true });
    }
  }
  
  await saveIndex(index);
}

/**
 * Check if a commit is cached (without loading full data)
 * @param {string} repoPath 
 * @param {string} commitHash 
 * @returns {Promise<boolean>}
 */
export async function hasCache(repoPath, commitHash) {
  const cachePath = getCachePath(repoPath, commitHash);
  try {
    const s = await stat(cachePath);
    return s.isFile();
  } catch {
    return false;
  }
}

/**
 * Get multiple cached commits at once
 * @param {string} repoPath 
 * @param {string[]} commitHashes 
 * @returns {Promise<Map<string, object>>} Map of commitHash -> cached data
 */
export async function getCacheMany(repoPath, commitHashes) {
  const results = new Map();
  await Promise.all(
    commitHashes.map(async (hash) => {
      const cached = await getCache(repoPath, hash);
      if (cached) results.set(hash, cached);
    })
  );
  return results;
}

/**
 * Clear all cached reviews
 */
export async function clearCache() {
  await rm(CACHE_DIR, { recursive: true, force: true });
}

/**
 * Get cache statistics
 * @returns {Promise<{entries: number, size: number, oldestMs: number}>}
 */
export async function getCacheStats() {
  try {
    const index = await loadIndex();
    let totalSize = 0;
    let oldest = Date.now();
    
    for (const entry of index.entries) {
      const [repoHash, commit] = entry.key.split("/");
      const cachePath = join(CACHE_DIR, repoHash, `${commit}.json`);
      try {
        const s = await stat(cachePath);
        totalSize += s.size;
        if (entry.accessedAt < oldest) oldest = entry.accessedAt;
      } catch {}
    }
    
    return {
      entries: index.entries.length,
      sizeBytes: totalSize,
      oldestMs: Date.now() - oldest
    };
  } catch {
    return { entries: 0, sizeBytes: 0, oldestMs: 0 };
  }
}
