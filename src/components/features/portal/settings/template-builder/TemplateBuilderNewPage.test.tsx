import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEmailTemplate,
  deleteEmailTemplate,
  listEmailTemplates,
} from "@/lib/api";
import { TemplateBuilderNewPage } from "./TemplateBuilderNewPage";
import {
  templateBuilderCreatePath,
  templateBuilderEditPath,
} from "@/lib/portal-settings";

vi.mock("@/lib/api", () => ({
  listEmailTemplates: vi.fn(),
  createEmailTemplate: vi.fn(),
  deleteEmailTemplate: vi.fn(),
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
      await screen.findByRole("button", { name: /^quote follow-up$/i }),
    );

    expect(pushState).toHaveBeenCalledWith(
      null,
      "",
      templateBuilderEditPath("t1"),
    );
  });

  it("creates a copy and opens that copy in the editor", async () => {
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
    vi.mocked(createEmailTemplate).mockResolvedValue({
      clientId: "c1",
      id: "t2",
      name: "Quote follow-up (copy)",
      subject: "Your quote",
      bodyText: "Hi",
      bodyHtml: "<p>Hi</p>",
      createdBy: "u1",
      createdAt: "2026-08-04T00:00:00.000Z",
      updatedAt: "2026-08-04T00:00:00.000Z",
    });
    render(<TemplateBuilderNewPage />);

    await user.click(
      await screen.findByRole("button", { name: /options for quote follow-up/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /create a copy/i }));

    await waitFor(() =>
      expect(createEmailTemplate).toHaveBeenCalledWith({
        name: "Quote follow-up (copy)",
        subject: "Your quote",
        bodyText: "Hi",
        bodyHtml: "<p>Hi</p>",
      }),
    );
    expect(pushState).toHaveBeenCalledWith(
      null,
      "",
      templateBuilderEditPath("t2"),
    );
  });

  it("removes a saved template after the delete confirm delay", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup();
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
      vi.mocked(deleteEmailTemplate).mockResolvedValue(undefined);
      render(<TemplateBuilderNewPage />);

      await user.click(
        await screen.findByRole("button", {
          name: /options for quote follow-up/i,
        }),
      );
      await user.click(screen.getByRole("menuitem", { name: /^delete$/i }));
      const dialog = screen.getByRole("dialog", {
        name: /delete quote follow-up/i,
      });
      await vi.advanceTimersByTimeAsync(3000);
      await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));

      await waitFor(() =>
        expect(deleteEmailTemplate).toHaveBeenCalledWith("t1"),
      );
      expect(
        screen.queryByRole("button", { name: /^quote follow-up$/i }),
      ).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
