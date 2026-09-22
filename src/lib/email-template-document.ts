/**
 * Block document model for the Zoho-style email template builder.
 * Serializes to email-safe HTML with data-tb-* markers for round-trip editing.
 */

import { toEmailCssColor } from "@/lib/color";
import {
  TEMPLATE_VARIABLES,
  decorateMergeFieldsHtml,
  isMergeFieldVariant,
  mergeFieldChipHtmlFromVariant,
  mergeFieldVariantId,
} from "@/lib/email-content";

export type EmailTemplateBlockType =
  | "text"
  | "image"
  | "spacer"
  | "imageText"
  | "button"
  | "columns"
  | "grid"
  | "table"
  | "html";

/** Outer box chrome shared by content blocks (background, border, padding). */
export type BoxChromeFields = {
  backgroundColor: string;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
};

export const DEFAULT_BOX_CHROME: BoxChromeFields = {
  backgroundColor: "transparent",
  borderWidth: 0,
  borderColor: "#d4d4d8",
  borderRadius: 0,
  paddingX: 0,
  paddingY: 0,
};

export interface EmailTemplateTextBlock extends BoxChromeFields {
  id: string;
  type: "text";
  html: string;
  /** Fixed width in px; null = fill container. */
  width: number | null;
  /** Min height in px; null = auto. */
  height: number | null;
}

export interface EmailTemplateImageBlock {
  id: string;
  type: "image";
  src: string;
  alt: string;
  /**
   * How the image sizes in its container.
   * - `fit`: natural size, capped to container (default)
   * - `fill`: stretch to full container width
   */
  fit: ImageFitMode;
  /** Horizontal alignment when the image is narrower than its container. */
  align: ImageAlign;
  /** Optional click-through URL. Empty = not linked. */
  href: string;
  /** When linked, open in a new tab. */
  openInNewTab: boolean;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  paddingX: number;
  paddingY: number;
  width: number | null;
  height: number | null;
}

export const DEFAULT_IMAGE_STYLE = {
  fit: "fit" as ImageFitMode,
  align: "left" as ImageAlign,
  href: "",
  openInNewTab: false,
  borderRadius: 0,
  borderWidth: 0,
  borderColor: "#d4d4d8",
  paddingX: 0,
  paddingY: 0,
};

/** Image sizing relative to its column/block. */
export type ImageFitMode = "fit" | "fill";

/** Horizontal alignment for fit-content images. */
export type ImageAlign = "left" | "center" | "right";

export type ImageRenderOptions = {
  src: string;
  alt: string;
  fit: ImageFitMode;
  align: ImageAlign;
  href?: string;
  openInNewTab?: boolean;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  paddingX?: number;
  paddingY?: number;
  width?: number | null;
  height?: number | null;
};

export function parseImageFit(value: string | null | undefined): ImageFitMode {
  return value === "fill" ? "fill" : "fit";
}

export function parseImageAlign(value: string | null | undefined): ImageAlign {
  if (value === "center" || value === "right") return value;
  return "left";
}

/** Inline CSS for an `<img>` given fit + chrome options. */
export function imageElementCss(options: {
  fit: ImageFitMode;
  width?: number | null;
  height?: number | null;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}): string {
  const radius = Math.max(0, Math.round(options.borderRadius ?? 0));
  const borderWidth = Math.max(0, Math.round(options.borderWidth ?? 0));
  const borderColor = options.borderColor || DEFAULT_IMAGE_STYLE.borderColor;
  const parts = [
    borderWidth > 0
      ? `border:${borderWidth}px solid ${escapeAttr(toEmailCssColor(borderColor))}`
      : "border:0",
  ];
  if (radius > 0) parts.push(`border-radius:${radius}px`);

  if (options.width != null && options.width > 0) {
    parts.push(
      "display:inline-block",
      `width:${Math.round(options.width)}px`,
      "max-width:100%",
    );
    if (options.height != null && options.height > 0) {
      parts.push(`height:${Math.round(options.height)}px`);
    } else {
      parts.push("height:auto");
    }
    return parts.join(";");
  }
  if (options.fit === "fill") {
    parts.push("display:block", "width:100%", "max-width:100%", "height:auto");
  } else {
    parts.push(
      "display:inline-block",
      "width:auto",
      "max-width:100%",
      "height:auto",
    );
  }
  if (options.height != null && options.height > 0) {
    parts.push(`max-height:${Math.round(options.height)}px`);
  }
  return parts.join(";");
}

/** Wrap image markup so email clients honor horizontal alignment + padding. */
export function wrapAlignedImageHtml(
  imgHtml: string,
  align: ImageAlign = "left",
  paddingX = 0,
  paddingY = 0,
): string {
  const padX = Math.max(0, Math.round(paddingX));
  const padY = Math.max(0, Math.round(paddingY));
  const pad = padX > 0 || padY > 0 ? `padding:${padY}px ${padX}px;` : "";
  return `<div style="text-align:${align};${pad}">${imgHtml}</div>`;
}

function maybeLinkImageHtml(
  imgHtml: string,
  href: string | undefined,
  openInNewTab: boolean | undefined,
): string {
  const link = (href ?? "").trim();
  if (!link) return imgHtml;
  const target = openInNewTab
    ? ` target="_blank" rel="noopener noreferrer"`
    : "";
  return `<a href="${escapeAttr(link)}"${target} style="text-decoration:none;border:0;color:inherit;">${imgHtml}</a>`;
}

/** Full email-safe image inner HTML (link + align + chrome). */
export function renderImageMarkup(options: ImageRenderOptions): string {
  const src = options.src.trim();
  if (!src) return imagePlaceholderHtml();
  const img = `<img src="${escapeAttr(src)}" alt="${escapeAttr(options.alt)}" style="${imageElementCss(
    {
      fit: options.fit,
      width: options.width,
      height: options.height,
      borderRadius: options.borderRadius,
      borderWidth: options.borderWidth,
      borderColor: options.borderColor,
    },
  )};" />`;
  return wrapAlignedImageHtml(
    maybeLinkImageHtml(img, options.href, options.openInNewTab),
    parseImageAlign(options.align),
    options.paddingX ?? 0,
    options.paddingY ?? 0,
  );
}

/** React-friendly style object matching `imageElementCss`. */
export function imageElementStyle(options: {
  fit: ImageFitMode;
  width?: number | null;
  height?: number | null;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}): {
  display: "block" | "inline-block";
  border: string | 0;
  borderRadius?: number;
  width: string | number;
  maxWidth: "100%";
  height: string | number;
  maxHeight?: number;
} {
  const radius = Math.max(0, Math.round(options.borderRadius ?? 0));
  const borderWidth = Math.max(0, Math.round(options.borderWidth ?? 0));
  const borderColor = options.borderColor || DEFAULT_IMAGE_STYLE.borderColor;
  const border = borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 0;

  if (options.width != null && options.width > 0) {
    return {
      display: "inline-block",
      border,
      ...(radius > 0 ? { borderRadius: radius } : {}),
      width: Math.round(options.width),
      maxWidth: "100%",
      height:
        options.height != null && options.height > 0
          ? Math.round(options.height)
          : "auto",
    };
  }
  if (options.fit === "fill") {
    return {
      display: "block",
      border,
      ...(radius > 0 ? { borderRadius: radius } : {}),
      width: "100%",
      maxWidth: "100%",
      height: "auto",
      ...(options.height != null && options.height > 0
        ? { maxHeight: Math.round(options.height) }
        : {}),
    };
  }
  return {
    display: "inline-block",
    border,
    ...(radius > 0 ? { borderRadius: radius } : {}),
    width: "auto",
    maxWidth: "100%",
    height: "auto",
    ...(options.height != null && options.height > 0
      ? { maxHeight: Math.round(options.height) }
      : {}),
  };
}

function imageAttrsFromOptions(options: {
  alt: string;
  src: string;
  fit: ImageFitMode;
  align: ImageAlign;
  href?: string;
  openInNewTab?: boolean;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  paddingX?: number;
  paddingY?: number;
}): string {
  const href = (options.href ?? "").trim();
  return ` data-tb-alt="${escapeAttr(options.alt)}" data-tb-src="${escapeAttr(options.src)}" data-tb-fit="${options.fit}" data-tb-align="${options.align}" data-tb-href="${escapeAttr(href)}" data-tb-new-tab="${options.openInNewTab ? "1" : "0"}" data-tb-radius="${Math.max(0, Math.round(options.borderRadius ?? 0))}" data-tb-border-width="${Math.max(0, Math.round(options.borderWidth ?? 0))}" data-tb-border-color="${escapeAttr(options.borderColor || DEFAULT_IMAGE_STYLE.borderColor)}" data-tb-pad-x="${Math.max(0, Math.round(options.paddingX ?? 0))}" data-tb-pad-y="${Math.max(0, Math.round(options.paddingY ?? 0))}"`;
}

function parseImageFieldsFromEl(el: Element): {
  fit: ImageFitMode;
  align: ImageAlign;
  href: string;
  openInNewTab: boolean;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  paddingX: number;
  paddingY: number;
} {
  return {
    fit: parseImageFit(attr(el, "data-tb-fit")),
    align: parseImageAlign(attr(el, "data-tb-align")),
    href: attr(el, "data-tb-href"),
    openInNewTab: attr(el, "data-tb-new-tab") === "1",
    borderRadius: parseNumberAttr(el, "data-tb-radius", 0, 0, 64),
    borderWidth: parseNumberAttr(el, "data-tb-border-width", 0, 0, 12),
    borderColor:
      attr(el, "data-tb-border-color") || DEFAULT_IMAGE_STYLE.borderColor,
    paddingX: parseNumberAttr(el, "data-tb-pad-x", 0, 0, 80),
    paddingY: parseNumberAttr(el, "data-tb-pad-y", 0, 0, 80),
  };
}

export interface EmailTemplateSpacerBlock extends BoxChromeFields {
  id: string;
  type: "spacer";
  height: number;
  width: number | null;
}

export interface ImageTextImageChild {
  src: string;
  alt: string;
  fit: ImageFitMode;
  align: ImageAlign;
  href: string;
  openInNewTab: boolean;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  paddingX: number;
  paddingY: number;
}

export interface ImageTextTextChild {
  html: string;
}

export function defaultImageTextImage(
  overrides: Partial<ImageTextImageChild> = {},
): ImageTextImageChild {
  return {
    src: "",
    alt: "Image",
    ...DEFAULT_IMAGE_STYLE,
    ...overrides,
  };
}

/** Starter copy for new text blocks (real content, not a grey placeholder). */
export const DEFAULT_TEXT_BLOCK_HTML =
  '<p style="text-align:center;">This is a text block. Click here to edit it…</p>';

export const DEFAULT_HEADING_BLOCK_HTML =
  '<h2 style="text-align:center;">This is a heading. Click here to edit it…</h2>';

export function defaultImageTextText(
  overrides: Partial<ImageTextTextChild> = {},
): ImageTextTextChild {
  return {
    html: DEFAULT_TEXT_BLOCK_HTML,
    ...overrides,
  };
}

export interface EmailTemplateImageTextBlock extends BoxChromeFields {
  id: string;
  type: "imageText";
  imagePosition: "left" | "right";
  image: ImageTextImageChild;
  text: ImageTextTextChild;
  width: number | null;
  height: number | null;
}

export interface EmailTemplateButtonBlock {
  id: string;
  type: "button";
  label: string;
  href: string;
  align: "left" | "center" | "right";
  /** Fill background color. */
  backgroundColor: string;
  /** Label text color. */
  textColor: string;
  /** Corner radius in px. */
  borderRadius: number;
  /** Stroke color. */
  borderColor: string;
  /** Stroke width in px. */
  borderWidth: number;
  paddingX: number;
  paddingY: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: "400" | "500" | "600" | "700";
  width: number | null;
  height: number | null;
}

export const DEFAULT_BUTTON_STYLE = {
  backgroundColor: "#2563eb",
  textColor: "#ffffff",
  borderRadius: 4,
  borderColor: "#2563eb",
  borderWidth: 0,
  paddingX: 20,
  paddingY: 12,
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 14,
  fontWeight: "600" as const,
};

export const BUTTON_FONT_FAMILIES = [
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: "Tahoma, Geneva, sans-serif", label: "Tahoma" },
  { value: "Georgia, Times New Roman, serif", label: "Georgia" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { value: "'Courier New', Courier, monospace", label: "Courier New" },
] as const;

export type LayoutAlign = "left" | "center" | "right";
export type CellVerticalAlign = "top" | "middle" | "bottom";

export const COLUMN_LIMITS = {
  minColumns: 1,
  maxColumns: 6,
} as const;

export const DEFAULT_LAYOUT_CHROME = {
  ...DEFAULT_BOX_CHROME,
  /** Default vertical padding for column sections. */
  paddingY: 20,
  align: "left" as LayoutAlign,
  cellPadding: 0,
  cellVerticalAlign: "top" as CellVerticalAlign,
};

export function clampColumnCount(count: number): number {
  return Math.min(
    COLUMN_LIMITS.maxColumns,
    Math.max(COLUMN_LIMITS.minColumns, Math.round(count)),
  );
}

export function parseLayoutAlign(
  value: string | null | undefined,
): LayoutAlign {
  if (value === "center" || value === "right") return value;
  return "left";
}

export function parseCellVerticalAlign(
  value: string | null | undefined,
): CellVerticalAlign {
  if (value === "middle" || value === "bottom") return value;
  return "top";
}

export interface EmailTemplateColumnsBlock {
  id: string;
  type: "columns";
  /** One to six column HTML cells. */
  columns: string[];
  /**
   * Custom width percentages for each column, or `null` for equal/auto split.
   * When set, values ideally sum to 100.
   */
  columnWidths: number[] | null;
  /** Horizontal gap (px) between columns. */
  columnGap: number;
  /** Default vertical gap (px) between stacked items in a column. */
  itemGap: number;
  backgroundColor: string;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
  /** Whole block alignment on the page. */
  align: LayoutAlign;
  /** Inner padding (px) for each column cell. */
  cellPadding: number;
  cellVerticalAlign: CellVerticalAlign;
  width: number | null;
  height: number | null;
}

/** Even width split for `count` columns (remainder on the last column). */
export function equalColumnWidths(count: number): number[] {
  const n = clampColumnCount(count);
  if (n === 1) return [100];
  const base = Math.floor(100 / n);
  const widths = Array.from({ length: n }, () => base);
  widths[n - 1] = 100 - base * (n - 1);
  return widths;
}

function clampColumnWidthValue(value: number): number {
  return Number.isFinite(value)
    ? Math.max(1, Math.min(100, Math.round(value)))
    : 1;
}

/** Resolve effective widths (auto → equal). Preserves sums under 100 for centered leftovers. */
export function resolveColumnWidths(
  columnWidths: number[] | null | undefined,
  count: number,
): number[] {
  if (columnWidths == null) return equalColumnWidths(count);
  const n = clampColumnCount(count);
  if (columnWidths.length !== n) {
    return normalizeColumnWidths(columnWidths, n);
  }
  const clamped = columnWidths.map(clampColumnWidthValue);
  const sum = clamped.reduce((total, value) => total + value, 0);
  if (sum <= 0) return equalColumnWidths(n);
  if (sum > 100) return normalizeColumnWidths(clamped, n);
  return clamped;
}

/** Clamp/scale widths so they match `count` and sum to 100. */
export function normalizeColumnWidths(
  widths: number[] | undefined | null,
  count: number,
): number[] {
  const n = clampColumnCount(count);
  if (!widths || widths.length === 0) return equalColumnWidths(n);

  const source =
    widths.length === n
      ? widths
      : widths.length > n
        ? widths.slice(0, n)
        : equalColumnWidths(n);

  if (widths.length < n) return source;

  const clamped = source.map(clampColumnWidthValue);

  const sum = clamped.reduce((total, value) => total + value, 0);
  if (sum === 100) return clamped;
  if (sum <= 0) return equalColumnWidths(n);

  const scaled = clamped.map((value) =>
    Math.max(1, Math.round((value / sum) * 100)),
  );
  const scaledSum = scaled.reduce((total, value) => total + value, 0);
  scaled[n - 1] = Math.max(1, scaled[n - 1]! + (100 - scaledSum));
  return scaled;
}

function parseColumnWidthsAttr(el: Element, count: number): number[] | null {
  const raw = el.getAttribute("data-tb-column-widths");
  if (raw == null || raw === "" || raw === "auto") return null;
  const parsed = raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value));
  if (parsed.length === 0) return null;
  return resolveColumnWidths(parsed, count);
}

export const GRID_LIMITS = {
  minRows: 1,
  maxRows: 8,
  minColumns: 1,
  maxColumns: 6,
} as const;

export const DEFAULT_GRID_STYLE = {
  ...DEFAULT_LAYOUT_CHROME,
  paddingY: 0,
  columnGap: 16,
  rowGap: 16,
  itemGap: 12,
};

export interface EmailTemplateGridBlock {
  id: string;
  type: "grid";
  /** Number of rows (1–8). */
  rows: number;
  /** Number of columns (1–6). */
  columns: number;
  /** Flat cell HTML in row-major order; length = rows × columns. */
  cells: string[];
  /** Custom column width percentages, or `null` for equal/auto. */
  columnWidths: number[] | null;
  /** Custom row height percentages, or `null` for equal/auto. */
  rowHeights: number[] | null;
  /** Horizontal gap (px) between columns. */
  columnGap: number;
  /** Vertical gap (px) between rows. */
  rowGap: number;
  /** Default vertical gap (px) between stacked items in a cell. */
  itemGap: number;
  /** Inner padding (px) for each cell. */
  cellPadding: number;
  backgroundColor: string;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
  align: LayoutAlign;
  cellVerticalAlign: CellVerticalAlign;
  width: number | null;
  height: number | null;
}

