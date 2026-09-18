import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn } from "storybook/test";
import type { MessageChannel } from "@/lib/api";
import { ContactComposer } from "./ContactComposer";

const meta = {
  title: "Features/Portal/Contacts/ContactComposer",
  component: ContactComposer,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-2xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    channel: "email",
    channels: ["email", "sms"],
    toEmail: "ada@example.com",
    toPhone: "+15551234567",
    fromPhone: "+18005550100",
    onChannelChange: fn(),
    onSend: fn(async () => {}),
    onCancel: fn(),
  },
} satisfies Meta<typeof ContactComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render(args) {
    const [channel, setChannel] = useState<MessageChannel>(args.channel);
    return (
      <ContactComposer
        {...args}
        channel={channel}
        onChannelChange={(next) => {
          setChannel(next);
          args.onChannelChange(next);
        }}
      />
    );
  },
};

export const Texting: Story = { ...Default, args: { channel: "sms" } };

export const EmailOnly: Story = {
  ...Default,
  args: { channels: ["email"], toPhone: undefined },
};

export const TextOnly: Story = {
  ...Default,
  args: { channel: "sms", channels: ["sms"], toEmail: undefined },
};

export const Sending: Story = { ...Default, args: { busy: true } };
