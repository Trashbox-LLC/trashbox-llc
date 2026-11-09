import type { Meta, StoryObj } from "@storybook/react";
import { PublishedHomeHero } from "./PublishedHomeHero";

const meta = {
  title: "Features/Marketing/PublishedHomeHero",
  component: PublishedHomeHero,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PublishedHomeHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
