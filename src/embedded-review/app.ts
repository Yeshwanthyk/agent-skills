import MarkdownIt from "markdown-it";
import {
  FileDiff,
  codeToHtml,
  processPatch,
  type DiffLineAnnotation,
  type FileDiffMetadata,
  type SelectedLineRange,
} from "@pierre/diffs";

import {
  DRAFT_VERSION,
  MAX_COMMENT_LENGTH,
  MAX_DIFF_SELECTION_LINES,
  MAX_TEXT_SELECTION_LENGTH,
  formatFeedback,
  formatLineRange,
  lineExcerpt,
  normalizeComment,
  parseDraft,
  summarizeAnchor,
  type DiffAnchor,
  type DiffSide,
  type ReviewAnchor,
  type ReviewAnnotation,
  type ReviewSession,
  type TextAnchor,
} from "./core";
import "./app.css";

type ReviewDiffStyle = "unified" | "split";
type ReviewCodeFontSize = 14 | 15 | 16 | 18;

interface ReviewPreferences {
  version: 1;
  diffStyle: ReviewDiffStyle;
  codeFontSize: ReviewCodeFontSize;
}

const DEFAULT_REVIEW_PREFERENCES: ReviewPreferences = {
  version: 1,
  diffStyle: "unified",
  codeFontSize: 15,
};
const CODE_FONT_SIZES = new Set<ReviewCodeFontSize>([14, 15, 16, 18]);
const SESSION_POLL_INTERVAL_MS = 5_000;

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, index, options, _env, renderer) => renderer.renderToken(tokens, index, options));
md.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
  const token = tokens[index];
  const href = token.attrGet("href") ?? "";
  token.attrSet("href", "#");
  token.attrSet("data-review-href", href);
  token.attrSet("title", href ? `Link disabled in local review: ${href}` : "Link disabled in local review");
  return defaultLinkOpen(tokens, index, options, env, renderer);
};
md.renderer.rules.image = (tokens, index) => {
  const token = tokens[index];
  const alt = md.utils.escapeHtml(token.content || "Image");
  const source = md.utils.escapeHtml(token.attrGet("src") || "");
  return `<span class="blocked-image" role="note">Image not loaded: ${alt}${source ? ` · ${source}` : ""}</span>`;
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Review workspace root is missing.");

app.innerHTML = `
  <a class="skip-link" href="#review-reader">Skip to reviewed content</a>
  <header class="command-bar">
    <div class="title-group">
      <h1 id="review-title">Review</h1>
      <span class="title-separator" aria-hidden="true">/</span>
      <p id="source-label">Loading source…</p>
    </div>
    <div class="command-actions">
      <button class="button button-quiet" id="close-review" type="button">Close</button>
      <button class="button button-primary" id="copy-feedback" type="button" disabled>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"/></svg>
        Copy feedback
      </button>
      <span class="command-divider" aria-hidden="true"></span>
      <button class="icon-button comments-toggle" id="comments-toggle" type="button" aria-controls="annotation-rail" aria-expanded="false" aria-label="Toggle annotations" title="Toggle annotations">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8-4-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3l-4 4Z"/></svg>
        <span class="annotation-count" id="annotation-count" aria-live="polite">0</span>
      </button>
      <button class="icon-button" id="shortcut-help" type="button" aria-label="Show keyboard shortcuts" title="Keyboard shortcuts (?)">?</button>
    </div>
  </header>
  <main class="workspace" id="workspace" aria-busy="true">
    <nav class="source-nav" id="source-nav" aria-label="Review navigation" hidden>
      <div class="source-nav-header">
        <span id="source-nav-title">Contents</span>
        <span id="file-count">0</span>
      </div>
      <div class="file-list" id="file-list"></div>
    </nav>
    <section class="reader-pane" aria-label="Reviewed content">
      <div class="reader-toolbar">
        <div class="annotation-toolstrip" id="annotation-toolstrip">
          <div class="tool-group" aria-label="Annotation method">
            <span class="tool-label">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1M9 6v12"/></svg>
              Select text
            </span>
          </div>
          <div class="tool-group">
            <button class="tool-button is-active" id="toolbar-comment" type="button" aria-label="Annotate current target" title="Annotate current target (a)">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8-4-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3l-4 4Z"/></svg>
              Comment
            </button>
          </div>
          <button class="tool-help" id="tool-help" type="button">how does this work?</button>
        </div>
        <div class="reader-location" id="reader-location">Preparing review…</div>
        <select class="file-select" id="file-select" aria-label="Reviewed file"></select>
        <div class="reader-actions">
          <div class="display-controls" aria-label="Reading display">
            <div class="diff-layout-control" id="diff-layout-control" role="group" aria-label="Diff layout">
              <button class="display-option" id="diff-unified" type="button" aria-pressed="true" title="Unified diff (saved on this computer)">Unified</button>
              <button class="display-option" id="diff-split" type="button" aria-pressed="false" title="Split diff (saved on this computer)">Split</button>
            </div>
            <label class="code-size-control" title="Code font size (saved on this computer)">
              <span>Code</span>
              <select id="code-size" aria-label="Code font size">
                <option value="14">14 px</option>
                <option value="15" selected>15 px</option>
                <option value="16">16 px</option>
                <option value="18">18 px</option>
              </select>
            </label>
          </div>
          <span class="reader-hint" id="reader-hint">Select text to comment</span>
          <button class="reader-action" id="copy-source" type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"/></svg>
            <span>Copy response</span>
          </button>
        </div>
      </div>
      <div class="reader-scroll" id="review-reader" tabindex="0">
        <div class="reader-loading" id="reader-loading" role="status">
          <span class="loading-line loading-line-wide"></span>
          <span class="loading-line"></span>
          <span class="loading-line loading-line-short"></span>
        </div>
        <article class="markdown-content" id="markdown-content" hidden></article>
        <div class="diff-content" id="diff-content" hidden></div>
        <div class="reader-empty" id="reader-empty" hidden>
          <h2>Nothing to review</h2>
          <p>The selected source did not contain reviewable content.</p>
        </div>
      </div>
      <form class="composer" id="composer" hidden>
        <div class="composer-heading">
          <p id="composer-anchor"></p>
          <div class="composer-heading-actions">
            <span class="eyebrow" id="composer-mode">New comment</span>
            <button class="icon-button" id="cancel-comment" type="button" aria-label="Close comment composer">×</button>
          </div>
        </div>
        <label class="sr-only" for="comment-input">Comment</label>
        <textarea id="comment-input" rows="5" maxlength="${MAX_COMMENT_LENGTH}" spellcheck="true" placeholder="Add a comment…"></textarea>
        <div class="composer-footer">
          <span><kbd>⌘</kbd><kbd>Enter</kbd> to add</span>
          <button class="button button-primary" id="save-comment" type="submit">Add Comment</button>
        </div>
      </form>
    </section>
    <aside class="annotation-rail" id="annotation-rail" aria-label="Annotations">
      <div class="rail-header">
        <div class="rail-title">
          <h2>Annotations</h2>
          <span class="rail-count" id="rail-count">0</span>
        </div>
        <button class="icon-button rail-close" id="rail-close" type="button" aria-label="Close annotations">×</button>
      </div>
      <div class="annotation-list" id="annotation-list"></div>
      <div class="rail-footer" id="rail-footer" hidden>
        <button class="rail-copy" id="rail-copy" type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"/></svg>
          Copy feedback
        </button>
      </div>
    </aside>
  </main>
  <div class="status-toast" id="status-toast" role="status" aria-live="polite" hidden></div>
  <div class="undo-toast" id="undo-toast" role="status" hidden>
    <span>Comment deleted</span>
    <button type="button" id="undo-delete">Undo</button>
  </div>
  <dialog class="shortcut-dialog" id="shortcut-dialog">
    <form method="dialog">
      <div class="dialog-heading">
        <div>
          <span class="eyebrow">Keyboard</span>
          <h2>Review without leaving the keys</h2>
        </div>
        <button class="icon-button" value="close" aria-label="Close keyboard shortcuts">×</button>
      </div>
      <dl class="shortcut-grid">
        <div><dt><kbd>j</kbd> / <kbd>k</kbd></dt><dd>Move through blocks or changed lines</dd></div>
        <div><dt><kbd>⇧j</kbd> / <kbd>⇧k</kbd></dt><dd>Extend a diff line selection</dd></div>
        <div><dt><kbd>g g</kbd> / <kbd>G</kbd></dt><dd>Jump to first or last review target</dd></div>
        <div><dt><kbd>h</kbd> / <kbd>l</kbd></dt><dd>Previous or next file</dd></div>
        <div><dt><kbd>a</kbd></dt><dd>Annotate the current selection or target</dd></div>
        <div><dt><kbd>n</kbd> / <kbd>N</kbd></dt><dd>Next or previous comment</dd></div>
        <div><dt><kbd>e</kbd> / <kbd>d</kbd></dt><dd>Edit or delete the selected comment</dd></div>
        <div><dt><kbd>y</kbd></dt><dd>Copy all feedback</dd></div>
        <div><dt><kbd>Esc</kbd></dt><dd>Close the active transient surface</dd></div>
      </dl>
      <button class="button button-primary dialog-done" value="close">Return to review</button>
    </form>
  </dialog>
  <dialog class="manual-copy-dialog" id="manual-copy-dialog">
    <form method="dialog">
      <div class="dialog-heading">
        <div>
          <span class="eyebrow">Clipboard unavailable</span>
          <h2>Copy the feedback manually</h2>
        </div>
        <button class="icon-button" value="close" aria-label="Close manual copy">×</button>
      </div>
      <label for="manual-copy-output">Review feedback</label>
      <textarea id="manual-copy-output" rows="16" readonly></textarea>
      <button class="button button-primary dialog-done" value="close">Done copying</button>
    </form>
  </dialog>
  <div class="closed-screen" id="closed-screen" hidden>
    <div>
      <span class="product-mark" aria-hidden="true">R</span>
      <h2>Review closed</h2>
      <p>You can close this tab.</p>
    </div>
  </div>
`;

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required UI element is missing: ${selector}`);
  return element;
}

const elements = {
  workspace: requiredElement<HTMLElement>("#workspace"),
  title: requiredElement<HTMLElement>("#review-title"),
  sourceLabel: requiredElement<HTMLElement>("#source-label"),
  annotationCount: requiredElement<HTMLElement>("#annotation-count"),
  commentsToggle: requiredElement<HTMLButtonElement>("#comments-toggle"),
  shortcutHelp: requiredElement<HTMLButtonElement>("#shortcut-help"),
  copy: requiredElement<HTMLButtonElement>("#copy-feedback"),
  close: requiredElement<HTMLButtonElement>("#close-review"),
  sourceNav: requiredElement<HTMLElement>("#source-nav"),
  sourceNavTitle: requiredElement<HTMLElement>("#source-nav-title"),
  fileCount: requiredElement<HTMLElement>("#file-count"),
  fileList: requiredElement<HTMLElement>("#file-list"),
  toolbarComment: requiredElement<HTMLButtonElement>("#toolbar-comment"),
  toolHelp: requiredElement<HTMLButtonElement>("#tool-help"),
  copySource: requiredElement<HTMLButtonElement>("#copy-source"),
  reader: requiredElement<HTMLElement>("#review-reader"),
  readerLocation: requiredElement<HTMLElement>("#reader-location"),
  fileSelect: requiredElement<HTMLSelectElement>("#file-select"),
  diffUnified: requiredElement<HTMLButtonElement>("#diff-unified"),
  diffSplit: requiredElement<HTMLButtonElement>("#diff-split"),
  codeSize: requiredElement<HTMLSelectElement>("#code-size"),
  readerHint: requiredElement<HTMLElement>("#reader-hint"),
  loading: requiredElement<HTMLElement>("#reader-loading"),
  markdown: requiredElement<HTMLElement>("#markdown-content"),
  diff: requiredElement<HTMLElement>("#diff-content"),
  empty: requiredElement<HTMLElement>("#reader-empty"),
  composer: requiredElement<HTMLFormElement>("#composer"),
  composerMode: requiredElement<HTMLElement>("#composer-mode"),
  composerAnchor: requiredElement<HTMLElement>("#composer-anchor"),
  commentInput: requiredElement<HTMLTextAreaElement>("#comment-input"),
  saveComment: requiredElement<HTMLButtonElement>("#save-comment"),
  cancelComment: requiredElement<HTMLButtonElement>("#cancel-comment"),
  annotationRail: requiredElement<HTMLElement>("#annotation-rail"),
  annotationList: requiredElement<HTMLElement>("#annotation-list"),
  railCount: requiredElement<HTMLElement>("#rail-count"),
  railFooter: requiredElement<HTMLElement>("#rail-footer"),
  railCopy: requiredElement<HTMLButtonElement>("#rail-copy"),
  railClose: requiredElement<HTMLButtonElement>("#rail-close"),
  status: requiredElement<HTMLElement>("#status-toast"),
  undo: requiredElement<HTMLElement>("#undo-toast"),
  undoDelete: requiredElement<HTMLButtonElement>("#undo-delete"),
  shortcutDialog: requiredElement<HTMLDialogElement>("#shortcut-dialog"),
  manualCopyDialog: requiredElement<HTMLDialogElement>("#manual-copy-dialog"),
  manualCopyOutput: requiredElement<HTMLTextAreaElement>("#manual-copy-output"),
  closed: requiredElement<HTMLElement>("#closed-screen"),
};

let session: ReviewSession | null = null;
let annotations: ReviewAnnotation[] = [];
let pendingAnchor: ReviewAnchor | null = null;
let pendingAnchorRect: DOMRect | null = null;
let selectedAnnotationId: string | null = null;
let editingAnnotationId: string | null = null;
let parsedFiles: FileDiffMetadata[] = [];
let activeFileIndex = 0;
let diffView: FileDiff<ReviewAnnotation> | null = null;
let markdownBlocks: HTMLElement[] = [];
let markdownCursor = -1;
let diffTargets: Array<{ side: DiffSide; line: number }> = [];
let diffCursor = -1;
let diffSelectionOrigin: { side: DiffSide; line: number } | null = null;
let deletedSnapshot: { annotation: ReviewAnnotation; index: number } | null = null;
let deleteTimer: number | null = null;
let statusTimer: number | null = null;
let pendingG = false;
let pendingGTimer: number | null = null;
let preferences: ReviewPreferences = { ...DEFAULT_REVIEW_PREFERENCES };
let preferenceWrite: Promise<void> = Promise.resolve();
let sessionRefreshPending = false;

function normalizePreferences(value: unknown): ReviewPreferences {
  if (!value || typeof value !== "object") return { ...DEFAULT_REVIEW_PREFERENCES };
  const candidate = value as Partial<ReviewPreferences>;
  const codeFontSize = Number(candidate.codeFontSize);
  return {
    version: 1,
    diffStyle: candidate.diffStyle === "split" ? "split" : "unified",
    codeFontSize: CODE_FONT_SIZES.has(codeFontSize as ReviewCodeFontSize)
      ? codeFontSize as ReviewCodeFontSize
      : DEFAULT_REVIEW_PREFERENCES.codeFontSize,
  };
}

function applyPreferences(): void {
  const root = document.documentElement;
  root.style.setProperty("--review-code-font-size", `${preferences.codeFontSize}px`);
  root.style.setProperty("--review-code-meta-size", `${preferences.codeFontSize}px`);
  elements.diffUnified.setAttribute("aria-pressed", String(preferences.diffStyle === "unified"));
  elements.diffSplit.setAttribute("aria-pressed", String(preferences.diffStyle === "split"));
  elements.codeSize.value = String(preferences.codeFontSize);
}

async function loadPreferences(): Promise<void> {
  try {
    const response = await fetch("./api/preferences", { cache: "no-store" });
    if (response.ok) preferences = normalizePreferences(await response.json());
  } catch {
    // Display defaults remain usable when local preference storage is unavailable.
  }
  applyPreferences();
}

function persistPreferences(): void {
  const snapshot = JSON.stringify(preferences);
  preferenceWrite = preferenceWrite
    .catch(() => {})
    .then(async () => {
      const response = await fetch("./api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: snapshot,
      });
      if (!response.ok) throw new Error(`Preference save failed with HTTP ${response.status}.`);
    })
    .catch(() => {
      showStatus("Display preference could not be saved on this computer.", "error");
    });
}

function setDiffStyle(diffStyle: ReviewDiffStyle): void {
  if (preferences.diffStyle === diffStyle) return;
  preferences = { ...preferences, diffStyle };
  applyPreferences();
  if (session?.mode === "diff") renderDiff();
  persistPreferences();
}

function setCodeFontSize(value: number): void {
  if (!CODE_FONT_SIZES.has(value as ReviewCodeFontSize) || preferences.codeFontSize === value) return;
  preferences = { ...preferences, codeFontSize: value as ReviewCodeFontSize };
  applyPreferences();
  positionComposer();
  persistPreferences();
}

function storageKey(): string | null {
  return session ? `embedded-review:draft:${session.id}` : null;
}

function persistAnnotations(): void {
  const key = storageKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({ version: DRAFT_VERSION, annotations }));
  } catch {
    showStatus("Comments could not be saved in this browser.", "error");
  }
}

function loadAnnotations(): void {
  const key = storageKey();
  if (!key) return;
  try {
    annotations = parseDraft(localStorage.getItem(key)).annotations;
  } catch {
    annotations = [];
  }
}

function showStatus(message: string, tone: "neutral" | "success" | "error" = "neutral"): void {
  if (statusTimer !== null) window.clearTimeout(statusTimer);
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
  elements.status.hidden = false;
  statusTimer = window.setTimeout(() => {
    elements.status.hidden = true;
    statusTimer = null;
  }, tone === "error" ? 6_000 : 3_500);
}

function setRailOpen(open: boolean): void {
  document.body.classList.toggle("rail-open", open);
  elements.commentsToggle.setAttribute("aria-expanded", String(open));
}

function annotationLabel(annotation: ReviewAnnotation): string {
  return summarizeAnchor(annotation.anchor, 76);
}

function renderAnnotationRail(): void {
  elements.annotationList.replaceChildren();
  if (annotations.length === 0) {
    const empty = document.createElement("div");
    empty.className = "rail-empty";
    const icon = document.createElement("span");
    icon.className = "rail-empty-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8-4-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3l-4 4Z"/></svg>';
    const heading = document.createElement("h3");
    heading.textContent = "No annotations yet";
    const copy = document.createElement("p");
    copy.textContent = session?.mode === "diff" ? "Select lines to annotate" : "Select text to annotate";
    empty.append(icon, heading, copy);
    elements.annotationList.append(empty);
  } else {
    annotations.forEach((annotation, index) => {
      const article = document.createElement("article");
      article.className = "annotation-item";
      article.dataset.annotationId = annotation.id;
      if (annotation.id === selectedAnnotationId) article.dataset.selected = "true";

      const meta = document.createElement("div");
      meta.className = "annotation-meta";
      const type = document.createElement("span");
      type.className = "annotation-type";
      type.textContent = "Comment";
      const ordinal = document.createElement("span");
      ordinal.className = "annotation-ordinal";
      ordinal.textContent = `#${index + 1}`;
      meta.append(type, ordinal);

      const jump = document.createElement("button");
      jump.type = "button";
      jump.className = "annotation-jump";
      jump.addEventListener("click", () => selectAnnotation(annotation.id));
      const anchor = document.createElement("span");
      anchor.className = "annotation-anchor";
      anchor.textContent = annotationLabel(annotation);
      jump.append(anchor);

      const comment = document.createElement("p");
      comment.className = "annotation-comment";
      comment.textContent = annotation.comment;

      const actions = document.createElement("div");
      actions.className = "annotation-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => editAnnotation(annotation.id));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.className = "danger-action";
      remove.addEventListener("click", () => deleteAnnotation(annotation.id));
      actions.append(edit, remove);

      article.append(meta, jump, comment, actions);
      elements.annotationList.append(article);
    });
  }

  const count = annotations.length;
  elements.annotationCount.textContent = count ? (count > 99 ? "99+" : String(count)) : "";
  elements.railCount.textContent = String(count);
  elements.railCount.hidden = count === 0;
  elements.railFooter.hidden = count === 0;
  elements.copy.disabled = count === 0;
  if (session?.mode === "markdown") renderMarkdownToc();
}

