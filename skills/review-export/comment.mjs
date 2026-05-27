#!/usr/bin/env node
/**
 * Comment management for review-export
 * 
 * Usage:
 *   node comment.mjs extract <review.html>                     # Extract all comments from HTML
 *   node comment.mjs context <comment-id> <comments.json>      # Get file context for scouts
 *   node comment.mjs reply <comment-id> <comments.json> "text" # Add reply to comment
 *   node comment.mjs add <comments.json> <file:line> "text"    # Add new comment
 *   node comment.mjs resolve <file:line> <comments.json>       # Mark comment as resolved
 *   node comment.mjs render <review.html> <comments.json>      # Re-render with comments
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function loadComments(path) {
  if (!existsSync(path)) throw new Error(`Comments file not found: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function saveComments(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

function findComment(comments, id) {
  const comment = comments.comments.find(c => c.id === id || c.id.startsWith(id));
  if (!comment) throw new Error(`Comment not found: ${id}`);
  return comment;
}

function extractReviewData(htmlPath) {
  const html = readFileSync(htmlPath, "utf8");
  const match = html.match(/const b64 = '([^']+)'/);
  if (!match) throw new Error("No REVIEW_DATA_B64 found in HTML");
  return JSON.parse(Buffer.from(match[1], "base64").toString("utf8"));
}

function stableId(file, line, type, text) {
  return `${file}:${line}:${type}:${(text || '').slice(0, 50)}`;
}

// ─────────────────────────────────────────────────────────────
// Commands
// ─────────────────────────────────────────────────────────────

function extract(htmlPath) {
  const data = extractReviewData(htmlPath);
  
  // Gather all comments from all files
  const allComments = [];
  for (const file of data.files || []) {
    for (const c of file.comments || []) {
      allComments.push({
        id: stableId(file.path, c.startLine, c.type, c.text),
        file: file.path,
        line: c.startLine,
        endLine: c.endLine,
        type: c.type,
        text: c.text,
        suggestedFix: c.suggestedFix,
        userComment: c.userComment || false,
        replies: c.replies || []
      });
    }
  }
  
  const output = {
    commit: data.commit,
    branch: data.branch,
    summary: data.summary,
    stats: data.stats,
    comments: allComments
  };
  
  console.log(JSON.stringify(output, null, 2));
}

function context(commentId, commentsPath) {
  const data = loadComments(commentsPath);
  const comment = findComment(data, commentId);
  
  const file = comment.file;
  const line = comment.line;
  const contextLines = 25;
  
  // Read file content around the line
  let fileContent = "";
  try {
    fileContent = readFileSync(file, "utf8");
  } catch {
    // Try relative to cwd
    try {
      fileContent = readFileSync(join(process.cwd(), file), "utf8");
    } catch {
      console.error(`Could not read file: ${file}`);
      fileContent = "";
    }
  }
  
  const lines = fileContent.split("\n");
  const start = Math.max(0, line - contextLines);
  const end = Math.min(lines.length, line + contextLines);
  
  const snippet = lines
    .slice(start, end)
    .map((l, i) => {
      const lineNum = start + i + 1;
      const marker = lineNum === line ? ">>>" : "   ";
      return `${marker} ${lineNum.toString().padStart(4)}: ${l}`;
    })
    .join("\n");
  
  const output = {
    comment: {
      id: comment.id,
      file: comment.file,
      line: comment.line,
      text: comment.text,
      type: comment.type
    },
    context: {
      file,
      startLine: start + 1,
      endLine: end,
      snippet
    }
  };
  
  console.log(JSON.stringify(output, null, 2));
}

function reply(commentId, commentsPath, text) {
  const data = loadComments(commentsPath);
  const comment = findComment(data, commentId);
  
  if (!comment.replies) comment.replies = [];
  
  const replyObj = {
    id: randomUUID(),
    createdAt: Date.now(),
    author: "ai",
    text
  };
  
  comment.replies.push(replyObj);
  saveComments(commentsPath, data);
  
  console.log(JSON.stringify({ status: "ok", replyId: replyObj.id }));
}

function add(commentsPath, fileLine, text, type = "explanation") {
  const [file, lineStr] = fileLine.split(":");
  const line = parseInt(lineStr, 10);
  
  if (!file || isNaN(line)) {
    throw new Error("Invalid file:line format. Use: src/foo.ts:42");
  }
  
  const data = loadComments(commentsPath);
  
  const newComment = {
    id: randomUUID(),
    createdAt: Date.now(),
    author: "ai",
    file,
    line,
    type,
    text
  };
  
  data.comments.push(newComment);
  saveComments(commentsPath, data);
  
  console.log(JSON.stringify({ status: "ok", commentId: newComment.id }));
}

function resolve(target, commentsPath) {
  const data = loadComments(commentsPath);
  
  // Initialize resolved array if not present
  if (!data.resolved) data.resolved = [];
  
  let resolvedIds = [];
  
  // Check if target looks like file:line format (contains : followed by a number)
  const fileLineMatch = target.match(/^(.+):(\d+)$/);
  
  if (fileLineMatch) {
    const [, file, lineStr] = fileLineMatch;
    const line = parseInt(lineStr, 10);
    
    // Resolve all comments at this file:line
    // Check user comments first
    for (const c of data.comments || []) {
      if (c.file === file && c.line === line) {
        const id = stableId(c.file, c.line, c.type || 'comment', c.text);
        if (!data.resolved.includes(id)) {
          data.resolved.push(id);
          resolvedIds.push(id);
        }
      }
    }
    
    // Add a wildcard match for any type at this location
    // This catches original review comments we haven't seen
    const wildcardId = `${file}:${line}:`;
    if (!data.resolved.includes(wildcardId)) {
      data.resolved.push(wildcardId);
      resolvedIds.push(wildcardId);
    }
  } else {
    // Target is a comment ID - find it
    const comment = findComment(data, target);
    const id = stableId(comment.file, comment.line, comment.type || 'comment', comment.text);
    
    if (!data.resolved.includes(id)) {
      data.resolved.push(id);
      resolvedIds.push(id);
    }
  }
  
  saveComments(commentsPath, data);
  console.log(JSON.stringify({ status: "ok", resolved: resolvedIds }));
}

function render(htmlPath, commentsPath) {
  // Extract original review data from HTML
  const reviewData = extractReviewData(htmlPath);
  const commentsData = loadComments(commentsPath);
  
  // Merge user comments into review data
  for (const comment of commentsData.comments) {
    const file = reviewData.files.find(f => f.path === comment.file);
    if (file) {
      // Add as a comment with replies
      const existing = file.comments.find(c => 
        c.startLine === comment.line && c.text === comment.text
      );
      
      if (existing) {
        // Merge replies into existing
        existing.replies = comment.replies || [];
        existing.userComment = true;
      } else {
        // Add new comment
        file.comments.push({
          startLine: comment.line,
          endLine: comment.line,
          type: comment.type === "new" ? "question" : comment.type,
          text: comment.text,
          replies: comment.replies || [],
          userComment: true,
          id: comment.id
        });
      }
    }
  }
  
  // Mark resolved comments - check both exact matches and wildcard (file:line:) matches
  const resolvedSet = new Set(commentsData.resolved || []);
  for (const file of reviewData.files) {
    for (const c of file.comments) {
      const exactId = stableId(file.path, c.startLine, c.type, c.text);
      const wildcardPrefix = `${file.path}:${c.startLine}:`;
      
      if (resolvedSet.has(exactId) || [...resolvedSet].some(r => r === wildcardPrefix || exactId.startsWith(r))) {
        c.resolved = true;
      }
    }
  }
  
  // Pass resolved state to template
  reviewData.resolved = commentsData.resolved || [];
  
  // Re-render HTML
  const jsonPath = "/tmp/review-updated.json";
  writeFileSync(jsonPath, JSON.stringify(reviewData, null, 2));
  
  const templatePath = join(__dirname, "template.html");
  const outPath = htmlPath.replace(".html", "-updated.html");
  
  const renderScript = join(__dirname, "render.mjs");
  execSync(`node "${renderScript}" --template "${templatePath}" --data "${jsonPath}" --out "${outPath}"`, {
    encoding: "utf8"
  });
  
  console.log(JSON.stringify({ status: "ok", htmlPath: outPath }));
  
  // Open in browser
  try {
    execSync(`open "${outPath}"`);
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

const [,, command, ...args] = process.argv;

try {
  switch (command) {
    case "extract": {
      const [htmlPath] = args;
      if (!htmlPath) {
        console.error("Usage: comment.mjs extract <review.html>");
        process.exit(1);
      }
      extract(htmlPath);
      break;
    }
    
    case "context": {
      const [commentId, commentsPath] = args;
      if (!commentId || !commentsPath) {
        console.error("Usage: comment.mjs context <comment-id> <comments.json>");
        process.exit(1);
      }
      context(commentId, commentsPath);
      break;
    }
    
    case "reply": {
      const [commentId, commentsPath, ...textParts] = args;
      const text = textParts.join(" ");
      if (!commentId || !commentsPath || !text) {
        console.error('Usage: comment.mjs reply <comment-id> <comments.json> "reply text"');
        process.exit(1);
      }
      reply(commentId, commentsPath, text);
      break;
    }
    
    case "add": {
      const [commentsPath, fileLine, ...textParts] = args;
      const text = textParts.join(" ");
      if (!commentsPath || !fileLine || !text) {
        console.error('Usage: comment.mjs add <comments.json> <file:line> "comment text"');
        process.exit(1);
      }
      add(commentsPath, fileLine, text);
      break;
    }
    
    case "resolve": {
      const [target, commentsPath] = args;
      if (!target || !commentsPath) {
        console.error("Usage: comment.mjs resolve <file:line> <comments.json>");
        process.exit(1);
      }
      resolve(target, commentsPath);
      break;
    }
    
    case "render": {
      const [htmlPath, commentsPath] = args;
      if (!htmlPath || !commentsPath) {
        console.error("Usage: comment.mjs render <review.html> <comments.json>");
        process.exit(1);
      }
      render(htmlPath, commentsPath);
      break;
    }
    
    default: {
      console.error(`
Comment management for review-export

Commands:
  extract <review.html>                         Extract all comments from HTML as JSON
  context <comment-id> <comments.json>          Get file context for scouts
  reply <comment-id> <comments.json> "text"     Add reply to existing comment
  add <comments.json> <file:line> "text"        Add new comment at file:line
  resolve <file:line> <comments.json>           Mark all comments at file:line as resolved
  render <review.html> <comments.json>          Re-render HTML with comments

Examples:
  node comment.mjs extract /tmp/review-xxx.html
  node comment.mjs context 51b5b8f4 ~/Downloads/comments.json
  node comment.mjs reply 51b5b8f4 ~/Downloads/comments.json "The function does X because Y"
  node comment.mjs add ~/Downloads/comments.json src/auth.ts:42 "This validates tokens"
  node comment.mjs resolve src/auth.ts:42 ~/Downloads/comments.json
  node comment.mjs render /tmp/review-xxx.html ~/Downloads/comments.json
`);
      process.exit(1);
    }
  }
} catch (e) {
  console.error(`[error] ${e.message}`);
  process.exit(1);
}
