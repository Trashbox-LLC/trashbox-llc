import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import type {
  EmailSignature,
  EmailSnippet,
  EmailTemplate,
} from "@/lib/api";
import { LeadEmailThreadSection } from "./LeadEmailThreadSection";

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

const meta = {
  title: "Features/Portal/Leads/LeadEmailThreadSection",
  component: LeadEmailThreadSection,
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
    mailboxConnected: true,
    fromAddress: "sales@example.com",
    fromOptions: [
      {
        id: "s1",
        label: "Sales Team (Default)",
        displayName: "Sales Team",
      },
    ],
    variableContext: {
      lead: { name: "Ada Lovelace", email: "ada@example.com" },
      business: { name: "Trashbox Studios" },
    },
    initialLibrary: { templates, signatures, snippets },
    onSend: fn().mockResolvedValue(undefined),
  },
} satisfies Meta<typeof LeadEmailThreadSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLibrary: Story = {};

export const EmptyLibrary: Story = {
  args: {
    initialLibrary: { templates: [], signatures: [], snippets: [] },
  },
};
