import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import type {
  EmailSignature,
  EmailSnippet,
  EmailTemplate,
  FromIdentityOption,
  LeadMessage,
} from "@/lib/api";
import { LeadEmailThread } from "./LeadEmailThread";

const templates: EmailTemplate[] = [
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
];

const signatures: EmailSignature[] = [
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
];

const snippets: EmailSnippet[] = [
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
];

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

const nextDayReply: LeadMessage = {
  clientId: "c1",
  submissionId: "s1",
  messageId: "m2",
  direction: "inbound",
  from: "ada@example.com",
  to: "sales@example.com",
  subject: "Re: Need a quote",
  bodyText: "That works — when can you come by?",
  createdAt: "2026-07-16T16:30:00.000Z",
};

const followUpReply: LeadMessage = {
  clientId: "c1",
  submissionId: "s1",
  messageId: "m3",
  direction: "outbound",
  from: "sales@example.com",
  to: "ada@example.com",
  subject: "Scheduling pickup",
  bodyText: "We can do Thursday morning.",
  createdAt: "2026-07-16T18:00:00.000Z",
  sentBy: "owner@example.com",
};

const inboundText: LeadMessage = {
  clientId: "c1",
  submissionId: "s1",
  messageId: "m4",
  direction: "inbound",
  channel: "sms",
  from: "+14255550182",
  to: "+18005550100",
  subject: "",
  bodyText: "Can you do Thursday instead?",
  createdAt: "2026-07-17T14:10:00.000Z",
};

const outboundText: LeadMessage = {
  clientId: "c1",
  submissionId: "s1",
  messageId: "m5",
  direction: "outbound",
  channel: "sms",
  from: "+18005550100",
  to: "+14255550182",
  subject: "",
  bodyText: "Perfect, see you then.",
  createdAt: "2026-07-17T14:12:00.000Z",
  sentBy: "owner@example.com",
};

const fromOptions: FromIdentityOption[] = [
  {
    id: "s1",
    label: "Sales Team (Default)",
    displayName: "Sales Team",
  },
  { id: "s2", label: "Support", displayName: "Support" },
];

const meta = {
  title: "Features/Portal/Leads/LeadEmailThread",
  component: LeadEmailThread,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    formMessage: "Need a quote for a new site",
    formFrom: "ada@example.com",
    formAt: "2026-07-15T12:00:00.000Z",
    featuredBody: "Need a quote for a new site",
    messages: [],
    mailboxConnected: false,
    fromOptions,
    onSend: fn().mockResolvedValue(undefined),
  },
} satisfies Meta<typeof LeadEmailThread>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Disconnected: Story = {};

export const ConnectedEmpty: Story = {
  args: {
    mailboxConnected: true,
    fromAddress: "sales@example.com",
  },
};

export const WithContentLibrary: Story = {
  args: {
    mailboxConnected: true,
    fromAddress: "sales@example.com",
    library: { templates, signatures, snippets },
    variableContext: {
      lead: { name: "Ada Lovelace", email: "ada@example.com" },
      business: { name: "Trashbox LLC" },
      sender: { name: "Sales Team", email: "sales@example.com" },
    },
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

const proposalReply: LeadMessage = {
  clientId: "c1",
  submissionId: "s1",
  messageId: "m-proposal",
  direction: "outbound",
  from: "sales@example.com",
  to: "ada@example.com",
  subject: "Proposal",
  bodyText: "Your website proposal",
  bodyHtml: proposalHtml,
  createdAt: "2026-07-15T18:00:00.000Z",
  sentBy: "owner@example.com",
};

export const WithOutboundReply: Story = {
  args: {
    mailboxConnected: true,
    fromAddress: "sales@example.com",
    messages: [outboundReply],
    library: { templates, signatures, snippets },
    variableContext: {
      lead: { name: "Ada Lovelace", email: "ada@example.com" },
      business: { name: "Trashbox LLC" },
    },
  },
};

export const Transcript: Story = {
  args: {
    mailboxConnected: true,
    fromAddress: "sales@example.com",
    showHistory: false,
    showTranscript: true,
    messages: [outboundReply, proposalReply],
    library: { templates, signatures, snippets },
    variableContext: {
      lead: { name: "Ada Lovelace", email: "ada@example.com" },
      business: { name: "Trashbox LLC" },
    },
  },
};

export const HtmlEmail: Story = {
  args: {
    mailboxConnected: true,
    fromAddress: "sales@example.com",
    showHistory: true,
    messages: [proposalReply],
    library: { templates, signatures, snippets },
    variableContext: {
      lead: { name: "Ada Lovelace", email: "ada@example.com" },
      business: { name: "Trashbox LLC" },
    },
  },
};

export const MultiDayThread: Story = {
  args: {
    mailboxConnected: true,
    fromAddress: "sales@example.com",
    messages: [outboundReply, nextDayReply, followUpReply],
    library: { templates, signatures, snippets },
    variableContext: {
      lead: { name: "Ada Lovelace", email: "ada@example.com" },
      business: { name: "Trashbox LLC" },
    },
  },
};

export const NoAssignedNames: Story = {
  args: {
    mailboxConnected: true,
    fromAddress: "sales@example.com",
    fromOptions: [],
  },
};

export const EmailAndText: Story = {
  args: {
    mailboxConnected: true,
    fromAddress: "sales@example.com",
    availableChannels: ["email", "sms"],
    leadPhone: "+14255550182",
    smsFromPhone: "+18005550100",
    library: { templates, signatures, snippets },
    onSendSms: fn().mockResolvedValue(undefined),
  },
};

export const TextOnly: Story = {
  args: {
    mailboxConnected: false,
    availableChannels: ["sms"],
    leadPhone: "+14255550182",
    smsFromPhone: "+18005550100",
    onSendSms: fn().mockResolvedValue(undefined),
  },
};

export const TextThread: Story = {
  args: {
    mailboxConnected: true,
    fromAddress: "sales@example.com",
    availableChannels: ["email", "sms"],
    leadPhone: "+14255550182",
    smsFromPhone: "+18005550100",
    messages: [inboundText, outboundText],
    featuredBody: "Perfect, see you then.",
    library: { templates, signatures, snippets },
    onSendSms: fn().mockResolvedValue(undefined),
  },
};
