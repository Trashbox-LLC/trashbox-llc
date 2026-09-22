import { afterEach, describe, expect, it, vi } from "vitest";
import { EMAIL_CONTENT_LIMITS } from "./email-content";
import {
  createSignatureDocument,
  filledSignatureFields,
  fitSignatureLogo,
  parseSignatureDocument,
  reorderSignatureFields,
  shrinkSignatureLogo,
  SIGNATURE_LOGO_MAX_BYTES,
  signaturePreviewLines,
  signatureToContent,
  type SignatureField,
} from "./email-signature-document";

const context = {
  sender: { name: "Ezekiel Mohr", email: "ezekiel@trashbox.email" },
  business: { name: "Trashbox" },
};

describe("email signature document", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("starts from a side layout with sender name and email", () => {
    const doc = createSignatureDocument();

    expect(doc.layout).toBe("side");
    expect(doc.fields.map((field) => field.value)).toEqual([
      "{{sender.name}}",
      "",
      "{{sender.email}}",
      "",
    ]);
  });

  it("round-trips layout, fields, and logo through the stored html", () => {
    const doc = {
      ...createSignatureDocument(),
      layout: "stacked" as const,
      logoUrl: "data:image/png;base64,abc",
      fields: [
        { id: "name", label: "Name", value: "{{sender.name}}" },
        { id: "title", label: "Title", value: "Owner" },
      ],
    };

    const stored = signatureToContent(doc);
    const parsed = parseSignatureDocument(stored);

    expect(parsed).toEqual(doc);
    expect(stored.bodyText).toBe("{{sender.name}}\nOwner");
    expect(stored.bodyHtml).toContain("{{sender.name}}");
    expect(stored.bodyHtml).toContain("data:image/png;base64,abc");
  });

  it("omits blank fields from the body that gets sent", () => {
    const stored = signatureToContent(createSignatureDocument());

    expect(filledSignatureFields(createSignatureDocument())).toHaveLength(2);
    expect(stored.bodyText).toBe("{{sender.name}}\n{{sender.email}}");
    expect(stored.bodyHtml.match(/<div>/g)).toHaveLength(2);
  });

  it("joins banner lines and stacks the other layouts", () => {
    const fields: SignatureField[] = [
      { id: "name", label: "Name", value: "Ezekiel Mohr" },
      { id: "email", label: "Email", value: "ezekiel@trashbox.email" },
    ];

    const banner = signatureToContent({
      layout: "banner",
      logoUrl: "",
      fields,
    });
    const side = signatureToContent({
      layout: "side",
      logoUrl: "",
      fields,
    });

    expect(banner.bodyHtml).toContain("Ezekiel Mohr · ezekiel@trashbox.email");
    expect(side.bodyHtml).not.toContain("·");
    expect(banner.bodyHtml.length).toBeLessThanOrEqual(
      EMAIL_CONTENT_LIMITS.bodyHtml,
    );
  });

  it("reads an older plain-text signature as a single text field", () => {
    const parsed = parseSignatureDocument({
      bodyText: "Thanks,\nSales Team",
    });

    expect(parsed.layout).toBe("stacked");
    expect(parsed.fields).toEqual([
      { id: "legacy", label: "Text", value: "Thanks,\nSales Team" },
    ]);
  });

  it("reorders fields without dropping any", () => {
    const fields: SignatureField[] = [
      { id: "a", label: "A", value: "1" },
      { id: "b", label: "B", value: "2" },
      { id: "c", label: "C", value: "3" },
    ];

    expect(reorderSignatureFields(fields, 2, 0).map((field) => field.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(reorderSignatureFields(fields, 0, 0)).toEqual(fields);
  });

  it("resolves merge fields in preview and skips blanks", () => {
    expect(signaturePreviewLines(createSignatureDocument(), context)).toEqual([
      "Ezekiel Mohr",
      "ezekiel@trashbox.email",
    ]);
  });

  it("refuses a file that is not an image", async () => {
    await expect(
      shrinkSignatureLogo(new File(["notes"], "notes.txt", { type: "text/plain" })),
    ).rejects.toThrow();
  });

  it("keeps a small logo and scales the long edge of a large one to 128", () => {
    expect(fitSignatureLogo(40, 20)).toEqual({ width: 40, height: 20 });
    expect(fitSignatureLogo(800, 200)).toEqual({ width: 128, height: 32 });
  });

  it("draws an incoming logo at the fitted size and compresses it", async () => {
    const drawImage = vi.fn();
    const close = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 800, height: 200, close })),
    );
    const toBlob = vi.fn((callback: BlobCallback, type?: string) => {
      callback(new Blob([new Uint8Array(32)], { type: type ?? "image/webp" }));
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      toBlob as typeof HTMLCanvasElement.prototype.toBlob,
    );

    const url = await shrinkSignatureLogo(
      new File([new Uint8Array(80_000)], "photo.png", { type: "image/png" }),
    );

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 128, 32);
    expect(url.startsWith("data:image/webp;base64,")).toBe(true);
    expect(close).toHaveBeenCalled();
  });

  it("compresses harder when the first export is still too large to store", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 64, height: 64, close: vi.fn() })),
    );
    const qualities: number[] = [];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      ((callback: BlobCallback, _type?: string, quality?: number) => {
        qualities.push(quality ?? 0);
        const size =
          qualities.length === 1 ? SIGNATURE_LOGO_MAX_BYTES + 1 : 40;
        callback(new Blob([new Uint8Array(size)], { type: "image/webp" }));
      }) as typeof HTMLCanvasElement.prototype.toBlob,
    );

    await shrinkSignatureLogo(
      new File([new Uint8Array(10)], "photo.png", { type: "image/png" }),
    );

    expect(qualities[0]).toBeGreaterThan(qualities[1] ?? 0);
  });
});
