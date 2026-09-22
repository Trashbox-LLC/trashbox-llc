/**
 * Merge-field rendering and input helpers for the email content library
 * (templates, signatures, snippets).
 *
 * The token catalog and the length limits mirror
 * `packages/core/src/email-content.ts` in the Form API. Keep the two in step —
 * the API rejects anything outside these bounds.
 */

export const EMAIL_CONTENT_LIMITS = {
  name: 80,
  subject: 200,
  bodyText: 20_000,
  bodyHtml: 100_000,
  shortcut: 32,
} as const;

export interface TemplateVariable {
  /** Literal token as it appears in a body, e.g. `{{lead.name}}`. */
  token: string;
  label: string;
  description: string;
}

export interface TemplateVariableContext {
  lead?: { name?: string; email?: string };
  business?: { name?: string };
  sender?: { name?: string; email?: string };
  /** Injected for deterministic tests; defaults to the current time. */
  now?: Date;
}

export interface ContentBody {
  bodyText: string;
  bodyHtml?: string;
}

type VariableResolver = (context: TemplateVariableContext) => string;

const VARIABLE_RESOLVERS: Record<string, VariableResolver> = {
  "lead.name": (ctx) => ctx.lead?.name?.trim() ?? "",
  "lead.first_name": (ctx) => firstWord(ctx.lead?.name),
  "lead.email": (ctx) => ctx.lead?.email?.trim() ?? "",
  "business.name": (ctx) => ctx.business?.name?.trim() ?? "",
  "sender.name": (ctx) => ctx.sender?.name?.trim() ?? "",
  "sender.email": (ctx) => ctx.sender?.email?.trim() ?? "",
  "date.today": (ctx) => formatToday(ctx.now ?? new Date()),
};

export const TEMPLATE_VARIABLES: readonly TemplateVariable[] = [
  {
    token: "{{lead.name}}",
    label: "Lead full name",
    description: "Name the lead entered on the form.",
  },
  {
    token: "{{lead.first_name}}",
    label: "Lead first name",
    description: "First word of the lead's name.",
  },
  {
    token: "{{lead.email}}",
    label: "Lead email",
    description: "Email address the lead submitted.",
  },
  {
    token: "{{business.name}}",
    label: "Business name",
    description: "Your business name on the account.",
  },
  {
    token: "{{sender.name}}",
    label: "Sender display name",
    description: "Sender Display Name selected for the reply.",
  },
  {
    token: "{{sender.email}}",
    label: "Sender email",
    description: "Address of the connected business mailbox.",
  },
  {
    token: "{{date.today}}",
    label: "Today's date",
    description: "Current date, for example July 25, 2026.",
  },
];

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

/** Variant id prefix for palette merge-field tiles (`merge-lead.first_name`). */
export const MERGE_FIELD_VARIANT_PREFIX = "merge-";

export function mergeFieldKeyFromToken(token: string): string | null {
  const match = token.trim().match(/^\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}$/);
  return match?.[1] ?? null;
}

export function mergeFieldVariantId(tokenOrKey: string): string {
  const key =
    mergeFieldKeyFromToken(tokenOrKey) ??
    tokenOrKey.replace(/^\{\{|\}\}$/g, "").trim();
  return `${MERGE_FIELD_VARIANT_PREFIX}${key}`;
}

export function isMergeFieldVariant(variantId: string): boolean {
  return variantId.startsWith(MERGE_FIELD_VARIANT_PREFIX);
}

export function parseMergeFieldVariant(
  variantId: string,
): TemplateVariable | null {
  if (!isMergeFieldVariant(variantId)) return null;
  const key = variantId.slice(MERGE_FIELD_VARIANT_PREFIX.length);
  const token = `{{${key}}}`;
  return TEMPLATE_VARIABLES.find((variable) => variable.token === token) ?? null;
}

/** Builder chip markup for a merge token (highlight via `[data-tb-merge]` CSS). */
export function mergeFieldChipHtml(token: string): string {
  const key = mergeFieldKeyFromToken(token);
  if (!key || !VARIABLE_RESOLVERS[key]) {
    return token;
  }
  const safeToken = `{{${key}}}`;
  return `<span data-tb-merge="${key}" contenteditable="false" class="tb-merge-field">${safeToken}</span>`;
}

