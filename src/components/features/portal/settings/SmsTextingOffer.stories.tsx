import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { SmsTextingOffer } from "./SmsTextingOffer";

const meta = {
  title: "Features/Portal/Settings/SmsTextingOffer",
  component: SmsTextingOffer,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-background max-w-5xl p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    availableOnPlan: true,
    canManage: true,
    onStart: fn(),
  },
} satisfies Meta<typeof SmsTextingOffer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unlocked: Story = {};

export const Locked: Story = {
  args: { availableOnPlan: false },
};

export const ReadOnlyMember: Story = {
  args: { canManage: false },
};