function renderFileList(): void {
  elements.sourceNavTitle.textContent = "Files";
  elements.fileList.replaceChildren();
  elements.fileSelect.replaceChildren();
  elements.fileCount.textContent = String(parsedFiles.length);
  parsedFiles.forEach((file, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = file.name;
    elements.fileSelect.append(option);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "file-button";
    button.dataset.active = String(index === activeFileIndex);
    button.setAttribute("aria-current", index === activeFileIndex ? "true" : "false");
    button.addEventListener("click", () => switchFile(index));

    const status = document.createElement("span");
    status.className = `file-status file-status-${file.type}`;
    status.textContent = file.type === "new" ? "A" : file.type === "deleted" ? "D" : file.type.startsWith("rename") ? "R" : "M";
    status.setAttribute("aria-label", file.type);
    const path = document.createElement("span");
    path.className = "file-path";
    path.textContent = file.name;
    const comments = annotations.filter((annotation) => annotation.anchor.kind === "diff" && annotation.anchor.file === file.name).length;
    const badge = document.createElement("span");
    badge.className = "file-comment-count";
    badge.textContent = comments ? String(comments) : "";
    badge.setAttribute("aria-label", `${comments} comments`);

    button.append(status, path, badge);
    elements.fileList.append(button);
  });
  elements.fileSelect.value = String(activeFileIndex);
}

