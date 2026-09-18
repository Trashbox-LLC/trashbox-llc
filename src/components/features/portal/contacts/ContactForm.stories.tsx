import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { fn } from "storybook/test";
import type { TeamMember } from "@/lib/api";
import { emptyContactForm } from "./contact-display";
import { ContactForm } from "./ContactForm";

const members: TeamMember[] = [
  {
    email: "owner@example.com",
    role: "owner",
    joinedAt: "2026-01-01",
    emailNotifications: true,
    firstName: "Olivia",
    lastName: "Owner",
  },
  {
    email: "sales@example.com",
    role: "member",
    joinedAt: "2026-01-01",
    emailNotifications: false,
    firstName: "Sam",
    lastName: "Sales",
  },
];

const meta = {
  title: "Features/Portal/Contacts/ContactForm",
  component: ContactForm,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    values: emptyContactForm(),
    members,
    submitLabel: "Create contact",
    onChange: fn(),
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ContactForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render(args) {
    const [values, setValues] = useState(args.values);
    return (
      <ContactForm
        {...args}
        values={values}
        onChange={(next) => {
          setValues(next);
          args.onChange(next);
        }}
      />
    );
  },
};

export const Editing: Story = {
  ...Default,
  args: {
    submitLabel: "Save changes",
    values: {
      firstName: "Ada",
      lastName: "Lovelace",
      company: "Analytical Engines",
      jobTitle: "Founder",
      address: "1 Mill Lane, London",
      website: "https://analytical.example",
      emails: "ada@example.com\nada.lovelace@work.example",
      phones: "+15551234567",
      tags: "vip, referral",
      ownerEmail: "sales@example.com",
    },
  },
};

export const Saving: Story = { ...Editing, args: { ...Editing.args, busy: true } };

export const DuplicateIdentity: Story = {
  ...Editing,
  args: {
    ...Editing.args,
    error: "ada@example.com already belongs to another contact",
  },
};
