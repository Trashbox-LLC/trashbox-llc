import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EMAIL_TEMPLATE_STARTERS } from "@/lib/email-template-starters";
import { EmailTemplateGallery } from "./EmailTemplateGallery";

const savedTemplates = [
  {
    id: "saved-1",
    name: "Quote follow-up",
    subject: "Your quote",
  },
];

describe("EmailTemplateGallery", () => {
  it("lists starter cards and category nav in create mode", () => {
    render(
      <EmailTemplateGallery
        mode="create"
        onSelectStarter={vi.fn()}
        onInsertHtmlPlainText={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: /template gallery/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^basic$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /blank/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /follow-up check-in/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /insert html \/ plain text/i }),
    ).toBeInTheDocument();
  });

  it("filters starters when a category is selected", async () => {
    const user = userEvent.setup();
    render(
      <EmailTemplateGallery
        mode="create"
        onSelectStarter={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^quotes$/i }));

    expect(
      screen.getByRole("button", { name: /quote \/ pricing/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^blank$/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /follow-up check-in/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onSelectStarter when a card is chosen", async () => {
    const user = userEvent.setup();
    const onSelectStarter = vi.fn();
    render(
      <EmailTemplateGallery
        mode="create"
        onSelectStarter={onSelectStarter}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /one column/i }));

    const starter = EMAIL_TEMPLATE_STARTERS.find((s) => s.name === "One column");
    expect(onSelectStarter).toHaveBeenCalledWith(starter);
  });

  it("exposes Insert HTML / Plain Text only in create mode", () => {
    const { rerender } = render(
      <EmailTemplateGallery
        mode="create"
        onSelectStarter={vi.fn()}
        onInsertHtmlPlainText={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /insert html \/ plain text/i }),
    ).toBeInTheDocument();

    rerender(
      <EmailTemplateGallery
        mode="compose"
        onSelectStarter={vi.fn()}
        onSelectSaved={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /insert html \/ plain text/i }),
    ).not.toBeInTheDocument();
  });

  it("shows saved templates in the gallery and selects them", async () => {
    const user = userEvent.setup();
    const onSelectSaved = vi.fn();
    render(
      <EmailTemplateGallery
        mode="create"
        savedTemplates={savedTemplates}
        onSelectStarter={vi.fn()}
        onSelectSaved={onSelectSaved}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /quote follow-up/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /quote follow-up/i }));
    expect(onSelectSaved).toHaveBeenCalledWith(savedTemplates[0]);
  });

  it("filters to saved templates from the Saved category", async () => {
    const user = userEvent.setup();
    render(
      <EmailTemplateGallery
        mode="create"
        savedTemplates={savedTemplates}
        onSelectStarter={vi.fn()}
        onSelectSaved={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^saved$/i }));

    expect(
      screen.getByRole("button", { name: /quote follow-up/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /blank/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /follow-up check-in/i }),
    ).not.toBeInTheDocument();
  });

  it("filters the gallery as the search query changes", async () => {
    const user = userEvent.setup();
    render(
      <EmailTemplateGallery
        mode="compose"
        savedTemplates={[
          ...savedTemplates,
          { id: "saved-2", name: "Welcome note", subject: "Hello" },
        ]}
        onSelectStarter={vi.fn()}
        onSelectSaved={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await user.type(
      screen.getByRole("searchbox", { name: /search layouts/i }),
      "pricing",
    );

    expect(
      screen.getByRole("button", { name: /quote \/ pricing/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /blank/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /welcome note/i }),
    ).not.toBeInTheDocument();
  });

  it("shows each starter's HTML in the card preview", () => {
    render(
      <EmailTemplateGallery
        mode="create"
        onSelectStarter={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTitle("One column preview")).toHaveAttribute(
      "srcdoc",
      expect.stringContaining("Write your message here."),
    );
  });

  it("shows saved template HTML in the card preview", () => {
    render(
      <EmailTemplateGallery
        mode="compose"
        savedTemplates={[
          {
            ...savedTemplates[0],
            bodyHtml: "<p>Ready when you are</p>",
          },
        ]}
        onSelectStarter={vi.fn()}
        onSelectSaved={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTitle("Quote follow-up preview")).toHaveAttribute(
      "srcdoc",
      expect.stringContaining("Ready when you are"),
    );
  });

  it("shows an empty library message when Saved has no templates", async () => {
    const user = userEvent.setup();
    render(
      <EmailTemplateGallery
        mode="compose"
        savedTemplates={[]}
        onSelectStarter={vi.fn()}
        onSelectSaved={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^saved$/i }));

    expect(screen.getByText(/no saved templates yet/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /follow-up check-in/i }),
    ).not.toBeInTheDocument();
  });
});
