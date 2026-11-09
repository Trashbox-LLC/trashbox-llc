import type { Meta, StoryObj } from "@storybook/react";
import { HomeStats } from "./HomeStats";

const meta = {
  title: "Features/Marketing/HomeStats",
  component: HomeStats,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomeStats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
