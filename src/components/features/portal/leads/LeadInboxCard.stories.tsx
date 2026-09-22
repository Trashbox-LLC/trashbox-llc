import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import type { TeamMember } from "@/lib/api";
import { LeadInboxCard } from "./LeadInboxCard";

const members: TeamMember[] = [
  {
    email: "owner@example.com",
    role: "owner",
    joinedAt: "2026-01-01T00:00:00.000Z",
    firstName: "Olivia",
    lastName: "Owner",
    emailNotifications: true,
  },
  {
    email: "sales@example.com",
    role: "member",
    joinedAt: "2026-01-02T00:00:00.000Z",
    name: "Sam Sales",
    emailNotifications: true,
  },
];

const meta = {
  title: "Features/Portal/Leads/LeadInboxCard",
  component: LeadInboxCard,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-background max-w-md p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    senderName: "Ada Lovelace",
    senderEmail: "ada@example.com",
    message: "Need a quote for a new site",
    submittedAt: "2026-07-15T12:00:00.000Z",
    status: "new",
    active: false,
    replyCount: 0,
    members,
    onSelect: fn(),
  },
} satisfies Meta<typeof LeadInboxCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
  },
};

export const OneReply: Story = {
  args: {
    replyCount: 1,
  },
};

export const ManyReplies: Story = {
  args: {
    replyCount: 5,
    status: "qualified",
  },
};

export const StackedOneReply: Story = {
  args: {
    stacked: true,
    replyCount: 1,
  },
};

export const StackedManyReplies: Story = {
  args: {
    stacked: true,
    replyCount: 5,
    status: "qualified",
  },
};

export const Won: Story = {
  args: {
    status: "won",
  },
};

export const Activity: Story = {
  args: {
    variant: "activity",
  },
};

export const ActivityActive: Story = {
  args: {
    variant: "activity",
    active: true,
  },
};
