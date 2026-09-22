import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { EmailTemplateGallery } from "./EmailTemplateGallery";

const meta = {
  title: "Features/Portal/Settings/EmailTemplateGallery",
  component: EmailTemplateGallery,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-background mx-auto max-w-5xl p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    onSelectStarter: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof EmailTemplateGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

const savedTemplates = [
  {
    id: "t1",
    name: "Quote follow-up",
    subject: "Your quote from {{business.name}}",
    bodyHtml:
      "<p>Hi {{lead.first_name}},</p><p>Your quote from {{business.name}} is ready to review.</p>",
  },
  {
    id: "t2",
    name: "No answer follow-up",
    subject: "Trying to reach you",
    bodyHtml:
      "<p>Hi {{lead.first_name}},</p><p>We tried reaching you today. Reply whenever you have a moment.</p>",
  },
];

export const CreateMode: Story = {
  args: {
    mode: "create",
    onInsertHtmlPlainText: fn(),
    onSelectSaved: fn(),
    onDuplicateSaved: fn(),
    onDeleteSaved: fn(),
    savedTemplates,
  },
};

export const ComposeWithSaved: Story = {
  args: {
    mode: "compose",
    onSelectSaved: fn(),
    savedTemplates,
  },
};

export const ComposeEmptyLibrary: Story = {
  args: {
    mode: "compose",
    onSelectSaved: fn(),
    savedTemplates: [],
  },
};
