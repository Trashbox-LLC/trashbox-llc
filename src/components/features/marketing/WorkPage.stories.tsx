import type { Meta, StoryObj } from "@storybook/react";
import { WorkPage } from "./WorkPage";

const meta = {
  title: "Features/Marketing/WorkPage",
  component: WorkPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof WorkPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
