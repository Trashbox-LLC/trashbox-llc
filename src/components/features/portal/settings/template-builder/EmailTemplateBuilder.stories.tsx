import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { EmailTemplateBuilder } from "./EmailTemplateBuilder";
import { decorateMergeFieldsHtml } from "@/lib/email-content";
import {
  appendBlock,
  documentFromStarter,
  emptyDocument,
} from "@/lib/email-template-document";
import { getStarterById } from "@/lib/email-template-starters";

let seeded = emptyDocument();
seeded = appendBlock(seeded, "text");
seeded = appendBlock(seeded, "button");
seeded = appendBlock(seeded, "columns");
seeded = appendBlock(seeded, "imageText");
seeded = appendBlock(seeded, "grid");
seeded = appendBlock(seeded, "table");
seeded = {
  ...seeded,
  header: {
    html: "<p><strong>Trashbox</strong></p>",
    backgroundColor: "transparent",
    paddingX: 0,
    paddingY: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    align: "left",
  },
  footer: {
    html: '<p style="font-size:12px;color:#71717a;">Thanks for reading</p>',
    backgroundColor: "transparent",
    paddingX: 0,
    paddingY: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    align: "center",
  },
  pageMarginTop: 0,
  pageMarginRight: 0,
  pageMarginBottom: 0,
  pageMarginLeft: 0,
  blocks: seeded.blocks.map((block) => {
    if (block.type === "text") {
      return {
        ...block,
        html: decorateMergeFieldsHtml(
          "<p>Hi {{lead.first_name}}, thanks for reaching out to {{business.name}}.</p>",
        ),
        backgroundColor: "#f0f9ff",
        paddingX: 16,
        paddingY: 12,
        borderWidth: 1,
        borderColor: "#bae6fd",
        borderRadius: 4,
      };
    }
    if (block.type === "button") {
      return { ...block, label: "Reply now", href: "mailto:hello@example.com" };
    }
    if (block.type === "columns") {
      return {
        ...block,
        columns: [
          "<p><strong>Left</strong></p><p>Drop an image here.</p>",
          "<p><strong>Right</strong></p><p>Details go here.</p>",
        ],
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        paddingX: 12,
        paddingY: 12,
        cellPadding: 4,
      };
    }
    if (block.type === "imageText") {
      return {
        ...block,
        imagePosition: "left" as const,
        image: {
          ...block.image,
          alt: "Hero",
        },
        text: {
          html: "<p>Image + text body copy lives here.</p>",
        },
      };
    }
    if (block.type === "grid") {
      return {
        ...block,
        cells: [
          "<p><strong>A1</strong></p>",
          "<p><strong>A2</strong></p>",
          "<p><strong>B1</strong></p>",
          "<p><strong>B2</strong></p>",
        ],
        backgroundColor: "#fff7ed",
        borderWidth: 1,
        borderColor: "#fed7aa",
        borderRadius: 6,
        paddingX: 8,
        paddingY: 8,
        cellVerticalAlign: "middle" as const,
      };
    }
    return block;
  }),
};

const meta = {
  title: "Features/Portal/Settings/EmailTemplateBuilder",
  component: EmailTemplateBuilder,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    onSave: fn().mockResolvedValue(undefined),
    onCancel: fn(),
  },
} satisfies Meta<typeof EmailTemplateBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    initialName: "New template",
  },
};

export const WithBlocks: Story = {
  args: {
    initialName: "Welcome reply",
    initialSubject: "Thanks for contacting us",
    initialDocument: seeded,
  },
};

export const ComposeMode: Story = {
  args: {
    mode: "compose",
    initialDocument: seeded,
  },
};

const followUp = getStarterById("followup-check-in");

export const FollowUpStarter: Story = {
  args: {
    initialName: followUp?.name ?? "Follow-up check-in",
    initialSubject: followUp?.subject ?? "",
    initialDocument: followUp ? documentFromStarter(followUp) : emptyDocument(),
  },
};

export const ColoredPageCanvas: Story = {
  args: {
    initialName: "Card on canvas",
    initialSubject: "Thanks for contacting us",
    initialDocument: {
      ...seeded,
      backgroundColor: "#d8d8dc",
      contentBackgroundColor: "#ffffff",
    },
  },
};
