import type { Meta, StoryObj } from "@storybook/react";
import type { Submission } from "@/lib/api";
import { StubPortalProvider } from "@/lib/portal";
import { TagsSettings } from "./TagsSettings";

const previewLead: Submission = {
  clientId: "c1",
  submissionId: "lead-1",
  senderName: "Jordan Hale",
  senderEmail: "jordan@northline.co",
  message: "",
  formName: "Website",
  status: "qualified",
  tags: ["vip", "website_quote"],
  submittedAt: "2026-06-01T00:00:00.000Z",
};

const meta = {
  title: "Features/Portal/Settings/TagsSettings",
  component: TagsSettings,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <StubPortalProvider>
        <div className="max-w-5xl bg-background p-8">
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
  decorators: [
    (Story) => (
      <StubPortalProvider value={{ items: [previewLead] }}>
        <Story />
      </StubPortalProvider>
    ),
  ],
};