/** Even percentage split for `count` tracks (remainder on the last). */
export function equalTrackSizes(count: number): number[] {
  const n = Math.max(1, Math.round(count));
  const base = Math.floor(100 / n);
  const sizes = Array.from({ length: n }, () => base);
  sizes[n - 1] = 100 - base * (n - 1);
  return sizes;
}

/** Clamp/scale track sizes so they match `count` and sum to 100. */
export function normalizeTrackSizes(
  sizes: number[] | undefined | null,
  count: number,
): number[] {
  const n = Math.max(1, Math.round(count));
  if (!sizes || sizes.length === 0) return equalTrackSizes(n);

  const source =
    sizes.length === n
      ? sizes
      : sizes.length > n
        ? sizes.slice(0, n)
        : equalTrackSizes(n);

  if (sizes.length < n) return source;

  const clamped = source.map((value) =>
    Number.isFinite(value) ? Math.max(1, Math.min(99, Math.round(value))) : 1,
  );

  const sum = clamped.reduce((total, value) => total + value, 0);
  if (sum === 100) return clamped;
  if (sum <= 0) return equalTrackSizes(n);

  const scaled = clamped.map((value) =>
    Math.max(1, Math.round((value / sum) * 100)),
  );
  const scaledSum = scaled.reduce((total, value) => total + value, 0);
  scaled[n - 1] = Math.max(1, scaled[n - 1]! + (100 - scaledSum));
  return scaled;
}

export function resolveTrackSizes(
  sizes: number[] | null | undefined,
  count: number,
): number[] {
  if (sizes == null) return equalTrackSizes(count);
  return normalizeTrackSizes(sizes, count);
}

export function clampGridRows(rows: number): number {
  return Math.min(
    GRID_LIMITS.maxRows,
    Math.max(GRID_LIMITS.minRows, Math.round(rows)),
  );
}

export function clampGridColumns(columns: number): number {
  return Math.min(
    GRID_LIMITS.maxColumns,
    Math.max(GRID_LIMITS.minColumns, Math.round(columns)),
  );
}

export function gridCellIndex(
  rowIndex: number,
  columnIndex: number,
  columns: number,
): number {
  return rowIndex * columns + columnIndex;
}

export function emptyGridCells(rows: number, columns: number): string[] {
  return Array.from(
    { length: clampGridRows(rows) * clampGridColumns(columns) },
    () => "<p><br /></p>",
  );
}

function parseTrackSizesAttr(
  el: Element,
  attrName: string,
  count: number,
): number[] | null {
  const raw = el.getAttribute(attrName);
  if (raw == null || raw === "" || raw === "auto") return null;
  const parsed = raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value));
  if (parsed.length === 0) return null;
  return normalizeTrackSizes(parsed, count);
}

export const DEFAULT_TABLE_STYLE = {
  headerBackgroundColor: "#e4e4e7",
  headerTextColor: "#18181b",
  cellBackgroundColor: "#ffffff",
  cellTextColor: "#18181b",
  borderColor: "#d4d4d8",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 14,
  fontWeight: "400" as const,
  headerFontWeight: "600" as const,
  cellPadding: 8,
};

export interface EmailTemplateTableBlock {
  id: string;
  type: "table";
  rows: string[][];
  headerBackgroundColor: string;
  headerTextColor: string;
  cellBackgroundColor: string;
  cellTextColor: string;
  /** Cell grid stroke color (not the outer box). */
  borderColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "400" | "500" | "600" | "700";
  headerFontWeight: "400" | "500" | "600" | "700";
  cellPadding: number;
  /** Outer block chrome (background / padding / frame). */
  boxChrome: BoxChromeFields;
  width: number | null;
  height: number | null;
}

/** Legacy freeform HTML when a template has no block markers. */
export interface EmailTemplateHtmlBlock extends BoxChromeFields {
  id: string;
  type: "html";
  html: string;
  width: number | null;
  height: number | null;
}

export type EmailTemplateBlock =
  | EmailTemplateTextBlock
  | EmailTemplateImageBlock
  | EmailTemplateSpacerBlock
  | EmailTemplateImageTextBlock
  | EmailTemplateButtonBlock
  | EmailTemplateColumnsBlock
  | EmailTemplateGridBlock
  | EmailTemplateTableBlock
  | EmailTemplateHtmlBlock;

export interface EmailTemplateDocument {
  /** Outer page / email client chrome background color. */
  backgroundColor: string;
  /** Optional page background image URL. */
  backgroundImage: string;
  backgroundSize: BackgroundSize;
  backgroundPosition: BackgroundPosition;
  /** Inner email content card background. */
  contentBackgroundColor: string;
  /** Content card padding (page margins), px. */
  pageMarginTop: number;
  pageMarginRight: number;
  pageMarginBottom: number;
  pageMarginLeft: number;
  /** Optional email header band above body blocks. */
  header: EmailTemplatePageBand | null;
  /** Optional email footer band below body blocks. */
  footer: EmailTemplatePageBand | null;
  blocks: EmailTemplateBlock[];
}

export type BackgroundSize = "cover" | "contain" | "auto";
export type BackgroundPosition = "center" | "top" | "bottom" | "left" | "right";

export type PageBandAlign = "left" | "center" | "right";

/** Header or footer chrome band (not a normal canvas block). */
export interface EmailTemplatePageBand {
  html: string;
  backgroundColor: string;
  paddingX: number;
  paddingY: number;
  /** Divider under header / over footer. */
  borderWidth: number;
  borderColor: string;
  align: PageBandAlign;
}

/** Flat white page by default (digest-style); customize for a colored canvas. */
export const DEFAULT_DOCUMENT_BACKGROUND = "#ffffff";
export const DEFAULT_CONTENT_BACKGROUND = "#ffffff";
export const DEFAULT_PAGE_MARGIN = 0;

/** True when page and content backgrounds match (no floating card canvas). */
export function isFlatPageDocument(doc: {
  backgroundColor?: string | null;
  contentBackgroundColor?: string | null;
}): boolean {
  const page = (doc.backgroundColor || DEFAULT_DOCUMENT_BACKGROUND)
    .trim()
    .toLowerCase();
  const content = (doc.contentBackgroundColor || DEFAULT_CONTENT_BACKGROUND)
    .trim()
    .toLowerCase();
  return page === content;
}

export const DEFAULT_PAGE_BAND_STYLE = {
  backgroundColor: "transparent",
  paddingX: 0,
  paddingY: 12,
  borderWidth: 0,
  borderColor: "#e4e4e7",
  align: "left" as PageBandAlign,
};

export function defaultHeaderBand(): EmailTemplatePageBand {
  return {
    html: "<p><strong>Header</strong></p>",
    ...DEFAULT_PAGE_BAND_STYLE,
    borderWidth: 1,
  };
}

export function defaultFooterBand(): EmailTemplatePageBand {
  return {
    html: '<p style="font-size:12px;color:#71717a;">Footer · Unsubscribe</p>',
    ...DEFAULT_PAGE_BAND_STYLE,
    align: "center",
    borderWidth: 1,
  };
}

export function defaultDocumentChrome(
  backgroundColor = DEFAULT_DOCUMENT_BACKGROUND,
): Omit<EmailTemplateDocument, "blocks"> {
  return {
    backgroundColor,
    backgroundImage: "",
    backgroundSize: "cover",
    backgroundPosition: "center",
    contentBackgroundColor: DEFAULT_CONTENT_BACKGROUND,
    pageMarginTop: DEFAULT_PAGE_MARGIN,
    pageMarginRight: DEFAULT_PAGE_MARGIN,
    pageMarginBottom: DEFAULT_PAGE_MARGIN,
    pageMarginLeft: DEFAULT_PAGE_MARGIN,
    header: null,
    footer: null,
  };
}

export function parseBackgroundSize(
  value: string | null | undefined,
): BackgroundSize {
  if (value === "contain" || value === "auto") return value;
  return "cover";
}

export function parseBackgroundPosition(
  value: string | null | undefined,
): BackgroundPosition {
  if (
    value === "top" ||
    value === "bottom" ||
    value === "left" ||
    value === "right"
  ) {
    return value;
  }
  return "center";
}

/** CSS for the outer email / canvas page background. */
export function documentPageBackgroundStyle(doc: {
  backgroundColor: string;
  backgroundImage?: string;
  backgroundSize?: BackgroundSize;
  backgroundPosition?: BackgroundPosition;
}): {
  backgroundColor: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
} {
  const image = (doc.backgroundImage ?? "").trim();
  if (!image) {
    return { backgroundColor: doc.backgroundColor };
  }
  return {
    backgroundColor: doc.backgroundColor,
    backgroundImage: `url(${image})`,
    backgroundSize: doc.backgroundSize ?? "cover",
    backgroundPosition: doc.backgroundPosition ?? "center",
    backgroundRepeat: "no-repeat",
  };
}

function documentPageBackgroundCss(doc: EmailTemplateDocument): string {
  const color = toEmailCssColor(doc.backgroundColor);
  const image = doc.backgroundImage.trim();
  const parts = [`background-color:${escapeAttr(color)}`];
  if (image) {
    parts.push(
      `background-image:url(${escapeAttr(image)})`,
      `background-size:${doc.backgroundSize || "cover"}`,
      `background-position:${doc.backgroundPosition || "center"}`,
      "background-repeat:no-repeat",
    );
  } else {
    parts.push(`background:${escapeAttr(color)}`);
  }
  return parts.join(";");
}

function clampPageMargin(
  value: number | null | undefined,
  fallback = DEFAULT_PAGE_MARGIN,
): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.min(120, Math.max(0, Math.round(value)));
}

export function resolvePageMargins(doc: {
  pageMarginTop?: number;
  pageMarginRight?: number;
  pageMarginBottom?: number;
  pageMarginLeft?: number;
}): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  return {
    top: clampPageMargin(doc.pageMarginTop),
    right: clampPageMargin(doc.pageMarginRight),
    bottom: clampPageMargin(doc.pageMarginBottom),
    left: clampPageMargin(doc.pageMarginLeft),
  };
}

/** Inline CSS padding for the content card from page margins. */
export function documentContentPaddingCss(doc: {
  pageMarginTop?: number;
  pageMarginRight?: number;
  pageMarginBottom?: number;
  pageMarginLeft?: number;
}): string {
  const m = resolvePageMargins(doc);
  return `padding:${m.top}px ${m.right}px ${m.bottom}px ${m.left}px`;
}

export function documentContentPaddingStyle(doc: {
  pageMarginTop?: number;
  pageMarginRight?: number;
  pageMarginBottom?: number;
  pageMarginLeft?: number;
}): {
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
} {
  const m = resolvePageMargins(doc);
  return {
    paddingTop: m.top,
    paddingRight: m.right,
    paddingBottom: m.bottom,
    paddingLeft: m.left,
  };
}

function parsePageBandAlign(value: string | null | undefined): PageBandAlign {
  if (value === "center" || value === "right") return value;
  return "left";
}

function serializePageBand(
  band: EmailTemplatePageBand,
  role: "header" | "footer",
): string {
  const bg = band.backgroundColor.trim();
  const padX = Math.max(0, Math.round(band.paddingX));
  const padY = Math.max(0, Math.round(band.paddingY));
  const borderW = Math.max(0, Math.round(band.borderWidth));
  const borderColor = toEmailCssColor(band.borderColor || "#e4e4e7");
  const borderSide = role === "header" ? "border-bottom" : "border-top";
  const styles = [`text-align:${band.align}`, `padding:${padY}px ${padX}px`];
  if (bg && bg !== "transparent") {
    styles.push(`background:${escapeAttr(toEmailCssColor(bg))}`);
  }
  if (borderW > 0) {
    styles.push(`${borderSide}:${borderW}px solid ${escapeAttr(borderColor)}`);
  }
  return `<div data-tb-${role}="1" data-tb-${role}-bg="${escapeAttr(band.backgroundColor)}" data-tb-${role}-pad-x="${padX}" data-tb-${role}-pad-y="${padY}" data-tb-${role}-border="${borderW}" data-tb-${role}-border-color="${escapeAttr(band.borderColor)}" data-tb-${role}-align="${band.align}" style="${styles.join(";")}">${band.html || "<p><br /></p>"}</div>`;
}

function parsePageBand(
  el: Element | null,
  role: "header" | "footer",
): EmailTemplatePageBand | null {
  if (!el) return null;
  return {
    html: decorateMergeFieldsHtml(el.innerHTML || "<p><br /></p>"),
    backgroundColor:
      attr(el, `data-tb-${role}-bg`) || DEFAULT_PAGE_BAND_STYLE.backgroundColor,
    paddingX: parseNumberAttr(
      el,
      `data-tb-${role}-pad-x`,
      DEFAULT_PAGE_BAND_STYLE.paddingX,
      0,
      80,
    ),
    paddingY: parseNumberAttr(
      el,
      `data-tb-${role}-pad-y`,
      DEFAULT_PAGE_BAND_STYLE.paddingY,
      0,
      80,
    ),
    borderWidth: parseNumberAttr(
      el,
      `data-tb-${role}-border`,
      DEFAULT_PAGE_BAND_STYLE.borderWidth,
      0,
      20,
    ),
    borderColor:
      attr(el, `data-tb-${role}-border-color`) ||
      DEFAULT_PAGE_BAND_STYLE.borderColor,
    align: parsePageBandAlign(attr(el, `data-tb-${role}-align`)),
  };
}

function documentChromeAttrs(doc: EmailTemplateDocument): string {
  const m = resolvePageMargins(doc);
  return ` data-tb-bg="${escapeAttr(doc.backgroundColor)}" data-tb-bg-image="${escapeAttr(doc.backgroundImage)}" data-tb-bg-size="${doc.backgroundSize}" data-tb-bg-position="${doc.backgroundPosition}" data-tb-content-bg="${escapeAttr(doc.contentBackgroundColor)}" data-tb-margin="${m.top},${m.right},${m.bottom},${m.left}"`;
}

function parseDocumentChrome(
  el: Element | null,
  fallbackBackground: string,
): Omit<EmailTemplateDocument, "blocks"> {
  if (!el) return defaultDocumentChrome(fallbackBackground);
  const marginRaw = attr(el, "data-tb-margin");
  const marginParts = marginRaw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value));
  const [top, right, bottom, left] =
    marginParts.length === 4
      ? marginParts
      : [
          DEFAULT_PAGE_MARGIN,
          DEFAULT_PAGE_MARGIN,
          DEFAULT_PAGE_MARGIN,
          DEFAULT_PAGE_MARGIN,
        ];

  const canvas =
    el.querySelector(":scope > [data-tb-canvas]") ??
    el.querySelector(":scope > div");
  const headerEl =
    canvas?.querySelector(
      ":scope > [data-tb-header], :scope > [data-tb-content-col] > [data-tb-header]",
    ) ?? el.querySelector(":scope > [data-tb-header]");
  const footerEl =
    canvas?.querySelector(
      ":scope > [data-tb-footer], :scope > [data-tb-content-col] > [data-tb-footer]",
    ) ?? el.querySelector(":scope > [data-tb-footer]");

  return {
    backgroundColor: attr(el, "data-tb-bg") || fallbackBackground,
    backgroundImage: attr(el, "data-tb-bg-image"),
    backgroundSize: parseBackgroundSize(attr(el, "data-tb-bg-size")),
    backgroundPosition: parseBackgroundPosition(
      attr(el, "data-tb-bg-position"),
    ),
    contentBackgroundColor:
      attr(el, "data-tb-content-bg") || DEFAULT_CONTENT_BACKGROUND,
    pageMarginTop: clampPageMargin(top),
    pageMarginRight: clampPageMargin(right),
    pageMarginBottom: clampPageMargin(bottom),
    pageMarginLeft: clampPageMargin(left),
    header: parsePageBand(headerEl, "header"),
    footer: parsePageBand(footerEl, "footer"),
  };
}

/** Shared auto-size defaults (null = fill / auto). */
export const AUTO_SIZE = { width: null, height: null } as const;

/** Read the box width/height used by the canvas resize chrome. */
export function getBlockBoxSize(block: EmailTemplateBlock): {
  width: number | null;
  height: number | null;
} {
  if (block.type === "spacer") {
    return { width: block.width, height: block.height };
  }
  return {
    width: "width" in block ? block.width : null,
    height: "height" in block ? block.height : null,
  };
}

export function createBlockId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyDocument(
  backgroundColor = DEFAULT_DOCUMENT_BACKGROUND,
): EmailTemplateDocument {
  return { ...defaultDocumentChrome(backgroundColor), blocks: [] };
}