/**
 * Wrap bare `{{tokens}}` in chip spans for the builder canvas. Already-wrapped
 * chips are left alone.
 */
export function decorateMergeFieldsHtml(html: string): string {
  if (!html || !html.includes("{{")) return html;
  // Clone a fresh regex — the module-level pattern is /g and stateful.
  const pattern = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
  return html.replace(pattern, (match, key: string, offset: number, full: string) => {
    if (!VARIABLE_RESOLVERS[key]) return match;
    const before = full.slice(Math.max(0, offset - 200), offset);
    const marker = `data-tb-merge="${key}"`;
    const markerIdx = before.lastIndexOf(marker);
    if (markerIdx >= 0) {
      const afterMarker = before.slice(markerIdx);
      if (!afterMarker.includes("</span>")) {
        return match;
      }
    }
    return mergeFieldChipHtml(`{{${key}}}`);
  });
}

export function mergeFieldChipHtmlFromVariant(variantId: string): string | null {
  const variable = parseMergeFieldVariant(variantId);
  return variable ? mergeFieldChipHtml(variable.token) : null;
}

function firstWord(value: string | undefined): string {
  return value?.trim().split(/\s+/)[0] ?? "";
}

function formatToday(now: Date): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(now);
}

/**
 * Substitute supported merge fields. Unsupported tokens are left verbatim so a
 * typo stays visible instead of silently vanishing from a sent reply.
 */
export function renderTemplateVariables(
  body: string,
  context: TemplateVariableContext,
): string {
  return body.replace(TOKEN_PATTERN, (match, key: string) => {
    const resolver = VARIABLE_RESOLVERS[key];
    return resolver ? resolver(context) : match;
  });
}

/** Stand-in lead, business, and sender for previews that are not a real send. */
export const PREVIEW_SAMPLE_CONTEXT: TemplateVariableContext = {
  lead: { name: "Jordan Smith", email: "jordan@example.com" },
  business: { name: "Your business" },
  sender: { name: "Your team", email: "you@example.com" },
};

/** Replace catalog merge fields with sample values. Unknown tokens stay put. */
export function renderPreviewTemplate(body: string, now = new Date()): string {
  return renderTemplateVariables(body, { ...PREVIEW_SAMPLE_CONTEXT, now });
}

/** Tokens in `body` that are not in the published catalog, deduplicated. */
export function unknownTemplateVariables(body: string): string[] {
  const unknown: string[] = [];
  const seen = new Set<string>();
  for (const match of body.matchAll(TOKEN_PATTERN)) {
    const key = match[1];
    if (!key || VARIABLE_RESOLVERS[key]) continue;
    const token = `{{${key}}}`;
    if (seen.has(token)) continue;
    seen.add(token);
    unknown.push(token);
  }
  return unknown;
}

/**
 * Coerce shortcut input into something the API will accept, dropping invalid
 * characters as they are typed rather than failing on save.
 */
export function sanitizeShortcutInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/^[-_]+/, "")
    .slice(0, EMAIL_CONTENT_LIMITS.shortcut);
}

export function plainTextToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
}

/** Rich-text body when one was saved, otherwise the escaped plain text. */
export function contentBodyToHtml(body: ContentBody): string {
  const html = body.bodyHtml?.trim();
  return html ? html : plainTextToHtml(body.bodyText);
}

/** Content with merge fields resolved, ready to drop into the composer. */
export function renderContentForInsert(
  body: ContentBody,
  context: TemplateVariableContext,
): { text: string; html: string } {
  return {
    text: renderTemplateVariables(body.bodyText, context),
    html: renderTemplateVariables(contentBodyToHtml(body), context),
  };
}

export function matchSnippetShortcut<T extends { shortcut: string }>(
  snippets: readonly T[],
  typed: string,
): T | undefined {
  const shortcut = sanitizeShortcutInput(typed.replace(/^\/+/, ""));
  if (!shortcut) return undefined;
  return snippets.find((snippet) => snippet.shortcut === shortcut);
}

/**
 * When the caret sits right after `/shortcut`, return that shortcut so the
 * composer can expand it. Returns null when the text does not end on a token.
 */
