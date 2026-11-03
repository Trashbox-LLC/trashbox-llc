import type { Meta, StoryObj } from "@storybook/react";
import { HomePage } from "./HomePage";

const meta = {
  title: "Features/Marketing/HomePage",
  component: HomePage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Devices: Story = {
  args: { hero: "devices" },
};
