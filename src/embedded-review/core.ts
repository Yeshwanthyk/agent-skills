export const DRAFT_VERSION = 2;
export const MAX_COMMENT_LENGTH = 10_000;
export const MAX_TEXT_SELECTION_LENGTH = 12_000;
export const MAX_DIFF_SELECTION_LINES = 200;

export type ReviewMode = "document" | "diff";
export type DocumentKind = "markdown" | "text" | "html";
export type DiffSide = "additions" | "deletions";

export interface ReviewDocument {
  id: string;
  relativePath: string;
  kind: DocumentKind;
  size: number;
}

export interface DocumentReviewSession {
  version: 2;
  id: string;
  mode: "document";
  title: string;
  sourceLabel: string;
  rootLabel: string;
  documents: ReviewDocument[];
  initialDocumentId: string;
  createdAt: string;
}

export interface DiffReviewSession {
  version: 1;
  id: string;
  mode: "diff";
  title: string;
  sourceLabel: string;
  content: string;
  createdAt: string;
}

export type ReviewSession = DocumentReviewSession | DiffReviewSession;

export interface TextAnchor {
  kind: "text";
  documentId: string;
  start: number;
  end: number;
  quote: string;
  section?: string;
  before: string;
  after: string;
}

export interface HtmlAnchor {
  kind: "html";
  documentId: string;
  domPath: string;
  start: number;
  end: number;
  quote: string;
  before: string;
  after: string;
}

export interface DiffAnchor {
  kind: "diff";
  file: string;
  side: DiffSide;
  start: number;
  end: number;
  endSide?: DiffSide;
  excerpt: string[];
}

export type ReviewAnchor = TextAnchor | HtmlAnchor | DiffAnchor;

export interface ReviewAnnotation {
  id: string;
  anchor: ReviewAnchor;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDraft {
  version: 2;
  annotations: ReviewAnnotation[];
}

export function normalizeComment(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDocumentIdentity(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 256;
}

function isTextFields(anchor: Record<string, unknown>): boolean {
  return (
    isDocumentIdentity(anchor.documentId) &&
    Number.isSafeInteger(anchor.start) &&
    Number.isSafeInteger(anchor.end) &&
    Number(anchor.start) >= 0 &&
    Number(anchor.end) > Number(anchor.start) &&
    Number(anchor.end) - Number(anchor.start) <= MAX_TEXT_SELECTION_LENGTH &&
    typeof anchor.quote === "string" &&
    anchor.quote.length > 0 &&
    anchor.quote.length <= MAX_TEXT_SELECTION_LENGTH &&
    typeof anchor.before === "string" &&
    anchor.before.length <= 512 &&
    typeof anchor.after === "string" &&
    anchor.after.length <= 512
  );
}

export function isReviewAnnotation(value: unknown): value is ReviewAnnotation {
  if (!isRecord(value) || !isRecord(value.anchor)) return false;
  if (
    typeof value.id !== "string" || value.id.length === 0 || value.id.length > 256 ||
    typeof value.comment !== "string" || normalizeComment(value.comment).length === 0 || value.comment.length > MAX_COMMENT_LENGTH ||
    typeof value.createdAt !== "string" || value.createdAt.length > 64 ||
    typeof value.updatedAt !== "string" || value.updatedAt.length > 64
  ) return false;

  const anchor = value.anchor;
  if (anchor.kind === "text") {
    return isTextFields(anchor) && (anchor.section === undefined || (typeof anchor.section === "string" && anchor.section.length <= 512));
  }
  if (anchor.kind === "html") {
    return isTextFields(anchor) && typeof anchor.domPath === "string" && anchor.domPath.length > 0 && anchor.domPath.length <= 4_096;
  }
  if (anchor.kind === "diff") {
    return (
      typeof anchor.file === "string" && anchor.file.length > 0 && anchor.file.length <= 4_096 &&
      (anchor.side === "additions" || anchor.side === "deletions") &&
      Number.isSafeInteger(anchor.start) && Number.isSafeInteger(anchor.end) &&
      Number(anchor.start) > 0 && Number(anchor.end) >= Number(anchor.start) &&
      Number(anchor.end) - Number(anchor.start) < MAX_DIFF_SELECTION_LINES &&
      anchor.endSide === undefined && Array.isArray(anchor.excerpt) && anchor.excerpt.length <= 41 &&
      anchor.excerpt.every((line) => typeof line === "string" && line.length <= 20_000)
    );
  }
  return false;
}

export function parseDraft(raw: string | null): ReviewDraft {
  if (!raw) return { version: DRAFT_VERSION, annotations: [] };
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== DRAFT_VERSION || !Array.isArray(value.annotations)) {
      return { version: DRAFT_VERSION, annotations: [] };
    }
    return { version: DRAFT_VERSION, annotations: value.annotations.filter(isReviewAnnotation) };
  } catch {
    return { version: DRAFT_VERSION, annotations: [] };
  }
}

export function matchesFileSearch(path: string, query: string): boolean {
  const normalizedPath = path.toLocaleLowerCase();
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return terms.every((term) => normalizedPath.includes(term));
}

export function reconcileReviewedFileRevisions(
  reviewed: ReadonlyMap<string, string>,
  current: ReadonlyMap<string, string>,
): { reviewed: Map<string, string>; invalidated: number } {
  const reconciled = new Map<string, string>();
  let invalidated = 0;
  for (const [name, revision] of reviewed) {
    if (current.get(name) === revision) reconciled.set(name, revision);
    else invalidated += 1;
  }
  return { reviewed: reconciled, invalidated };
}