export function snippetTriggerAtEnd(textBeforeCursor: string): string | null {
  const match = textBeforeCursor.match(/(?:^|\s)\/([a-zA-Z0-9][a-zA-Z0-9_-]{0,31})$/);
  if (!match?.[1]) return null;
  return sanitizeShortcutInput(match[1]) || null;
}

const BODY_ATTR = "data-trashbox-body";
const SIGNATURE_ATTR = "data-trashbox-signature";

/** Build a reply HTML document with swappable body and signature regions. */
export function composeReplyHtml(
  bodyHtml: string,
  signatureHtml?: string,
): string {
  const body = `<div ${BODY_ATTR}>${bodyHtml}</div>`;
  if (!signatureHtml?.trim()) return body;
  return `${body}<div ${SIGNATURE_ATTR}>${signatureHtml}</div>`;
}

function swapRegion(
  fullHtml: string,
  attr: string,
  nextInnerHtml: string,
  { appendIfMissing }: { appendIfMissing: boolean },
): string {
  const pattern = new RegExp(
    `<div\\s+${attr}\\b[^>]*>[\\s\\S]*?<\\/div>`,
    "i",
  );
  const replacement = `<div ${attr}>${nextInnerHtml}</div>`;
  if (pattern.test(fullHtml)) {
    return fullHtml.replace(pattern, replacement);
  }
  if (!appendIfMissing) {
    return `<div ${attr}>${nextInnerHtml}</div>${fullHtml}`;
  }
  return `${fullHtml}${replacement}`;
}

/** Swap or append the signature region; body content is left alone. */
export function replaceReplySignature(
  fullHtml: string,
  signatureHtml: string,
): string {
  if (!signatureHtml.trim()) {
    return fullHtml.replace(
      new RegExp(`<div\\s+${SIGNATURE_ATTR}\\b[^>]*>[\\s\\S]*?<\\/div>`, "i"),
      "",
    );
  }
  if (new RegExp(`<div\\s+${SIGNATURE_ATTR}\\b`, "i").test(fullHtml)) {
    return swapRegion(fullHtml, SIGNATURE_ATTR, signatureHtml, {
      appendIfMissing: true,
    });
  }
  if (new RegExp(`<div\\s+${BODY_ATTR}\\b`, "i").test(fullHtml)) {
    return `${fullHtml}<div ${SIGNATURE_ATTR}>${signatureHtml}</div>`;
  }
  return composeReplyHtml(fullHtml, signatureHtml);
}

/** Replace the body region while preserving any signature block. */
export function replaceReplyBody(fullHtml: string, bodyHtml: string): string {
  if (new RegExp(`<div\\s+${BODY_ATTR}\\b`, "i").test(fullHtml)) {
    return swapRegion(fullHtml, BODY_ATTR, bodyHtml, {
      appendIfMissing: false,
    });
  }
  const signatureMatch = fullHtml.match(
    new RegExp(`(<div\\s+${SIGNATURE_ATTR}\\b[^>]*>[\\s\\S]*?<\\/div>)`, "i"),
  );
  if (signatureMatch?.[1]) {
    return `<div ${BODY_ATTR}>${bodyHtml}</div>${signatureMatch[1]}`;
  }
  return composeReplyHtml(bodyHtml);
}

function regionInnerHtml(fullHtml: string, attr: string): string | null {
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(fullHtml, "text/html");
    const node = doc.querySelector(`[${attr}]`);
    if (node) return node.innerHTML;
  }
  const match = fullHtml.match(
    new RegExp(`<div\\s+${attr}\\b[^>]*>([\\s\\S]*?)<\\/div>`, "i"),
  );
  return match?.[1] ?? null;
}

/** Read the reply body region; falls back to the full HTML when unmarked. */
export function extractReplyBody(fullHtml: string): string {
  return regionInnerHtml(fullHtml, BODY_ATTR) ?? fullHtml;
}

/** Read the signature region; empty string when none is present. */
export function extractReplySignature(fullHtml: string): string {
  return regionInnerHtml(fullHtml, SIGNATURE_ATTR) ?? "";
}

/** Rough plain-text extraction for send payloads and length checks. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
