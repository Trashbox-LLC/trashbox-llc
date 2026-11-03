import type { Meta, StoryObj } from "@storybook/react";
import { ContactDetails } from "./ContactDetails";

const meta = {
  title: "Features/Contact/ContactDetails",
  component: ContactDetails,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="bg-background max-w-md px-8 py-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContactDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
