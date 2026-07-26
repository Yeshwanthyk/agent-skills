export const DRAFT_VERSION = 1;
export const MAX_COMMENT_LENGTH = 10_000;
export const MAX_TEXT_SELECTION_LENGTH = 12_000;
export const MAX_DIFF_SELECTION_LINES = 200;

export type ReviewMode = "markdown" | "diff";
export type DiffSide = "additions" | "deletions";

export interface ReviewSession {
  version: 1;
  id: string;
  mode: ReviewMode;
  title: string;
  sourceLabel: string;
  content: string;
  createdAt: string;
}

export interface TextAnchor {
  kind: "text";
  start: number;
  end: number;
  quote: string;
  section?: string;
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

export type ReviewAnchor = TextAnchor | DiffAnchor;

export interface ReviewAnnotation {
  id: string;
  anchor: ReviewAnchor;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDraft {
  version: 1;
  annotations: ReviewAnnotation[];
}

export function normalizeComment(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

export function isReviewAnnotation(value: unknown): value is ReviewAnnotation {
  if (!value || typeof value !== "object") return false;
  const annotation = value as Partial<ReviewAnnotation>;
  if (
    typeof annotation.id !== "string" ||
    annotation.id.length === 0 ||
    annotation.id.length > 256 ||
    typeof annotation.comment !== "string" ||
    normalizeComment(annotation.comment).length === 0 ||
    annotation.comment.length > MAX_COMMENT_LENGTH ||
    typeof annotation.createdAt !== "string" ||
    annotation.createdAt.length > 64 ||
    typeof annotation.updatedAt !== "string" ||
    annotation.updatedAt.length > 64 ||
    !annotation.anchor ||
    typeof annotation.anchor !== "object"
  ) {
    return false;
  }

  const anchor = annotation.anchor as Partial<ReviewAnchor>;
  if (anchor.kind === "text") {
    return (
      Number.isSafeInteger(anchor.start) &&
      Number.isSafeInteger(anchor.end) &&
      (anchor.start as number) >= 0 &&
      (anchor.end as number) > (anchor.start as number) &&
      (anchor.end as number) - (anchor.start as number) <= MAX_TEXT_SELECTION_LENGTH &&
      typeof anchor.quote === "string" &&
      anchor.quote.length <= MAX_TEXT_SELECTION_LENGTH &&
      typeof anchor.before === "string" &&
      anchor.before.length <= 512 &&
      typeof anchor.after === "string" &&
      anchor.after.length <= 512 &&
      (anchor.section === undefined || (typeof anchor.section === "string" && anchor.section.length <= 512))
    );
  }

  if (anchor.kind === "diff") {
    return (
      typeof anchor.file === "string" &&
      anchor.file.length > 0 &&
      anchor.file.length <= 4_096 &&
      (anchor.side === "additions" || anchor.side === "deletions") &&
      Number.isSafeInteger(anchor.start) &&
      Number.isSafeInteger(anchor.end) &&
      (anchor.start as number) > 0 &&
      (anchor.end as number) >= (anchor.start as number) &&
      (anchor.end as number) - (anchor.start as number) < MAX_DIFF_SELECTION_LINES &&
      anchor.endSide === undefined &&
      Array.isArray(anchor.excerpt) &&
      anchor.excerpt.length <= 41 &&
      anchor.excerpt.every((line) => typeof line === "string" && line.length <= 20_000)
    );
  }

  return false;
}

export function parseDraft(raw: string | null): ReviewDraft {
  if (!raw) return { version: DRAFT_VERSION, annotations: [] };
  try {
    const value = JSON.parse(raw) as Partial<ReviewDraft>;
    if (value.version !== DRAFT_VERSION || !Array.isArray(value.annotations)) {
      return { version: DRAFT_VERSION, annotations: [] };
    }
    return {
      version: DRAFT_VERSION,
      annotations: value.annotations.filter(isReviewAnnotation),
    };
  } catch {
    return { version: DRAFT_VERSION, annotations: [] };
  }
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
  return anchor.section ? `${anchor.section} · “${clipped}”` : `“${clipped}”`;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function quoteBlock(value: string): string {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  return normalized
    .split("\n")
    .map((line) => `> ${line}`.trimEnd())
    .join("\n");
}

function indentBlock(value: string, spaces = 3): string {
  const indentation = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => `${indentation}${line}`.trimEnd())
    .join("\n");
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
  const anchor = annotation.anchor as TextAnchor;
  const location = anchor.section ? ` — ${anchor.section}` : "";
  return [
    `${index + 1}. **Selected text${location}**`,
    indentBlock(quoteBlock(anchor.quote)),
    "",
    indentBlock(annotation.comment),
  ].join("\n");
}

function formatDiffAnnotation(annotation: ReviewAnnotation, index: number): string {
  const anchor = annotation.anchor as DiffAnchor;
  const excerptText = anchor.excerpt.join("\n");
  const fence = codeFence(excerptText);
  const excerpt = anchor.excerpt.length > 0
    ? ["", indentBlock(`${fence}diff`), indentBlock(excerptText), indentBlock(fence)]
    : [];
  return [
    `${index + 1}. **Lines ${formatLineRange(anchor)}**`,
    ...excerpt,
    "",
    indentBlock(annotation.comment),
  ].join("\n");
}

export function formatFeedback(annotations: readonly ReviewAnnotation[]): string {
  if (annotations.length === 0) return "";

  const textAnnotations = annotations.filter((annotation) => annotation.anchor.kind === "text");
  const diffAnnotations = annotations.filter((annotation) => annotation.anchor.kind === "diff");
  const sections = ["## Review feedback"];

  if (textAnnotations.length > 0) {
    sections.push(
      ["### Assistant response", ...textAnnotations.map(formatTextAnnotation)].join("\n\n"),
    );
  }

  const byFile = new Map<string, ReviewAnnotation[]>();
  for (const annotation of diffAnnotations) {
    const anchor = annotation.anchor as DiffAnchor;
    const existing = byFile.get(anchor.file) ?? [];
    existing.push(annotation);
    byFile.set(anchor.file, existing);
  }
  for (const [file, fileAnnotations] of byFile) {
    sections.push(
      [`### ${inlineCode(file)}`, ...fileAnnotations.map(formatDiffAnnotation)].join("\n\n"),
    );
  }

  return `${sections.join("\n\n")}\n`;
}

export function lineExcerpt(
  lines: ReadonlyMap<number, string>,
  side: DiffSide,
  start: number,
  end: number,
  maxLines = 40,
): string[] {
  const prefix = side === "additions" ? "+" : "-";
  const count = end - start + 1;
  const visibleEnd = Math.min(end, start + maxLines - 1);
  const excerpt: string[] = [];
  for (let line = start; line <= visibleEnd; line += 1) {
    excerpt.push(`${prefix}${lines.get(line) ?? ""}`);
  }
  if (count > maxLines) excerpt.push(`… ${count - maxLines} more selected lines`);
  return excerpt;
}
