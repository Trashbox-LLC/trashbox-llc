import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmailSignature } from "@/lib/api";
import { SignatureBuilderCreatePage } from "./SignatureBuilderCreatePage";

vi.mock("@/lib/api", () => ({
  createEmailSignature: vi.fn().mockResolvedValue({ id: "g1" }),
  ApiError: class ApiError extends Error {},
}));

describe("SignatureBuilderCreatePage", () => {
  beforeEach(() => {
    window.history.pushState(
      {},
      "",
      "/portal/acme/site/settings/signatures/new/",
    );
    vi.mocked(createEmailSignature).mockClear();
  });

  it("saves the signature and returns to the list", async () => {
    const user = userEvent.setup();
    render(<SignatureBuilderCreatePage />);

    await user.type(screen.getByLabelText(/signature name/i), "Sales");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createEmailSignature).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Sales",
          bodyText: "{{sender.name}}\n{{sender.email}}",
          isDefault: false,
        }),
      );
      expect(window.location.pathname).toBe(
        "/portal/acme/site/settings/signatures/",
      );
    });
  });
});
