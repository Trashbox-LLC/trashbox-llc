import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { LeadSmsComposer } from "./LeadSmsComposer";

const meta = {
  title: "Features/Portal/Leads/LeadSmsComposer",
  component: LeadSmsComposer,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-background max-w-xl p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    toPhone: "+14255550182",
    fromPhone: "+18005550100",
    onSend: fn().mockResolvedValue(undefined),
  },
} satisfies Meta<typeof LeadSmsComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sending: Story = {
  args: { busy: true },
};

export const InternationalNumber: Story = {
  args: { toPhone: "+442079460958" },
};
