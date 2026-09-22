import type { Meta, StoryObj } from "@storybook/react";
import { HtmlEmailCard } from "./HtmlEmailCard";

const meta = {
  title: "Shared/HtmlEmailCard",
  component: HtmlEmailCard,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-56 bg-background p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HtmlEmailCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Message: Story = {
  args: {
    title: "Quote follow-up",
    html: "<p>Hi {{lead.first_name}},</p><p>Your quote from {{business.name}} is ready to review.</p>",
  },
};