function renderMarkdownToc(): void {
  elements.sourceNavTitle.textContent = "Contents";
  elements.fileList.replaceChildren();
  const headings = Array.from(elements.markdown.querySelectorAll<HTMLElement>("h1, h2, h3"));
  elements.fileCount.textContent = "";
  headings.forEach((heading, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toc-button";
    button.dataset.depth = heading.tagName.slice(1);
    button.dataset.active = String(index === 0);
    button.textContent = heading.textContent?.trim() || `Section ${index + 1}`;
    const count = annotations.filter((annotation) => annotation.anchor.kind === "text" && annotation.anchor.section === heading.textContent?.trim()).length;
    if (count > 0) {
      const badge = document.createElement("span");
      badge.className = "toc-count";
      badge.textContent = String(count);
      button.append(badge);
    }
    button.addEventListener("click", () => {
      elements.fileList.querySelectorAll<HTMLElement>("[data-active]").forEach((item) => { item.dataset.active = "false"; });
      button.dataset.active = "true";
      heading.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
    elements.fileList.append(button);
  });
}

async function highlightMarkdownCode(root: HTMLElement): Promise<void> {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("pre > code"));
  await Promise.all(blocks.map(async (code) => {
    if ((code.textContent?.length ?? 0) > 50_000) return;
    const languageClass = Array.from(code.classList).find((name) => name.startsWith("language-"));
    const language = languageClass?.slice("language-".length) || "text";
    try {
      const highlighted = await codeToHtml(code.textContent ?? "", {
        lang: language,
        themes: { dark: "github-dark", light: "github-light" },
        defaultColor: false,
      });
      const wrapper = document.createElement("div");
      wrapper.innerHTML = highlighted;
      const replacement = wrapper.firstElementChild;
      if (replacement) code.parentElement?.replaceWith(replacement);
    } catch {
      // Markdown-it already escaped the code; unsupported languages stay readable.
    }
  }));
}

function getTextOffset(root: Node, container: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(container, offset);
  return range.toString().length;
}

function nearestSection(node: Node): string | undefined {
  const headings = Array.from(elements.markdown.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"));
  let section: string | undefined;
  for (const heading of headings) {
    if (heading === node || heading.contains(node) || heading.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) {
      section = heading.textContent?.trim() || section;
    } else {
      break;
    }
  }
  return section;
}

function textAnchorFromRange(range: Range): TextAnchor | null {
  const rawQuote = range.toString();
  const quote = rawQuote.trim();
  if (!quote) return null;
  if (quote.length > MAX_TEXT_SELECTION_LENGTH) {
    showStatus(`Select at most ${MAX_TEXT_SELECTION_LENGTH.toLocaleString()} characters.`, "error");
    return null;
  }

  const rawStart = getTextOffset(elements.markdown, range.startContainer, range.startOffset);
  const leadingWhitespace = rawQuote.length - rawQuote.trimStart().length;
  const start = rawStart + leadingWhitespace;
  const end = start + quote.length;
  const fullText = elements.markdown.textContent ?? "";
  return {
    kind: "text",
    start,
    end,
    quote,
    section: nearestSection(range.startContainer),
    before: fullText.slice(Math.max(0, start - 48), start),
    after: fullText.slice(end, end + 48),
  };
}

function textAnchorFromElement(element: HTMLElement): TextAnchor | null {
  const range = document.createRange();
  range.selectNodeContents(element);
  return textAnchorFromRange(range);
}

function unwrapTextHighlights(): void {
  for (const mark of Array.from(elements.markdown.querySelectorAll<HTMLElement>("mark[data-review-highlight]"))) {
    mark.replaceWith(document.createTextNode(mark.textContent ?? ""));
  }
  elements.markdown.normalize();
}

function wrapTextRange(anchor: TextAnchor, id: string, state: "saved" | "pending"): void {
  const walker = document.createTreeWalker(elements.markdown, NodeFilter.SHOW_TEXT);
  const nodes: Array<{ node: Text; start: number; end: number }> = [];
  let position = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const length = node.data.length;
    nodes.push({ node, start: position, end: position + length });
    position += length;
  }

  const marks: HTMLElement[] = [];
  for (const item of nodes.reverse()) {
    const overlapStart = Math.max(anchor.start, item.start);
    const overlapEnd = Math.min(anchor.end, item.end);
    if (overlapStart >= overlapEnd) continue;
    const range = document.createRange();
    range.setStart(item.node, overlapStart - item.start);
    range.setEnd(item.node, overlapEnd - item.start);
    const mark = document.createElement("mark");
    mark.dataset.reviewHighlight = id;
    mark.dataset.state = state;
    mark.tabIndex = -1;
    if (state === "saved") {
      mark.setAttribute("aria-label", "Annotated text");
      mark.addEventListener("click", () => selectAnnotation(id));
      mark.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectAnnotation(id);
        }
      });
    }
    range.surroundContents(mark);
    marks.push(mark);
  }
  if (state === "saved") marks.at(-1)?.setAttribute("tabindex", "0");
}

