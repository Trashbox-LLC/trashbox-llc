import {
  createEvent,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmailTemplateBuilder } from "./EmailTemplateBuilder";
import {
  emptyDocument,
  appendBlock,
  appendVariant,
  documentFromStarter,
  insertVariantIntoColumn,
} from "@/lib/email-template-document";
import { PREVIEW_SAMPLE_CONTEXT } from "@/lib/email-content";
import { getStarterById } from "@/lib/email-template-starters";
import {
  TB_BLOCK_MIME,
  TB_MERGE_MIME,
  TB_VARIANT_MIME,
} from "@/lib/email-template-dnd";

function getComponentsPalette(): HTMLElement {
  const sidebar = screen.getByRole("complementary", {
    name: /builder sidebar/i,
  });
  return within(sidebar).getByLabelText(/all components/i);
}

describe("EmailTemplateBuilder", () => {
  it("starts with a flat white page and softens content chrome until a page canvas is set", () => {
    render(<EmailTemplateBuilder onSave={vi.fn()} onCancel={vi.fn()} />);

    const surface = screen.getByTestId("template-canvas-drop-surface");
    const paper = screen.getByTestId("template-paper-page");
    // Editor-only chrome: light grey backdrop + white content (not in email HTML).
    expect(surface).toHaveStyle({ backgroundColor: "#e8e8ec" });
    expect(paper).toHaveStyle({ backgroundColor: "#ffffff" });
    expect(paper).toHaveAttribute("data-tb-flat-page", "true");
    expect(paper.className).toMatch(/shadow-/);
    expect(paper.className).not.toMatch(/min-h-/);
    // Global selection is white-on-white; paper uses inverted highlight.
    expect(paper).toHaveAttribute("data-tb-selection", "invert");
    expect(screen.getByTestId("builder-block-wrap-0")).toBeInTheDocument();
    expect(
      screen.queryByText(/drag components anywhere on this page/i),
    ).not.toBeInTheDocument();

    const pageBg = within(
      screen.getByRole("complementary", { name: /component properties/i }),
    ).getByLabelText(/page background$/i);
    fireEvent.change(pageBg, { target: { value: "#d8d8dc" } });
    expect(surface).toHaveStyle({ backgroundColor: "#d8d8dc" });
    expect(paper).toHaveAttribute("data-tb-flat-page", "false");
  });

  it("edits page background color and image from the design inspector", async () => {
    const user = userEvent.setup();
    render(<EmailTemplateBuilder onSave={vi.fn()} onCancel={vi.fn()} />);

    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    expect(within(inspector).getByText(/^design$/i)).toBeInTheDocument();

    const pageBg = within(inspector).getByLabelText(/page background$/i);
    fireEvent.change(pageBg, { target: { value: "#112233" } });

    const surface = screen.getByTestId("template-canvas-drop-surface");
    expect(surface).toHaveStyle({ backgroundColor: "#112233" });

    const bgImage = within(inspector).getByLabelText(/background image/i);
    await user.clear(bgImage);
    await user.type(bgImage, "https://cdn.example/hero.jpg");
    expect(surface.getAttribute("style")).toMatch(
      /url\(["']?https:\/\/cdn\.example\/hero\.jpg["']?\)/,
    );

    const contentBg = within(inspector).getByLabelText(/^content background$/i);
    fireEvent.change(contentBg, { target: { value: "#ffeecc" } });
    expect(screen.getByTestId("template-paper-page")).toHaveStyle({
      backgroundColor: "#ffeecc",
    });

    const topMargin = within(inspector).getByLabelText(/^top$/i);
    await user.clear(topMargin);
    await user.type(topMargin, "40");
    const rightMargin = within(inspector).getByLabelText(/^right$/i);
    await user.clear(rightMargin);
    await user.type(rightMargin, "12");
    const content = screen.getByTestId("template-content-pad");
    expect(content).toHaveStyle({
      paddingTop: "40px",
      paddingRight: "12px",
      paddingBottom: "0px",
      paddingLeft: "0px",
    });
    expect(screen.getByTestId("template-paper-page")).toHaveStyle({
      paddingTop: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      paddingLeft: "0px",
    });
    expect(screen.getByTestId("template-canvas-drop-surface")).toHaveStyle({
      paddingTop: "0px",
      paddingBottom: "0px",
    });
  });

  it("keeps the content page and layouts within 600px with editor hit padding", async () => {
    const user = userEvent.setup();
    render(<EmailTemplateBuilder onSave={vi.fn()} onCancel={vi.fn()} />);

    const paper = screen.getByTestId("template-paper-page");
    expect(paper).toHaveStyle({
      paddingTop: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      paddingLeft: "0px",
      maxWidth: "600px",
    });
    // Flat-page editor chrome insets the paper; document margins stay flush.
    expect(screen.getByTestId("template-canvas-drop-surface")).toHaveStyle({
      paddingTop: "24px",
      paddingBottom: "48px",
    });

    const palette = getComponentsPalette();
    await user.click(
      within(palette).getByRole("button", { name: /^layout$/i }),
    );
    await user.click(
      within(palette).getByRole("button", { name: /^50% \/ 50%$/i }),
    );

    const addedWrap = screen.getByTestId("builder-block-wrap-1");
    expect(addedWrap.className).toMatch(/max-w-\[600px]/);
    const frame = within(addedWrap).getByTestId("builder-block-frame");
    expect(frame.className).toMatch(/-mx-10/);
    expect(frame.className).toMatch(/px-10/);
    expect(
      within(addedWrap).getByTestId("builder-columns-chrome"),
    ).toBeInTheDocument();

    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    expect(
      within(inspector).queryByLabelText(/^full width$/i),
    ).not.toBeInTheDocument();
  });

  it("keeps block outlines flush with zero-height gaps and overlay chrome", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendBlock(doc, "text");
    doc = appendBlock(doc, "text");
    doc = {
      ...doc,
      blocks: doc.blocks.map((block, index) =>
        block.type === "text"
          ? { ...block, html: `<p>Block ${index + 1}</p>` }
          : block,
      ),
    };

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const gap = screen.getByTestId("builder-block-gap");
    expect(gap.className).toMatch(/(?:^|\s)h-0(?:\s|$)/);
    expect(gap.className).not.toMatch(/(?:^|\s)h-6(?:\s|$)/);

    await user.click(screen.getByText("Block 2"));
    const heightHandle = screen.getByRole("slider", { name: /resize height/i });
    const widthHandle = screen.getByRole("slider", { name: /resize width/i });
    expect(heightHandle.className).toMatch(/absolute/);
    expect(heightHandle.className).toMatch(/translate-y-1\/2/);
    expect(widthHandle.className).toMatch(/absolute/);
    expect(widthHandle.className).toMatch(/translate-x-1\/2/);
    expect(screen.getByTestId("builder-block-tag").className).toMatch(
      /-translate-y-full/,
    );
  });

  it("shows page margins flush at 0 with no phantom top spacer", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendBlock(doc, "text");
    doc = {
      ...doc,
      pageMarginTop: 0,
      pageMarginRight: 0,
      pageMarginBottom: 0,
      pageMarginLeft: 0,
      blocks: doc.blocks.map((block) =>
        block.type === "text"
          ? { ...block, html: "<p>Flush edges</p>" }
          : block,
      ),
    };

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const paper = screen.getByTestId("template-paper-page");
    expect(paper).toHaveStyle({
      paddingTop: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      paddingLeft: "0px",
    });

    const firstWrap = screen.getByTestId("builder-block-wrap-0");
    // First block is the first content node — no leading BlockGap before it.
    expect(firstWrap.previousElementSibling).toBeNull();
    expect(paper.querySelector('[data-testid="builder-block-wrap-0"]')).toBe(
      firstWrap,
    );

    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    // Click away so Design is showing
    await user.click(screen.getByTestId("template-canvas-drop-surface"));
    const topMargin = within(inspector).getByLabelText(/^top$/i);
    await user.clear(topMargin);
    await user.type(topMargin, "48");
    expect(screen.getByTestId("template-content-pad")).toHaveStyle({
      paddingTop: "48px",
    });
    expect(paper).toHaveStyle({ paddingTop: "0px" });
  });

  it("adds header and footer from the page folder", async () => {
    const user = userEvent.setup();
    render(
      <EmailTemplateBuilder
        initialName="Branded"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const palette = getComponentsPalette();
    await user.click(within(palette).getByRole("button", { name: /^page$/i }));
    await user.click(
      within(palette).getByRole("button", { name: /^header$/i }),
    );
    expect(screen.getByTestId("builder-page-header")).toBeInTheDocument();

    await user.click(
      within(palette).getByRole("button", { name: /^footer$/i }),
    );
    expect(screen.getByTestId("builder-page-footer")).toBeInTheDocument();

    await user.click(screen.getByTestId("builder-page-header"));
    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    expect(within(inspector).getByLabelText(/^align$/i)).toBeInTheDocument();
    expect(
      within(inspector).getByRole("button", { name: /remove header/i }),
    ).toBeInTheDocument();
  });

  it("adds a text block from the palette folder", async () => {
    const user = userEvent.setup();
    render(<EmailTemplateBuilder onSave={vi.fn()} onCancel={vi.fn()} />);

    const palette = getComponentsPalette();
    await user.click(within(palette).getByRole("button", { name: /^text$/i }));
    await user.click(
      within(palette).getByRole("button", { name: /paragraph/i }),
    );
    expect(screen.getByTestId("template-paper-page")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /text block/i }),
    ).toBeInTheDocument();
    const editor = screen.getByRole("textbox", { name: /text block/i });
    expect(editor).toHaveTextContent(/this is a text block/i);
    expect(editor.innerHTML).toMatch(/text-align:\s*center/i);
    expect(screen.queryByText(/type your text here/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("rich-text-toolbar-overlay")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("rich-text-toolbar-overlay")).getByRole(
        "toolbar",
        { name: /formatting/i },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/select a text block to format/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /duplicate block/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /move up/i }),
    ).toBeInTheDocument();
  });

  it("shows merge fields as chips and only inserts them into text", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendBlock(doc, "text");
    doc = {
      ...doc,
      blocks: doc.blocks.map((block) =>
        block.type === "text" ? { ...block, html: "<p>Hello</p>" } : block,
      ),
    };

    render(
      <EmailTemplateBuilder
        initialName="Merge"
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const palette = getComponentsPalette();
    await user.click(
      within(palette).getByRole("button", { name: /^merge fields$/i }),
    );

    const chipTile = within(palette).getByRole("button", {
      name: /drag lead first name into text/i,
    });
    expect(chipTile).toHaveTextContent("{{lead.first_name}}");
    expect(chipTile).toHaveAttribute(
      "data-testid",
      "merge-palette-merge-lead.first_name",
    );

    // Click must not create a standalone merge block.
    await user.click(chipTile);
    expect(
      document.querySelector('[data-tb-merge="lead.first_name"]'),
    ).toBeNull();
    expect(screen.getAllByTestId("builder-block-frame")).toHaveLength(1);

    // Dropping on the page (not into text) must not add a block.
    const page = screen.getByTestId("template-paper-page");
    const pageDataTransfer = {
      getData: (type: string) => {
        if (type === TB_VARIANT_MIME) return "merge-lead.first_name";
        if (type === TB_MERGE_MIME) return "merge-lead.first_name";
        if (type === "text/plain") return "tb-variant:merge-lead.first_name";
        return "";
      },
      types: [TB_VARIANT_MIME, TB_MERGE_MIME, "text/plain"],
      dropEffect: "copy",
      effectAllowed: "copy",
    };
    fireEvent.drop(page, { dataTransfer: pageDataTransfer });
    expect(
      document.querySelector('[data-tb-merge="lead.first_name"]'),
    ).toBeNull();

    // Select the text block so the editor mounts, then drop the merge chip.
    await user.click(screen.getByText("Hello"));
    const editor = screen.getByRole("textbox", { name: /text block/i });
    fireEvent.drop(editor, { dataTransfer: pageDataTransfer });
    const chip = document.querySelector('[data-tb-merge="lead.first_name"]');
    expect(chip).toBeTruthy();
    expect(chip).toHaveTextContent("{{lead.first_name}}");
    expect(chip).toHaveClass("tb-merge-field");
  });

  it("adds a grid block and shows layout settings", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "grid-2x2");
    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("builder-section-bleed-left"));

    expect(screen.getByTestId("builder-grid")).toBeInTheDocument();
    expect(screen.getByTestId("builder-grid-drop-0-0")).toBeInTheDocument();
    expect(screen.getByTestId("builder-grid-drop-1-1")).toBeInTheDocument();

    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    expect(within(inspector).getByLabelText(/^rows$/i)).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^columns$/i)).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/column gap/i)).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/row gap/i)).toBeInTheDocument();
    expect(
      within(inspector).getByLabelText(/item spacing/i),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByLabelText(/cell padding/i),
    ).toBeInTheDocument();
  });

  it("allows typing spaces in a text block", async () => {
    const user = userEvent.setup();
    render(<EmailTemplateBuilder onSave={vi.fn()} onCancel={vi.fn()} />);

    const palette = getComponentsPalette();
    await user.click(within(palette).getByRole("button", { name: /^text$/i }));
    await user.click(
      within(palette).getByRole("button", { name: /paragraph/i }),
    );

    const editor = screen.getByRole("textbox", { name: /text block/i });
    await user.type(editor, "Hello world");

    expect(editor).toHaveTextContent("Hello world");
  });

  it("allows typing spaces in a text item inside a column", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-1");
    doc = insertVariantIntoColumn(doc, doc.blocks[0]!.id, 0, "text-paragraph");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("builder-column-item-0-0"));
    const editor = screen.getByRole("textbox", {
      name: /column 1 text item/i,
    });
    await user.clear(editor);
    await user.type(editor, "Hello world");

    expect(editor).toHaveTextContent("Hello world");
  });

  it("opens layout folder with nested width presets and empty columns", async () => {
    const user = userEvent.setup();
    render(<EmailTemplateBuilder onSave={vi.fn()} onCancel={vi.fn()} />);

    const palette = getComponentsPalette();
    await user.click(
      within(palette).getByRole("button", { name: /^layout$/i }),
    );
    expect(
      within(palette).getByRole("button", { name: /^1 column$/i }),
    ).toBeInTheDocument();
    expect(
      within(palette).getByRole("button", { name: /^2 column$/i }),
    ).toBeInTheDocument();
    expect(
      within(palette).getByRole("button", { name: /^3 column$/i }),
    ).toBeInTheDocument();
    expect(
      within(palette).getByRole("button", { name: /^4 column$/i }),
    ).toBeInTheDocument();
    expect(
      within(palette).getByRole("button", { name: /^multiple sections$/i }),
    ).toBeInTheDocument();
    expect(
      within(palette).queryByRole("button", { name: /image \+ text/i }),
    ).not.toBeInTheDocument();
    expect(
      within(palette).queryByRole("button", { name: /2 × 2 grid/i }),
    ).not.toBeInTheDocument();

    expect(
      within(palette).getByRole("button", { name: /^100%$/i }),
    ).toBeInTheDocument();
    expect(
      within(palette).getByRole("button", { name: /^50% \/ 50%$/i }),
    ).toBeInTheDocument();
    expect(
      within(palette).getByRole("button", { name: /^33% \/ 67%$/i }),
    ).toBeInTheDocument();

    await user.click(
      within(palette).getByRole("button", {
        name: /^33\.33% \/ 33\.33% \/ 33\.33%$/i,
      }),
    );
    const addedWrap = screen.getByTestId("builder-block-wrap-1");
    expect(
      within(addedWrap).getByTestId("builder-column-drop-0"),
    ).toBeInTheDocument();
    expect(
      within(addedWrap).getByTestId("builder-column-drop-2"),
    ).toBeInTheDocument();
    expect(
      within(addedWrap).queryByRole("textbox", { name: /column \d/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/left column/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/details go here/i)).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/column text/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/drop a component here/i),
    ).not.toBeInTheDocument();
  });

  it("exposes layout chrome controls for columns on the inspector", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-2");

    render(
      <EmailTemplateBuilder
        initialName="Chrome"
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("builder-column-drop-0"));
    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    expect(
      within(inspector).getByLabelText(/^background$/i),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByLabelText(/^block align$/i),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByLabelText(/cell vertical align/i),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByLabelText(/^cell padding$/i),
    ).toBeInTheDocument();

    fireEvent.change(within(inspector).getByLabelText(/^background$/i), {
      target: { value: "#ffeedd" },
    });
    expect(screen.getByTestId("builder-columns-chrome")).toHaveStyle({
      backgroundColor: "#ffeedd",
    });
  });

  it("replaces a deleted last section with a single column section", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-2-50-50");
    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // Removing every column deletes the section; the doc seeds a fresh 1-col section.
    await user.click(screen.getByTestId("builder-column-delete-0"));
    await user.click(screen.getByTestId("builder-column-delete-0"));

    expect(screen.getByTestId("builder-block-wrap-0")).toBeInTheDocument();
    expect(
      screen.queryByTestId("builder-block-wrap-1"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("builder-columns-grid")).toBeInTheDocument();
    expect(screen.getByTestId("builder-column-drop-0")).toBeInTheDocument();
    expect(
      screen.queryByTestId("builder-column-drop-1"),
    ).not.toBeInTheDocument();
  });

  it("accepts a palette variant dropped onto the empty page", async () => {
    const user = userEvent.setup();
    render(<EmailTemplateBuilder onSave={vi.fn()} onCancel={vi.fn()} />);

    const palette = getComponentsPalette();
    await user.click(
      within(palette).getByRole("button", { name: /^button$/i }),
    );
    const centered = within(palette).getByRole("button", {
      name: /centered cta/i,
    });

    const page = screen.getByTestId("template-paper-page");
    fireEvent.dragStart(centered, {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: "copy",
      },
    });
    // Simulate a completed drop with payload (jsdom dataTransfer is limited).
    const dataTransfer = {
      getData: (type: string) =>
        type === TB_VARIANT_MIME || type === "text/plain"
          ? type === "text/plain"
            ? "tb-variant:button-center"
            : "button-center"
          : "",
      types: [TB_VARIANT_MIME, "text/plain"],
      dropEffect: "copy",
      effectAllowed: "copy",
    };
    fireEvent.drop(page, { dataTransfer });

    expect(screen.getByText("Click here")).toBeInTheDocument();
  });

  it("reorders a block when dropped on the page near another block", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendBlock(doc, "text");
    doc = appendBlock(doc, "button");
    doc = {
      ...doc,
      blocks: doc.blocks.map((block) =>
        block.type === "text"
          ? { ...block, html: "<p>First block</p>" }
          : block.type === "button"
            ? { ...block, label: "Second CTA" }
            : block,
      ),
    };
    const buttonId = doc.blocks[1]!.id;

    const originalGetRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect =
      function getBoundingClientRect() {
        const indexAttr = this.getAttribute?.("data-builder-block-index");
        if (indexAttr != null) {
          const i = Number(indexAttr);
          const top = 100 + i * 100;
          return {
            top,
            height: 80,
            bottom: top + 80,
            left: 0,
            right: 400,
            width: 400,
            x: 0,
            y: top,
            toJSON: () => ({}),
          } as DOMRect;
        }
        return originalGetRect.call(this);
      };

    try {
      render(
        <EmailTemplateBuilder
          initialDocument={doc}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />,
      );

      await user.click(screen.getByText("Second CTA"));
      expect(
        screen.getByRole("button", { name: /drag to reorder/i }),
      ).toBeInTheDocument();

      const page = screen.getByTestId("template-paper-page");
      // Match the empty-page drop mock — jsdom DataTransfer is limited.
      const dataTransfer = {
        getData: (type: string) => {
          if (type === TB_BLOCK_MIME) return buttonId;
          if (type === "text/plain") return `tb-block:${buttonId}`;
          return "";
        },
        types: [TB_BLOCK_MIME, "text/plain"],
        dropEffect: "move",
        effectAllowed: "move",
      };

      // jsdom DragEvents often omit clientY from the init dict — set it explicitly.
      const overEvent = createEvent.dragOver(page, { dataTransfer });
      Object.defineProperty(overEvent, "clientY", { value: 20 });
      fireEvent(page, overEvent);

      const dropEvent = createEvent.drop(page, { dataTransfer });
      Object.defineProperty(dropEvent, "clientY", { value: 20 });
      fireEvent(page, dropEvent);

      const list = within(page).getByTestId("builder-block-wrap-0");
      expect(list.textContent?.toLowerCase()).toContain("second cta");
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetRect;
    }
  });

  it("shows button style controls in the right inspector", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendBlock(doc, "button");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Click here"));

    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    expect(within(inspector).getByLabelText(/^fill$/i)).toBeInTheDocument();
    expect(
      within(inspector).getByLabelText(/corner radius/i),
    ).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^width$/i)).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^height$/i)).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^font$/i)).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^size$/i)).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^weight$/i)).toBeInTheDocument();
    expect(
      within(inspector).getByLabelText(/stroke width/i),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByLabelText(/^fill opacity$/i),
    ).toBeInTheDocument();
    expect(
      within(inspector).getByLabelText(/^text opacity$/i),
    ).toBeInTheDocument();

    await user.selectOptions(
      within(inspector).getByLabelText(/^font$/i),
      "Georgia, Times New Roman, serif",
    );
    expect(screen.getByText("Click here")).toHaveStyle({
      fontFamily: "Georgia, Times New Roman, serif",
    });

    const fillOpacity = within(inspector).getByLabelText(/^fill opacity$/i);
    await user.clear(fillOpacity);
    await user.type(fillOpacity, "40");
    expect(screen.getByText("Click here")).toHaveStyle({
      backgroundColor: "rgba(37, 99, 235, 0.4)",
    });

    await user.clear(within(inspector).getByLabelText(/corner radius/i));
    await user.type(within(inspector).getByLabelText(/corner radius/i), "20");
    expect(screen.getByText("Click here")).toHaveStyle({
      borderRadius: "20px",
    });
  });

  it("shows column and table controls in the inspector", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-2");
    doc = appendVariant(doc, "table-2x2");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("builder-column-drop-0"));
    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    expect(
      within(inspector).getByLabelText(/column count/i),
    ).toBeInTheDocument();
    const columnCount = within(inspector).getByLabelText(/column count/i);
    await user.clear(columnCount);
    await user.type(columnCount, "3");
    expect(screen.getByTestId("builder-column-drop-2")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /column \d/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("Header 1"));
    expect(within(inspector).getByLabelText(/rows/i)).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^columns$/i)).toBeInTheDocument();
    expect(
      within(inspector).getByLabelText(/^header fill$/i),
    ).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^font$/i)).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^size$/i)).toBeInTheDocument();

    const rowsField = within(inspector).getByLabelText(/rows/i);
    await user.clear(rowsField);
    await user.type(rowsField, "3");
    expect(screen.getByLabelText(/cell 3, 1/i)).toBeInTheDocument();
  });

  it("clears the page drop indicator after a nested column drop", () => {
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-2");
    doc = appendBlock(doc, "text");

    const originalGetRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect =
      function getBoundingClientRect() {
        const indexAttr = this.getAttribute?.("data-builder-block-index");
        if (indexAttr != null) {
          const i = Number(indexAttr);
          const top = 100 + i * 100;
          return {
            top,
            height: 80,
            bottom: top + 80,
            left: 0,
            right: 400,
            width: 400,
            x: 0,
            y: top,
            toJSON: () => ({}),
          } as DOMRect;
        }
        return originalGetRect.call(this);
      };

    try {
      render(
        <EmailTemplateBuilder
          initialDocument={doc}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />,
      );

      const surface = screen.getByTestId("template-canvas-drop-surface");
      const dataTransfer = {
        getData: (type: string) =>
          type === TB_VARIANT_MIME || type === "text/plain"
            ? type === "text/plain"
              ? "tb-variant:button-center"
              : "button-center"
            : "",
        types: [TB_VARIANT_MIME, "text/plain"],
        dropEffect: "copy",
        effectAllowed: "copy",
      };

      // Pointer above the first block midpoint → insert slot 0.
      const overEvent = createEvent.dragOver(surface, { dataTransfer });
      Object.defineProperty(overEvent, "clientY", { value: 110 });
      fireEvent(surface, overEvent);
      expect(screen.getByTestId("builder-drop-slot-0")).toBeInTheDocument();
      expect(
        screen.getByLabelText(/^insert before section$/i),
      ).toBeInTheDocument();

      // Column drop stops propagation — page handler must still clear the bar.
      const column = screen.getByTestId("builder-column-drop-0");
      fireEvent.drop(column, { dataTransfer });
      fireEvent.dragEnd(window);

      expect(
        screen.queryByTestId("builder-drop-slot-0"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(/^insert before section$/i),
      ).not.toBeInTheDocument();
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetRect;
    }
  });

  it("drops an image variant into a column cell", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-2");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const palette = getComponentsPalette();
    await user.click(within(palette).getByRole("button", { name: /^image$/i }));
    const single = within(palette).getByRole("button", {
      name: /single image/i,
    });

    const column = screen.getByTestId("builder-column-drop-0");
    const dataTransfer = {
      getData: (type: string) =>
        type === TB_VARIANT_MIME || type === "text/plain"
          ? type === "text/plain"
            ? "tb-variant:image-single"
            : "image-single"
          : "",
      types: [TB_VARIANT_MIME, "text/plain"],
      dropEffect: "copy",
      effectAllowed: "copy",
    };
    fireEvent.drop(column, { dataTransfer });

    expect(column.innerHTML).toMatch(/img|Add image|Image/i);
    // Should not also add a root-level image block.
    expect(screen.queryByLabelText(/image url/i)).not.toBeInTheDocument();
  });

  it("drops a button variant into a grid cell", async () => {
    let doc = emptyDocument();
    doc = appendVariant(doc, "grid-2x2");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const cell = screen.getByTestId("builder-grid-drop-0-1");
    const dataTransfer = {
      getData: (type: string) =>
        type === TB_VARIANT_MIME || type === "text/plain"
          ? type === "text/plain"
            ? "tb-variant:button-center"
            : "button-center"
          : "",
      types: [TB_VARIANT_MIME, "text/plain"],
      dropEffect: "copy",
      effectAllowed: "copy",
    };
    fireEvent.drop(cell, { dataTransfer });

    expect(cell.innerHTML).toMatch(/Click here/i);
    expect(screen.getByTestId("builder-grid-item-0-1-0")).toBeInTheDocument();
  });

  it("edits image fit from the inspector", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "image-single");
    doc = {
      ...doc,
      blocks: doc.blocks.map((block) =>
        block.type === "image"
          ? { ...block, src: "https://cdn.example/square.png" }
          : block,
      ),
    };

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByAltText("Image"));
    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    const fitField = within(inspector).getByLabelText(/^fit$/i);
    expect(fitField).toHaveValue("fit");

    const previewImg = screen.getByAltText("Image");
    expect(previewImg).toHaveStyle({ width: "auto", maxWidth: "100%" });

    await user.selectOptions(fitField, "fill");
    expect(fitField).toHaveValue("fill");
    expect(screen.getByAltText("Image")).toHaveStyle({ width: "100%" });

    await user.selectOptions(fitField, "fit");
    await user.click(
      within(inspector).getByRole("button", { name: /align center/i }),
    );
    expect(screen.getByTestId("builder-image-align")).toHaveStyle({
      textAlign: "center",
    });

    await user.clear(within(inspector).getByLabelText(/^link$/i));
    await user.type(
      within(inspector).getByLabelText(/^link$/i),
      "https://example.com/go",
    );
    expect(screen.getByRole("link", { name: "Image" })).toHaveAttribute(
      "href",
      "https://example.com/go",
    );

    const radius = within(inspector).getByLabelText(/corner radius/i);
    fireEvent.change(radius, { target: { value: "16" } });
    expect(screen.getByAltText("Image")).toHaveStyle({ borderRadius: "16px" });
  });

  it("shows width and height controls for text and image blocks", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendBlock(doc, "text");
    doc = {
      ...doc,
      blocks: doc.blocks.map((block) =>
        block.type === "text" ? { ...block, html: "<p>Sized text</p>" } : block,
      ),
    };

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Sized text"));
    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    expect(within(inspector).getByLabelText(/^width$/i)).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^height$/i)).toBeInTheDocument();

    await user.clear(within(inspector).getByLabelText(/^height$/i));
    await user.type(within(inspector).getByLabelText(/^height$/i), "140");
    expect(screen.getByTestId("builder-block-frame")).toHaveStyle({
      minHeight: "140px",
    });
  });

  it("resizes block height with the drag handle and shows px", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendBlock(doc, "spacer");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByText(/spacer \(24px\)/i));
    const handle = screen.getByRole("slider", { name: /resize height/i });
    expect(handle).toBeInTheDocument();

    fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 160, pointerId: 1 });
    expect(screen.getByTestId("builder-resize-badge")).toHaveTextContent(
      "84px",
    );
    fireEvent.pointerUp(handle, { clientY: 160, pointerId: 1 });

    expect(screen.getByText(/spacer \(84px\)/i)).toBeInTheDocument();
  });

  it("hides column tip text and spaces columns horizontally on the canvas", async () => {
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-2");
    const columnsId = doc.blocks[0]!.id;
    doc = insertVariantIntoColumn(doc, columnsId, 0, "image-single");
    doc = insertVariantIntoColumn(doc, columnsId, 0, "button-center");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(/click an item to customize/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/click an item to select and customize/i),
    ).not.toBeInTheDocument();

    const column = screen.getByTestId("builder-column-drop-0");
    expect(column.parentElement).toHaveStyle({ columnGap: "24px" });
  });
  it("clears number fields to 0 and overwrites 0 when typing", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-2");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("builder-column-drop-0"));
    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    const gapField = within(inspector).getByLabelText(/^gap$/i);
    expect(gapField).toHaveValue("24");

    await user.clear(gapField);
    expect(gapField).toHaveValue("0");

    await user.type(gapField, "4");
    expect(gapField).toHaveValue("4");
  });

  it("edits the gap between columns from the inspector", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-2");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("builder-column-drop-0"));
    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    const gapField = within(inspector).getByLabelText(/^gap$/i);
    expect(gapField).toHaveValue("24");

    await user.clear(gapField);
    await user.type(gapField, "48");
    expect(gapField).toHaveValue("48");
    expect(
      screen.getByTestId("builder-column-drop-0").parentElement,
    ).toHaveStyle({
      columnGap: "48px",
    });
  });

  it("edits uneven column widths from the inspector", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-3");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("builder-column-drop-0"));
    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });

    expect(
      within(inspector).queryByLabelText(/column 1 width/i),
    ).not.toBeInTheDocument();

    await user.selectOptions(
      within(inspector).getByLabelText(/^column widths$/i),
      "custom",
    );

    const customWidths = within(inspector).getByTestId("column-widths-custom");
    expect(customWidths).toHaveClass("space-y-0");

    const width1 = within(inspector).getByLabelText(/column 1 width/i);
    const width2 = within(inspector).getByLabelText(/column 2 width/i);
    const width3 = within(inspector).getByLabelText(/column 3 width/i);
    expect(width1).toHaveValue("33");
    expect(width2).toHaveValue("33");
    expect(width3).toHaveValue("34");

    fireEvent.change(width1, { target: { value: "50" } });
    fireEvent.change(width2, { target: { value: "25" } });
    fireEvent.change(width3, { target: { value: "25" } });

    expect(width1).toHaveValue("50");
    expect(width2).toHaveValue("25");
    expect(width3).toHaveValue("25");
    expect(
      screen.getByTestId("builder-columns-grid").getAttribute("style"),
    ).toContain("50fr 25fr 25fr");

    await user.selectOptions(
      within(inspector).getByLabelText(/^column widths$/i),
      "auto",
    );
    expect(
      within(inspector).queryByLabelText(/column 1 width/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("builder-columns-grid").getAttribute("style"),
    ).toContain("33fr 33fr 34fr");
  });

  it("edits default and uneven column item spacing from the inspector", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-2");
    const columnsId = doc.blocks[0]!.id;
    doc = {
      ...doc,
      blocks: doc.blocks.map((block) =>
        block.type === "columns" ? { ...block, itemGap: 12 } : block,
      ),
    };
    doc = insertVariantIntoColumn(doc, columnsId, 0, "image-single");
    doc = insertVariantIntoColumn(doc, columnsId, 0, "button-center");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("builder-column-drop-0"));
    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    const itemSpacing = within(inspector).getByLabelText(/item spacing/i);
    expect(itemSpacing).toBeInTheDocument();
    expect(screen.getByTestId("builder-column-item-0-1")).toHaveStyle({
      paddingTop: "12px",
    });

    await user.clear(itemSpacing);
    await user.type(itemSpacing, "28");
    expect(itemSpacing).toHaveValue("28");
    expect(screen.getByTestId("builder-column-item-0-1")).toHaveStyle({
      paddingTop: "28px",
    });

    const gapBeforeSecond =
      within(inspector).getByLabelText(/gap before item 2/i);
    await user.clear(gapBeforeSecond);
    await user.type(gapBeforeSecond, "32");
    expect(gapBeforeSecond).toHaveValue("32");
    expect(screen.getByTestId("builder-column-item-0-1")).toHaveStyle({
      paddingTop: "32px",
    });
  });

  it("selects a column item and edits it in the inspector", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-2");
    const columnsId = doc.blocks[0]!.id;
    doc = insertVariantIntoColumn(doc, columnsId, 0, "image-single");
    doc = insertVariantIntoColumn(doc, columnsId, 0, "button-center");

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("builder-column-item-0-0"));
    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    expect(
      within(inspector).getByText(/editing item inside columns/i),
    ).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^url$/i)).toBeInTheDocument();

    await user.type(
      within(inspector).getByLabelText(/^url$/i),
      "https://cdn.example/box.png",
    );
    expect(screen.getByTestId("builder-column-item-0-0").innerHTML).toContain(
      "https://cdn.example/box.png",
    );

    await user.click(screen.getByTestId("builder-column-item-0-1"));
    expect(
      within(inspector).getByText(/editing item inside columns/i),
    ).toBeInTheDocument();
    expect(within(inspector).getByLabelText(/^label$/i)).toBeInTheDocument();
    await user.clear(within(inspector).getByLabelText(/^label$/i));
    await user.type(within(inspector).getByLabelText(/^label$/i), "Book now");
    expect(screen.getByTestId("builder-column-item-0-1").textContent).toContain(
      "Book now",
    );
  });

  it("duplicates and deletes the selected block", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendBlock(doc, "text");
    doc = {
      ...doc,
      blocks: doc.blocks.map((block) =>
        block.type === "text"
          ? { ...block, html: "<p>Unique copy</p>" }
          : block,
      ),
    };

    render(
      <EmailTemplateBuilder
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Unique copy"));
    await user.click(screen.getByRole("button", { name: /duplicate block/i }));
    expect(screen.getAllByText("Unique copy")).toHaveLength(2);

    const deletes = screen.getAllByRole("button", { name: /delete block/i });
    await user.click(deletes[0]!);
    expect(screen.getAllByText("Unique copy")).toHaveLength(1);
  });

  it("saves bodyHtml with document markers", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    let doc = emptyDocument();
    doc = appendBlock(doc, "text");

    render(
      <EmailTemplateBuilder
        initialName="Welcome"
        initialSubject="Hello"
        initialDocument={doc}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      name: "Welcome",
      subject: "Hello",
    });
    expect(payload.bodyHtml).toContain('data-tb-doc="1"');
    expect(payload.bodyHtml).toContain('data-tb-block="text"');
  });

  it("fills merge fields with sample values in preview", async () => {
    const user = userEvent.setup();
    const starter = getStarterById("followup-check-in");
    if (!starter) throw new Error("missing starter");

    render(
      <EmailTemplateBuilder
        initialName={starter.name}
        initialSubject="Quote from {{business.name}}"
        initialDocument={documentFromStarter(starter)}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^preview$/i }));

    const iframe = screen.getByTitle("Template preview") as HTMLIFrameElement;
    const business = PREVIEW_SAMPLE_CONTEXT.business?.name ?? "";
    expect(iframe.srcdoc).toContain(business);
    expect(iframe.srcdoc).not.toContain("{{business.name}}");
    expect(iframe.srcdoc).not.toContain("{{lead.first_name}}");
    expect(iframe.srcdoc).not.toContain("{{sender.email}}");
    expect(screen.getByLabelText(/^subject$/i)).toHaveValue(
      `Quote from ${business}`,
    );
  });

  it("toggles preview mode", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendBlock(doc, "button");

    render(
      <EmailTemplateBuilder
        initialName="CTA"
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^preview$/i }));
    expect(screen.getByTitle("Template preview")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^text$/i }),
    ).not.toBeInTheDocument();
  });

  it("shows raw HTML side by side with the page in code view", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendBlock(doc, "button");

    render(
      <EmailTemplateBuilder
        initialName="CTA"
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^code$/i }));

    expect(screen.getByTestId("builder-code-split")).toBeInTheDocument();
    expect(screen.getByTitle("Template preview")).toBeInTheDocument();
    const editor = screen.getByRole("textbox", { name: /raw html/i });
    expect(editor).toBeInTheDocument();
    expect((editor as HTMLTextAreaElement).value).toContain(
      'data-tb-block="button"',
    );
    expect(
      screen.queryByRole("complementary", { name: /builder sidebar/i }),
    ).not.toBeInTheDocument();

    fireEvent.change(editor, {
      target: {
        value:
          '<div data-tb-doc="1"><div data-tb-block="text" data-tb-id="code-1"><p>From code</p></div></div>',
      },
    });
    await user.click(screen.getByRole("button", { name: /^apply$/i }));
    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    expect(screen.getByText(/from code/i)).toBeInTheDocument();
  });

  it("switches to hierarchy and selects nested column and imageText children", async () => {
    const user = userEvent.setup();
    let doc = emptyDocument();
    doc = appendVariant(doc, "columns-2");
    const columnsId = doc.blocks[0]!.id;
    doc = insertVariantIntoColumn(doc, columnsId, 0, "image-single");
    doc = appendVariant(doc, "imageText-left");
    doc = appendBlock(doc, "button");
    const imageTextId = doc.blocks.find((b) => b.type === "imageText")!.id;

    render(
      <EmailTemplateBuilder
        initialName="Hierarchy"
        initialDocument={doc}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId("builder-sidebar-tab-hierarchy"));
    expect(screen.getByLabelText(/^hierarchy$/i)).toBeInTheDocument();

    const buttonId = doc.blocks.find((b) => b.type === "button")!.id;
    expect(
      screen.getByTestId(`hierarchy-node-${buttonId}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(`hierarchy-node-${buttonId}:text`),
    ).not.toBeInTheDocument();

    // Expand Columns → Column 1
    await user.click(screen.getByRole("button", { name: /expand columns/i }));
    await user.click(screen.getByRole("button", { name: /expand column 1/i }));

    await user.click(screen.getByTestId(`hierarchy-node-${columnsId}:col-0`));
    const inspector = screen.getByRole("complementary", {
      name: /component properties/i,
    });
    expect(inspector.querySelector(".font-semibold")?.textContent).toMatch(
      /column 1/i,
    );

    await user.click(
      screen.getByTestId(`hierarchy-node-${columnsId}:col-0:item-0`),
    );
    expect(inspector.querySelector(".font-semibold")?.textContent).toMatch(
      /^image$/i,
    );

    await user.click(
      screen.getByRole("button", { name: /expand image \+ text/i }),
    );
    await user.click(screen.getByTestId(`hierarchy-node-${imageTextId}:image`));
    expect(inspector.querySelector(".font-semibold")?.textContent).toMatch(
      /^image$/i,
    );
    expect(
      within(inspector).getByText(/editing child inside image \+ text/i),
    ).toBeInTheDocument();
  });

  it("compose mode hides name/subject and inserts without a name", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    let doc = emptyDocument();
    doc = appendBlock(doc, "text");

    render(
      <EmailTemplateBuilder
        mode="compose"
        initialDocument={doc}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.queryByPlaceholderText(/template name/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/email subject/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^save$/i }),
    ).not.toBeInTheDocument();

    const insert = screen.getByRole("button", { name: /^insert$/i });
    expect(insert).toBeEnabled();
    await user.click(insert);

    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0]?.[0];
    expect(payload.bodyHtml).toContain('data-tb-doc="1"');
    expect(payload.bodyText.length).toBeGreaterThan(0);
  });
});
