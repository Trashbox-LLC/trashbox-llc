import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { SnippetLibrary } from "./SnippetLibrary";

const meta = {
  title: "Features/Portal/Settings/SnippetLibrary",
  component: SnippetLibrary,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    canManage: true,
    previewContext: {
      lead: { name: "Jordan Smith", email: "jordan@example.com" },
      business: { name: "Trashbox" },
    },
    items: [
      {
        id: "s1",
        name: "Hours",
        shortcut: "hours",
        bodyText: "we are open 8am to 5pm, Monday through Friday.",
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
        bodyText: "We are at 120 Market St, behind the courthouse.",
        updatedAt: "2026-07-11T09:15:00.000Z",
      },
    ],
    onCreate: fn().mockResolvedValue(undefined),
    onDelete: fn().mockResolvedValue(undefined),
  },
} satisfies Meta<typeof SnippetLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Library: Story = {};

export const Empty: Story = {
  args: { items: [] },
};