export function validateTextAnchor(content: string, anchor: TextAnchor | HtmlAnchor): boolean {
  if (content.slice(anchor.start, anchor.end) !== anchor.quote) return false;
  const before = content.slice(Math.max(0, anchor.start - anchor.before.length), anchor.start);
  const after = content.slice(anchor.end, anchor.end + anchor.after.length);
  return before === anchor.before && after === anchor.after;
}

export function formatLineRange(anchor: DiffAnchor): string {
  const startPrefix = anchor.side === "additions" ? "+" : "−";
  const endSide = anchor.endSide ?? anchor.side;
  const endPrefix = endSide === "additions" ? "+" : "−";
  return anchor.start === anchor.end && anchor.side === endSide
    ? `${startPrefix}${anchor.start}`
    : `${startPrefix}${anchor.start}–${endPrefix}${anchor.end}`;
}

export function summarizeAnchor(anchor: ReviewAnchor, maxLength = 88): string {
  if (anchor.kind === "diff") return `${anchor.file}:${formatLineRange(anchor)}`;
  const quote = collapseWhitespace(anchor.quote);
  const clipped = quote.length > maxLength ? `${quote.slice(0, maxLength - 1)}…` : quote;
  if (anchor.kind === "text" && anchor.section) return `${anchor.section} · “${clipped}”`;
  return `“${clipped}”`;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function quoteBlock(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim().split("\n").map((line) => `> ${line}`.trimEnd()).join("\n");
}

function indentBlock(value: string, spaces = 3): string {
  const indentation = " ".repeat(spaces);
  return value.split("\n").map((line) => `${indentation}${line}`.trimEnd()).join("\n");
}

function inlineCode(value: string): string {
  const printable = value.replace(/[\u0000-\u001f\u007f]/g, (character) => `\\u{${(character.codePointAt(0) ?? 0).toString(16).padStart(2, "0")}}`);
  const longestRun = Math.max(0, ...Array.from(printable.matchAll(/`+/g), (match) => match[0].length));
  const fence = "`".repeat(longestRun + 1);
  return `${fence}${printable}${fence}`;
}

function codeFence(value: string): string {
  const longestRun = Math.max(0, ...Array.from(value.matchAll(/`+/g), (match) => match[0].length));
  return "`".repeat(Math.max(3, longestRun + 1));
}

function formatTextAnnotation(annotation: ReviewAnnotation, index: number): string {
  if (annotation.anchor.kind === "diff") return "";
  const location = annotation.anchor.kind === "text" && annotation.anchor.section
    ? ` — section ${inlineCode(collapseWhitespace(annotation.anchor.section))}`
    : "";
  const label = annotation.anchor.kind === "html" ? "Selected HTML text" : "Selected text";
  return [
    `${index + 1}. **${label}**${location}`,
    indentBlock(quoteBlock(annotation.anchor.quote)),
    "",
    indentBlock(annotation.comment),
  ].join("\n");
}

function formatDiffAnnotation(annotation: ReviewAnnotation, index: number): string {
  if (annotation.anchor.kind !== "diff") return "";
  const excerptText = annotation.anchor.excerpt.join("\n");
  const fence = codeFence(excerptText);
  const excerpt = annotation.anchor.excerpt.length > 0
    ? ["", indentBlock(`${fence}diff`), indentBlock(excerptText), indentBlock(fence)]
    : [];
  return [`${index + 1}. **Lines ${formatLineRange(annotation.anchor)}**`, ...excerpt, "", indentBlock(annotation.comment)].join("\n");
}

export function formatFeedback(annotations: readonly ReviewAnnotation[], documents: readonly ReviewDocument[] = []): string {
  if (annotations.length === 0) return "";
  const sections = ["## Review feedback"];
  const textAnnotations = annotations.filter((annotation) => annotation.anchor.kind !== "diff");
  const documentOrder = new Map(documents.map((document, index) => [document.id, index]));
  const byDocument = new Map<string, ReviewAnnotation[]>();
  for (const annotation of textAnnotations) {
    if (annotation.anchor.kind === "diff") continue;
    const existing = byDocument.get(annotation.anchor.documentId) ?? [];
    existing.push(annotation);
    byDocument.set(annotation.anchor.documentId, existing);
  }
  const documentGroups = [...byDocument.entries()].sort(([left], [right]) => {
    const leftOrder = documentOrder.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = documentOrder.get(right) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder || (left < right ? -1 : left > right ? 1 : 0);
  });
  for (const [id, grouped] of documentGroups) {
    const label = documents.find((document) => document.id === id)?.relativePath ?? id;
    const heading = label === "Assistant response" ? "### Assistant response" : `### ${inlineCode(label)}`;
    sections.push([heading, ...grouped.map(formatTextAnnotation)].join("\n\n"));
  }

  const byFile = new Map<string, ReviewAnnotation[]>();
  for (const annotation of annotations) {
    if (annotation.anchor.kind !== "diff") continue;
    const existing = byFile.get(annotation.anchor.file) ?? [];
    existing.push(annotation);
    byFile.set(annotation.anchor.file, existing);
  }
  const fileGroups = [...byFile.entries()].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
  for (const [file, grouped] of fileGroups) sections.push([`### ${inlineCode(file)}`, ...grouped.map(formatDiffAnnotation)].join("\n\n"));
  return `${sections.join("\n\n")}\n`;
}

export function lineExcerpt(lines: ReadonlyMap<number, string>, side: DiffSide, start: number, end: number, maxLines = 40): string[] {
  const prefix = side === "additions" ? "+" : "-";
  const count = end - start + 1;
  const visibleEnd = Math.min(end, start + maxLines - 1);
  const excerpt: string[] = [];
  for (let line = start; line <= visibleEnd; line += 1) excerpt.push(`${prefix}${lines.get(line) ?? ""}`);
  if (count > maxLines) excerpt.push(`… ${count - maxLines} more selected lines`);
  return excerpt;
}