function applyTextHighlights(): void {
  if (session?.mode !== "markdown") return;
  unwrapTextHighlights();
  const textAnnotations = annotations
    .filter((annotation): annotation is ReviewAnnotation & { anchor: TextAnchor } => annotation.anchor.kind === "text")
    .sort((left, right) => right.anchor.start - left.anchor.start);
  for (const annotation of textAnnotations) wrapTextRange(annotation.anchor, annotation.id, "saved");
  if (pendingAnchor?.kind === "text") wrapTextRange(pendingAnchor, "pending", "pending");
}

function collectMarkdownBlocks(): void {
  const candidates = Array.from(elements.markdown.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, p, pre, blockquote, li, table"));
  markdownBlocks = candidates.filter((candidate) => !candidates.some((other) => other !== candidate && other.contains(candidate) && other.matches("li, blockquote")));
}

function updateMarkdownCursor(nextIndex: number): void {
  markdownBlocks.forEach((block) => block.classList.remove("review-cursor"));
  if (markdownBlocks.length === 0) {
    markdownCursor = -1;
    return;
  }
  markdownCursor = Math.max(0, Math.min(nextIndex, markdownBlocks.length - 1));
  const block = markdownBlocks[markdownCursor];
  block.classList.add("review-cursor");
  block.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

function handleMarkdownSelection(): void {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  if (!elements.markdown.contains(range.commonAncestorContainer)) return;
  const anchor = textAnchorFromRange(range);
  if (!anchor) return;
  const anchorRect = range.getBoundingClientRect();
  selection.removeAllRanges();
  openComposer(anchor, undefined, anchorRect);
}

function lineMaps(file: FileDiffMetadata): Record<DiffSide, Map<number, string>> {
  const additions = new Map<number, string>();
  const deletions = new Map<number, string>();
  for (const hunk of file.hunks) {
    for (let offset = 0; offset < hunk.additionCount; offset += 1) {
      additions.set(hunk.additionStart + offset, file.additionLines[hunk.additionLineIndex + offset] ?? "");
    }
    for (let offset = 0; offset < hunk.deletionCount; offset += 1) {
      deletions.set(hunk.deletionStart + offset, file.deletionLines[hunk.deletionLineIndex + offset] ?? "");
    }
  }
  return { additions, deletions };
}

function buildDiffTargets(file: FileDiffMetadata): Array<{ side: DiffSide; line: number }> {
  const targets: Array<{ side: DiffSide; line: number }> = [];
  for (const hunk of file.hunks) {
    let additionLine = hunk.additionStart;
    let deletionLine = hunk.deletionStart;
    for (const content of hunk.hunkContent) {
      if (content.type === "context") {
        additionLine += content.lines;
        deletionLine += content.lines;
        continue;
      }
      for (let index = 0; index < content.deletions; index += 1) {
        targets.push({ side: "deletions", line: deletionLine + index });
      }
      for (let index = 0; index < content.additions; index += 1) {
        targets.push({ side: "additions", line: additionLine + index });
      }
      deletionLine += content.deletions;
      additionLine += content.additions;
    }
  }
  return targets;
}

function diffAnchorFromRange(range: SelectedLineRange): DiffAnchor | null {
  const file = parsedFiles[activeFileIndex];
  if (!file) return null;
  const side = range.side ?? "additions";
  const endSide = range.endSide ?? side;
  if (side !== endSide) {
    showStatus("Select changed lines from one side of the diff at a time.", "error");
    return null;
  }
  const lineCount = Math.abs(range.end - range.start) + 1;
  if (lineCount > MAX_DIFF_SELECTION_LINES) {
    showStatus(`Select at most ${MAX_DIFF_SELECTION_LINES} lines.`, "error");
    return null;
  }
  const start = Math.min(range.start, range.end);
  const end = Math.max(range.start, range.end);
  const maps = lineMaps(file);
  const excerpt = lineExcerpt(maps[side], side, start, end);
  return {
    kind: "diff",
    file: file.name,
    side,
    start,
    end,
    excerpt,
  };
}

function diffLineAnnotations(): DiffLineAnnotation<ReviewAnnotation>[] {
  const file = parsedFiles[activeFileIndex];
  if (!file) return [];
  const maps = lineMaps(file);
  return annotations
    .filter((annotation): annotation is ReviewAnnotation & { anchor: DiffAnchor } => {
      if (annotation.anchor.kind !== "diff" || annotation.anchor.file !== file.name) return false;
      const side = annotation.anchor.endSide ?? annotation.anchor.side;
      return maps[side].has(annotation.anchor.end);
    })
    .map((annotation) => ({
      side: annotation.anchor.endSide ?? annotation.anchor.side,
      lineNumber: annotation.anchor.end,
      metadata: annotation,
    }));
}

function createInlineAnnotation(annotation: DiffLineAnnotation<ReviewAnnotation>): HTMLElement | undefined {
  const metadata = annotation.metadata;
  if (!metadata) return undefined;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "inline-annotation";
  button.dataset.selected = String(metadata.id === selectedAnnotationId);
  button.textContent = metadata.comment;
  button.title = `Open comment on ${annotationLabel(metadata)}`;
  button.addEventListener("click", () => selectAnnotation(metadata.id));
  return button;
}

const pierreUnsafeCss = `
  :host {
    --diffs-font-family: "BerkeleyMono Nerd Font", "BerkeleyMonoNF-Regular", ui-monospace, "SFMono-Regular", Consolas, monospace;
    --diffs-font-size: var(--review-code-font-size, 15px);
    --diffs-line-height: 1.55;
    --diffs-bg-separator-override: light-dark(oklch(0.94 0.006 260), oklch(0.225 0.018 260));
  }
  [data-diffs-header] { display: none !important; }
  [data-selected-line] {
    outline: 1px solid light-dark(oklch(0.50 0.25 280), oklch(0.75 0.18 280));
    outline-offset: -1px;
    box-shadow: inset 3px 0 0 light-dark(oklch(0.50 0.25 280), oklch(0.75 0.18 280));
  }
  [data-separator-content] { font-size: var(--review-code-meta-size, 15px) !important; opacity: .72; }
  pre, code { font-variant-ligatures: none; font-variant-numeric: tabular-nums; }
`;

function renderDiff(): void {
  diffView?.cleanUp();
  diffView = null;
  elements.diff.replaceChildren();
  const file = parsedFiles[activeFileIndex];
  if (!file) {
    elements.empty.hidden = false;
    elements.diff.hidden = true;
    return;
  }

  elements.empty.hidden = true;
  elements.diff.hidden = false;
  elements.readerLocation.textContent = file.prevName ? `${file.prevName} → ${file.name}` : file.name;
  diffTargets = buildDiffTargets(file);
  diffCursor = -1;
  diffSelectionOrigin = null;

  diffView = new FileDiff<ReviewAnnotation>({
    theme: { dark: "github-dark", light: "github-light" },
    themeType: "system",
    diffStyle: preferences.diffStyle,
    overflow: "scroll",
    lineDiffType: "word-alt",
    diffIndicators: "bars",
    hunkSeparators: "line-info",
    disableFileHeader: true,
    enableLineSelection: true,
    lineHoverHighlight: "both",
    unsafeCSS: pierreUnsafeCss,
    onLineSelectionEnd: (range) => {
      if (!range) return;
      const anchor = diffAnchorFromRange(range);
      if (anchor) openDiffComposer(anchor);
    },
    onGutterUtilityClick: (range) => {
      const anchor = diffAnchorFromRange(range);
      if (anchor) openDiffComposer(anchor);
    },
    renderAnnotation: createInlineAnnotation,
  });
  diffView.render({
    fileDiff: file,
    lineAnnotations: diffLineAnnotations(),
    containerWrapper: elements.diff,
  });
  const selectedAnchor = pendingAnchor?.kind === "diff"
    ? pendingAnchor
    : annotations.find((annotation) => annotation.id === selectedAnnotationId)?.anchor;
  if (selectedAnchor?.kind === "diff" && selectedAnchor.file === file.name) {
    diffView.setSelectedLines({
      side: selectedAnchor.side,
      start: selectedAnchor.start,
      end: selectedAnchor.end,
    }, { notify: false });
  }
  renderFileList();
  positionComposer();
}

function refreshDiffAnnotations(): void {
  if (!diffView) return;
  const file = parsedFiles[activeFileIndex];
  if (!file) return;
  diffView.render({
    fileDiff: file,
    lineAnnotations: diffLineAnnotations(),
    forceRender: true,
  });
  renderFileList();
}

function switchFile(index: number): void {
  if (index < 0 || index >= parsedFiles.length || index === activeFileIndex) return;
  activeFileIndex = index;
  pendingAnchor = null;
  closeComposer();
  renderDiff();
}

function moveDiffCursor(delta: number, extend: boolean): void {
  if (!diffView || diffTargets.length === 0) return;
  if (diffCursor < 0) diffCursor = delta >= 0 ? 0 : diffTargets.length - 1;
  else diffCursor = Math.max(0, Math.min(diffCursor + delta, diffTargets.length - 1));
  const target = diffTargets[diffCursor];
  if (!extend || !diffSelectionOrigin || diffSelectionOrigin.side !== target.side) {
    diffSelectionOrigin = target;
  }
  const range: SelectedLineRange = {
    side: target.side,
    start: Math.min(diffSelectionOrigin.line, target.line),
    end: Math.max(diffSelectionOrigin.line, target.line),
  };
  const anchor = diffAnchorFromRange(range);
  if (!anchor) return;
  pendingAnchor = anchor;
  diffView.setSelectedLines(range, { notify: false });
  window.requestAnimationFrame(() => {
    const container = elements.diff.querySelector<HTMLElement>("diffs-container");
    const selected = container?.shadowRoot?.querySelector<HTMLElement>("[data-selected-line]");
    selected?.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  });
}

function unionRects(rects: readonly DOMRect[]): DOMRect | null {
  if (rects.length === 0) return null;
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

function currentAnchorRect(): DOMRect | null {
  if (pendingAnchor?.kind === "text") {
    const marks = Array.from(elements.markdown.querySelectorAll<HTMLElement>('mark[data-review-highlight="pending"]'));
    return unionRects(marks.map((mark) => mark.getBoundingClientRect()));
  }
  const container = elements.diff.querySelector<HTMLElement>("diffs-container");
  const selected = Array.from(container?.shadowRoot?.querySelectorAll<HTMLElement>("[data-selected-line]") ?? []);
  return unionRects(selected.map((line) => line.getBoundingClientRect()));
}

function positionComposer(anchorRect?: DOMRect | null): void {
  if (elements.composer.hidden) return;
  window.requestAnimationFrame(() => {
    const rect = anchorRect ?? currentAnchorRect() ?? pendingAnchorRect;
    const margin = 16;
    const gap = 8;
    const width = Math.min(384, window.innerWidth - margin * 2);
    elements.composer.style.width = `${width}px`;
    const composerRect = elements.composer.getBoundingClientRect();
    const readerRect = elements.reader.getBoundingClientRect();
    const fallback = new DOMRect(readerRect.left + readerRect.width / 2, readerRect.top + readerRect.height / 2, 0, 0);
    const target = rect && rect.width + rect.height > 0 ? rect : fallback;
    let top = target.bottom + gap;
    if (top + composerRect.height > window.innerHeight - margin) top = target.top - composerRect.height - gap;
    top = Math.max(margin, Math.min(top, window.innerHeight - composerRect.height - margin));
    const surfaceLeft = Math.max(margin, readerRect.left + gap);
    const surfaceRight = Math.min(window.innerWidth - margin, readerRect.right - gap);
    const left = Math.max(surfaceLeft, Math.min(target.left + target.width / 2 - width / 2, surfaceRight - width));
    elements.composer.style.top = `${top}px`;
    elements.composer.style.left = `${left}px`;
  });
}

function openDiffComposer(anchor: DiffAnchor, annotation?: ReviewAnnotation): void {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => openComposer(anchor, annotation, currentAnchorRect() ?? undefined));
  });
}

