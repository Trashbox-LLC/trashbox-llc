import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listEmailTemplates } from "@/lib/api";
import { TemplateBuilderNewPage } from "./TemplateBuilderNewPage";
import {
  templateBuilderCreatePath,
  templateBuilderEditPath,
} from "@/lib/portal-settings";

vi.mock("@/lib/api", () => ({
  listEmailTemplates: vi.fn(),
}));

describe("TemplateBuilderNewPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(listEmailTemplates).mockResolvedValue({
      items: [],
      canManage: true,
    });
  });

  it("opens the full-page builder when a starter is selected", async () => {
    const user = userEvent.setup();
    const pushState = vi.spyOn(window.history, "pushState");
    render(<TemplateBuilderNewPage />);

    expect(
      screen.getByRole("dialog", { name: /template gallery/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /one column/i }));

    expect(pushState).toHaveBeenCalledWith(
      null,
      "",
      templateBuilderCreatePath({ starterId: "basic-one-column" }),
    );
  });

  it("opens a saved template in the editor", async () => {
    const user = userEvent.setup();
    const pushState = vi.spyOn(window.history, "pushState");
    vi.mocked(listEmailTemplates).mockResolvedValue({
      items: [
        {
          clientId: "c1",
          id: "t1",
          name: "Quote follow-up",
          subject: "Your quote",
          bodyText: "Hi",
          bodyHtml: "<p>Hi</p>",
          createdBy: "u1",
          createdAt: "2026-08-04T00:00:00.000Z",
          updatedAt: "2026-08-04T00:00:00.000Z",
        },
      ],
      canManage: true,
    });
    render(<TemplateBuilderNewPage />);

    await user.click(
      await screen.findByRole("button", { name: /quote follow-up/i }),
    );

    expect(pushState).toHaveBeenCalledWith(
      null,
      "",
      templateBuilderEditPath("t1"),
    );
  });
});
