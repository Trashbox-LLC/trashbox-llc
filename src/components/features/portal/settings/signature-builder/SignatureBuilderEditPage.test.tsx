import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listEmailSignatures } from "@/lib/api";
import { signatureToContent } from "@/lib/email-signature-document";
import { SignatureBuilderEditPage } from "./SignatureBuilderEditPage";

vi.mock("next/navigation", () => {
  const params = new URLSearchParams();
  return { useSearchParams: () => params };
});

vi.mock("@/lib/api", () => ({
  listEmailSignatures: vi.fn(),
  updateEmailSignature: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

describe("SignatureBuilderEditPage", () => {
  beforeEach(() => {
    window.history.pushState(
      {},
      "",
      "/portal/acme/site/settings/signatures/edit/",
    );
    vi.mocked(listEmailSignatures).mockReset();
  });

  it("loads the signature id from the address bar", async () => {
    window.history.pushState(
      {},
      "",
      "/portal/acme/site/settings/signatures/edit/?id=g1",
    );
    const content = signatureToContent({
      layout: "side",
      logoUrl: "",
      fields: [
        { id: "name", label: "Name", value: "{{sender.name}}" },
        { id: "title", label: "Title", value: "Owner" },
      ],
    });
    vi.mocked(listEmailSignatures).mockResolvedValue({
      items: [
        {
          clientId: "c1",
          id: "g1",
          name: "Sales sign-off",
          bodyText: content.bodyText,
          bodyHtml: content.bodyHtml,
          isDefault: true,
          createdBy: "u1",
          createdAt: "2026-08-04T00:00:00.000Z",
          updatedAt: "2026-08-04T00:00:00.000Z",
        },
      ],
      canManage: true,
    });

    render(<SignatureBuilderEditPage />);

    expect(await screen.findByLabelText(/signature name/i)).toHaveValue(
      "Sales sign-off",
    );
    expect(screen.getByLabelText(/^title value$/i)).toHaveValue("Owner");
    expect(screen.getByRole("switch", { name: /use as default/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
