import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { signatureToContent } from "@/lib/email-signature-document";
import {
  EmailContentSettings,
  type EmailContentEntry,
} from "./EmailContentSettings";

const template: EmailContentEntry = {
  id: "t1",
  name: "Quote follow-up",
  subject: "Your quote from {{business.name}}",
  bodyText: "Hi {{lead.first_name}},\n\nHere is your quote.",
  bodyHtml: "<p>Hi {{lead.first_name}},</p><p>Here is your quote.</p>",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

const signature: EmailContentEntry = {
  id: "g1",
  name: "Sales sign-off",
  bodyText: "Thanks,\nSales Team",
  isDefault: true,
  updatedAt: "2026-07-20T10:00:00.000Z",
};

const snippet: EmailContentEntry = {
  id: "s1",
  name: "Business hours",
  shortcut: "hours",
  bodyText: "We are open 8am to 5pm, Monday through Friday.",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

function renderSettings(props: Partial<
  React.ComponentProps<typeof EmailContentSettings>
> = {}) {
  const handlers = {
    onCreate: vi.fn().mockResolvedValue(undefined),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    onMakeDefault: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <EmailContentSettings
      kind="template"
      items={[template]}
      canManage
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("EmailContentSettings", () => {
  it("lists templates with their subject", () => {
    renderSettings();

    expect(screen.getByText("Quote follow-up")).toBeInTheDocument();
    expect(
      screen.getByText(/Your quote from \{\{business\.name\}\}/),
    ).toBeInTheDocument();
  });

  it("documents the available merge fields", () => {
    renderSettings();

    expect(screen.getByText("{{lead.first_name}}")).toBeInTheDocument();
    expect(screen.getByText("{{business.name}}")).toBeInTheDocument();
  });

  it("links New template to the visual builder", () => {
    renderSettings({ items: [] });

    expect(
      screen.getByRole("link", { name: /new template/i }),
    ).toHaveAttribute("href", expect.stringMatching(/templates\/new\/?$/));
  });

  it("links Edit to the template builder edit route", () => {
    renderSettings();

    expect(screen.getByRole("link", { name: /^edit$/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/templates\/edit\/\?id=t1$/),
    );
  });

  it("duplicates a template immediately via onCreate", async () => {
    const user = userEvent.setup();
    const { onCreate, onUpdate } = renderSettings();

    await user.click(screen.getByRole("button", { name: /duplicate/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate.mock.calls[0]?.[0]).toMatchObject({
      name: "Quote follow-up (copy)",
      subject: template.subject,
    });
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("deletes only after the user confirms", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { onDelete } = renderSettings();

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith("t1");
  });

  it("previews a template body as HTML", async () => {
    const user = userEvent.setup();
    renderSettings({
      previewContext: {
        lead: { name: "Dana Brooks", email: "dana@example.com" },
        business: { name: "Acme Hauling" },
      },
    });

    await user.click(screen.getByRole("button", { name: /preview/i }));

    expect(screen.getByText(/Your quote from Acme Hauling/)).toBeInTheDocument();
    expect(
      screen.getByTitle("Preview of Quote follow-up"),
    ).toBeInTheDocument();
  });

  it("hides editing affordances without the manage permission", () => {
    renderSettings({ canManage: false });

    expect(screen.getByText("Quote follow-up")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /new template/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^edit$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Manage Email Templates, Signatures And Snippets/i),
    ).toBeInTheDocument();
  });

  it("explains the empty state per kind", () => {
    renderSettings({ kind: "snippet", items: [] });

    expect(screen.getByText(/no snippets yet/i)).toBeInTheDocument();
  });

  it("fills a saved signature preview from sample data when a field is a merge token", async () => {
    const content = signatureToContent({
      layout: "side",
      logoUrl: "",
      fields: [
        { id: "name", label: "Name", value: "{{sender.name}}" },
        { id: "title", label: "Title", value: "Owner" },
        { id: "email", label: "Email", value: "{{sender.email}}" },
      ],
    });
    renderSettings({
      kind: "signature",
      previewContext: { business: { name: "Acme Hauling" } },
      items: [
        {
          ...signature,
          bodyText: content.bodyText,
          bodyHtml: content.bodyHtml,
        },
      ],
    });

    const preview = screen.getByRole("region", { name: /preview of sales sign-off/i });
    expect(preview).toHaveTextContent("Your team");
    expect(preview).toHaveTextContent("Owner");
    expect(preview).toHaveTextContent("you@example.com");
    expect(preview).not.toHaveTextContent("{{");
  });

  it("marks the default signature and lets managers change it", async () => {
    const user = userEvent.setup();
    const second: EmailContentEntry = {
      ...signature,
      id: "g2",
      name: "Support sign-off",
      isDefault: false,
    };
    const { onMakeDefault } = renderSettings({
      kind: "signature",
      items: [signature, second],
    });

    expect(screen.getByText(/^default$/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /make default/i }));
    expect(onMakeDefault).toHaveBeenCalledWith("g2");
  });

  it("links New signature beside the signatures title", () => {
    renderSettings({ kind: "signature", items: [] });

    const heading = screen.getByRole("heading", { name: /^signatures$/i });
    const link = screen.getByRole("link", { name: /new signature/i });
    expect(link).toHaveAttribute(
      "href",
      expect.stringMatching(/signatures\/new\/?$/),
    );
    expect(heading.parentElement).toContainElement(link);
  });

  it("links Edit to the signature builder", () => {
    renderSettings({ kind: "signature", items: [signature] });

    expect(screen.getByRole("link", { name: /^edit$/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/signatures\/edit\/\?id=g1$/),
    );
  });

  it("duplicates a signature immediately", async () => {
    const user = userEvent.setup();
    const { onCreate, onUpdate } = renderSettings({
      kind: "signature",
      items: [signature],
    });

    await user.click(screen.getByRole("button", { name: /duplicate/i }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Sales sign-off (copy)",
        bodyText: signature.bodyText,
        isDefault: false,
      }),
    );
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("shows a snippet shortcut and normalizes what is typed", async () => {
    const user = userEvent.setup();
    const { onCreate } = renderSettings({ kind: "snippet", items: [snippet] });

    expect(screen.getByText("/hours")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /new snippet/i }));
    await user.type(screen.getByLabelText(/^name$/i), "Pricing");
    await user.type(screen.getByLabelText(/shortcut/i), "Base Pricing!");
    await user.type(
      screen.getByRole("textbox", { name: /body/i }),
      "Our base rate is $99.",
    );
    expect(screen.getByLabelText(/shortcut/i)).toHaveValue("base-pricing");

    await user.click(screen.getByRole("button", { name: /save snippet/i }));
    expect(onCreate.mock.calls[0]?.[0]).toMatchObject({
      shortcut: "base-pricing",
    });
  });

  it("surfaces errors from the caller", () => {
    renderSettings({ error: "Shortcut /hours is already in use" });
    expect(
      screen.getByText("Shortcut /hours is already in use"),
    ).toBeInTheDocument();
  });

  it("disables the actions while a request is in flight", () => {
    renderSettings({ busy: true });
    expect(screen.getByRole("button", { name: /delete/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /duplicate/i })).toBeDisabled();
  });
});
