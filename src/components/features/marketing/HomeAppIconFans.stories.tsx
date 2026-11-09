import type { Meta, StoryObj } from "@storybook/react";
import { HomeAppIconFans } from "./HomeAppIconFans";

const meta = {
  title: "Features/Marketing/HomeAppIconFans",
  component: HomeAppIconFans,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomeAppIconFans>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
