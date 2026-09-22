import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listEmailSnippets, updateEmailSnippet } from "@/lib/api";
import { SnippetBuilderEditPage } from "./SnippetBuilderEditPage";

vi.mock("next/navigation", () => {
  const params = new URLSearchParams();
  return { useSearchParams: () => params };
});

vi.mock("@/lib/api", () => ({
  listEmailSnippets: vi.fn(),
  updateEmailSnippet: vi.fn().mockResolvedValue({ id: "s1" }),
  ApiError: class ApiError extends Error {},
}));

describe("SnippetBuilderEditPage", () => {
  beforeEach(() => {
    window.history.pushState(
      {},
      "",
      "/portal/acme/site/settings/snippets/edit/?id=s1",
    );
    vi.mocked(listEmailSnippets).mockReset();
    vi.mocked(updateEmailSnippet).mockClear();
  });

  it("loads the snippet and saves edits", async () => {
    const user = userEvent.setup();
    vi.mocked(listEmailSnippets).mockResolvedValue({
      canManage: true,
      items: [
        {
          clientId: "c1",
          id: "s1",
          name: "Hours",
          shortcut: "hours",
          bodyText: "We are open 8am to 5pm.",
          createdBy: "u1",
          createdAt: "2026-07-20T10:00:00.000Z",
          updatedAt: "2026-07-20T10:00:00.000Z",
        },
      ],
    });

    render(<SnippetBuilderEditPage />);

    expect(await screen.findByLabelText(/snippet name/i)).toHaveValue("Hours");
    expect(screen.getByLabelText(/^shortcut$/i)).toHaveValue("hours");

    await user.clear(screen.getByLabelText(/^body$/i));
    await user.type(screen.getByLabelText(/^body$/i), "Open until 6.");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(updateEmailSnippet).toHaveBeenCalledWith(
        "s1",
        expect.objectContaining({
          name: "Hours",
          shortcut: "hours",
          bodyText: "Open until 6.",
        }),
      );
    });
  });
});
