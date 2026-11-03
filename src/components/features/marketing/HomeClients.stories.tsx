import type { Meta, StoryObj } from "@storybook/react";
import { HomeClients } from "./HomeClients";

const meta = {
  title: "Features/Marketing/HomeClients",
  component: HomeClients,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomeClients>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
