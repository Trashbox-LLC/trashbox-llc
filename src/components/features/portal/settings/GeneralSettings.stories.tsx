import type { Meta, StoryObj } from "@storybook/react";
import { GeneralSettings } from "./GeneralSettings";

const meta = {
  title: "Features/Portal/Settings/GeneralSettings",
  component: GeneralSettings,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-2xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    email: "ezekielbleh@gmail.com",
    clientName: "Trashbox Studios",
    tier: "free",
    active: true,
    submissionsUsed: 3,
    submissionLimit: 10,
  },
} satisfies Meta<typeof GeneralSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InactivePlan: Story = {
  args: {
    active: false,
    tier: "team",
    submissionsUsed: 120,
    submissionLimit: 5000,
  },
};

export const WithoutPlan: Story = {
  args: {
    tier: null,
    submissionsUsed: null,
    submissionLimit: null,
  },
};
