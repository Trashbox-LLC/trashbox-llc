import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn } from "storybook/test";
import type { TeamMember } from "@/lib/api";
import {
  LeadInboxFilters,
  type LeadInboxFiltersValue,
} from "./LeadInboxFilters";

const members: TeamMember[] = [
  {
    email: "owner@example.com",
    role: "owner",
    joinedAt: "2026-01-01",
    firstName: "Ezekiel",
    lastName: "Mohr",
    emailNotifications: true,
  },
  {
    email: "sarah@example.com",
    role: "member",
    joinedAt: "2026-01-01",
    firstName: "Sarah",
    lastName: "Chen",
    emailNotifications: false,
  },
];

const emptyValue: LeadInboxFiltersValue = {
  q: "",
  status: "",
  tag: "",
  assignedTo: "",
  formId: "",
};

const meta = {
  title: "Features/Portal/Leads/LeadInboxFilters",
  component: LeadInboxFilters,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-sm bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    value: emptyValue,
    members,
    forms: [
      {
        formId: "f1",
        clientId: "c1",
        name: "Contact",
        slug: "contact",
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    onChange: fn(),
    onApply: fn(),
  },
} satisfies Meta<typeof LeadInboxFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <LeadInboxFilters
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
};

export const Filled: Story = {
  ...Default,
  args: {
    value: {
      q: "quote",
      status: "new",
      tag: "website_quote",
      assignedTo: "sarah@example.com",
      formId: "f1",
    },
  },
};
