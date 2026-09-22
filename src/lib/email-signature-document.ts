import {
  renderTemplateVariables,
  type TemplateVariableContext,
} from "@/lib/email-content";

export type SignatureLayout = "stacked" | "side" | "banner";

export interface SignatureField {
  id: string;
  label: string;
  /** Plain text or a merge token such as `{{sender.name}}`. */
  value: string;
}

export interface SignatureDocument {
  layout: SignatureLayout;
  logoUrl: string;
  fields: SignatureField[];
}

export interface SignatureContent {
  bodyText: string;
  bodyHtml: string;
}

const LAYOUTS: readonly SignatureLayout[] = ["stacked", "side", "banner"];
const MARKER = "tb-sig:";

/** Longest edge stored for a logo: twice the 64px side and stacked render. */
export const SIGNATURE_LOGO_MAX_EDGE = 128;

/** Largest compressed logo kept so the signature HTML stays within the API limit. */
export const SIGNATURE_LOGO_MAX_BYTES = 24_000;

export function fitSignatureLogo(
  width: number,
  height: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= SIGNATURE_LOGO_MAX_EDGE) {
    return {
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    };
  }
  const scale = SIGNATURE_LOGO_MAX_EDGE / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function shrinkSignatureLogo(file: Blob): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const size = fitSignatureLogo(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not read that image.");
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    const blob = await exportLogoBlob(canvas);
    return await readDataUrl(blob);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Choose an image file." ||
        error.message.startsWith("Could not"))
    ) {
      throw error;
    }
    throw new Error("Could not read that image.");
  } finally {
    bitmap?.close();
  }
}

export function createSignatureFieldId(): string {
  return `field-${crypto.randomUUID()}`;
}

export function createSignatureDocument(): SignatureDocument {
  return {
    layout: "side",
    logoUrl: "",
    fields: [
      { id: "name", label: "Name", value: "{{sender.name}}" },
      { id: "title", label: "Title", value: "" },
      { id: "email", label: "Email", value: "{{sender.email}}" },
      { id: "phone", label: "Phone", value: "" },
    ],
  };
}

export function filledSignatureFields(
  doc: SignatureDocument,
): SignatureField[] {
  return doc.fields.filter((field) => field.value.trim().length > 0);
}

export function signaturePreviewLines(
  doc: SignatureDocument,
  context: TemplateVariableContext,
): string[] {
  return filledSignatureFields(doc)
    .map((field) => renderTemplateVariables(field.value.trim(), context).trim())
    .filter((line) => line.length > 0);
}

export function reorderSignatureFields(
  fields: readonly SignatureField[],
  fromIndex: number,
  toIndex: number,
): SignatureField[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= fields.length ||
    toIndex >= fields.length
  ) {
    return [...fields];
  }
  const next = [...fields];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return [...fields];
  next.splice(toIndex, 0, item);
  return next;
}

export function signatureToContent(doc: SignatureDocument): SignatureContent {
  const lines = filledSignatureFields(doc).map((field) => field.value.trim());
  const stored: SignatureDocument = {
    layout: doc.layout,
    logoUrl: doc.logoUrl,
    fields: doc.fields.map((field) => ({
      id: field.id,
      label: field.label,
      value: field.value,
    })),
  };
  return {
    bodyText: lines.join("\n"),
    bodyHtml: `<!--${MARKER}${encodeURIComponent(JSON.stringify(stored))}-->${renderSignatureHtml(doc, lines)}`,
  };
}

export function parseSignatureDocument(input: {
  bodyHtml?: string;
  bodyText: string;
}): SignatureDocument {
  const html = input.bodyHtml ?? "";
  const match = html.match(/<!--tb-sig:([\s\S]*?)-->/);
  if (match?.[1]) {
    try {
      const parsed: unknown = JSON.parse(decodeURIComponent(match[1]));
      if (isSignatureDocument(parsed)) return parsed;
    } catch {
      // Fall through to the plain-text signature.
    }
  }
  return {
    layout: "stacked",
    logoUrl: "",
    fields: [
      {
        id: "legacy",
        label: "Text",
        value: input.bodyText,
      },
    ],
  };
}

function isSignatureDocument(value: unknown): value is SignatureDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as SignatureDocument;
  if (!LAYOUTS.includes(doc.layout)) return false;
  if (typeof doc.logoUrl !== "string") return false;
  if (!Array.isArray(doc.fields)) return false;
  return doc.fields.every(
    (field) =>
      !!field &&
      typeof field.id === "string" &&
      typeof field.label === "string" &&
      typeof field.value === "string",
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSignatureHtml(
  doc: SignatureDocument,
  lines: string[],
): string {
  const text =
    doc.layout === "banner"
      ? escapeHtml(lines.join(" · "))
      : lines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
  const logo = doc.logoUrl.trim()
    ? `<img src="${escapeHtml(doc.logoUrl.trim())}" alt="" width="${doc.layout === "banner" ? 24 : 64}" height="${doc.layout === "banner" ? 24 : 64}" style="display:block" />`
    : "";

  if (doc.layout === "stacked") {
    return `<table data-layout="stacked" cellpadding="0" cellspacing="0" role="presentation"><tr><td>${logo}</td></tr><tr><td style="font-family:sans-serif;font-size:14px;line-height:1.4">${text}</td></tr></table>`;
  }

  return `<table data-layout="${doc.layout}" cellpadding="0" cellspacing="0" role="presentation"><tr>${logo ? `<td style="vertical-align:middle;padding-right:12px">${logo}</td>` : ""}<td style="vertical-align:middle;font-family:sans-serif;font-size:14px;line-height:1.4">${text}</td></tr></table>`;
}

const LOGO_QUALITIES = [0.82, 0.6, 0.4];

async function exportLogoBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  for (const type of ["image/webp", "image/jpeg"] as const) {
    for (const quality of LOGO_QUALITIES) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), type, quality);
      });
      if (blob && blob.size <= SIGNATURE_LOGO_MAX_BYTES) return blob;
    }
  }
  throw new Error("Could not shrink that image enough to store.");
}

function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read that image."));
    };
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(blob);
  });
}
