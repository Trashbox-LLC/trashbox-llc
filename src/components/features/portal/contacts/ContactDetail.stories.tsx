import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import type { Contact, ContactLeadRef, TeamMember } from "@/lib/api";
import { ContactDetail } from "./ContactDetail";

const members: TeamMember[] = [
  {
    email: "owner@example.com",
    role: "owner",
    joinedAt: "2026-01-01",
    emailNotifications: true,
    firstName: "Olivia",
    lastName: "Owner",
  },
  {
    email: "sales@example.com",
    role: "member",
    joinedAt: "2026-01-01",
    emailNotifications: false,
    firstName: "Sam",
    lastName: "Sales",
  },
];

const contact: Contact = {
  clientId: "c1",
  contactId: "1",
  displayName: "Ada Lovelace",
  firstName: "Ada",
  lastName: "Lovelace",
  company: "Analytical Engines",
  jobTitle: "Founder",
  address: "1 Mill Lane, London",
  website: "https://analytical.example",
  emails: ["ada@example.com", "ada.lovelace@work.example"],
  phones: ["+15551234567"],
  tags: ["vip", "referral"],
  ownerEmail: "sales@example.com",
  source: "form",
  notes: [
    {
      id: "n1",
      body: "Wants a quote for the whole cul-de-sac, not just her house.",
      authorEmail: "sales@example.com",
      createdAt: "2026-01-05T16:20:00.000Z",
    },
  ],
  createdBy: "owner@example.com",
  createdAt: "2026-01-04T14:00:00.000Z",
  updatedAt: "2026-01-05T16:20:00.000Z",
  searchText: "",
  leadCount: 2,
  lastActivityAt: "2026-01-06T09:00:00.000Z",
};

const leads: ContactLeadRef[] = [
  {
    submissionId: "s1",
    senderName: "Ada Lovelace",
    status: "quoted",
    submittedAt: "2026-01-04T14:00:00.000Z",
    updatedAt: "2026-01-05T10:00:00.000Z",
  },
  {
    submissionId: "s2",
    senderName: "Ada Lovelace",
    status: "new",
    submittedAt: "2026-01-06T09:00:00.000Z",
    updatedAt: "2026-01-06T09:00:00.000Z",
  },
];

const meta = {
  title: "Features/Portal/Contacts/ContactDetail",
  component: ContactDetail,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-4xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    contact,
    leads,
    members,
    availableChannels: ["email", "sms"],
    smsFromPhone: "+18005550100",
    onEdit: fn(),
    onBack: fn(),
    onOwnerChange: fn(),
    onAddNote: fn(async () => {}),
    onSendMessage: fn(async () => {}),
    onConfigureSms: fn(),
    onConfigureEmail: fn(),
    onDelete: fn(),
    onOpenLead: fn(),
  },
} satisfies Meta<typeof ContactDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Deletable: Story = { args: { canDelete: true } };

export const EmailOnly: Story = { args: { availableChannels: ["email"] } };

/** Actions still show; they route to settings instead of a composer. */
export const NoSendingConfigured: Story = { args: { availableChannels: [] } };

export const OptedOutOfTexts: Story = {
  args: { availableChannels: ["email"], smsOptedOut: true },
};

export const CreatedByHand: Story = {
  args: {
    contact: {
      ...contact,
      source: "manual",
      phones: [],
      tags: [],
      notes: [],
      leadCount: 0,
      ownerEmail: null,
    },
    leads: [],
  },
};

export const Saving: Story = { args: { busy: true } };

export const SaveFailed: Story = {
  args: { error: "Failed to change the owner" },
};
