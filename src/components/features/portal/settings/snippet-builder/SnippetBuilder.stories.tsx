import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { SnippetBuilder } from "./SnippetBuilder";

const meta = {
  title: "Features/Portal/Settings/SnippetBuilder",
  component: SnippetBuilder,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    previewContext: {
      lead: { name: "Jordan Smith", email: "jordan@example.com" },
    },
    onSave: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof SnippetBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewSnippet: Story = {};

export const Editing: Story = {
  args: {
    initialName: "Hours",
    initialShortcut: "hours",
    initialBody:
      "We are open 8am to 5pm, Monday through Friday. Hi {{lead.first_name}}, swing by anytime.",
    initialHtml:
      "<p>We are open <strong>8am to 5pm</strong>, Monday through Friday. Hi {{lead.first_name}}, swing by anytime.</p>",
  },
};
