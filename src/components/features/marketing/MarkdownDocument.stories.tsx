import type { Meta, StoryObj } from "@storybook/react";
import { MarkdownDocument } from "./MarkdownDocument";

const sampleMarkdown = `# Privacy Policy

Last updated: January 1, 2026

## Overview

We collect only what we need to run **Trashbox Studios** services.

### What we store

- Account email
- Form submission payloads
- Billing status from Stripe

## Lists

1. First item
2. Second item

- Bullet one
- Bullet two

> Notes in a blockquote stay readable against the dark surface.

\`\`\`ts
const message = "inline code & fences";
\`\`\`

| Field | Purpose |
| --- | --- |
| email | Contact endpoint |
| plan | Billing tier |

---

Visit [trashboxllc.com](https://trashboxllc.com) for more.
`;

const meta = {
  title: "Features/Marketing/MarkdownDocument",
  component: MarkdownDocument,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl bg-background px-8 py-12">
        <Story />
      </div>
    ),
  ],
  args: {
    markdown: sampleMarkdown,
  },
} satisfies Meta<typeof MarkdownDocument>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortSnippet: Story = {
  args: {
    markdown: "## Heading\n\nA short paragraph with `inline code`.",
  },
};
