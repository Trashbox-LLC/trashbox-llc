import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SnippetLibrary } from "./SnippetLibrary";
import type { EmailContentEntry } from "@/components/features/portal/settings/EmailContentSettings";

const hours: EmailContentEntry = {
  id: "s1",
  name: "Hours",
  shortcut: "hours",
  bodyText: "We are open 8am to 5pm, Monday through Friday.",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

const pricing: EmailContentEntry = {
  id: "s2",
  name: "Pricing",
  shortcut: "pricing",
  bodyText: "A standard pickup is $45.",
  updatedAt: "2026-07-14T12:00:00.000Z",
};

function renderLibrary(
  props: Partial<React.ComponentProps<typeof SnippetLibrary>> = {},
) {
  const handlers = {
    onCreate: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <SnippetLibrary
      items={[hours, pricing]}
      canManage
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("SnippetLibrary", () => {
  it("shows the selected snippet inserted into a sample reply", async () => {
    const user = userEvent.setup();
    renderLibrary();

    const preview = screen.getByRole("region", { name: /in a reply/i });
    expect(preview).toHaveTextContent("jordan@example.com");
    expect(preview).toHaveTextContent("Hi Jordan,");
    expect(preview).toHaveTextContent(hours.bodyText);

    await user.click(screen.getByRole("button", { name: /pricing/i }));

    expect(preview).toHaveTextContent(pricing.bodyText);
    expect(preview).not.toHaveTextContent(hours.bodyText);
  });

  it("links New snippet beside the title and Edit to the selected snippet", () => {
    renderLibrary();

    const heading = screen.getByRole("heading", { name: /^snippets$/i });
    const link = screen.getByRole("link", { name: /new snippet/i });
    expect(link).toHaveAttribute(
      "href",
      expect.stringMatching(/snippets\/new\/?$/),
    );
    expect(heading.parentElement).toContainElement(link);
    expect(screen.getByRole("link", { name: /^edit$/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/snippets\/edit\/\?id=s1$/),
    );
  });

  it("shows saved formatting in the reply preview", () => {
    renderLibrary({
      items: [
        {
          ...hours,
          bodyHtml: "<p><strong>We are open</strong> 8am to 5pm.</p>",
        },
      ],
    });

    expect(
      screen.getByRole("region", { name: /in a reply/i }).querySelector("strong"),
    ).toHaveTextContent("We are open");
  });

  it("fills merge tokens in the reply preview", () => {
    renderLibrary({
      items: [
        {
          ...hours,
          bodyText: "Ask for {{sender.name}}.",
        },
      ],
    });

    expect(screen.getByRole("region", { name: /in a reply/i })).toHaveTextContent(
      "Ask for Your team.",
    );
  });

  it("deletes the selected snippet only after confirmation", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { onDelete } = renderLibrary();

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith("s1");
  });

  it("duplicates the selected snippet without its shortcut", async () => {
    const user = userEvent.setup();
    const { onCreate } = renderLibrary();

    await user.click(screen.getByRole("button", { name: /duplicate/i }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Hours (copy)",
        bodyText: hours.bodyText,
        shortcut: "",
      }),
    );
  });
});
