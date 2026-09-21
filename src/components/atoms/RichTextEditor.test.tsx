import { createRef, useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  RichTextEditor,
  type RichTextEditorHandle,
  type RichTextValue,
} from "./RichTextEditor";

describe("RichTextEditor", () => {
  it("renders the core formatting toolbar", () => {
    render(<RichTextEditor ariaLabel="Reply" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /^bold$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^italic$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^underline$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /strikethrough/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /bulleted list/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /numbered list/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^link$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /clear formatting/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /blockquote/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /insert image/i }),
    ).toBeInTheDocument();
  });

  it("hides extra formatting until more is opened", async () => {
    const user = userEvent.setup();
    render(
      <RichTextEditor ariaLabel="Reply" onChange={vi.fn()} compactToolbar />,
    );

    expect(screen.getByRole("button", { name: /^bold$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^link$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^underline$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /numbered list/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^font$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /insert image/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /more formatting/i }));

    expect(
      screen.getByRole("button", { name: /insert image/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^font$/i })).toBeInTheDocument();
  });

  it("can hide the formatting toolbar", () => {
    render(
      <RichTextEditor
        ariaLabel="Reply"
        onChange={vi.fn()}
        showToolbar={false}
      />,
    );

    expect(
      screen.queryByRole("toolbar", { name: /formatting/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /reply/i })).toBeInTheDocument();
  });

  it("renders the formatting toolbar as a floating overlay popup", () => {
    render(
      <RichTextEditor ariaLabel="Reply" onChange={vi.fn()} toolbarOverlay />,
    );

    const overlay = screen.getByTestId("rich-text-toolbar-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay.style.position).toBe("fixed");
    expect(
      within(overlay).getByRole("toolbar", { name: /formatting/i }),
    ).toBeInTheDocument();
    // Overlay is portaled outside the editor root so it doesn’t take layout space.
    expect(
      screen.getByRole("textbox", { name: /reply/i }).parentElement,
    ).not.toContainElement(
      screen.getByRole("toolbar", { name: /formatting/i }),
    );
  });

  it("exposes font, size, color, align, indent and emoji menus", () => {
    render(<RichTextEditor ariaLabel="Reply" onChange={vi.fn()} />);

    const font = screen.getByRole("button", { name: /^font$/i });
    expect(font).toBeInTheDocument();
    expect(font).toHaveTextContent("Arial");

    const fontSize = screen.getByRole("button", { name: /^font size$/i });
    expect(fontSize).toBeInTheDocument();
    expect(fontSize).toHaveTextContent("14");

    expect(
      screen.getByRole("button", { name: /^text color$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^highlight$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^align$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /decrease indent/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /increase indent/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^emoji$/i }),
    ).toBeInTheDocument();
  });

  it("opens the font menu when the font trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<RichTextEditor ariaLabel="Reply" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^font$/i }));
    expect(
      await screen.findByRole("menuitem", { name: /georgia/i }),
    ).toBeInTheDocument();
  });

  it("applies a preset or custom font size from the size picker", async () => {
    const user = userEvent.setup();
    render(<RichTextEditor ariaLabel="Reply" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^font size$/i }));
    expect(
      await screen.findByRole("spinbutton", { name: /custom font size/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /18 pixels/i }));
    expect(
      screen.getByRole("button", { name: /^font size$/i }),
    ).toHaveTextContent("18");

    await user.click(screen.getByRole("button", { name: /^font size$/i }));
    const custom = await screen.findByRole("spinbutton", {
      name: /custom font size/i,
    });
    await user.clear(custom);
    await user.type(custom, "22");
    await user.click(screen.getByRole("button", { name: /^apply$/i }));
    expect(
      screen.getByRole("button", { name: /^font size$/i }),
    ).toHaveTextContent("22");
  });

  it("renders a chrome-style color picker with format and presets", async () => {
    const user = userEvent.setup();
    render(<RichTextEditor ariaLabel="Reply" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^text color$/i }));
    expect(
      await screen.findByLabelText(/text color color picker/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /text color color format/i }),
    ).toHaveValue("css");
    expect(
      screen.getByRole("textbox", { name: /text color color value/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /text color eyedropper/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /text color palette/i }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /text color color format/i }),
      "hex",
    );
    expect(
      screen.getByRole("combobox", { name: /text color color format/i }),
    ).toHaveValue("hex");

    await user.selectOptions(
      screen.getByRole("combobox", { name: /text color color format/i }),
      "rgb",
    );
    expect(
      screen.getByRole("combobox", { name: /text color color format/i }),
    ).toHaveValue("rgb");

    expect(
      screen.getByRole("button", { name: /text color #e53935/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^confirm$/i }),
    ).not.toBeInTheDocument();
  });

  it("updates selected text color live across picker changes", async () => {
    const user = userEvent.setup();
    render(
      <RichTextEditor
        ariaLabel="Reply"
        onChange={vi.fn()}
        initialHtml="<p>Hi</p>"
      />,
    );

    const editor = screen.getByRole("textbox", { name: /reply/i });
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection?.removeAllRanges();
    selection?.addRange(range);

    await user.click(screen.getByRole("button", { name: /^text color$/i }));
    await screen.findByLabelText(/text color color picker/i);

    await user.click(
      screen.getByRole("button", { name: /text color #e53935/i }),
    );
    const live = editor.querySelector("[data-tb-live-color='color']");
    expect(live).toBeTruthy();
    expect(live).toHaveStyle({ color: "rgb(229, 57, 53)" });

    await user.click(
      screen.getByRole("button", { name: /text color #1e88e5/i }),
    );
    expect(editor.querySelector("[data-tb-live-color='color']")).toHaveStyle({
      color: "rgb(30, 136, 229)",
    });
    expect(
      screen.getByLabelText(/text color color picker/i),
    ).toBeInTheDocument();
  });

  it("updates highlight color live across picker changes", async () => {
    const user = userEvent.setup();
    render(
      <RichTextEditor
        ariaLabel="Reply"
        onChange={vi.fn()}
        initialHtml="<p>Hi</p>"
      />,
    );

    const editor = screen.getByRole("textbox", { name: /reply/i });
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection?.removeAllRanges();
    selection?.addRange(range);

    await user.click(screen.getByRole("button", { name: /^highlight$/i }));
    await screen.findByLabelText(/highlight color picker/i);

    await user.click(
      screen.getByRole("button", { name: /highlight #e53935/i }),
    );
    expect(
      editor.querySelector("[data-tb-live-color='highlight']"),
    ).toHaveStyle({ backgroundColor: "rgb(229, 57, 53)" });

    await user.click(
      screen.getByRole("button", { name: /highlight #1e88e5/i }),
    );
    expect(
      editor.querySelector("[data-tb-live-color='highlight']"),
    ).toHaveStyle({ backgroundColor: "rgb(30, 136, 229)" });
  });

  it("softens selection chrome while the color picker is open", async () => {
    const user = userEvent.setup();
    render(<RichTextEditor ariaLabel="Reply" onChange={vi.fn()} />);

    const editor = screen.getByRole("textbox", { name: /reply/i });
    expect(editor).not.toHaveAttribute("data-tb-color-picking");

    await user.click(screen.getByRole("button", { name: /^text color$/i }));
    await screen.findByLabelText(/text color color picker/i);
    expect(editor).toHaveAttribute("data-tb-color-picking", "true");

    await user.click(document.body);
    expect(editor).not.toHaveAttribute("data-tb-color-picking");

    await user.click(screen.getByRole("button", { name: /^highlight$/i }));
    await screen.findByLabelText(/highlight color picker/i);
    expect(editor).toHaveAttribute("data-tb-color-picking", "true");
  });

  it("keeps picker above presets and applies color immediately", async () => {
    const user = userEvent.setup();
    render(
      <RichTextEditor
        ariaLabel="Reply"
        onChange={vi.fn()}
        initialHtml="<p>Hi</p>"
      />,
    );

    const editor = screen.getByRole("textbox", { name: /reply/i });
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection?.removeAllRanges();
    selection?.addRange(range);

    await user.click(screen.getByRole("button", { name: /^text color$/i }));
    const picker = await screen.findByLabelText(/text color color picker/i);
    const value = screen.getByRole("textbox", {
      name: /text color color value/i,
    });
    const preset = screen.getByRole("button", { name: /text color #e53935/i });

    expect(
      picker.compareDocumentPosition(value) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      value.compareDocumentPosition(preset) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await user.click(preset);
    expect(editor.querySelector("[data-tb-live-color='color']")).toHaveStyle({
      color: "rgb(229, 57, 53)",
    });
    // Live apply may focus the editor; picker must stay open for dragging.
    editor.focus();
    expect(
      screen.getByLabelText(/text color color picker/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^confirm$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /text color color value/i }),
    ).toHaveValue("rgb(229, 57, 53)");

    await user.click(document.body);
    expect(
      screen.queryByLabelText(/text color color picker/i),
    ).not.toBeInTheDocument();
  });

  it("applies highlight color immediately without confirm", async () => {
    const user = userEvent.setup();
    render(
      <RichTextEditor
        ariaLabel="Reply"
        onChange={vi.fn()}
        initialHtml="<p>Hi</p>"
      />,
    );

    const editor = screen.getByRole("textbox", { name: /reply/i });
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection?.removeAllRanges();
    selection?.addRange(range);

    await user.click(screen.getByRole("button", { name: /^highlight$/i }));
    await screen.findByLabelText(/highlight color picker/i);
    await user.click(
      screen.getByRole("button", { name: /highlight #e53935/i }),
    );

    expect(
      editor.querySelector("[data-tb-live-color='highlight']"),
    ).toHaveStyle({ backgroundColor: "rgb(229, 57, 53)" });
    expect(
      screen.getByLabelText(/highlight color picker/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /highlight color value/i }),
    ).toHaveValue("rgb(229, 57, 53)");
  });

  it("renders toolbarStart and toolbarEnd slots", () => {
    render(
      <RichTextEditor
        ariaLabel="Reply"
        onChange={vi.fn()}
        toolbarStart={<button type="button">Templates</button>}
        toolbarEnd={<button type="button">Extra end</button>}
      />,
    );

    const toolbar = screen.getByRole("toolbar", { name: /formatting/i });
    expect(toolbar).toContainElement(
      screen.getByRole("button", { name: /^templates$/i }),
    );
    expect(toolbar).toContainElement(
      screen.getByRole("button", { name: /^extra end$/i }),
    );
  });

  it("exposes an accessible editable region with a placeholder", () => {
    render(
      <RichTextEditor
        ariaLabel="Reply"
        placeholder="Type your reply here…"
        onChange={vi.fn()}
      />,
    );

    const editor = screen.getByRole("textbox", { name: /reply/i });
    expect(editor).toHaveAttribute("contenteditable", "true");
    expect(screen.getByText("Type your reply here…")).toBeInTheDocument();
  });

  it("reports content changes as text and html", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RichTextEditor ariaLabel="Reply" onChange={onChange} />);

    const editor = screen.getByRole("textbox", { name: /reply/i });
    await user.click(editor);
    await user.type(editor, "Hello");

    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last.text).toContain("Hello");
    expect(typeof last.html).toBe("string");
  });

  it("keeps caret forward when initialHtml mirrors onChange", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState<RichTextValue>({ html: "", text: "" });
      return (
        <RichTextEditor
          ariaLabel="Reply"
          initialHtml={value.html}
          onChange={setValue}
        />
      );
    }

    render(<Harness />);
    const editor = screen.getByRole("textbox", { name: /reply/i });
    await user.click(editor);
    await user.type(editor, "Hello");

    expect(editor).toHaveTextContent("Hello");
  });

  it("opens with existing content and hides the placeholder", () => {
    render(
      <RichTextEditor
        ariaLabel="Body"
        placeholder="Write a message…"
        initialHtml="<p>Saved body</p>"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("textbox", { name: /body/i })).toContainHTML(
      "<p>Saved body</p>",
    );
    expect(screen.queryByText("Write a message…")).not.toBeInTheDocument();
  });

  it("keeps showing the placeholder when initial content is blank", () => {
    render(
      <RichTextEditor
        ariaLabel="Body"
        placeholder="Write a message…"
        initialHtml=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Write a message…")).toBeInTheDocument();
  });

  it("disables the toolbar and editor when disabled", () => {
    render(<RichTextEditor ariaLabel="Reply" disabled onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /^bold$/i })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: /reply/i })).toHaveAttribute(
      "contenteditable",
      "false",
    );
  });

  it("invokes strikethrough and clear formatting without throwing", async () => {
    const user = userEvent.setup();
    render(<RichTextEditor ariaLabel="Reply" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /strikethrough/i }));
    await user.click(screen.getByRole("button", { name: /clear formatting/i }));
  });

  it("replaces the document through the imperative handle", () => {
    const onChange = vi.fn();
    const ref = createRef<RichTextEditorHandle>();
    render(<RichTextEditor ref={ref} ariaLabel="Reply" onChange={onChange} />);

    ref.current?.setHtml("<p>Template body</p>");

    expect(screen.getByRole("textbox", { name: /reply/i })).toContainHTML(
      "<p>Template body</p>",
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("Template body"),
      }),
    );
  });

  it("inserts html at the current selection through the imperative handle", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const ref = createRef<RichTextEditorHandle>();
    render(<RichTextEditor ref={ref} ariaLabel="Reply" onChange={onChange} />);

    const editor = screen.getByRole("textbox", { name: /reply/i });
    await user.click(editor);
    await user.type(editor, "Hello ");
    ref.current?.insertHtml("<strong>world</strong>");

    expect(editor.textContent).toContain("Hello");
    expect(editor.textContent).toContain("world");
    expect(editor.innerHTML).toMatch(/strong/i);
  });
});
