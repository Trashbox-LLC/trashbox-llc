import type { Meta, StoryObj } from "@storybook/react";
import { HomeReviews } from "./HomeReviews";

const meta = {
  title: "Features/Marketing/HomeReviews",
  component: HomeReviews,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomeReviews>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
