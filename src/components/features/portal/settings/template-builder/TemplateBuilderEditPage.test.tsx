import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listEmailTemplates } from "@/lib/api";
import { TemplateBuilderEditPage } from "./TemplateBuilderEditPage";

vi.mock("next/navigation", () => {
  const params = new URLSearchParams();
  return { useSearchParams: () => params };
});

vi.mock("@/lib/api", () => ({
  listEmailTemplates: vi.fn(),
  updateEmailTemplate: vi.fn(),
}));

describe("TemplateBuilderEditPage", () => {
  beforeEach(() => {
    window.history.pushState(
      {},
      "",
      "/portal/acme/site/settings/templates/edit/",
    );
    vi.mocked(listEmailTemplates).mockReset();
  });

  it("loads the template id from the address bar", async () => {
    window.history.pushState(
      {},
      "",
      "/portal/acme/site/settings/templates/edit/?id=t1",
    );
    vi.mocked(listEmailTemplates).mockResolvedValue({
      items: [
        {
          clientId: "c1",
          id: "t1",
          name: "Quote follow-up",
          subject: "Your quote",
          bodyText: "Hi there",
          bodyHtml: "<p>Hi there</p>",
          createdBy: "u1",
          createdAt: "2026-08-04T00:00:00.000Z",
          updatedAt: "2026-08-04T00:00:00.000Z",
        },
      ],
      canManage: true,
    });

    render(<TemplateBuilderEditPage />);

    expect(await screen.findByLabelText(/template name/i)).toHaveValue(
      "Quote follow-up",
    );
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });
});
