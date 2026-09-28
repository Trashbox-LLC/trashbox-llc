import type { Meta, StoryObj } from "@storybook/react";
import { WorkCarousel } from "./WorkCarousel";

const meta = {
  title: "Features/Marketing/WorkCarousel",
  component: WorkCarousel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof WorkCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
