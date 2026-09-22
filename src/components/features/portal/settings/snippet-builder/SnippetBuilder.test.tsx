import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SnippetBuilder } from "./SnippetBuilder";

function renderBuilder(
  props: Partial<React.ComponentProps<typeof SnippetBuilder>> = {},
) {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  render(<SnippetBuilder onSave={onSave} onCancel={onCancel} {...props} />);
  return { onSave, onCancel };
}

describe("SnippetBuilder", () => {
  it("normalizes the shortcut and resolves the reply preview", async () => {
    const user = userEvent.setup();
    const { onSave } = renderBuilder();

    await user.type(screen.getByLabelText(/snippet name/i), "Pricing");
    await user.type(screen.getByLabelText(/^shortcut$/i), "Base Pricing!");
    expect(screen.getByLabelText(/^shortcut$/i)).toHaveValue("base-pricing");

    const body = screen.getByRole("textbox", { name: /^body$/i });
    await user.click(body);
    await user.type(body, "Hi ");
    await user.click(screen.getByRole("button", { name: /insert field/i }));
    await user.click(screen.getByRole("menuitem", { name: /lead first name/i }));

    const preview = screen.getByRole("region", { name: /in a reply/i });
    expect(preview).toHaveTextContent("Hi Jordan");
    expect(preview).toHaveTextContent("jordan@example.com");
    expect(preview).not.toHaveTextContent("{{");

    await user.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Pricing",
        shortcut: "base-pricing",
        bodyText: expect.stringContaining("Hi {{lead.first_name}}"),
        bodyHtml: expect.stringContaining("{{lead.first_name}}"),
      }),
    );
  });

  it("keeps bold text in the reply preview and in the saved html", async () => {
    const user = userEvent.setup();
    const { onSave } = renderBuilder({
      initialName: "Hours",
      initialBody: "Open 8 to 5",
      initialHtml: "<p><strong>Open</strong> 8 to 5</p>",
    });

    expect(
      screen.getByRole("region", { name: /in a reply/i }).querySelector("strong"),
    ).toHaveTextContent("Open");

    await user.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        bodyText: "Open 8 to 5",
        bodyHtml: "<p><strong>Open</strong> 8 to 5</p>",
      }),
    );
  });

  it("offers bold, links, and lists on the body", async () => {
    const user = userEvent.setup();
    const prompt = vi.spyOn(window, "prompt").mockReturnValue("https://example.com");
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec;
    renderBuilder({ initialName: "Hours", initialBody: "Open" });

    try {
      const body = screen.getByRole("textbox", { name: /^body$/i });
      await user.click(body);
      await user.click(screen.getByRole("button", { name: /^bold$/i }));
      await user.click(screen.getByRole("button", { name: /^link$/i }));
      await user.click(screen.getByRole("button", { name: /bulleted list/i }));

      expect(exec).toHaveBeenCalledWith("bold", false, undefined);
      expect(exec).toHaveBeenCalledWith(
        "createLink",
        false,
        "https://example.com",
      );
      expect(exec).toHaveBeenCalledWith("insertUnorderedList", false, undefined);
    } finally {
      prompt.mockRestore();
      delete document.execCommand;
    }
  });

  it("does not save until there is a name and a body", async () => {
    const user = userEvent.setup();
    const { onSave, onCancel } = renderBuilder();

    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    await user.type(screen.getByLabelText(/snippet name/i), "Hours");
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
