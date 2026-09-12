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
