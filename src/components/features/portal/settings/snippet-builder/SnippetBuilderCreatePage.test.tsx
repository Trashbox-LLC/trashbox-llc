import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmailSnippet } from "@/lib/api";
import { SnippetBuilderCreatePage } from "./SnippetBuilderCreatePage";

vi.mock("@/lib/api", () => ({
  createEmailSnippet: vi.fn().mockResolvedValue({ id: "s1" }),
  ApiError: class ApiError extends Error {},
}));

describe("SnippetBuilderCreatePage", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/portal/acme/site/settings/snippets/new/");
    vi.mocked(createEmailSnippet).mockClear();
  });

  it("saves the snippet and returns to the list", async () => {
    const user = userEvent.setup();
    render(<SnippetBuilderCreatePage />);

    await user.type(screen.getByLabelText(/snippet name/i), "Hours");
    await user.type(
      screen.getByLabelText(/^body$/i),
      "We are open 8am to 5pm.",
    );
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(createEmailSnippet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Hours",
          bodyText: "We are open 8am to 5pm.",
          shortcut: null,
        }),
      );
      expect(window.location.pathname).toBe(
        "/portal/acme/site/settings/snippets/",
      );
    });
  });
});