export function createDefaultBlock(
  type: Exclude<EmailTemplateBlockType, "html">,
): EmailTemplateBlock {
  const id = createBlockId();
  switch (type) {
    case "text":
      return {
        id,
        type: "text",
        html: DEFAULT_TEXT_BLOCK_HTML,
        ...DEFAULT_BOX_CHROME,
        ...AUTO_SIZE,
      };
    case "image":
      return {
        id,
        type: "image",
        src: "",
        alt: "Image",
        ...DEFAULT_IMAGE_STYLE,
        ...AUTO_SIZE,
      };
    case "spacer":
      return {
        id,
        type: "spacer",
        height: 24,
        width: null,
        ...DEFAULT_BOX_CHROME,
      };
    case "imageText":
      return {
        id,
        type: "imageText",
        imagePosition: "left",
        image: defaultImageTextImage(),
        text: defaultImageTextText(),
        ...DEFAULT_BOX_CHROME,
        ...AUTO_SIZE,
      };
    case "button":
      return {
        id,
        type: "button",
        label: "Click here",
        href: "https://",
        align: "center",
        ...DEFAULT_BUTTON_STYLE,
        ...AUTO_SIZE,
      };
    case "columns":
      return {
        id,
        type: "columns",
        columns: ["<p><br /></p>", "<p><br /></p>"],
        columnWidths: null,
        columnGap: 24,
        itemGap: 12,
        ...DEFAULT_LAYOUT_CHROME,
        ...AUTO_SIZE,
      };
    case "grid":
      return {
        id,
        type: "grid",
        rows: 2,
        columns: 2,
        cells: emptyGridCells(2, 2),
        columnWidths: null,
        rowHeights: null,
        ...DEFAULT_GRID_STYLE,
        ...AUTO_SIZE,
      };
    case "table":
      return {
        id,
        type: "table",
        rows: [
          ["Header 1", "Header 2"],
          ["Cell", "Cell"],
        ],
        ...DEFAULT_TABLE_STYLE,
        boxChrome: { ...DEFAULT_BOX_CHROME },
        ...AUTO_SIZE,
      };
  }
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const IMAGE_PLACEHOLDER_STYLE =
  "height:120px;max-width:100%;box-sizing:border-box;background:#e4e4e7;color:#71717a;text-align:center;line-height:120px;font-family:sans-serif;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 8px;";

function imagePlaceholderHtml(label = "Add image URL", height = 120): string {
  const style = IMAGE_PLACEHOLDER_STYLE.replace(/120px/g, `${height}px`);
  return `<div style="${style}">${escapeAttr(label)}</div>`;
}

function stripHtmlToText(html: string): string {
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = html;
    return (el.textContent ?? "").replace(/\s+/g, " ").trim();
  }
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sizeAttrsFromBlock(block: {
  width?: number | null;
  height?: number | null;
  align?: LayoutAlign;
}): { attrs: string; style: string } {
  const parts: string[] = [];
  const styles: string[] = ["margin:0 0 16px;"];
  if (block.width != null && block.width > 0) {
    parts.push(` data-tb-width="${block.width}"`);
    styles.push(`width:${block.width}px;max-width:100%;`);
  }
  if (block.height != null && block.height > 0) {
    parts.push(` data-tb-height="${block.height}"`);
    styles.push(`min-height:${block.height}px;`);
  }
  if (block.align === "center") {
    styles.push("margin-left:auto;margin-right:auto;");
  } else if (block.align === "right") {
    styles.push("margin-left:auto;margin-right:0;");
  }
  return { attrs: parts.join(""), style: styles.join("") };
}

type LayoutChromeFields = BoxChromeFields & {
  align: LayoutAlign;
  cellPadding: number;
  cellVerticalAlign: CellVerticalAlign;
};

export function boxChromeStyleParts(chrome: BoxChromeFields): string[] {
  const bg = toEmailCssColor(chrome.backgroundColor);
  const stroke = toEmailCssColor(chrome.borderColor);
  const borderWidth = Math.max(0, Math.round(chrome.borderWidth));
  const radius = Math.max(0, Math.round(chrome.borderRadius));
  const padX = Math.max(0, Math.round(chrome.paddingX));
  const padY = Math.max(0, Math.round(chrome.paddingY));
  return [
    `background:${escapeAttr(bg)}`,
    borderWidth > 0
      ? `border:${borderWidth}px solid ${escapeAttr(stroke)}`
      : "border:0",
    radius > 0 ? `border-radius:${radius}px` : null,
    `padding:${padY}px ${padX}px`,
    "box-sizing:border-box",
  ].filter(Boolean) as string[];
}

/** CSS style object for canvas / preview rendering. */
export function boxChromeCssStyle(
  chrome: BoxChromeFields,
): Record<string, string | number> {
  const borderWidth = Math.max(0, Math.round(chrome.borderWidth));
  const radius = Math.max(0, Math.round(chrome.borderRadius));
  const padX = Math.max(0, Math.round(chrome.paddingX));
  const padY = Math.max(0, Math.round(chrome.paddingY));
  return {
    backgroundColor: chrome.backgroundColor || "transparent",
    border:
      borderWidth > 0
        ? `${borderWidth}px solid ${chrome.borderColor || DEFAULT_BOX_CHROME.borderColor}`
        : "0",
    borderRadius: radius,
    padding: `${padY}px ${padX}px`,
    boxSizing: "border-box",
  };
}

function boxChromeAttrs(chrome: BoxChromeFields): string {
  return ` data-tb-box-bg="${escapeAttr(chrome.backgroundColor)}" data-tb-box-border-width="${Math.max(0, Math.round(chrome.borderWidth))}" data-tb-box-border-color="${escapeAttr(chrome.borderColor)}" data-tb-box-radius="${Math.max(0, Math.round(chrome.borderRadius))}" data-tb-box-pad-x="${Math.max(0, Math.round(chrome.paddingX))}" data-tb-box-pad-y="${Math.max(0, Math.round(chrome.paddingY))}"`;
}

export function parseBoxChromeFromEl(el: Element): BoxChromeFields {
  return {
    backgroundColor:
      attr(el, "data-tb-box-bg") || DEFAULT_BOX_CHROME.backgroundColor,
    borderWidth: parseNumberAttr(el, "data-tb-box-border-width", 0, 0, 12),
    borderColor:
      attr(el, "data-tb-box-border-color") || DEFAULT_BOX_CHROME.borderColor,
    borderRadius: parseNumberAttr(el, "data-tb-box-radius", 0, 0, 64),
    paddingX: parseNumberAttr(el, "data-tb-box-pad-x", 0, 0, 80),
    paddingY: parseNumberAttr(el, "data-tb-box-pad-y", 0, 0, 80),
  };
}

export function blockHasBoxChrome(block: EmailTemplateBlock): boolean {
  return (
    block.type === "text" ||
    block.type === "html" ||
    block.type === "spacer" ||
    block.type === "imageText" ||
    block.type === "table"
  );
}

/** Resolve outer box chrome for blocks that support it. */
export function getBlockBoxChrome(
  block: EmailTemplateBlock,
): BoxChromeFields | null {
  if (block.type === "table") {
    return block.boxChrome ?? { ...DEFAULT_BOX_CHROME };
  }
  if (
    block.type === "text" ||
    block.type === "html" ||
    block.type === "spacer" ||
    block.type === "imageText"
  ) {
    return {
      backgroundColor:
        block.backgroundColor ?? DEFAULT_BOX_CHROME.backgroundColor,
      borderWidth: block.borderWidth ?? 0,
      borderColor: block.borderColor ?? DEFAULT_BOX_CHROME.borderColor,
      borderRadius: block.borderRadius ?? 0,
      paddingX: block.paddingX ?? 0,
      paddingY: block.paddingY ?? 0,
    };
  }
  return null;
}

function layoutChromeStyleParts(chrome: LayoutChromeFields): string[] {
  return boxChromeStyleParts(chrome);
}

function layoutChromeAttrs(chrome: LayoutChromeFields): string {
  return ` data-tb-bg="${escapeAttr(chrome.backgroundColor)}" data-tb-border-width="${Math.max(0, Math.round(chrome.borderWidth))}" data-tb-border-color="${escapeAttr(chrome.borderColor)}" data-tb-radius="${Math.max(0, Math.round(chrome.borderRadius))}" data-tb-pad-x="${Math.max(0, Math.round(chrome.paddingX))}" data-tb-pad-y="${Math.max(0, Math.round(chrome.paddingY))}" data-tb-align="${chrome.align}" data-tb-cell-pad="${Math.max(0, Math.round(chrome.cellPadding))}" data-tb-cell-valign="${chrome.cellVerticalAlign}"`;
}

function parseLayoutChromeFromEl(el: Element): LayoutChromeFields {
  return {
    backgroundColor:
      attr(el, "data-tb-bg") || DEFAULT_LAYOUT_CHROME.backgroundColor,
    borderWidth: parseNumberAttr(el, "data-tb-border-width", 0, 0, 12),
    borderColor:
      attr(el, "data-tb-border-color") || DEFAULT_LAYOUT_CHROME.borderColor,
    borderRadius: parseNumberAttr(el, "data-tb-radius", 0, 0, 64),
    paddingX: parseNumberAttr(el, "data-tb-pad-x", 0, 0, 80),
    paddingY: parseNumberAttr(el, "data-tb-pad-y", 0, 0, 80),
    align: parseLayoutAlign(attr(el, "data-tb-align")),
    cellPadding: parseNumberAttr(el, "data-tb-cell-pad", 0, 0, 80),
    cellVerticalAlign: parseCellVerticalAlign(attr(el, "data-tb-cell-valign")),
  };
}

function wrapLayoutChrome(
  chrome: LayoutChromeFields,
  tableHtml: string,
): string {
  const parts = layoutChromeStyleParts(chrome);
  return `<div data-tb-layout-chrome="1" style="${parts.join(";")}">${tableHtml}</div>`;
}

function wrapContentColumn(inner: string, paddingCss = ""): string {
  const pad = paddingCss ? `${paddingCss};` : "";
  return `<div data-tb-content-col="1" style="max-width:600px;margin:0 auto;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;${pad}">${inner}</div>`;
}

function blockOuter(
  block: EmailTemplateBlock,
  inner: string,
  extraAttrs = "",
): string {
  const sized =
    block.type === "spacer"
      ? {
          attrs:
            block.width != null && block.width > 0
              ? ` data-tb-width="${block.width}"`
              : "",
          style:
            block.width != null && block.width > 0
              ? `margin:0 0 16px;width:${block.width}px;max-width:100%;`
              : "margin:0 0 16px;",
        }
      : sizeAttrsFromBlock(block);
  const chrome = getBlockBoxChrome(block);
  const box = chrome
    ? {
        attrs: boxChromeAttrs(chrome),
        style: `${boxChromeStyleParts(chrome).join(";")};`,
      }
    : { attrs: "", style: "" };
  return `<div data-tb-block="${block.type}" data-tb-id="${escapeAttr(block.id)}"${sized.attrs}${box.attrs}${extraAttrs} style="${sized.style}${box.style}">${inner}</div>`;
}

function serializeBlock(block: EmailTemplateBlock): string {
  switch (block.type) {
    case "text":
      return blockOuter(block, block.html || "<p><br /></p>");
    case "image": {
      const src = block.src.trim();
      const inner = renderImageMarkup({
        src,
        alt: block.alt,
        fit: block.fit ?? "fit",
        align: parseImageAlign(block.align),
        href: block.href,
        openInNewTab: block.openInNewTab,
        borderRadius: block.borderRadius,
        borderWidth: block.borderWidth,
        borderColor: block.borderColor,
        paddingX: block.paddingX,
        paddingY: block.paddingY,
        width: block.width,
        height: block.height,
      });
      return blockOuter(
        block,
        inner,
        imageAttrsFromOptions({
          alt: block.alt,
          src,
          fit: block.fit ?? "fit",
          align: parseImageAlign(block.align),
          href: block.href,
          openInNewTab: block.openInNewTab,
          borderRadius: block.borderRadius,
          borderWidth: block.borderWidth,
          borderColor: block.borderColor,
          paddingX: block.paddingX,
          paddingY: block.paddingY,
        }),
      );
    }
    case "spacer":
      return blockOuter(
        block,
        `<div style="height:${block.height}px;line-height:${block.height}px;font-size:0;">&nbsp;</div>`,
        ` data-tb-height="${block.height}"`,
      );
    case "imageText": {
      const src = block.image.src.trim();
      const imgCell = renderImageMarkup({
        src,
        alt: block.image.alt,
        fit: block.image.fit ?? "fit",
        align: parseImageAlign(block.image.align),
        href: block.image.href,
        openInNewTab: block.image.openInNewTab,
        borderRadius: block.image.borderRadius,
        borderWidth: block.image.borderWidth,
        borderColor: block.image.borderColor,
        paddingX: block.image.paddingX,
        paddingY: block.image.paddingY,
      });
      const textCell = block.text.html || "<p><br /></p>";
      const left = block.imagePosition === "left" ? imgCell : textCell;
      const right = block.imagePosition === "left" ? textCell : imgCell;
      const inner = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
<td width="48%" valign="top" style="padding-right:12px;">${left}</td>
<td width="52%" valign="top" style="padding-left:12px;">${right}</td>
</tr></table>`;
      return blockOuter(
        block,
        inner,
        `${imageAttrsFromOptions({
          alt: block.image.alt,
          src,
          fit: block.image.fit ?? "fit",
          align: parseImageAlign(block.image.align),
          href: block.image.href,
          openInNewTab: block.image.openInNewTab,
          borderRadius: block.image.borderRadius,
          borderWidth: block.image.borderWidth,
          borderColor: block.image.borderColor,
          paddingX: block.image.paddingX,
          paddingY: block.image.paddingY,
        })} data-tb-image-position="${block.imagePosition}"`,
      );
    }
    case "button": {
      const align =
        block.align === "left"
          ? "left"
          : block.align === "right"
            ? "right"
            : "center";
      const bg = toEmailCssColor(block.backgroundColor);
      const fg = toEmailCssColor(block.textColor);
      const stroke = toEmailCssColor(block.borderColor);
      const border =
        block.borderWidth > 0
          ? `border:${block.borderWidth}px solid ${escapeAttr(stroke)};`
          : "border:0;";
      const inner = `<div style="text-align:${align};"><a href="${escapeAttr(block.href)}" style="display:inline-block;background:${escapeAttr(bg)};color:${escapeAttr(fg)};text-decoration:none;padding:${block.paddingY}px ${block.paddingX}px;border-radius:${block.borderRadius}px;${border}font-family:${escapeAttr(block.fontFamily)};font-size:${block.fontSize}px;font-weight:${escapeAttr(block.fontWeight)};line-height:1.2;">${escapeAttr(block.label)}</a></div>`;
      return blockOuter(
        block,
        inner,
        ` data-tb-label="${escapeAttr(block.label)}" data-tb-href="${escapeAttr(block.href)}" data-tb-align="${block.align}" data-tb-bg="${escapeAttr(block.backgroundColor)}" data-tb-color="${escapeAttr(block.textColor)}" data-tb-radius="${block.borderRadius}" data-tb-border-color="${escapeAttr(block.borderColor)}" data-tb-border-width="${block.borderWidth}" data-tb-pad-x="${block.paddingX}" data-tb-pad-y="${block.paddingY}" data-tb-font-family="${escapeAttr(block.fontFamily)}" data-tb-font-size="${block.fontSize}" data-tb-font-weight="${escapeAttr(block.fontWeight)}"`,
      );
    }
    case "columns": {
      const count = clampColumnCount(block.columns.length);
      const widths = resolveColumnWidths(block.columnWidths, count);
      const widthSum = widths.reduce((total, value) => total + value, 0);
      const gap = Math.max(0, Math.round(block.columnGap ?? 24));
      const cellPad = Math.max(0, Math.round(block.cellPadding ?? 0));
      const valign = block.cellVerticalAlign ?? "top";
      const cells = Array.from({ length: count }, (_, index) => {
        const rightGap = index < count - 1 ? gap : 0;
        const padTop = cellPad;
        const padBottom = cellPad;
        const padLeft = cellPad;
        const padRight = cellPad + rightGap;
        const style =
          padTop || padRight || padBottom || padLeft
            ? `padding:${padTop}px ${padRight}px ${padBottom}px ${padLeft}px;`
            : "";
        const cellHtml = serializeColumnItems(
          parseColumnItems(block.columns[index] || EMPTY_COLUMN_HTML),
          block.itemGap ?? 12,
        );
        const cellWidth =
          widthSum < 100 && widthSum > 0
            ? Math.max(1, Math.round((widths[index]! / widthSum) * 100))
            : widths[index]!;
        return `<td width="${cellWidth}%" valign="${valign}" data-tb-col="${index}" style="${style}">${cellHtml}</td>`;
      }).join("");
      const innerWidth =
        widthSum < 100 ? Math.max(1, Math.min(100, widthSum)) : 100;
      const columnsTable = `<table role="presentation" width="${innerWidth}%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${cells}</tr></table>`;
      const table =
        widthSum < 100
          ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td align="center">${columnsTable}</td></tr></table>`
          : columnsTable;
      const inner = wrapLayoutChrome(block, table);
      const widthsAttr =
        block.columnWidths == null
          ? ""
          : ` data-tb-column-widths="${widths.join(",")}"`;
      return blockOuter(
        block,
        inner,
        ` data-tb-item-gap="${block.itemGap}" data-tb-column-gap="${gap}"${widthsAttr}${layoutChromeAttrs(block)}`,
      );
    }
    case "grid": {
      const rows = clampGridRows(block.rows);
      const cols = clampGridColumns(block.columns);
      const colWidths = resolveTrackSizes(block.columnWidths, cols);
      const rowHeights = resolveTrackSizes(block.rowHeights, rows);
      const columnGap = Math.max(0, Math.round(block.columnGap ?? 16));
      const rowGap = Math.max(0, Math.round(block.rowGap ?? 16));
      const itemGap = Math.max(0, Math.round(block.itemGap ?? 12));
      const cellPad = Math.max(0, Math.round(block.cellPadding ?? 0));
      const valign = block.cellVerticalAlign ?? "top";
      const rowHtml = Array.from({ length: rows }, (_, rowIndex) => {
        const cells = Array.from({ length: cols }, (_, colIndex) => {
          const flat = gridCellIndex(rowIndex, colIndex, cols);
          const top = cellPad;
          const left = cellPad;
          const right = cellPad + (colIndex < cols - 1 ? columnGap : 0);
          const bottom = cellPad + (rowIndex < rows - 1 ? rowGap : 0);
          const style =
            top || right || bottom || left
              ? `padding:${top}px ${right}px ${bottom}px ${left}px;`
              : "";
          const cellHtml = serializeColumnItems(
            parseColumnItems(block.cells[flat] || EMPTY_COLUMN_HTML),
            itemGap,
          );
          return `<td width="${colWidths[colIndex]}%" height="${rowHeights[rowIndex]}%" valign="${valign}" data-tb-grid-row="${rowIndex}" data-tb-grid-col="${colIndex}" style="${style}">${cellHtml}</td>`;
        }).join("");
        return `<tr data-tb-grid-row="${rowIndex}">${cells}</tr>`;
      }).join("");
      const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rowHtml}</table>`;
      const inner = wrapLayoutChrome(block, table);
      const widthsAttr =
        block.columnWidths == null
          ? ""
          : ` data-tb-column-widths="${colWidths.join(",")}"`;
      const heightsAttr =
        block.rowHeights == null
          ? ""
          : ` data-tb-row-heights="${rowHeights.join(",")}"`;
      return blockOuter(
        block,
        inner,
        ` data-tb-rows="${rows}" data-tb-cols="${cols}" data-tb-item-gap="${itemGap}" data-tb-column-gap="${columnGap}" data-tb-row-gap="${rowGap}"${widthsAttr}${heightsAttr}${layoutChromeAttrs(block)}`,
      );
    }
    case "table": {
      const headerBg = toEmailCssColor(block.headerBackgroundColor);
      const headerFg = toEmailCssColor(block.headerTextColor);
      const cellBg = toEmailCssColor(block.cellBackgroundColor);
      const cellFg = toEmailCssColor(block.cellTextColor);
      const border = toEmailCssColor(block.borderColor);
      const rows = block.rows
        .map(
          (row, rowIndex) =>
            `<tr>${row
              .map((cell, cellIndex) => {
                const isHeader = rowIndex === 0;
                const bg = isHeader ? headerBg : cellBg;
                const fg = isHeader ? headerFg : cellFg;
                const weight = isHeader
                  ? block.headerFontWeight
                  : block.fontWeight;
                return `<td data-tb-row="${rowIndex}" data-tb-cell="${cellIndex}" style="border:1px solid ${escapeAttr(border)};padding:${block.cellPadding}px;font-family:${escapeAttr(block.fontFamily)};font-size:${block.fontSize}px;font-weight:${escapeAttr(weight)};color:${escapeAttr(fg)};background:${escapeAttr(bg)};">${cell || "&nbsp;"}</td>`;
              })
              .join("")}</tr>`,
        )
        .join("");
      return blockOuter(
        block,
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`,
        ` data-tb-header-bg="${escapeAttr(block.headerBackgroundColor)}" data-tb-header-color="${escapeAttr(block.headerTextColor)}" data-tb-cell-bg="${escapeAttr(block.cellBackgroundColor)}" data-tb-cell-color="${escapeAttr(block.cellTextColor)}" data-tb-border-color="${escapeAttr(block.borderColor)}" data-tb-font-family="${escapeAttr(block.fontFamily)}" data-tb-font-size="${block.fontSize}" data-tb-font-weight="${escapeAttr(block.fontWeight)}" data-tb-header-weight="${escapeAttr(block.headerFontWeight)}" data-tb-cell-pad="${block.cellPadding}"`,
      );
    }
    case "html":
      return blockOuter(block, block.html || "");
  }
}

/** Email-safe HTML for sending / preview, with round-trip markers. */
export function documentToEmailHtml(doc: EmailTemplateDocument): string {
  const contentBg = toEmailCssColor(
    doc.contentBackgroundColor || DEFAULT_CONTENT_BACKGROUND,
  );
  const margins = resolvePageMargins(doc);
  const horizontalPad =
    margins.left > 0 || margins.right > 0
      ? `padding-left:${margins.left}px;padding-right:${margins.right}px`
      : "";
  const verticalPad =
    margins.top > 0 || margins.bottom > 0
      ? `padding-top:${margins.top}px;padding-bottom:${margins.bottom}px;`
      : "";

  const parts: string[] = [];
  if (doc.header) {
    parts.push(wrapContentColumn(serializePageBand(doc.header, "header")));
  }
  const blocks = doc.blocks
    .map((block) => wrapContentColumn(serializeBlock(block)))
    .join("");
  parts.push(
    `<div data-tb-content-pad="1" style="${horizontalPad ? `${horizontalPad};` : ""}${verticalPad}">${blocks}</div>`,
  );
  if (doc.footer) {
    parts.push(wrapContentColumn(serializePageBand(doc.footer, "footer")));
  }

  return `<div data-tb-doc="1"${documentChromeAttrs(doc)} style="${documentPageBackgroundCss(doc)};padding:0;"><div data-tb-canvas="1" style="background:${escapeAttr(contentBg)};box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;color:#18181b;">${parts.join("")}</div></div>`;
}

export function documentToPlainText(doc: EmailTemplateDocument): string {
  const parts: string[] = [];
  if (doc.header) parts.push(stripHtmlToText(doc.header.html));
  for (const block of doc.blocks) {
    switch (block.type) {
      case "text":
      case "html":
        parts.push(stripHtmlToText(block.html));
        break;
      case "image":
        if (block.alt) parts.push(block.alt);
        break;
      case "spacer":
        break;
      case "imageText":
        if (block.image.alt) parts.push(block.image.alt);
        parts.push(stripHtmlToText(block.text.html));
        break;
      case "button":
        parts.push(block.label);
        break;
      case "columns":
        for (const cell of block.columns) {
          parts.push(stripHtmlToText(cell));
        }
        break;
      case "grid":
        for (const cell of block.cells) {
          parts.push(stripHtmlToText(cell));
        }
        break;
      case "table":
        for (const row of block.rows) {
          parts.push(row.map((cell) => stripHtmlToText(cell)).join(" | "));
        }
        break;
    }
  }
  if (doc.footer) parts.push(stripHtmlToText(doc.footer.html));
  return parts.filter(Boolean).join("\n\n").trim();
}

function attr(el: Element, name: string): string {
  return el.getAttribute(name) ?? "";
}

function parseOptionalPx(el: Element, name: string): number | null {
  const raw = attr(el, name);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.min(1200, Math.max(1, Math.round(value)));
}

function parseSize(el: Element): {
  width: number | null;
  height: number | null;
} {
  return {
    width: parseOptionalPx(el, "data-tb-width"),
    height: parseOptionalPx(el, "data-tb-height"),
  };
}

function parseNumberAttr(
  el: Element,
  name: string,
  fallback: number,
  min = 0,
  max = 200,
): number {
  const raw = Number(attr(el, name));
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, raw));
}

function parseButtonBlock(el: Element, id: string): EmailTemplateButtonBlock {
  return {
    id,
    type: "button",
    label: attr(el, "data-tb-label") || "Click here",
    href: attr(el, "data-tb-href") || "https://",
    align:
      attr(el, "data-tb-align") === "left"
        ? "left"
        : attr(el, "data-tb-align") === "right"
          ? "right"
          : "center",
    backgroundColor:
      attr(el, "data-tb-bg") || DEFAULT_BUTTON_STYLE.backgroundColor,
    textColor: attr(el, "data-tb-color") || DEFAULT_BUTTON_STYLE.textColor,
    borderRadius: parseNumberAttr(
      el,
      "data-tb-radius",
      DEFAULT_BUTTON_STYLE.borderRadius,
      0,
      64,
    ),
    borderColor:
      attr(el, "data-tb-border-color") || DEFAULT_BUTTON_STYLE.borderColor,
    borderWidth: parseNumberAttr(
      el,
      "data-tb-border-width",
      DEFAULT_BUTTON_STYLE.borderWidth,
      0,
      12,
    ),
    paddingX: parseNumberAttr(
      el,
      "data-tb-pad-x",
      DEFAULT_BUTTON_STYLE.paddingX,
      0,
      80,
    ),
    paddingY: parseNumberAttr(
      el,
      "data-tb-pad-y",
      DEFAULT_BUTTON_STYLE.paddingY,
      0,
      80,
    ),
    fontFamily:
      attr(el, "data-tb-font-family") || DEFAULT_BUTTON_STYLE.fontFamily,
    fontSize: parseNumberAttr(
      el,
      "data-tb-font-size",
      DEFAULT_BUTTON_STYLE.fontSize,
      8,
      72,
    ),
    fontWeight: parseButtonFontWeight(attr(el, "data-tb-font-weight")),
    ...parseSize(el),
  };
}

function parseButtonFontWeight(
  value: string,
): EmailTemplateButtonBlock["fontWeight"] {
  if (
    value === "400" ||
    value === "500" ||
    value === "600" ||
    value === "700"
  ) {
    return value;
  }
  if (value === "bold") return "700";
  if (value === "normal") return "400";
  return DEFAULT_BUTTON_STYLE.fontWeight;
}

function parseTableFontWeight(
  value: string,
  fallback: EmailTemplateTableBlock["fontWeight"],
): EmailTemplateTableBlock["fontWeight"] {
  if (
    value === "400" ||
    value === "500" ||
    value === "600" ||
    value === "700"
  ) {
    return value;
  }
  if (value === "bold") return "700";
  if (value === "normal") return "400";
  return fallback;
}

function parseTableBlock(el: Element, id: string): EmailTemplateTableBlock {
  const cells = Array.from(el.querySelectorAll("td[data-tb-row]"));
  let maxRow = -1;
  let maxCell = -1;
  for (const cell of cells) {
    maxRow = Math.max(maxRow, Number(attr(cell, "data-tb-row")));
    maxCell = Math.max(maxCell, Number(attr(cell, "data-tb-cell")));
  }
  const rows: string[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 0; c <= maxCell; c++) {
      const match = cells.find(
        (cell) =>
          Number(attr(cell, "data-tb-row")) === r &&
          Number(attr(cell, "data-tb-cell")) === c,
      );
      row.push(match?.textContent ?? "");
    }
    rows.push(row);
  }
  return {
    id,
    type: "table",
    rows:
      rows.length > 0
        ? rows
        : [
            ["", ""],
            ["", ""],
          ],
    headerBackgroundColor:
      attr(el, "data-tb-header-bg") ||
      DEFAULT_TABLE_STYLE.headerBackgroundColor,
    headerTextColor:
      attr(el, "data-tb-header-color") || DEFAULT_TABLE_STYLE.headerTextColor,
    cellBackgroundColor:
      attr(el, "data-tb-cell-bg") || DEFAULT_TABLE_STYLE.cellBackgroundColor,
    cellTextColor:
      attr(el, "data-tb-cell-color") || DEFAULT_TABLE_STYLE.cellTextColor,
    borderColor:
      attr(el, "data-tb-border-color") || DEFAULT_TABLE_STYLE.borderColor,
    fontFamily:
      attr(el, "data-tb-font-family") || DEFAULT_TABLE_STYLE.fontFamily,
    fontSize: parseNumberAttr(
      el,
      "data-tb-font-size",
      DEFAULT_TABLE_STYLE.fontSize,
      8,
      72,
    ),
    fontWeight: parseTableFontWeight(
      attr(el, "data-tb-font-weight"),
      DEFAULT_TABLE_STYLE.fontWeight,
    ),
    headerFontWeight: parseTableFontWeight(
      attr(el, "data-tb-header-weight"),
      DEFAULT_TABLE_STYLE.headerFontWeight,
    ),
    cellPadding: parseNumberAttr(
      el,
      "data-tb-cell-pad",
      DEFAULT_TABLE_STYLE.cellPadding,
      0,
      40,
    ),
    boxChrome: parseBoxChromeFromEl(el),
    ...parseSize(el),
  };
}

function parseBlockElement(el: Element): EmailTemplateBlock | null {
  const type = attr(el, "data-tb-block") as EmailTemplateBlockType | "";
  const id = attr(el, "data-tb-id") || createBlockId();
  if (!type) return null;

  switch (type) {
    case "text":
      return {
        id,
        type: "text",
        html: decorateMergeFieldsHtml(el.innerHTML),
        ...parseBoxChromeFromEl(el),
        ...parseSize(el),
      };
    case "image":
      return {
        id,
        type: "image",
        src: attr(el, "data-tb-src"),
        alt: attr(el, "data-tb-alt") || "Image",
        ...parseImageFieldsFromEl(el),
        ...parseSize(el),
      };
    case "spacer": {
      const height = Number(attr(el, "data-tb-height") || "24");
      return {
        id,
        type: "spacer",
        height: Number.isFinite(height) && height > 0 ? height : 24,
        width: parseOptionalPx(el, "data-tb-width"),
        ...parseBoxChromeFromEl(el),
      };
    }
    case "imageText": {
      const position = attr(el, "data-tb-image-position");
      const cells = el.querySelectorAll("td");
      const imagePosition = position === "right" ? "right" : "left";
      const textCell = imagePosition === "left" ? cells[1] : cells[0];
      return {
        id,
        type: "imageText",
        imagePosition,
        image: defaultImageTextImage({
          src: attr(el, "data-tb-src"),
          alt: attr(el, "data-tb-alt") || "Image",
          ...parseImageFieldsFromEl(el),
        }),
        text: defaultImageTextText({
          html: decorateMergeFieldsHtml(textCell?.innerHTML ?? "<p><br /></p>"),
        }),
        ...parseBoxChromeFromEl(el),
        ...parseSize(el),
      };
    }
    case "button":
      return parseButtonBlock(el, id);
    case "columns": {
      const colEls = Array.from(el.querySelectorAll("[data-tb-col]")).sort(
        (a, b) =>
          Number(attr(a, "data-tb-col")) - Number(attr(b, "data-tb-col")),
      );
      const columns =
        colEls.length >= 1
          ? colEls.map((col) => col.innerHTML || "<p><br /></p>")
          : ["<p><br /></p>", "<p><br /></p>"];
      const count = clampColumnCount(columns.length);
      return {
        id,
        type: "columns",
        columns: columns.slice(0, count),
        columnWidths: parseColumnWidthsAttr(el, count),
        columnGap: parseNumberAttr(el, "data-tb-column-gap", 24, 0, 200),
        itemGap: parseNumberAttr(el, "data-tb-item-gap", 12, 0, 200),
        ...parseLayoutChromeFromEl(el),
        ...parseSize(el),
      };
    }
    case "grid": {
      const rows = clampGridRows(
        parseNumberAttr(
          el,
          "data-tb-rows",
          2,
          GRID_LIMITS.minRows,
          GRID_LIMITS.maxRows,
        ),
      );
      const cols = clampGridColumns(
        parseNumberAttr(
          el,
          "data-tb-cols",
          2,
          GRID_LIMITS.minColumns,
          GRID_LIMITS.maxColumns,
        ),
      );
      const cellEls = Array.from(
        el.querySelectorAll("td[data-tb-grid-row][data-tb-grid-col]"),
      );
      const cells = emptyGridCells(rows, cols);
      for (const cellEl of cellEls) {
        const rowIndex = Number(attr(cellEl, "data-tb-grid-row"));
        const colIndex = Number(attr(cellEl, "data-tb-grid-col"));
        if (
          !Number.isFinite(rowIndex) ||
          !Number.isFinite(colIndex) ||
          rowIndex < 0 ||
          colIndex < 0 ||
          rowIndex >= rows ||
          colIndex >= cols
        ) {
          continue;
        }
        cells[gridCellIndex(rowIndex, colIndex, cols)] =
          cellEl.innerHTML || EMPTY_COLUMN_HTML;
      }
      const chrome = parseLayoutChromeFromEl(el);
      return {
        id,
        type: "grid",
        rows,
        columns: cols,
        cells,
        columnWidths: parseTrackSizesAttr(el, "data-tb-column-widths", cols),
        rowHeights: parseTrackSizesAttr(el, "data-tb-row-heights", rows),
        columnGap: parseNumberAttr(
          el,
          "data-tb-column-gap",
          DEFAULT_GRID_STYLE.columnGap,
          0,
          200,
        ),
        rowGap: parseNumberAttr(
          el,
          "data-tb-row-gap",
          DEFAULT_GRID_STYLE.rowGap,
          0,
          200,
        ),
        itemGap: parseNumberAttr(
          el,
          "data-tb-item-gap",
          DEFAULT_GRID_STYLE.itemGap,
          0,
          200,
        ),
        ...chrome,
        ...parseSize(el),
      };
    }
    case "table":
      return parseTableBlock(el, id);
    case "html":
      return {
        id,
        type: "html",
        html: el.innerHTML,
        ...parseBoxChromeFromEl(el),
        ...parseSize(el),
      };
    default:
      return null;
  }
}

/**
 * Reconstruct a document from saved bodyHtml. Templates without markers become
 * a single freeform html block so legacy content still opens in the builder.
 */
export function parseDocumentFromHtml(
  html: string,
  fallbackBackground = DEFAULT_DOCUMENT_BACKGROUND,
): EmailTemplateDocument {
  const trimmed = html.trim();
  if (!trimmed) return emptyDocument(fallbackBackground);

  if (typeof document === "undefined") {
    return {
      ...defaultDocumentChrome(fallbackBackground),
      blocks: [
        {
          id: createBlockId(),
          type: "html",
          html: trimmed,
          ...DEFAULT_BOX_CHROME,
          ...AUTO_SIZE,
        },
      ],
    };
  }

  const root = document.createElement("div");
  root.innerHTML = trimmed;
  const docEl =
    root.querySelector("[data-tb-doc]") ??
    (root.firstElementChild?.hasAttribute("data-tb-doc")
      ? root.firstElementChild
      : null);

  const chrome = parseDocumentChrome(docEl, fallbackBackground);

  const blockEls = Array.from(
    (docEl ?? root).querySelectorAll(
      ":scope > [data-tb-block], [data-tb-doc] > div > [data-tb-block], [data-tb-content-col] > [data-tb-block], [data-tb-content-pad] > [data-tb-content-col] > [data-tb-block]",
    ),
  );

  // Prefer blocks nested inside the canvas wrapper (incl. content columns).
  const canvas =
    docEl?.querySelector(":scope > [data-tb-canvas]") ??
    docEl?.querySelector(":scope > div");
  const nested = canvas
    ? Array.from(
        canvas.querySelectorAll(
          ":scope > [data-tb-block], :scope > [data-tb-content-col] > [data-tb-block], :scope > [data-tb-content-pad] > [data-tb-content-col] > [data-tb-block]",
        ),
      )
    : [];
  const candidates = nested.length > 0 ? nested : blockEls;

  if (candidates.length === 0) {
    // Maybe blocks are direct children without wrapper.
    const direct = Array.from(
      root.querySelectorAll(":scope > [data-tb-block]"),
    );
    if (direct.length === 0) {
      return {
        ...chrome,
        blocks: [
          {
            id: createBlockId(),
            type: "html",
            html: trimmed,
            ...DEFAULT_BOX_CHROME,
            ...AUTO_SIZE,
          },
        ],
      };
    }
    const blocks = direct
      .map(parseBlockElement)
      .filter((b): b is EmailTemplateBlock => Boolean(b));
    return { ...chrome, blocks };
  }

  const blocks = candidates
    .map(parseBlockElement)
    .filter((b): b is EmailTemplateBlock => Boolean(b));

  if (blocks.length === 0) {
    return {
      ...chrome,
      blocks: [
        {
          id: createBlockId(),
          type: "html",
          html: trimmed,
          ...DEFAULT_BOX_CHROME,
          ...AUTO_SIZE,
        },
      ],
    };
  }

  return { ...chrome, blocks };
}

export function updateBlock(
  doc: EmailTemplateDocument,
  blockId: string,
  patch: Partial<EmailTemplateBlock>,
): EmailTemplateDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((block) =>
      block.id === blockId
        ? ({ ...block, ...patch } as EmailTemplateBlock)
        : block,
    ),
  };
}

export function removeBlock(
  doc: EmailTemplateDocument,
  blockId: string,
): EmailTemplateDocument {
  const blocks = doc.blocks.filter((block) => block.id !== blockId);
  if (blocks.length === 0) {
    return withDefaultSection({ ...doc, blocks: [] });
  }
  return { ...doc, blocks };
}

export function duplicateBlock(
  doc: EmailTemplateDocument,
  blockId: string,
): EmailTemplateDocument {
  const index = doc.blocks.findIndex((block) => block.id === blockId);
  if (index < 0) return doc;
  const source = doc.blocks[index]!;
  const copy = { ...source, id: createBlockId() } as EmailTemplateBlock;
  if (copy.type === "columns") {
    copy.columns = [...copy.columns];
  }
  if (copy.type === "grid") {
    copy.cells = [...copy.cells];
  }
  if (copy.type === "table") {
    copy.rows = copy.rows.map((row) => [...row]);
  }
  const blocks = [...doc.blocks];
  blocks.splice(index + 1, 0, copy);
  return { ...doc, blocks };
}

export function moveBlock(
  doc: EmailTemplateDocument,
  blockId: string,
  direction: "up" | "down",
): EmailTemplateDocument {
  const index = doc.blocks.findIndex((block) => block.id === blockId);
  if (index < 0) return doc;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= doc.blocks.length) return doc;
  const blocks = [...doc.blocks];
  const [item] = blocks.splice(index, 1);
  blocks.splice(target, 0, item!);
  return { ...doc, blocks };
}

/** Move a block so it lands at drop-slot `toIndex` (0 = before first). */
export function moveBlockToIndex(
  doc: EmailTemplateDocument,
  blockId: string,
  toIndex: number,
): EmailTemplateDocument {
  const fromIndex = doc.blocks.findIndex((block) => block.id === blockId);
  if (fromIndex < 0) return doc;
  const blocks = [...doc.blocks];
  const [item] = blocks.splice(fromIndex, 1);
  if (!item) return doc;
  let insertAt = toIndex;
  if (fromIndex < toIndex) insertAt -= 1;
  insertAt = Math.max(0, Math.min(blocks.length, insertAt));
  blocks.splice(insertAt, 0, item);
  return { ...doc, blocks };
}

export function appendBlock(
  doc: EmailTemplateDocument,
  type: Exclude<EmailTemplateBlockType, "html">,
): EmailTemplateDocument {
  return {
    ...doc,
    blocks: [...doc.blocks, createDefaultBlock(type)],
  };
}

export function insertBlockAt(
  doc: EmailTemplateDocument,
  index: number,
  block: EmailTemplateBlock,
): EmailTemplateDocument {
  const blocks = [...doc.blocks];
  const clamped = Math.max(0, Math.min(blocks.length, index));
  blocks.splice(clamped, 0, block);
  return { ...doc, blocks };
}

export function insertBlocksAt(
  doc: EmailTemplateDocument,
  index: number,
  incoming: EmailTemplateBlock[],
): EmailTemplateDocument {
  if (incoming.length === 0) return doc;
  if (incoming.length === 1) {
    return insertBlockAt(doc, index, incoming[0]!);
  }
  const blocks = [...doc.blocks];
  const clamped = Math.max(0, Math.min(blocks.length, index));
  blocks.splice(clamped, 0, ...incoming);
  return { ...doc, blocks };
}

export function insertBlockAfter(
  doc: EmailTemplateDocument,
  afterBlockId: string,
  block: EmailTemplateBlock,
): EmailTemplateDocument {
  const index = doc.blocks.findIndex((item) => item.id === afterBlockId);
  if (index < 0) {
    return { ...doc, blocks: [...doc.blocks, block] };
  }
  return insertBlockAt(doc, index + 1, block);
}

export function insertVariantAt(
  doc: EmailTemplateDocument,
  index: number,
  variantId: string,
): EmailTemplateDocument {
  if (isPageBandVariant(variantId)) {
    return applyPageBandVariant(doc, variantId);
  }
  return insertBlocksAt(doc, index, createBlocksFromVariant(variantId));
}

export function appendVariant(
  doc: EmailTemplateDocument,
  variantId: string,
): EmailTemplateDocument {
  return insertVariantAt(doc, doc.blocks.length, variantId);
}

export function isPageBandVariant(variantId: string): boolean {
  return (
    variantId === "header-basic" ||
    variantId === "header-logo" ||
    variantId === "footer-basic" ||
    variantId === "footer-links"
  );
}

export function applyPageBandVariant(
  doc: EmailTemplateDocument,
  variantId: string,
): EmailTemplateDocument {
  if (variantId === "header-basic" || variantId === "header-logo") {
    if (doc.header) return doc;
    const header = defaultHeaderBand();
    if (variantId === "header-logo") {
      header.html =
        '<div style="height:48px;background:#e4e4e7;color:#71717a;text-align:center;line-height:48px;font-family:sans-serif;font-size:13px;">Logo</div>';
      header.align = "center";
    }
    return { ...doc, header };
  }
  if (variantId === "footer-basic" || variantId === "footer-links") {
    if (doc.footer) return doc;
    const footer = defaultFooterBand();
    if (variantId === "footer-links") {
      footer.html =
        '<p style="font-size:12px;color:#71717a;"><a href="https://" style="color:#71717a;">Privacy</a> · <a href="https://" style="color:#71717a;">Unsubscribe</a></p>';
    }
    return { ...doc, footer };
  }
  return doc;
}

export function updatePageBand(
  doc: EmailTemplateDocument,
  role: "header" | "footer",
  patch: Partial<EmailTemplatePageBand>,
): EmailTemplateDocument {
  const current = role === "header" ? doc.header : doc.footer;
  if (!current) return doc;
  const next = { ...current, ...patch };
  return role === "header"
    ? { ...doc, header: next }
    : { ...doc, footer: next };
}

export function removePageBand(
  doc: EmailTemplateDocument,
  role: "header" | "footer",
): EmailTemplateDocument {
  return role === "header"
    ? { ...doc, header: null }
    : { ...doc, footer: null };
}

const EMPTY_COLUMN_HTML = "<p><br /></p>";

function isBlankColumnHtml(html: string): boolean {
  if (!html.trim()) return true;
  // Media / structured items are never "blank" even without visible text.
  if (/<(img|table|hr|video|iframe)\b/i.test(html)) return false;
  if (/data-tb-col-item\b/i.test(html) || /data-tb-item-kind\b/i.test(html)) {
    return false;
  }
  const text = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, "")
    .trim();
  return text.length === 0;
}

type ColumnItemGap = {
  /** Explicit gap before this item; null uses the column `itemGap`. */
  gapBefore: number | null;
};

export type ColumnTextItem = ColumnItemGap & {
  kind: "text";
  html: string;
};

export type ColumnImageItem = ColumnItemGap & {
  kind: "image";
  src: string;
  alt: string;
  fit: ImageFitMode;
  align: ImageAlign;
  href: string;
  openInNewTab: boolean;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  paddingX: number;
  paddingY: number;
};

export type ColumnButtonItem = ColumnItemGap & {
  kind: "button";
  label: string;
  href: string;
  align: "left" | "center" | "right";
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
  paddingX: number;
  paddingY: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: "400" | "500" | "600" | "700";
};

export type ColumnSpacerItem = ColumnItemGap & {
  kind: "spacer";
  height: number;
};

export type ColumnHtmlItem = ColumnItemGap & {
  kind: "html";
  html: string;
};

export type ColumnItem =
  | ColumnTextItem
  | ColumnImageItem
  | ColumnButtonItem
  | ColumnSpacerItem
  | ColumnHtmlItem;

export type ColumnItemSelection = {
  columnIndex: number;
  itemIndex: number;
  /** Present when selecting inside a grid cell. */
  rowIndex?: number;
};

function parseGapBefore(el: Element): number | null {
  const rawGap = el.getAttribute("data-tb-gap-before");
  if (rawGap == null) return null;
  const parsedGap = Number(rawGap);
  return Number.isFinite(parsedGap) ? Math.max(0, Math.round(parsedGap)) : null;
}

function inferColumnItemFromHtml(
  html: string,
  gapBefore: number | null,
): ColumnItem {
  if (typeof document === "undefined") {
    return { kind: "html", html, gapBefore };
  }
  const root = document.createElement("div");
  root.innerHTML = html;
  const img = root.querySelector("img");
  if (img) {
    const style = img.getAttribute("style") ?? "";
    const parentAlign = img.parentElement
      ?.getAttribute("style")
      ?.match(/text-align:\s*(left|center|right)/i)?.[1];
    const link = img.closest("a");
    const radiusMatch = style.match(/border-radius:\s*([\d.]+)px/);
    const borderMatch = style.match(/border:\s*([\d.]+)px\s+solid\s+([^;]+)/);
    const padStyle =
      img.parentElement?.getAttribute("style") ??
      img.parentElement?.parentElement?.getAttribute("style") ??
      "";
    const padMatch = padStyle.match(/padding:\s*([\d.]+)px\s+([\d.]+)px/);
    return {
      kind: "image",
      src: img.getAttribute("src") ?? "",
      alt: img.getAttribute("alt") ?? "Image",
      fit: parseImageFit(
        img.getAttribute("data-tb-fit") ??
          (style.includes("width:100%") ? "fill" : "fit"),
      ),
      align: parseImageAlign(
        img.getAttribute("data-tb-align") ?? parentAlign ?? undefined,
      ),
      href: link?.getAttribute("href") ?? "",
      openInNewTab: link?.getAttribute("target") === "_blank",
      borderRadius: radiusMatch
        ? Math.round(Number(radiusMatch[1]))
        : DEFAULT_IMAGE_STYLE.borderRadius,
      borderWidth: borderMatch
        ? Math.round(Number(borderMatch[1]))
        : DEFAULT_IMAGE_STYLE.borderWidth,
      borderColor: borderMatch?.[2]?.trim() || DEFAULT_IMAGE_STYLE.borderColor,
      paddingX: padMatch
        ? Math.round(Number(padMatch[2]))
        : DEFAULT_IMAGE_STYLE.paddingX,
      paddingY: padMatch
        ? Math.round(Number(padMatch[1]))
        : DEFAULT_IMAGE_STYLE.paddingY,
      gapBefore,
    };
  }
  const anchor = root.querySelector("a");
  if (anchor) {
    const style = anchor.getAttribute("style") ?? "";
    const padMatch = style.match(/padding:\s*([\d.]+)px\s+([\d.]+)px/);
    const radiusMatch = style.match(/border-radius:\s*([\d.]+)px/);
    const sizeMatch = style.match(/font-size:\s*([\d.]+)px/);
    const weightMatch = style.match(/font-weight:\s*(\d+)/);
    const bgMatch = style.match(/background:([^;]+)/);
    const colorMatch = style.match(/(?:^|;)\s*color:([^;]+)/);
    const familyMatch = style.match(/font-family:([^;]+)/);
    const align = (
      root.querySelector("div[style*='text-align']")?.getAttribute("style") ??
      ""
    ).includes("left")
      ? "left"
      : (
            root
              .querySelector("div[style*='text-align']")
              ?.getAttribute("style") ?? ""
          ).includes("right")
        ? "right"
        : "center";
    return {
      kind: "button",
      label: anchor.textContent?.trim() || "Click here",
      href: anchor.getAttribute("href") || "https://",
      align,
      backgroundColor: (
        bgMatch?.[1] ?? DEFAULT_BUTTON_STYLE.backgroundColor
      ).trim(),
      textColor: (colorMatch?.[1] ?? DEFAULT_BUTTON_STYLE.textColor).trim(),
      borderRadius: radiusMatch
        ? Number(radiusMatch[1])
        : DEFAULT_BUTTON_STYLE.borderRadius,
      borderColor: DEFAULT_BUTTON_STYLE.borderColor,
      borderWidth: DEFAULT_BUTTON_STYLE.borderWidth,
      paddingX: padMatch ? Number(padMatch[2]) : DEFAULT_BUTTON_STYLE.paddingX,
      paddingY: padMatch ? Number(padMatch[1]) : DEFAULT_BUTTON_STYLE.paddingY,
      fontFamily: (familyMatch?.[1] ?? DEFAULT_BUTTON_STYLE.fontFamily).trim(),
      fontSize: sizeMatch
        ? Number(sizeMatch[1])
        : DEFAULT_BUTTON_STYLE.fontSize,
      fontWeight: parseButtonFontWeight(weightMatch?.[1] ?? ""),
      gapBefore,
    };
  }
  const spacer = root.querySelector("div[style*='height:']");
  if (spacer && isBlankColumnHtml(spacer.innerHTML)) {
    const heightMatch = (spacer.getAttribute("style") ?? "").match(
      /height:\s*([\d.]+)px/,
    );
    if (heightMatch) {
      return {
        kind: "spacer",
        height: Number(heightMatch[1]) || 24,
        gapBefore,
      };
    }
  }
  return { kind: "text", html, gapBefore };
}

function parseMarkedColumnItem(el: Element): ColumnItem {
  const gapBefore = parseGapBefore(el);
  const kind = el.getAttribute("data-tb-item-kind");
  if (kind === "image") {
    return {
      kind: "image",
      src: el.getAttribute("data-tb-src") ?? "",
      alt: el.getAttribute("data-tb-alt") || "Image",
      ...parseImageFieldsFromEl(el),
      gapBefore,
    };
  }
  if (kind === "button") {
    return {
      kind: "button",
      label: el.getAttribute("data-tb-label") || "Click here",
      href: el.getAttribute("data-tb-href") || "https://",
      align:
        el.getAttribute("data-tb-align") === "left"
          ? "left"
          : el.getAttribute("data-tb-align") === "right"
            ? "right"
            : "center",
      backgroundColor:
        el.getAttribute("data-tb-bg") || DEFAULT_BUTTON_STYLE.backgroundColor,
      textColor:
        el.getAttribute("data-tb-color") || DEFAULT_BUTTON_STYLE.textColor,
      borderRadius: parseNumberAttr(
        el,
        "data-tb-radius",
        DEFAULT_BUTTON_STYLE.borderRadius,
        0,
        64,
      ),
      borderColor:
        el.getAttribute("data-tb-border-color") ||
        DEFAULT_BUTTON_STYLE.borderColor,
      borderWidth: parseNumberAttr(
        el,
        "data-tb-border-width",
        DEFAULT_BUTTON_STYLE.borderWidth,
        0,
        12,
      ),
      paddingX: parseNumberAttr(
        el,
        "data-tb-pad-x",
        DEFAULT_BUTTON_STYLE.paddingX,
        0,
        80,
      ),
      paddingY: parseNumberAttr(
        el,
        "data-tb-pad-y",
        DEFAULT_BUTTON_STYLE.paddingY,
        0,
        80,
      ),
      fontFamily:
        el.getAttribute("data-tb-font-family") ||
        DEFAULT_BUTTON_STYLE.fontFamily,
      fontSize: parseNumberAttr(
        el,
        "data-tb-font-size",
        DEFAULT_BUTTON_STYLE.fontSize,
        8,
        72,
      ),
      fontWeight: parseButtonFontWeight(
        el.getAttribute("data-tb-font-weight") ?? "",
      ),
      gapBefore,
    };
  }
  if (kind === "spacer") {
    return {
      kind: "spacer",
      height: parseNumberAttr(el, "data-tb-height", 24, 1, 400),
      gapBefore,
    };
  }
  if (kind === "text") {
    return {
      kind: "text",
      html: decorateMergeFieldsHtml(el.innerHTML || EMPTY_COLUMN_HTML),
      gapBefore,
    };
  }
  if (kind === "html") {
    return { kind: "html", html: el.innerHTML, gapBefore };
  }
  return inferColumnItemFromHtml(el.innerHTML, gapBefore);
}

/** Render the visual inner HTML for a typed column item. */
export function renderColumnItemInner(item: ColumnItem): string {
  switch (item.kind) {
    case "text":
    case "html":
      return item.html || EMPTY_COLUMN_HTML;
    case "image": {
      const src = item.src.trim();
      return renderImageMarkup({
        src,
        alt: item.alt,
        fit: item.fit ?? "fit",
        align: parseImageAlign(item.align),
        href: item.href,
        openInNewTab: item.openInNewTab,
        borderRadius: item.borderRadius,
        borderWidth: item.borderWidth,
        borderColor: item.borderColor,
        paddingX: item.paddingX,
        paddingY: item.paddingY,
      });
    }
    case "spacer":
      return `<div style="height:${item.height}px;line-height:${item.height}px;font-size:0;">&nbsp;</div>`;
    case "button": {
      const align =
        item.align === "left"
          ? "left"
          : item.align === "right"
            ? "right"
            : "center";
      const bg = toEmailCssColor(item.backgroundColor);
      const fg = toEmailCssColor(item.textColor);
      const stroke = toEmailCssColor(item.borderColor);
      const border =
        item.borderWidth > 0
          ? `border:${item.borderWidth}px solid ${escapeAttr(stroke)};`
          : "border:0;";
      return `<div style="text-align:${align};"><a href="${escapeAttr(item.href)}" style="display:inline-block;background:${escapeAttr(bg)};color:${escapeAttr(fg)};text-decoration:none;padding:${item.paddingY}px ${item.paddingX}px;border-radius:${item.borderRadius}px;${border}font-family:${escapeAttr(item.fontFamily)};font-size:${item.fontSize}px;font-weight:${escapeAttr(item.fontWeight)};line-height:1.2;">${escapeAttr(item.label)}</a></div>`;
    }
  }
}

function columnItemAttrs(item: ColumnItem): string {
  switch (item.kind) {
    case "text":
      return ` data-tb-item-kind="text"`;
    case "html":
      return ` data-tb-item-kind="html"`;
    case "image":
      return ` data-tb-item-kind="image"${imageAttrsFromOptions({
        alt: item.alt,
        src: item.src,
        fit: item.fit ?? "fit",
        align: parseImageAlign(item.align),
        href: item.href,
        openInNewTab: item.openInNewTab,
        borderRadius: item.borderRadius,
        borderWidth: item.borderWidth,
        borderColor: item.borderColor,
        paddingX: item.paddingX,
        paddingY: item.paddingY,
      })}`;
    case "spacer":
      return ` data-tb-item-kind="spacer" data-tb-height="${item.height}"`;
    case "button":
      return ` data-tb-item-kind="button" data-tb-label="${escapeAttr(item.label)}" data-tb-href="${escapeAttr(item.href)}" data-tb-align="${item.align}" data-tb-bg="${escapeAttr(item.backgroundColor)}" data-tb-color="${escapeAttr(item.textColor)}" data-tb-radius="${item.borderRadius}" data-tb-border-color="${escapeAttr(item.borderColor)}" data-tb-border-width="${item.borderWidth}" data-tb-pad-x="${item.paddingX}" data-tb-pad-y="${item.paddingY}" data-tb-font-family="${escapeAttr(item.fontFamily)}" data-tb-font-size="${item.fontSize}" data-tb-font-weight="${escapeAttr(item.fontWeight)}"`;
  }
}

/** Convert a top-level block into a typed column item. */
export function blockToColumnItem(block: EmailTemplateBlock): ColumnItem {
  switch (block.type) {
    case "text":
      return {
        kind: "text",
        html: block.html || EMPTY_COLUMN_HTML,
        gapBefore: null,
      };
    case "html":
      return { kind: "html", html: block.html || "", gapBefore: null };
    case "image":
      return {
        kind: "image",
        src: block.src,
        alt: block.alt,
        fit: block.fit ?? "fit",
        align: parseImageAlign(block.align),
        href: block.href ?? "",
        openInNewTab: Boolean(block.openInNewTab),
        borderRadius: block.borderRadius ?? 0,
        borderWidth: block.borderWidth ?? 0,
        borderColor: block.borderColor ?? DEFAULT_IMAGE_STYLE.borderColor,
        paddingX: block.paddingX ?? 0,
        paddingY: block.paddingY ?? 0,
        gapBefore: null,
      };
    case "spacer":
      return { kind: "spacer", height: block.height, gapBefore: null };
    case "button":
      return {
        kind: "button",
        label: block.label,
        href: block.href,
        align: block.align,
        backgroundColor: block.backgroundColor,
        textColor: block.textColor,
        borderRadius: block.borderRadius,
        borderColor: block.borderColor,
        borderWidth: block.borderWidth,
        paddingX: block.paddingX,
        paddingY: block.paddingY,
        fontFamily: block.fontFamily,
        fontSize: block.fontSize,
        fontWeight: block.fontWeight,
        gapBefore: null,
      };
    case "imageText": {
      const src = block.image.src.trim();
      const imgCell = renderImageMarkup({
        src,
        alt: block.image.alt,
        fit: block.image.fit ?? "fit",
        align: parseImageAlign(block.image.align),
        href: block.image.href,
        openInNewTab: block.image.openInNewTab,
        borderRadius: block.image.borderRadius,
        borderWidth: block.image.borderWidth,
        borderColor: block.image.borderColor,
        paddingX: block.image.paddingX,
        paddingY: block.image.paddingY,
      });
      const textCell = block.text.html || EMPTY_COLUMN_HTML;
      const left = block.imagePosition === "left" ? imgCell : textCell;
      const right = block.imagePosition === "left" ? textCell : imgCell;
      return {
        kind: "html",
        html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td width="48%" valign="top" style="padding-right:8px;">${left}</td><td width="52%" valign="top" style="padding-left:8px;">${right}</td></tr></table>`,
        gapBefore: null,
      };
    }
    case "columns": {
      const count = clampColumnCount(block.columns.length);
      const width = Math.floor(100 / count);
      const cells = Array.from({ length: count }, (_, index) => {
        return `<td width="${width}%" valign="top">${block.columns[index] || EMPTY_COLUMN_HTML}</td>`;
      }).join("");
      return {
        kind: "html",
        html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${cells}</tr></table>`,
        gapBefore: null,
      };
    }
    case "grid": {
      return {
        kind: "html",
        html: serializeBlock(block)
          .replace(/^<div[^>]*>/, "")
          .replace(/<\/div>$/, ""),
        gapBefore: null,
      };
    }
    case "table":
      return {
        kind: "html",
        html: serializeBlock(block)
          .replace(/^<div[^>]*>/, "")
          .replace(/<\/div>$/, ""),
        gapBefore: null,
      };
  }
}

/** Split a column cell into stacked typed items. */
export function parseColumnItems(html: string): ColumnItem[] {
  if (isBlankColumnHtml(html)) return [];

  if (typeof document === "undefined") {
    return [{ kind: "html", html, gapBefore: null }];
  }

  const root = document.createElement("div");
  root.innerHTML = html;
  const marked = Array.from(
    root.querySelectorAll(":scope > [data-tb-col-item]"),
  );
  if (marked.length > 0) {
    return marked.map((el) => parseMarkedColumnItem(el));
  }

  return [inferColumnItemFromHtml(html, null)];
}

/** Serialize stacked column items with kind markers + gaps. */
export function serializeColumnItems(
  items: ColumnItem[],
  defaultGap: number,
): string {
  if (items.length === 0) return EMPTY_COLUMN_HTML;
  const gapDefault = Math.max(0, Math.round(defaultGap));
  return items
    .map((item, index) => {
      const gap = index === 0 ? 0 : (item.gapBefore ?? gapDefault);
      const gapAttr =
        item.gapBefore != null
          ? ` data-tb-gap-before="${Math.max(0, Math.round(item.gapBefore))}"`
          : "";
      // padding-top is more reliable than margin in email clients.
      const padding = gap > 0 ? `padding-top:${gap}px;` : "";
      return `<div data-tb-col-item="1"${columnItemAttrs(item)}${gapAttr} style="${padding}">${renderColumnItemInner(item)}</div>`;
    })
    .join("");
}

function mergeColumnItem(
  existing: string,
  addition: ColumnItem,
  itemGap: number,
): string {
  if (isBlankColumnHtml(existing)) {
    return serializeColumnItems([{ ...addition, gapBefore: null }], itemGap);
  }
  const items = parseColumnItems(existing);
  items.push({ ...addition, gapBefore: null });
  return serializeColumnItems(items, itemGap);
}

/** Inner HTML suitable for nesting a block inside a column cell. */
export function blockToColumnHtml(block: EmailTemplateBlock): string {
  return renderColumnItemInner(blockToColumnItem(block));
}

export function setColumnCount(
  doc: EmailTemplateDocument,
  blockId: string,
  count: number,
): EmailTemplateDocument {
  const clamped = clampColumnCount(count);
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "columns") return block;
      const columns = Array.from(
        { length: clamped },
        (_, index) => block.columns[index] ?? EMPTY_COLUMN_HTML,
      );
      return {
        ...block,
        columns,
        columnWidths:
          block.columnWidths == null
            ? null
            : normalizeColumnWidths(block.columnWidths, clamped),
      };
    }),
  };
}

/**
 * Remove one column from a section. Remaining columns keep their width
 * percentages (and center when they no longer fill 100%). Removing the last
 * column deletes the whole section.
 */
export function removeColumn(
  doc: EmailTemplateDocument,
  blockId: string,
  columnIndex: number,
): EmailTemplateDocument {
  const block = doc.blocks.find((entry) => entry.id === blockId);
  if (!block || block.type !== "columns") return doc;
  if (columnIndex < 0 || columnIndex >= block.columns.length) return doc;

  if (block.columns.length <= 1) {
    return removeBlock(doc, blockId);
  }

  const widths = resolveColumnWidths(block.columnWidths, block.columns.length);
  const nextColumns = block.columns.filter((_, index) => index !== columnIndex);
  const nextWidths = widths.filter((_, index) => index !== columnIndex);
  const widthSum = nextWidths.reduce((total, value) => total + value, 0);

  return {
    ...doc,
    blocks: doc.blocks.map((entry) => {
      if (entry.id !== blockId || entry.type !== "columns") return entry;
      return {
        ...entry,
        columns: nextColumns,
        columnWidths: nextWidths,
        align: widthSum < 100 ? "center" : entry.align,
      };
    }),
  };
}

/** Set percentage widths for each column, or `null` for equal/auto. */
export function setColumnWidths(
  doc: EmailTemplateDocument,
  blockId: string,
  columnWidths: number[] | null,
): EmailTemplateDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "columns") return block;
      return {
        ...block,
        columnWidths:
          columnWidths == null
            ? null
            : normalizeColumnWidths(columnWidths, block.columns.length),
      };
    }),
  };
}

export function resizeTable(
  doc: EmailTemplateDocument,
  blockId: string,
  size: { rowCount: number; columnCount: number },
): EmailTemplateDocument {
  const rowCount = Math.min(12, Math.max(1, Math.round(size.rowCount)));
  const columnCount = Math.min(8, Math.max(1, Math.round(size.columnCount)));
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "table") return block;
      const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
        const source = block.rows[rowIndex] ?? [];
        return Array.from({ length: columnCount }, (_, colIndex) => {
          if (source[colIndex] != null) return source[colIndex]!;
          if (rowIndex === 0) return `Header ${colIndex + 1}`;
          return "Cell";
        });
      });
      return { ...block, rows };
    }),
  };
}

export function insertHtmlIntoColumn(
  doc: EmailTemplateDocument,
  columnsBlockId: string,
  columnIndex: number,
  html: string,
): EmailTemplateDocument {
  return insertColumnItem(
    doc,
    columnsBlockId,
    columnIndex,
    inferColumnItemFromHtml(html, null),
  );
}

export function insertColumnItem(
  doc: EmailTemplateDocument,
  columnsBlockId: string,
  columnIndex: number,
  item: ColumnItem,
): EmailTemplateDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== columnsBlockId || block.type !== "columns") return block;
      if (columnIndex < 0 || columnIndex >= block.columns.length) return block;
      const columns = [...block.columns];
      columns[columnIndex] = mergeColumnItem(
        columns[columnIndex] ?? EMPTY_COLUMN_HTML,
        item,
        block.itemGap,
      );
      return { ...block, columns };
    }),
  };
}

export function insertVariantIntoColumn(
  doc: EmailTemplateDocument,
  columnsBlockId: string,
  columnIndex: number,
  variantId: string,
): EmailTemplateDocument {
  const nested = createBlockFromVariant(variantId);
  return insertColumnItem(
    doc,
    columnsBlockId,
    columnIndex,
    blockToColumnItem(nested),
  );
}

export function moveBlockIntoColumn(
  doc: EmailTemplateDocument,
  blockId: string,
  columnsBlockId: string,
  columnIndex: number,
): EmailTemplateDocument {
  if (blockId === columnsBlockId) return doc;
  const source = doc.blocks.find((block) => block.id === blockId);
  if (!source) return doc;
  const columnsBlock = doc.blocks.find((block) => block.id === columnsBlockId);
  if (!columnsBlock || columnsBlock.type !== "columns") return doc;
  if (columnIndex < 0 || columnIndex >= columnsBlock.columns.length) return doc;

  const withHtml = insertColumnItem(
    doc,
    columnsBlockId,
    columnIndex,
    blockToColumnItem(source),
  );
  return removeBlock(withHtml, blockId);
}

/** Patch a nested column item (image URL, button label, etc.). */
export function updateColumnItem(
  doc: EmailTemplateDocument,
  blockId: string,
  columnIndex: number,
  itemIndex: number,
  patch: Partial<ColumnItem>,
): EmailTemplateDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "columns") return block;
      if (columnIndex < 0 || columnIndex >= block.columns.length) return block;
      const items = parseColumnItems(block.columns[columnIndex] ?? "");
      if (itemIndex < 0 || itemIndex >= items.length) return block;
      items[itemIndex] = { ...items[itemIndex]!, ...patch } as ColumnItem;
      const columns = [...block.columns];
      columns[columnIndex] = serializeColumnItems(items, block.itemGap);
      return { ...block, columns };
    }),
  };
}

/** Update the horizontal gap between columns. */
export function setColumnGap(
  doc: EmailTemplateDocument,
  blockId: string,
  columnGap: number,
): EmailTemplateDocument {
  const nextGap = Math.min(200, Math.max(0, Math.round(columnGap)));
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "columns") return block;
      return { ...block, columnGap: nextGap };
    }),
  };
}

/** Update the default gap between stacked column items (keeps uneven overrides). */
export function setColumnItemGap(
  doc: EmailTemplateDocument,
  blockId: string,
  itemGap: number,
): EmailTemplateDocument {
  const nextGap = Math.min(200, Math.max(0, Math.round(itemGap)));
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "columns") return block;
      const columns = block.columns.map((html) =>
        serializeColumnItems(parseColumnItems(html), nextGap),
      );
      return { ...block, itemGap: nextGap, columns };
    }),
  };
}

/** Set an uneven gap before a specific stacked item (itemIndex > 0). */
export function setColumnItemGapBefore(
  doc: EmailTemplateDocument,
  blockId: string,
  columnIndex: number,
  itemIndex: number,
  gapBefore: number,
): EmailTemplateDocument {
  const nextGap = Math.min(200, Math.max(0, Math.round(gapBefore)));
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "columns") return block;
      if (columnIndex < 0 || columnIndex >= block.columns.length) return block;
      const items = parseColumnItems(block.columns[columnIndex] ?? "");
      if (itemIndex <= 0 || itemIndex >= items.length) return block;
      items[itemIndex] = { ...items[itemIndex]!, gapBefore: nextGap };
      const columns = [...block.columns];
      columns[columnIndex] = serializeColumnItems(items, block.itemGap);
      return { ...block, columns };
    }),
  };
}

function mapGridCells(
  block: EmailTemplateGridBlock,
  nextRows: number,
  nextCols: number,
): string[] {
  const cells = emptyGridCells(nextRows, nextCols);
  const prevRows = clampGridRows(block.rows);
  const prevCols = clampGridColumns(block.columns);
  for (let row = 0; row < Math.min(prevRows, nextRows); row += 1) {
    for (let col = 0; col < Math.min(prevCols, nextCols); col += 1) {
      cells[gridCellIndex(row, col, nextCols)] =
        block.cells[gridCellIndex(row, col, prevCols)] ?? EMPTY_COLUMN_HTML;
    }
  }
  return cells;
}

/** Resize a grid; keeps overlapping cells by row/column. */
export function setGridSize(
  doc: EmailTemplateDocument,
  blockId: string,
  size: { rows: number; columns: number },
): EmailTemplateDocument {
  const rows = clampGridRows(size.rows);
  const columns = clampGridColumns(size.columns);
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "grid") return block;
      return {
        ...block,
        rows,
        columns,
        cells: mapGridCells(block, rows, columns),
        columnWidths:
          block.columnWidths == null
            ? null
            : normalizeTrackSizes(block.columnWidths, columns),
        rowHeights:
          block.rowHeights == null
            ? null
            : normalizeTrackSizes(block.rowHeights, rows),
      };
    }),
  };
}

export function setGridColumnWidths(
  doc: EmailTemplateDocument,
  blockId: string,
  columnWidths: number[] | null,
): EmailTemplateDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "grid") return block;
      return {
        ...block,
        columnWidths:
          columnWidths == null
            ? null
            : normalizeTrackSizes(columnWidths, block.columns),
      };
    }),
  };
}

export function setGridRowHeights(
  doc: EmailTemplateDocument,
  blockId: string,
  rowHeights: number[] | null,
): EmailTemplateDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "grid") return block;
      return {
        ...block,
        rowHeights:
          rowHeights == null
            ? null
            : normalizeTrackSizes(rowHeights, block.rows),
      };
    }),
  };
}

export function setGridGaps(
  doc: EmailTemplateDocument,
  blockId: string,
  gaps: Partial<{
    columnGap: number;
    rowGap: number;
    itemGap: number;
    cellPadding: number;
  }>,
): EmailTemplateDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "grid") return block;
      const itemGap =
        gaps.itemGap != null
          ? Math.min(200, Math.max(0, Math.round(gaps.itemGap)))
          : block.itemGap;
      const cells =
        gaps.itemGap != null
          ? block.cells.map((html) =>
              serializeColumnItems(parseColumnItems(html), itemGap),
            )
          : block.cells;
      return {
        ...block,
        columnGap:
          gaps.columnGap != null
            ? Math.min(200, Math.max(0, Math.round(gaps.columnGap)))
            : block.columnGap,
        rowGap:
          gaps.rowGap != null
            ? Math.min(200, Math.max(0, Math.round(gaps.rowGap)))
            : block.rowGap,
        itemGap,
        cellPadding:
          gaps.cellPadding != null
            ? Math.min(80, Math.max(0, Math.round(gaps.cellPadding)))
            : block.cellPadding,
        cells,
      };
    }),
  };
}

export function insertGridCellItem(
  doc: EmailTemplateDocument,
  gridBlockId: string,
  rowIndex: number,
  columnIndex: number,
  item: ColumnItem,
): EmailTemplateDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== gridBlockId || block.type !== "grid") return block;
      const rows = clampGridRows(block.rows);
      const cols = clampGridColumns(block.columns);
      if (
        rowIndex < 0 ||
        columnIndex < 0 ||
        rowIndex >= rows ||
        columnIndex >= cols
      ) {
        return block;
      }
      const flat = gridCellIndex(rowIndex, columnIndex, cols);
      const cells = [...block.cells];
      while (cells.length < rows * cols) cells.push(EMPTY_COLUMN_HTML);
      cells[flat] = mergeColumnItem(
        cells[flat] ?? EMPTY_COLUMN_HTML,
        item,
        block.itemGap,
      );
      return { ...block, cells };
    }),
  };
}

export function insertVariantIntoGridCell(
  doc: EmailTemplateDocument,
  gridBlockId: string,
  rowIndex: number,
  columnIndex: number,
  variantId: string,
): EmailTemplateDocument {
  const nested = createBlockFromVariant(variantId);
  return insertGridCellItem(
    doc,
    gridBlockId,
    rowIndex,
    columnIndex,
    blockToColumnItem(nested),
  );
}

export function moveBlockIntoGridCell(
  doc: EmailTemplateDocument,
  blockId: string,
  gridBlockId: string,
  rowIndex: number,
  columnIndex: number,
): EmailTemplateDocument {
  if (blockId === gridBlockId) return doc;
  const source = doc.blocks.find((block) => block.id === blockId);
  if (!source) return doc;
  const gridBlock = doc.blocks.find((block) => block.id === gridBlockId);
  if (!gridBlock || gridBlock.type !== "grid") return doc;
  const rows = clampGridRows(gridBlock.rows);
  const cols = clampGridColumns(gridBlock.columns);
  if (
    rowIndex < 0 ||
    columnIndex < 0 ||
    rowIndex >= rows ||
    columnIndex >= cols
  ) {
    return doc;
  }

  const withItem = insertGridCellItem(
    doc,
    gridBlockId,
    rowIndex,
    columnIndex,
    blockToColumnItem(source),
  );
  return removeBlock(withItem, blockId);
}

/** Patch a nested grid cell item. */
export function updateGridCellItem(
  doc: EmailTemplateDocument,
  blockId: string,
  rowIndex: number,
  columnIndex: number,
  itemIndex: number,
  patch: Partial<ColumnItem>,
): EmailTemplateDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block.id !== blockId || block.type !== "grid") return block;
      const rows = clampGridRows(block.rows);
      const cols = clampGridColumns(block.columns);
      if (
        rowIndex < 0 ||
        columnIndex < 0 ||
        rowIndex >= rows ||
        columnIndex >= cols
      ) {
        return block;
      }
      const flat = gridCellIndex(rowIndex, columnIndex, cols);
      const items = parseColumnItems(block.cells[flat] ?? "");
      if (itemIndex < 0 || itemIndex >= items.length) return block;
      items[itemIndex] = { ...items[itemIndex]!, ...patch } as ColumnItem;
      const cells = [...block.cells];
      cells[flat] = serializeColumnItems(items, block.itemGap);
      return { ...block, cells };
    }),
  };
}

export const BLOCK_TYPE_LABELS: Record<EmailTemplateBlockType, string> = {
  text: "Text",
  image: "Image",
  spacer: "Blank Space",
  imageText: "Image + Text",
  button: "Button",
  columns: "Columns",
  grid: "Grid",
  table: "Table",
  html: "HTML",
};

export type BuilderComponentFolderId =
  | "text"
  | "image"
  | "spacer"
  | "button"
  | "layout"
  | "table"
  | "page"
  | "merge"
  | "background";

export interface BuilderComponentVariant {
  id: string;
  label: string;
  /** Compact layout preview key for the palette tile. */
  preview:
    | "text"
    | "heading"
    | "image"
    | "images2"
    | "spacer"
    | "button"
    | "columns2"
    | "columns3"
    | "grid2"
    | "grid3"
    | "table2"
    | "table3"
    | "header"
    | "footer"
    | "merge"
    | "layout";
  /** Single-row column width percentages for layout preview tiles. */
  layoutWidths?: readonly number[];
  /** Display labels for each column (defaults to `${width}%`). */
  layoutLabels?: readonly string[];
  /** Multi-row layout preview (Multiple Sections). */
  layoutRows?: readonly (readonly number[])[];
  /** Display labels per row for multi-section previews. */
  layoutRowLabels?: readonly (readonly string[])[];
}

export interface BuilderComponentGroup {
  id: string;
  label: string;
  variants: readonly BuilderComponentVariant[];
}

export interface BuilderComponentFolder {
  id: BuilderComponentFolderId;
  label: string;
  icon: string;
  note?: string;
  variants: readonly BuilderComponentVariant[];
  /** Nested accordion groups (used by Layout). */
  groups?: readonly BuilderComponentGroup[];
}

export const BUILDER_COMPONENT_FOLDERS: readonly BuilderComponentFolder[] = [
  {
    id: "text",
    label: "Text",
    icon: "title",
    variants: [
      { id: "text-paragraph", label: "Paragraph", preview: "text" },
      { id: "text-heading", label: "Heading", preview: "heading" },
    ],
  },
  {
    id: "image",
    label: "Image",
    icon: "image",
    variants: [
      { id: "image-single", label: "Single image", preview: "image" },
      { id: "image-pair", label: "Two images", preview: "images2" },
    ],
  },
  {
    id: "spacer",
    label: "Spacer",
    icon: "expand",
    variants: [
      { id: "spacer-sm", label: "Small (16px)", preview: "spacer" },
      { id: "spacer-md", label: "Medium (32px)", preview: "spacer" },
      { id: "spacer-lg", label: "Large (64px)", preview: "spacer" },
    ],
  },
  {
    id: "button",
    label: "Button",
    icon: "smart_button",
    variants: [
      { id: "button-center", label: "Centered CTA", preview: "button" },
      { id: "button-left", label: "Left-aligned CTA", preview: "button" },
    ],
  },
  {
    id: "layout",
    label: "Layout",
    icon: "view_column",
    variants: [],
    groups: [
      {
        id: "layout-1",
        label: "1 column",
        variants: [
          {
            id: "columns-1-100",
            label: "100%",
            preview: "layout",
            layoutWidths: [100],
            layoutLabels: ["100%"],
          },
        ],
      },
      {
        id: "layout-2",
        label: "2 column",
        variants: [
          {
            id: "columns-2-50-50",
            label: "50% / 50%",
            preview: "layout",
            layoutWidths: [50, 50],
          },
          {
            id: "columns-2-33-67",
            label: "33% / 67%",
            preview: "layout",
            layoutWidths: [33, 67],
          },
          {
            id: "columns-2-67-33",
            label: "67% / 33%",
            preview: "layout",
            layoutWidths: [67, 33],
          },
          {
            id: "columns-2-25-75",
            label: "25% / 75%",
            preview: "layout",
            layoutWidths: [25, 75],
          },
          {
            id: "columns-2-75-25",
            label: "75% / 25%",
            preview: "layout",
            layoutWidths: [75, 25],
          },
        ],
      },
      {
        id: "layout-3",
        label: "3 column",
        variants: [
          {
            id: "columns-3-33-33-33",
            label: "33.33% / 33.33% / 33.33%",
            preview: "layout",
            layoutWidths: [33, 33, 34],
            layoutLabels: ["33.33%", "33.33%", "33.33%"],
          },
          {
            id: "columns-3-25-50-25",
            label: "25% / 50% / 25%",
            preview: "layout",
            layoutWidths: [25, 50, 25],
          },
          {
            id: "columns-3-25-25-50",
            label: "25% / 25% / 50%",
            preview: "layout",
            layoutWidths: [25, 25, 50],
          },
          {
            id: "columns-3-50-25-25",
            label: "50% / 25% / 25%",
            preview: "layout",
            layoutWidths: [50, 25, 25],
          },
        ],
      },
      {
        id: "layout-4",
        label: "4 column",
        variants: [
          {
            id: "columns-4-25-25-25-25",
            label: "25% / 25% / 25% / 25%",
            preview: "layout",
            layoutWidths: [25, 25, 25, 25],
          },
        ],
      },
      {
        id: "layout-multi",
        label: "Multiple Sections",
        variants: [
          {
            id: "sections-100-50-50",
            label: "100% then 50% / 50%",
            preview: "layout",
            layoutRows: [[100], [50, 50]],
            layoutRowLabels: [["100%"], ["50%", "50%"]],
          },
          {
            id: "sections-50-50-50-50",
            label: "50% / 50% then 50% / 50%",
            preview: "layout",
            layoutRows: [
              [50, 50],
              [50, 50],
            ],
            layoutRowLabels: [
              ["50%", "50%"],
              ["50%", "50%"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "table",
    label: "Table",
    icon: "table",
    variants: [
      { id: "table-2x2", label: "2 × 2 Table", preview: "table2" },
      { id: "table-3x3", label: "3 × 3 Table", preview: "table3" },
    ],
  },
  {
    id: "page",
    label: "Page",
    icon: "web_asset",
    note: "Header and footer sit above and below your email body. Only one of each is used.",
    variants: [
      { id: "header-basic", label: "Header", preview: "header" },
      { id: "footer-basic", label: "Footer", preview: "footer" },
    ],
  },
  {
    id: "merge",
    label: "Merge fields",
    icon: "data_object",
    note: "Drag into a text block, header, or footer. Tokens resolve when the email is sent.",
    variants: TEMPLATE_VARIABLES.map((variable) => ({
      id: mergeFieldVariantId(variable.token),
      label: variable.label,
      preview: "merge" as const,
    })),
  },
  {
    id: "background",
    label: "Background",
    icon: "palette",
    note: "Use Design when nothing is selected, or the color control above the canvas.",
    variants: [],
  },
];

/** @deprecated Prefer BUILDER_COMPONENT_FOLDERS + createBlockFromVariant. */
export const BUILDER_COMPONENT_TYPES: readonly {
  type: Exclude<EmailTemplateBlockType, "html">;
  label: string;
  icon: string;
}[] = [
  { type: "text", label: "Text", icon: "title" },
  { type: "image", label: "Image", icon: "image" },
  { type: "spacer", label: "Spacer", icon: "expand" },
  { type: "imageText", label: "Image + Text", icon: "art_track" },
  { type: "button", label: "Button", icon: "smart_button" },
  { type: "columns", label: "Columns", icon: "view_column" },
  { type: "grid", label: "Grid", icon: "grid_view" },
  { type: "table", label: "Table", icon: "table" },
];

function emptyColumnCells(count: number): string[] {
  return Array.from({ length: Math.max(1, count) }, () => EMPTY_COLUMN_HTML);
}

function createColumnsBlockFromWidths(
  widths: readonly number[],
): EmailTemplateColumnsBlock {
  const normalized = normalizeColumnWidths([...widths], widths.length);
  const autoEqual = equalColumnWidths(normalized.length);
  const isAutoEqual =
    normalized.length === autoEqual.length &&
    normalized.every((width, index) => width === autoEqual[index]);
  return {
    id: createBlockId(),
    type: "columns",
    columns: emptyColumnCells(normalized.length),
    columnWidths: isAutoEqual ? null : normalized,
    columnGap: 24,
    itemGap: 12,
    ...DEFAULT_LAYOUT_CHROME,
    ...AUTO_SIZE,
  };
}

/** One empty 100% column section — the default page content. */
export function createDefaultSectionBlock(): EmailTemplateColumnsBlock {
  return createColumnsBlockFromWidths([100]);
}

/** Ensure a document always has at least one section to edit. */
export function withDefaultSection(
  doc: EmailTemplateDocument,
): EmailTemplateDocument {
  if (doc.blocks.length > 0) return doc;
  return { ...doc, blocks: [createDefaultSectionBlock()] };
}

/** Builder-ready empty page: flat white canvas with one column section. */
export function defaultDocument(
  backgroundColor = DEFAULT_DOCUMENT_BACKGROUND,
): EmailTemplateDocument {
  return withDefaultSection(emptyDocument(backgroundColor));
}

/** One or more blocks for a palette variant (multi-section layouts return several). */
export function createBlocksFromVariant(
  variantId: string,
): EmailTemplateBlock[] {
  switch (variantId) {
    case "sections-100-50-50":
      return [
        createColumnsBlockFromWidths([100]),
        createColumnsBlockFromWidths([50, 50]),
      ];
    case "sections-50-50-50-50":
      return [
        createColumnsBlockFromWidths([50, 50]),
        createColumnsBlockFromWidths([50, 50]),
      ];
    default:
      return [createBlockFromVariant(variantId)];
  }
}

export function createBlockFromVariant(variantId: string): EmailTemplateBlock {
  const id = createBlockId();
  if (isMergeFieldVariant(variantId)) {
    const chip = mergeFieldChipHtmlFromVariant(variantId) ?? "{{}}";
    return {
      id,
      type: "text",
      html: `<p>${chip}</p>`,
      ...DEFAULT_BOX_CHROME,
      ...AUTO_SIZE,
    };
  }
  switch (variantId) {
    case "text-paragraph":
      return {
        id,
        type: "text",
        html: DEFAULT_TEXT_BLOCK_HTML,
        ...DEFAULT_BOX_CHROME,
        ...AUTO_SIZE,
      };
    case "text-heading":
      return {
        id,
        type: "text",
        html: DEFAULT_HEADING_BLOCK_HTML,
        ...DEFAULT_BOX_CHROME,
        ...AUTO_SIZE,
      };
    case "image-single":
      return {
        id,
        type: "image",
        src: "",
        alt: "Image",
        ...DEFAULT_IMAGE_STYLE,
        ...AUTO_SIZE,
      };
    case "image-pair":
      return {
        id,
        type: "columns",
        columns: [
          `<div style="height:100px;background:#e4e4e7;color:#71717a;text-align:center;line-height:100px;font-family:sans-serif;font-size:13px;">Image</div><p><br /></p>`,
          `<div style="height:100px;background:#e4e4e7;color:#71717a;text-align:center;line-height:100px;font-family:sans-serif;font-size:13px;">Image</div><p><br /></p>`,
        ],
        columnWidths: null,
        columnGap: 24,
        itemGap: 12,
        ...DEFAULT_LAYOUT_CHROME,
        ...AUTO_SIZE,
      };
    case "spacer-sm":
      return {
        id,
        type: "spacer",
        height: 16,
        width: null,
        ...DEFAULT_BOX_CHROME,
      };
    case "spacer-md":
      return {
        id,
        type: "spacer",
        height: 32,
        width: null,
        ...DEFAULT_BOX_CHROME,
      };
    case "spacer-lg":
      return {
        id,
        type: "spacer",
        height: 64,
        width: null,
        ...DEFAULT_BOX_CHROME,
      };
    case "imageText-left":
      return {
        id,
        type: "imageText",
        imagePosition: "left",
        image: defaultImageTextImage(),
        text: defaultImageTextText(),
        ...DEFAULT_BOX_CHROME,
        ...AUTO_SIZE,
      };
    case "imageText-right":
      return {
        id,
        type: "imageText",
        imagePosition: "right",
        image: defaultImageTextImage(),
        text: defaultImageTextText(),
        ...DEFAULT_BOX_CHROME,
        ...AUTO_SIZE,
      };
    case "imageText-triple":
      return {
        id,
        type: "columns",
        columns: [
          `<div style="height:72px;background:#e4e4e7;color:#71717a;text-align:center;line-height:72px;font-family:sans-serif;font-size:12px;">Image</div><p><br /></p>`,
          `<div style="height:72px;background:#e4e4e7;color:#71717a;text-align:center;line-height:72px;font-family:sans-serif;font-size:12px;">Image</div><p><br /></p>`,
          `<div style="height:72px;background:#e4e4e7;color:#71717a;text-align:center;line-height:72px;font-family:sans-serif;font-size:12px;">Image</div><p><br /></p>`,
        ],
        columnWidths: null,
        columnGap: 24,
        itemGap: 12,
        ...DEFAULT_LAYOUT_CHROME,
        ...AUTO_SIZE,
      };
    case "button-center":
      return {
        id,
        type: "button",
        label: "Click here",
        href: "https://",
        align: "center",
        ...DEFAULT_BUTTON_STYLE,
        ...AUTO_SIZE,
      };
    case "button-left":
      return {
        id,
        type: "button",
        label: "Click here",
        href: "https://",
        align: "left",
        ...DEFAULT_BUTTON_STYLE,
        ...AUTO_SIZE,
      };
    case "columns-1":
    case "columns-1-100":
      return createColumnsBlockFromWidths([100]);
    case "columns-2":
    case "columns-2-50-50":
      return createColumnsBlockFromWidths([50, 50]);
    case "columns-2-33-67":
      return createColumnsBlockFromWidths([33, 67]);
    case "columns-2-67-33":
      return createColumnsBlockFromWidths([67, 33]);
    case "columns-2-25-75":
      return createColumnsBlockFromWidths([25, 75]);
    case "columns-2-75-25":
      return createColumnsBlockFromWidths([75, 25]);
    case "columns-3":
    case "columns-3-33-33-33":
      return createColumnsBlockFromWidths([33, 33, 34]);
    case "columns-3-25-50-25":
      return createColumnsBlockFromWidths([25, 50, 25]);
    case "columns-3-25-25-50":
      return createColumnsBlockFromWidths([25, 25, 50]);
    case "columns-3-50-25-25":
      return createColumnsBlockFromWidths([50, 25, 25]);
    case "columns-4":
    case "columns-4-25-25-25-25":
      return createColumnsBlockFromWidths([25, 25, 25, 25]);
    case "sections-100-50-50":
      return createColumnsBlockFromWidths([100]);
    case "sections-50-50-50-50":
      return createColumnsBlockFromWidths([50, 50]);
    case "grid-2x2":
      return {
        id,
        type: "grid",
        rows: 2,
        columns: 2,
        cells: emptyGridCells(2, 2),
        columnWidths: null,
        rowHeights: null,
        ...DEFAULT_GRID_STYLE,
        ...AUTO_SIZE,
      };
    case "grid-2x3":
      return {
        id,
        type: "grid",
        rows: 2,
        columns: 3,
        cells: emptyGridCells(2, 3),
        columnWidths: null,
        rowHeights: null,
        ...DEFAULT_GRID_STYLE,
        ...AUTO_SIZE,
      };
    case "grid-3x3":
      return {
        id,
        type: "grid",
        rows: 3,
        columns: 3,
        cells: emptyGridCells(3, 3),
        columnWidths: null,
        rowHeights: null,
        ...DEFAULT_GRID_STYLE,
        ...AUTO_SIZE,
      };
    case "table-2x2":
      return {
        id,
        type: "table",
        rows: [
          ["Header 1", "Header 2"],
          ["Cell", "Cell"],
        ],
        ...DEFAULT_TABLE_STYLE,
        boxChrome: { ...DEFAULT_BOX_CHROME },
        ...AUTO_SIZE,
      };
    case "table-3x3":
      return {
        id,
        type: "table",
        rows: [
          ["Header 1", "Header 2", "Header 3"],
          ["Cell", "Cell", "Cell"],
          ["Cell", "Cell", "Cell"],
        ],
        ...DEFAULT_TABLE_STYLE,
        boxChrome: { ...DEFAULT_BOX_CHROME },
        ...AUTO_SIZE,
      };
    default:
      return createDefaultBlock("text");
  }
}

function textColumnItem(
  html: string,
  gapBefore: number | null = null,
): ColumnTextItem {
  return { kind: "text", html, gapBefore };
}

function buttonColumnItem(label: string, color: string): ColumnButtonItem {
  return {
    kind: "button",
    label,
    href: "mailto:{{sender.email}}",
    align: "left",
    ...DEFAULT_BUTTON_STYLE,
    backgroundColor: color,
    borderColor: color,
    borderRadius: 8,
    fontWeight: "700",
    paddingX: 18,
    paddingY: 12,
    gapBefore: null,
  };
}

function sectionBlock(
  columns: ColumnItem[][],
  options?: {
    backgroundColor?: string;
    paddingX?: number;
    paddingY?: number;
    itemGap?: number;
  },
): EmailTemplateColumnsBlock {
  return {
    id: createBlockId(),
    type: "columns",
    columns: columns.map((items) =>
      serializeColumnItems(items, options?.itemGap ?? 12),
    ),
    columnWidths: equalColumnWidths(columns.length),
    columnGap: 16,
    itemGap: options?.itemGap ?? 12,
    ...DEFAULT_LAYOUT_CHROME,
    backgroundColor: options?.backgroundColor ?? "transparent",
    paddingX: options?.paddingX ?? DEFAULT_LAYOUT_CHROME.paddingX,
    paddingY: options?.paddingY ?? DEFAULT_LAYOUT_CHROME.paddingY,
    ...AUTO_SIZE,
  };
}

const CARD_CANVAS = "#f4f1ea";

const STARTER_ACCENT: Record<string, string> = {
  "basic-one-column": "#1c1917",
  "basic-two-column": "#1c1917",
  "basic-two-column-image": "#1c1917",
  "followup-check-in": "#c2410c",
  "followup-no-answer": "#9a3412",
  "welcome-thanks": "#0f766e",
  "welcome-intro": "#115e59",
  "quotes-pricing": "#1d4ed8",
  "quotes-ready": "#1e40af",
  "notification-next-step": "#6d28d9",
  "notification-appointment": "#5b21b6",
};

function cardSection(columns: ColumnItem[][]): EmailTemplateColumnsBlock {
  return sectionBlock(columns, {
    backgroundColor: "#ffffff",
    paddingX: 16,
    paddingY: 16,
    itemGap: 0,
  });
}

function starterShell(
  accent: string,
  blocks: EmailTemplateBlock[],
): EmailTemplateDocument {
  return {
    ...defaultDocumentChrome(CARD_CANVAS),
    contentBackgroundColor: CARD_CANVAS,
    pageMarginTop: 8,
    pageMarginRight: 10,
    pageMarginBottom: 12,
    pageMarginLeft: 10,
    header: {
      html: `<p style="margin:0;font-size:12px;letter-spacing:1.8px;text-transform:uppercase;color:#ffffff;">{{business.name}}</p>`,
      backgroundColor: accent,
      paddingX: 18,
      paddingY: 16,
      borderWidth: 0,
      borderColor: accent,
      align: "left",
    },
    blocks,
  };
}

function starterTable(
  rows: string[][],
  headerBackgroundColor: string,
): EmailTemplateTableBlock {
  return {
    id: createBlockId(),
    type: "table",
    rows,
    ...DEFAULT_TABLE_STYLE,
    headerBackgroundColor,
    headerTextColor: "#ffffff",
    boxChrome: { ...DEFAULT_BOX_CHROME },
    ...AUTO_SIZE,
  };
}

const HEADING_STYLE =
  "margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.15;color:#1c1917;";

function letterItems(input: {
  accent: string;
  kicker: string;
  heading: string;
  paragraphs: string[];
  button?: string;
}): ColumnItem[] {
  const items: ColumnItem[] = [
    textColumnItem(
      `<p style="margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8175;">${input.kicker}</p>`,
    ),
    textColumnItem(`<p style="${HEADING_STYLE}">${input.heading}</p>`, 6),
    ...input.paragraphs.map((html) =>
      textColumnItem(
        `<div style="font-size:15px;line-height:1.5;color:#44403c;">${html}</div>`,
        10,
      ),
    ),
  ];
  if (input.button) {
    items.push({
      ...buttonColumnItem(input.button, input.accent),
      gapBefore: 16,
    });
  }
  items.push(
    textColumnItem(
      `<p style="margin:0;font-size:14px;line-height:1.45;color:#1c1917;">{{sender.name}}<br /><span style="color:#8a8175;">{{sender.email}}</span></p>`,
      18,
    ),
  );
  return items;
}

function pointColumn(
  index: string,
  title: string,
  detail: string,
  kickerColor: string,
): ColumnItem[] {
  return [
    textColumnItem(
      `<p style="margin:0;font-size:12px;letter-spacing:1.4px;color:${kickerColor};">${index}</p>`,
    ),
    textColumnItem(
      `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.15;color:#1c1917;">${title}</p>`,
      8,
    ),
    textColumnItem(
      `<p style="margin:0;font-size:14px;line-height:1.45;color:#44403c;">${detail}</p>`,
      8,
    ),
  ];
}

/** Known gallery starters as text, button, image, and table blocks. */
function blocksForStarter(id: string): EmailTemplateBlock[] | null {
  switch (id) {
    case "basic-one-column":
      return [
        cardSection([
          letterItems({
            accent: "#1c1917",
            kicker: "Note",
            heading: "A clear note",
            paragraphs: [
              `<p style="margin:0;">Say what matters in the first line.</p>`,
              `<p style="margin:0;">Add the detail underneath, then invite a reply.</p>`,
            ],
            button: "Continue",
          }),
        ]),
      ];
    case "basic-two-column":
      return [
        cardSection([
          pointColumn(
            "01",
            "First point",
            "A short detail the reader can scan.",
            "#c2410c",
          ),
          pointColumn(
            "02",
            "Second point",
            "A matching detail beside it.",
            "#57534e",
          ),
        ]),
      ];
    case "basic-two-column-image":
      return [
        sectionBlock(
          [
            [
              textColumnItem(
                `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.2;text-align:center;color:#fafaf9;">Image</p>`,
              ),
            ],
          ],
          {
            backgroundColor: "#44403c",
            paddingX: 16,
            paddingY: 36,
            itemGap: 0,
          },
        ),
        cardSection([
          pointColumn(
            "01",
            "First point",
            "A short detail under the image.",
            "#1c1917",
          ),
          pointColumn(
            "02",
            "Second point",
            "A matching detail beside it.",
            "#1c1917",
          ),
        ]),
      ];
    case "followup-check-in":
      return [
        cardSection([
          letterItems({
            accent: "#c2410c",
            kicker: "Follow-up",
            heading: "Still here if you need us",
            paragraphs: [
              `<p style="margin:0;">Hi {{lead.first_name}}, just checking in on your note to {{business.name}}. Happy to answer questions or help with the next step.</p>`,
            ],
            button: "Reply",
          }),
        ]),
      ];
    case "followup-no-answer":
      return [
        cardSection([
          letterItems({
            accent: "#9a3412",
            kicker: "Missed you",
            heading: "We tried reaching you",
            paragraphs: [
              `<p style="margin:0;">Hi {{lead.first_name}}, we tried you on {{date.today}} and missed you. Reply when you have a moment and we'll find a time.</p>`,
            ],
            button: "Pick a time",
          }),
        ]),
      ];
    case "welcome-thanks":
      return [
        cardSection([
          letterItems({
            accent: "#0f766e",
            kicker: "Welcome",
            heading: "Thanks for reaching out",
            paragraphs: [
              `<p style="margin:0;">Hi {{lead.first_name}}, thanks for writing {{business.name}}. We have your message and will reply shortly.</p>`,
            ],
            button: "Add a detail",
          }),
        ]),
      ];
    case "welcome-intro":
      return [
        cardSection([
          letterItems({
            accent: "#115e59",
            kicker: "Hello",
            heading: "Welcome in",
            paragraphs: [
              `<p style="margin:0;">Hi {{lead.first_name}}, welcome to {{business.name}}. Tell us what you need and we'll point you the right way.</p>`,
            ],
            button: "Tell us more",
          }),
        ]),
      ];
    case "quotes-pricing":
      return [
        cardSection([
          letterItems({
            accent: "#1d4ed8",
            kicker: "Quote",
            heading: "Your quote",
            paragraphs: [
              `<p style="margin:0;">Hi {{lead.first_name}}, here is what {{business.name}} can offer.</p>`,
            ],
          }).slice(0, -1),
        ]),
        starterTable(
          [
            ["Service", "[describe]"],
            ["Estimate", "[amount]"],
          ],
          "#1d4ed8",
        ),
        cardSection([
          [
            buttonColumnItem("Accept quote", "#1d4ed8"),
            textColumnItem(
              `<p style="margin:0;font-size:14px;line-height:1.45;color:#1c1917;">{{sender.name}}<br /><span style="color:#8a8175;">{{sender.email}}</span></p>`,
            ),
          ],
        ]),
      ];
    case "quotes-ready":
      return [
        cardSection([
          letterItems({
            accent: "#1e40af",
            kicker: "Ready",
            heading: "Your quote is ready",
            paragraphs: [
              `<p style="margin:0;">Hi {{lead.first_name}}, your quote from {{business.name}} is ready. Reply if anything looks off, or if you want to move ahead.</p>`,
            ],
            button: "Review quote",
          }),
        ]),
      ];
    case "notification-next-step":
      return [
        cardSection([
          letterItems({
            accent: "#6d28d9",
            kicker: "Next steps",
            heading: "Here's what's next",
            paragraphs: [
              `<p style="margin:0;">Hi {{lead.first_name}}, a short list from {{business.name}}.</p>`,
              `<p style="margin:0;"><span style="color:#6d28d9;font-family:Georgia,'Times New Roman',serif;">1</span> [Step one]</p>`,
              `<p style="margin:0;"><span style="color:#6d28d9;font-family:Georgia,'Times New Roman',serif;">2</span> [Step two]</p>`,
              `<p style="margin:0;"><span style="color:#6d28d9;font-family:Georgia,'Times New Roman',serif;">3</span> [Step three]</p>`,
            ],
          }),
        ]),
      ];
    case "notification-appointment":
      return [
        cardSection([
          letterItems({
            accent: "#5b21b6",
            kicker: "Confirmed",
            heading: "You're on the calendar",
            paragraphs: [
              `<p style="margin:0;">Hi {{lead.first_name}}, this confirms your time with {{business.name}}.</p>`,
              `<p style="margin:0;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#6d28d9;">When</p>`,
              `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1c1917;">[date/time]</p>`,
            ],
            button: "Reschedule",
          }),
        ]),
      ];
    default:
      return null;
  }
}

/** Convert a gallery starter into an editable block document. */
export function documentFromStarter(input: {
  id: string;
  bodyHtml: string;
  bodyText: string;
  thumbnail?: string;
}): EmailTemplateDocument {
  if (
    input.id === "basic-blank" ||
    (!input.bodyHtml.trim() && !input.bodyText.trim())
  ) {
    return defaultDocument();
  }

  const designed = blocksForStarter(input.id);
  if (designed) {
    return starterShell(STARTER_ACCENT[input.id] ?? "#1c1917", designed);
  }

  if (input.bodyHtml.includes("data-tb-doc")) {
    return parseDocumentFromHtml(input.bodyHtml);
  }

  if (input.bodyHtml.trim()) {
    return parseDocumentFromHtml(input.bodyHtml);
  }

  return {
    ...defaultDocumentChrome(),
    blocks: [
      {
        id: createBlockId(),
        type: "text",
        html:
          input.bodyHtml.trim() ||
          `<p>${input.bodyText.replace(/\n/g, "<br />")}</p>`,
        ...DEFAULT_BOX_CHROME,
        ...AUTO_SIZE,
      },
    ],
  };
}
