import type { Meta, StoryObj } from "@storybook/react";
import { BuilderPreview } from "./BuilderPreview";
import {
  appendBlock,
  emptyDocument,
} from "@/lib/email-template-document";

let seeded = emptyDocument();
seeded = appendBlock(seeded, "text");
seeded = appendBlock(seeded, "button");
seeded = {
  ...seeded,
  blocks: seeded.blocks.map((block) => {
    if (block.type === "text") {
      return {
        ...block,
        html: "<p>Hi {{lead.first_name}}, preview sample from {{business.name}}.</p>",
      };
    }
    if (block.type === "button") {
      return { ...block, label: "Get started", href: "https://example.com" };
    }
    return block;
  }),
};

const meta = {
  title: "Features/Portal/Settings/BuilderPreview",
  component: BuilderPreview,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    document: seeded,
  },
  decorators: [
    (Story) => (
      <div className="flex h-[640px] w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BuilderPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
