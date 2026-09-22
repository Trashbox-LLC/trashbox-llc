import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import {
  EmailContentSettings,
  type EmailContentEntry,
} from "./EmailContentSettings";

const templates: EmailContentEntry[] = [
  {
    id: "t1",
    name: "Quote follow-up",
    subject: "Your quote from {{business.name}}",
    bodyText:
      "Hi {{lead.first_name}},\n\nThanks for reaching out. Here is the quote you asked about — let me know if you'd like to book a pickup.\n\n{{sender.name}}",
    bodyHtml:
      "<p>Hi {{lead.first_name}},</p><p>Thanks for reaching out. Here is the quote you asked about — let me know if you'd like to book a pickup.</p><p>{{sender.name}}</p>",
    updatedAt: "2026-07-20T10:00:00.000Z",
  },
  {
    id: "t2",
    name: "No answer follow-up",
    subject: "Trying to reach you",
    bodyText:
      "Hi {{lead.first_name}},\n\nWe tried calling today, {{date.today}}. Reply here and we'll pick a time that works.",
    updatedAt: "2026-07-18T16:30:00.000Z",
  },
];

const signatures: EmailContentEntry[] = [
  {
    id: "g1",
    name: "Sales sign-off",
    bodyText: "Thanks,\n{{sender.name}}\n{{business.name}}",
    isDefault: true,
    updatedAt: "2026-07-20T10:00:00.000Z",
  },
  {
    id: "g2",
    name: "Support sign-off",
    bodyText: "— {{business.name}} Support",
    isDefault: false,
    updatedAt: "2026-07-11T09:15:00.000Z",
  },
];

const snippets: EmailContentEntry[] = [
  {
    id: "s1",
    name: "Hours",
    shortcut: "hours",
    bodyText: "We are open 8am to 5pm, Monday through Friday.",
    updatedAt: "2026-07-20T10:00:00.000Z",
  },
  {
    id: "s2",
    name: "Pricing",
    shortcut: "pricing",
    bodyText: "A standard pickup is $45. Extra bags are $8 each.",
    updatedAt: "2026-07-14T12:00:00.000Z",
  },
  {
    id: "s3",
    name: "Directions",
    shortcut: "directions",
    bodyText: "We are at 120 Market St. Ask for {{sender.name}}.",
    updatedAt: "2026-07-11T09:15:00.000Z",
  },
];

const meta = {
  title: "Features/Portal/Settings/EmailContentSettings",
  component: EmailContentSettings,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    kind: "template",
    items: templates,
    canManage: true,
    previewContext: {
      lead: { name: "Dana Brooks", email: "dana@example.com" },
      business: { name: "Acme Hauling" },
      sender: { name: "Sales Team", email: "sales@acmehauling.test" },
    },
    onCreate: fn().mockResolvedValue(undefined),
    onUpdate: fn().mockResolvedValue(undefined),
    onDelete: fn().mockResolvedValue(undefined),
  },
} satisfies Meta<typeof EmailContentSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Templates: Story = {};

export const TemplatesEmpty: Story = {
  args: {
    items: [],
  },
};

export const TemplatesReadOnly: Story = {
  args: {
    canManage: false,
  },
};

export const Signatures: Story = {
  args: {
    kind: "signature",
    items: signatures,
    onMakeDefault: fn().mockResolvedValue(undefined),
  },
};

export const Snippets: Story = {
  args: {
    kind: "snippet",
    items: snippets,
  },
};

export const Saving: Story = {
  args: {
    busy: true,
  },
};

export const WithError: Story = {
  args: {
    error: "Name must be 80 characters or fewer",
  },
};
