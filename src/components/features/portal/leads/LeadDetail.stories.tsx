import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import type { LeadMessage, Submission, TeamMember } from "@/lib/api";
import { LeadDetail } from "./LeadDetail";

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

const baseSubmission: Submission = {
  clientId: "c1",
  submissionId: "s1",
  senderName: "Ada Lovelace",
  senderEmail: "ada@example.com",
  message: "Need a quote for a new site",
  submittedAt: "2026-07-15T12:00:00.000Z",
  status: "new",
  tags: [],
  notes: [],
  assignedTo: null,
};

const outboundReply: LeadMessage = {
  clientId: "c1",
  submissionId: "s1",
  messageId: "m1",
  direction: "outbound",
  from: "sales@example.com",
  to: "ada@example.com",
  subject: "Re: Need a quote",
  bodyText: "Thanks for reaching out — happy to help.",
  createdAt: "2026-07-15T13:00:00.000Z",
  sentBy: "owner@example.com",
};

const meta = {
  title: "Features/Portal/Leads/LeadDetail",
  component: LeadDetail,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-6xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    submission: baseSubmission,
    members,
    onUpdate: fn().mockResolvedValue(undefined),
    onAddNote: fn().mockResolvedValue(undefined),
    onDeleteNote: fn().mockResolvedValue(undefined),
  },
} satisfies Meta<typeof LeadDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithNotesAndTags: Story = {
  args: {
    submission: {
      ...baseSubmission,
      status: "contacted",
      tags: ["website_quote", "sales"],
      assignedTo: "sarah@example.com",
      notes: [
        {
          id: "n1",
          body: "Followed up by email.",
          authorEmail: "owner@example.com",
          createdAt: "2026-07-15T14:00:00.000Z",
        },
      ],
    },
    availableTags: ["website_quote", "sales", "follow up", "vip"],
  },
};

const proposalHtml = `<div data-tb-doc="1" style="background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
  <div style="background:#111111;color:#ffffff;padding:16px 20px;font-weight:600;">Trashbox</div>
  <div style="padding:24px 20px;">
    <h1 style="margin:0 0 8px;font-size:22px;">Your website proposal</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">Home, services, and contact. Hoping for October.</p>
    <span style="display:inline-block;background:#111111;color:#ffffff;padding:10px 16px;font-size:14px;">View proposal</span>
  </div>
</div>`;

export const WithEmailThread: Story = {
  args: {
    mailboxConnected: true,
    fromAddress: "sales@example.com",
    businessName: "Trashbox LLC",
    fromOptions: [
      {
        id: "s1",
        label: "Trashbox LLC (Default)",
        displayName: "Trashbox LLC",
      },
      { id: "s2", label: "Support", displayName: "Support" },
    ],
    messages: [outboundReply],
    composerLibrary: {
      templates: [
        {
          clientId: "c1",
          id: "t1",
          name: "Intro reply",
          subject: "Thanks for reaching out",
          bodyText: "Hi {{lead.first_name}}, happy to help.",
          bodyHtml: "<p>Hi {{lead.first_name}}, happy to help.</p>",
          createdBy: "owner@example.com",
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      signatures: [
        {
          clientId: "c1",
          id: "sig1",
          name: "Default",
          bodyText: "Thanks,\n{{sender.name}}",
          bodyHtml: "<p>Thanks,<br />{{sender.name}}</p>",
          isDefault: true,
          createdBy: "owner@example.com",
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      snippets: [
        {
          clientId: "c1",
          id: "sn1",
          name: "Business hours",
          shortcut: "hours",
          bodyText: "We are open 8am–5pm.",
          bodyHtml: "<p>We are open 8am–5pm.</p>",
          createdBy: "owner@example.com",
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    },
    onSendMessage: fn().mockResolvedValue(undefined),
  },
};

export const WithHtmlEmail: Story = {
  args: {
    mailboxConnected: true,
    fromAddress: "sales@example.com",
    businessName: "Trashbox LLC",
    fromOptions: [
      {
        id: "s1",
        label: "Trashbox LLC (Default)",
        displayName: "Trashbox LLC",
      },
    ],
    messages: [
      {
        ...outboundReply,
        messageId: "m-proposal",
        subject: "Proposal",
        bodyText: "Your website proposal",
        bodyHtml: proposalHtml,
        createdAt: "2026-07-15T18:00:00.000Z",
      },
    ],
    composerLibrary: { templates: [], signatures: [], snippets: [] },
    onSendMessage: fn().mockResolvedValue(undefined),
  },
};

export const SeveralPhones: Story = {
  args: {
    submission: {
      ...baseSubmission,
      senderPhone: "+14255550182",
      contactId: "con_1",
    },
    contactPhones: ["+14255550182", "+14255550199"],
    smsFromPhone: "+18005550100",
    onSendSms: fn().mockResolvedValue(undefined),
  },
};

export const Busy: Story = {
  args: {
    busy: true,
  },
};

export const WithMetadata: Story = {
  args: {
    submission: {
      ...baseSubmission,
      message: "Need a quote for a new site",
      metadata: {
        service: "Web application",
        company: "Analytical Engines",
        source: "homepage",
      },
    },
  },
};