function openComposer(anchor: ReviewAnchor, annotation?: ReviewAnnotation, anchorRect?: DOMRect): void {
  pendingAnchor = anchor;
  pendingAnchorRect = anchorRect ?? null;
  editingAnnotationId = annotation?.id ?? null;
  elements.composer.hidden = false;
  elements.composerMode.textContent = annotation ? "Editing" : "Comment";
  elements.composerAnchor.textContent = summarizeAnchor(anchor);
  elements.commentInput.value = annotation?.comment ?? "";
  elements.saveComment.textContent = annotation ? "Update Comment" : "Add Comment";
  if (session?.mode === "markdown") applyTextHighlights();
  if (session?.mode === "diff" && diffView && anchor.kind === "diff") {
    diffView.setSelectedLines({
      side: anchor.side,
      start: anchor.start,
      end: anchor.end,
      ...(anchor.endSide ? { endSide: anchor.endSide } : {}),
    }, { notify: false });
  }
  positionComposer(anchorRect);
  window.requestAnimationFrame(() => elements.commentInput.focus());
}

function closeComposer(): void {
  elements.composer.hidden = true;
  pendingAnchor = null;
  pendingAnchorRect = null;
  editingAnnotationId = null;
  elements.commentInput.value = "";
  if (session?.mode === "markdown") applyTextHighlights();
  else if (!selectedAnnotationId) diffView?.setSelectedLines(null, { notify: false });
}

