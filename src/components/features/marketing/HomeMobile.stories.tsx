import type { Meta, StoryObj } from "@storybook/react";
import { HomeMobile } from "./HomeMobile";

const meta = {
  title: "Features/Marketing/HomeMobile",
  component: HomeMobile,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomeMobile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
