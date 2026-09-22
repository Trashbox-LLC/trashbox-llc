import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { createSignatureDocument } from "@/lib/email-signature-document";
import { SignatureBuilder } from "./SignatureBuilder";

const meta = {
  title: "Features/Portal/Settings/SignatureBuilder",
  component: SignatureBuilder,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    initialDocument: createSignatureDocument(),
    previewContext: {
      sender: { name: "Ezekiel Mohr", email: "ezekiel@trashbox.email" },
      business: { name: "Trashbox" },
    },
    onSave: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof SignatureBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewSignature: Story = {};

export const Editing: Story = {
  args: {
    initialName: "Sales sign-off",
    initialIsDefault: true,
    initialDocument: {
      layout: "side",
      logoUrl: "",
      fields: [
        { id: "name", label: "Name", value: "{{sender.name}}" },
        { id: "title", label: "Title", value: "Owner" },
        { id: "email", label: "Email", value: "{{sender.email}}" },
        { id: "phone", label: "Phone", value: "(555) 014-2200" },
      ],
    },
  },
};

export const Banner: Story = {
  args: {
    initialName: "Banner",
    initialDocument: {
      layout: "banner",
      logoUrl: "",
      fields: [
        { id: "name", label: "Name", value: "{{sender.name}}" },
        { id: "email", label: "Email", value: "{{sender.email}}" },
      ],
    },
  },
};
