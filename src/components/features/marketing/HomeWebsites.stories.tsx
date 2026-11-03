import type { Meta, StoryObj } from "@storybook/react";
import { HomeWebsites } from "./HomeWebsites";

const meta = {
  title: "Features/Marketing/HomeWebsites",
  component: HomeWebsites,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomeWebsites>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
