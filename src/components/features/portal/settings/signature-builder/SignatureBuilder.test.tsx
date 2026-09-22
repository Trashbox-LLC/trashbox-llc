import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SignatureBuilder,
  type SignatureBuilderProps,
} from "./SignatureBuilder";
import { createSignatureDocument } from "@/lib/email-signature-document";

const context = {
  sender: { name: "Ezekiel Mohr", email: "ezekiel@trashbox.email" },
  business: { name: "Trashbox" },
};

function renderBuilder(
  props: Partial<SignatureBuilderProps> = {},
) {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  render(
    <SignatureBuilder
      initialDocument={createSignatureDocument()}
      previewContext={context}
      onSave={onSave}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onSave, onCancel };
}

describe("SignatureBuilder", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("resolves merge fields in the preview and hides empty rows", () => {
    renderBuilder();

    const preview = screen.getByRole("region", { name: /preview/i });
    expect(preview).toHaveTextContent("Ezekiel Mohr");
    expect(preview).toHaveTextContent("ezekiel@trashbox.email");
    expect(preview).not.toHaveTextContent("Owner");
  });

  it("adds a merge field and shows its resolved value", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole("button", { name: /add field/i }));
    await user.click(screen.getByRole("menuitem", { name: /business name/i }));

    expect(screen.getByLabelText(/^business name value$/i)).toHaveValue(
      "{{business.name}}",
    );
    expect(screen.getByRole("region", { name: /preview/i })).toHaveTextContent(
      "Trashbox",
    );
  });

  it("drops a removed field from the preview", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole("button", { name: /remove email/i }));

    expect(screen.getByRole("region", { name: /preview/i })).not.toHaveTextContent(
      "ezekiel@trashbox.email",
    );
  });

  it("reorders fields in the preview from the keyboard", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.type(screen.getByLabelText(/^phone value$/i), "555");
    const preview = screen.getByRole("region", { name: /preview/i });
    expect(preview.textContent?.indexOf("ezekiel@trashbox.email")).toBeLessThan(
      preview.textContent?.indexOf("555") ?? -1,
    );

    screen.getByRole("button", { name: /reorder phone/i }).focus();
    await user.keyboard("{ArrowUp}");

    expect(preview.textContent?.indexOf("555")).toBeLessThan(
      preview.textContent?.indexOf("ezekiel@trashbox.email") ?? -1,
    );
  });

  it("joins preview lines when the banner layout is selected", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole("radio", { name: /banner/i }));

    expect(screen.getByRole("region", { name: /preview/i })).toHaveTextContent(
      "Ezekiel Mohr · ezekiel@trashbox.email",
    );
  });

  it("saves the named signature and skips blank fields", async () => {
    const user = userEvent.setup();
    const { onSave } = renderBuilder();

    await user.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/signature name/i), "Sales");
    await user.click(screen.getByRole("switch", { name: /use as default/i }));
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Sales",
        isDefault: true,
        bodyText: "{{sender.name}}\n{{sender.email}}",
      }),
    );
    expect(onSave.mock.calls[0]?.[0].bodyHtml).toContain("data-layout=\"side\"");
  });

  it("warns when a field uses a merge token that will not be substituted", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.type(
      screen.getByLabelText(/^title value$/i),
      "{{{{lead.nickname}}}}",
    );

    expect(screen.getByText(/not a supported merge field/i)).toHaveTextContent(
      "{{lead.nickname}}",
    );
  });

  it("shows a shrunk logo even when the original file is large", async () => {
    const user = userEvent.setup();
    renderBuilder();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 1200, height: 800, close: vi.fn() })),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      ((callback: BlobCallback) => {
        callback(new Blob([new Uint8Array(24)], { type: "image/webp" }));
      }) as typeof HTMLCanvasElement.prototype.toBlob,
    );

    await user.upload(
      screen.getByLabelText(/logo file/i),
      new File([new Uint8Array(200_000)], "photo.png", { type: "image/png" }),
    );

    const logo = await screen.findByRole("img", { name: /^logo$/i });
    expect(logo).toHaveAttribute("src", expect.stringMatching(/^data:image\/webp/));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error when the image cannot be read", async () => {
    const user = userEvent.setup();
    renderBuilder();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        throw new Error("decode failed");
      }),
    );

    await user.upload(
      screen.getByLabelText(/logo file/i),
      new File(["not-an-image"], "bad.png", { type: "image/png" }),
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /^logo$/i })).not.toBeInTheDocument();
  });

  it("cancels without saving", async () => {
    const user = userEvent.setup();
    const { onSave, onCancel } = renderBuilder();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });
});
