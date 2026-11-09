import type { Meta, StoryObj } from "@storybook/react";
import { HomePreview } from "./HomePreview";

const meta = {
  title: "Features/Marketing/HomePreview",
  component: HomePreview,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
