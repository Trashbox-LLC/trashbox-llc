import type { Meta, StoryObj } from "@storybook/react";
import { StubPortalProvider } from "@/lib/portal";
import { TagsSettings } from "./TagsSettings";

const meta = {
  title: "Features/Portal/Settings/TagsSettings",
  component: TagsSettings,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <StubPortalProvider>
        <div className="max-w-xl bg-background p-8">
          <Story />
        </div>
      </StubPortalProvider>
    ),
  ],
} satisfies Meta<typeof TagsSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    initialState: { tags: [] },
  },
};

export const WithTags: Story = {
  args: {
    initialState: {
      tags: ["follow up", "sales", "vip", "website_quote"],
    },
  },
};
