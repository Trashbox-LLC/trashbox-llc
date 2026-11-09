import type { Meta, StoryObj } from "@storybook/react";
import { PublishedHomePage } from "./PublishedHomePage";

const meta = {
  title: "Features/Marketing/PublishedHomePage",
  component: PublishedHomePage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PublishedHomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
