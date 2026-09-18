import type { Meta, StoryObj } from "@storybook/react";
import { ContactAvatar } from "./ContactAvatar";

const meta = {
  title: "Features/Portal/Contacts/ContactAvatar",
  component: ContactAvatar,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: { displayName: "Ada Lovelace" },
} satisfies Meta<typeof ContactAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = { args: { size: "lg" } };

/** Centered header size on contact detail and the create/edit form. */
export const ExtraLarge: Story = { args: { size: "xl" } };

export const SingleWord: Story = { args: { displayName: "Analytical Engines" } };

export const PhoneOnly: Story = { args: { displayName: "+15551234567" } };
