import type { Meta, StoryObj } from "@storybook/react";
import { HomeCoverHero } from "./HomeCoverHero";

const meta = {
  title: "Features/Marketing/HomeCoverHero",
  component: HomeCoverHero,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomeCoverHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
