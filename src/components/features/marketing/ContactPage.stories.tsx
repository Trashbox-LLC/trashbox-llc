import type { Meta, StoryObj } from "@storybook/react";
import { ContactPage } from "./ContactPage";

const meta = {
  title: "Features/Marketing/ContactPage",
  component: ContactPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ContactPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
