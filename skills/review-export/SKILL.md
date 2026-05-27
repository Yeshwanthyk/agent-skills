---
name: review-export
description: Generate shareable HTML code review documents from git diffs.
---

# Review Export

Renders code reviews as standalone HTML with inline diff comments.

## Usage

```bash
# Prepare: takes a GIT DIFF SPEC (not prose!)
# Valid: HEAD~1, HEAD~3, main..HEAD, abc123..def456, --staged
node {baseDir}/runner.mjs prepare "main..HEAD"

# Finalize: cache results, render HTML, open browser
node {baseDir}/runner.mjs finalize --results /tmp/review-results.json

# Utils
node {baseDir}/runner.mjs status
node {baseDir}/runner.mjs clear-cache
```

**⚠️ The prepare argument is a git diff spec, NOT a description. Pass commit ranges directly.**

## Prepare Output

```json
{
  "status": "needs_review",
  "branch": "main",
  "commit": "abc123",
  "stats": { "files": 10, "tokens": 25000, "cachedCommits": 3, "uncachedCommits": 2, "chunks": 1 },
  "chunks": [{ "index": 0, "tokens": 25000 }],
  "fullDiffForReview": "diff --git ..."
}
```

## Results JSON (input to finalize)

```json
[{
  "commitHash": "abc123",
  "explanation": {
    "summary": "Added OAuth support",
    "fileOrder": [{ "filename": "src/auth.ts", "fileSummary": "OAuth flow" }]
  },
  "verified": {
    "confirmed": [{ "file": "src/auth.ts", "startLine": 42, "type": "bug", "text": "SQL injection" }],
    "dismissed": [],
    "added": []
  }
}]
```

## REVIEW_DATA Schema (embedded in HTML)

```typescript
{
  branch: string,
  commit: string,
  summary: string,
  patch: string,
  files: [{
    path: string,
    summary: string,
    additions: number,
    deletions: number,
    comments: [{ startLine: number, endLine: number, type: 'bug'|'warning'|'suggestion'|'good', text: string }]
  }],
  stats: { bugs: number, warnings: number, suggestions: number, good: number }
}
```

## Template Variables

| Placeholder | Value |
|-------------|-------|
| `{{BRANCH}}` | Git branch |
| `{{COMMIT}}` | Short commit hash |
| `{{SUMMARY}}` | Review summary |
| `{{BUG_COUNT}}` / `{{WARNING_COUNT}}` / `{{SUGGESTION_COUNT}}` / `{{GOOD_COUNT}}` | Counts |
| `{{REVIEW_DATA_B64}}` | Base64-encoded JSON |

## Notes

- **Cache:** `~/.cache/gitgud/review-export/` - 7 day TTL, 100 entry LRU
- **Chunking:** Large diffs auto-split at 50k tokens (~200KB)
- **Template:** `{baseDir}/template.html`