function saveComment(): void {
  if (!pendingAnchor) {
    showStatus("Select text or diff lines before adding a comment.", "error");
    return;
  }
  const comment = normalizeComment(elements.commentInput.value);
  if (!comment) {
    elements.commentInput.setCustomValidity("Enter a comment.");
    elements.commentInput.reportValidity();
    return;
  }
  elements.commentInput.setCustomValidity("");
  const now = new Date().toISOString();
  if (editingAnnotationId) {
    annotations = annotations.map((annotation) => annotation.id === editingAnnotationId
      ? { ...annotation, anchor: pendingAnchor as ReviewAnchor, comment, updatedAt: now }
      : annotation);
    selectedAnnotationId = editingAnnotationId;
    showStatus("Comment updated.", "success");
  } else {
    const annotation: ReviewAnnotation = {
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `annotation-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      anchor: pendingAnchor,
      comment,
      createdAt: now,
      updatedAt: now,
    };
    annotations = [...annotations, annotation];
    selectedAnnotationId = annotation.id;
    showStatus("Comment added.", "success");
  }
  persistAnnotations();
  closeComposer();
  renderAnnotationRail();
  if (session?.mode === "markdown") applyTextHighlights();
  else refreshDiffAnnotations();
}

function editAnnotation(id: string): void {
  const annotation = annotations.find((candidate) => candidate.id === id);
  if (!annotation) return;
  if (annotation.anchor.kind === "diff") {
    const anchor = annotation.anchor;
    const fileIndex = parsedFiles.findIndex((file) => file.name === anchor.file);
    if (fileIndex >= 0 && fileIndex !== activeFileIndex) {
      activeFileIndex = fileIndex;
      renderDiff();
    }
  }
  selectedAnnotationId = id;
  renderAnnotationRail();
  openComposer(annotation.anchor, annotation);
}

function deleteAnnotation(id: string): void {
  const index = annotations.findIndex((annotation) => annotation.id === id);
  if (index < 0) return;
  deletedSnapshot = { annotation: annotations[index], index };
  annotations = annotations.filter((annotation) => annotation.id !== id);
  if (selectedAnnotationId === id) selectedAnnotationId = null;
  persistAnnotations();
  renderAnnotationRail();
  if (session?.mode === "markdown") applyTextHighlights();
  else refreshDiffAnnotations();
  elements.undo.hidden = false;
  if (deleteTimer !== null) window.clearTimeout(deleteTimer);
  deleteTimer = window.setTimeout(() => {
    elements.undo.hidden = true;
    deletedSnapshot = null;
    deleteTimer = null;
  }, 6_000);
}

function undoDelete(): void {
  if (!deletedSnapshot) return;
  const next = [...annotations];
  next.splice(Math.min(deletedSnapshot.index, next.length), 0, deletedSnapshot.annotation);
  annotations = next;
  selectedAnnotationId = deletedSnapshot.annotation.id;
  deletedSnapshot = null;
  if (deleteTimer !== null) window.clearTimeout(deleteTimer);
  deleteTimer = null;
  elements.undo.hidden = true;
  persistAnnotations();
  renderAnnotationRail();
  if (session?.mode === "markdown") applyTextHighlights();
  else refreshDiffAnnotations();
  showStatus("Comment restored.", "success");
}

function selectAnnotation(id: string): void {
  const annotation = annotations.find((candidate) => candidate.id === id);
  if (!annotation) return;
  selectedAnnotationId = id;
  renderAnnotationRail();
  setRailOpen(true);
  if (annotation.anchor.kind === "text") {
    applyTextHighlights();
    window.requestAnimationFrame(() => {
      elements.markdown.querySelector<HTMLElement>(`mark[data-review-highlight="${CSS.escape(id)}"]`)?.scrollIntoView({
        block: "center",
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    });
    return;
  }

  const anchor = annotation.anchor;
  const fileIndex = parsedFiles.findIndex((file) => file.name === anchor.file);
  if (fileIndex >= 0 && fileIndex !== activeFileIndex) {
    activeFileIndex = fileIndex;
    renderDiff();
  }
  diffView?.setSelectedLines({
    side: anchor.side,
    start: anchor.start,
    end: anchor.end,
    ...(anchor.endSide ? { endSide: anchor.endSide } : {}),
  }, { notify: false });
  window.requestAnimationFrame(() => {
    const container = elements.diff.querySelector<HTMLElement>("diffs-container");
    container?.shadowRoot?.querySelector<HTMLElement>("[data-selected-line]")?.scrollIntoView({
      block: "center",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  });
}

function navigateAnnotations(delta: number): void {
  if (annotations.length === 0) return;
  const current = annotations.findIndex((annotation) => annotation.id === selectedAnnotationId);
  const next = current < 0
    ? (delta > 0 ? 0 : annotations.length - 1)
    : (current + delta + annotations.length) % annotations.length;
  selectAnnotation(annotations[next].id);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.className = "clipboard-fallback";
    document.body.append(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      textarea.remove();
    }
    return copied;
  }
}

async function copyReviewedSource(): Promise<void> {
  if (!session) return;
  if (await writeClipboard(session.content)) {
    showStatus(session.mode === "diff" ? "Diff copied." : "Response copied.", "success");
    return;
  }
  elements.manualCopyOutput.value = session.content;
  elements.manualCopyDialog.showModal();
  window.requestAnimationFrame(() => {
    elements.manualCopyOutput.focus();
    elements.manualCopyOutput.select();
  });
}

async function copyFeedback(): Promise<void> {
  const feedback = formatFeedback(annotations);
  if (!feedback) {
    showStatus("Add at least one comment before copying feedback.", "error");
    return;
  }
  if (await writeClipboard(feedback)) {
    showStatus("Feedback copied. Paste it into the conversation.", "success");
    return;
  }
  elements.manualCopyOutput.value = feedback;
  elements.manualCopyDialog.showModal();
  window.requestAnimationFrame(() => {
    elements.manualCopyOutput.focus();
    elements.manualCopyOutput.select();
  });
}

async function closeReview(): Promise<void> {
  elements.close.disabled = true;
  try {
    await fetch("./api/close", { method: "POST", keepalive: true });
  } catch {
    // The host may close the native window before the response arrives.
  }
  elements.workspace.hidden = true;
  document.querySelector<HTMLElement>(".command-bar")!.hidden = true;
  elements.closed.hidden = false;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (
    target.matches("input, textarea, select, [contenteditable='true']") ||
    target.closest("input, textarea, select, [contenteditable='true']") !== null
  );
}

function jumpToBoundary(last: boolean): void {
  if (session?.mode === "markdown") {
    updateMarkdownCursor(last ? markdownBlocks.length - 1 : 0);
    return;
  }
  if (diffTargets.length === 0) return;
  diffCursor = last ? diffTargets.length - 1 : 0;
  diffSelectionOrigin = null;
  moveDiffCursor(0, false);
}

function annotateCurrentTarget(): void {
  if (pendingAnchor) {
    openComposer(pendingAnchor);
    return;
  }
  if (session?.mode === "markdown") {
    if (markdownCursor < 0) updateMarkdownCursor(0);
    const block = markdownBlocks[markdownCursor];
    const anchor = block ? textAnchorFromElement(block) : null;
    if (anchor) openComposer(anchor);
    return;
  }
  if (diffCursor < 0) moveDiffCursor(1, false);
  if (pendingAnchor) openComposer(pendingAnchor);
}

function handleGlobalKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
  if (isEditableTarget(event.target)) return;
  if (elements.shortcutDialog.open || elements.manualCopyDialog.open) return;

  if (event.key !== "g" && pendingG) {
    pendingG = false;
    if (pendingGTimer !== null) window.clearTimeout(pendingGTimer);
  }

  switch (event.key) {
    case "?":
      event.preventDefault();
      elements.shortcutDialog.showModal();
      break;
    case "j":
      event.preventDefault();
      if (session?.mode === "markdown") updateMarkdownCursor(markdownCursor < 0 ? 0 : markdownCursor + 1);
      else moveDiffCursor(1, false);
      break;
    case "J":
      event.preventDefault();
      if (session?.mode === "markdown") updateMarkdownCursor(markdownCursor < 0 ? 0 : markdownCursor + 1);
      else moveDiffCursor(1, true);
      break;
    case "k":
      event.preventDefault();
      if (session?.mode === "markdown") updateMarkdownCursor(markdownCursor < 0 ? markdownBlocks.length - 1 : markdownCursor - 1);
      else moveDiffCursor(-1, false);
      break;
    case "K":
      event.preventDefault();
      if (session?.mode === "markdown") updateMarkdownCursor(markdownCursor < 0 ? markdownBlocks.length - 1 : markdownCursor - 1);
      else moveDiffCursor(-1, true);
      break;
    case "h":
      if (session?.mode === "diff") {
        event.preventDefault();
        switchFile(Math.max(0, activeFileIndex - 1));
      }
      break;
    case "l":
      if (session?.mode === "diff") {
        event.preventDefault();
        switchFile(Math.min(parsedFiles.length - 1, activeFileIndex + 1));
      }
      break;
    case "g":
      event.preventDefault();
      if (pendingG) {
        pendingG = false;
        if (pendingGTimer !== null) window.clearTimeout(pendingGTimer);
        jumpToBoundary(false);
      } else {
        pendingG = true;
        pendingGTimer = window.setTimeout(() => { pendingG = false; }, 650);
      }
      break;
    case "G":
      event.preventDefault();
      jumpToBoundary(true);
      break;
    case "a":
      event.preventDefault();
      annotateCurrentTarget();
      break;
    case "n":
      event.preventDefault();
      navigateAnnotations(1);
      break;
    case "N":
      event.preventDefault();
      navigateAnnotations(-1);
      break;
    case "e":
      if (selectedAnnotationId) {
        event.preventDefault();
        editAnnotation(selectedAnnotationId);
      }
      break;
    case "d":
      if (selectedAnnotationId) {
        event.preventDefault();
        deleteAnnotation(selectedAnnotationId);
      }
      break;
    case "y":
      event.preventDefault();
      void copyFeedback();
      break;
    case "Escape":
      if (!elements.composer.hidden) {
        event.preventDefault();
        closeComposer();
        elements.reader.focus();
      } else if (document.body.classList.contains("rail-open")) {
        event.preventDefault();
        setRailOpen(false);
      }
      break;
  }
}

async function refreshSession(): Promise<void> {
  if (!session || session.mode !== "diff" || sessionRefreshPending || !elements.composer.hidden) return;
  sessionRefreshPending = true;
  try {
    const response = await fetch(`./api/session?after=${encodeURIComponent(session.id)}`, { cache: "no-store" });
    if (response.status === 204) return;
    if (!response.ok) throw new Error(`Session refresh failed with HTTP ${response.status}.`);
    const nextSession = await response.json() as ReviewSession;
    if (nextSession.id === session.id) return;

    const activeFile = parsedFiles[activeFileIndex]?.name;
    const scrollTop = elements.reader.scrollTop;
    closeComposer();
    session = nextSession;
    parsedFiles = processPatch(session.content, session.id, true).files;
    activeFileIndex = Math.max(0, activeFile ? parsedFiles.findIndex((file) => file.name === activeFile) : 0);
    elements.sourceLabel.textContent = session.sourceLabel;
    elements.loading.hidden = true;
    elements.empty.hidden = parsedFiles.length > 0;
    elements.diff.hidden = parsedFiles.length === 0;
    if (parsedFiles.length > 0) {
      renderFileList();
      renderDiff();
      elements.reader.scrollTop = scrollTop;
    } else {
      diffView?.cleanUp();
      diffView = null;
      elements.diff.replaceChildren();
    }
    persistAnnotations();
    renderAnnotationRail();
    showStatus("Diff updated to the latest worktree files.", "success");
  } catch (error) {
    showStatus(error instanceof Error ? error.message : String(error), "error");
  } finally {
    sessionRefreshPending = false;
  }
}

async function initialize(): Promise<void> {
  try {
    const [response] = await Promise.all([
      fetch("./api/session", { cache: "no-store" }),
      loadPreferences(),
    ]);
    if (!response.ok) throw new Error(`Session request failed with HTTP ${response.status}.`);
    session = await response.json() as ReviewSession;
    loadAnnotations();

    document.title = session.title;
    document.body.dataset.mode = session.mode;
    elements.title.textContent = session.title;
    elements.sourceLabel.textContent = session.sourceLabel;
    elements.readerLocation.textContent = session.sourceLabel;
    elements.readerHint.textContent = session.mode === "diff"
      ? "j/k move · ⇧j/⇧k extend"
      : "j/k move · a annotate";
    elements.copySource.querySelector("span")!.textContent = session.mode === "diff" ? "Copy diff" : "Copy response";
    elements.sourceNav.hidden = false;

    if (session.mode === "markdown") {
      elements.markdown.innerHTML = md.render(session.content);
      await highlightMarkdownCode(elements.markdown);
      elements.loading.hidden = true;
      if (session.content.trim()) {
        elements.markdown.hidden = false;
        collectMarkdownBlocks();
        renderMarkdownToc();
        applyTextHighlights();
      } else {
        elements.empty.hidden = false;
      }
    } else {
      const patch = processPatch(session.content, session.id, true);
      parsedFiles = patch.files;
      elements.sourceNav.hidden = false;
      elements.loading.hidden = true;
      if (parsedFiles.length > 0) {
        renderFileList();
        renderDiff();
      } else {
        elements.empty.hidden = false;
      }
    }

    renderAnnotationRail();
    setRailOpen(window.matchMedia("(min-width: 68.01rem)").matches);
    elements.workspace.setAttribute("aria-busy", "false");
  } catch (error) {
    elements.loading.hidden = true;
    elements.empty.hidden = false;
    elements.empty.querySelector("h2")!.textContent = "Review could not open";
    elements.empty.querySelector("p")!.textContent = error instanceof Error ? error.message : String(error);
    elements.workspace.setAttribute("aria-busy", "false");
  }
}

elements.markdown.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-review-href]") : null;
  if (!link) return;
  event.preventDefault();
  showStatus("Links are disabled in the local review workspace.");
});
elements.markdown.addEventListener("mouseup", () => window.setTimeout(handleMarkdownSelection, 0));
elements.markdown.addEventListener("keyup", (event) => {
  if (event.key.startsWith("Arrow") || event.key === "Home" || event.key === "End") {
    window.setTimeout(handleMarkdownSelection, 0);
  }
});
elements.composer.addEventListener("submit", (event) => {
  event.preventDefault();
  saveComment();
});
elements.commentInput.addEventListener("input", () => elements.commentInput.setCustomValidity(""));
elements.commentInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    saveComment();
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeComposer();
    elements.reader.focus();
  }
});
elements.cancelComment.addEventListener("click", () => {
  closeComposer();
  elements.reader.focus();
});
elements.copy.addEventListener("click", () => void copyFeedback());
elements.railCopy.addEventListener("click", () => void copyFeedback());
elements.copySource.addEventListener("click", () => void copyReviewedSource());
elements.fileSelect.addEventListener("change", () => switchFile(Number(elements.fileSelect.value)));
elements.diffUnified.addEventListener("click", () => setDiffStyle("unified"));
elements.diffSplit.addEventListener("click", () => setDiffStyle("split"));
elements.codeSize.addEventListener("change", () => setCodeFontSize(Number(elements.codeSize.value)));
elements.toolbarComment.addEventListener("click", annotateCurrentTarget);
elements.toolHelp.addEventListener("click", () => elements.shortcutDialog.showModal());
elements.close.addEventListener("click", () => void closeReview());
elements.commentsToggle.addEventListener("click", () => setRailOpen(!document.body.classList.contains("rail-open")));
elements.railClose.addEventListener("click", () => setRailOpen(false));
elements.shortcutHelp.addEventListener("click", () => elements.shortcutDialog.showModal());
elements.undoDelete.addEventListener("click", undoDelete);
elements.reader.addEventListener("scroll", () => positionComposer(), { passive: true });
window.addEventListener("resize", () => positionComposer());
document.addEventListener("keydown", handleGlobalKeydown);
window.setInterval(() => {
  void fetch("./api/heartbeat", { method: "POST", keepalive: true }).catch(() => {});
}, 5_000);
function scheduleSessionRefresh(): void {
  window.setTimeout(async () => {
    if (!document.hidden) await refreshSession();
    scheduleSessionRefresh();
  }, SESSION_POLL_INTERVAL_MS);
}

void initialize().finally(scheduleSessionRefresh);
